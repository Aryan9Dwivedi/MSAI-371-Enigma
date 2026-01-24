from sqlalchemy import Column, Integer, String, Float, Table, ForeignKey
from sqlalchemy.orm import relationship

from app.db.base import Base

team_member_skills = Table(
    "team_member_skills",
    Base.metadata,
    Column("team_member_id", ForeignKey("team_members.id"), primary_key=True),
    Column("skill_id", ForeignKey("skills.id"), primary_key=True),
)

task_required_skills = Table(
    "task_required_skills",
    Base.metadata,
    Column("task_id", ForeignKey("tasks.id"), primary_key=True),
    Column("skill_id", ForeignKey("skills.id"), primary_key=True),
)

class TeamMember(Base):
    __tablename__ = "team_members"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)

    work_style_preference = Column(String, nullable=True)
    calendar_availability = Column(String, nullable=True)  # can store JSON later

    skills = relationship("Skill", secondary=team_member_skills, back_populates="team_members")


class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    skill_name = Column(String, unique=True, nullable=False)
    skill_type = Column(String, nullable=False)  # hard/soft
    proficiency_level = Column(String, nullable=True)

    team_members = relationship("TeamMember", secondary=team_member_skills, back_populates="skills")
    tasks = relationship("Task", secondary=task_required_skills, back_populates="required_skills")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    task_name = Column(String, unique=True, nullable=False)

    deadline = Column(String, nullable=True)
    estimated_time = Column(Float, nullable=True)
    priority_order = Column(Integer, nullable=True)

    required_skills = relationship("Skill", secondary=task_required_skills, back_populates="tasks")
