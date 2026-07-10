@echo off
echo ===================================================
echo             HireMate AI SaaS Launcher
echo ===================================================
echo.
echo Starting FastAPI Backend REST API...
start cmd /k "cd backend && .\venv\Scripts\python -m uvicorn app.main:app --reload"
echo FastAPI REST API launched.
echo.
echo Starting React Vite Frontend...
start cmd /k "cd frontend && npm run dev"
echo React frontend launched.
echo.
echo ===================================================
echo Done! Open http://localhost:5173 in your browser.
echo ===================================================
pause
