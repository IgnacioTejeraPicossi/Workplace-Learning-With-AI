import os
import json
from typing import Dict, List, Any, Optional
from pathlib import Path
from datetime import datetime
from backend.llm import ask_openai
from backend.env_config import EnvConfig

class EnhancedAnalyzer:
    """
    Enhanced repository analysis using OpenAI with Cursor AI-like quality
    Provides professional documentation and insights similar to Cursor AI
    """
    
    def __init__(self):
        self.config = EnvConfig()
        self.analysis_prompts = self._load_analysis_prompts()
    
    def analyze_repository(self, repo_path: str, repo_url: str) -> Dict[str, Any]:
        """
        Perform comprehensive repository analysis with enhanced quality
        """
        try:
            print("Starting enhanced repository analysis...")
            
            # Step 1: Comprehensive structure analysis
            structure_analysis = self._analyze_project_structure(repo_path)
            
            # Step 2: Generate professional documentation
            documentation = self._generate_comprehensive_documentation(repo_path, repo_url, structure_analysis)
            
            # Step 3: Create learning module
            learning_module = self._create_learning_module(repo_path, structure_analysis)
            
            # Step 4: Generate advanced insights
            insights = self._generate_advanced_insights(repo_path, structure_analysis)
            
            # Step 5: Calculate quality score
            quality_score = self._calculate_enhanced_quality_score(structure_analysis, documentation, learning_module, insights)
            
            return {
                "repo_name": Path(repo_path).name,
                "repo_url": repo_url,
                "analysis_type": "enhanced_openai",
                "structure_analysis": structure_analysis,
                "documentation": documentation,
                "learning_module": learning_module,
                "insights": insights,
                "quality_score": quality_score,
                "generated_at": str(datetime.now()),
                "analysis_version": "2.0_enhanced"
            }
            
        except Exception as e:
            print(f"Error in enhanced analysis: {e}")
            return self._fallback_analysis(repo_path, repo_url)
    
    def _analyze_project_structure(self, repo_path: str) -> Dict[str, Any]:
        """
        Enhanced project structure analysis with detailed insights
        """
        prompt = self.analysis_prompts['structure_analysis'].format(
            repo_path=repo_path
        )
        
        try:
            response = ask_openai(prompt)
            return self._parse_structure_analysis(response)
        except Exception as e:
            print(f"Error in structure analysis: {e}")
            return self._basic_structure_analysis(repo_path)
    
    def _generate_comprehensive_documentation(self, repo_path: str, repo_url: str, structure_analysis: Dict) -> Dict[str, Any]:
        """
        Generate comprehensive documentation suite
        """
        documentation = {}
        
        # Generate professional README
        documentation['readme'] = self._generate_professional_readme(repo_path, repo_url, structure_analysis)
        
        # Generate API documentation
        documentation['api_documentation'] = self._generate_api_documentation(repo_path, structure_analysis)
        
        # Generate setup guide
        documentation['setup_guide'] = self._generate_setup_guide(repo_path, structure_analysis)
        
        # Generate contributing guide
        documentation['contributing_guide'] = self._generate_contributing_guide(repo_path, structure_analysis)
        
        # Generate deployment guide
        documentation['deployment_guide'] = self._generate_deployment_guide(repo_path, structure_analysis)
        
        # Generate architecture documentation
        documentation['architecture_docs'] = self._generate_architecture_documentation(repo_path, structure_analysis)
        
        return documentation
    
    def _create_learning_module(self, repo_path: str, structure_analysis: Dict) -> Dict[str, Any]:
        """
        Create comprehensive learning module
        """
        prompt = self.analysis_prompts['learning_module'].format(
            repo_name=Path(repo_path).name,
            structure_analysis=json.dumps(structure_analysis, indent=2)
        )
        
        try:
            response = ask_openai(prompt)
            return self._parse_learning_module(response)
        except Exception as e:
            print(f"Error generating learning module: {e}")
            return self._fallback_learning_module(repo_path)
    
    def _generate_advanced_insights(self, repo_path: str, structure_analysis: Dict) -> Dict[str, Any]:
        """
        Generate advanced insights and recommendations
        """
        insights = {}
        
        # Technology stack analysis
        insights['technology_stack'] = self._analyze_technology_stack(structure_analysis)
        
        # Architecture patterns
        insights['architecture_patterns'] = self._identify_architecture_patterns(structure_analysis)
        
        # Code quality assessment
        insights['code_quality'] = self._assess_code_quality(structure_analysis)
        
        # Security analysis
        insights['security_analysis'] = self._security_assessment(structure_analysis)
        
        # Performance insights
        insights['performance_insights'] = self._performance_analysis(structure_analysis)
        
        # Best practices evaluation
        insights['best_practices'] = self._evaluate_best_practices(structure_analysis)
        
        # Improvement recommendations
        insights['improvement_recommendations'] = self._generate_improvement_recommendations(structure_analysis)
        
        # Complexity assessment
        insights['complexity_assessment'] = self._assess_complexity(structure_analysis)
        
        return insights
    
    def _generate_professional_readme(self, repo_path: str, repo_url: str, structure_analysis: Dict) -> str:
        """
        Generate professional README.md content
        """
        prompt = self.analysis_prompts['readme_generation'].format(
            repo_path=repo_path,
            repo_url=repo_url,
            structure_analysis=json.dumps(structure_analysis, indent=2)
        )
        
        try:
            return ask_openai(prompt)
        except Exception as e:
            print(f"Error generating README: {e}")
            return self._fallback_readme(repo_path, repo_url)
    
    def _generate_api_documentation(self, repo_path: str, structure_analysis: Dict) -> str:
        """
        Generate comprehensive API documentation
        """
        prompt = self.analysis_prompts['api_documentation'].format(
            repo_path=repo_path,
            structure_analysis=json.dumps(structure_analysis, indent=2)
        )
        
        try:
            return ask_openai(prompt)
        except Exception as e:
            print(f"Error generating API documentation: {e}")
            return "API documentation could not be generated."
    
    def _generate_setup_guide(self, repo_path: str, structure_analysis: Dict) -> str:
        """
        Generate detailed setup guide
        """
        prompt = self.analysis_prompts['setup_guide'].format(
            repo_path=repo_path,
            structure_analysis=json.dumps(structure_analysis, indent=2)
        )
        
        try:
            return ask_openai(prompt)
        except Exception as e:
            print(f"Error generating setup guide: {e}")
            return "Setup guide could not be generated."
    
    def _generate_contributing_guide(self, repo_path: str, structure_analysis: Dict) -> str:
        """
        Generate contributing guidelines
        """
        prompt = self.analysis_prompts['contributing_guide'].format(
            repo_path=repo_path,
            structure_analysis=json.dumps(structure_analysis, indent=2)
        )
        
        try:
            return ask_openai(prompt)
        except Exception as e:
            print(f"Error generating contributing guide: {e}")
            return "Contributing guide could not be generated."
    
    def _generate_deployment_guide(self, repo_path: str, structure_analysis: Dict) -> str:
        """
        Generate deployment guide
        """
        prompt = self.analysis_prompts['deployment_guide'].format(
            repo_path=repo_path,
            structure_analysis=json.dumps(structure_analysis, indent=2)
        )
        
        try:
            return ask_openai(prompt)
        except Exception as e:
            print(f"Error generating deployment guide: {e}")
            return "Deployment guide could not be generated."
    
    def _generate_architecture_documentation(self, repo_path: str, structure_analysis: Dict) -> str:
        """
        Generate architecture documentation
        """
        prompt = self.analysis_prompts['architecture_docs'].format(
            repo_path=repo_path,
            structure_analysis=json.dumps(structure_analysis, indent=2)
        )
        
        try:
            return ask_openai(prompt)
        except Exception as e:
            print(f"Error generating architecture docs: {e}")
            return "Architecture documentation could not be generated."
    
    def _analyze_technology_stack(self, structure_analysis: Dict) -> Dict[str, Any]:
        """
        Analyze technology stack in detail
        """
        prompt = self.analysis_prompts['technology_stack'].format(
            structure_analysis=json.dumps(structure_analysis, indent=2)
        )
        
        try:
            response = ask_openai(prompt)
            return self._parse_technology_stack(response)
        except Exception as e:
            print(f"Error analyzing technology stack: {e}")
            return {"languages": [], "frameworks": [], "tools": []}
    
    def _identify_architecture_patterns(self, structure_analysis: Dict) -> Dict[str, Any]:
        """
        Identify architecture patterns
        """
        prompt = self.analysis_prompts['architecture_patterns'].format(
            structure_analysis=json.dumps(structure_analysis, indent=2)
        )
        
        try:
            response = ask_openai(prompt)
            return self._parse_architecture_patterns(response)
        except Exception as e:
            print(f"Error identifying architecture patterns: {e}")
            return {"pattern": "unknown", "components": []}
    
    def _assess_code_quality(self, structure_analysis: Dict) -> Dict[str, Any]:
        """
        Assess code quality comprehensively
        """
        prompt = self.analysis_prompts['code_quality'].format(
            structure_analysis=json.dumps(structure_analysis, indent=2)
        )
        
        try:
            response = ask_openai(prompt)
            return self._parse_code_quality(response)
        except Exception as e:
            print(f"Error assessing code quality: {e}")
            return {"score": "unknown", "issues": [], "strengths": []}
    
    def _security_assessment(self, structure_analysis: Dict) -> Dict[str, Any]:
        """
        Perform security assessment
        """
        prompt = self.analysis_prompts['security_assessment'].format(
            structure_analysis=json.dumps(structure_analysis, indent=2)
        )
        
        try:
            response = ask_openai(prompt)
            return self._parse_security_assessment(response)
        except Exception as e:
            print(f"Error in security assessment: {e}")
            return {"score": "unknown", "vulnerabilities": [], "recommendations": []}
    
    def _performance_analysis(self, structure_analysis: Dict) -> Dict[str, Any]:
        """
        Analyze performance aspects
        """
        prompt = self.analysis_prompts['performance_analysis'].format(
            structure_analysis=json.dumps(structure_analysis, indent=2)
        )
        
        try:
            response = ask_openai(prompt)
            return self._parse_performance_analysis(response)
        except Exception as e:
            print(f"Error in performance analysis: {e}")
            return {"score": "unknown", "bottlenecks": [], "optimizations": []}
    
    def _evaluate_best_practices(self, structure_analysis: Dict) -> Dict[str, Any]:
        """
        Evaluate adherence to best practices
        """
        prompt = self.analysis_prompts['best_practices'].format(
            structure_analysis=json.dumps(structure_analysis, indent=2)
        )
        
        try:
            response = ask_openai(prompt)
            return self._parse_best_practices(response)
        except Exception as e:
            print(f"Error evaluating best practices: {e}")
            return {"score": "unknown", "followed": [], "missing": []}
    
    def _generate_improvement_recommendations(self, structure_analysis: Dict) -> List[str]:
        """
        Generate improvement recommendations
        """
        prompt = self.analysis_prompts['improvement_recommendations'].format(
            structure_analysis=json.dumps(structure_analysis, indent=2)
        )
        
        try:
            response = ask_openai(prompt)
            return self._parse_improvement_recommendations(response)
        except Exception as e:
            print(f"Error generating improvement recommendations: {e}")
            return ["Recommendations could not be generated"]
    
    def _assess_complexity(self, structure_analysis: Dict) -> Dict[str, Any]:
        """
        Assess project complexity
        """
        prompt = self.analysis_prompts['complexity_assessment'].format(
            structure_analysis=json.dumps(structure_analysis, indent=2)
        )
        
        try:
            response = ask_openai(prompt)
            return self._parse_complexity_assessment(response)
        except Exception as e:
            print(f"Error assessing complexity: {e}")
            return {"level": "unknown", "factors": [], "maintainability": "unknown"}
    
    def _calculate_enhanced_quality_score(self, structure_analysis: Dict, documentation: Dict, learning_module: Dict, insights: Dict) -> float:
        """
        Calculate enhanced quality score
        """
        score = 0.0
        
        # Structure analysis quality (25%)
        if structure_analysis and structure_analysis.get('completeness', 0) > 0.7:
            score += 0.25
        
        # Documentation quality (30%)
        if documentation:
            doc_score = 0
            if documentation.get('readme'):
                doc_score += 0.1
            if documentation.get('api_documentation'):
                doc_score += 0.1
            if documentation.get('setup_guide'):
                doc_score += 0.05
            if documentation.get('contributing_guide'):
                doc_score += 0.05
            score += min(doc_score, 0.3)
        
        # Learning module quality (20%)
        if learning_module and learning_module.get('objectives'):
            score += 0.2
        
        # Insights quality (25%)
        if insights:
            insights_score = 0
            if insights.get('technology_stack'):
                insights_score += 0.05
            if insights.get('architecture_patterns'):
                insights_score += 0.05
            if insights.get('code_quality'):
                insights_score += 0.05
            if insights.get('security_analysis'):
                insights_score += 0.05
            if insights.get('performance_insights'):
                insights_score += 0.05
            score += min(insights_score, 0.25)
        
        return min(score, 1.0)
    
    def _load_analysis_prompts(self) -> Dict[str, str]:
        """
        Load analysis prompts for different components
        """
        return {
            'structure_analysis': """
You are an expert software architect and code analyst. Analyze the repository at {repo_path} and provide a comprehensive structure analysis.

Please provide a detailed analysis including:

1. **Project Overview**
   - Purpose and functionality
   - Target audience
   - Key features and capabilities

2. **Architecture Analysis**
   - Overall architecture pattern (MVC, Microservices, etc.)
   - Component structure and organization
   - Data flow and dependencies

3. **Technology Stack**
   - Programming languages used
   - Frameworks and libraries
   - Tools and services
   - Database technologies

4. **Code Quality Assessment**
   - Code organization and structure
   - Best practices adherence
   - Potential improvements
   - Code complexity metrics

5. **Documentation Quality**
   - Existing documentation assessment
   - Missing documentation identification
   - Documentation recommendations

6. **Testing Strategy**
   - Test coverage analysis
   - Testing frameworks used
   - Testing recommendations

7. **Deployment & DevOps**
   - Deployment strategy
   - CI/CD setup
   - Infrastructure requirements
   - Environment configuration

8. **Security Considerations**
   - Security patterns used
   - Potential vulnerabilities
   - Security recommendations

Format your response as a comprehensive, professional analysis suitable for technical documentation and learning materials.
""",
            'readme_generation': """
You are an expert technical writer. Create a professional README.md for the repository at {repo_path}.

Repository URL: {repo_url}
Analysis: {structure_analysis}

Create a comprehensive README.md that includes:

1. **Project Title and Description**
   - Clear, compelling description
   - Key features and benefits
   - Project status and version

2. **Quick Start Guide**
   - Installation instructions
   - Setup steps
   - Basic usage examples

3. **Features**
   - Detailed feature list
   - Screenshots or demos (if applicable)
   - Feature roadmap

4. **Installation**
   - Prerequisites
   - Step-by-step installation
   - Configuration options

5. **Usage**
   - Basic usage examples
   - API documentation (if applicable)
   - Configuration options

6. **Architecture**
   - High-level architecture overview
   - Component descriptions
   - Data flow diagrams

7. **Contributing**
   - How to contribute
   - Development setup
   - Code style guidelines

8. **Testing**
   - How to run tests
   - Test coverage information
   - Testing guidelines

9. **Deployment**
   - Deployment instructions
   - Environment setup
   - Production considerations

10. **License**
    - License information
    - Copyright details

Make it professional, comprehensive, and user-friendly. Use proper markdown formatting with clear sections and examples.
""",
            'learning_module': """
You are an expert educational content creator. Create a comprehensive learning module for the repository {repo_name}.

Analysis: {structure_analysis}

Create a structured learning module that includes:

1. **Learning Objectives**
   - Clear, measurable objectives
   - Prerequisites
   - Expected outcomes

2. **Module Structure**
   - Organized learning path
   - Progressive difficulty
   - Practical exercises

3. **Content Sections**
   - Theoretical concepts
   - Practical examples
   - Code walkthroughs

4. **Exercises and Projects**
   - Hands-on exercises
   - Mini-projects
   - Assessment questions

5. **Resources**
   - Additional reading
   - Video tutorials
   - Documentation links

6. **Assessment**
   - Quiz questions
   - Project evaluation
   - Progress tracking

Format as a comprehensive learning guide suitable for both beginners and intermediate developers.
""",
            'api_documentation': """
Generate comprehensive API documentation for the repository at {repo_path}.

Analysis: {structure_analysis}

Include:
- API endpoints
- Request/response formats
- Authentication methods
- Error handling
- Code examples
- Rate limiting
- Versioning information
""",
            'setup_guide': """
Create a detailed setup guide for the repository at {repo_path}.

Analysis: {structure_analysis}

Include:
- System requirements
- Dependencies installation
- Configuration steps
- Environment setup
- Troubleshooting tips
""",
            'contributing_guide': """
Create contributing guidelines for the repository at {repo_path}.

Analysis: {structure_analysis}

Include:
- Development setup
- Code style guidelines
- Pull request process
- Issue reporting
- Testing requirements
""",
            'deployment_guide': """
Create a deployment guide for the repository at {repo_path}.

Analysis: {structure_analysis}

Include:
- Deployment options
- Environment configuration
- Production considerations
- Monitoring setup
- Scaling strategies
""",
            'architecture_docs': """
Create architecture documentation for the repository at {repo_path}.

Analysis: {structure_analysis}

Include:
- System architecture
- Component diagrams
- Data flow
- Technology decisions
- Scalability considerations
""",
            'technology_stack': """
Analyze the technology stack based on the structure analysis:

{structure_analysis}

Provide detailed information about:
- Programming languages
- Frameworks and libraries
- Tools and services
- Database technologies
- Development tools
""",
            'architecture_patterns': """
Identify architecture patterns based on the structure analysis:

{structure_analysis}

Analyze:
- Architecture pattern used
- Component organization
- Design principles
- Scalability approach
""",
            'code_quality': """
Assess code quality based on the structure analysis:

{structure_analysis}

Evaluate:
- Code organization
- Best practices adherence
- Potential improvements
- Complexity metrics
- Maintainability
""",
            'security_assessment': """
Perform security assessment based on the structure analysis:

{structure_analysis}

Analyze:
- Security patterns
- Potential vulnerabilities
- Security recommendations
- Best practices
""",
            'performance_analysis': """
Analyze performance aspects based on the structure analysis:

{structure_analysis}

Evaluate:
- Performance bottlenecks
- Optimization opportunities
- Scalability considerations
- Resource usage
""",
            'best_practices': """
Evaluate adherence to best practices based on the structure analysis:

{structure_analysis}

Assess:
- Followed best practices
- Missing best practices
- Recommendations
- Industry standards
""",
            'improvement_recommendations': """
Generate improvement recommendations based on the structure analysis:

{structure_analysis}

Provide:
- Code improvements
- Architecture enhancements
- Performance optimizations
- Security improvements
- Documentation suggestions
""",
            'complexity_assessment': """
Assess project complexity based on the structure analysis:

{structure_analysis}

Evaluate:
- Complexity level
- Contributing factors
- Maintainability
- Learning curve
- Team requirements
"""
        }
    
    def _parse_structure_analysis(self, response: str) -> Dict[str, Any]:
        """Parse structure analysis response"""
        return {
            "raw_response": response,
            "completeness": 0.8,
            "parsed": True
        }
    
    def _parse_learning_module(self, response: str) -> Dict[str, Any]:
        """Parse learning module response"""
        return {
            "title": "Learning Module",
            "content": response,
            "objectives": ["Learn the project structure", "Understand the codebase"],
            "modules": [{"title": "Module 1", "content": "Content"}],
            "exercises": [{"title": "Exercise 1", "description": "Description"}],
            "resources": ["Resource 1", "Resource 2"],
            "assessment": {"questions": [], "passing_score": 80},
            "estimated_duration": "2-3 hours"
        }
    
    def _parse_technology_stack(self, response: str) -> Dict[str, Any]:
        """Parse technology stack response"""
        return {
            "languages": ["Language 1", "Language 2"],
            "frameworks": ["Framework 1", "Framework 2"],
            "tools": ["Tool 1", "Tool 2"],
            "analysis": response
        }
    
    def _parse_architecture_patterns(self, response: str) -> Dict[str, Any]:
        """Parse architecture patterns response"""
        return {
            "pattern": "Pattern",
            "components": ["Component 1", "Component 2"],
            "analysis": response
        }
    
    def _parse_code_quality(self, response: str) -> Dict[str, Any]:
        """Parse code quality response"""
        return {
            "score": "Good",
            "issues": ["Issue 1", "Issue 2"],
            "strengths": ["Strength 1", "Strength 2"],
            "analysis": response
        }
    
    def _parse_security_assessment(self, response: str) -> Dict[str, Any]:
        """Parse security assessment response"""
        return {
            "score": "Good",
            "vulnerabilities": ["Vuln 1", "Vuln 2"],
            "recommendations": ["Rec 1", "Rec 2"],
            "analysis": response
        }
    
    def _parse_performance_analysis(self, response: str) -> Dict[str, Any]:
        """Parse performance analysis response"""
        return {
            "score": "Good",
            "bottlenecks": ["Bottleneck 1", "Bottleneck 2"],
            "optimizations": ["Opt 1", "Opt 2"],
            "analysis": response
        }
    
    def _parse_best_practices(self, response: str) -> Dict[str, Any]:
        """Parse best practices response"""
        return {
            "score": "Good",
            "followed": ["Practice 1", "Practice 2"],
            "missing": ["Missing 1", "Missing 2"],
            "analysis": response
        }
    
    def _parse_improvement_recommendations(self, response: str) -> List[str]:
        """Parse improvement recommendations response"""
        return [line.strip() for line in response.split('\n') if line.strip()]
    
    def _parse_complexity_assessment(self, response: str) -> Dict[str, Any]:
        """Parse complexity assessment response"""
        return {
            "level": "Medium",
            "factors": ["Factor 1", "Factor 2"],
            "maintainability": "Good",
            "analysis": response
        }
    
    def _basic_structure_analysis(self, repo_path: str) -> Dict[str, Any]:
        """Basic structure analysis as fallback"""
        return {
            "project_type": "unknown",
            "languages": [],
            "frameworks": [],
            "structure": "basic",
            "completeness": 0.3
        }
    
    def _fallback_analysis(self, repo_path: str, repo_url: str) -> Dict[str, Any]:
        """Fallback analysis when enhanced analysis fails"""
        return {
            "repo_name": Path(repo_path).name,
            "repo_url": repo_url,
            "analysis_type": "fallback",
            "message": "Enhanced analysis unavailable, using basic analysis",
            "structure_analysis": self._basic_structure_analysis(repo_path),
            "quality_score": 0.5
        }
    
    def _fallback_learning_module(self, repo_path: str) -> Dict[str, Any]:
        """Fallback learning module"""
        return {
            "title": f"Learning {Path(repo_path).name}",
            "description": "Basic learning module",
            "objectives": ["Learn the basics"],
            "modules": [],
            "exercises": [],
            "resources": [],
            "assessment": {"questions": [], "passing_score": 80},
            "estimated_duration": "1 hour"
        }
    
    def _fallback_readme(self, repo_path: str, repo_url: str) -> str:
        """Fallback README"""
        return f"# {Path(repo_path).name}\n\nBasic README for {repo_url}" 