"""
GPT-5 Configuration and Model Selection
This file contains configuration for the new GPT-5 models and their optimal use cases.
"""

# NOTE:
# Model availability depends on your OpenAI org verification / access tier.
# To avoid breaking the app when a model isn't available, we default to widely-available models
# and allow overrides via environment variables.
import os

# Optional overrides (set in your environment or .env)
# Defaults updated 2026-06-17 to reflect the OpenAI deprecation notice of
# 2026-06-11 (older GPT-5 / o3 snapshots removed from API on 2026-12-11).
# Replacements per OpenAI's own table:
#   gpt-5-2025-08-07       -> gpt-5.5
#   gpt-5-mini-2025-08-07  -> gpt-5.4-mini
#   gpt-5-nano-2025-08-07  -> gpt-5.4-nano
#   gpt-5-pro-2025-10-06   -> gpt-5.5-pro
#   o3-2025-04-16          -> gpt-5.5
#   o3-pro-2025-06-10      -> gpt-5.5-pro
# Examples:
#   OPENAI_HIGH_MODEL=gpt-5.5
#   OPENAI_MEDIUM_MODEL=gpt-5.4-mini
#   OPENAI_LOW_MODEL=gpt-5.4-nano
OPENAI_HIGH_MODEL = os.getenv("OPENAI_HIGH_MODEL", "").strip() or "gpt-5.5"
OPENAI_MEDIUM_MODEL = os.getenv("OPENAI_MEDIUM_MODEL", "").strip() or "gpt-5.4-mini"
OPENAI_LOW_MODEL = os.getenv("OPENAI_LOW_MODEL", "").strip() or "gpt-5.4-nano"

# GPT-5 Model Variants
GPT5_MODELS = {
    "gpt-5": {
        # High complexity model (override via OPENAI_HIGH_MODEL). Default: gpt-5.5
        "name": OPENAI_HIGH_MODEL,
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
        # Medium complexity model (override via OPENAI_MEDIUM_MODEL). Default: gpt-5.4-mini
        "name": OPENAI_MEDIUM_MODEL,
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
        # Low complexity model (override via OPENAI_LOW_MODEL). Default: gpt-5.4-nano
        "name": OPENAI_LOW_MODEL,
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
            "model": base_params.get("name", model),  # Use model name instead of 'name'
            "temperature": 0.3,  # More focused for analysis
            "max_tokens": 4096,  # Allow longer responses
            # Remove reasoning_effort as it may not be supported
        }
    elif task_type == "creative_generation":
        return {
            "model": base_params.get("name", model),
            "temperature": 0.9,  # More creative
            "max_tokens": 2048
        }
    elif task_type == "coaching":
        return {
            "model": base_params.get("name", model),
            "temperature": 0.7,  # Balanced for conversation
            "max_tokens": 2048
            # Remove verbosity as it may not be supported
        }
    elif task_type == "documentation":
        return {
            "model": base_params.get("name", model),
            "temperature": 0.4,  # Balanced for documentation
            "max_tokens": 2048
        }
    elif task_type == "code_generation":
        return {
            "model": base_params.get("name", model),
            "temperature": 0.3,   # Focused for code
            # Reasoning models (gpt-5.x) count reasoning tokens against the
            # completion budget — a small budget returns EMPTY content. Give
            # code generation generous headroom so output survives reasoning.
            "max_tokens": 4096,
        }
    elif task_type == "classification":
        return {
            "model": base_params.get("name", model),
            "temperature": 0.2,  # Low temperature for consistent classification
            "max_tokens": 1024
        }
    elif task_type == "quiz_generation":
        return {
            "model": base_params.get("name", model),
            "temperature": 0.6,  # Balanced for quiz generation
            "max_tokens": 1024
        }
    else:
        # Default parameters
        return {
            "model": base_params.get("name", model),
            "temperature": base_params.get("temperature", 0.7),
            "max_tokens": base_params.get("max_tokens", 2048)
        }

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