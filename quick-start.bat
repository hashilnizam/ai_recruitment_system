@echo off
title Quick Start - AI Recruitment System
color 0B

echo ========================================
echo   Quick Start - AI Recruitment System
echo ========================================
echo.

:: Quick check if dependencies are installed
echo 🔍 Checking dependencies...

:: Check if Node.js modules exist
if not exist "backend\node_modules" (
    echo ❌ Backend dependencies not found. Installing...
    cd backend
    npm install
    cd ..
    echo ✅ Backend dependencies installed
)

if not exist "frontend\node_modules" (
    echo ❌ Frontend dependencies not found. Installing...
    cd frontend
    npm install
    cd ..
    echo ✅ Frontend dependencies installed
)

:: Check if Python virtual environment exists
if not exist "ai-service\venv" (
    echo ❌ Python virtual environment not found. Creating...
    cd ai-service
    python -m venv venv
    venv\Scripts\activate
    pip install -r requirements.txt
    cd ..
    echo ✅ Python environment created and dependencies installed
)

:: Check if database exists
echo 🔍 Checking database...
"C:\laragon\bin\mysql\mysql-8.4.3-winx64\bin\mysql.exe" -u root -proot -e "USE resume_screening;" 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ Database not found. Creating...
    "C:\laragon\bin\mysql\mysql-8.4.3-winx64\bin\mysql.exe" -u root -proot -e "CREATE DATABASE resume_screening;"
    type database\schema.sql | "C:\laragon\bin\mysql\mysql-8.4.3-winx64\bin\mysql.exe" -u root -proot resume_screening
    echo ✅ Database created and migrated
) else (
    echo ✅ Database exists
)

echo.
echo 🚀 Starting all services...
call start-project.bat
