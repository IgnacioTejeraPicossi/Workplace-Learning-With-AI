import os
import tempfile
import git
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
import shutil
from typing import Dict, List, Optional
import time

# Import llm functions at module level
try:
    from llm import generate_summary
    LLM_AVAILABLE = True
except ImportError:
    LLM_AVAILABLE = False
    print("Warning: llm module not available, will use fallback summaries")

router = APIRouter()

class RepoInput(BaseModel):
    repo_url: str
    branch: Optional[str] = None  # Made optional to auto-detect

class RepoAnalysisResponse(BaseModel):
    message: str
    file_count: int
    files: List[str]
    summaries: Dict[str, str]
    repo_name: str
    branch_used: str

def safe_remove_directory(path):
    """Safely remove a directory with retry logic for Windows permission issues"""
    if not path or not os.path.exists(path):
        return
    
    max_retries = 3
    for attempt in range(max_retries):
        try:
            # On Windows, sometimes files are still in use
            if os.name == 'nt':  # Windows
                import subprocess
                subprocess.run(['rmdir', '/s', '/q', path], shell=True, check=False)
            else:
                shutil.rmtree(path)
            break
        except (PermissionError, OSError) as e:
            if attempt < max_retries - 1:
                time.sleep(1)  # Wait a bit before retrying
                continue
            else:
                print(f"Warning: Could not remove temporary directory {path}: {e}")

@router.post("/analyze-repo", response_model=RepoAnalysisResponse)
async def analyze_repo(input: RepoInput):
    """Analyze a repository and generate documentation summaries"""
    tmp_dir = None
    try:
        # Step 1: Clone the repo into a temp folder
        tmp_dir = tempfile.mkdtemp()
        repo_path = os.path.join(tmp_dir, "repo")
        
        # Step 1.5: Detect the default branch if not specified
        branch_to_use = input.branch
        if not branch_to_use:
            try:
                # Try to get the default branch from the remote
                remote_refs = git.cmd.Git().ls_remote(input.repo_url, heads=True)
                # Parse the output to find the default branch
                for line in remote_refs.split('\n'):
                    if line.strip() and 'HEAD' in line:
                        # Extract the branch name from the HEAD reference
                        head_ref = line.split('\t')[1]
                        if head_ref.startswith('refs/heads/'):
                            branch_to_use = head_ref.replace('refs/heads/', '')
                            break
                
                # Fallback to common branch names if HEAD detection fails
                if not branch_to_use:
                    # Try common branch names
                    for common_branch in ['main', 'master', 'develop']:
                        try:
                            git.cmd.Git().ls_remote(input.repo_url, refs=f'refs/heads/{common_branch}')
                            branch_to_use = common_branch
                            break
                        except:
                            continue
                    
                    # If still no branch found, use 'main' as default
                    if not branch_to_use:
                        branch_to_use = 'main'
                        
            except Exception as e:
                print(f"Error detecting default branch: {e}")
                branch_to_use = 'main'  # Fallback
        
        # Step 2: Clone repository with the detected branch
        try:
            repo = git.Repo.clone_from(input.repo_url, repo_path, branch=branch_to_use)
        except git.exc.GitCommandError as e:
            # If the specified branch doesn't exist, try to clone without specifying branch
            if "Remote branch" in str(e) and "not found" in str(e):
                try:
                    repo = git.Repo.clone_from(input.repo_url, repo_path)
                    # Get the active branch name
                    branch_to_use = repo.active_branch.name
                except Exception as e2:
                    raise HTTPException(status_code=400, detail=f"Could not clone repository. Available branches might be different. Error: {str(e2)}")
            else:
                raise HTTPException(status_code=400, detail=f"Error cloning repository: {str(e)}")
        
        repo_name = os.path.basename(input.repo_url.replace('.git', ''))
        
        # Step 3: Identify relevant files
        docs = {}
        relevant_extensions = ('.py', '.js', '.ts', '.jsx', '.tsx', '.md', '.txt', '.json', '.yaml', '.yml')
        
        for root, dirs, files in os.walk(repo_path):
            # Skip common directories that don't contain documentation
            dirs[:] = [d for d in dirs if d not in ('.git', 'node_modules', '__pycache__', '.venv', 'venv')]
            
            for file in files:
                if file.endswith(relevant_extensions):
                    file_path = os.path.join(root, file)
                    relative_path = os.path.relpath(file_path, repo_path)
                    
                    try:
                        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                            content = f.read()
                            # Only include files with meaningful content
                            if len(content.strip()) > 50:
                                docs[relative_path] = content
                    except Exception as e:
                        print(f"Error reading {file_path}: {e}")
                        continue

        # Step 4: Generate summaries using AI
        summaries = {}
        
        if LLM_AVAILABLE:
            # Use AI-generated summaries
            for filename, content in docs.items():
                try:
                    # Truncate content if too long for API
                    truncated_content = content[:3000] if len(content) > 3000 else content
                    summary = await generate_summary(filename, truncated_content)
                    summaries[filename] = summary
                except Exception as e:
                    summaries[filename] = f"Error summarizing: {str(e)}"
        else:
            # Fallback to simple summaries
            for filename, content in docs.items():
                # Create a simple summary based on file content
                truncated_content = content[:500] if len(content) > 500 else content
                file_type = filename.split('.')[-1] if '.' in filename else 'unknown'
                summaries[filename] = f"File: {filename}\nType: {file_type}\nContent preview: {truncated_content[:200]}..."

        return RepoAnalysisResponse(
            message="Repository analyzed successfully",
            file_count=len(docs),
            files=list(docs.keys()),
            summaries=summaries,
            repo_name=repo_name,
            branch_used=branch_to_use
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing repository: {str(e)}")
    
    finally:
        # Clean up temporary directory safely
        safe_remove_directory(tmp_dir)

@router.get("/repo-templates")
async def get_repo_templates():
    """Get list of common repository templates for quick analysis"""
    return {
        "templates": [
            {
                "name": "React Application",
                "description": "Standard React app with TypeScript",
                "url": "https://github.com/facebook/create-react-app",
                "branch": "main"
            },
            {
                "name": "FastAPI Backend",
                "description": "Python FastAPI backend template",
                "url": "https://github.com/tiangolo/full-stack-fastapi-postgresql",
                "branch": "master"
            },
            {
                "name": "Node.js Express",
                "description": "Express.js backend template",
                "url": "https://github.com/expressjs/express",
                "branch": "master"
            }
        ]
    }

@router.get("/detect-branch/{repo_url:path}")
async def detect_branch(repo_url: str):
    """Detect available branches for a repository"""
    try:
        # Clean the URL
        if repo_url.startswith('http'):
            repo_url = repo_url.replace('%2F', '/')
        
        # Get remote references
        remote_refs = git.cmd.Git().ls_remote(repo_url, heads=True)
        
        branches = []
        default_branch = None
        
        for line in remote_refs.split('\n'):
            if line.strip():
                parts = line.split('\t')
                if len(parts) == 2:
                    ref = parts[1]
                    if ref.startswith('refs/heads/'):
                        branch_name = ref.replace('refs/heads/', '')
                        branches.append(branch_name)
                        
                        # Check if this is the default branch (HEAD)
                        if 'HEAD' in line:
                            default_branch = branch_name
        
        return {
            "available_branches": branches,
            "default_branch": default_branch or (branches[0] if branches else None),
            "repo_url": repo_url
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error detecting branches: {str(e)}") 