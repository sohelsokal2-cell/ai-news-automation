@echo off
echo ============================================
echo   GitHub Push Script
echo ============================================
echo.

git add .
if %errorlevel% neq 0 (
    echo [ERROR] Git add failed!
    pause
    exit /b 1
)

echo Enter commit message:
set /p commit_msg="> "

if "%commit_msg%"=="" (
    set commit_msg=Update project
)

git commit -m "%commit_msg%"
if %errorlevel% neq 0 (
    echo [ERROR] Git commit failed!
    pause
    exit /b 1
)

git push origin main
if %errorlevel% neq 0 (
    echo [ERROR] Git push failed!
    pause
    exit /b 1
)

echo.
echo ============================================
echo   Push Successful!
echo ============================================
pause
