import os
import tempfile
import git
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
import shutil
from typing import Dict, List, Optional, Any
import time
import uuid
from datetime import datetime

# Import llm functions at module level
try:
    from llm import generate_summary, ask_openai
    LLM_AVAILABLE = True
except ImportError:
    LLM_AVAILABLE = False
    print("Warning: llm module not available, will use fallback summaries")

# Import storage module
from repo_storage import RepoStorage
from cursor_ai_integration import CursorAIAnalyzer
from enhanced_analysis import EnhancedAnalyzer

router = APIRouter()

class RepoInput(BaseModel):
    repo_url: str
    branch: Optional[str] = None  # Made optional to auto-detect

class RepoAnalysisResponse(BaseModel):
    repo_name: str
    branch_used: str
    files_analyzed: int
    summaries: Dict[str, str]
    structure: Dict[str, Any]
    insights: Dict[str, Any]
    architecture: Dict[str, Any]
    analysis_id: Optional[str] = None
    analysis_type: Optional[str] = "enhanced_openai"
    documentation: Optional[Dict[str, Any]] = None
    learning_module: Optional[Dict[str, Any]] = None
    quality_score: Optional[float] = 0.8
    
    class Config:
        arbitrary_types_allowed = True

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
async def analyze_repo(input: RepoInput) -> RepoAnalysisResponse:
    """Analyze a Git repository and generate comprehensive documentation"""
    tmp_dir = None
    try:
        # Step 1: Create temporary directory
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
                print(f"Warning: Could not detect default branch: {e}")
                branch_to_use = 'main'

        # Step 2: Clone the repository
        print(f"Cloning repository: {input.repo_url} (branch: {branch_to_use})")
        git.Repo.clone_from(input.repo_url, repo_path, branch=branch_to_use)
        
        # Step 3: Check if Cursor AI is available
        cursor_ai_key = os.getenv('CURSOR_AI_API_KEY')
        
        if cursor_ai_key:
            # Use Cursor AI for high-quality analysis
            print("Using Cursor AI for analysis...")
            cursor_analyzer = CursorAIAnalyzer(cursor_ai_key)
            analysis_result = cursor_analyzer.analyze_repository(repo_path, input.repo_url)
            
            # Extract repository name from URL
            repo_name = input.repo_url.split('/')[-1].replace('.git', '')
            
            # Create response with Cursor AI analysis
            response = RepoAnalysisResponse(
                repo_name=repo_name,
                branch_used=branch_to_use,
                files_analyzed=analysis_result.get('files_analyzed', 0),
                summaries=analysis_result.get('summaries', {}),
                structure=analysis_result.get('structure_analysis', {}),
                insights=analysis_result.get('insights', {}),
                architecture=analysis_result.get('architecture', {}),
                analysis_id=str(uuid.uuid4()),
                # Add Cursor AI specific fields
                documentation=analysis_result.get('documentation', {}),
                learning_module=analysis_result.get('learning_module', {}),
                quality_score=analysis_result.get('quality_score', 0.8),
                analysis_type="cursor_ai"
            )
        else:
            # Use Enhanced OpenAI Analysis (Cursor AI-like quality)
            print("Cursor AI not available, using Enhanced OpenAI analysis...")
            
            # Initialize enhanced analyzer
            enhanced_analyzer = EnhancedAnalyzer()
            analysis_result = enhanced_analyzer.analyze_repository(repo_path, input.repo_url)
            
            # Extract repository name from URL
            repo_name = input.repo_url.split('/')[-1].replace('.git', '')
            
            # Create response with enhanced analysis
            response = RepoAnalysisResponse(
                repo_name=repo_name,
                branch_used=branch_to_use,
                files_analyzed=analysis_result.get('files_analyzed', 0),
                summaries=analysis_result.get('summaries', {}),
                structure=analysis_result.get('structure_analysis', {}),
                insights=analysis_result.get('insights', {}),
                architecture=analysis_result.get('architecture', {}),
                analysis_id=str(uuid.uuid4()),
                # Add enhanced analysis specific fields
                documentation=analysis_result.get('documentation', {}),
                learning_module=analysis_result.get('learning_module', {}),
                quality_score=analysis_result.get('quality_score', 0.75),
                analysis_type="enhanced_openai"
            )
            
            # Store enhanced analysis in database
            analysis_data = {
                "analysis_id": response.analysis_id,
                "repo_url": input.repo_url,
                "repo_name": repo_name,
                "branch": branch_to_use,
                "files_analyzed": response.files_analyzed,
                "structure": response.structure,
                "insights": response.insights,
                "architecture": response.architecture,
                "documentation": response.documentation,
                "learning_module": response.learning_module,
                "created_at": datetime.now(),
                "analysis_type": "enhanced_openai",
                "quality_score": response.quality_score
            }
            
            # Store in MongoDB
            try:
                await RepoStorage.save_repo_analysis(
                    repo_url=input.repo_url,
                    repo_name=repo_name,
                    branch_used=branch_to_use,
                    analysis_data=analysis_data
                )
            except Exception as e:
                print(f"Warning: Could not save analysis to database: {e}")
        
        return response
        
    except Exception as e:
        print(f"Error analyzing repository: {e}")
        raise HTTPException(status_code=500, detail=f"Error analyzing repository: {str(e)}")
        
    finally:
        # Clean up temporary directory
        if tmp_dir:
            safe_remove_directory(tmp_dir)

