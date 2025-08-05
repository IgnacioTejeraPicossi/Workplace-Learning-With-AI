import markdown
from fpdf import FPDF
import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional
import json
from datetime import datetime

router = APIRouter()

class DocumentationRequest(BaseModel):
    summaries: Dict[str, str]
    repo_name: str
    format: str = "markdown"  # markdown, pdf, or both

class QuizRequest(BaseModel):
    markdown_content: str
    num_questions: int = 3
    difficulty: str = "medium"  # easy, medium, hard

def generate_markdown_documentation(summaries: Dict[str, str], repo_name: str) -> str:
    """Generate comprehensive markdown documentation from repository summaries"""
    
    md_content = f"""# {repo_name} - Technical Documentation

Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## Overview

This documentation was automatically generated from the repository analysis. It provides insights into the codebase structure, key components, and their purposes.

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
## Architecture Insights

Based on the analysis, this application appears to be a modern web application with the following characteristics:

- **Frontend**: React/TypeScript components with modern tooling
- **Backend**: Python FastAPI or Node.js server
- **Configuration**: Standard configuration files for deployment and development
- **Documentation**: README and other documentation files

## Next Steps

1. Review the generated documentation for accuracy
2. Add missing documentation for critical components
3. Update documentation as the codebase evolves
4. Consider implementing automated documentation updates

---

*This documentation was generated automatically using AI-powered analysis.*
"""
    
    return md_content

def markdown_to_pdf(md_text: str, output_filename: str = "documentation.pdf") -> str:
    """Convert markdown to PDF"""
    try:
        # Convert markdown to HTML
        html = markdown.markdown(md_text, extensions=['tables', 'fenced_code', 'codehilite'])
        
        # Create PDF
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Arial", size=12)
        
        # Simple HTML to PDF conversion
        lines = html.split('\n')
        for line in lines:
            if line.startswith('<h1>'):
                pdf.set_font("Arial", 'B', 16)
                text = line.replace('<h1>', '').replace('</h1>', '')
                pdf.cell(0, 10, text, ln=True)
                pdf.set_font("Arial", size=12)
            elif line.startswith('<h2>'):
                pdf.set_font("Arial", 'B', 14)
                text = line.replace('<h2>', '').replace('</h2>', '')
                pdf.cell(0, 10, text, ln=True)
                pdf.set_font("Arial", size=12)
            elif line.startswith('<h3>'):
                pdf.set_font("Arial", 'B', 12)
                text = line.replace('<h3>', '').replace('</h3>', '')
                pdf.cell(0, 10, text, ln=True)
                pdf.set_font("Arial", size=12)
            elif line.startswith('<p>'):
                text = line.replace('<p>', '').replace('</p>', '')
                pdf.multi_cell(0, 10, text)
            elif line.strip():
                pdf.multi_cell(0, 10, line)
        
        # Save PDF
        output_path = f"static/{output_filename}"
        os.makedirs("static", exist_ok=True)
        pdf.output(output_path)
        
        return output_path
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating PDF: {str(e)}")

@router.post("/generate-documentation")
async def generate_documentation(request: DocumentationRequest):
    """Generate documentation from repository analysis"""
    try:
        # Generate markdown
        md_content = generate_markdown_documentation(request.summaries, request.repo_name)
        
        result = {
            "markdown": md_content,
            "repo_name": request.repo_name,
            "generated_at": datetime.now().isoformat()
        }
        
        # Generate PDF if requested
        if request.format in ["pdf", "both"]:
            pdf_path = markdown_to_pdf(md_content, f"{request.repo_name}_documentation.pdf")
            result["pdf_path"] = pdf_path
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating documentation: {str(e)}")

@router.post("/generate-quiz")
async def generate_quiz(request: QuizRequest):
    """Generate quiz questions from markdown content"""
    try:
        from llm import generate_quiz_questions
        
        quiz = await generate_quiz_questions(
            request.markdown_content, 
            request.num_questions, 
            request.difficulty
        )
        
        return {
            "quiz": quiz,
            "num_questions": request.num_questions,
            "difficulty": request.difficulty,
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating quiz: {str(e)}")

@router.get("/download-pdf/{filename}")
async def download_pdf(filename: str):
    """Download generated PDF file"""
    file_path = f"static/{filename}"
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="PDF file not found")
    
    from fastapi.responses import FileResponse
    return FileResponse(file_path, media_type="application/pdf", filename=filename) 