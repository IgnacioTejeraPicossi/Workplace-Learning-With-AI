"""
GPT-5 Configuration and Model Selection
This file contains configuration for the new GPT-5 models and their optimal use cases.
"""

# GPT-5 Model Variants
GPT5_MODELS = {
    "gpt-5": {
        "name": "GPT-5 (Full)",
        "description": "Most powerful model, best for complex reasoning and analysis",
        "use_cases": [
            "Complex repository analysis",
            "Advanced documentation generation", 
            "Sophisticated career coaching",
            "Detailed skills forecasting",
            "Team dynamics analysis"
        ],
        "max_tokens": 4096,
        "temperature": 0.7
    },
    "gpt-5-mini": {
        "name": "GPT-5 Mini",
        "description": "Balanced performance and cost, good for most tasks",
        "use_cases": [
            "Standard micro-lessons",
            "Basic repository analysis",
            "General recommendations",
            "Skills forecasting",
            "Career coaching"
        ],
        "max_tokens": 2048,
        "temperature": 0.7
    },
    "gpt-5-nano": {
        "name": "GPT-5 Nano", 
        "description": "Fastest and most cost-effective, good for simple tasks",
        "use_cases": [
            "Quick responses",
            "Simple micro-lessons",
            "Basic recommendations",
            "Fast analysis"
        ],
        "max_tokens": 1024,
        "temperature": 0.5
    }
}

# Model Selection Logic
def get_optimal_model(task_type: str, complexity: str = "medium") -> str:
    """
    Select the optimal GPT-5 model based on task type and complexity.
    
    Args:
        task_type: Type of task (analysis, generation, coaching, etc.)
        complexity: Task complexity (low, medium, high)
    
    Returns:
        Model name to use
    """
    
    # High complexity tasks - use full GPT-5
    if complexity == "high" or task_type in ["repository_analysis", "advanced_coaching", "team_analytics"]:
        return "gpt-5"
    
    # Medium complexity tasks - use GPT-5-mini
    elif complexity == "medium" or task_type in ["micro_lessons", "skills_forecast", "career_coaching"]:
        return "gpt-5-mini"
    
    # Low complexity tasks - use GPT-5-nano
    else:
        return "gpt-5-nano"

# Enhanced Parameters for GPT-5
def get_gpt5_parameters(model: str, task_type: str = None) -> dict:
    """
    Get optimized parameters for GPT-5 models.
    
    Args:
        model: GPT-5 model variant
        task_type: Type of task for parameter optimization
    
    Returns:
        Dictionary with optimized parameters
    """
    base_params = GPT5_MODELS.get(model, GPT5_MODELS["gpt-5-mini"])
    
    # Task-specific optimizations
    if task_type == "repository_analysis":
        return {
            **base_params,
            "temperature": 0.3,  # More focused for analysis
            "max_tokens": 4096,  # Allow longer responses
            "reasoning_effort": "high"  # New GPT-5 parameter
        }
    elif task_type == "creative_generation":
        return {
            **base_params,
            "temperature": 0.9,  # More creative
            "max_tokens": 2048
        }
    elif task_type == "coaching":
        return {
            **base_params,
            "temperature": 0.7,  # Balanced for conversation
            "max_tokens": 2048,
            "verbosity": "detailed"  # New GPT-5 parameter
        }
    else:
        return base_params

# Migration Helper
def migrate_from_gpt4_to_gpt5():
    """
    Helper function to migrate from GPT-4 to GPT-5.
    Returns migration instructions and compatibility notes.
    """
    return {
        "migration_steps": [
            "1. Update model names from 'gpt-4' to 'gpt-5' variants",
            "2. Test API key compatibility with GPT-5",
            "3. Update max_tokens based on new model limits",
            "4. Test new GPT-5 specific parameters (reasoning_effort, verbosity)",
            "5. Monitor performance and cost differences"
        ],
        "compatibility": {
            "api_key": "Existing GPT-4 API keys should work with GPT-5",
            "prompts": "Most prompts should work without changes",
            "parameters": "New parameters available: reasoning_effort, verbosity",
            "costs": "Check OpenAI pricing for GPT-5 variants"
        },
        "recommendations": [
            "Start with gpt-5-mini for most tasks",
            "Use gpt-5 for complex analysis tasks",
            "Use gpt-5-nano for simple, fast responses",
            "Monitor token usage and costs"
        ]
    } 