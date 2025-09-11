import markdown
from fpdf import FPDF
import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
import json
from datetime import datetime

# Import storage module
from repo_storage import RepoStorage

router = APIRouter()

class DocumentationRequest(BaseModel):
    summaries: Dict[str, str]
    repo_name: str
    format: str = "markdown"  # markdown, pdf, or both
    insights: Optional[Dict[str, Any]] = None
    architecture: Optional[Dict[str, Any]] = None
    analysis_id: Optional[str] = None
    
    class Config:
        arbitrary_types_allowed = True

class QuizRequest(BaseModel):
    markdown_content: str
    num_questions: int = 3
    difficulty: str = "medium"  # easy, medium, hard
    analysis_id: Optional[str] = None

def generate_markdown_documentation(summaries: Dict[str, str], repo_name: str, insights: Optional[Dict[str, Any]] = None, architecture: Optional[Dict[str, Any]] = None) -> str:
    """Generate comprehensive markdown documentation from repository analysis"""
    
    md_content = f"""# {repo_name} - Technical Documentation

Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## Overview

This documentation was automatically generated from the repository analysis. It provides insights into the codebase structure, key components, and their purposes.

"""
    
    # Add project insights if available
    if insights:
        md_content += f"""
## Project Analysis

### Project Type
- **Type**: {insights.get('project_type', 'Unknown')}
- **Language**: {insights.get('language', 'Unknown')}
- **Framework**: {insights.get('framework', 'Unknown')}
- **Architecture Pattern**: {insights.get('architecture_pattern', 'Unknown')}

### Components
- **Frontend**: {'✅ Yes' if insights.get('has_frontend') else '❌ No'}
- **Backend**: {'✅ Yes' if insights.get('has_backend') else '❌ No'}
- **Database**: {'✅ Yes' if insights.get('has_database') else '❌ No'}
- **Tests**: {'✅ Yes' if insights.get('has_tests') else '❌ No'}
- **Documentation**: {'✅ Yes' if insights.get('has_docs') else '❌ No'}
- **Deployment Ready**: {'✅ Yes' if insights.get('deployment_ready') else '❌ No'}

### Complexity
- **Complexity Score**: {insights.get('complexity_score', 0)} (based on file count and structure)

"""
    
    # Add architecture diagram if available
    if architecture:
        md_content += f"""
## Architecture Overview

### Components by Layer

"""
        
        for layer, components in architecture.get('layers', {}).items():
            if components:
                md_content += f"\n#### {layer.title()} Layer\n\n"
                for component in components:
                    md_content += f"- **{component['name']}** (`{component['path']}`) - {component['type']}\n"
        
        if architecture.get('relationships'):
            md_content += f"\n#### Key Dependencies\n\n"
            for rel in architecture['relationships'][:10]:  # Show first 10 relationships
                md_content += f"- `{rel['from']}` → `{rel['to']}`\n"
    
    md_content += f"""
## File Analysis

"""
    
    # Group files by type
    file_groups = {
        'Python Files': [],
        'JavaScript/TypeScript': [],
        'Configuration': [],
        'Documentation': [],
        'Other': []
    }
    
    for filename, summary in summaries.items():
        if filename.endswith('.py'):
            file_groups['Python Files'].append((filename, summary))
        elif filename.endswith(('.js', '.ts', '.jsx', '.tsx')):
            file_groups['JavaScript/TypeScript'].append((filename, summary))
        elif filename.endswith(('.json', '.yaml', '.yml', '.toml')):
            file_groups['Configuration'].append((filename, summary))
        elif filename.endswith(('.md', '.txt')):
            file_groups['Documentation'].append((filename, summary))
        else:
            file_groups['Other'].append((filename, summary))
    
    # Generate sections for each group
    for group_name, files in file_groups.items():
        if files:
            md_content += f"\n### {group_name}\n\n"
            for filename, summary in files:
                md_content += f"#### {filename}\n\n{summary}\n\n"
    
    md_content += """
## Learning Path Recommendations

Based on the analysis, here's a suggested learning path:

### 1. Start with Documentation
- Review README files and documentation
- Understand the project's purpose and goals

### 2. Explore the Architecture
- Study the main entry points
- Understand the data flow between components

### 3. Dive into Core Components
- Examine key business logic files
- Study API endpoints and data models

### 4. Understand Configuration
- Review deployment and environment setup
- Study dependency management

### 5. Practice with Tests
- Run existing tests to understand expected behavior
- Add new tests to reinforce learning

## Next Steps

1. Review the generated documentation for accuracy
2. Add missing documentation for critical components
3. Update documentation as the codebase evolves
4. Consider implementing automated documentation updates
5. Create micro-lessons based on this documentation
6. Develop simulations for key user flows

---

*This documentation was generated automatically using AI-powered analysis.*
"""
    
    return md_content

