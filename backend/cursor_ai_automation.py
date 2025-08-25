"""
Cursor AI Automation System - COMPLETE AUTOMATION
Fully automated repository analysis and README generation
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

router = APIRouter(prefix="/cursor/automation", tags=["Cursor AI Automation"])

# In-memory job storage with progress tracking
JOBS = {}

class AutomationRequest(BaseModel):
    repo_url: str
    branch: Optional[str] = "main"
    timeout_seconds: Optional[int] = 900  # 15 minutes default

class AutomationResponse(BaseModel):
    job_id: str
    status: str
    message: str
    progress: int = 0
    current_step: str = ""
    repo_path: Optional[str] = None

class JobStatus(BaseModel):
    job_id: str
    status: str
    progress: int
    current_step: str
    start_time: str
    completion_time: Optional[str] = None
    repo_url: str
    branch: str
    error_message: Optional[str] = None

def _update_job_progress(job_id: str, progress: int, current_step: str, status: str = "running"):
    """Update job progress and status"""
    if job_id in JOBS:
        JOBS[job_id].update({
            "progress": progress,
            "current_step": current_step,
            "status": status
        })
        print(f"Job {job_id}: {progress}% - {current_step}")

def _hash_file(p: Path) -> str:
    """Calculate SHA256 hash of a file"""
    if not p.exists():
        return ""
    
    h = hashlib.sha256()
    with p.open("rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()

def _clone_repository(repo_url: str, branch: str, job_id: str) -> Path:
    """Clone repository with progress tracking"""
    try:
        _update_job_progress(job_id, 10, "Creating temporary directory...")
        
        # Create temporary directory
        temp_dir = Path(tempfile.mkdtemp(prefix="cursor_auto_"))
        repo_path = temp_dir / "repo"
        
        _update_job_progress(job_id, 20, f"Cloning {repo_url}...")
        
        # Clone repository (shallow clone for speed)
        git.Repo.clone_from(
            repo_url, 
            repo_path, 
            branch=branch, 
            depth=1,
            single_branch=True
        )
        
        _update_job_progress(job_id, 40, "Repository cloned successfully")
        return repo_path
        
    except Exception as e:
        _update_job_progress(job_id, 0, f"Error cloning repository: {e}", "failed")
        # Clean up on error
        if 'temp_dir' in locals() and temp_dir.exists():
            shutil.rmtree(temp_dir, ignore_errors=True)
        raise

def _create_automation_files(repo: Path, repo_url: str, job_id: str):
    """Create automation files for Cursor AI"""
    try:
        _update_job_progress(job_id, 50, "Creating automation files...")
        
        # Create DOC_TASK.md
        task_content = f"""# AUTOMATED DOCUMENTATION TASK

## IMMEDIATE ACTION REQUIRED
Please analyze this repository and generate a professional README.md NOW.

## Repository: {repo_url}
## Analysis Date: {time.strftime('%Y-%m-%d %H:%M:%S')}

## REQUIRED SECTIONS:
- Project Overview & Description
- Features & Capabilities  
- Installation & Setup
- Usage Examples
- API Documentation (if applicable)
- Contributing Guidelines
- License Information

## INSTRUCTIONS:
1. Analyze the ENTIRE codebase thoroughly
2. Generate a professional, comprehensive README.md
3. Replace the existing README.md at repository root
4. Ensure high quality and completeness
5. Save immediately

## URGENT: This is an automated task - complete it NOW!
"""
        
        task_file = repo / "DOC_TASK.md"
        task_file.write_text(task_content, encoding="utf-8")
        
        # Create CURSOR_AUTO.prompt
        prompt_content = f"""# AUTOMATED CURSOR AI TASK

## OBJECTIVE: Generate Professional README.md

## REPOSITORY: {repo_url}

## WHAT TO DO RIGHT NOW:
1. **ANALYZE** the entire codebase
2. **GENERATE** a professional README.md
3. **SAVE** it at repository root
4. **REPLACE** any existing README.md

## REQUIRED SECTIONS:
- Project overview and description
- Features and capabilities
- Installation and setup instructions
- Usage examples
- API documentation (if applicable)
- Contributing guidelines
- License information

## QUALITY REQUIREMENTS:
- Professional writing style
- Clear and concise language
- Proper markdown formatting
- Actionable instructions
- Comprehensive coverage

## IMPORTANT:
- This is an AUTOMATED task
- Generate the README.md NOW
- Save it immediately
- Make it production-ready quality

