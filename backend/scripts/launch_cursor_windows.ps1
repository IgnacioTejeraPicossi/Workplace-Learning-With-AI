param([string]$repoPath, [string]$jobId)

Write-Host "Opening Cursor AI for repository: $repoPath"

# Open Cursor with the repo path (adjust path as needed)
$cursorPaths = @(
    "$env:LOCALAPPDATA\Programs\cursor\Cursor.exe",
    "$env:APPDATA\Local\Programs\cursor\Cursor.exe",
    "C:\Users\$env:USERNAME\AppData\Local\Programs\cursor\Cursor.exe"
)

$cursorExe = $null
foreach ($path in $cursorPaths) {
    if (Test-Path $path) {
        $cursorExe = $path
        break
    }
}

if ($cursorExe) {
    Start-Process $cursorExe -ArgumentList $repoPath
    Start-Sleep -Seconds 3
    
    # Send hotkeys to trigger custom command (Ctrl+Shift+G)
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.SendKeys]::SendWait("^+G")
    
    Write-Host "Cursor AI launched with README generation command"
} else {
    Write-Host "Cursor AI not found in expected locations"
}
