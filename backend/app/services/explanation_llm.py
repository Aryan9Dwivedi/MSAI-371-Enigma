"""
LLM-based explanation generation for task allocation.

This module is optional and fail-safe:
- If disabled or misconfigured, caller should keep fallback explanation.
- If API call fails, caller should keep fallback explanation.
"""

from __future__ import annotations

import json
import os
import re
from urllib import request as urllib_request
from urllib.error import URLError, HTTPError

from app.core.config import settings


def _post_chat_completion(messages: list[dict[str, str]]) -> str | None:
    """Call OpenAI-compatible chat completions endpoint and return message content."""
    api_key = (settings.LLM_API_KEY or os.getenv("OPENAI_API_KEY", "")).strip()
    base_url = settings.LLM_BASE_URL.rstrip("/")
    # Allow keyless calls for local OpenAI-compatible providers (for example Ollama).
    if not api_key and not (
        base_url.startswith("http://localhost")
        or base_url.startswith("http://127.0.0.1")
    ):
        return None
    url = f"{base_url}/chat/completions"
    payload = {
        "model": settings.LLM_MODEL,
        "temperature": settings.LLM_TEMPERATURE,
        "messages": messages,
        "max_tokens": 220,
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib_request.Request(
        url=url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    # Local OpenAI-compatible providers (for example Ollama) may not require auth.
    if api_key:
        req.add_header("Authorization", f"Bearer {api_key}")
    try:
        with urllib_request.urlopen(req, timeout=settings.LLM_TIMEOUT_SECONDS) as resp:
            raw = resp.read().decode("utf-8")
        body = json.loads(raw)
        return body.get("choices", [{}])[0].get("message", {}).get("content")
    except (HTTPError, URLError, TimeoutError, ValueError, KeyError, IndexError):
        return None


def maybe_generate_assignment_explanation(
    *,
    task_name: str,
    chosen_member_name: str,
    chosen_score: float,
    predicted_hours: float,
    constraints_satisfied: list[str],
    top_factor_text: str,
    rejected_reasons: list[str],
    fallback_text: str,
) -> str:
    """
    Generate user-facing natural-language explanation with LLM.

    Returns fallback_text when disabled, unavailable, or generation fails.
    """
    if not settings.LLM_EXPLANATION_ENABLED:
        return fallback_text

    evidence = {
        "task_name": task_name,
        "chosen_member_name": chosen_member_name,
        "chosen_score": round(chosen_score, 4),
        "predicted_hours": round(predicted_hours, 2),
        "constraints_satisfied": constraints_satisfied,
        "top_factor_text": top_factor_text,
        "rejected_reasons": rejected_reasons[:3],
    }

    system_prompt = (
        "You are an explanation assistant for a task allocation system. "
        "You must strictly use only the provided evidence and never invent facts. "
        "Write clear, concise, professional business-facing text in English."
    )
    user_prompt = (
        "Using the evidence below, generate a 3-5 sentence natural-language explanation. "
        "It must include: "
        "(1) allocation decision, "
        "(2) hard-constraint satisfaction, "
        "(3) why this candidate won based on score/factors, "
        "(4) top reasons others were not selected (if available).\n\n"
        "Evidence (JSON):\n"
        f"{json.dumps(evidence, ensure_ascii=True)}"
    )

    content = _post_chat_completion(
        [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]
    )
    if not content:
        return fallback_text
    result = content.strip()
    return result or fallback_text


def maybe_generate_run_explanation(
    *,
    total_tasks_considered: int,
    assigned_count: int,
    unassigned_count: int,
    top_assignments: list[dict[str, str]],
    top_rejection_reasons: list[str],
    scoring_factors: list[str],
    hard_rules: list[str],
    fallback_text: str,
) -> str:
    """
    Generate one holistic explanation for an allocation run.

    Returns fallback_text when disabled, unavailable, or generation fails.
    """
    if not settings.LLM_EXPLANATION_ENABLED:
        return fallback_text

    factor_glossary = {
        "workload_fairness": "prefer lower current workload (fairness)",
        "experience": "prefer more relevant experience",
        "availability_richness": "prefer richer calendar availability",
        "skill_breadth": "prefer broader skill coverage",
        "delivery_speed": "prefer faster predicted completion time",
    }
    evidence = {
        "total_tasks_considered": total_tasks_considered,
        "assigned_count": assigned_count,
        "unassigned_count": unassigned_count,
        "top_assignments": top_assignments[:5],
        "top_rejection_reasons": top_rejection_reasons[:5],
        "scoring_factors": scoring_factors,
        "hard_rules": hard_rules,
        "factor_glossary": factor_glossary,
    }

    system_prompt = (
        "You are an explanation assistant for a task allocation system. "
        "You must strictly use ONLY the provided evidence and never invent facts. "
        "Do not mention any instructor, manager, or human decision-maker. "
        "Write simple, crisp, business-facing text in English."
    )
    user_prompt = (
        "Using the evidence below, write exactly 4 bullet points.\n"
        "Format rules:\n"
        "- Each bullet MUST start with '- ' (dash + space).\n"
        "- Each bullet MUST be <= 180 characters.\n"
        "- No extra text before or after the 4 bullets.\n"
        "Content rules (in this exact order):\n"
        "1) Outcome: assigned vs unassigned counts.\n"
        "2) Hard rules: one sentence that mentions skills, availability, and not overloaded.\n"
        "3) Scoring: explain the trade-off in plain words using factor_glossary; then list ALL scoring_factors in parentheses.\n"
        "4) Rejections: copy the first 2 items from top_rejection_reasons verbatim; mention unassigned_count.\n"
        "Strictness:\n"
        "- Use ONLY the evidence; do not guess.\n"
        "- If something is not in evidence, omit it.\n\n"
        "Evidence (JSON):\n"
        f"{json.dumps(evidence, ensure_ascii=True)}"
    )

    content = _post_chat_completion(
        [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]
    )
    if not content:
        return fallback_text
    result = content.strip()
    return result or fallback_text


def maybe_generate_task_explanation(
    *,
    task_name: str,
    member_name: str,
    constraints_satisfied: list[str],
    chosen_score: float | None,
    hard_rules: list[str],
    scoring_factors: list[str],
    chosen_reasons: list[str],
    best_alternative: dict[str, str] | None,
    best_alternative_gap: float | None,
    best_alternative_reasons: list[str],
    top_rejection_reasons: list[str],
    fallback_text: str,
) -> str:
    """
    Generate a short, user-facing explanation for a single task assignment.
    Returns fallback_text when disabled/unavailable.
    """
    if not settings.LLM_EXPLANATION_ENABLED:
        return fallback_text

    evidence = {
        "task_name": task_name,
        "member_name": member_name,
        "constraints_satisfied": constraints_satisfied,
        "chosen_score": None if chosen_score is None else round(float(chosen_score), 4),
        "hard_rules": hard_rules,
        "scoring_factors": scoring_factors,
        "chosen_reasons": chosen_reasons[:12],
        "best_alternative": best_alternative,
        "best_alternative_gap": None if best_alternative_gap is None else round(float(best_alternative_gap), 4),
        "best_alternative_reasons": best_alternative_reasons[:8],
        "top_rejection_reasons": top_rejection_reasons[:3],
    }

    system_prompt = (
        "You are an explanation assistant for a task allocation system. "
        "Use ONLY the evidence. Do not invent facts. "
        "Write simple, crisp, business-facing English."
    )
    user_prompt = (
        "Write exactly 3 bullet points.\n"
        "Format rules:\n"
        "- Each bullet MUST start with '- '.\n"
        "- Each bullet MUST be <= 180 characters.\n"
        "- No extra text before/after.\n"
        "Content rules:\n"
        "1) Decision: who was assigned to what.\n"
        "2) Why eligible: mention skills + availability + not overloaded.\n"
        "3) Why chosen: cite predicted time + top 2 factor contributions from chosen_reasons; mention MCDM.\n"
        "If best_alternative exists, you MUST mention best_alternative.member_name, best_alternative.score, and best_alternative_gap as 'gap: X'.\n\n"
        "Evidence (JSON):\n"
        f"{json.dumps(evidence, ensure_ascii=True)}"
    )

    content = _post_chat_completion(
        [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]
    )
    if not content:
        return fallback_text
    result = content.strip()
    if not result:
        return fallback_text

    # Guardrail: when an alternative is provided, ensure it is explicitly mentioned.
    # Some models omit it under tight length constraints, which makes the output less transparent.
    if best_alternative and best_alternative.get("member_name"):
        alt_name = str(best_alternative.get("member_name"))
        if (alt_name not in result) or ("gap:" not in result):
            return _build_task_fallback(
                task_name=task_name,
                member_name=member_name,
                constraints_satisfied=constraints_satisfied,
                chosen_score=chosen_score,
                chosen_reasons=chosen_reasons,
                scoring_factors=scoring_factors,
                best_alternative=best_alternative,
                best_alternative_gap=best_alternative_gap,
            )

    return result


def _extract_predicted_hours(lines: list[str]) -> float | None:
    for line in lines:
        m = re.search(r"Predicted completion time:\s*([0-9]+(?:\.[0-9]+)?)h", line)
        if m:
            try:
                return float(m.group(1))
            except ValueError:
                return None
    return None


def _extract_top_contributions(lines: list[str], *, top_k: int = 2) -> list[tuple[str, float]]:
    contribs: list[tuple[str, float]] = []
    for line in lines:
        if "×" not in line or "=" not in line:
            continue
        # Example: "Workload fairness 1.00 × w0.28 = 0.28"
        m = re.search(
            r"^([A-Za-z _-]+?)\s+[0-9.]+\s+×\s+w[0-9.]+\s+=\s+([0-9.]+)\s*$",
            line,
        )
        if not m:
            continue
        name = m.group(1).strip()
        try:
            val = float(m.group(2))
        except ValueError:
            continue
        contribs.append((name, val))
    contribs.sort(key=lambda x: x[1], reverse=True)
    return contribs[:top_k]


def _build_task_fallback(
    *,
    task_name: str,
    member_name: str,
    constraints_satisfied: list[str],
    chosen_score: float | None,
    chosen_reasons: list[str],
    scoring_factors: list[str],
    best_alternative: dict[str, str] | None,
    best_alternative_gap: float | None,
) -> str:
    predicted_h = _extract_predicted_hours(chosen_reasons)
    top_contribs = _extract_top_contributions(chosen_reasons, top_k=2)
    contrib_text = ", ".join([f"{n} +{v:.2f}" for (n, v) in top_contribs]) if top_contribs else "top factors"
    eta_text = f" ETA {predicted_h:.2f}h;" if predicted_h is not None else ""
    score_text = f"{float(chosen_score):.4f}" if chosen_score is not None else "N/A"

    alt_text = ""
    if best_alternative and best_alternative.get("member_name") and best_alternative.get("score"):
        gap_text = (
            f" gap: {float(best_alternative_gap):.4f}"
            if best_alternative_gap is not None
            else " gap: N/A"
        )
        alt_text = f" Next: {best_alternative['member_name']} {best_alternative['score']};{gap_text}."

    why_eligible = "Eligible via required skills + availability + not overloaded."
    if constraints_satisfied:
        why_eligible = f"Eligible: {', '.join(constraints_satisfied[:2])}."

    return "\n".join(
        [
            f"- {member_name} assigned to {task_name}.",
            f"- {why_eligible}",
            f"- MCDM score {score_text};{eta_text} {contrib_text} ({', '.join(scoring_factors)}).{alt_text}".strip(),
        ]
    )