## START ANALYZING AND GENERATING NOW!
"""
        
        prompt_file = repo / "CURSOR_AUTO.prompt"
        prompt_file.write_text(prompt_content, encoding="utf-8")
        
        _update_job_progress(job_id, 60, "Automation files created successfully")
        
    except Exception as e:
        _update_job_progress(job_id, 0, f"Error creating automation files: {e}", "failed")
        raise

def _launch_cursor_ai_automated(repo: Path, job_id: str) -> bool:
    """Launch Cursor AI with full automation"""
    try:
        _update_job_progress(job_id, 70, "Launching Cursor AI...")
        
        # Create automation script
        script_content = f"""param([string]$repoPath, [string]$jobId)

Write-Host "=== CURSOR AI AUTOMATION LAUNCHER ==="
Write-Host "Repository: $repoPath"
Write-Host "Job ID: $jobId"

# Find Cursor AI executable
$cursorPath = "$env:USERPROFILE\\AppData\\Local\\Programs\\Cursor\\Cursor.exe"

if (-not (Test-Path $cursorPath)) {{
    Write-Host "ERROR: Cursor AI not found at $cursorPath"
    exit 1
}}

try {{
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
    [System.Windows.Forms.SendKeys]::SendWait("{{ENTER}}")
    
    Write-Host "Cursor AI launched with automation commands"
    Write-Host "README generation should start automatically"
    
}} catch {{
    Write-Host "ERROR: $($_.Exception.Message)"
    exit 1
}}
"""
        
        # Write script to file
        script_dir = Path(__file__).parent / "scripts"
        script_dir.mkdir(exist_ok=True)
        script_path = script_dir / "launch_cursor_automated.ps1"
        script_path.write_text(script_content, encoding="utf-8")
        
        # Execute script
        result = subprocess.run([
            "powershell.exe", 
            "-ExecutionPolicy", "Bypass", 
            "-File", str(script_path), 
            str(repo), 
            job_id
        ], capture_output=True, text=True)
        
        print(f"PowerShell output: {result.stdout}")
        if result.stderr:
            print(f"PowerShell errors: {result.stderr}")
        
        if result.returncode == 0:
            _update_job_progress(job_id, 80, "Cursor AI launched successfully")
            return True
        else:
            _update_job_progress(job_id, 0, "Failed to launch Cursor AI", "failed")
            return False
            
    except Exception as e:
        _update_job_progress(job_id, 0, f"Error launching Cursor AI: {e}", "failed")
        return False

def _monitor_automation_progress(job_id: str, repo: Path, timeout_sec: int = 900):
    """Monitor automation progress with detailed tracking"""
    try:
        _update_job_progress(job_id, 85, "Monitoring automation progress...")
        
        readme = repo / "README.md"
        start = time.time()
        initial_hash = _hash_file(readme)
        
        print(f"Starting automation monitoring for {repo}")
        print(f"Initial README hash: {initial_hash}")
        
        check_count = 0
        while time.time() - start < timeout_sec:
            check_count += 1
            current_time = time.strftime('%H:%M:%S')
            elapsed = int(time.time() - start)
            
            # Update progress based on elapsed time
            progress = min(85 + int((elapsed / timeout_sec) * 10), 95)
            
            if readme.exists():
                current_hash = _hash_file(readme)
                file_size = readme.stat().st_size
                
                if current_hash and current_hash != initial_hash:
                    # README has changed!
                    try:
                        content = readme.read_text(encoding='utf-8')
                        if len(content.strip()) > 100:  # Basic validation
                            _update_job_progress(job_id, 100, "README.md generated successfully!", "completed")
                            
                            JOBS[job_id].update({
                                "status": "completed",
                                "completion_time": time.strftime('%Y-%m-%d %H:%M:%S'),
                                "readme_path": str(readme),
                                "readme_content": content
                            })
                            
                            print(f"🎉 AUTOMATION COMPLETED! README.md generated successfully")
                            return True
                        else:
                            _update_job_progress(job_id, progress, f"README.md updated but content seems short ({len(content)} chars)")
                    except Exception as e:
                        _update_job_progress(job_id, progress, f"Error reading README.md: {e}")
                else:
                    _update_job_progress(job_id, progress, f"Monitoring... README.md unchanged (check #{check_count})")
            else:
                _update_job_progress(job_id, progress, f"Monitoring... README.md not found yet (check #{check_count})")
            
            # Log every 10 checks
            if check_count % 10 == 0:
                print(f"Check #{check_count} at {current_time} (elapsed: {elapsed}s)")
                # List repository contents for debugging
                print(f"Repository contents:")
                for item in repo.iterdir():
                    if item.is_file():
                        print(f"  📄 {item.name} ({item.stat().st_size} bytes)")
                    else:
                        print(f"  📁 {item.name}/")
            
            time.sleep(3)
        
        # Timeout reached
        _update_job_progress(job_id, 0, f"Automation timeout after {timeout_sec} seconds", "timeout")
        JOBS[job_id]["status"] = "timeout"
        return False
        
    except Exception as e:
        _update_job_progress(job_id, 0, f"Error in automation monitoring: {e}", "failed")
        return False

@router.post("/start", response_model=AutomationResponse)
async def start_automation(req: AutomationRequest, bg: BackgroundTasks):
    """Start fully automated Cursor AI analysis"""
    try:
        print(f"🚀 Starting automated Cursor AI analysis for {req.repo_url}")
        
        # Validate repository URL
        if not req.repo_url or not req.repo_url.startswith(('http://', 'https://')):
            raise HTTPException(status_code=400, detail="Valid repository URL is required")
        
        # Generate job ID
        job_id = str(uuid.uuid4())
        
        # Initialize job
        JOBS[job_id] = {
            "status": "running",
            "progress": 0,
            "current_step": "Initializing...",
            "start_time": time.strftime('%Y-%m-%d %H:%M:%S'),
            "repo_url": req.repo_url,
            "branch": req.branch,
            "timeout": req.timeout_seconds
        }
        
        _update_job_progress(job_id, 5, "Job initialized successfully")
        
        # Clone repository
        repo_path = _clone_repository(req.repo_url, req.branch, job_id)
        
        # Create automation files
        _create_automation_files(repo_path, req.repo_url, job_id)
        
        # Launch Cursor AI
        if not _launch_cursor_ai_automated(repo_path, job_id):
            raise HTTPException(status_code=500, detail="Failed to launch Cursor AI")
        
        # Start background monitoring
        bg.add_task(_monitor_automation_progress, job_id, repo_path, req.timeout_seconds)
        
        print(f"✅ Automation job {job_id} started successfully")
        
        return AutomationResponse(
            job_id=job_id,
            status="started",
            message="Automated Cursor AI analysis started successfully",
            progress=80,
            current_step="Cursor AI launched, monitoring progress...",
            repo_path=str(repo_path)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error starting automation: {e}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@router.get("/status/{job_id}", response_model=JobStatus)
async def get_automation_status(job_id: str):
    """Get detailed automation status with progress"""
    job = JOBS.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return JobStatus(
        job_id=job_id,
        status=job["status"],
        progress=job.get("progress", 0),
        current_step=job.get("current_step", ""),
        start_time=job.get("start_time", ""),
        completion_time=job.get("completion_time"),
        repo_url=job.get("repo_url", ""),
        branch=job.get("branch", ""),
        error_message=job.get("error_message")
    )

@router.get("/result/{job_id}")
async def get_automation_result(job_id: str):
    """Get automation result with generated README"""
    job = JOBS.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job["status"] != "completed":
        return {"status": job["status"], "message": "Job not yet completed"}
    
    return {
        "status": "completed",
        "readme_content": job.get("readme_content", ""),
        "file_path": job.get("readme_path", ""),
        "completion_time": job.get("completion_time")
    }

@router.get("/jobs")
async def list_automation_jobs():
    """List all automation jobs"""
    return {
        "total_jobs": len(JOBS),
        "jobs": [
            {
                "job_id": job_id,
                "status": job["status"],
                "progress": job.get("progress", 0),
                "current_step": job.get("current_step", ""),
                "repo_url": job.get("repo_url"),
                "start_time": job.get("start_time"),
                "completion_time": job.get("completion_time")
            }
            for job_id, job in JOBS.items()
        ]
    }

@router.delete("/job/{job_id}")
async def cancel_automation_job(job_id: str):
    """Cancel a running automation job"""
    job = JOBS.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job["status"] == "completed":
        raise HTTPException(status_code=400, detail="Cannot cancel completed job")
    
    job["status"] = "cancelled"
    return {"status": "cancelled", "message": "Job cancelled successfully"}

