from sqlalchemy.orm import Session

from app.db.session import SessionLocal, engine
from app.db.base import Base
from app.db.models import TeamMember, Skill, Task

# ensure tables exist
Base.metadata.create_all(bind=engine)

def seed():
    db: Session = SessionLocal()

    # avoid duplicates if run again
    if db.query(Skill).count() > 0:
        print("Seed already exists. Skipping.")
        db.close()
        return

    # skills
    s1 = Skill(skill_name="Python", skill_type="hard", proficiency_level="advanced")
    s2 = Skill(skill_name="Writing", skill_type="soft", proficiency_level="intermediate")
    db.add_all([s1, s2])
    db.commit()

    # team member
    alice = TeamMember(
        name="Alice",
        work_style_preference="Independent",
        calendar_availability="Thu 9-12, Fri 14-16",
        skills=[s1, s2],
    )
    db.add(alice)

    # task
    task = Task(
        task_name="Literature Review",
        deadline="2026-01-28",
        estimated_time=5.0,
        priority_order=1,
        required_skills=[s2],
    )
    db.add(task)

    db.commit()
    db.close()
    print("✅ Seed inserted: 2 skills, 1 team member, 1 task")

if __name__ == "__main__":
    seed()

