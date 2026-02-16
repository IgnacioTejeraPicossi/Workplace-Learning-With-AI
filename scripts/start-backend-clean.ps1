# PowerShell script to start AI Learning Backend with clean logging
Write-Host "Starting AI Learning Backend with Clean Logging..." -ForegroundColor Green
Write-Host ""

# Activate virtual environment (from scripts, go up to root)
& "..\.venv\Scripts\Activate.ps1"

# Change to backend directory and start server
Set-Location ..\backend
python start_server.py

Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
