@echo off
echo 🚀 Starting All Services for AI Recruitment System
echo ================================================

echo.
echo 📊 Starting Backend Server...
cd /d "c:\Users\Iffatnizam\Desktop\G3 Project\New\ai_recruitment_system\backend"
start "Backend Server" cmd /k "npm start"

echo.
echo 🤖 Starting AI Service...
cd /d "c:\Users\Iffatnizam\Desktop\G3 Project\New\ai_recruitment_system\ai-service"
start "AI Service" cmd /k "python app.py"

echo.
echo 🎨 Starting Frontend Server...
cd /d "c:\Users\Iffatnizam\Desktop\G3 Project\New\ai_recruitment_system\frontend"
start "Frontend Server" cmd /k "npm run dev"

echo.
echo ✅ All services started!
echo ================================================
echo 📱 Dashboard: http://localhost:3000/recruiter/dashboard
echo 🔑 Login: test@analytics.com / test123
echo ================================================
echo.
echo Press any key to exit...
pause >nul
