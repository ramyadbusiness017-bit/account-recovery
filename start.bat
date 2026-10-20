@echo off
echo ===================================================
echo Launching Gonnit Account Recovery Fullstack System...
echo ===================================================
start "Gonnit Backend (FastAPI)" cmd /k "call start_backend.bat"
timeout /t 2 /nobreak >nul
start "Gonnit Frontend (React+Vite)" cmd /k "call start_frontend.bat"
echo Both servers started!
echo Frontend: http://localhost:5173
echo Backend API Docs: http://localhost:8000/docs
