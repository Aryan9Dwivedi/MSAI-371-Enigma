from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
def health():
    """Always 200 so frontend can reach backend. Use /db/ping to check DB."""
    return {"status": "ok"}
