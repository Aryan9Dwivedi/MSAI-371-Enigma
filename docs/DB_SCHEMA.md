# KRAFT Database Schema

Schema lives in `backend/app/db/models.py`. SQLite, file at `backend/kraft.db`.

---

## Overview

We store people, their skills and availability, tasks and what they need, and who got assigned what (plus the reason). The allocator reads this, runs its rules, and writes new assignments.

Flow: people have skills + time slots → tasks need skills + may depend on other tasks → allocator matches and assigns → we log each run and each assignment.

---

## Diagram

Table relationships (connected via foreign keys):

```
Role
    ↓ one role → many members
TeamMember
    ├── time_slots (member's available time slots)
    ├── team_member_skills ──→ Skill (which skills each member has)
    └── allocations (which tasks each member has been assigned)

Skill
    └── task_required_skills ──→ Task (which skills each task needs)

Task
    ├── task_dependencies (B depends on A)
    └── allocations (which tasks have been assigned to whom)

AllocationRun (one allocation run)
    └── allocations (all assignments from this run)

Allocation
    ├── → TeamMember
    └── → Task
```

---

## Reasoning Engine Constraints

**Hard constraints** (filter out invalid candidates):

| Check | Tables | Logic |
|-------|--------|-------|
| Has required skills | team_member_skills, task_required_skills | person's proficiency_level ≥ task's proficiency_minimum for each required skill |
| Enough time before deadline | time_slots, tasks | sum of slot hours before deadline ≥ estimated_time |
| Not overloaded | allocations, workload_limit_hours | current active task hours + new task ≤ workload_limit_hours |
| Prereqs done | task_dependencies, task status | all depends_on_task_id rows have status = done |

**Soft** (prefer but not required): higher proficiency, more years of experience, more even workload, match work_style_preference, team/department alignment.

**Output:** allocation_runs (one per run) + allocations (person, task, explanation).

**Proficiency order:** beginner < intermediate < advanced.

---

## Tables

### roles

Admin, manager, employee. Controls who can run the allocator.

| Field | Type |
|-------|------|
| id | Integer |
| name | String (admin/manager/employee) |
| description | String |

---

### team_members

People on the team.

| Field | Type |
|-------|------|
| id | Integer |
| name | String |
| email | String |
| role_id | FK → roles |
| team | String (e.g., "Engineering", "Marketing", "Product") |
| department | String (e.g., "Software Development", "Data Science") |
| work_style_preference | String |
| calendar_availability | String (legacy, use time_slots instead) |
| workload_limit_hours | Float |
| resume_text | Text (extracted/parsed resume content) |
| resume_file_path | String (path to uploaded resume file) |
| created_at, updated_at | DateTime |

---

### time_slots

When each person is available. One row per slot (start_at, end_at).

| Field | Type |
|-------|------|
| id | Integer |
| team_member_id | FK → team_members |
| start_at | DateTime |
| end_at | DateTime |
| recurrence | String (weekly/daily/null) |

---

### skills

Skill catalog (Python, Writing, etc). Proficiency lives on the member–skill link, not here.

| Field | Type |
|-------|------|
| id | Integer |
| skill_name | String |
| skill_type | String (hard/soft) |
| description | String |

---

### team_member_skills

Who has what skill and at what level. Same skill, different people = different levels.

| Field | Type |
|-------|------|
| team_member_id | FK |
| skill_id | FK |
| proficiency_level | String (beginner/intermediate/advanced) |
| years_of_experience | Float (years of experience with this specific skill) |

---

### tasks

Work to be done.

| Field | Type |
|-------|------|
| id | Integer |
| task_name | String |
| description | Text |
| deadline | String |
| estimated_time | Float |
| priority_order | Integer |
| status | String (todo/in_progress/done/cancelled) |
| created_at, updated_at | DateTime |

---

### task_required_skills

Which skill a task needs and the minimum level. e.g. Literature Review needs Writing at least intermediate.

| Field | Type |
|-------|------|
| task_id | FK |
| skill_id | FK |
| proficiency_minimum | String |

---

### task_dependencies

B can't be assigned until A is done. task_id = B, depends_on_task_id = A.

| Field | Type |
|-------|------|
| task_id | FK |
| depends_on_task_id | FK |

---

### allocation_runs

One row per allocator run.

| Field | Type |
|-------|------|
| id | Integer |
| run_at | DateTime |
| notes | String |

---

### allocations

One row per assignment. Who got which task, and why.

| Field | Type |
|-------|------|
| id | Integer |
| run_id | FK → allocation_runs |
| team_member_id | FK → team_members |
| task_id | FK → tasks |
| explanation | Text |
| status | String (pending/completed/cancelled) |

---

## Relationships

- Role → TeamMember (1-to-many)
- TeamMember → TimeSlot (1-to-many)
- TeamMember ↔ Skill via team_member_skills
- Task ↔ Skill via task_required_skills
- Task → Task via task_dependencies
- AllocationRun → Allocation (1-to-many)
- Allocation → TeamMember, Task
