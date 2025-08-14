@echo off
echo Starting AI Learning Backend with Clean Logging...
echo.

REM Activate virtual environment
call ".venv\Scripts\Activate.bat"

REM Change to backend directory and start server
cd backend
python start_server.py

pause
