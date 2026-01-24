from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.deps import get_db

router = APIRouter(tags=["db"])

@router.get("/db/ping")
def db_ping(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1")).scalar()

    tables = db.execute(
        text("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;")
    ).all()

    return {"db": "ok", "tables": [t[0] for t in tables]}
