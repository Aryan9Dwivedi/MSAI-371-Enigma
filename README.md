# KRAFT — Knowledge-Reasoned Allocation For Teams

**KRAFT** is a Knowledge Representation & Reasoning (KRR) project that builds an explainable task allocation system. Using structured knowledge (skills, tasks, availability) and intelligent reasoning, KRAFT intelligently assigns tasks to team members based on their capabilities and capacity.

---

## 🎯 What is KRAFT?

KRAFT combines knowledge representation with reasoning logic to solve the task allocation problem transparently. Rather than a black-box approach, every task assignment includes a clear explanation of why a particular team member was selected.

**Key features:**
- Skill-based matching between tasks and team members
- Availability-aware scheduling
- Explainable reasoning for all allocations
- Clean, intuitive interface for team management

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React + TypeScript + Vite + TailwindCSS v4 |
| **Backend** | FastAPI + SQLAlchemy |
| **Database** | SQLite (via SQLAlchemy ORM) |
| **State Management** | React Query |

---

## 📁 Repository Structure

```
KRAFT/
├── frontend/          # React UI application
├── backend/           # FastAPI backend + reasoning logic
├── docs/              # Documentation, screenshots, setup guides
├── scripts/           # Helper scripts for development
└── README.md          # This file
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v16+) with npm
- **Python** (v3.9+)
- **Git**

### Get Up and Running

**1. Clone the repository:**
```bash
git clone <repository-url>
cd KRAFT
```

**2. Follow the detailed setup guide:**
```bash
See: docs/SETUP.md
```

This guide includes step-by-step instructions for:
- Setting up the frontend
- Setting up the backend
- Configuring the database
- Running both services locally

---

## 📚 Documentation

- **`docs/SETUP.md`** — Complete setup and installation guide
- **`docs/DB_SCHEMA.md`** — Database schema (tables, fields, relations) — single source of truth
- **`docs/ARCHITECTURE.md`** — System design and reasoning logic
- **`docs/CONTRIBUTING.md`** — Contribution guidelines and branch workflow

---

## 🏃 Development Workflow

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at: `http://localhost:5173`

### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
Backend runs at: `http://localhost:8000`
API docs: `http://localhost:8000/docs`

### Both Together
Run the frontend and backend in separate terminals simultaneously for local development.

---

## 🗄️ Database

KRAFT uses **SQLite** for local development. Data is stored in `backend/kraft.db`. The database is created automatically on first backend startup.

**Schema:**
- Full reference: `docs/DB_SCHEMA.md`
- Main tables: TeamMember, Skill, Task, Role, TimeSlot, AllocationRun, Allocation + link tables
- Members have skills + proficiency + time_slots; tasks require skills + proficiency_minimum + prerequisite tasks done (task_dependencies)

**Access the database:**
- Use the **SQLite** VS Code extension (by alexcvzz) to browse tables and data
- View API docs at `http://localhost:8000/docs`

**Seed sample data (optional):**
```bash
cd backend
python seed.py
```

---

## 👥 Collaboration

**Before you start:**
1. Read `docs/CONTRIBUTING.md`
2. Create your own feature branch
3. Keep frontend and backend changes separate
4. Submit pull requests into the `dev` branch (never direct to `main`)

**Important:**
- ❌ Never commit `.env` files or `backend/kraft.db`
- ✅ Each team member generates their own local database
- ✅ Use feature branches for all work

---

## 📋 Key Resources

| Resource | Purpose |
|----------|---------|
| `docs/SETUP.md` | Complete setup instructions |
| `docs/DB_SCHEMA.md` | Database schema reference |
| `http://localhost:8000/docs` | Interactive API documentation (Swagger) |
| `backend/.env.example` | Backend environment variables template |
| `frontend/.env.example` | Frontend environment variables template |

---

## 🤝 Get Involved

KRAFT is actively in development. To contribute:

1. **Read the setup guide** → `docs/SETUP.md`
2. **Check contribution guidelines** → `docs/CONTRIBUTING.md` (when available)
3. **Create a feature branch** from `dev`
4. **Make your changes** in the appropriate directory (`/frontend` or `/backend`)
5. **Submit a pull request** with a clear description

---

## 📝 License

[Add your license information here]

---

## 📧 Questions?

For setup help, refer to the troubleshooting section in `docs/SETUP.md`. For architectural questions, check back soon for `docs/ARCHITECTURE.md`.