def analyze_repository_structure(repo_path: str) -> dict:
    """Analyze the repository structure and organization"""
    structure = {
        'root_files': [],
        'directories': {},
        'file_types': {},
        'total_files': 0,
        'total_dirs': 0
    }
    
    for root, dirs, files in os.walk(repo_path):
        # Skip .git directory
        if '.git' in root:
            continue
            
        relative_root = os.path.relpath(root, repo_path)
        
        # Count files by type
        for file in files:
            ext = os.path.splitext(file)[1].lower()
            structure['file_types'][ext] = structure['file_types'].get(ext, 0) + 1
            structure['total_files'] += 1
        
        # Organize directories
        if relative_root == '.':
            structure['root_files'] = files
        else:
            structure['directories'][relative_root] = {
                'files': files,
                'subdirs': dirs
            }
            structure['total_dirs'] += 1
    
    return structure

def should_skip_file(filename: str, file_path: str) -> bool:
    """Determine if a file should be skipped from analysis"""
    # Skip binary files
    binary_extensions = {'.exe', '.dll', '.so', '.dylib', '.bin', '.obj', '.o', '.a', '.lib'}
    ext = os.path.splitext(filename)[1].lower()
    if ext in binary_extensions:
        return True
    
    # Skip large files (> 1MB)
    try:
        if os.path.getsize(file_path) > 1024 * 1024:
            return True
    except:
        return True
    
    # Skip common files to ignore
    skip_patterns = [
        '.git', 'node_modules', '__pycache__', '.pytest_cache',
        '.DS_Store', 'Thumbs.db', '.env', '.env.local'
    ]
    
    for pattern in skip_patterns:
        if pattern in filename or pattern in file_path:
            return True
    
    return False

def analyze_file_content(filename: str, content: str, relative_path: str) -> dict:
    """Analyze file content and generate comprehensive insights"""
    ext = os.path.splitext(filename)[1].lower()
    
    analysis = {
        'filename': filename,
        'path': relative_path,
        'extension': ext,
        'size': len(content),
        'lines': len(content.split('\n')),
        'summary': '',
        'type': 'unknown',
        'dependencies': [],
        'apis': [],
        'classes': [],
        'functions': [],
        'imports': []
    }
    
    # Determine file type
    if ext in ['.py']:
        analysis['type'] = 'python'
        analysis.update(analyze_python_file(content))
    elif ext in ['.js', '.jsx', '.ts', '.tsx']:
        analysis['type'] = 'javascript'
        analysis.update(analyze_javascript_file(content))
    elif ext in ['.json']:
        analysis['type'] = 'json'
        analysis.update(analyze_json_file(content))
    elif ext in ['.md', '.txt']:
        analysis['type'] = 'documentation'
        analysis.update(analyze_documentation_file(content))
    elif ext in ['.yml', '.yaml']:
        analysis['type'] = 'configuration'
        analysis.update(analyze_config_file(content))
    elif ext in ['.html', '.htm']:
        analysis['type'] = 'html'
        analysis.update(analyze_html_file(content))
    elif ext in ['.css', '.scss', '.sass']:
        analysis['type'] = 'stylesheet'
        analysis.update(analyze_css_file(content))
    
    # Generate summary
    if LLM_AVAILABLE:
        try:
            analysis['summary'] = generate_summary(content, filename, analysis['type'])
        except:
            analysis['summary'] = generate_fallback_summary(analysis)
    else:
        analysis['summary'] = generate_fallback_summary(analysis)
    
    return analysis

