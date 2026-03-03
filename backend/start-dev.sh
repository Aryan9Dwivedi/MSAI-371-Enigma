#!/bin/bash
# Start backend with auto-reload — no manual restart needed after code changes
cd "$(dirname "$0")"
source venv/bin/activate
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
