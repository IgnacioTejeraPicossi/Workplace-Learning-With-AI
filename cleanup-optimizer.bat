@echo off
chcp 65001 >nul
echo 🧹 AI Learning Project - Context Optimizer
echo ==========================================
echo.

:menu
echo Selecciona una opción:
echo 1. Limpieza ligera (cache y archivos temporales)
echo 2. Limpieza completa (archivos grandes y test)
echo 3. Mover directorios grandes (emergencia)
echo 4. Verificar uso de contexto
echo 5. Salir
echo.
set /p choice="Opción (1-5): "

if "%choice%"=="1" goto light_cleanup
if "%choice%"=="2" goto full_cleanup
if "%choice%"=="3" goto move_large
if "%choice%"=="4" goto check_context
if "%choice%"=="5" goto exit
echo Opción inválida. Intenta de nuevo.
goto menu

:light_cleanup
echo.
echo 🧹 Limpieza ligera en progreso...
echo.

REM Remove cache files
echo Removiendo archivos de cache...
rmdir /s /q "frontend\build" 2>nul
rmdir /s /q "frontend\node_modules\.cache" 2>nul
rmdir /s /q "backend\__pycache__" 2>nul
for /d %%i in (backend\*) do rmdir /s /q "%%i\__pycache__" 2>nul

REM Remove test screenshots
echo Removiendo capturas de pantalla de test...
rmdir /s /q "frontend\cypress\screenshots" 2>nul

echo ✅ Limpieza ligera completada!
echo.
goto menu

:full_cleanup
echo.
echo 🧹 Limpieza completa en progreso...
echo.

REM Create archive directory
if not exist "C:\Test\AI\Documentation-Archive" mkdir "C:\Test\AI\Documentation-Archive"

REM Move large test files
echo Moviendo archivos de test grandes...
move "test_*.py" "C:\Test\AI\Documentation-Archive\" 2>nul

REM Move documentation files
echo Moviendo documentación grande...
move "docs\*.docx" "C:\Test\AI\Documentation-Archive\" 2>nul
move "docs\*.pdf" "C:\Test\AI\Documentation-Archive\" 2>nul

REM Remove Cypress fixtures
echo Removiendo fixtures de Cypress...
del "frontend\cypress\fixtures\*.json" 2>nul

REM Light cleanup
call :light_cleanup

echo ✅ Limpieza completa completada!
echo.
goto menu

:move_large
echo.
echo 📁 Moviendo directorios grandes...
echo.

REM Create backup directory
if not exist "C:\Temp\AI-Project-Backup" mkdir "C:\Temp\AI-Project-Backup"

REM Move Cypress (large test framework)
echo Moviendo directorio Cypress...
if exist "frontend\cypress" (
    move "frontend\cypress" "C:\Temp\AI-Project-Backup\"
    echo ✅ Cypress movido a backup
)

REM Move docs directory
echo Moviendo directorio docs...
if exist "docs" (
    move "docs" "C:\Temp\AI-Project-Backup\"
    echo ✅ Docs movido a backup
)

REM Move deployment directory
echo Moviendo directorio deployment...
if exist "deployment" (
    move "deployment" "C:\Temp\AI-Project-Backup\"
    echo ✅ Deployment movido a backup
)

echo.
echo 📁 Directorios grandes movidos a: C:\Temp\AI-Project-Backup
echo 🎯 ¡El uso de contexto debería bajar significativamente!
echo.
goto menu

:check_context
echo.
echo 📊 Verificando uso de contexto...
echo.

REM Find files larger than 1MB
echo Archivos mayores a 1MB:
for /r %%i in (*) do (
    if %%~zi gtr 1048576 (
        echo %%~zi bytes - %%~fi
    )
)

echo.
echo Tamaños de directorios:
dir /s | findstr "Directory"
echo.
goto menu

:exit
echo.
echo 👋 ¡Hasta luego! El proyecto está optimizado.
pause
