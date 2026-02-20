from pydantic import BaseModel, Field


class AllocateRequest(BaseModel):
    """Optional filters for allocation. If empty, allocates all unassigned tasks."""

    task_ids: list[int] | None = Field(
        default=None,
        description="Limit allocation to these task IDs. If None, use all unassigned tasks.",
    )
    team_member_ids: list[int] | None = Field(
        default=None,
        description="Limit candidate pool to these members. If None, use all members.",
    )
    apply: bool = Field(
        default=False,
        description="If True, persist assignments to the database.",
    )


class AssignmentExplanation(BaseModel):
    """Explanation for why a member was or wasn't chosen for a task."""

    member_id: int
    member_name: str
    chosen: bool
    reasons: list[str] = Field(
        default_factory=list,
        description="Human-readable reasons (e.g. 'Has required skills', 'Workload below average').",
    )
    rejection_reasons: list[str] | None = Field(
        default=None,
        description="If not chosen, why (e.g. 'Missing skill: Python', 'Overloaded').",
    )
    score: float | None = Field(
        default=None,
        description="Final weighted score if candidate was considered.",
    )


class InferenceStep(BaseModel):
    """A single step in the reasoning trace."""

    step: int = Field(description="Step number.")
    fact_or_derived: str = Field(
        description="Ground fact or derived predicate (e.g. 'has_skill(alice, writing)').",
    )
    rule: str | None = Field(
        default=None,
        description="Rule that produced this step (e.g. 'can_perform ← ∀S: requires_skill ⇒ has_skill').",
    )
    premises: list[int] | None = Field(
        default=None,
        description="Step numbers of premises used, if derived.",
    )


class Assignment(BaseModel):
    """A single task assignment with full explanation."""

    task_id: int
    task_name: str
    team_member_id: int
    team_member_name: str
    score: float = Field(description="Weighted score used for selection.")
    explanation: str = Field(
        description="Human-readable summary (e.g. 'Alice assigned because she has Python + availability, workload below average').",
    )
    constraints_satisfied: list[str] = Field(
        default_factory=list,
        description="Hard constraints that were satisfied.",
    )
    inference_trace: list[InferenceStep] = Field(
        default_factory=list,
        description="KRR-style inference trace showing rule applications.",
    )
    candidate_explanations: list[AssignmentExplanation] = Field(
        default_factory=list,
        description="Per-candidate reasoning (preferred and rejected).",
    )


class AllocateResponse(BaseModel):
    """Result of the allocation reasoning run."""

    assignments: list[Assignment] = Field(
        default_factory=list,
        description="Successfully assigned task-member pairs with explanations.",
    )
    unassigned_task_ids: list[int] = Field(
        default_factory=list,
        description="Task IDs that could not be assigned (no eligible member).",
    )
    summary: str = Field(
        description="Brief summary of the allocation run.",
    )
