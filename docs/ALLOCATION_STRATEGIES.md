# Allocation Strategies

Source of truth: `backend/app/services/reasoning.py`, `backend/app/schemas/allocation.py`

---

## Overview

The KRAFT allocation engine supports four strategies that control **how** the best candidate is selected from the set of eligible members. All strategies share the same eligibility phase (FOPC logical inference); they differ only in the ranking/selection phase.

### Shared Eligibility Phase (all strategies)

Every strategy first proves eligibility via backward chaining:

```
eligible(M, T) ← member(M) ∧ can_perform(M, T) ∧ available(M) ∧ ¬overloaded(M)
can_perform(M, T) ← ∀S: requires_skill(T, S) ⇒ has_skill(M, S)
```

A member is eligible only if they:
1. Possess every skill the task requires
2. Have calendar availability (non-null, non-empty)
3. Are not overloaded (current workload ≤ 10)

Members who fail any of these are rejected with an explanation. Only eligible members proceed to the strategy-specific ranking below.

---

## Strategy 1: Automatic (Recommended)

**API value:** `"automatic"`

**Goal:** Balanced optimization across all factors.

**Scoring:** Full multi-criteria decision making (MCDM) with five weighted factors:

| Factor | Description | Base Weight |
|--------|-------------|-------------|
| Workload fairness | `1 − (current / (max + 1))` — lower workload = higher score | 0.35 |
| Experience | `years / max_years` — more experience = higher score | 0.25 |
| Availability | `slots / 6` (capped at 1.0) — more calendar slots = higher score | 0.20 |
| Skill breadth | `skills_count / max_count` — broader skills = higher score | 0.10 |
| Delivery speed | Normalized predicted completion time (faster = higher) | 0.10 |

**Dynamic weight adjustments:**
- High-priority tasks (priority ≤ 1): experience and delivery speed weights increase
- Large tasks (estimated ≥ 6h): delivery speed weight increases further

**Predicted completion time** is computed per member, factoring in their experience, skill breadth, availability, and current workload as multipliers on the task's base `estimated_time`.

**Best for:** General-purpose allocation where you want the engine to balance quality, speed, and fairness automatically.

---

## Strategy 2: Fast Assignment

**API value:** `"fast"`

**Goal:** Quick allocation with basic matching.

**Scoring:** Two factors only, fixed weights:

| Factor | Weight |
|--------|--------|
| Workload fairness | 0.70 |
| Availability | 0.30 |

```
score = 0.7 × workload_score + 0.3 × availability_score
```

Skips: predicted completion hours, delivery speed, experience scoring, skill breadth scoring, dynamic weight adjustments.

**Best for:** Rapid allocation when fine-grained optimization is not needed. Produces results faster and with simpler explanations.

---

## Strategy 3: Balanced Workload

**API value:** `"balanced"`

**Goal:** Prioritize even distribution of work across the team.

**Scoring:** Single factor:

```
score = workload_score = 1 − (current_workload / (max_workload + 1))
```

The member with the lowest current workload always wins. As tasks are assigned iteratively, the engine updates workload counts between assignments, so work naturally spreads across the team.

**Best for:** Ensuring no team member is disproportionately loaded. Maximizes fairness at the potential cost of match quality.

---

## Strategy 4: Constraint Focused

**API value:** `"constraint_focused"`

**Goal:** Strict constraint satisfaction with minimal optimization.

**Scoring:** Same as Balanced Workload (workload as tiebreaker), but the intent is different:

```
score = workload_score (tiebreaker only)
```

The engine prioritizes that every hard constraint is met (skills, availability, not overloaded). Among eligible members, workload is used only to break ties — there is no attempt to optimize for experience, delivery speed, or other soft preferences.

**Best for:** Scenarios where constraint compliance matters most and you do not want the engine to inject optimization preferences.

---

## Strategy Comparison

| Aspect | Automatic | Fast | Balanced | Constraint Focused |
|--------|-----------|------|----------|-------------------|
| Factors used | 5 (MCDM) | 2 | 1 | 1 |
| Predicted completion time | Yes | No | No | No |
| Dynamic weights | Yes | No | No | No |
| Workload fairness | Weighted factor | Dominant factor | Only factor | Tiebreaker |
| Experience considered | Yes | No | No | No |
| Delivery speed | Yes | No | No | No |
| Typical result | Best-fit candidate | Available + low-workload | Spread across team | Spread across team |
| Explanation detail | Full factor breakdown | Workload + availability | Workload score | Constraint confirmation |

---

## API Usage

### Request

```json
POST /allocate
{
  "strategy": "automatic",
  "task_ids": null,
  "team_member_ids": null,
  "apply": false
}
```

The `strategy` field accepts: `"automatic"`, `"fast"`, `"balanced"`, `"constraint_focused"`. Defaults to `"automatic"` if omitted.

### Response (per assignment)

Each assignment includes:
- `score` — strategy-specific final score
- `explanation` — human-readable summary mentioning the strategy used
- `constraints_satisfied` — hard constraints that were met
- `inference_trace` — FOPC inference steps
- `candidate_explanations` — per-member reasoning (chosen and rejected)

---

## Files Changed

### `backend/app/schemas/allocation.py`

- Added `AllocationStrategy` enum (`automatic`, `fast`, `balanced`, `constraint_focused`)
- Added `strategy` field to `AllocateRequest` (defaults to `automatic`)

### `backend/app/services/reasoning.py`

- Imported `AllocationStrategy` from schema
- Modified `run_allocation()` to branch on `request.strategy`:
  - **Automatic**: unchanged — full MCDM with predicted hours and delivery speed
  - **Fast**: computes only `workload_score` (0.7) + `availability_score` (0.3); skips `predicted_completion_hours`, `delivery_speed_score`, `mcdm_score`, and `dynamic_factor_weights`
  - **Balanced**: scores by `workload_score` only (weight 1.0)
  - **Constraint Focused**: same scoring as Balanced; differentiated by explanation text emphasizing constraint satisfaction
- Strategy-specific explanation text for each assignment

### `frontend_0.2/src/api/kraftApi.js`

- Added `strategy` to the `POST /allocate` request body (defaults to `"automatic"`)

### `frontend_0.2/src/pages/Allocation.jsx`

- Passes the user-selected `strategy` state to `kraftApi.allocate()`
- Strategy selector UI was already present (4 buttons: Automatic, Fast, Balanced, Constraint Focused)

### `backend/seed.py`

- Expanded sample data: 15 skills, 8 team members, 10 tasks
- Added `--reset` flag to clear and re-seed
- Team members have varied experience (1–8 yrs), availability (0–6 slots), and skill sets to produce visibly different results across strategies

---

## Example Results (seed data)

```
── AUTOMATIC ──
  Literature Review         → Carol    (0.85)
  ML Model Training         → Hiro     (0.81)
  Database Optimization     → Carol    (0.88)
  CI/CD Pipeline Setup      → Frank    (0.84)
  API Integration           → Grace    (0.76)

── BALANCED ──
  Literature Review         → Alice    (1.00)
  ML Model Training         → Hiro     (1.00)
  Database Optimization     → Bob      (1.00)
  CI/CD Pipeline Setup      → Frank    (1.00)
  API Integration           → Dave     (1.00)
```

Automatic concentrates work on the strongest candidates (Carol gets 5 tasks). Balanced spreads work across 7 different members.
