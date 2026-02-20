# Purpose of This Document

This document defines FOPC rules for KRAFT and the allocation workflow (by Mia).

## Backend Tech Stack

### Core Technologies

| Component | Technology | Purpose |
| --- | --- | --- |
| **Web Framework** | FastAPI | REST API endpoints, dependency injection |
| **ORM** | SQLAlchemy | Database abstraction, relationship management |
| **Logic Engine** | Custom FOPC Engine | Backward-chaining inference (Datalog-equivalent) |

## Logic Engine Architecture

The logic engine implements **First-Order Predicate Calculus (FOPC)** with backward chaining.

### 1. Facts

Ground atoms (no variables):

```
engine.assert_fact("member", 123)
engine.assert_fact("has_skill", 123, 456)
engine.assert_fact("available", 123)
```

### 2. Variables

Logic variables for unification:

```
Var("M")  # Represents any member
Var("T")  # Represents any task
Var("S")  # Represents any skill
```

### 3. Goals

Structures to prove:

```
# Prove a fact with variables
FactGoal("eligible", (Var("M"), Var("T")))

# Prove conjunction (AND)
ConjGoal((goal1, goal2, goal3))

# Prove negation (NOT)
NegGoal(goal)

# Prove universal quantification (FORALL)
ForallGoal(Var("S"), domain_fn, body_goal)
```

### 4. Rules

Horn clauses (if-then logic):

```
head ← body

Example:
can_perform(M, T) ← ∀S: requires_skill(T,S) ⇒ has_skill(M,S)
```

### Inference Strategy: Backward Chaining

```
Goal: eligible(Alice, Task1)
       │
       ├─ Try facts in database → Not found
       │
       └─ Try rules:
            Rule: eligible(M,T) ← member(M) ∧ can_perform(M,T) ∧ available(M) ∧ ¬overloaded(M)
            │
            ├─ Prove member(Alice) → ✓ (fact exists)
            ├─ Prove can_perform(Alice, Task1)
            │    Rule: can_perform(M,T) ← ∀S: requires_skill(T,S) ⇒ has_skill(M,S)
            │    │
            │    ├─ Find all S where requires_skill(Task1, S) → [Python, REST]
            │    ├─ Prove has_skill(Alice, Python) → ✓
            │    └─ Prove has_skill(Alice, REST) → ✓
            │    Result: ✓
            ├─ Prove available(Alice) → ✓ (fact exists)
            └─ Prove ¬overloaded(Alice) → ✓ (no overloaded(Alice) fact)
            
Result: eligible(Alice, Task1) is PROVEN ✓
```

### Unification

Pattern matching between goals and facts:

```
Goal: has_skill(Var("M"), 456)
Fact: has_skill(123, 456)

Unification creates substitution: {M: 123}
Result: Match ✓
```

## Logic Rules Implemented

### Rule 1: Can Perform

`can_perform(M, T) ← ∀S: requires_skill(T,S) ⇒ has_skill(M,S)`

**Meaning**: A member can perform a task if they have ALL required skills.

**Implementation**: `backend/app/services/reasoning.py` — `ForallGoal` over required skills, `FactGoal("has_skill", (Var("M"), Var("S")))`.

### Rule 2: Eligible

`eligible(M, T) ← member(M) ∧ can_perform(M,T) ∧ available(M) ∧ ¬overloaded(M)`

**Meaning**: A member is eligible if they:

1. Are a team member
2. Can perform the task (have required skills)
3. Are available (have calendar availability)
4. Are not overloaded (workload ≤ 10 tasks)

**Implementation**: `ConjGoal` of `member`, `can_perform`, `available`, `NegGoal(overloaded)`.

### Rule 3: Preferred (Meta-Level)

`preferred(M, T, S) ← eligible(M,T) ∧ S = workload_score(M)`

**Meaning**: Among eligible members, prefer those with lower workload.

**Implementation**: Procedural ranking in `reasoning.py`:

```python
chosen_id = max(eligible_ids, key=lambda mid: workload_score(mid, kb, max_workload))
```

**Workload Score Formula**:

`workload_score = 1.0 - (current_workload / (max_workload + 1))`

Higher score = lower workload = more preferred.

### Rule 4: Best Candidate (Meta-Level)

`best_candidate(M, T) ← preferred(M,T,S) ∧ ∀M': S ≥ S'`

**Meaning**: Choose the member with the highest preference score.

## Workflow: How Allocation Works

### Step 1: Database Query

- Get unassigned tasks (ordered by priority): `Task.assignee_id.is_(None)`, `order_by(Task.priority_order)`.
- Get team members: `db.query(TeamMember).all()`.

### Step 2: Build Knowledge Base

- Create `LogicEngine()`, assert facts from DB: `member`, `workload`, `available`, `overloaded`, `has_skill`, `requires_skill`.
- Register rules: `can_perform`, `eligible`.

### Step 3: Logical Inference

- For each task, for each member: `engine.prove(FactGoal("eligible", (member.id, task.id)), {})`.
- Collect `eligible_ids`.

### Step 4: Ranking & Selection

- Among eligible members, choose by `workload_score`.
- Build inference trace for explanation.

### Step 5: Generate Response

- Return `AllocateResponse` with `assignments`, `unassigned_task_ids`, `summary`, and per-assignment `explanation` and `inference_trace`.

### Step 6: Optional Persistence

- If `request.apply` is true: set `task.assignee_id = chosen_id`, `db.commit()`, and update workload facts for subsequent tasks.

---

*Code reference: `backend/app/services/logic_engine.py`, `backend/app/services/reasoning.py`.*
