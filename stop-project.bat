@echo off
title Stop AI Recruitment System
color 0C

echo ========================================
echo   Stop AI Recruitment System
echo ========================================
echo.

echo 🛑 Stopping all services...

:: Stop Node.js processes (Backend and Frontend)
echo Stopping Node.js services (Backend on port 5000, Frontend on port 3000)...
taskkill /F /IM node.exe >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo ✅ Node.js services stopped
) else (
    echo ℹ️  No Node.js services running
)

:: Stop Python processes (AI Service)
echo Stopping Python AI service (port 5001)...
taskkill /F /IM python.exe >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo ✅ Python AI service stopped
) else (
    echo ℹ️  No Python services running
)

:: Note: MySQL (Laragon) is left running as it may be used by other applications
echo ℹ️  MySQL (Laragon) left running - stop manually via Laragon if needed

echo.
echo ✅ All services stopped successfully!
echo.
pause
