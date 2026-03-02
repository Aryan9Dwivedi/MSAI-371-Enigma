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

# ---------------------------------------------------------------------------
# Strategy metadata — drives how each explanation is framed
# ---------------------------------------------------------------------------

_STRATEGY_META: dict[str, dict[str, str]] = {
    "automatic": {
        "label": "Automatic",
        "ranking_description": (
            "Candidates were scored across five factors: how much work they currently carry, "
            "their years of experience, how available they are on their calendar, how broad "
            "their skill set is, and how quickly they are estimated to finish the task. "
            "The importance of each factor adjusts automatically for high-priority or long tasks."
        ),
        "why_chosen_description": (
            "Explain why this person had the highest score. Mention their estimated completion "
            "time if available. Describe the top two factors that gave them the advantage in "
            "plain words — for example 'light workload' or 'strong experience'. "
            "Do NOT use underscores or code-style names."
        ),
    },
    "fast": {
        "label": "Fast",
        "ranking_description": (
            "The Fast strategy was used, which only looks at two things: how much work the "
            "person currently has (70% of the score) and how available they are on their "
            "calendar (30%). Experience, skill breadth, and delivery speed were not "
            "considered — the goal was to make assignments quickly."
        ),
        "why_chosen_description": (
            "Explain that this person had the best combination of low current workload and "
            "good calendar availability. Do NOT mention experience, skill breadth, or "
            "delivery speed. Do NOT use underscores or code-style names."
        ),
    },
    "balanced": {
        "label": "Balanced",
        "ranking_description": (
            "The Balanced strategy was used, which simply picks whoever currently has the "
            "fewest assigned tasks. The goal is to spread work evenly across the team. "
            "Experience, availability detail, skill breadth, and delivery speed were "
            "not scored."
        ),
        "why_chosen_description": (
            "Explain that this person had the lowest current workload among all eligible "
            "candidates, making them the fairest choice to keep the team balanced. "
            "Do NOT mention experience, skill breadth, or delivery speed. "
            "Do NOT use underscores or code-style names."
        ),
    },
    "constraint_focused": {
        "label": "Constraint-Focused",
        "ranking_description": (
            "The Constraint-Focused strategy was used. Every candidate had to satisfy all "
            "hard requirements first — they must have every required skill, be available on "
            "their calendar, and not already be overloaded. Among those who passed all "
            "checks, the person with the lightest workload was chosen. No other factors "
            "were scored."
        ),
        "why_chosen_description": (
            "Explain that this person met every hard requirement and, among those who did, "
            "had the lightest workload. Do NOT mention experience, skill breadth, or "
            "delivery speed. Do NOT use underscores or code-style names."
        ),
    },
}

# Human-readable display names for internal factor identifiers
_FACTOR_DISPLAY_NAMES: dict[str, str] = {
    "workload_fairness": "workload fairness",
    "availability_richness": "schedule availability",
    "skill_breadth": "breadth of skills",
    "delivery_speed": "estimated delivery speed",
    "workload": "current workload",
    "availability": "calendar availability",
    "experience": "years of experience",
    "workload (tiebreaker)": "current workload (tiebreaker only)",
}


def _humanize_factors(factors: list[str]) -> list[str]:
    return [_FACTOR_DISPLAY_NAMES.get(f, f) for f in factors]


