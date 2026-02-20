# KRAFT Database Schema (Current)

Source of truth: `backend/app/db/models.py`  
Database engine: SQLite (`backend/kraft.db`)

---

## Overview

The current schema is intentionally lightweight and supports:

1. Team members and their profile metadata
2. Skills catalog
3. Tasks to allocate
4. Many-to-many links:
   - member ↔ skills
   - task ↔ required skills
5. Assignment persistence via `tasks.assignee_id`

The allocation engine (`backend/app/services/reasoning.py`) reads from these tables, runs FOPC + MCDM scoring, and optionally writes assignments back to `tasks.assignee_id`.

---

## ER-style Relationship Summary

```
team_members
  ├─< team_member_skills >─┐
  │                        │
  └─────────────────────── skills

tasks
  ├─< task_required_skills >─ skills
  └─ assignee_id ────────────> team_members.id
```

---

## Tables

### 1) `team_members`

Stores candidate assignees.

| Field | Type | Notes |
|---|---|---|
| `id` | Integer (PK) | Primary key |
| `name` | String | Unique, required |
| `work_style_preference` | String | Optional |
| `calendar_availability` | String | Optional (currently string-based availability) |
| `years_of_experience` | Integer | Optional |
| `resume_path` | String | Optional (path/reference for resume source) |

---

### 2) `skills`

Skill catalog shared across members and tasks.

| Field | Type | Notes |
|---|---|---|
| `id` | Integer (PK) | Primary key |
| `skill_name` | String | Required |
| `skill_type` | String | Required (`hard`/`soft`) |
| `proficiency_level` | String | Optional metadata |

---

### 3) `tasks`

Units of work that can be allocated.

| Field | Type | Notes |
|---|---|---|
| `id` | Integer (PK) | Primary key |
| `task_name` | String | Unique, required |
| `deadline` | String | Optional |
| `estimated_time` | Float | Optional (hours) |
| `priority_order` | Integer | Optional (lower = higher priority) |
| `assignee_id` | Integer (FK → `team_members.id`) | Nullable; null means unassigned |

---

### 4) `team_member_skills` (association table)

Many-to-many link between members and skills.

| Field | Type | Notes |
|---|---|---|
| `team_member_id` | Integer (FK) | PK part 1 |
| `skill_id` | Integer (FK) | PK part 2 |

Composite primary key: (`team_member_id`, `skill_id`)

---

### 5) `task_required_skills` (association table)

Many-to-many link between tasks and required skills.

| Field | Type | Notes |
|---|---|---|
| `task_id` | Integer (FK) | PK part 1 |
| `skill_id` | Integer (FK) | PK part 2 |

Composite primary key: (`task_id`, `skill_id`)

---

## What Is Not In the Current Schema

The following entities are **not** present in the current code/database:

- `roles`
- `time_slots`
- `task_dependencies`
- `allocation_runs`
- `allocations`

If these are needed later, they should be introduced via migration and model updates.

---

## Allocation Read/Write Behavior (Current)

- Read:
  - Unassigned tasks: `tasks.assignee_id IS NULL`
  - Candidate members: `team_members`
  - Skill edges from link tables
- Write (when `apply=true`):
  - Update `tasks.assignee_id = chosen_member_id`

No separate allocation history table exists yet in this schema.