def analyze_python_file(content: str) -> dict:
    """Analyze Python file content"""
    analysis = {
        'classes': [],
        'functions': [],
        'imports': [],
        'dependencies': []
    }
    
    lines = content.split('\n')
    for line in lines:
        line = line.strip()
        
        # Find imports
        if line.startswith('import ') or line.startswith('from '):
            analysis['imports'].append(line)
        
        # Find class definitions
        if line.startswith('class '):
            class_name = line.split('class ')[1].split('(')[0].split(':')[0].strip()
            analysis['classes'].append(class_name)
        
        # Find function definitions
        if line.startswith('def '):
            func_name = line.split('def ')[1].split('(')[0].strip()
            analysis['functions'].append(func_name)
    
    return analysis

def analyze_javascript_file(content: str) -> dict:
    """Analyze JavaScript/TypeScript file content"""
    analysis = {
        'classes': [],
        'functions': [],
        'imports': [],
        'exports': []
    }
    
    lines = content.split('\n')
    for line in lines:
        line = line.strip()
        
        # Find imports
        if line.startswith('import ') or line.startswith('const ') and 'require(' in line:
            analysis['imports'].append(line)
        
        # Find exports
        if line.startswith('export '):
            analysis['exports'].append(line)
        
        # Find class definitions
        if 'class ' in line and line.endswith('{'):
            class_name = line.split('class ')[1].split(' ')[0].split('{')[0].strip()
            analysis['classes'].append(class_name)
        
        # Find function definitions
        if line.startswith('function ') or 'function(' in line or '=>' in line:
            if 'function ' in line:
                func_name = line.split('function ')[1].split('(')[0].strip()
                analysis['functions'].append(func_name)
    
    return analysis

def analyze_json_file(content: str) -> dict:
    """Analyze JSON file content"""
    try:
        import json
        data = json.loads(content)
        return {
            'keys': list(data.keys()) if isinstance(data, dict) else [],
            'type': type(data).__name__,
            'size': len(str(data))
        }
    except:
        return {'error': 'Invalid JSON'}

def analyze_documentation_file(content: str) -> dict:
    """Analyze documentation file content"""
    lines = content.split('\n')
    headers = []
    
    for line in lines:
        if line.startswith('#'):
            headers.append(line.strip())
    
    return {
        'headers': headers,
        'word_count': len(content.split()),
        'has_code_blocks': '```' in content
    }

def analyze_config_file(content: str) -> dict:
    """Analyze configuration file content"""
    lines = content.split('\n')
    config_keys = []
    
    for line in lines:
        if ':' in line and not line.startswith('#'):
            key = line.split(':')[0].strip()
            config_keys.append(key)
    
    return {
        'config_keys': config_keys,
        'lines': len(lines)
    }

def analyze_html_file(content: str) -> dict:
    """Analyze HTML file content"""
    return {
        'has_scripts': '<script' in content,
        'has_styles': '<style' in content or 'css' in content,
        'has_forms': '<form' in content,
        'has_links': '<a ' in content
    }

def analyze_css_file(content: str) -> dict:
    """Analyze CSS file content"""
    return {
        'selectors': len([line for line in content.split('\n') if '{' in line]),
        'has_media_queries': '@media' in content,
        'has_animations': '@keyframes' in content
    }

def generate_fallback_summary(analysis: dict) -> str:
    """Generate a fallback summary when LLM is not available"""
    file_type = analysis['type']
    filename = analysis['filename']
    
    summary = f"File: {filename}\n"
    summary += f"Type: {file_type}\n"
    summary += f"Size: {analysis['size']} characters, {analysis['lines']} lines\n"
    
    if analysis['classes']:
        summary += f"Classes: {', '.join(analysis['classes'])}\n"
    if analysis['functions']:
        summary += f"Functions: {', '.join(analysis['functions'][:5])}\n"
    if analysis['imports']:
        summary += f"Imports: {len(analysis['imports'])} import statements\n"
    
    # Add content preview
    if analysis['size'] > 0:
        preview = analysis.get('content', '')[:200] + '...' if len(str(analysis.get('content', ''))) > 200 else str(analysis.get('content', ''))
        summary += f"Content preview: {preview}"
    
    return summary

