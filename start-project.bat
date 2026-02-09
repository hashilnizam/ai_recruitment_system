@echo off
title AI Recruitment System Launcher
color 0A

echo ========================================
echo   AI Recruitment System Launcher
echo ========================================
echo.

:: Check if XAMPP MySQL is running
echo [1/4] Checking MySQL service...
tasklist /FI "IMAGENAME eq mysqld.exe" 2>NUL | find /I "mysqld.exe" >NUL
if %ERRORLEVEL% neq 0 (
    echo ❌ MySQL is not running!
    echo Starting MySQL...
    start "" "C:\xampp\mysql\bin\mysqld.exe" --defaults-file=C:\xampp\mysql\bin\my.ini
    timeout /t 3 >nul
    echo ✅ MySQL started
) else (
    echo ✅ MySQL is already running
)

:: Start Backend API
echo.
echo [2/4] Starting Backend API...
cd /d "%~dp0backend"
start "Backend API" cmd /k "title Backend API && npm run dev"
echo ✅ Backend API starting on port 5000...

:: Wait a moment for backend to start
timeout /t 3 >nul

:: Start AI Service
echo.
echo [3/4] Starting AI Service...
cd /d "%~dp0ai-service"
start "AI Service" cmd /k "title AI Service && venv\Scripts\activate && python app.py"
echo ✅ AI Service starting on port 5001...

:: Wait a moment for AI service to start
timeout /t 3 >nul

:: Start Frontend
echo.
echo [4/4] Starting Frontend...
cd /d "%~dp0frontend"
start "Frontend" cmd /k "title Frontend && npm run dev"
echo ✅ Frontend starting on port 3000...

:: Final instructions
echo.
echo ========================================
echo   🚀 All Services Starting!
echo ========================================
echo.
echo 📱 Frontend: http://localhost:3000
echo 🔧 Backend:  http://localhost:5000
echo 🤖 AI Service: http://localhost:5001
echo.
echo 🔑 Test Accounts:
echo    Recruiter: recruiter1@techcorp.com / Password123!
echo    Candidate: candidate1@email.com / Password123!
echo.
echo ⏳ Waiting for services to fully start...
echo.

:: Wait for services to be ready
timeout /t 10 >nul

:: Try to open the frontend in browser
echo 🌐 Opening application in browser...
start http://localhost:3000

echo.
echo ✨ AI Recruitment System is ready!
echo.
echo Press any key to stop all services...
pause >nul

:: Stop all services
echo.
echo 🛑 Stopping all services...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM python.exe >nul 2>&1
echo ✅ All services stopped

pause
