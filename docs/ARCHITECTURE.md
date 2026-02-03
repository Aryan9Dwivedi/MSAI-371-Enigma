\# KRAFT Architecture — Knowledge-Reasoned Allocation For Teams



This document describes the high-level system design for \*\*KRAFT\*\*, an explainable task allocation system built for a KRR course project.



---



\## 1) System Goal



KRAFT automatically assigns tasks to team members using structured knowledge and reasoning over constraints such as:



\- required skills

\- workload/availability

\- task priority and deadlines

\- fairness and balanced distribution



The system is designed to support \*\*transparent, explainable decisions\*\*, rather than black-box predictions.



---



\## 2) Tech Stack



\### Frontend

\- \*\*React + TypeScript + Vite\*\*

\- \*\*TailwindCSS\*\* (UI styling)

\- \*\*React Query\*\* (API caching + stable fetching)



\### Backend

\- \*\*FastAPI\*\*

\- \*\*Pydantic\*\* (request/response validation)

\- \*\*SQLAlchemy\*\* (ORM / database layer)



\### Database

\- \*\*SQLite\*\* in development (`backend/kraft.db`)

\- Designed to be upgradeable to \*\*Postgres\*\* later using only `DATABASE\_URL`



---



\## 3) Repository Structure



MSAI-371-Enigma/

frontend/ # UI application

src/

components/ # Reusable UI components

pages/ # Screens (Tasks, Members, Allocation)

api/ # API client functions

backend/ # API + Reasoning system

app/

api/routes/ # API endpoints

core/ # config \& settings

db/ # database models \& session

schemas/ # request/response schemas

services/ # reasoning + business logic

docs/ # documentation

scripts/ # helper scripts



yaml

Copy code



---



\## 4) Backend Architecture



The backend is organized to separate concerns cleanly:



\### `api/routes/`

\- Defines HTTP endpoints

\- Should remain thin (no heavy logic inside)



\### `services/`

\- Core logic lives here (reasoning + scoring)

\- Encapsulates task allocation decisions



\### `db/`

\- SQLAlchemy models and session handling

\- SQLite used locally for fast onboarding



\### `schemas/`

\- Pydantic models used for validation and API responses



---



\## 5) Knowledge Model (Database Representation)



The database stores the structured knowledge required for reasoning. **See `docs/DB_SCHEMA.md` for the full schema.**

\### Core Entities

\- **Role** — admin, manager, employee (permission levels)
\- **TeamMember** — name, email, role, work\_style\_preference, workload\_limit\_hours
\- **TimeSlot** — start\_at, end\_at, recurrence; when each member is available (structured availability)
\- **Skill** — skill\_name, skill\_type (hard/soft), description (proficiency is on member-skill link)
\- **Task** — task\_name, description, deadline, estimated\_time, priority\_order, status
\- **TaskDependency** — task depends on prerequisite (B cannot be assigned until A is done)
\- **AllocationRun** + **Allocation** — assignment history with explanations

\### Relationships

\- Role → TeamMember (1-to-many)
\- TeamMember → TimeSlot (1-to-many); structured availability for reasoning
\- TeamMember ⟷ Skill (many-to-many via team\_member\_skills, with proficiency\_level per member)
\- Task ⟷ Skill (many-to-many via task\_required\_skills, with proficiency\_minimum)
\- Task → Task (via task\_dependencies; B depends on A)
\- AllocationRun → Allocation; Allocation links TeamMember + Task



This supports reasoning such as:



✅ “Who has required skills?”  

✅ “Who is available / not overloaded?”  

✅ “Which task should be prioritized first?”

✅ “Are prerequisite tasks done before assigning?”



---



\## 6) Reasoning Layer (Planned)



The reasoning engine will be implemented in `backend/app/services/`.



\### Inputs

\- Tasks + constraints

\- Team members + skills + availability



\### Output

\- Task assignments with explanation



\### Reasoning Types (planned)

\- Constraint satisfaction (hard constraints)

\- Rule-based filtering (required skills / deadlines / prerequisite tasks done)

\- Weighted scoring (fairness + workload balance)

\- Optional: graph-based reasoning over skill/task relationships



---



\## 7) Explainability (Core USP)



The reasoning engine will output not only the assignment, but also:



\- which constraints were satisfied

\- why certain members were preferred

\- why certain members were rejected



Example explanation:



> “Alice assigned Task A because she has Python + availability before the deadline, and her current workload is below the team average.”



---



\## 8) API Design (Planned)



Minimal scaffold currently provides:



\- `/health`

\- `/db/ping`



Next planned endpoints:

\- `/team-members`

\- `/skills`

\- `/tasks`

\- `/allocate` (runs reasoning + returns explanation)



---



\## 9) Future Extensions (Optional)



Possible improvements after MVP:



\- Postgres migration for multi-user persistence

\- UI dashboard with workload visualization

\- Allocation history + audit trail

\- Constraints editor (rule tuning via UI)

\- More advanced scheduling (time slots, durations)



---



\## 10) Development Principles



\- Keep repo beginner-friendly for teammates

\- Minimal setup friction (no Docker required)

\- Maintain clean separation of concerns

\- Always prioritize explainable reasoning decisions

