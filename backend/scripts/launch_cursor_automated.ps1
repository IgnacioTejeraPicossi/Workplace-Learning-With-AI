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
    # Step 1: Open Cursor AI with repository
    Write-Host "Opening Cursor AI with repository..."
    Start-Process -FilePath $cursorPath -ArgumentList $repoPath -PassThru
    
    # Step 2: Wait for app to open
    Write-Host "Waiting for Cursor AI to open..."
    Start-Sleep -Seconds 5
    
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
