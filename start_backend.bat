@echo off
echo ===================================================
echo Starting Gonnit Identity & Recovery Backend (FastAPI)...
echo ===================================================
cd backend
call .\venv\Scripts\activate
python run.py
pause
