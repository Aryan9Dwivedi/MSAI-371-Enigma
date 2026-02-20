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
    ExplainTaskRequest,
    ExplainTaskResponse,
    UnassignedTask,
)
from app.services.logic_engine import (
    ConjGoal,
    FactGoal,
    ForallGoal,
    LogicEngine,
    NegGoal,
    Var,
)
from app.services.explanation_llm import maybe_generate_run_explanation, maybe_generate_task_explanation

# ---------------------------------------------------------------------------
# Rule definitions (FOPC) — declarative, interpreted by the logic engine
# ---------------------------------------------------------------------------

RULE_CAN_PERFORM = "can_perform(M,T) ← ∀S: requires_skill(T,S) ⇒ has_skill(M,S)"
RULE_ELIGIBLE = "eligible(M,T) ← member(M) ∧ can_perform(M,T) ∧ available(M) ∧ ¬overloaded(M)"
RULE_PREFERRED = "preferred(M,T,S) ← eligible(M,T) ∧ S = multi_factor_score(M,T)"
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


def years_experience_score(member: "TeamMember", max_years_experience: int) -> float:
    """Higher score = more years of experience."""
    years = member.years_of_experience or 0
    if max_years_experience <= 0:
        return 0.5
    return min(1.0, years / max_years_experience)


def availability_score(member: "TeamMember") -> float:
    """Estimate availability richness from calendar slots string."""
    availability = (member.calendar_availability or "").strip()
    if not availability:
        return 0.0
    slots = [slot.strip() for slot in availability.split(",") if slot.strip()]
    # 6+ slots is considered "high availability" for normalization.
    return min(1.0, len(slots) / 6.0)


def skill_breadth_score(member: "TeamMember", max_skill_count: int) -> float:
    """Higher score = broader skill profile."""
    count = len(member.skills) if hasattr(member, "skills") and member.skills else 0
    if max_skill_count <= 0:
        return 0.5
    return min(1.0, count / max_skill_count)


def predicted_completion_hours(
    member: "TeamMember",
    task: "Task",
    kb: KnowledgeBase,
    max_workload: int,
    max_years_experience: int,
    max_skill_count: int,
) -> float:
    """
    Person-specific duration estimate for the same task.
    This addresses the real-world case where different people need different time.
    """
    base_hours = task.estimated_time if (task.estimated_time and task.estimated_time > 0) else 4.0
    exp_s = years_experience_score(member, max_years_experience)
    breadth_s = skill_breadth_score(member, max_skill_count)
    avail_s = availability_score(member)
    workload_s = workload_score(member.id, kb, max_workload)

    # Multipliers >1 means slower; <1 means faster.
    experience_multiplier = 1.45 - (0.65 * exp_s)   # [~0.80, 1.45]
    skill_multiplier = 1.30 - (0.40 * breadth_s)    # [~0.90, 1.30]
    availability_multiplier = 1.25 - (0.35 * avail_s)  # [~0.90, 1.25]
    workload_multiplier = 1.40 - (0.50 * workload_s)   # [~0.90, 1.40]

    predicted = base_hours * experience_multiplier * skill_multiplier * availability_multiplier * workload_multiplier
    return max(0.25, predicted)


def delivery_speed_score(member_id: int, predicted_hours_map: dict[int, float]) -> float:
    """Normalize predicted completion time to [0,1], where higher means faster."""
    if member_id not in predicted_hours_map:
        return 0.0
    values = list(predicted_hours_map.values())
    if not values:
        return 0.0
    min_h = min(values)
    max_h = max(values)
    if max_h - min_h < 1e-9:
        return 1.0
    h = predicted_hours_map[member_id]
    return 1.0 - ((h - min_h) / (max_h - min_h))


def dynamic_factor_weights(task: "Task") -> dict[str, float]:
    """
    Dynamic weights (context-aware):
    - Higher priority/complexity tasks emphasize experience and delivery speed.
    - Base profile still values fairness and availability.
    """
    weights = {
        "workload": 0.35,
        "experience": 0.25,
        "availability": 0.20,
        "skill_breadth": 0.10,
        "delivery_speed": 0.10,
    }

    priority = task.priority_order if task.priority_order is not None else 999
    if priority <= 1:
        weights["experience"] += 0.08
        weights["delivery_speed"] += 0.07
        weights["availability"] += 0.03
        weights["skill_breadth"] -= 0.05
        weights["workload"] -= 0.03

    estimated_time = task.estimated_time or 0.0
    if estimated_time >= 6.0:
        weights["delivery_speed"] += 0.10
        weights["experience"] += 0.05
        weights["workload"] += 0.02
        weights["availability"] -= 0.04
        weights["skill_breadth"] -= 0.03

    # Keep strictly positive, then normalize.
    for k in list(weights.keys()):
        weights[k] = max(0.02, weights[k])
    total = sum(weights.values())
    return {k: v / total for k, v in weights.items()}


