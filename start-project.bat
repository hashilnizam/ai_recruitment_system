@echo off
title AI Recruitment System Launcher
color 0A

echo ========================================
echo   AI Recruitment System Launcher
echo ========================================
echo.

:: Check if Laragon MySQL is running
echo [1/4] Checking MySQL service...
"C:\laragon\bin\mysql\mysql-8.4.3-winx64\bin\mysql.exe" -u root -proot -e "SELECT 1;" 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ MySQL is not running!
    echo Please start Laragon and ensure MySQL is running.
    echo Then run this script again.
    pause
    exit /b 1
) else (
    echo ✅ MySQL is running
)

:: Start Backend API
echo.
echo [2/4] Starting Backend API...
cd /d "%~dp0backend"
start "Backend API" cmd /k "title Backend API && npm start"
echo ✅ Backend API starting on port 5000...

:: Wait a moment for backend to start
timeout /t 3 >nul

:: Start AI Service
echo.
echo [3/4] Starting AI Service...
cd /d "%~dp0ai-service"
start "AI Service" cmd /k "title AI Service && powershell -Command \"venv\Scripts\activate.ps1; python app.py\""
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
