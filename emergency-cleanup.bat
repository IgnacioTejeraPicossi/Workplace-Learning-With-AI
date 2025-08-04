@echo off
echo EMERGENCY CONTEXT CLEANUP - Removing large files...
echo.

REM Remove large directories that consume context
echo Removing Cypress screenshots...
rmdir /s /q "frontend\cypress\screenshots" 2>nul

echo Removing build directories...
rmdir /s /q "frontend\build" 2>nul
rmdir /s /q "frontend\node_modules\.cache" 2>nul

echo Removing Python cache...
rmdir /s /q "backend\__pycache__" 2>nul
for /d %%i in (backend\*) do rmdir /s /q "%%i\__pycache__" 2>nul

echo Removing test files...
del "test_*.py" 2>nul

echo Removing large documentation...
del "docs\*.docx" 2>nul
del "docs\*.pdf" 2>nul

echo Removing Cypress fixtures...
del "frontend\cypress\fixtures\*.json" 2>nul

echo Emergency cleanup completed!
pause 