# Changelog

## [Unreleased] — 2026-03-02

### Allocation & Explanation

- **Run Summary**: Natural-language run-level explanation (no jargon, no bullet lists). Shows outcome, workload distribution, and unassigned reason.
- **Task explanation**: "Why X over Y" style with lead sentence, comparison points (experience, predicted hours, availability), and conclusion.
- **Unassigned tasks**: Each unassigned task now includes a `reason` field (e.g. "No team member has required skills: DevOps & CI/CD").
- **Second-round allocation**: New "Second round" flow when tasks cannot be assigned in the first run. Uses partial skill match (relaxed rules): picks the member with highest skill overlap, then workload fairness, then experience. Returns candidate_explanations for "Why X over Y" comparison.
- **Technical details**: Skill match, constraints, inference trace moved into a collapsible "Technical details" section (hidden by default).

### Backend

- **`AllocateRequest`**: Added `force_round`, `prior_assignments` for second-round allocation.
- **`UnassignedTask`**: Added `reason` field.
- **`Assignment`**: Added `force_assigned` flag for second-round assignments.
- **Database path**: `DATABASE_URL` now resolves to `backend/kraft.db` regardless of working directory (fixes "0 members, 0 tasks" when backend started from project root).
- **`backend/start-dev.sh`**: Script to start backend with `--reload` for auto-restart on code changes.

### Seed Data

- **Demo for second round**: 3 unassigned tasks with varied skill overlap (67% vs 33%) to demo partial-match selection.
- **Tasks**: Set up CI/CD (DevOps+Python+Data Analysis), Blockchain Certificates (Blockchain+Data Analysis+AI Tools), Deploy on Kubernetes (Kubernetes+PM+Course Design).

### Frontend

- **Run Summary panel**: Title "Run Summary", premium styling, natural-language paragraphs.
- **Unassigned tasks panel**: Single-layer layout, "Second round" button, per-task reason.
- **Second-round UI**: Top 2 Candidates comparison for force-assigned tasks (overlap %, workload, experience), "Why X over Y" explanation.
- **Removed**: Redundant task-name + assignee panel; duplicate task rationale in right sidebar.

### Cursor Rules

- **`backend-patterns.mdc`**: Added dev workflow (start with `--reload`, restart on "刷新不出来").
