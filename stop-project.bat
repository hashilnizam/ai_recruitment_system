@echo off
title Stop AI Recruitment System
color 0C

echo ========================================
echo   Stop AI Recruitment System
echo ========================================
echo.

echo 🛑 Stopping all services...

:: Stop Node.js processes (Backend and Frontend)
echo Stopping Node.js services...
taskkill /F /IM node.exe >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo ✅ Node.js services stopped
) else (
    echo ℹ️  No Node.js services running
)

:: Stop Python processes (AI Service)
echo Stopping Python AI service...
taskkill /F /IM python.exe >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo ✅ Python AI service stopped
) else (
    echo ℹ️  No Python services running
)

:: Optional: Stop MySQL (commented out by default)
:: echo Stopping MySQL...
:: taskkill /F /IM mysqld.exe >nul 2>&1
:: if %ERRORLEVEL% equ 0 (
::     echo ✅ MySQL stopped
:: ) else (
::     echo ℹ️  MySQL not stopped (keeping it running)
:: )

echo.
echo ✅ All services stopped successfully!
echo.
pause