def markdown_to_pdf(md_text: str, output_filename: str = "documentation.pdf") -> str:
    """Convert markdown to PDF"""
    try:
        # Ensure static directory exists
        static_dir = "static"
        os.makedirs(static_dir, exist_ok=True)
        
        # Create PDF
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Arial", size=12)
        
        # Simple text processing - avoid HTML parsing issues
        lines = md_text.split('\n')
        for line in lines:
            try:
                line = line.strip()
                if not line:
                    pdf.ln(5)  # Add some space
                    continue
                
                # Handle headers
                if line.startswith('# '):
                    pdf.set_font("Arial", 'B', 16)
                    text = line.replace('# ', '')
                    pdf.cell(0, 10, text, ln=True)
                    pdf.set_font("Arial", size=12)
                elif line.startswith('## '):
                    pdf.set_font("Arial", 'B', 14)
                    text = line.replace('## ', '')
                    pdf.cell(0, 10, text, ln=True)
                    pdf.set_font("Arial", size=12)
                elif line.startswith('### '):
                    pdf.set_font("Arial", 'B', 12)
                    text = line.replace('### ', '')
                    pdf.cell(0, 10, text, ln=True)
                    pdf.set_font("Arial", size=12)
                elif line.startswith('#### '):
                    pdf.set_font("Arial", 'B', 11)
                    text = line.replace('#### ', '')
                    pdf.cell(0, 10, text, ln=True)
                    pdf.set_font("Arial", size=12)
                else:
                    # Regular text
                    pdf.multi_cell(0, 10, line)
                    
            except Exception as line_error:
                print(f"Error processing line in PDF: {line_error}")
                continue
        
        # Save PDF
        output_path = os.path.join(static_dir, output_filename)
        pdf.output(output_path)
        
        return output_path
        
    except Exception as e:
        print(f"Error in markdown_to_pdf: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating PDF: {str(e)}")

@router.post("/generate-documentation")
async def generate_documentation(request: DocumentationRequest):
    """Generate documentation from repository analysis"""
    try:
        print(f"Generating documentation for repo: {request.repo_name}")
        print(f"Format requested: {request.format}")
        print(f"Number of summaries: {len(request.summaries)}")
        
        # Generate markdown
        md_content = generate_markdown_documentation(
            request.summaries, 
            request.repo_name, 
            request.insights, 
            request.architecture
        )
        
        result = {
            "markdown": md_content,
            "repo_name": request.repo_name,
            "generated_at": datetime.now().isoformat()
        }
        
        # Generate PDF if requested
        if request.format in ["pdf", "both"]:
            try:
                pdf_path = markdown_to_pdf(md_content, f"{request.repo_name}_documentation.pdf")
                result["pdf_path"] = pdf_path
                print(f"PDF generated successfully: {pdf_path}")
            except Exception as pdf_error:
                print(f"PDF generation failed: {pdf_error}")
                # Continue without PDF if it fails
                result["pdf_error"] = str(pdf_error)
        
        # Save documentation to database if analysis_id is provided
        if request.analysis_id:
            try:
                doc_id = await RepoStorage.save_documentation(
                    analysis_id=request.analysis_id,
                    documentation_data=result,
                    format_type=request.format
                )
                result["documentation_id"] = doc_id
                print(f"Documentation saved to database with ID: {doc_id}")
            except Exception as e:
                print(f"Warning: Could not save documentation to database: {e}")
                result["save_error"] = str(e)
        
        return result
        
    except Exception as e:
        print(f"Error in generate_documentation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating documentation: {str(e)}")

