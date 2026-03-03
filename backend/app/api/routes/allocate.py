from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.deps import get_db
from app.db.models import Task, TeamMember
from app.schemas.allocation import AllocateRequest, AllocateResponse, ExplainTaskRequest, ExplainTaskResponse
from app.services.reasoning import run_allocation, explain_task

router = APIRouter(tags=["allocation"])


def _append_allocation_log(db: Session, request: AllocateRequest, result: AllocateResponse) -> None:
    """
    Write a minimal key:value style log entry.
    Newest run is always inserted at the top.
    """
    backend_root = Path(__file__).resolve().parents[3]
    log_dir = backend_root / "logs"
    log_dir.mkdir(parents=True, exist_ok=True)
    log_path = log_dir / "ALLOCATION_RUN_LOG.md"

    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    total_members = db.query(TeamMember).count()
    total_tasks = db.query(Task).count()
    db_unassigned = db.query(Task).filter(Task.assignee_id.is_(None)).count()
    assigned_member_ids = sorted({a.team_member_id for a in result.assignments})
    unassigned_ids = result.unassigned_task_ids or []
    entry = "\n".join(
        [
            f"- Timestamp: {ts}",
            f"- Total Members: {total_members}",
            f"- Total Tasks: {total_tasks}",
            f"- Allocated This Run: {len(result.assignments)}",
            f"- Unassigned This Run: {len(unassigned_ids)}",
            f"- Members Used This Run: {len(assigned_member_ids)}",
            "",
            "",
        ]
    )

    if log_path.exists():
        old = log_path.read_text(encoding="utf-8")
    else:
        old = "# Allocation Run Log\n\n"

    # Drop legacy verbose section if present.
    if "# Allocation Run Log (Compact)" in old:
        old = old.split("# Allocation Run Log (Compact)", 1)[0]

    marker = "# Allocation Run Log\n\n"
    if old.startswith(marker):
        body = old[len(marker) :]
        new_text = marker + entry + body
    else:
        new_text = marker + entry + old

    log_path.write_text(new_text, encoding="utf-8")


@router.post("/allocate", response_model=AllocateResponse)
def allocate(
    request: AllocateRequest = AllocateRequest(),
    db: Session = Depends(get_db),
) -> AllocateResponse:
    """
    Run the reasoning engine to allocate tasks to team members.

    Returns task assignments with full explanations (constraints satisfied,
    why members were preferred/rejected). Use `apply: true` to persist.
    """
    result = run_allocation(db, request)
    try:
        _append_allocation_log(db, request, result)
    except Exception:
        # Logging should never block allocation API.
        pass
    return result


@router.post("/allocate/explain_task", response_model=ExplainTaskResponse)
def allocate_explain_task(
    request: ExplainTaskRequest,
) -> ExplainTaskResponse:
    """
    Generate a task-level explanation on demand (lazy-loaded by the UI).
    """
    return explain_task(request)