def _post_chat_completion(messages: list[dict[str, str]]) -> str | None:
    """Call OpenAI-compatible or Azure OpenAI chat completions endpoint and return message content."""
    api_key = (settings.LLM_API_KEY or os.getenv("OPENAI_API_KEY", "")).strip()
    base_url = settings.LLM_BASE_URL.rstrip("/")
    is_azure = settings.LLM_PROVIDER.lower() == "azure"

    # Allow keyless calls for local OpenAI-compatible providers (for example Ollama).
    if not api_key and not is_azure and not (
        base_url.startswith("http://localhost")
        or base_url.startswith("http://127.0.0.1")
    ):
        return None

    if is_azure:
        # Azure OpenAI: URL includes deployment name; model is inferred from the deployment.
        api_version = settings.AZURE_OPENAI_API_VERSION
        url = f"{base_url}/openai/deployments/{settings.LLM_MODEL}/chat/completions?api-version={api_version}"
        payload: dict = {
            "temperature": settings.LLM_TEMPERATURE,
            "messages": messages,
            "max_tokens": 220,
        }
    else:
        # Standard OpenAI / compatible providers.
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

    if is_azure:
        # Azure uses the api-key header for authentication.
        req.add_header("api-key", api_key)
        print(f"🚀 Making request to Azure OpenAI URL: {url}") 
    elif api_key:
        # Standard OpenAI Bearer token auth.
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
    strategy: str = "automatic",
) -> str:
    """
    Generate one holistic explanation for an allocation run.

    Returns fallback_text when disabled, unavailable, or generation fails.
    The explanation is framed around the chosen strategy so readers understand
    what was prioritised and which factors were evaluated.
    """
    if not settings.LLM_EXPLANATION_ENABLED:
        return fallback_text

    meta = _STRATEGY_META.get(strategy, _STRATEGY_META["automatic"])

    evidence = {
        "strategy_name": meta["label"],
        "strategy_how_candidates_were_ranked": meta["ranking_description"],
        "total_tasks": total_tasks_considered,
        "assigned": assigned_count,
        "unassigned": unassigned_count,
        "sample_assignments": top_assignments[:5],
        "why_some_were_rejected": top_rejection_reasons[:5],
        "scoring_factors_used": _humanize_factors(scoring_factors),
    }

    system_prompt = (
        "You are an explanation assistant for a task allocation system. "
        "Write clear, friendly, human-readable summaries that a non-technical person can understand. "
        "Use only the information provided. Do not invent facts. "
        "Never use variable names, underscores, or code-style identifiers in your output."
    )
    user_prompt = (
        "Using the evidence below, write exactly 4 bullet points in plain English.\n"
        "Format rules:\n"
        "- Each bullet MUST start with '- ' (dash + space).\n"
        "- Each bullet MUST be no longer than 180 characters.\n"
        "- No extra text before or after the 4 bullets.\n"
        "- Write as if explaining to a team manager, not a developer.\n"
        "- Never use underscores, camelCase, or code-style names.\n"
        "Content (in this order):\n"
        "1) How many tasks were assigned and how many could not be filled; mention the strategy name.\n"
        "2) What hard requirements every candidate had to meet before being considered.\n"
        "3) How candidates were ranked — use the strategy_how_candidates_were_ranked text, rephrased concisely.\n"
        "4) Why some tasks went unassigned — describe the top rejection reasons in plain words and mention the count.\n"
        "Use ONLY the evidence. Omit anything not in the evidence.\n\n"
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
    strategy: str = "automatic",
) -> str:
    """
    Generate a short, user-facing explanation for a single task assignment.
    The explanation is framed around the chosen strategy so readers understand
    what was prioritised and which factors were evaluated.
    Returns fallback_text when disabled/unavailable.
    """
    if not settings.LLM_EXPLANATION_ENABLED:
        return fallback_text

    meta = _STRATEGY_META.get(strategy, _STRATEGY_META["automatic"])

    alt_name = best_alternative.get("member_name") if best_alternative else None
    alt_score = best_alternative.get("score") if best_alternative else None
    alt_gap = None if best_alternative_gap is None else round(float(best_alternative_gap), 4)

    evidence = {
        "strategy_name": meta["label"],
        "task": task_name,
        "assigned_to": member_name,
        "eligibility_checks_passed": constraints_satisfied,
        "score": None if chosen_score is None else round(float(chosen_score), 4),
        "scoring_details": chosen_reasons[:12],
        "runner_up_name": alt_name,
        "runner_up_score": alt_score,
        "score_difference_vs_runner_up": alt_gap,
        "runner_up_details": best_alternative_reasons[:8],
        "why_others_were_ineligible": top_rejection_reasons[:3],
        "scoring_factors_used": _humanize_factors(scoring_factors),
    }

    system_prompt = (
        "You are an explanation assistant for a task allocation system. "
        "Write clear, friendly, human-readable summaries that a non-technical person can understand. "
        "Use only the information provided. Do not invent facts. "
        "Never use variable names, underscores, or code-style identifiers in your output."
    )
    why_chosen = meta["why_chosen_description"]
    runner_up_instruction = (
        "If runner_up_name is present, you MUST name the runner-up, state their score, "
        "and say how much lower their score was compared to the person chosen."
    )
    user_prompt = (
        "Using the evidence below, write exactly 3 bullet points in plain English.\n"
        "Format rules:\n"
        "- Each bullet MUST start with '- '.\n"
        "- Each bullet MUST be no longer than 180 characters.\n"
        "- No extra text before or after the 3 bullets.\n"
        "- Write as if explaining to a team manager, not a developer.\n"
        "- Never use underscores, camelCase, or code-style names.\n"
        "Content (in this order):\n"
        "1) Who was assigned to which task, and which strategy was used.\n"
        "2) Why this person was eligible: they have all the required skills, are available, and are not overloaded.\n"
        f"3) Why this person was chosen over others: {why_chosen} {runner_up_instruction}\n\n"
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
    if alt_name:
        if alt_name not in result:
            return _build_task_fallback(
                task_name=task_name,
                member_name=member_name,
                constraints_satisfied=constraints_satisfied,
                chosen_score=chosen_score,
                chosen_reasons=chosen_reasons,
                scoring_factors=scoring_factors,
                best_alternative=best_alternative,
                best_alternative_gap=best_alternative_gap,
                strategy=strategy,
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
    strategy: str = "automatic",
) -> str:
    strategy_label = _STRATEGY_META.get(strategy, _STRATEGY_META["automatic"])["label"]

    predicted_h = _extract_predicted_hours(chosen_reasons)
    top_contribs = _extract_top_contributions(chosen_reasons, top_k=2)
    score_text = f"{float(chosen_score):.2f}" if chosen_score is not None else "N/A"

    # Runner-up sentence in plain English
    alt_sentence = ""
    if best_alternative and best_alternative.get("member_name") and best_alternative.get("score"):
        alt_name = best_alternative["member_name"]
        alt_score = best_alternative["score"]
        if best_alternative_gap is not None:
            alt_sentence = (
                f" The closest alternative was {alt_name} "
                f"(scored {alt_score}, which was {float(best_alternative_gap):.2f} lower)."
            )
        else:
            alt_sentence = f" The closest alternative was {alt_name} (scored {alt_score})."

    # Eligibility sentence
    if constraints_satisfied:
        why_eligible = f"Met all requirements: {', '.join(constraints_satisfied[:2])}."
    else:
        why_eligible = "Met all requirements: has the required skills, is available, and is not overloaded."

    # "Why chosen" sentence — plain language, no underscores
    human_factors = _humanize_factors(scoring_factors)
    factors_phrase = " and ".join(human_factors) if human_factors else "relevant factors"
    if strategy == "automatic":
        eta_part = f" Estimated to finish in about {predicted_h:.1f} hours." if predicted_h is not None else ""
        if top_contribs:
            contrib_names = " and ".join([_FACTOR_DISPLAY_NAMES.get(n.lower().replace(" ", "_"), n) for n, _ in top_contribs])
            why_chosen = f"Scored highest ({score_text}) across {factors_phrase}.{eta_part} Strongest advantages: {contrib_names}.{alt_sentence}"
        else:
            why_chosen = f"Scored highest ({score_text}) across {factors_phrase}.{eta_part}{alt_sentence}"
    elif strategy == "fast":
        why_chosen = f"Best combination of low workload and calendar availability (score {score_text}).{alt_sentence}"
    elif strategy == "balanced":
        why_chosen = f"Carried the fewest existing tasks among eligible candidates (score {score_text}).{alt_sentence}"
    else:  # constraint_focused
        why_chosen = f"Met all hard requirements; had the lightest workload among qualified candidates (score {score_text}).{alt_sentence}"

    return "\n".join(
        [
            f"- {member_name} was assigned to \"{task_name}\" using the {strategy_label} strategy.",
            f"- {why_eligible}",
            f"- {why_chosen}",
        ]
    )