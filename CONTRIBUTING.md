\# Contributing to KRAFT



Thank you for contributing to \*\*KRAFT (Knowledge-Reasoned Allocation For Teams)\*\*.

This document explains how to work in the repo cleanly, avoid conflicts, and ship features fast.



---



\## 1) Setup



Follow the official setup guide:



📌 `docs/SETUP.md`



---



\## 2) Repo Rules (must follow)



\### ✅ Do not commit these

These are local-only and should never be pushed:

\- `frontend/node\_modules/`

\- `backend/.venv/`

\- `backend/kraft.db`

\- any `.env` files



These are already covered in `.gitignore`.



---



\## 3) Branching Workflow



\### Create a feature branch

Never work directly on `main`.



```bash

git checkout -b feature/<your-feature-name>



