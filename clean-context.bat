@echo off
echo Cleaning up project for better context usage...
echo.

REM Create archive directory
if not exist "C:\Test\AI\Documentation-Archive" mkdir "C:\Test\AI\Documentation-Archive"

REM Move .docx files
echo Moving .docx files...
move "docs\*.docx" "C:\Test\AI\Documentation-Archive\" 2>nul

REM Remove cache files
echo Removing cache files...
rmdir /s /q "frontend\build" 2>nul
rmdir /s /q "frontend\node_modules\.cache" 2>nul
rmdir /s /q "backend\__pycache__" 2>nul
for /d %%i in (backend\*) do rmdir /s /q "%%i\__pycache__" 2>nul

REM Remove test screenshots
echo Removing test screenshots...
rmdir /s /q "frontend\cypress\screenshots" 2>nul

REM Move large test files
echo Moving large test files...
move "test_autofill_complete.py" "C:\Test\AI\Documentation-Archive\" 2>nul
move "test_autofill.py" "C:\Test\AI\Documentation-Archive\" 2>nul
move "test_profile_persistence.py" "C:\Test\AI\Documentation-Archive\" 2>nul

echo.
echo Cleanup completed! Context usage should be optimized.
pause 