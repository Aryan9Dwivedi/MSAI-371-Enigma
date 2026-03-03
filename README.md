# KRAFT — Knowledge-Reasoned Allocation For Teams

**KRAFT** is a Knowledge Representation & Reasoning (KRR) project that builds an explainable task allocation system. Using structured knowledge (skills, tasks, availability) and intelligent reasoning, KRAFT intelligently assigns tasks to team members based on their capabilities and capacity.

---

## 🎯 What is KRAFT?

KRAFT combines knowledge representation with reasoning logic to solve the task allocation problem transparently. Rather than a black-box approach, every task assignment includes a clear explanation of why a particular team member was selected.

**Key features:**
- Skill-based matching between tasks and team members
- Availability-aware scheduling
- Explainable reasoning for all allocations (natural-language "Why X over Y")
- Second-round allocation with partial skill match when no full match exists
- Run summary and per-task rationale
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
├── frontend_0.2/      # React UI application (Allocation, Tasks, etc.)
├── backend/           # FastAPI backend + reasoning logic
├── docs/              # Documentation
├── scripts/           # Helper scripts
└── README.md
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

- **`docs/README.md`** — Documentation index (start here)
- **`docs/SETUP.md`** — Complete setup and installation guide
- **`docs/DB_SCHEMA.md`** — Database schema (tables, fields, relations)
- **`docs/ARCHITECTURE.md`** — System design and reasoning logic

---

## 🏃 Development Workflow

### Frontend
```bash
cd frontend_0.2
npm install
npm run dev
```
Frontend runs at: `http://localhost:5173`

### Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
./start-dev.sh   # or: python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Backend runs at: `http://localhost:8000`. Use `--reload` for auto-restart on code changes.

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

**Seed demo data:**
```bash
cd backend
python3 seed.py --force   # Resets and inserts 9 tasks, 7 members, 3 unassigned for second-round demo
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