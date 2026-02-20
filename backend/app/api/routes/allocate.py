from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.deps import get_db
from app.schemas.allocation import AllocateRequest, AllocateResponse
from app.services.reasoning import run_allocation

router = APIRouter(tags=["allocation"])


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
    return run_allocation(db, request)
