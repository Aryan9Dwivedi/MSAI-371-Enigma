# Scoring Reasoning Engine Design

## Overview

KRAFT uses a two-stage decision architecture:

1. **Logical eligibility filtering** (hard constraints)
2. **MCDM ranking** among eligible candidates

This design keeps assignment decisions both correct-by-constraint and explainable-by-score.

## Stage 1: Logic-Based Eligibility (Hard Rules)

The engine encodes declarative FOPC-style rules:

- `can_perform(M, T) <- forall S: requires_skill(T, S) => has_skill(M, S)`
- `eligible(M, T) <- member(M) and can_perform(M, T) and available(M) and not overloaded(M)`

Interpretation:

- Every required skill must be present (AND semantics).
- Candidate must have non-empty availability.
- Candidate must not exceed overload threshold (`workload <= 10` in current implementation semantics).

Result:

- Ineligible candidates are excluded before scoring.
- Rejection reasons are recorded for transparency.

## Stage 2: MCDM Ranking

For each eligible candidate, the engine computes:

`final_score = sum(factor_score_i * factor_weight_i)`

Factors:

- `workload_fairness`
- `experience`
- `availability_richness`
- `skill_breadth`
- `delivery_speed`

The candidate with the maximum `final_score` is selected.

## Factor Definitions

## 1) Workload Fairness

- Objective: balance assignments and avoid concentrating work.
- Normalization: lower current workload yields higher score.

## 2) Experience

- Objective: prefer candidates with stronger relevant experience.
- Normalization: candidate years divided by max years in current candidate pool.

## 3) Availability Richness

- Objective: prefer candidates with richer calendar capacity.
- Proxy: count of parsed availability slots.
- Normalization: capped against a high-availability reference level.

## 4) Skill Breadth

- Objective: prefer resilient generalists when useful.
- Proxy: total number of known skills.
- Normalization: candidate skill count divided by max skill count in pool.

## 5) Delivery Speed

- Objective: prefer faster expected completion for the same task.
- Derived from predicted completion hours (lower hours => higher speed score).

## Predicted Completion Time Model

The engine estimates person-specific completion time:

- Base task estimate (`task.estimated_time`, fallback default if absent)
- Multipliers driven by:
  - experience
  - skill breadth
  - availability richness
  - workload fairness

General behavior:

- Stronger profile and lower workload reduce predicted hours.
- Predicted hours are converted into `delivery_speed` score by min-max normalization within eligible candidates for that task.

This means predicted time is directly part of the final ranking, not only a display metric.

## Dynamic Weighting Strategy

Weights are task-aware, then normalized:

- Baseline profile values fairness, experience, and availability.
- Higher-priority tasks increase emphasis on experience and speed.
- Longer tasks increase emphasis on speed and experience, with mild fairness adjustment.
- All weights are clamped positive and normalized to sum to 1.

This allows context-sensitive trade-offs without changing factor definitions.

## Decision Trace and Explainability

For each assigned task, the engine stores:

- Inference trace of logical proof steps
- Candidate-level explanations
- Rejection reasons for non-selected candidates
- Factor-level scoring breakdown:
  - raw factor values
  - weights
  - weighted contributions
  - final score

This enables end-to-end inspection:

- "Was this candidate eligible?"
- "What contribution did each factor add?"
- "Who was second-best and by what score gap?"

## Determinism and Reproducibility

Core decision logic is deterministic for identical inputs:

- Rule proving is deterministic over the same facts/rules.
- Scoring formulas are deterministic numerical functions.
- Selection is argmax over computed scores.

LLM narration does not alter outcomes.

## Complexity Characteristics

Let:

- `T` = number of target tasks
- `M` = number of members
- `R` = average required skills per task

Rough behavior:

- Eligibility checks scale with `O(T * M * R)` in typical use.
- Scoring is performed only for eligible candidates.
- Explanation generation is optional and can be lazy-loaded per task.

## API-Level Outputs

The allocation response returns:

- assignments with full reasoning fields
- unassigned task IDs and names
- summary and run-level explanation

Task-level explanation endpoint accepts explicit scoring evidence:

- chosen score and reason lines
- best alternative and score gap
- hard rules and scoring factor labels

## Current Trade-offs

- Rich explainability increases payload size.
- Dynamic weights improve context adaptation but require careful communication in UI text.
- Local LLM deployments improve cost/privacy but can reduce linguistic quality.

## Recommended Validation Checklist

- Unit-test each factor function and weight normalization.
- Regression-test score ordering for representative scenarios.
- Test tie/near-tie behavior and alternative-gap reporting.
- Validate that predicted time changes can flip rankings when expected.
- Validate that hard-rule violations always override high scores.

## Future Extensions

- Add explicit calibration for predicted time against historical completion logs.
- Introduce fairness constraints at run-level (global balancing).
- Add confidence indicators for near-equal final scores.
- Support configurable overload thresholds by team or project phase.
