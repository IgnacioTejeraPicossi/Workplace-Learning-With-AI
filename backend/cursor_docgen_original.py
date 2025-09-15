"""
Cursor AI Document Generation System
Implements the GPT-5 plan for launching Cursor AI locally and generating professional documentation
"""

import os
import subprocess
import tempfile
import shutil
import time
import json
import hashlib
import uuid
from pathlib import Path
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
import git
from backend.env_config import EnvConfig

router = APIRouter(prefix="/cursor/docgen", tags=["Cursor AI Document Generation"])

# In-memory job storage (replace with database in production)
JOBS = {}

class DocGenRequest(BaseModel):
    repo_url: str
    branch: Optional[str] = "main"
    timeout_seconds: Optional[int] = 900  # 15 minutes default

class DocGenResponse(BaseModel):
    job_id: str
    status: str
    message: str
    repo_path: Optional[str] = None

def _hash_file(p: Path) -> str:
    """Calculate SHA256 hash of a file"""
    if not p.exists():
        return ""
    
    h = hashlib.sha256()
    with p.open("rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()

def _write_task_file(repo: Path, repo_url: str):
    """Write DOC_TASK.md file with instructions for Cursor AI"""
    task = repo / "DOC_TASK.md"
    
    # Create comprehensive task instructions
    task_content = f"""# Documentation Task (Auto-Generated)

## Repository Analysis Request
Please analyze the entire repository and generate a professional README.md covering:

### Required Sections:
- **Overview & Architecture**: High-level project description and system architecture
- **Features**: Key functionality and capabilities
- **Folder Structure**: Organized project structure with explanations
- **Tech Stack**: Technologies, frameworks, and dependencies used
- **Setup & Environment Variables**: Required environment configuration
- **Installation & Setup**: Step-by-step setup instructions
- **Run & Deploy**: How to run locally and deploy
- **Testing**: Testing strategy and how to run tests
- **API Endpoints**: If applicable, API documentation
- **Contributing**: Guidelines for contributors
- **License**: Project licensing information

### Repository Information:
- **Source**: {repo_url}
- **Analysis Tool**: Cursor AI
- **Analysis Date**: {time.strftime('%Y-%m-%d %H:%M:%S')}

### Instructions:
1. Analyze the entire codebase thoroughly
2. Generate a professional, well-structured README.md
3. Replace the existing README.md at repository root
4. Ensure accuracy and completeness
5. Use professional documentation standards
6. Include code examples where appropriate
7. Make it developer-friendly and comprehensive

### Quality Standards:
- Clear and concise language
- Proper markdown formatting
- Logical information hierarchy
- Actionable instructions
- Professional appearance

Please complete this task and save the README.md file.
"""
    
    task.write_text(task_content, encoding="utf-8")
    print(f"Created DOC_TASK.md at {task}")

def _write_cursor_prompt(repo: Path, repo_url: str):
    """Write CURSOR_TASK.prompt for optimal Cursor AI performance"""
    prompt = repo / "CURSOR_TASK.prompt"
    
    prompt_content = f"""TASK: Generate Professional README.md

You are tasked with creating a comprehensive, professional README.md for this repository.

REPOSITORY: {repo_url}
ANALYSIS DATE: {time.strftime('%Y-%m-%d %H:%M:%S')}

REQUIREMENTS:
1. Analyze the entire codebase structure and architecture
2. Identify the main technologies, frameworks, and dependencies
3. Understand the project's purpose and functionality
4. Generate a professional README.md that includes:
   - Clear project overview and description
   - Architecture and system design
   - Feature list and capabilities
   - Technology stack details
   - Installation and setup instructions
   - Usage examples and API documentation
   - Testing and deployment information
   - Contributing guidelines
   - License information

QUALITY STANDARDS:
- Professional documentation style
- Clear and concise language
- Proper markdown formatting
- Logical information hierarchy
- Actionable instructions
- Developer-friendly content

DELIVERABLE:
- Replace the existing README.md at repository root
- Ensure the new README.md is comprehensive and professional
- Test that the markdown renders correctly

This is a critical task - please take your time to analyze thoroughly and generate the highest quality documentation possible.
"""
    
    prompt.write_text(prompt_content, encoding="utf-8")
    print(f"Created CURSOR_TASK.prompt at {prompt}")

def _clone_repository(repo_url: str, branch: str = "main") -> Path:
    """Clone repository to temporary directory"""
    temp_dir = tempfile.mkdtemp(prefix="cursor_docgen_")
    repo_name = repo_url.split('/')[-1].replace('.git', '')
    repo_path = Path(temp_dir) / repo_name
    
    print(f"Cloning {repo_url} to {repo_path}")
    
    try:
        if branch and branch != "main":
            repo = git.Repo.clone_from(
                repo_url, 
                repo_path, 
                branch=branch,
                depth=1
            )
        else:
            repo = git.Repo.clone_from(
                repo_url, 
                repo_path,
                depth=1
            )
        
        print(f"Successfully cloned repository to {repo_path}")
        return repo_path
        
    except git.exc.GitCommandError as e:
        shutil.rmtree(temp_dir, ignore_errors=True)
        raise HTTPException(status_code=400, detail=f"Failed to clone repository: {str(e)}")
    except Exception as e:
        shutil.rmtree(temp_dir, ignore_errors=True)
        raise HTTPException(status_code=500, detail=f"Unexpected error during cloning: {str(e)}")

def _launch_os_script(repo: Path, job_id: str):
    """Launch OS-specific script to open Cursor AI"""
    script_dir = Path(__file__).parent / "scripts"
    script_dir.mkdir(exist_ok=True)
    
    try:
        if os.name == "posix" and Path("/System/Library/CoreServices").exists():
            # macOS
            script_path = script_dir / "launch_cursor_macos.sh"
            _create_macos_script(script_path)
            subprocess.Popen(
                ["bash", str(script_path), str(repo), job_id], 
                close_fds=True
            )
        elif os.name == "nt":
            # Windows
            script_path = script_dir / "launch_cursor_windows.ps1"
            _create_windows_script(script_path)
            subprocess.Popen(
                ["powershell.exe", "-ExecutionPolicy", "Bypass", str(script_path), str(repo), job_id], 
                close_fds=True
            )
        else:
            # Linux
            script_path = script_dir / "launch_cursor_linux.sh"
            _create_linux_script(script_path)
            subprocess.Popen(
                ["bash", str(script_path), str(repo), job_id], 
                close_fds=True
            )
        
        print(f"Launched OS script for {repo}")
        return True
        
    except Exception as e:
        print(f"Error launching OS script: {e}")
        return False

def _create_macos_script(script_path: Path):
    """Create macOS launch script"""
    script_content = """#!/bin/bash
REPO_PATH="$1"
JOB_ID="$2"

echo "Opening Cursor AI for repository: $REPO_PATH"

# Open folder in Cursor
open -a "Cursor" "$REPO_PATH"

# Wait for app to open
sleep 3

# Fire global keystroke (Cmd+Shift+G for "Generate README" command)
osascript <<EOF
tell application "System Events"
  tell application process "Cursor"
    keystroke "G" using {command down, shift down}
  end tell
end tell
EOF

echo "Cursor AI launched with README generation command"
"""
    
    script_path.write_text(script_content, encoding="utf-8")
    script_path.chmod(0o755)

def _create_windows_script(script_path: Path):
    """Create Windows launch script"""
    script_content = """param([string]$repoPath, [string]$jobId)

Write-Host "Opening Cursor AI for repository: $repoPath"

# Open Cursor with the repo path (adjust path as needed)
$cursorPaths = @(
    "$env:LOCALAPPDATA\\Programs\\cursor\\Cursor.exe",
    "$env:APPDATA\\Local\\Programs\\cursor\\Cursor.exe",
    "C:\\Users\\$env:USERNAME\\AppData\\Local\\Programs\\cursor\\Cursor.exe"
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
"""
    
    script_path.write_text(script_content, encoding="utf-8")

def _create_linux_script(script_path: Path):
    """Create Linux launch script"""
    script_content = """#!/bin/bash
REPO_PATH="$1"
JOB_ID="$2"

echo "Opening Cursor AI for repository: $REPO_PATH"

# Try to launch Cursor
if command -v cursor &> /dev/null; then
    cursor "$REPO_PATH" &
    sleep 3
    
    # Use xdotool if available to send keystrokes
    if command -v xdotool &> /dev/null; then
        xdotool search --name "Cursor" windowactivate --sync key ctrl+shift+g
    else
        echo "xdotool not available, manual intervention may be required"
    fi
    
    echo "Cursor AI launched with README generation command"
else
    echo "Cursor AI not found in PATH"
fi
"""
    
    script_path.write_text(script_content, encoding="utf-8")
    script_path.chmod(0o755)

def _watch_for_readme(job_id: str, repo: Path, timeout_sec: int = 900):
    """Watch for README.md completion"""
    readme = repo / "README.md"
    start = time.time()
    initial_hash = _hash_file(readme)
    
    print(f"Watching for README.md changes in {repo}")
    print(f"Initial hash: {initial_hash}")
    
    while time.time() - start < timeout_sec:
        time.sleep(3)
        current_hash = _hash_file(readme)
        
        if current_hash and current_hash != initial_hash:
            print(f"README.md updated! New hash: {current_hash}")
            JOBS[job_id]["status"] = "done"
            JOBS[job_id]["readme_path"] = str(readme)
            JOBS[job_id]["completion_time"] = time.strftime('%Y-%m-%d %H:%M:%S')
            
            # Clean up lock file
            lock_file = repo / ".docgen.lock"
            if lock_file.exists():
                lock_file.unlink()
            
            return True
    
    print(f"Timeout waiting for README.md completion")
    JOBS[job_id]["status"] = "timeout"
    
    # Clean up lock file on timeout
    lock_file = repo / ".docgen.lock"
    if lock_file.exists():
        lock_file.unlink()
    
    return False

@router.post("/start", response_model=DocGenResponse)
async def start_docgen(req: DocGenRequest, bg: BackgroundTasks):
    """Start Cursor AI document generation job"""
    try:
        # Validate repository URL
        if not req.repo_url or not req.repo_url.startswith(('http://', 'https://')):
            raise HTTPException(status_code=400, detail="Valid repository URL is required")
        
        # Clone repository
        repo_path = _clone_repository(req.repo_url, req.branch)
        
        # Check for existing lock
        lock = repo_path / ".docgen.lock"
        if lock.exists():
            # Clean up cloned repo
            shutil.rmtree(repo_path.parent, ignore_errors=True)
            raise HTTPException(status_code=409, detail="A documentation generation job is already in progress for this repository")
        
        # Create lock file
        lock.write_text(str(time.time()))
        
        # Write task files
        _write_task_file(repo_path, req.repo_url)
        _write_cursor_prompt(repo_path, req.repo_url)
        
        # Generate job ID
        job_id = str(uuid.uuid4())
        JOBS[job_id] = {
            "status": "running",
            "repo": str(repo_path),
            "repo_url": req.repo_url,
            "branch": req.branch,
            "start_time": time.strftime('%Y-%m-%d %H:%M:%S'),
            "timeout": req.timeout_seconds
        }
        
        # Launch OS script
        if not _launch_os_script(repo_path, job_id):
            raise HTTPException(status_code=500, detail="Failed to launch Cursor AI")
        
        # Start background watcher
        bg.add_task(_watch_for_readme, job_id, repo_path, req.timeout_seconds)
        
        return DocGenResponse(
            job_id=job_id,
            status="started",
            message="Cursor AI document generation job started successfully",
            repo_path=str(repo_path)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error starting document generation: {e}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@router.get("/status/{job_id}")
async def get_docgen_status(job_id: str):
    """Get status of document generation job"""
    job = JOBS.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return {
        "job_id": job_id,
        "status": job["status"],
        "repo_url": job.get("repo_url"),
        "branch": job.get("branch"),
        "start_time": job.get("start_time"),
        "completion_time": job.get("completion_time"),
        "timeout": job.get("timeout")
    }

@router.get("/result/{job_id}")
async def get_docgen_result(job_id: str):
    """Get result of completed document generation job"""
    job = JOBS.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job["status"] != "done":
        return {"status": job["status"], "message": "Job not yet completed"}
    
    readme_path = Path(job["readme_path"])
    if not readme_path.exists():
        return {"status": "error", "message": "README.md file not found"}
    
    try:
        readme_content = readme_path.read_text(encoding="utf-8")
        return {
            "status": "done",
            "readme_content": readme_content,
            "file_path": str(readme_path),
            "completion_time": job.get("completion_time")
        }
    except Exception as e:
        return {"status": "error", "message": f"Error reading README.md: {str(e)}"}

@router.delete("/job/{job_id}")
async def cancel_docgen_job(job_id: str):
    """Cancel a running document generation job"""
    job = JOBS.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job["status"] == "done":
        raise HTTPException(status_code=400, detail="Cannot cancel completed job")
    
    # Clean up
    repo_path = Path(job["repo"])
    if repo_path.exists():
        lock_file = repo_path / ".docgen.lock"
        if lock_file.exists():
            lock_file.unlink()
    
    job["status"] = "cancelled"
    return {"status": "cancelled", "message": "Job cancelled successfully"}

@router.get("/jobs")
async def list_docgen_jobs():
    """List all document generation jobs"""
    return {
        "total_jobs": len(JOBS),
        "jobs": [
            {
                "job_id": job_id,
                "status": job["status"],
                "repo_url": job.get("repo_url"),
                "start_time": job.get("start_time"),
                "completion_time": job.get("completion_time")
            }
            for job_id, job in JOBS.items()
        ]
    }
