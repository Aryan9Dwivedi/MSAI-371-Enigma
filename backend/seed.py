import sys

from sqlalchemy.orm import Session
from sqlalchemy import text

from app.db.session import SessionLocal, engine
from app.db.base import Base
from app.db.models import TeamMember, Skill, Task

Base.metadata.create_all(bind=engine)


def seed(reset: bool = False):
    db: Session = SessionLocal()

    if db.query(Skill).count() > 0 and not reset:
        print("Seed already exists. Run with --reset to clear and re-seed.")
        db.close()
        return

    if reset:
        # Clear in correct order (FK constraints)
        db.execute(text("DELETE FROM task_required_skills"))
        db.execute(text("DELETE FROM team_member_skills"))
        db.execute(text("UPDATE tasks SET assignee_id = NULL"))
        db.execute(text("DELETE FROM tasks"))
        db.execute(text("DELETE FROM team_members"))
        db.execute(text("DELETE FROM skills"))
        db.commit()
        print("Cleared existing data.")

    # ── Skills ──────────────────────────────────────────────────────────
    python   = Skill(skill_name="Python",         skill_type="hard", proficiency_level="advanced")
    writing  = Skill(skill_name="Writing",        skill_type="soft", proficiency_level="intermediate")
    sql      = Skill(skill_name="SQL",            skill_type="hard", proficiency_level="intermediate")
    data_an  = Skill(skill_name="Data Analysis",  skill_type="hard", proficiency_level="intermediate")
    react_b  = Skill(skill_name="React",          skill_type="hard", proficiency_level="beginner")
    nodejs   = Skill(skill_name="Node.js",        skill_type="hard", proficiency_level="beginner")
    react_a  = Skill(skill_name="React",          skill_type="hard", proficiency_level="advanced")
    research = Skill(skill_name="Research",        skill_type="soft", proficiency_level="advanced")
    ml       = Skill(skill_name="Machine Learning", skill_type="hard", proficiency_level="advanced")
    devops   = Skill(skill_name="DevOps",          skill_type="hard", proficiency_level="intermediate")
    uiux     = Skill(skill_name="UI/UX Design",   skill_type="soft", proficiency_level="intermediate")
    testing  = Skill(skill_name="Testing/QA",      skill_type="hard", proficiency_level="intermediate")
    comms    = Skill(skill_name="Communication",   skill_type="soft", proficiency_level="advanced")
    docker   = Skill(skill_name="Docker",          skill_type="hard", proficiency_level="intermediate")
    ts       = Skill(skill_name="TypeScript",      skill_type="hard", proficiency_level="intermediate")
    db.add_all([
        python, writing, sql, data_an, react_b, nodejs, react_a,
        research, ml, devops, uiux, testing, comms, docker, ts,
    ])
    db.commit()

    # ── Team members (8) ───────────────────────────────────────────────
    alice = TeamMember(
        name="Alice",
        work_style_preference="Independent",
        calendar_availability="Thu 9-12, Fri 14-16",
        years_of_experience=3,
        skills=[python, writing, nodejs],
    )
    bob = TeamMember(
        name="Bob",
        work_style_preference="Independent",
        calendar_availability="Mon 9-17, Tue 9-17, Wed 9-17",
        years_of_experience=5,
        skills=[sql, data_an, react_a, ml],
    )
    carol = TeamMember(
        name="Carol",
        work_style_preference="Collaborative",
        calendar_availability="Mon 10-12, Mon 13-16, Thu 9-15, Fri 14-16, Tue 9-12, Wed 14-17",
        years_of_experience=4,
        skills=[python, writing, sql, data_an, nodejs, react_a, research],
    )
    dave = TeamMember(
        name="Dave",
        work_style_preference="Collaborative",
        calendar_availability="Fri 10-12",
        years_of_experience=1,
        skills=[react_b, nodejs, ts],
    )
    eve = TeamMember(
        name="Eve",
        work_style_preference="Independent",
        calendar_availability=None,  # unavailable — always ineligible
        years_of_experience=8,
        skills=[python, writing, sql, data_an, research, ml],
    )
    frank = TeamMember(
        name="Frank",
        work_style_preference="Independent",
        calendar_availability="Mon 9-12, Wed 9-12, Fri 9-12",
        years_of_experience=7,
        skills=[python, devops, docker, testing, sql],
    )
    grace = TeamMember(
        name="Grace",
        work_style_preference="Collaborative",
        calendar_availability="Mon 10-17, Tue 10-17, Wed 10-17, Thu 10-17, Fri 10-15",
        years_of_experience=2,
        skills=[react_b, react_a, ts, nodejs, uiux, comms],
    )
    hiro = TeamMember(
        name="Hiro",
        work_style_preference="Independent",
        calendar_availability="Tue 9-13, Thu 9-13",
        years_of_experience=6,
        skills=[python, ml, data_an, sql, docker],
    )
    db.add_all([alice, bob, carol, dave, eve, frank, grace, hiro])

    # ── Tasks (10) — varied priority, size, and skill overlap ──────────
    task1 = Task(
        task_name="Literature Review",
        deadline="2026-02-28",
        estimated_time=5.0,
        priority_order=1,
        required_skills=[writing],
    )
    task2 = Task(
        task_name="API Integration",
        deadline="2026-03-01",
        estimated_time=2.0,
        priority_order=3,
        required_skills=[react_b, nodejs],
    )
    task3 = Task(
        task_name="Database Optimization",
        deadline="2026-03-02",
        estimated_time=3.0,
        priority_order=2,
        required_skills=[sql, data_an],
    )
    task4 = Task(
        task_name="Market Research",
        deadline="2026-03-05",
        estimated_time=4.0,
        priority_order=4,
        required_skills=[research],
    )
    task5 = Task(
        task_name="Script Migration",
        deadline="2026-03-10",
        estimated_time=6.0,
        priority_order=5,
        required_skills=[python],
    )
    task6 = Task(
        task_name="ML Model Training",
        deadline="2026-03-07",
        estimated_time=8.0,
        priority_order=1,
        required_skills=[python, ml],
    )
    task7 = Task(
        task_name="CI/CD Pipeline Setup",
        deadline="2026-03-08",
        estimated_time=3.0,
        priority_order=2,
        required_skills=[devops, docker],
    )
    task8 = Task(
        task_name="Frontend Redesign",
        deadline="2026-03-12",
        estimated_time=5.0,
        priority_order=3,
        required_skills=[react_a, uiux],
    )
    task9 = Task(
        task_name="Integration Testing",
        deadline="2026-03-15",
        estimated_time=2.5,
        priority_order=4,
        required_skills=[testing, python],
    )
    task10 = Task(
        task_name="Dashboard Analytics",
        deadline="2026-03-20",
        estimated_time=4.0,
        priority_order=5,
        required_skills=[sql, data_an, python],
    )
    db.add_all([task1, task2, task3, task4, task5, task6, task7, task8, task9, task10])

    db.commit()
    db.close()
    print("✅ Seed inserted: 15 skills, 8 team members, 10 tasks")
    print()
    print("   Member profiles:")
    print("   - Alice  3yr  2 slots  [Python, Writing, Node.js]")
    print("   - Bob    5yr  3 slots  [SQL, Data Analysis, React, ML]")
    print("   - Carol  4yr  6 slots  [Python, Writing, SQL, Data Analysis, Node.js, React, Research]")
    print("   - Dave   1yr  1 slot   [React, Node.js, TypeScript]")
    print("   - Eve    8yr  0 slots  [Python, Writing, SQL, Data Analysis, Research, ML] ← always ineligible")
    print("   - Frank  7yr  3 slots  [Python, DevOps, Docker, Testing, SQL]")
    print("   - Grace  2yr  5 slots  [React, TypeScript, Node.js, UI/UX, Communication]")
    print("   - Hiro   6yr  2 slots  [Python, ML, Data Analysis, SQL, Docker]")
    print()
    print("   Strategy differentiators:")
    print("   - Automatic  → Carol, Bob, Frank score high (MCDM multi-factor)")
    print("   - Fast       → availability-heavy: Carol, Grace, Bob rise")
    print("   - Balanced   → spreads across Alice, Bob, Dave, Frank, Grace, Hiro")
    print("   - Constraint → same eligible set, workload tiebreaker")


if __name__ == "__main__":
    reset = "--reset" in sys.argv
    seed(reset=reset)
