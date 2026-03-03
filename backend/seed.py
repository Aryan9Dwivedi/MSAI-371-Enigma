"""
Demo seed for AI Productivity 101 project.
Realistic department: 7 members, 6 tasks. Every task has 2+ eligible candidates.
Star demo: "Design AI Productivity 101 Course" — Noah (5 yrs) vs Ethan (2 yrs), same skills.
"""
from sqlalchemy.orm import Session

from app.db.session import SessionLocal, engine
from app.db.base import Base
from app.db.models import TeamMember, Skill, Task

Base.metadata.create_all(bind=engine)


def seed(force: bool = False):
    db: Session = SessionLocal()

    if db.query(Skill).count() > 0 and not force:
        print("Seed already exists. Run with --force to reset.")
        db.close()
        return

    if force:
        for t in db.query(Task).all():
            t.assignee_id = None
        db.commit()
        db.query(Task).delete()
        db.query(TeamMember).delete()
        db.query(Skill).delete()
        db.commit()
        print("Cleared existing data.")

    # Skills for productivity / course design
    s1 = Skill(skill_name="Instructional Design", skill_type="hard", proficiency_level="advanced")
    s2 = Skill(skill_name="Writing", skill_type="soft", proficiency_level="intermediate")
    s3 = Skill(skill_name="AI Tools", skill_type="hard", proficiency_level="intermediate")
    s4 = Skill(skill_name="Course Design", skill_type="hard", proficiency_level="intermediate")
    s5 = Skill(skill_name="Python", skill_type="hard", proficiency_level="intermediate")
    s6 = Skill(skill_name="Data Analysis", skill_type="hard", proficiency_level="intermediate")
    s7 = Skill(skill_name="Project Management", skill_type="soft", proficiency_level="intermediate")
    s8 = Skill(skill_name="DevOps & CI/CD", skill_type="hard", proficiency_level="advanced")
    s9 = Skill(skill_name="Blockchain", skill_type="hard", proficiency_level="advanced")
    s10 = Skill(skill_name="Kubernetes", skill_type="hard", proficiency_level="advanced")
    db.add_all([s1, s2, s3, s4, s5, s6, s7, s8, s9, s10])
    db.commit()

    # Noah: 5 yrs — strongest for course design (PRESENTATION STAR)
    noah = TeamMember(
        name="Noah",
        work_style_preference="Independent",
        calendar_availability="Mon 9-12, Tue 14-17, Thu 9-17",
        years_of_experience=5,
        resume_path=None,
        skills=[s1, s2, s3, s4, s5, s6],
    )
    # Ethan: 2 yrs — same skills as Noah, less experience (clear contrast for demo)
    ethan = TeamMember(
        name="Ethan",
        work_style_preference="Collaborative",
        calendar_availability="Mon 10-16, Wed 9-14, Fri 14-17",
        years_of_experience=2,
        resume_path=None,
        skills=[s1, s2, s3, s4],
    )
    # Sarah: 4 yrs — analytics and Python
    sarah = TeamMember(
        name="Sarah",
        work_style_preference="Collaborative",
        calendar_availability="Tue 9-12, Wed 14-17, Thu 10-16",
        years_of_experience=4,
        resume_path=None,
        skills=[s2, s4, s5, s6],
    )
    # Marcus: 6 yrs — senior, broad skills
    marcus = TeamMember(
        name="Marcus",
        work_style_preference="Independent",
        calendar_availability="Mon-Wed 9-17, Thu 10-15",
        years_of_experience=6,
        resume_path=None,
        skills=[s1, s2, s3, s4, s5, s7],
    )
    # Julia: 3 yrs — writing and design focus
    julia = TeamMember(
        name="Julia",
        work_style_preference="Collaborative",
        calendar_availability="Tue 10-16, Wed 9-14, Fri 9-12",
        years_of_experience=3,
        resume_path=None,
        skills=[s1, s2, s4, s7],
    )
    # David: 1 yr — junior, learning
    david = TeamMember(
        name="David",
        work_style_preference="Collaborative",
        calendar_availability="Mon 14-17, Wed 10-16, Fri 9-14",
        years_of_experience=1,
        resume_path=None,
        skills=[s2, s5, s6],
    )
    # Emma: 4 yrs — data and Python
    emma = TeamMember(
        name="Emma",
        work_style_preference="Independent",
        calendar_availability="Mon 9-12, Tue 14-17, Thu 9-16",
        years_of_experience=4,
        resume_path=None,
        skills=[s3, s4, s5, s6, s7],
    )
    db.add_all([noah, ethan, sarah, marcus, julia, david, emma])

    # STAR DEMO: Design AI Productivity 101 — Noah (5) vs Ethan (2), both have same 3 skills
    task1 = Task(
        task_name="Design AI Productivity 101 Course",
        deadline="2026-03-15",
        estimated_time=8.0,
        priority_order=1,
        required_skills=[s1, s2, s3],
    )
    task2 = Task(
        task_name="Build Course LMS Structure",
        deadline="2026-03-20",
        estimated_time=6.0,
        priority_order=2,
        required_skills=[s4, s5],
    )
    task3 = Task(
        task_name="Create Course Content Modules",
        deadline="2026-03-25",
        estimated_time=10.0,
        priority_order=3,
        required_skills=[s1, s2],
    )
    task4 = Task(
        task_name="Develop Analytics Dashboard",
        deadline="2026-03-28",
        estimated_time=5.0,
        priority_order=4,
        required_skills=[s5, s6],
    )
    task5 = Task(
        task_name="Write Course Syllabus",
        deadline="2026-04-01",
        estimated_time=4.0,
        priority_order=5,
        required_skills=[s1, s2, s7],
    )
    task6 = Task(
        task_name="Integrate AI Tools into Modules",
        deadline="2026-04-05",
        estimated_time=7.0,
        priority_order=6,
        required_skills=[s3, s4],
    )
    # Demo: 3 unassigned tasks — varied overlap for clear "Why X over Y" contrast
    # Task 7: DevOps + Python + Data Analysis — 67%: Noah,Sarah,David,Emma (s5,s6); 33%: Marcus (s5 only)
    task7 = Task(
        task_name="Set up CI/CD Pipeline for Course Platform",
        deadline="2026-04-10",
        estimated_time=6.0,
        priority_order=7,
        required_skills=[s8, s5, s6],
    )
    # Task 8: Blockchain + Data Analysis + AI Tools — 67%: Noah,Emma (s6,s3); 33%: Sarah,David (s6 only)
    task8 = Task(
        task_name="Implement Blockchain-Based Certificates",
        deadline="2026-04-12",
        estimated_time=10.0,
        priority_order=8,
        required_skills=[s9, s6, s3],
    )
    # Task 9: Kubernetes + PM + Course Design — 67%: Marcus,Julia,Emma (s7,s4); 50%: Noah (s4 only, no s7)
    task9 = Task(
        task_name="Deploy Course Platform on Kubernetes",
        deadline="2026-04-15",
        estimated_time=8.0,
        priority_order=9,
        required_skills=[s10, s7, s4],
    )
    db.add_all([task1, task2, task3, task4, task5, task6, task7, task8, task9])

    db.commit()
    db.close()
    print("Demo seed inserted: 10 skills, 7 team members, 9 tasks (3 unassigned for second-round demo)")
    print("Star demo: Design AI Productivity 101 Course — Noah (5 yrs) vs Ethan (2 yrs)")


if __name__ == "__main__":
    import sys
    force = "--force" in sys.argv or "-f" in sys.argv
    seed(force=force)
