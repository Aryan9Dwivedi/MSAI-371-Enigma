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
    # Azure (cognitiveservices.azure.com): URL includes deployment, add api-version
    is_azure = "cognitiveservices.azure.com" in base_url or "openai.azure.com" in base_url
    if is_azure:
        api_ver = getattr(settings, "LLM_AZURE_API_VERSION", "2024-12-01-preview")
        url = f"{base_url}/chat/completions?api-version={api_ver}"
        payload = {"temperature": settings.LLM_TEMPERATURE, "messages": messages, "max_tokens": 400}
    else:
        url = f"{base_url}/chat/completions"
        payload = {
            "model": settings.LLM_MODEL,
            "temperature": settings.LLM_TEMPERATURE,
            "messages": messages,
            "max_tokens": 400,
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


def _build_natural_run_fallback(
    *,
    assigned_count: int,
    unassigned_count: int,
    total_tasks: int,
    top_assignments: list[dict[str, str]],
    top_rejection_reasons: list[str],
) -> str:
    """Build premium, investor-ready explanation. Intelligent, narrative, eye-catching."""
    by_member: dict[str, list[str]] = {}
    for a in top_assignments:
        name = a.get("member_name", "?")
        task = a.get("task_name", "?")
        by_member.setdefault(name, []).append(task)
    num_members = len(by_member)
    top_loaders = sorted(by_member.items(), key=lambda x: len(x[1]), reverse=True)[:2]
    top_names = [n for n, _ in top_loaders]
    # Lead: punchy, shows intelligence
    lead = f"KRAFT allocated {assigned_count} of {total_tasks} tasks across {num_members} members in one run."
    if top_names:
        lead += f" {top_names[0]}" + (f" and {top_names[1]}" if len(top_names) > 1 else "") + " led with the strongest skill–task fit."
    lead += " Workload capped at 3 tasks per person."
    # Body: clear distribution
    body_parts = []
    for name, tasks_list in sorted(by_member.items()):
        tasks_str = ", ".join(tasks_list[:3])
        if len(tasks_list) > 3:
            tasks_str += f" (+{len(tasks_list) - 3} more)"
        body_parts.append(f"{name}: {tasks_str}")
    body = "\n".join(body_parts) if body_parts else ""
    # Closer: insight on unassigned
    if unassigned_count > 0:
        closer = f"{unassigned_count} task(s) could not be assigned — no team member had the required skills."
    else:
        closer = "All tasks matched to members with the right skills and availability."
    return f"{lead}\n{body}\n{closer}" if body else f"{lead}\n{closer}"


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
    Generate one holistic, natural-language explanation for why the allocation
    is distributed the way it is across all tasks. Always returns product-manager-ready prose.
    """
    return _build_natural_run_fallback(
        assigned_count=assigned_count,
        unassigned_count=unassigned_count,
        total_tasks=total_tasks_considered,
        top_assignments=top_assignments,
        top_rejection_reasons=top_rejection_reasons,
    )


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
    chosen_years_of_experience: int | None = None,
    chosen_current_workload: int | None = None,
    chosen_predicted_hours: float | None = None,
    chosen_availability_slots: int | None = None,
    runner_up_years_of_experience: int | None = None,
    runner_up_current_workload: int | None = None,
    runner_up_predicted_hours: float | None = None,
    runner_up_availability_slots: int | None = None,
) -> str:
    """
    Generate a natural-language explanation for a product manager.
    No jargon (no MCDM, workload_fairness, etc.). Plain English only.
    """
    runner_name = (best_alternative or {}).get("member_name")
    natural_fallback = _build_natural_fallback(
        task_name=task_name,
        member_name=member_name,
        runner_name=runner_name,
        chosen_years_of_experience=chosen_years_of_experience,
        runner_up_years_of_experience=runner_up_years_of_experience,
        chosen_current_workload=chosen_current_workload,
        runner_up_current_workload=runner_up_current_workload,
        chosen_predicted_hours=chosen_predicted_hours,
        runner_up_predicted_hours=runner_up_predicted_hours,
        chosen_availability_slots=chosen_availability_slots,
        runner_up_availability_slots=runner_up_availability_slots,
        chosen_score=chosen_score,
        best_alternative=best_alternative,
        constraints_satisfied=constraints_satisfied,
    )
    if not settings.LLM_EXPLANATION_ENABLED:
        return natural_fallback

    evidence = {
        "task_name": task_name,
        "chosen_person": member_name,
        "runner_up_person": runner_name,
        "chosen_years_experience": chosen_years_of_experience,
        "runner_up_years_experience": runner_up_years_of_experience,
        "chosen_tasks_already_assigned": chosen_current_workload,
        "runner_up_tasks_already_assigned": runner_up_current_workload,
        "chosen_estimated_hours_for_this_task": chosen_predicted_hours,
        "runner_up_estimated_hours_for_this_task": runner_up_predicted_hours,
        "chosen_calendar_slots_available": chosen_availability_slots,
        "runner_up_calendar_slots_available": runner_up_availability_slots,
        "chosen_score_percent": round(float(chosen_score or 0) * 100, 1) if chosen_score is not None else None,
        "runner_up_score_percent": _safe_score_percent(best_alternative.get("score") if best_alternative else None),
        "required_skills_met": constraints_satisfied[:3],
    }

    system_prompt = (
        "You are explaining a task assignment to a product manager who has NO technical background. "
        "Use ONLY the facts provided. Never use jargon like MCDM, workload_fairness, availability_richness, "
        "skill_breadth, delivery_speed, or any formula. Write in plain, natural English."
    )
    user_prompt = (
        "Write 3-4 short paragraphs (or bullet points) explaining why the chosen person was selected.\n\n"
        "Rules:\n"
        "- Use ONLY the evidence below. Do not invent numbers.\n"
        "- Write as if talking to a colleague. Natural, conversational.\n"
        "- If both candidates have experience years, say e.g. 'Marcus has 5 years of experience compared to Noah\'s 2 years.'\n"
        "- If both have tasks already assigned, say e.g. 'Marcus has 2 tasks already this week, Noah has 0.'\n"
        "- If both have estimated hours, say e.g. 'Marcus can complete this in about 6 hours, Noah in 7.'\n"
        "- If both have calendar slots, say e.g. 'Marcus has 6 time slots available this week, Noah has 4.'\n"
        "- Explain the trade-offs in plain words: experience, current workload, availability, predicted completion time.\n"
        "- If there is a runner-up, explicitly compare them. End with a clear sentence: 'We chose X over Y because...'\n\n"
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
        return _build_natural_fallback(
            task_name=task_name,
            member_name=member_name,
            runner_name=runner_name,
            chosen_years_of_experience=chosen_years_of_experience,
            runner_up_years_of_experience=runner_up_years_of_experience,
            chosen_current_workload=chosen_current_workload,
            runner_up_current_workload=runner_up_current_workload,
            chosen_predicted_hours=chosen_predicted_hours,
            runner_up_predicted_hours=runner_up_predicted_hours,
            chosen_availability_slots=chosen_availability_slots,
            runner_up_availability_slots=runner_up_availability_slots,
            chosen_score=chosen_score,
            best_alternative=best_alternative,
            constraints_satisfied=constraints_satisfied,
        )
    result = content.strip()
    return result or _build_natural_fallback(
        task_name=task_name,
        member_name=member_name,
        runner_name=runner_name,
        chosen_years_of_experience=chosen_years_of_experience,
        runner_up_years_of_experience=runner_up_years_of_experience,
        chosen_current_workload=chosen_current_workload,
        runner_up_current_workload=runner_up_current_workload,
        chosen_predicted_hours=chosen_predicted_hours,
        runner_up_predicted_hours=runner_up_predicted_hours,
        chosen_availability_slots=chosen_availability_slots,
        runner_up_availability_slots=runner_up_availability_slots,
        chosen_score=chosen_score,
        best_alternative=best_alternative,
        constraints_satisfied=constraints_satisfied,
    )


def _build_natural_fallback(
    *,
    task_name: str,
    member_name: str,
    runner_name: str | None,
    chosen_years_of_experience: int | None,
    runner_up_years_of_experience: int | None,
    chosen_current_workload: int | None,
    runner_up_current_workload: int | None,
    chosen_predicted_hours: float | None,
    runner_up_predicted_hours: float | None,
    chosen_availability_slots: int | None,
    runner_up_availability_slots: int | None,
    chosen_score: float | None,
    best_alternative: dict | None,
    constraints_satisfied: list[str],
) -> str:
    """Build premium, flowing explanation. No dry lists. Investor-ready."""
    if runner_name:
        try:
            ch = round(float(chosen_score) * 100, 1) if chosen_score and float(chosen_score) <= 1 else (chosen_score or 0)
            ru = float(best_alternative.get("score", 0)) if best_alternative else 0
            ru_pct = round(ru * 100, 1) if ru <= 1 else ru
            lead = f"We chose {member_name} over {runner_name} for \"{task_name}\" — {member_name} scored {ch}% fit vs {runner_name}'s {ru_pct}%."
        except (ValueError, TypeError):
            lead = f"We chose {member_name} over {runner_name} for \"{task_name}\"."
        comp = []
        if chosen_years_of_experience is not None and runner_up_years_of_experience is not None:
            comp.append(f"{member_name} brings {chosen_years_of_experience} years of experience ({runner_name}: {runner_up_years_of_experience}).")
        if chosen_predicted_hours is not None and runner_up_predicted_hours is not None:
            comp.append(f"Estimates {chosen_predicted_hours:.1f}h to complete vs {runner_up_predicted_hours:.1f}h.")
        if chosen_availability_slots is not None and runner_up_availability_slots is not None:
            comp.append(f"{member_name} has {chosen_availability_slots} time slots this week; {runner_name} has {runner_up_availability_slots}.")
        if chosen_current_workload is not None and runner_up_current_workload is not None and (chosen_current_workload > 0 or runner_up_current_workload > 0):
            comp.append(f"{member_name} has {chosen_current_workload} task(s) this run; {runner_name} has {runner_up_current_workload}.")
        body = "\n".join(comp) if comp else ""
        closer = f"Both met the requirements. We went with {member_name} for stronger experience and delivery."
        return f"{lead}\n{body}\n{closer}" if body else f"{lead}\n{closer}"
    else:
        return f"{member_name} was assigned to \"{task_name}\" — the only eligible candidate for this task."


def _safe_score_percent(score_val) -> float | None:
    """Convert score (float or str, 0-1 scale) to percentage, or None."""
    if score_val is None:
        return None
    try:
        v = float(score_val)
        return round(v * 100, 1) if v <= 1.0 else round(v, 1)
    except (ValueError, TypeError):
        return None


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
