from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from fastapi.responses import JSONResponse
from typing import List, Dict, Any, Optional
import os
import tempfile
import shutil
from pathlib import Path
import json
from datetime import datetime

from backend.readme_generator import (
    generate_enhanced_readme,
    create_learning_module_from_readme,
    analyze_project_structure
)
from backend.repo_storage import RepoStorage

router = APIRouter(prefix="/cursor-readme", tags=["Cursor AI README Generator"])

@router.post("/upload-files")
async def upload_project_files(files: List[UploadFile] = File(...)):
    """Upload project files for Cursor AI-style README generation"""
    try:
        if not files:
            raise HTTPException(status_code=400, detail="No files provided")
        
        # Create temporary directory for processing
        with tempfile.TemporaryDirectory() as temp_dir:
            file_contents = {}
            
            # Save uploaded files and read their content
            for file in files:
                if file.filename:
                    # Create subdirectories if needed
                    file_path = Path(temp_dir) / file.filename
                    file_path.parent.mkdir(parents=True, exist_ok=True)
                    
                    # Save file
                    with open(file_path, "wb") as buffer:
                        shutil.copyfileobj(file.file, buffer)
                    
                    # Read content
                    try:
                        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                            content = f.read()
                        file_contents[file.filename] = content
                    except Exception as e:
                        # Skip files that can't be read as text
                        print(f"Warning: Could not read {file.filename}: {e}")
                        continue
            
            if not file_contents:
                raise HTTPException(status_code=400, detail="No readable text files found")
            
            # Generate enhanced README analysis
            analysis_result = generate_enhanced_readme(file_contents)
            
            if "error" in analysis_result:
                raise HTTPException(status_code=500, detail=analysis_result["error"])
            
            return {
                "success": True,
                "message": f"Successfully analyzed {analysis_result['file_count']} files",
                "project_structure": analysis_result["project_structure"],
                "estimated_tokens": analysis_result["estimated_tokens"],
                "prompt_ready": True
            }
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing files: {str(e)}")

@router.post("/generate")
async def generate_cursor_readme(
    project_name: str = Form(...),
    project_description: Optional[str] = Form(""),
    include_learning_module: bool = Form(True)
):
    """Generate Cursor AI-style README using the uploaded files"""
    try:
        # This would integrate with your LLM service
        # For now, we'll return a structured response
        
        # Simulate LLM processing
        sample_readme = f"""# {project_name}

## Overview
{project_description or "A comprehensive software project with modern architecture and best practices."}

## Features
- **Modern Architecture**: Built with scalable and maintainable design patterns
- **Comprehensive Testing**: Full test coverage with automated CI/CD
- **Documentation**: Detailed documentation and API references
- **Performance**: Optimized for high performance and low latency

## Architecture
This project follows a modern microservices architecture with clear separation of concerns.

### Backend
- **API Layer**: RESTful API with comprehensive endpoints
- **Business Logic**: Clean, testable business logic implementation
- **Data Layer**: Efficient data access with proper abstraction

### Frontend
- **User Interface**: Modern, responsive UI with excellent UX
- **State Management**: Robust state management for complex applications
- **Performance**: Optimized for fast loading and smooth interactions

## Technologies
- **Backend**: Python, FastAPI, SQLAlchemy
- **Frontend**: React, TypeScript, Tailwind CSS
- **Database**: PostgreSQL, Redis
- **Deployment**: Docker, Kubernetes

## Installation

### Prerequisites
- Python 3.8+
- Node.js 16+
- Docker (optional)

### Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/username/{project_name.lower().replace(' ', '-')}.git
   cd {project_name.lower().replace(' ', '-')}
   ```

2. Install backend dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

4. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

## Usage

### Running the Application
1. Start the backend:
   ```bash
   cd backend
   uvicorn main:app --reload
   ```

2. Start the frontend:
   ```bash
   cd frontend
   npm start
   ```

3. Access the application at `http://localhost:3000`

## API Documentation
The API documentation is available at `http://localhost:8000/docs` when the backend is running.

## Testing
Run the test suite:
```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

## Deployment
This project includes Docker configuration for easy deployment:

```bash
docker-compose up -d
```

## Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License
This project is licensed under the MIT License - see the LICENSE file for details.
"""
        
        # Create learning module if requested
        learning_module = None
        if include_learning_module:
            learning_module = create_learning_module_from_readme(sample_readme, project_name)
        
        return {
            "success": True,
            "readme_content": sample_readme,
            "project_name": project_name,
            "learning_module": learning_module,
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating README: {str(e)}")

@router.post("/save-learning-module")
async def save_learning_module(
    project_name: str = Form(...),
    readme_content: str = Form(...),
    user_id: Optional[str] = Form(None)
):
    """Save the generated README as a learning module in the system"""
    try:
        # Create learning module structure
        learning_module = create_learning_module_from_readme(readme_content, project_name)
        
        # Save to database (integrate with your existing storage)
        # For now, we'll return the structure
        module_id = f"doc_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
        
        return {
            "success": True,
            "module_id": module_id,
            "learning_module": learning_module,
            "message": "Learning module created successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving learning module: {str(e)}")

@router.get("/learning-modules")
async def get_learning_modules(limit: int = 10):
    """Get list of saved learning modules"""
    try:
        # This would fetch from your database
        # For now, return sample data
        modules = [
            {
                "id": "doc_20250106_001",
                "title": "Documentation: Sample Project",
                "description": "Comprehensive documentation and learning guide",
                "type": "documentation",
                "total_sections": 8,
                "estimated_duration": 80,
                "difficulty": "intermediate",
                "created_at": "2025-01-06T10:00:00Z"
            }
        ]
        
        return {
            "success": True,
            "modules": modules[:limit],
            "total": len(modules)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching learning modules: {str(e)}")

@router.get("/learning-module/{module_id}")
async def get_learning_module(module_id: str):
    """Get specific learning module content"""
    try:
        # This would fetch from your database
        # For now, return sample data
        module = {
            "id": module_id,
            "title": "Documentation: Sample Project",
            "description": "Comprehensive documentation and learning guide",
            "type": "documentation",
            "sections": [
                {
                    "title": "Overview",
                    "content": "# Overview\n\nThis is a sample project overview...",
                    "order": 1
                },
                {
                    "title": "Installation",
                    "content": "# Installation\n\nStep-by-step installation guide...",
                    "order": 2
                }
            ],
            "total_sections": 2,
            "estimated_duration": 20,
            "difficulty": "intermediate",
            "created_at": "2025-01-06T10:00:00Z"
        }
        
        return {
            "success": True,
            "module": module
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching learning module: {str(e)}") 