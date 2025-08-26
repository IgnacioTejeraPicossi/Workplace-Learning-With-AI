param([string]$repoPath, [string]$jobId)

Write-Host "=== CURSOR AI AUTOMATION LAUNCHER ==="
Write-Host "Repository: $repoPath"
Write-Host "Job ID: $jobId"

# Find Cursor AI executable
$cursorPath = "$env:USERPROFILE\AppData\Local\Programs\Cursor\Cursor.exe"

if (-not (Test-Path $cursorPath)) {
    Write-Host "ERROR: Cursor AI not found at $cursorPath"
    exit 1
}

try {
    # Step 1: Check if Cursor AI is already running
    Write-Host "Checking if Cursor AI is already running..."
    $existingProcesses = Get-Process -Name "Cursor" -ErrorAction SilentlyContinue
    if ($existingProcesses) {
        Write-Host "Cursor AI is already running. Using existing instance."
        # Focus on existing window instead of opening new one
        $existingProcesses[0].MainWindowHandle | ForEach-Object {
            Add-Type -AssemblyName System.Windows.Forms
            [System.Windows.Forms.SendKeys]::SendWait("%{$_}")
        }
    } else {
        # Step 2: Open Cursor AI with repository (only if not running)
        Write-Host "Opening Cursor AI with repository..."
        Start-Process -FilePath $cursorPath -ArgumentList $repoPath
    }
    
    # Step 3: Wait for app to open/focus
    Write-Host "Waiting for Cursor AI to be ready..."
    Start-Sleep -Seconds 3
    
    # Step 3: Send Ctrl+Shift+G for README generation
    Write-Host "Sending Ctrl+Shift+G for README generation..."
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.SendKeys]::SendWait("^+G")
    
    # Step 4: Alternative: Send Ctrl+K and type command
    Write-Host "Sending Ctrl+K command palette..."
    Start-Sleep -Seconds 2
    [System.Windows.Forms.SendKeys]::SendWait("^K")
    Start-Sleep -Seconds 1
    [System.Windows.Forms.SendKeys]::SendWait("generate readme")
    Start-Sleep -Seconds 1
    [System.Windows.Forms.SendKeys]::SendWait("{ENTER}")
    
    Write-Host "Cursor AI launched with automation commands"
    Write-Host "README generation should start automatically"
    
} catch {
    Write-Host "ERROR: $($_.Exception.Message)"
    exit 1
}