def mcdm_score(
    member: "TeamMember",
    task: "Task",
    kb: KnowledgeBase,
    max_workload: int,
    max_years_experience: int,
    max_skill_count: int,
    delivery_speed: float,
) -> tuple[float, dict[str, float], dict[str, float], dict[str, float]]:
    """
    Multi-criteria score with interpretable factor breakdown.
    Returns:
      - final_score
      - raw_factor_scores
      - weighted_contributions
      - factor_weights
    """
    factor_scores = {
        "workload": workload_score(member.id, kb, max_workload),
        "experience": years_experience_score(member, max_years_experience),
        "availability": availability_score(member),
        "skill_breadth": skill_breadth_score(member, max_skill_count),
        "delivery_speed": delivery_speed,
    }
    weights = dynamic_factor_weights(task)
    weighted = {k: factor_scores[k] * weights[k] for k in factor_scores}
    final_score = sum(weighted.values())
    return final_score, factor_scores, weighted, weights


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
            overall_explanation="No allocation was performed because no tasks or no members were available.",
        )

    engine = build_engine_from_kb(members, tasks)
    kb = build_knowledge_base(members, tasks)
    workload_map = {m.id: kb.workload.get(m.id, 0) for m in members}
    max_workload = max(workload_map.values(), default=0)
    max_years_experience = max(((m.years_of_experience or 0) for m in members), default=0)
    max_skill_count = max((len(m.skills) if hasattr(m, "skills") and m.skills else 0 for m in members), default=0)

    assignments: list[Assignment] = []
    unassigned: list[int] = []
    unassigned_tasks: list[UnassignedTask] = []
    run_top_assignments: list[dict[str, str]] = []
    run_rejection_reasons: list[str] = []

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

        predicted_hours_map: dict[int, float] = {}
        for m in members:
            if m.id in eligible_ids:
                predicted_hours_map[m.id] = predicted_completion_hours(
                    member=m,
                    task=task,
                    kb=kb,
                    max_workload=max_workload,
                    max_years_experience=max_years_experience,
                    max_skill_count=max_skill_count,
                )

        candidates = []
        score_cache: dict[int, tuple[float, dict[str, float], dict[str, float], dict[str, float]]] = {}
        for m in members:
            if m.id in eligible_ids:
                pred_h = predicted_hours_map[m.id]
                speed_s = delivery_speed_score(m.id, predicted_hours_map)
                score, factors, weighted, weights = mcdm_score(
                    member=m,
                    task=task,
                    kb=kb,
                    max_workload=max_workload,
                    max_years_experience=max_years_experience,
                    max_skill_count=max_skill_count,
                    delivery_speed=speed_s,
                )
                score_cache[m.id] = (score, factors, weighted, weights)
                reasons = [
                    f"MCDM score: {score:.3f}",
                    f"Predicted completion time: {pred_h:.2f}h",
                    f"Workload fairness {factors['workload']:.2f} × w{weights['workload']:.2f} = {weighted['workload']:.2f}",
                    f"Experience {factors['experience']:.2f} × w{weights['experience']:.2f} = {weighted['experience']:.2f}",
                    f"Availability {factors['availability']:.2f} × w{weights['availability']:.2f} = {weighted['availability']:.2f}",
                    f"Skill breadth {factors['skill_breadth']:.2f} × w{weights['skill_breadth']:.2f} = {weighted['skill_breadth']:.2f}",
                    f"Delivery speed {factors['delivery_speed']:.2f} × w{weights['delivery_speed']:.2f} = {weighted['delivery_speed']:.2f}",
                ]
                candidates.append(_CandidateResult(m.id, m.name, True, score, reasons, None))
            else:
                candidates.append(_CandidateResult(m.id, m.name, False, 0.0, [], get_rejection(m.id)))

        if not eligible_ids:
            unassigned.append(task.id)
            unassigned_tasks.append(UnassignedTask(task_id=task.id, task_name=task.task_name))
            continue

        # best_candidate: max multi-factor score among eligible
        chosen_id = max(eligible_ids, key=lambda mid: score_cache[mid][0])
        chosen_score, chosen_factors, chosen_weighted, chosen_weights = score_cache[chosen_id]
        chosen_member = next(m for m in members if m.id == chosen_id)

        required_skills = [
            kb.skill_name.get(sid, str(sid))
            for (tid, sid) in engine.facts.get("requires_skill", set())
            if tid == task.id
        ]
        constraints_satisfied = [f"Has all required skills: {', '.join(required_skills)}"] if required_skills else []
        if chosen_member.calendar_availability:
            constraints_satisfied.append(f"Has availability: {chosen_member.calendar_availability}")

        chosen_pred_h = predicted_hours_map.get(chosen_id, task.estimated_time or 0.0)
        top_factors = sorted(chosen_weighted.items(), key=lambda x: x[1], reverse=True)[:2]
        top_factor_text = ", ".join(
            f"{name}({chosen_factors[name]:.2f}×w{chosen_weights[name]:.2f})"
            for name, _ in top_factors
        )
        fallback_explanation = (
            f"{chosen_member.name} assigned to {task.task_name} by logical inference: "
            f"eligible(M,T) proved (can_perform, available, ¬overloaded). "
            f"Then selected by multi-factor scoring (MCDM) with final score {chosen_score:.2f}. "
            f"Predicted completion time for this member: {chosen_pred_h:.2f}h. "
            f"Top contributors: {top_factor_text}."
        )
        explanation = fallback_explanation

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
        for c in candidates:
            if c.rejection_reasons:
                run_rejection_reasons.extend(c.rejection_reasons)

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
        run_top_assignments.append(
            {
                "task_name": task.task_name,
                "member_name": chosen_member.name,
                "score": f"{chosen_score:.3f}",
                "top_factors": ", ".join(name for name, _ in top_factors),
            }
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
    rejection_counts: dict[str, int] = {}
    for r in run_rejection_reasons:
        rejection_counts[r] = rejection_counts.get(r, 0) + 1
    def _short_reason(reason: str) -> str:
        if reason.startswith("Missing required skill: "):
            return "Missing skill: " + reason[len("Missing required skill: ") :]
        if reason.startswith("Overloaded"):
            return "Overloaded"
        if reason.startswith("Not available"):
            return "Not available"
        return reason

    unique_rejections = [
        f"{_short_reason(k)} ({v})"
        for k, v in sorted(rejection_counts.items(), key=lambda x: x[1], reverse=True)
    ]
    top_assignment_text = ", ".join(
        f"{item['task_name']} -> {item['member_name']} ({item['score']})"
        for item in run_top_assignments[:3]
    ) or "No successful assignments"
    rejection_text = "; ".join(unique_rejections[:3]) if unique_rejections else "No rejection reasons"
    fallback_overall_explanation = "\n".join(
        [
            f"- Outcome: assigned {num_assigned}/{len(tasks)} tasks; unassigned {num_unassigned}.",
            "- Hard rules: required skills + availability + not overloaded (workload <= 10).",
            "- Scoring: MCDM (workload_fairness, experience, availability_richness, skill_breadth, delivery_speed).",
            f"- Rejections: {rejection_text}.",
        ]
    )
    hard_rules = [
        "All required skills must be present (AND match).",
        "Calendar availability must be present.",
        "Not overloaded (workload <= 10).",
    ]
    scoring_factors = [
        "workload_fairness",
        "experience",
        "availability_richness",
        "skill_breadth",
        "delivery_speed",
    ]
    overall_explanation = maybe_generate_run_explanation(
        total_tasks_considered=len(tasks),
        assigned_count=num_assigned,
        unassigned_count=num_unassigned,
        top_assignments=run_top_assignments,
        top_rejection_reasons=unique_rejections,
        scoring_factors=scoring_factors,
        hard_rules=hard_rules,
        fallback_text=fallback_overall_explanation,
    )

    return AllocateResponse(
        assignments=assignments,
        unassigned_task_ids=unassigned,
        summary=summary,
        overall_explanation=overall_explanation,
        unassigned_tasks=unassigned_tasks,
    )


def explain_task(request: ExplainTaskRequest) -> ExplainTaskResponse:
    hard_rules = request.hard_rules or [
        "All required skills must be present (AND match).",
        "Calendar availability must be present.",
        "Not overloaded (workload <= 10).",
    ]
    scoring_factors = request.scoring_factors or [
        "workload_fairness",
        "experience",
        "availability_richness",
        "skill_breadth",
        "delivery_speed",
    ]
    fallback = "\n".join(
        [
            f"- {request.team_member_name} assigned to {request.task_name}.",
            "- Eligible via required skills + availability + not overloaded.",
            f"- Selected by MCDM ({', '.join(scoring_factors)}).",
        ]
    )
    explanation = maybe_generate_task_explanation(
        task_name=request.task_name,
        member_name=request.team_member_name,
        constraints_satisfied=request.constraints_satisfied,
        chosen_score=request.chosen_score,
        hard_rules=hard_rules,
        scoring_factors=scoring_factors,
        chosen_reasons=request.chosen_reasons,
        best_alternative=request.best_alternative,
        best_alternative_gap=request.best_alternative_gap,
        best_alternative_reasons=request.best_alternative_reasons,
        top_rejection_reasons=request.top_rejection_reasons,
        fallback_text=fallback,
    )
    return ExplainTaskResponse(
        task_id=request.task_id,
        team_member_id=request.team_member_id,
        explanation=explanation,
    )
