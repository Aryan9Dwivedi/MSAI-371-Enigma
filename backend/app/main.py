from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.health import router as health_router
from app.api.routes.db_ping import router as db_router
from app.api.routes.allocate import router as allocate_router

from app.db.session import engine
from app.db.base import Base
import app.db.models  # noqa: F401

app = FastAPI(title="KRAFT API", version="0.1.0")

# auto-create tables on startup (we'll use alembic later)
Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(db_router)
app.include_router(allocate_router)
