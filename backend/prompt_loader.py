"""
Prompt versioning system for J-messages analyzer.

Loads prompts from versioned directories:
- backend/prompts/j_messages/v1.0.0/metadata.txt
- backend/prompts/j_messages/v1.0.0/note.txt

Active version is determined by ACTIVE_VERSION file or environment variable.
"""
import os
from pathlib import Path
from typing import Optional

# Base directory for prompts
PROMPTS_BASE_DIR = Path(__file__).parent / "prompts" / "j_messages"
ACTIVE_VERSION_FILE = PROMPTS_BASE_DIR / "ACTIVE_VERSION"


def get_active_version() -> str:
    """
    Get the active prompt version.
    
    Priority:
    1. Environment variable J_MESSAGES_PROMPT_VERSION
    2. ACTIVE_VERSION file
    3. Default: "v1.0.0"
    
    Returns:
        Version string (e.g., "v1.0.0")
    """
    # Check environment variable first
    env_version = os.getenv("J_MESSAGES_PROMPT_VERSION")
    if env_version:
        return env_version.strip()
    
    # Check ACTIVE_VERSION file
    if ACTIVE_VERSION_FILE.exists():
        try:
            with open(ACTIVE_VERSION_FILE, "r", encoding="utf-8") as f:
                version = f.read().strip()
                if version:
                    return version
        except Exception as e:
            print(f"[PROMPT_LOADER] ⚠️ Failed to read ACTIVE_VERSION: {e}")
    
    # Default fallback
    return "v1.0.0"


def load_prompt_template(prompt_type: str, version: Optional[str] = None) -> str:
    """
    Load a prompt template from the versioned directory.
    
    Args:
        prompt_type: Type of prompt ("metadata" or "note")
        version: Optional version string (e.g., "v1.0.0"). If None, uses active version.
    
    Returns:
        Prompt template string with placeholders like {header_text}, {body_text}
    
    Raises:
        FileNotFoundError: If the prompt file doesn't exist
        IOError: If the file cannot be read
    """
    if version is None:
        version = get_active_version()
    
    prompt_file = PROMPTS_BASE_DIR / version / f"{prompt_type}.txt"
    
    if not prompt_file.exists():
        raise FileNotFoundError(
            f"Prompt file not found: {prompt_file}\n"
            f"Available versions: {[d.name for d in PROMPTS_BASE_DIR.iterdir() if d.is_dir()]}"
        )
    
    try:
        with open(prompt_file, "r", encoding="utf-8") as f:
            template = f.read()
        return template
    except Exception as e:
        raise IOError(f"Failed to read prompt file {prompt_file}: {e}")


def get_prompt_info() -> dict:
    """
    Get information about the current prompt configuration.
    
    Returns:
        Dict with:
        - version: Active version string
        - metadata_template: Full metadata prompt template (without variables filled)
        - note_template: Full note prompt template (without variables filled)
    """
    version = get_active_version()
    
    try:
        metadata_template = load_prompt_template("metadata", version)
    except Exception as e:
        metadata_template = f"[ERROR: {e}]"
    
    try:
        note_template = load_prompt_template("note", version)
    except Exception as e:
        note_template = f"[ERROR: {e}]"
    
    return {
        "version": version,
        "metadata_template": metadata_template,
        "note_template": note_template
    }