@router.post("/generate-quiz")
async def generate_quiz(request: QuizRequest):
    """Generate quiz questions from markdown content"""
    try:
        print(f"Generating quiz with {request.num_questions} questions, difficulty: {request.difficulty}")
        print(f"Markdown content length: {len(request.markdown_content)}")
        
        try:
            from llm import generate_quiz_questions
            
            quiz = await generate_quiz_questions(
                request.markdown_content, 
                request.num_questions, 
                request.difficulty
            )
            
            print(f"Generated quiz with {len(quiz) if quiz else 0} questions")
            
        except ImportError as import_error:
            print(f"Import error: {import_error}")
            # Fallback if llm module is not available
            quiz = [
                {
                    "question": "What is the main purpose of this documentation?",
                    "options": [
                        "To explain the codebase structure",
                        "To provide installation instructions", 
                        "To list all dependencies",
                        "To show deployment steps"
                    ],
                    "correct_answer": "To explain the codebase structure",
                    "explanation": "The documentation was generated to explain the structure and purpose of the codebase."
                }
            ]
        except Exception as llm_error:
            print(f"LLM error: {llm_error}")
            # Fallback if LLM generation fails
            quiz = [
                {
                    "question": "What is the main purpose of this documentation?",
                    "options": [
                        "To explain the codebase structure",
                        "To provide installation instructions", 
                        "To list all dependencies",
                        "To show deployment steps"
                    ],
                    "correct_answer": "To explain the codebase structure",
                    "explanation": "The documentation was generated to explain the structure and purpose of the codebase."
                }
            ]
        
        if not quiz or not isinstance(quiz, list):
            print(f"Invalid quiz format: {type(quiz)} - {quiz}")
            quiz = [
                {
                    "question": "What is the main purpose of this documentation?",
                    "options": [
                        "To explain the codebase structure",
                        "To provide installation instructions", 
                        "To list all dependencies",
                        "To show deployment steps"
                    ],
                    "correct_answer": "To explain the codebase structure",
                    "explanation": "The documentation was generated to explain the structure and purpose of the codebase."
                }
            ]
        
        result = {
            "quiz": quiz,
            "num_questions": request.num_questions,
            "difficulty": request.difficulty,
            "generated_at": datetime.now().isoformat()
        }
        
        # Save quiz to database if analysis_id is provided
        if request.analysis_id:
            try:
                quiz_id = await RepoStorage.save_quiz(
                    analysis_id=request.analysis_id,
                    quiz_data=result,
                    difficulty=request.difficulty
                )
                result["quiz_id"] = quiz_id
                print(f"Quiz saved to database with ID: {quiz_id}")
            except Exception as e:
                print(f"Warning: Could not save quiz to database: {e}")
                result["save_error"] = str(e)
        
        print(f"Returning quiz result: {len(result.get('quiz', []))} questions")
        return result
        
    except Exception as e:
        print(f"Error in generate_quiz endpoint: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error generating quiz: {str(e)}")

@router.delete("/delete-analysis/{analysis_id}")
async def delete_analysis(analysis_id: str):
    """Delete repository analysis and all associated data"""
    try:
        print(f"Deleting analysis with ID: {analysis_id}")
        
        # Delete the analysis and all associated data
        success = await RepoStorage.delete_analysis(analysis_id)
        
        if success:
            print(f"Successfully deleted analysis: {analysis_id}")
            return {
                "success": True,
                "message": "Analysis deleted successfully",
                "deleted_at": datetime.now().isoformat()
            }
        else:
            print(f"Failed to delete analysis: {analysis_id}")
            raise HTTPException(status_code=500, detail="Failed to delete analysis")
            
    except Exception as e:
        print(f"Error deleting analysis {analysis_id}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error deleting analysis: {str(e)}")

@router.post("/cleanup-old-analyses")
async def cleanup_old_analyses():
    """Clean up analyses older than 30 days"""
    try:
        print("Starting cleanup of old analyses...")
        
        # Delete analyses older than 30 days
        deleted_count = await RepoStorage.cleanup_old_analyses(days_old=30)
        
        print(f"Cleanup completed. Deleted {deleted_count} old analyses.")
        return {
            "success": True,
            "message": f"Cleanup completed successfully",
            "deleted_count": deleted_count,
            "cleaned_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        print(f"Error during cleanup: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error during cleanup: {str(e)}")

@router.get("/download-pdf/{filename}")
async def download_pdf(filename: str):
    """Download generated PDF file"""
    file_path = f"static/{filename}"
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="PDF file not found")
    
    from fastapi.responses import FileResponse
    return FileResponse(file_path, media_type="application/pdf", filename=filename) 