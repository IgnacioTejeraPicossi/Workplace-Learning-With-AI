"""
Prompt Suggestion Service for J-messages Analyzer
Analyzes evaluation results to suggest improvements to the analysis prompt.
"""

import logging
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
import json

logger = logging.getLogger(__name__)


class PromptSuggestionService:
    """
    Service for generating AI-assisted prompt improvement suggestions
    based on retrospective learning from training pairs.
    """
    
    def __init__(self):
        self.logger = logger
        
    async def generate_suggestion(
        self,
        current_prompt: str,
        training_pairs: List[Dict[str, Any]],
        num_examples: int = 5,
        focus_on_errors: bool = True
    ) -> Dict[str, Any]:
        """
        Generate a prompt improvement suggestion based on training examples.
        
        Args:
            current_prompt: The current system prompt being used
            training_pairs: List of evaluated training pairs
            num_examples: Number of examples to include (default: 5)
            focus_on_errors: If True, prioritize pairs with low accuracy
            
        Returns:
            Dictionary with suggested_prompt, notes, and metadata
        """
        try:
            self.logger.info(f"Generating prompt suggestion from {len(training_pairs)} pairs")
            
            # Step 1: Select representative examples
            selected_pairs = self._select_examples(
                training_pairs,
                num_examples,
                focus_on_errors
            )
            
            if not selected_pairs:
                return {
                    "success": False,
                    "error": "No suitable training pairs found for analysis"
                }
            
            self.logger.info(f"Selected {len(selected_pairs)} examples for analysis")
            
            # Step 2: Build the meta-prompt
            meta_prompt = self._build_meta_prompt(
                current_prompt,
                selected_pairs
            )
            
            # Step 3: Call LLM to get suggestion
            suggestion = await self._call_llm_for_suggestion(meta_prompt)
            
            if not suggestion:
                return {
                    "success": False,
                    "error": "LLM failed to generate suggestion"
                }
            
            # Step 4: Package result
            result = {
                "success": True,
                "suggested_prompt": suggestion.get("suggested_prompt", ""),
                "notes": suggestion.get("notes", []),
                "based_on_pairs": [p.get("_id") for p in selected_pairs],
                "num_examples": len(selected_pairs),
                "generated_at": datetime.now().isoformat(),
                "current_prompt": current_prompt
            }
            
            self.logger.info(f"Successfully generated prompt suggestion with {len(result['notes'])} notes")
            
            return result
            
        except Exception as e:
            self.logger.error(f"Error generating prompt suggestion: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e)
            }
    
    def _select_examples(
        self,
        training_pairs: List[Dict[str, Any]],
        num_examples: int,
        focus_on_errors: bool
    ) -> List[Dict[str, Any]]:
        """
        Select representative training pairs for analysis.
        Mix of good and bad examples for better learning.
        """
        # Filter pairs that have evaluation data
        evaluated_pairs = [
            p for p in training_pairs
            if p.get("evaluation") and p.get("evaluation", {}).get("overall_score") is not None
        ]
        
        if not evaluated_pairs:
            self.logger.warning("No evaluated pairs found")
            return []
        
        # Sort by accuracy
        evaluated_pairs.sort(
            key=lambda p: p.get("evaluation", {}).get("overall_score", 0)
        )
        
        if focus_on_errors:
            # Take more from the low-accuracy end
            # e.g., 70% low-accuracy, 30% high-accuracy
            num_poor = int(num_examples * 0.7)
            num_good = num_examples - num_poor
            
            poor_examples = evaluated_pairs[:num_poor]
            good_examples = evaluated_pairs[-num_good:] if num_good > 0 else []
            
            selected = poor_examples + good_examples
        else:
            # Evenly distributed across accuracy range
            step = max(1, len(evaluated_pairs) // num_examples)
            selected = evaluated_pairs[::step][:num_examples]
        
        self.logger.info(
            f"Selected {len(selected)} examples "
            f"(accuracies: {[round(p.get('evaluation', {}).get('overall_score', 0), 1) for p in selected]})"
        )
        
        return selected
    
    def _build_meta_prompt(
        self,
        current_prompt: str,
        selected_pairs: List[Dict[str, Any]]
    ) -> str:
        """
        Build a meta-prompt that asks an LLM to suggest improvements.
        """
        # Build examples section
        examples_text = ""
        for idx, pair in enumerate(selected_pairs, 1):
            original_text = pair.get("original", {}).get("text_excerpt", "")[:1000]  # Truncate
            human_metadata = pair.get("human_structured", {}).get("metadata", {})
            ai_metadata = pair.get("ai_structured", {}).get("metadata", {})
            accuracy = pair.get("evaluation", {}).get("overall_score", 0)
            # Field accuracy is stored in evaluation.metrics.field_accuracy
            field_accuracy = pair.get("evaluation", {}).get("metrics", {}).get("field_accuracy", {})
            
            examples_text += f"""
### Example {idx} (Overall Accuracy: {accuracy:.1f}%)

**INPUT TEXT (truncated):**
```
{original_text}
```

**TARGET JSON (Human-analyzed):**
```json
{json.dumps(human_metadata, indent=2, ensure_ascii=False)}
```

**MODEL JSON (AI-analyzed with current prompt):**
```json
{json.dumps(ai_metadata, indent=2, ensure_ascii=False)}
```

**Field-by-field accuracy:**
{json.dumps(field_accuracy, indent=2)}

---
"""
        
        meta_prompt = f"""You are an expert in prompt engineering for legal document extraction and metadata analysis.

Your task is to analyze the current system prompt and several examples of its performance, then suggest an improved prompt.

# Current System Prompt

```
{current_prompt}
```

# Training Examples

Below are {len(selected_pairs)} examples showing how the current prompt performs:
- **INPUT TEXT**: Original document text (truncated)
- **TARGET JSON**: What a human expert extracted (the gold standard)
- **MODEL JSON**: What the AI extracted using the current prompt
- **Field accuracy**: Percentage match for each field

{examples_text}

# Your Task

Based on the differences between TARGET JSON and MODEL JSON across these examples:

1. **Identify patterns**: What types of errors does the current prompt make repeatedly?
2. **Root causes**: Why might the model be making these mistakes?
3. **Suggest improvements**: Propose a revised system prompt that will help the model match the target JSON more reliably.

# Output Format

Return ONLY a JSON object with this structure:
```json
{{
  "suggested_prompt": "Your improved system prompt here...",
  "notes": [
    "Brief explanation of change 1",
    "Brief explanation of change 2",
    "Brief explanation of change 3"
  ]
}}
```

**Important**:
- Keep the suggested prompt concise and clear
- Focus on the most impactful improvements
- Limit notes to 3-5 key points
- Return ONLY valid JSON, no additional text"""
        
        return meta_prompt
    
    async def _call_llm_for_suggestion(self, meta_prompt: str) -> Optional[Dict[str, Any]]:
        """
        Call LLM to generate the prompt suggestion.
        """
        try:
            # Import the AI function with fallbacks (function is in llm.py)
            try:
                from backend.llm import ask_ai_unified_sync
            except ImportError:
                from llm import ask_ai_unified_sync
            
            self.logger.info("Calling LLM for prompt suggestion...")
            
            # Call LLM with high-quality settings
            response = ask_ai_unified_sync(
                prompt=meta_prompt,
                task_type="reasoning",  # Complex task
                complexity="high",      # High complexity
                max_tokens=2000,        # Need detailed response
                messages=None,
                request_headers=None    # Use default API config
            )
            
            # Parse JSON response
            import re
            json_str = response.strip()
            
            # Try to extract JSON if wrapped in markdown
            if "```" in json_str:
                match = re.search(r'```(?:json)?\s*(.*?)\s*```', json_str, re.DOTALL)
                if match:
                    json_str = match.group(1).strip()
                else:
                    json_str = re.sub(r'```[^`]*```', '', json_str).strip()
            
            # Try to find JSON object
            json_match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', json_str, re.DOTALL)
            if json_match:
                json_str = json_match.group(0)
            
            parsed = json.loads(json_str)
            
            if not isinstance(parsed, dict):
                self.logger.error("LLM response is not a dictionary")
                return None
            
            # Validate required fields
            if "suggested_prompt" not in parsed:
                self.logger.error("LLM response missing 'suggested_prompt'")
                return None
            
            self.logger.info("Successfully parsed LLM suggestion")
            return parsed
            
        except json.JSONDecodeError as e:
            self.logger.error(f"Failed to parse JSON from LLM response: {e}")
            self.logger.error(f"Response preview: {response[:500]}...")
            return None
        except ImportError as e:
            self.logger.error(f"Failed to import ask_ai function: {e}")
            return None
        except Exception as e:
            self.logger.error(f"Error calling LLM: {e}", exc_info=True)
            return None


# Singleton instance
_prompt_suggestion_service = None

def get_prompt_suggestion_service() -> PromptSuggestionService:
    """Get or create the singleton prompt suggestion service."""
    global _prompt_suggestion_service
    if _prompt_suggestion_service is None:
        _prompt_suggestion_service = PromptSuggestionService()
    return _prompt_suggestion_service

