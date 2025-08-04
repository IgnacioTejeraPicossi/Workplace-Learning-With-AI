@echo off
echo Finding large files in the project...
echo.

REM Find files larger than 1MB
echo Files larger than 1MB:
for /r %%i in (*) do (
    if %%~zi gtr 1048576 (
        echo %%~zi bytes - %%~fi
    )
)

echo.
echo Checking directory sizes:
dir /s | findstr "Directory"

pause 