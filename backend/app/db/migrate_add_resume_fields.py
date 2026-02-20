"""Add resume/experience columns to team_members if missing (idempotent)."""
from sqlalchemy import text
from app.db.session import engine


def run():
    with engine.connect() as conn:
        r = conn.execute(text("PRAGMA table_info(team_members)"))
        cols = {row[1] for row in r}
        if "years_of_experience" not in cols:
            conn.execute(text("ALTER TABLE team_members ADD COLUMN years_of_experience INTEGER"))
        if "resume_path" not in cols:
            conn.execute(text("ALTER TABLE team_members ADD COLUMN resume_path VARCHAR"))
        conn.commit()

