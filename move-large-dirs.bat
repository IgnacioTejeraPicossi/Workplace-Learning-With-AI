@echo off
echo Moving large directories outside workspace...
echo.

REM Create backup directory
if not exist "C:\Temp\AI-Project-Backup" mkdir "C:\Temp\AI-Project-Backup"

REM Move Cypress (large test framework)
echo Moving Cypress directory...
if exist "frontend\cypress" (
    move "frontend\cypress" "C:\Temp\AI-Project-Backup\"
    echo Cypress moved to backup
)

REM Move docs directory
echo Moving docs directory...
if exist "docs" (
    move "docs" "C:\Temp\AI-Project-Backup\"
    echo Docs moved to backup
)

REM Move deployment directory
echo Moving deployment directory...
if exist "deployment" (
    move "deployment" "C:\Temp\AI-Project-Backup\"
    echo Deployment moved to backup
)

echo.
echo Large directories moved to: C:\Temp\AI-Project-Backup
echo Context usage should drop significantly!
pause 