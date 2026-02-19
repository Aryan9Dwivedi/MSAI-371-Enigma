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



The database stores the structured knowledge required for reasoning.



\### Core Entities

\- \*\*TeamMember\*\*

&nbsp; - name

&nbsp; - work\_style\_preference

&nbsp; - calendar\_availability

&nbsp; - linked skills



\- \*\*Skill\*\*

&nbsp; - skill\_name

&nbsp; - skill\_type (hard/soft)

&nbsp; - proficiency\_level



\- \*\*Task\*\*

&nbsp; - task\_name

&nbsp; - deadline

&nbsp; - estimated\_time

&nbsp; - priority\_order

&nbsp; - required skills



\### Relationships

\- TeamMember ⟷ Skill (many-to-many)

\- Task ⟷ Skill (many-to-many)



This supports reasoning such as:



✅ “Who has required skills?”  

✅ “Who is available / not overloaded?”  

✅ “Which task should be prioritized first?”



---



\## 6) Reasoning Layer

The reasoning engine is implemented in `backend/app/services/reasoning.py`.



\### Inputs

\- Tasks + constraints (from DB; optionally filtered by `task_ids` / `team_member_ids`)

\- Team members + skills + availability



\### Output

\- Task assignments with explanation (constraints satisfied, why preferred/rejected)



\### Reasoning Types

\- **Constraint satisfaction** — members must have all required skills for a task

\- **Rule-based filtering** — required skills, workload eligibility

\- **Weighted scoring** — workload balance (prefer less-loaded members)

\- **Explainability** — per-candidate reasons, rejection explanations



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

