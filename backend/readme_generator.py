from typing import Dict, List, Any
import os
import tempfile
import shutil
from pathlib import Path

def analyze_project_structure(file_contents: Dict[str, str]) -> Dict[str, Any]:
    """Analyze project structure to understand architecture"""
    structure = {
        'backend_files': [],
        'frontend_files': [],
        'config_files': [],
        'documentation_files': [],
        'test_files': [],
        'other_files': [],
        'technologies': set(),
        'main_components': [],
        'dependencies': set()
    }
    
    for file_path, content in file_contents.items():
        path_lower = file_path.lower()
        
        # Categorize files
        if any(ext in path_lower for ext in ['.py', '.js', '.ts', '.jsx', '.tsx', '.html', '.css']):
            if any(backend_indicator in path_lower for backend_indicator in ['api', 'server', 'backend', 'app.py', 'main.py']):
                structure['backend_files'].append(file_path)
                if '.py' in path_lower:
                    structure['technologies'].add('Python')
                    if 'fastapi' in content.lower():
                        structure['technologies'].add('FastAPI')
                    if 'flask' in content.lower():
                        structure['technologies'].add('Flask')
                    if 'django' in content.lower():
                        structure['technologies'].add('Django')
            elif any(frontend_indicator in path_lower for frontend_indicator in ['react', 'vue', 'angular', 'component', 'src/', 'public/']):
                structure['frontend_files'].append(file_path)
                if '.jsx' in path_lower or '.tsx' in path_lower:
                    structure['technologies'].add('React')
                if '.vue' in path_lower:
                    structure['technologies'].add('Vue.js')
                if '.ts' in path_lower:
                    structure['technologies'].add('TypeScript')
        elif any(ext in path_lower for ext in ['.json', '.yaml', '.yml', '.toml', '.ini', '.env']):
            structure['config_files'].append(file_path)
        elif any(ext in path_lower for ext in ['.md', '.txt', '.rst']):
            structure['documentation_files'].append(file_path)
        elif any(ext in path_lower for ext in ['.test.', '.spec.', 'test_', '_test']):
            structure['test_files'].append(file_path)
        else:
            structure['other_files'].append(file_path)
    
    # Convert sets to lists for JSON serialization
    structure['technologies'] = list(structure['technologies'])
    structure['dependencies'] = list(structure['dependencies'])
    
    return structure

def summarize_files(file_contents: Dict[str, str]) -> str:
    """Create comprehensive file summaries"""
    summaries = []
    
    for file_path, content in file_contents.items():
        # Limit content length to avoid token limits
        content_preview = content[:2000] if len(content) > 2000 else content
        
        summary = f"""
# File: {file_path}
Content Preview:
{content_preview}
---
"""
        summaries.append(summary)
    
    return "\n".join(summaries)

def build_architectural_prompt(file_summaries: str, project_structure: Dict[str, Any]) -> str:
    """Build a comprehensive architectural prompt for README generation"""
    
    tech_stack = ", ".join(project_structure['technologies'])
    backend_count = len(project_structure['backend_files'])
    frontend_count = len(project_structure['frontend_files'])
    
    return f"""
You are a senior software architect and technical writer with expertise in creating professional documentation. 
A user has submitted a GitHub repository for analysis.

PROJECT STRUCTURE ANALYSIS:
- Backend files: {backend_count} files
- Frontend files: {frontend_count} files  
- Configuration files: {len(project_structure['config_files'])} files
- Documentation files: {len(project_structure['documentation_files'])} files
- Test files: {len(project_structure['test_files'])} files
- Technologies detected: {tech_stack}

PROJECT FILES AND CONTENT:
{file_summaries}

TASK: Create a professional, comprehensive README.md that demonstrates the same quality and depth as Cursor AI would produce.

REQUIREMENTS:
1. **Project Overview**: Clear, concise description of what the project does and its purpose
2. **Features**: List of key features and capabilities
3. **Architecture**: Explain how different components work together
4. **Technologies**: Complete tech stack with versions if mentioned
5. **Installation**: Step-by-step setup instructions
6. **Usage**: Examples of how to use the project
7. **API Documentation**: If applicable, document key endpoints
8. **Configuration**: Explain configuration options
9. **Testing**: How to run tests
10. **Deployment**: Deployment instructions
11. **Contributing**: Guidelines for contributors
12. **License**: License information

STYLE GUIDELINES:
- Use clear, professional language
- Include code examples where helpful
- Use proper Markdown formatting
- Be comprehensive but concise
- Focus on practical information
- Explain the "why" not just the "what"
- Include troubleshooting tips if relevant

Generate a README.md that would make any developer want to use and contribute to this project.
"""

def generate_enhanced_readme(file_contents: Dict[str, str]) -> str:
    """Generate enhanced README using architectural analysis"""
    try:
        # Analyze project structure
        project_structure = analyze_project_structure(file_contents)
        
        # Create file summaries
        file_summaries = summarize_files(file_contents)
        
        # Build comprehensive prompt
        prompt = build_architectural_prompt(file_summaries, project_structure)
        
        # For now, return the prompt structure - this will be integrated with LLM
        return {
            "prompt": prompt,
            "project_structure": project_structure,
            "file_count": len(file_contents),
            "estimated_tokens": len(prompt.split()) * 1.3  # Rough estimate
        }
        
    except Exception as e:
        return {
            "error": f"Error generating enhanced README: {str(e)}",
            "prompt": "",
            "project_structure": {},
            "file_count": 0
        }

def create_learning_module_from_readme(readme_content: str, project_name: str) -> Dict[str, Any]:
    """Convert README content into a learning module structure"""
    
    # Split README into sections for learning
    sections = []
    current_section = {"title": "Overview", "content": "", "order": 0}
    
    lines = readme_content.split('\n')
    section_order = 0
    
    for line in lines:
        if line.startswith('# '):
            # New main section
            if current_section["content"].strip():
                sections.append(current_section)
            
            section_title = line[2:].strip()
            section_order += 1
            current_section = {
                "title": section_title,
                "content": line + "\n",
                "order": section_order
            }
        elif line.startswith('## '):
            # Subsection - add to current section
            current_section["content"] += line + "\n"
        else:
            # Regular content
            current_section["content"] += line + "\n"
    
    # Add the last section
    if current_section["content"].strip():
        sections.append(current_section)
    
    # Create learning module structure
    learning_module = {
        "title": f"Documentation: {project_name}",
        "description": f"Comprehensive documentation and learning guide for {project_name}",
        "type": "documentation",
        "sections": sections,
        "total_sections": len(sections),
        "estimated_duration": len(sections) * 10,  # 10 minutes per section
        "difficulty": "intermediate",
        "tags": ["documentation", "learning", "project-analysis"],
        "created_at": "2025-01-06T00:00:00Z"
    }
    
    return learning_module 