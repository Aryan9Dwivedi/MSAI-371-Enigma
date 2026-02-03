from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, func
from sqlalchemy.orm import relationship
from sqlalchemy.ext.associationproxy import association_proxy

from app.db.base import Base

# task B cannot be assigned until task A is done (B depends on A)
class TaskDependency(Base):
    __tablename__ = "task_dependencies"

    task_id = Column(ForeignKey("tasks.id"), primary_key=True)  # the task that has the dependency
    depends_on_task_id = Column(ForeignKey("tasks.id"), primary_key=True)  # prerequisite

    task = relationship("Task", foreign_keys=[task_id], back_populates="dependency_records")
    depends_on_task = relationship("Task", foreign_keys=[depends_on_task_id])


# task needs skill + minimum level (e.g. Literature Review needs Writing at least intermediate)
class TaskRequiredSkill(Base):
    __tablename__ = "task_required_skills"

    task_id = Column(ForeignKey("tasks.id"), primary_key=True)
    skill_id = Column(ForeignKey("skills.id"), primary_key=True)
    proficiency_minimum = Column(String, nullable=True)  # beginner/intermediate/advanced

    task = relationship("Task", back_populates="required_skill_associations")
    skill = relationship("Skill", back_populates="task_associations")


# who has what skill + how good. alice can be advanced at python, bob beginner
class TeamMemberSkill(Base):
    __tablename__ = "team_member_skills"

    team_member_id = Column(ForeignKey("team_members.id"), primary_key=True)
    skill_id = Column(ForeignKey("skills.id"), primary_key=True)
    proficiency_level = Column(String, nullable=True)  # beginner/intermediate/advanced

    team_member = relationship("TeamMember", back_populates="skill_associations")
    skill = relationship("Skill", back_populates="member_associations")


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)  # admin/manager/employee
    description = Column(String(255), nullable=True)

    team_members = relationship("TeamMember", back_populates="role")


class TimeSlot(Base):
    """structured availability: when a member is free to work"""

    __tablename__ = "time_slots"

    id = Column(Integer, primary_key=True, index=True)
    team_member_id = Column(ForeignKey("team_members.id"), nullable=False)

    start_at = Column(DateTime, nullable=False)
    end_at = Column(DateTime, nullable=False)
    recurrence = Column(String(50), nullable=True)  # weekly/daily/null

    team_member = relationship("TeamMember", back_populates="time_slots")


class TeamMember(Base):
    __tablename__ = "team_members"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=True)
    role_id = Column(ForeignKey("roles.id"), nullable=True)

    work_style_preference = Column(String(255), nullable=True)
    calendar_availability = Column(String(500), nullable=True)  # legacy fallback, prefer time_slots
    workload_limit_hours = Column(Float, nullable=True)  # weekly cap

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    role = relationship("Role", back_populates="team_members")
    skill_associations = relationship("TeamMemberSkill", back_populates="team_member", cascade="all, delete-orphan")
    skills = association_proxy("skill_associations", "skill")
    time_slots = relationship("TimeSlot", back_populates="team_member", cascade="all, delete-orphan")
    allocations = relationship("Allocation", back_populates="team_member")


class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    skill_name = Column(String(100), unique=True, nullable=False)
    skill_type = Column(String(20), nullable=False)  # hard/soft
    description = Column(String(255), nullable=True)

    member_associations = relationship("TeamMemberSkill", back_populates="skill", cascade="all, delete-orphan")
    team_members = association_proxy("member_associations", "team_member")
    task_associations = relationship("TaskRequiredSkill", back_populates="skill", cascade="all, delete-orphan")
    tasks = association_proxy("task_associations", "task")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    task_name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)

    deadline = Column(String(50), nullable=True)
    estimated_time = Column(Float, nullable=True)
    priority_order = Column(Integer, nullable=True)
    status = Column(String(20), nullable=True, default="todo")  # todo/in_progress/done/cancelled

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    required_skill_associations = relationship("TaskRequiredSkill", back_populates="task", cascade="all, delete-orphan")
    required_skills = association_proxy("required_skill_associations", "skill")
    dependency_records = relationship(
        "TaskDependency",
        foreign_keys="TaskDependency.task_id",
        back_populates="task",
        cascade="all, delete-orphan",
    )
    depends_on = association_proxy("dependency_records", "depends_on_task")
    allocations = relationship("Allocation", back_populates="task")


# who got which task + why
class AllocationRun(Base):
    """one allocation batch - groups all assignments from a single run"""

    __tablename__ = "allocation_runs"

    id = Column(Integer, primary_key=True, index=True)
    run_at = Column(DateTime, server_default=func.now())
    notes = Column(String(255), nullable=True)

    allocations = relationship("Allocation", back_populates="run", cascade="all, delete-orphan")


class Allocation(Base):
    """one person, one task, plus the reason we picked them"""

    __tablename__ = "allocations"

    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(ForeignKey("allocation_runs.id"), nullable=False)
    team_member_id = Column(ForeignKey("team_members.id"), nullable=False)
    task_id = Column(ForeignKey("tasks.id"), nullable=False)

    explanation = Column(Text, nullable=True)
    status = Column(String(20), nullable=True, default="pending")  # pending/completed/cancelled

    team_member = relationship("TeamMember", back_populates="allocations")
    task = relationship("Task", back_populates="allocations")
    run = relationship("AllocationRun", back_populates="allocations")