def generate_gpt5_enhanced_summary(analysis: dict) -> str:
    """Generate an enhanced summary using GPT-5 for better quality"""
    if not LLM_AVAILABLE:
        return generate_fallback_summary(analysis)
    
    filename = analysis.get('filename', 'Unknown file')
    content = analysis.get('content', '')
    file_type = analysis.get('type', 'unknown')
    
    prompt = f"""
You are a technical documentation expert powered by GPT-5. Analyze this {file_type} file and provide a clear, professional summary.

File: {filename}
Content: {content[:2000]}

Please provide a concise summary that includes:
1. The main purpose of this file
2. Key components or functionality
3. Important patterns or architecture decisions
4. Any notable dependencies or relationships

Write in clear, professional language suitable for technical documentation.
"""
    
    try:
        # Use GPT-5 for enhanced analysis
        return ask_openai(
            prompt=prompt,
            task_type="documentation",
            complexity="medium",
            max_tokens=300
        )
    except Exception as e:
        print(f"Error generating GPT-5 summary: {e}")
        return generate_fallback_summary(analysis)

def generate_project_insights(file_analysis: dict, structure: dict) -> dict:
    """Generate insights about the project structure and architecture"""
    insights = {
        'project_type': 'unknown',
        'framework': 'unknown',
        'language': 'unknown',
        'architecture_pattern': 'unknown',
        'has_frontend': False,
        'has_backend': False,
        'has_database': False,
        'has_tests': False,
        'has_docs': False,
        'deployment_ready': False,
        'complexity_score': 0
    }
    
    # Analyze file types
    file_types = {}
    for file_info in file_analysis.values():
        ext = file_info['extension']
        file_types[ext] = file_types.get(ext, 0) + 1
    
    # Determine project type
    if file_types.get('.py', 0) > 0:
        insights['language'] = 'Python'
        if any('fastapi' in str(imports).lower() for imports in [f.get('imports', []) for f in file_analysis.values()]):
            insights['framework'] = 'FastAPI'
        elif any('django' in str(imports).lower() for imports in [f.get('imports', []) for f in file_analysis.values()]):
            insights['framework'] = 'Django'
        elif any('flask' in str(imports).lower() for imports in [f.get('imports', []) for f in file_analysis.values()]):
            insights['framework'] = 'Flask'
        insights['has_backend'] = True
    
    if file_types.get('.js', 0) > 0 or file_types.get('.jsx', 0) > 0 or file_types.get('.ts', 0) > 0:
        insights['language'] = 'JavaScript/TypeScript'
        if any('react' in str(imports).lower() for imports in [f.get('imports', []) for f in file_analysis.values()]):
            insights['framework'] = 'React'
        elif any('vue' in str(imports).lower() for imports in [f.get('imports', []) for f in file_analysis.values()]):
            insights['framework'] = 'Vue.js'
        insights['has_frontend'] = True
    
    # Check for common patterns
    if insights['has_frontend'] and insights['has_backend']:
        insights['project_type'] = 'Full-stack Web Application'
        insights['architecture_pattern'] = 'Client-Server'
    elif insights['has_frontend']:
        insights['project_type'] = 'Frontend Application'
    elif insights['has_backend']:
        insights['project_type'] = 'Backend API'
    
    # Check for database
    if any('sql' in f['filename'].lower() or 'database' in f['filename'].lower() for f in file_analysis.values()):
        insights['has_database'] = True
    
    # Check for tests
    if any('test' in f['filename'].lower() or 'spec' in f['filename'].lower() for f in file_analysis.values()):
        insights['has_tests'] = True
    
    # Check for documentation
    if any(f['type'] == 'documentation' for f in file_analysis.values()):
        insights['has_docs'] = True
    
    # Check for deployment files
    deployment_files = ['dockerfile', 'docker-compose', 'package.json', 'requirements.txt', 'pom.xml', 'build.gradle']
    if any(any(df in f['filename'].lower() for df in deployment_files) for f in file_analysis.values()):
        insights['deployment_ready'] = True
    
    # Calculate complexity score
    insights['complexity_score'] = len(file_analysis) + len(structure['directories']) * 2
    
    return insights

