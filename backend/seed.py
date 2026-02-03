from datetime import datetime

from sqlalchemy.orm import Session

from app.db.session import SessionLocal, engine
from app.db.base import Base
from app.db.models import (
    Role,
    TeamMember,
    Skill,
    Task,
    TeamMemberSkill,
    TaskRequiredSkill,
    TaskDependency,
    TimeSlot,
    AllocationRun,
    Allocation,
)

Base.metadata.create_all(bind=engine)


def seed():
    db: Session = SessionLocal()

    # skip if already seeded
    if db.query(Role).count() > 0:
        print("Seed already exists. Skipping.")
        db.close()
        return

    admin = Role(name="admin", description="Full access; can run allocator and manage all data")
    manager = Role(name="manager", description="Can run allocator and view team data")
    employee = Role(name="employee", description="Can be assigned tasks; limited permissions")
    db.add_all([admin, manager, employee])
    db.commit()

    s1 = Skill(skill_name="Python", skill_type="hard", description="Programming in Python")
    s2 = Skill(skill_name="Writing", skill_type="soft", description="Technical and creative writing")
    db.add_all([s1, s2])
    db.commit()

    alice = TeamMember(
        name="Alice",
        email="alice@example.com",
        role_id=manager.id,
        work_style_preference="Independent",
        calendar_availability="Thu 9-12, Fri 14-16",
        workload_limit_hours=20.0,
    )
    db.add(alice)
    db.flush()

    alice_python = TeamMemberSkill(
        team_member_id=alice.id,
        skill_id=s1.id,
        proficiency_level="advanced",
    )
    alice_writing = TeamMemberSkill(
        team_member_id=alice.id,
        skill_id=s2.id,
        proficiency_level="intermediate",
    )
    db.add_all([alice_python, alice_writing])

    # Alice available Thu 9-12, Fri 14-16 (before Literature Review deadline 2026-01-28)
    ts1 = TimeSlot(
        team_member_id=alice.id,
        start_at=datetime(2026, 1, 23, 9, 0, 0),
        end_at=datetime(2026, 1, 23, 12, 0, 0),
    )
    ts2 = TimeSlot(
        team_member_id=alice.id,
        start_at=datetime(2026, 1, 24, 14, 0, 0),
        end_at=datetime(2026, 1, 24, 16, 0, 0),
    )
    db.add_all([ts1, ts2])

    lit_review = Task(
        task_name="Literature Review",
        description="Survey existing research on task allocation systems",
        deadline="2026-01-28",
        estimated_time=5.0,
        priority_order=1,
        status="todo",
    )
    db.add(lit_review)
    db.flush()

    impl = Task(
        task_name="Implementation",
        description="Build core allocation logic",
        deadline="2026-02-15",
        estimated_time=10.0,
        priority_order=2,
        status="todo",
    )
    db.add(impl)
    db.flush()

    trs1 = TaskRequiredSkill(
        task_id=lit_review.id,
        skill_id=s2.id,
        proficiency_minimum="intermediate",
    )
    trs2 = TaskRequiredSkill(
        task_id=impl.id,
        skill_id=s1.id,
        proficiency_minimum="advanced",
    )
    db.add_all([trs1, trs2])

    td = TaskDependency(
        task_id=impl.id,
        depends_on_task_id=lit_review.id,
    )
    db.add(td)

    run = AllocationRun(notes="Initial seed demo run")
    db.add(run)
    db.flush()

    alloc = Allocation(
        run_id=run.id,
        team_member_id=alice.id,
        task_id=lit_review.id,
        explanation="Alice has Writing skill at intermediate level and availability before deadline.",
        status="pending",
    )
    db.add(alloc)

    db.commit()
    db.close()
    print("✅ Seed inserted: 3 roles, 2 skills, 1 team member, 2 time slots, 2 tasks, 1 dependency, 1 allocation run")
