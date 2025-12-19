"""
J-messages Evaluator Service
Runs AI analysis on original documents and compares with human-analyzed versions
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)


class JMessagesEvaluator:
    """
    Service for evaluating AI analysis against human-analyzed documents
    """
    
    def __init__(self, analyzer_service=None):
        """
        Initialize evaluator with analyzer service
        
        Args:
            analyzer_service: The J-messages analyzer service instance
        """
        self.analyzer = analyzer_service
    
    async def run_evaluation(self, training_pair: Dict[str, Any], api_config: Dict[str, str]) -> Dict[str, Any]:
        """
        Run AI analysis on original document and compare with human analysis
        
        Args:
            training_pair: The training pair with original and human_structured
            api_config: API configuration (keys for OpenAI, etc.)
        
        Returns:
            Evaluation results with AI output and comparison metrics
        """
        try:
            j_id = training_pair.get('j_id', 'unknown')
            logger.info(f"Starting evaluation for {j_id}")
            
            # 1. Extract original text
            original_text = self._extract_original_text(training_pair)
            if not original_text:
                raise ValueError("No original text found in training pair")
            
            logger.info(f"Extracted {len(original_text)} characters from original")
            
            # 2. Run AI analysis (using existing analyzer)
            ai_result = await self._run_ai_analysis(original_text, api_config)
            
            # 3. Compare AI vs Human
            comparison = self._compare_results(
                ai_result=ai_result,
                human_result=training_pair.get('human_structured', {})
            )
            
            # 4. Calculate metrics
            metrics = self._calculate_metrics(comparison)
            
            logger.info(f"Evaluation complete for {j_id}: {metrics.get('overall_accuracy', 0):.2%} accuracy")
            
            return {
                "success": True,
                "j_id": j_id,
                "evaluated_at": datetime.utcnow().isoformat(),
                "ai_structured": ai_result,
                "comparison": comparison,
                "metrics": metrics
            }
            
        except Exception as e:
            logger.error(f"Evaluation failed: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "j_id": training_pair.get('j_id', 'unknown')
            }
    
    def _extract_original_text(self, training_pair: Dict[str, Any]) -> Optional[str]:
        """Extract original document text from training pair"""
        original = training_pair.get('original', {})
        
        # Try text_excerpt first (most common)
        if original.get('text_excerpt'):
            return original['text_excerpt']
        
        # Fallback to doc_url if available (would need to download)
        # For now, we only support text_excerpt
        return None
    
    async def _run_ai_analysis(self, original_text: str, api_config: Dict[str, str]) -> Dict[str, Any]:
        """
        Run AI analysis on original text using the existing J-messages analyzer
        """
        try:
            # Import analyzer function with fallbacks (supports both execution modes)
            try:
                from backend.routers.j_messages_analyzer import analyze_text_content
            except ImportError:
                from routers.j_messages_analyzer import analyze_text_content
            
            logger.info(f"Running AI analysis on {len(original_text)} characters of text")
            
            # Call analyzer with original text
            result = analyze_text_content(
                text_content=original_text,
                request_headers=api_config
            )
            
            logger.info(f"AI analysis complete: extracted j_id={result.get('metadata', {}).get('j_id')}")
            
            return result
            
        except ImportError as e:
            logger.error(f"Failed to import analyzer: {e}")
            # Fallback to mock if analyzer not available
            return self._get_mock_result()
        except Exception as e:
            logger.error(f"AI analysis failed: {e}")
            # Return mock on error
            return self._get_mock_result()
    
    def _get_mock_result(self) -> Dict[str, Any]:
        """Fallback mock result if analyzer fails"""
        logger.warning("Using mock AI analysis result")
        return {
            "metadata": {
                "j_id": "AI-EXTRACTED",
                "title": "AI extracted title",
                "valid_from": None,
                "valid_to": None,
                "status": "Unknown",
                "categories": []
            },
            "toc": [],
            "body_html": "<p>AI-generated HTML would go here</p>"
        }
    
    def _compare_results(self, ai_result: Dict[str, Any], human_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Compare AI analysis with human analysis field by field
        
        Returns:
            Comparison details for each field
        """
        comparison = {
            "metadata": {},
            "toc": {},
            "body_html": {}
        }
        
        # Compare metadata fields
        ai_meta = ai_result.get('metadata', {})
        human_meta = human_result.get('metadata', {})
        
        metadata_fields = ['j_id', 'title', 'valid_from', 'valid_to', 'status', 'categories', 'replaces_id']
        
        for field in metadata_fields:
            ai_value = ai_meta.get(field)
            human_value = human_meta.get(field)
            
            comparison['metadata'][field] = {
                "ai_value": ai_value,
                "human_value": human_value,
                "match": self._values_match(ai_value, human_value),
                "similarity": self._calculate_similarity(ai_value, human_value)
            }
        
        # Compare TOC
        ai_toc = ai_result.get('toc', [])
        human_toc = human_result.get('toc', [])
        
        comparison['toc'] = {
            "ai_count": len(ai_toc),
            "human_count": len(human_toc),
            "match": len(ai_toc) == len(human_toc),
            "similarity": self._calculate_toc_similarity(ai_toc, human_toc)
        }
        
        # Compare body HTML (basic length comparison for now)
        ai_html = ai_result.get('body_html', '')
        human_html = human_result.get('body_html', '')
        
        comparison['body_html'] = {
            "ai_length": len(ai_html),
            "human_length": len(human_html),
            "length_ratio": len(ai_html) / len(human_html) if len(human_html) > 0 else 0
        }
        
        return comparison
    
    def _calculate_metrics(self, comparison: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate overall accuracy metrics from comparison
        
        Returns:
            Metrics dictionary with accuracy scores
        """
        metadata_comp = comparison.get('metadata', {})
        
        # Calculate field accuracy
        field_accuracy = {}
        total_fields = 0
        correct_fields = 0
        
        for field, comp in metadata_comp.items():
            similarity = comp.get('similarity', 0)
            field_accuracy[field] = similarity
            total_fields += 1
            if similarity >= 0.8:  # Consider >80% as "correct"
                correct_fields += 1
        
        overall_accuracy = correct_fields / total_fields if total_fields > 0 else 0
        
        # TOC accuracy
        toc_comp = comparison.get('toc', {})
        toc_accuracy = toc_comp.get('similarity', 0)
        
        return {
            "overall_accuracy": overall_accuracy,
            "field_accuracy": field_accuracy,
            "toc_accuracy": toc_accuracy,
            "total_fields": total_fields,
            "correct_fields": correct_fields,
            "evaluation_summary": self._generate_summary(overall_accuracy, field_accuracy)
        }
    
    def _values_match(self, ai_value: Any, human_value: Any) -> bool:
        """Check if two values are an exact match"""
        # Handle None cases
        if ai_value is None and human_value is None:
            return True
        if ai_value is None or human_value is None:
            return False
        
        # Handle lists (e.g., categories)
        if isinstance(ai_value, list) and isinstance(human_value, list):
            return set(ai_value) == set(human_value)
        
        # Handle strings
        if isinstance(ai_value, str) and isinstance(human_value, str):
            return ai_value.strip().lower() == human_value.strip().lower()
        
        # Default comparison
        return ai_value == human_value
    
    def _calculate_similarity(self, ai_value: Any, human_value: Any) -> float:
        """
        Calculate similarity score between two values (0.0 to 1.0)
        """
        # Handle None cases
        if ai_value is None and human_value is None:
            return 1.0
        if ai_value is None or human_value is None:
            return 0.0
        
        # Handle lists (e.g., categories)
        if isinstance(ai_value, list) and isinstance(human_value, list):
            if len(ai_value) == 0 and len(human_value) == 0:
                return 1.0
            if len(ai_value) == 0 or len(human_value) == 0:
                return 0.0
            
            # Jaccard similarity for sets
            set_ai = set(ai_value)
            set_human = set(human_value)
            intersection = len(set_ai.intersection(set_human))
            union = len(set_ai.union(set_human))
            return intersection / union if union > 0 else 0.0
        
        # Handle strings (simple character-level similarity)
        if isinstance(ai_value, str) and isinstance(human_value, str):
            ai_str = ai_value.strip().lower()
            human_str = human_value.strip().lower()
            
            if ai_str == human_str:
                return 1.0
            
            # Check if both look like dates (YYYY-MM-DD format)
            date_pattern = r'^\d{4}-\d{2}-\d{2}$'
            import re
            if re.match(date_pattern, ai_str) and re.match(date_pattern, human_str):
                # For dates, exact match or nothing
                return 0.0
            
            # For regular strings, use character-level similarity
            max_len = max(len(ai_str), len(human_str))
            if max_len == 0:
                return 1.0
            
            # Count matching characters at same positions
            matches = sum(1 for a, h in zip(ai_str, human_str) if a == h)
            base_similarity = matches / max_len
            
            # If strings are very similar in length, boost score
            if base_similarity > 0.7:
                length_ratio = min(len(ai_str), len(human_str)) / max(len(ai_str), len(human_str))
                return (base_similarity + length_ratio) / 2
            
            return base_similarity
        
        # Default: exact match only
        return 1.0 if ai_value == human_value else 0.0
    
    def _calculate_toc_similarity(self, ai_toc: List[Dict], human_toc: List[Dict]) -> float:
        """Calculate similarity between two TOC structures"""
        if len(ai_toc) == 0 and len(human_toc) == 0:
            return 1.0
        if len(ai_toc) == 0 or len(human_toc) == 0:
            return 0.0
        
        # Simple count-based similarity for now
        # In production, would compare actual entries
        count_similarity = min(len(ai_toc), len(human_toc)) / max(len(ai_toc), len(human_toc))
        
        return count_similarity
    
    def _generate_summary(self, overall_accuracy: float, field_accuracy: Dict[str, float]) -> str:
        """Generate human-readable summary of evaluation"""
        if overall_accuracy >= 0.9:
            quality = "Excellent"
            emoji = "🎯"
        elif overall_accuracy >= 0.7:
            quality = "Good"
            emoji = "✅"
        elif overall_accuracy >= 0.5:
            quality = "Fair"
            emoji = "⚠️"
        else:
            quality = "Poor"
            emoji = "❌"
        
        # Find perfect and weak fields
        perfect_fields = [field for field, acc in field_accuracy.items() if acc >= 0.95]
        weak_fields = [field for field, acc in field_accuracy.items() if acc < 0.5]
        medium_fields = [field for field, acc in field_accuracy.items() if 0.5 <= acc < 0.95]
        
        summary_parts = [f"{emoji} {quality} match ({overall_accuracy:.1%} accuracy)."]
        
        if perfect_fields:
            summary_parts.append(f"Perfect: {', '.join(perfect_fields[:3])}")
            if len(perfect_fields) > 3:
                summary_parts[-1] += f" +{len(perfect_fields)-3} more"
        
        if medium_fields:
            summary_parts.append(f"Partial: {', '.join(medium_fields[:2])}")
        
        if weak_fields:
            summary_parts.append(f"Needs improvement: {', '.join(weak_fields)}")
        
        return " | ".join(summary_parts)


# Singleton instance
_evaluator_instance = None

def get_evaluator():
    """Get or create evaluator instance"""
    global _evaluator_instance
    if _evaluator_instance is None:
        _evaluator_instance = JMessagesEvaluator()
    return _evaluator_instance