def generate_architecture_data(file_analysis: dict, structure: dict) -> dict:
    """Generate data for architecture diagrams"""
    architecture = {
        'components': [],
        'relationships': [],
        'layers': {
            'frontend': [],
            'backend': [],
            'database': [],
            'configuration': []
        }
    }
    
    # Categorize files by layer
    for file_path, file_info in file_analysis.items():
        component = {
            'name': file_info['filename'],
            'path': file_path,
            'type': file_info['type'],
            'layer': 'unknown'
        }
        
        # Determine layer
        if file_info['type'] in ['html', 'stylesheet', 'javascript']:
            component['layer'] = 'frontend'
            architecture['layers']['frontend'].append(component)
        elif file_info['type'] in ['python', 'javascript'] and 'api' in file_path.lower():
            component['layer'] = 'backend'
            architecture['layers']['backend'].append(component)
        elif file_info['type'] == 'configuration':
            component['layer'] = 'configuration'
            architecture['layers']['configuration'].append(component)
        
        architecture['components'].append(component)
    
    # Generate relationships based on imports and dependencies
    for file_path, file_info in file_analysis.items():
        if 'imports' in file_info:
            for import_stmt in file_info['imports']:
                # This is a simplified relationship detection
                # In a real implementation, you'd parse the imports more carefully
                relationship = {
                    'from': file_path,
                    'to': import_stmt,
                    'type': 'import'
                }
                architecture['relationships'].append(relationship)
    
    return architecture

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

@router.get("/saved-analyses")
async def get_saved_analyses(limit: int = 10):
    """Get recent saved analyses"""
    try:
        analyses = await RepoStorage.get_recent_analyses(limit=limit)
        return {
            "analyses": analyses,
            "total": len(analyses)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving analyses: {str(e)}")

@router.get("/saved-analyses/{analysis_id}")
async def get_saved_analysis(analysis_id: str):
    """Get a specific saved analysis with all its data"""
    try:
        analysis_data = await RepoStorage.get_analysis_with_documentation(analysis_id)
        if not analysis_data:
            raise HTTPException(status_code=404, detail="Analysis not found")
        return analysis_data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving analysis: {str(e)}")

@router.delete("/saved-analyses/{analysis_id}")
async def delete_saved_analysis(analysis_id: str):
    """Delete a saved analysis and all its associated data"""
    try:
        success = await RepoStorage.delete_analysis(analysis_id)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete analysis")
        return {"message": "Analysis deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting analysis: {str(e)}")

@router.get("/user-analyses/{user_id}")
async def get_user_analyses(user_id: str, limit: int = 10):
    """Get all analyses for a specific user"""
    try:
        analyses = await RepoStorage.get_user_analyses(user_id, limit=limit)
        return {
            "analyses": analyses,
            "total": len(analyses),
            "user_id": user_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving user analyses: {str(e)}")

# New endpoint for manually saving analysis
class SaveAnalysisRequest(BaseModel):
    analysis: Dict[str, Any]
    repo_url: str
    timestamp: str

@router.post("/save-analysis")
async def save_analysis(request: SaveAnalysisRequest):
    """Manually save an analysis result"""
    try:
        # Extract repository name from the analysis data
        repo_name = request.analysis.get('repo_name', 'Unknown Repository')
        
        # Save the analysis using the existing storage method
        analysis_id = await RepoStorage.save_repo_analysis(
            repo_url=request.repo_url,
            repo_name=repo_name,
            branch_used=request.analysis.get('branch_used', 'Unknown'),
            analysis_data=request.analysis,
            user_id=None  # TODO: Add user authentication later
        )
        
        return {
            "success": True,
            "message": "Analysis saved successfully",
            "analysis_id": analysis_id,
            "timestamp": request.timestamp
        }
        
    except Exception as e:
        print(f"Error saving analysis: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to save analysis: {str(e)}"
        ) 