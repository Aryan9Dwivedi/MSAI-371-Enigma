from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.deps import get_db
from app.db.models import Task, TeamMember, Skill

router = APIRouter(tags=["stats"])


@router.get("/stats/pre_allocation")
def pre_allocation_stats(db: Session = Depends(get_db)):
    """
    Real backend stats for pre-allocation dashboard.
    Keeps frontend intuitive before running allocation.
    """
    total_members = db.query(TeamMember).count()
    available_members = db.query(TeamMember).filter(TeamMember.calendar_availability.isnot(None)).count()
    total_tasks = db.query(Task).count()
    unassigned_tasks = db.query(Task).filter(Task.assignee_id.is_(None)).count()
    assigned_tasks = total_tasks - unassigned_tasks
    total_skills = db.query(Skill).count()

    return {
        "total_members": total_members,
        "available_members": available_members,
        "total_tasks": total_tasks,
        "unassigned_tasks": unassigned_tasks,
        "assigned_tasks": assigned_tasks,
        "total_skills": total_skills,
    }
