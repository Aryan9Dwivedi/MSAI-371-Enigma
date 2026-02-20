"""
KRAFT Reasoning Engine — explainable task allocation.

Uses a logical inference engine (backward chaining over FOPC-style rules).
Rules are declarative; the engine performs unification and resolution.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import TYPE_CHECKING

from sqlalchemy.orm import Session

if TYPE_CHECKING:
    from app.db.models import Task, TeamMember

from app.schemas.allocation import (
    AllocateRequest,
    AllocateResponse,
    Assignment,
    AssignmentExplanation,
    InferenceStep,
)
from app.services.logic_engine import (
    ConjGoal,
    FactGoal,
    ForallGoal,
    LogicEngine,
    NegGoal,
    Var,
)

# ---------------------------------------------------------------------------
# Rule definitions (FOPC) — declarative, interpreted by the logic engine
# ---------------------------------------------------------------------------

RULE_CAN_PERFORM = "can_perform(M,T) ← ∀S: requires_skill(T,S) ⇒ has_skill(M,S)"
RULE_ELIGIBLE = "eligible(M,T) ← member(M) ∧ can_perform(M,T) ∧ available(M) ∧ ¬overloaded(M)"
RULE_PREFERRED = "preferred(M,T,S) ← eligible(M,T) ∧ S = workload_score(M)"
RULE_BEST = "best_candidate(M,T) ← preferred(M,T,S) ∧ ∀M′: S ≥ S′"


def _domain_required_skills(engine: LogicEngine, subst: dict) -> list:
    """Domain for ∀S: yields all S such that requires_skill(T, S)."""
    T = subst.get("T")
    if T is None:
        return []
    result = []
    for (tid, sid) in engine.facts.get("requires_skill", set()):
        if tid == T:
            result.append(sid)
    return result


def build_engine_from_kb(members: list["TeamMember"], tasks: list["Task"]) -> LogicEngine:
    """Load knowledge base into logic engine and register rules."""
    engine = LogicEngine()

    # Ground facts from DB
    for m in members:
        engine.assert_fact("member", m.id)
        w = len(m.assigned_tasks) if hasattr(m, "assigned_tasks") and m.assigned_tasks else 0
        engine.assert_fact("workload", m.id, w)
        if m.calendar_availability:
            engine.assert_fact("available", m.id)
        if w > 10:
            engine.assert_fact("overloaded", m.id)
        for s in m.skills:
            engine.assert_fact("has_skill", m.id, s.id)

    for t in tasks:
        for s in t.required_skills:
            engine.assert_fact("requires_skill", t.id, s.id)

    # Rule: can_perform(M, T) ← ∀S: requires_skill(T,S) ⇒ has_skill(M,S)
    def domain_fn(e: LogicEngine, s: dict):
        return iter(_domain_required_skills(e, s))

    body_can_perform = ForallGoal(
        Var("S"),
        domain_fn,
        FactGoal("has_skill", (Var("M"), Var("S"))),
    )
    engine.add_rule("can_perform", ["M", "T"], body_can_perform)

    # Rule: eligible(M, T) ← member(M) ∧ can_perform(M,T) ∧ available(M) ∧ ¬overloaded(M)
    body_eligible = ConjGoal(
        (
            FactGoal("member", (Var("M"),)),
            FactGoal("can_perform", (Var("M"), Var("T"))),
            FactGoal("available", (Var("M"),)),
            NegGoal(FactGoal("overloaded", (Var("M"),))),
        )
    )
    engine.add_rule("eligible", ["M", "T"], body_eligible)

    return engine


# ---------------------------------------------------------------------------
# Knowledge base (for names, workload lookup in scoring)
# ---------------------------------------------------------------------------


@dataclass
class KnowledgeBase:
    """Lookup tables for names and workload (used for scoring and trace)."""

    member_name: dict[int, str] = field(default_factory=dict)
    task_name: dict[int, str] = field(default_factory=dict)
    skill_name: dict[int, str] = field(default_factory=dict)
    workload: dict[int, int] = field(default_factory=dict)


def build_knowledge_base(
    members: list["TeamMember"],
    tasks: list["Task"],
) -> KnowledgeBase:
    """Build lookup tables for reasoning trace and scoring."""
    kb = KnowledgeBase()
    for m in members:
        kb.member_name[m.id] = m.name
        kb.workload[m.id] = len(m.assigned_tasks) if hasattr(m, "assigned_tasks") and m.assigned_tasks else 0
    for t in tasks:
        kb.task_name[t.id] = t.task_name
        for s in t.required_skills:
            kb.skill_name[s.id] = s.skill_name
    return kb


# ---------------------------------------------------------------------------
# Scoring (preferred / best_candidate) — meta-level over logical eligible
# ---------------------------------------------------------------------------


def workload_score(member_id: int, kb: KnowledgeBase, max_workload: int) -> float:
    """Higher score = lower workload (fairness)."""
    w = kb.workload.get(member_id, 0)
    if max_workload == 0:
        return 1.0
    return 1.0 - (w / (max_workload + 1))


# ---------------------------------------------------------------------------
# Inference trace
# ---------------------------------------------------------------------------


@dataclass
class TraceRecorder:
    steps: list[InferenceStep] = field(default_factory=list)
    _step_num: int = 0

    def fact(self, pred: str) -> int:
        self._step_num += 1
        self.steps.append(InferenceStep(step=self._step_num, fact_or_derived=pred, rule=None, premises=None))
        return self._step_num

    def derived(self, pred: str, rule: str, premises: list[int]) -> int:
        self._step_num += 1
        self.steps.append(InferenceStep(step=self._step_num, fact_or_derived=pred, rule=rule, premises=premises))
        return self._step_num

    def build(self) -> list[InferenceStep]:
        return list(self.steps)


def build_chosen_trace(
    member_id: int,
    task_id: int,
    kb: KnowledgeBase,
    engine: LogicEngine,
    score: float,
) -> list[InferenceStep]:
    """Build inference trace for the chosen member from engine state."""
    tr = TraceRecorder()
    name = kb.member_name.get(member_id, str(member_id))
    task = kb.task_name.get(task_id, str(task_id))

    req_steps = []
    for (tid, sid) in engine.facts.get("requires_skill", set()):
        if tid == task_id:
            sk = kb.skill_name.get(sid, str(sid))
            req_steps.append(tr.fact(f"requires_skill({task}, {sk})"))
    has_steps = []
    required_sids = {sid for (tid, sid) in engine.facts.get("requires_skill", set()) if tid == task_id}
    for (mid, sid) in engine.facts.get("has_skill", set()):
        if mid == member_id and sid in required_sids:
            sk = kb.skill_name.get(sid, str(sid))
            has_steps.append(tr.fact(f"has_skill({name}, {sk})"))
    tr.fact(f"workload({name}, {kb.workload.get(member_id, 0)})")
    tr.fact(f"available({name}, yes)")
    tr.derived(f"can_perform({name}, {task})", RULE_CAN_PERFORM, req_steps + has_steps)
    tr.derived(f"eligible({name}, {task})", RULE_ELIGIBLE, [tr.steps[-1].step])
    tr.derived(f"preferred({name}, {task}, {score:.2f})", RULE_PREFERRED, [tr.steps[-1].step])
    tr.derived(f"best_candidate({name}, {task}) → assign({name}, {task})", RULE_BEST, [tr.steps[-1].step])
    return tr.build()


# ---------------------------------------------------------------------------
# Allocation driver
# ---------------------------------------------------------------------------


@dataclass
class _CandidateResult:
    member_id: int
    member_name: str
    eligible: bool
    score: float
    reasons: list[str]
    rejection_reasons: list[str] | None


def run_allocation(db: Session, request: AllocateRequest) -> AllocateResponse:
    """
    Run allocation using logical inference.

    The engine proves eligible(M, T) for each task T; we rank by workload
    and select best_candidate. Rules are interpreted by the logic engine.
    """
    from app.db.models import Task, TeamMember

    task_query = db.query(Task).filter(Task.assignee_id.is_(None))
    if request.task_ids is not None:
        task_query = task_query.filter(Task.id.in_(request.task_ids))
    tasks = task_query.order_by(Task.priority_order.asc().nullslast()).all()

    member_query = db.query(TeamMember)
    if request.team_member_ids is not None:
        member_query = member_query.filter(TeamMember.id.in_(request.team_member_ids))
    members = member_query.all()

    if not tasks or not members:
        return AllocateResponse(
            assignments=[],
            unassigned_task_ids=[t.id for t in tasks],
            summary="No tasks to allocate or no team members available.",
        )

    engine = build_engine_from_kb(members, tasks)
    kb = build_knowledge_base(members, tasks)
    workload_map = {m.id: kb.workload.get(m.id, 0) for m in members}
    max_workload = max(workload_map.values(), default=0)

    assignments: list[Assignment] = []
    unassigned: list[int] = []

    for task in tasks:
        # Logical query: find all M such that eligible(M, task.id)
        eligible_ids: list[int] = []
        for m in members:
            # Prove eligible(m.id, task.id)
            sols = list(
                engine.prove(
                    FactGoal("eligible", (m.id, task.id)),
                    {},
                )
            )
            if sols:
                eligible_ids.append(m.id)

        # Build candidate results (including ineligible, for explanations)
        overloaded_ids = {f[0] for f in engine.facts.get("overloaded", set())}
        required_skill_ids = {sid for (tid, sid) in engine.facts.get("requires_skill", set()) if tid == task.id}

        def get_rejection(mid: int) -> list[str]:
            can_perform = bool(list(engine.prove(FactGoal("can_perform", (mid, task.id)), {})))
            if not can_perform:
                names = [kb.skill_name.get(sid, str(sid)) for sid in required_skill_ids]
                return [f"Missing required skill: {n}" for n in names] if names else ["No required skills"]
            if mid in overloaded_ids:
                return ["Overloaded (workload exceeds threshold)"]
            return ["Not available (no calendar)"]

        candidates = []
        for m in members:
            if m.id in eligible_ids:
                score = workload_score(m.id, kb, max_workload)
                reasons = [f"Workload: {workload_map[m.id]} tasks" if max_workload > 0 else "Available"]
                candidates.append(_CandidateResult(m.id, m.name, True, score, reasons, None))
            else:
                candidates.append(_CandidateResult(m.id, m.name, False, 0.0, [], get_rejection(m.id)))

        if not eligible_ids:
            unassigned.append(task.id)
            continue

        # best_candidate: max preferred score among eligible
        chosen_id = max(eligible_ids, key=lambda mid: workload_score(mid, kb, max_workload))
        chosen_score = workload_score(chosen_id, kb, max_workload)
        chosen_member = next(m for m in members if m.id == chosen_id)

        required_skills = [
            kb.skill_name.get(sid, str(sid))
            for (tid, sid) in engine.facts.get("requires_skill", set())
            if tid == task.id
        ]
        constraints_satisfied = [f"Has all required skills: {', '.join(required_skills)}"] if required_skills else []
        if chosen_member.calendar_availability:
            constraints_satisfied.append(f"Has availability: {chosen_member.calendar_availability}")

        explanation = (
            f"{chosen_member.name} assigned to {task.task_name} by logical inference: "
            f"eligible(M,T) proved (can_perform, available, ¬overloaded), "
            f"preferred by workload score {chosen_score:.2f}."
        )

        inference_trace = build_chosen_trace(chosen_id, task.id, kb, engine, chosen_score)

        candidate_explanations = [
            AssignmentExplanation(
                member_id=c.member_id,
                member_name=c.member_name,
                chosen=(c.member_id == chosen_id),
                reasons=c.reasons,
                rejection_reasons=c.rejection_reasons,
                score=c.score if c.eligible else None,
            )
            for c in candidates
        ]

        assignments.append(
            Assignment(
                task_id=task.id,
                task_name=task.task_name,
                team_member_id=chosen_id,
                team_member_name=chosen_member.name,
                score=chosen_score,
                explanation=explanation,
                constraints_satisfied=constraints_satisfied,
                inference_trace=inference_trace,
                candidate_explanations=candidate_explanations,
            )
        )

        if request.apply:
            task.assignee_id = chosen_id
            old_w = workload_map.get(chosen_id, 0)
            new_w = old_w + 1
            workload_map[chosen_id] = new_w
            kb.workload[chosen_id] = new_w
            max_workload = max(workload_map.values(), default=0)
            # Update engine facts for next iteration
            engine.facts.setdefault("workload", set()).discard((chosen_id, old_w))
            engine.facts["workload"].add((chosen_id, new_w))
            if new_w > 10:
                engine.facts.setdefault("overloaded", set()).add((chosen_id,))
            elif old_w >= 10 and new_w <= 10:
                engine.facts.get("overloaded", set()).discard((chosen_id,))

    if request.apply:
        db.commit()

    num_assigned = len(assignments)
    num_unassigned = len(unassigned)
    summary = f"Allocated {num_assigned} task(s). {num_unassigned} task(s) could not be assigned (no eligible member)."

    return AllocateResponse(
        assignments=assignments,
        unassigned_task_ids=unassigned,
        summary=summary,
    )
