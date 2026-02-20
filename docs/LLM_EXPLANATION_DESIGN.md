# LLM Explanation Design

## Purpose and Scope

This document describes the current LLM-based explanation subsystem in KRAFT.
The subsystem does **not** decide task allocation outcomes. It only converts deterministic engine evidence into concise, user-facing rationale.

Primary goals:

- Improve readability of allocation decisions for non-technical users.
- Preserve auditability by grounding all generated text in explicit evidence.
- Fail safely to deterministic fallback text when LLM generation is unavailable.

## Design Principles

### 1) Deterministic Decision, Generative Narration

- Allocation decisions are made by the reasoning engine (`eligible` proof + MCDM ranking).
- The LLM only narrates "why" in natural language using structured evidence payloads.

### 2) Evidence-Only Generation

- Prompts explicitly require using only provided evidence.
- Prompt templates forbid fabrication and unsupported claims.
- If the LLM output misses key constraints (for example, alternative comparison), fallback builders enforce required details.

### 3) Operational Safety

- Feature flag: `LLM_EXPLANATION_ENABLED`.
- Timeout-based network calls.
- Local or cloud OpenAI-compatible providers.
- Graceful degradation to deterministic fallback strings.

## Runtime Components

### Backend Services

- `backend/app/services/explanation_llm.py`
  - `maybe_generate_run_explanation(...)`
  - `maybe_generate_task_explanation(...)`
  - `_post_chat_completion(...)` for OpenAI-compatible `/chat/completions`
- `backend/app/services/reasoning.py`
  - Produces structured evidence from logic + scoring pipeline
  - Calls LLM helper functions
  - Returns fallbacks when LLM is disabled or unavailable

### API Surface

- `POST /allocate`
  - Returns assignment results and one run-level explanation
- `POST /allocate/explain_task`
  - Returns task-level explanation on demand (lazy load)

## Configuration

Configured via environment variables:

- `LLM_EXPLANATION_ENABLED` (bool)
- `LLM_API_KEY` (empty for local keyless providers)
- `LLM_BASE_URL` (OpenAI-compatible base URL)
- `LLM_MODEL`
- `LLM_TEMPERATURE`
- `LLM_TIMEOUT_SECONDS`

Example deployment modes:

- Cloud provider (OpenAI-compatible, API key required)
- Local provider (for example Ollama, keyless localhost endpoint)

## Explanation Flows

## A) Run-Level Explanation

Input evidence includes:

- Assigned and unassigned counts
- Top assignments
- Top rejection reasons
- Hard rules
- Scoring factors and factor glossary

Output target:

- Exactly 4 compact bullets
- Outcome, hard-rule gate, scoring interpretation, rejection summary

Fallback behavior:

- A deterministic summary string is returned if generation fails.

## B) Task-Level Explanation (Lazy Loaded)

Input evidence includes:

- Task name and selected member
- Constraint satisfaction evidence
- Chosen score
- Chosen reasoning lines (including predicted completion time and weighted factor contributions)
- Best alternative candidate and score gap
- Rejection snippets

Output target:

- Exactly 3 compact bullets
- Decision, eligibility gate, scoring-specific rationale
- Mandatory comparison with best alternative when available

Guardrail behavior:

- If the model omits alternative name or score gap, backend fallback synthesizes a compliant explanation.

## Prompting Strategy

Both prompt templates enforce:

- Strict bullet format
- No extra text before or after bullet list
- Business-facing plain English
- Evidence-only constraints

Task-level prompt additionally requires:

- Predicted completion time
- Top factor contributions
- Alternative + score gap when available

## Frontend Integration

`frontend_0.2/src/pages/Allocation.jsx` follows this interaction:

1. Run allocation once (`/allocate`)
2. Show run summary and unassigned task names
3. When a user clicks a task row, request `/allocate/explain_task`
4. Render task rationale and loading state

This keeps initial allocation latency lower than pre-generating all task-level narratives.

## Reliability and Failure Modes

### Failure Cases

- Model endpoint unreachable
- Timeout
- Invalid model response shape
- Missing API key for non-local endpoints

### Recovery Strategy

- Return deterministic fallback explanation
- Keep allocation result available and unchanged
- Avoid blocking allocation endpoint on explanation generation errors

## Security and Compliance Notes

- Sensitive credentials are environment-driven, not hard-coded.
- LLM calls send only explanation evidence, not full database dumps.
- Deterministic core decisions remain inspectable and reproducible.

## Known Limitations

- Prompt-constrained outputs may still vary across model families.
- Very small local models can produce lower linguistic quality.
- Bullet length constraints trade detail for readability.

## Future Improvements

- Optional deterministic explanation mode for all outputs.
- Explanation quality regression tests with golden snapshots.
- Confidence/uncertainty annotations for near-tie outcomes.
- Internationalization layer for user-facing explanations.
