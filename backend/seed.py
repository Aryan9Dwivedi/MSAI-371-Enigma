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
    s3 = Skill(skill_name="SQL", skill_type="hard", proficiency_level="intermediate")
    s4 = Skill(skill_name="Data Analysis", skill_type="hard", proficiency_level="intermediate")
    s5 = Skill(skill_name="React", skill_type="hard", proficiency_level="beginner")
    s6 = Skill(skill_name="Node.js", skill_type="hard", proficiency_level="beginner")
    s7 = Skill(skill_name="React", skill_type="hard", proficiency_level="advanced")
    db.add_all([s1, s2, s3, s4, s5, s6, s7])
    db.commit()

    # team member
    alice = TeamMember(
        name="Alice",
        work_style_preference="Independent",
        calendar_availability="Thu 9-12, Fri 14-16",
        skills=[s1, s2, s6],
    )
    bob = TeamMember(
        name="Bob",
        work_style_preference="Independent",
        calendar_availability="Mon-Wed 9-17",
        skills=[s3, s4, s7],
    )
    carol = TeamMember(
        name="Carol",
        work_style_preference="Collaborative",
        calendar_availability="Mon 10-12, Mon 13-16, Thu 9-15, Fri 14-16",
        skills=[s1, s2, s3, s4, s6, s7],
    )
    db.add_all([alice, bob, carol])

    # task
    task1 = Task(
        task_name="Literature Review",
        deadline="2026-02-28",
        estimated_time=5.0,
        priority_order=1,
        required_skills=[s2],
    )
    task2 = Task(
        task_name="API Integration",
        deadline="2026-03-01",
        estimated_time=2.0,
        priority_order=3,
        required_skills=[s5, s6],
    )
    task3 = Task(
        task_name="Database Optimization",
        deadline="2026-03-02",
        estimated_time=3.0,
        priority_order=2,
        required_skills=[s3, s4],
    )
    db.add_all([task1, task2, task3])

    db.commit()
    db.close()
    print("✅ Seed inserted: 7 skills, 3 team members, 3 tasks")

if __name__ == "__main__":
    seed()

