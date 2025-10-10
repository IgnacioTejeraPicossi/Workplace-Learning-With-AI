"""
ATS Integration for Operations Efficiency Agent
CV ranking and candidate management
"""

import os
import httpx
import logging
from typing import List, Dict, Any, Optional
import re
from datetime import datetime

logger = logging.getLogger(__name__)

# Environment variables
ATS_PROVIDER = os.getenv("ATS_PROVIDER", "local")
ATS_BASE_URL = os.getenv("ATS_BASE_URL", "")
ATS_TOKEN = os.getenv("ATS_TOKEN", "")
ATS_TIMEOUT = int(os.getenv("ATS_TIMEOUT", "30"))

def _score_candidate(cv_text: str, criteria: str) -> float:
    """
    Simple scoring algorithm based on keyword matching
    In production, this would use embeddings/AI
    """
    if not cv_text or not criteria:
        return 0.0
    
    # Convert to lowercase for case-insensitive matching
    cv_lower = cv_text.lower()
    criteria_lower = criteria.lower()
    
    # Split criteria into individual requirements
    criteria_words = set(re.findall(r'\b\w+\b', criteria_lower))
    cv_words = set(re.findall(r'\b\w+\b', cv_lower))
    
    # Calculate overlap
    matches = len(criteria_words.intersection(cv_words))
    total_criteria = len(criteria_words)
    
    if total_criteria == 0:
        return 0.0
    
    # Base score from keyword matching
    base_score = matches / total_criteria
    
    # Bonus for exact phrase matches
    phrase_bonus = 0.0
    criteria_phrases = criteria_lower.split(',')
    for phrase in criteria_phrases:
        phrase = phrase.strip()
        if phrase in cv_lower:
            phrase_bonus += 0.1
    
    # Cap at 1.0
    final_score = min(1.0, base_score + phrase_bonus)
    
    return round(final_score, 3)

def _extract_highlights(cv_text: str, criteria: str) -> List[Dict[str, Any]]:
    """
    Extract relevant text snippets from CV
    """
    highlights = []
    criteria_words = set(re.findall(r'\b\w+\b', criteria.lower()))
    
    # Split CV into sentences
    sentences = re.split(r'[.!?]+', cv_text)
    
    for sentence in sentences:
        sentence_words = set(re.findall(r'\b\w+\b', sentence.lower()))
        matches = criteria_words.intersection(sentence_words)
        
        if matches:
            highlights.append({
                "text": sentence.strip(),
                "matched_keywords": list(matches),
                "relevance_score": len(matches) / len(criteria_words)
            })
    
    # Sort by relevance and return top 3
    highlights.sort(key=lambda x: x["relevance_score"], reverse=True)
    return highlights[:3]

async def rank_candidates(payload: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Rank candidates based on job criteria
    payload: {jobId: "...", criteria: "...", candidates: [{id, text}|{id, url}]}
    """
    job_id = payload.get("jobId", "unknown")
    criteria = payload.get("criteria", "")
    candidates = payload.get("candidates", [])
    
    if not candidates:
        logger.warning(f"No candidates provided for job {job_id}")
        return []
    
    results = []
    
    for candidate in candidates:
        candidate_id = candidate.get("id", "unknown")
        cv_text = candidate.get("text", "")
        cv_url = candidate.get("url", "")
        
        # If only URL provided, would need to fetch content
        if cv_url and not cv_text:
            cv_text = await _fetch_cv_content(cv_url)
        
        # Score the candidate
        score = _score_candidate(cv_text, criteria)
        
        # Extract highlights
        highlights = _extract_highlights(cv_text, criteria)
        
        results.append({
            "candidateId": candidate_id,
            "score01": score,
            "highlights": highlights,
            "cv_url": cv_url,
            "processed_at": datetime.now().isoformat()
        })
    
    # Sort by score (highest first)
    results.sort(key=lambda x: x["score01"], reverse=True)
    
    logger.info(f"Ranked {len(results)} candidates for job {job_id}")
    return results

async def _fetch_cv_content(url: str) -> str:
    """
    Fetch CV content from URL (placeholder implementation)
    """
    try:
        async with httpx.AsyncClient(timeout=ATS_TIMEOUT) as client:
            response = await client.get(url)
            response.raise_for_status()
            # In production, would parse PDF/DOCX here
            return response.text[:5000]  # Limit for demo
    except Exception as e:
        logger.error(f"Failed to fetch CV content from {url}: {e}")
        return ""

async def get_job_criteria(job_id: str) -> Dict[str, Any]:
    """
    Get job criteria from ATS
    """
    if ATS_PROVIDER == "local":
        # Return mock data for local testing
        return {
            "job_id": job_id,
            "title": "Backend Developer",
            "requirements": ["Python", "FastAPI", "MongoDB", "Docker"],
            "skills": ["REST APIs", "Database Design", "Testing"],
            "experience_years": 3,
            "location": "Oslo, Norway"
        }
    
    try:
        async with httpx.AsyncClient(timeout=ATS_TIMEOUT) as client:
            headers = {"Authorization": f"Bearer {ATS_TOKEN}"} if ATS_TOKEN else {}
            response = await client.get(
                f"{ATS_BASE_URL}/api/jobs/{job_id}",
                headers=headers
            )
            response.raise_for_status()
            return response.json()
    except Exception as e:
        logger.error(f"Failed to get job criteria for {job_id}: {e}")
        return {}

async def upload_candidate(candidate_data: Dict[str, Any]) -> str:
    """
    Upload candidate to ATS
    """
    if ATS_PROVIDER == "local":
        return f"candidate-{datetime.now().timestamp()}"
    
    try:
        async with httpx.AsyncClient(timeout=ATS_TIMEOUT) as client:
            headers = {"Authorization": f"Bearer {ATS_TOKEN}"} if ATS_TOKEN else {}
            response = await client.post(
                f"{ATS_BASE_URL}/api/candidates",
                headers=headers,
                json=candidate_data
            )
            response.raise_for_status()
            result = response.json()
            return result.get("id", "unknown")
    except Exception as e:
        logger.error(f"Failed to upload candidate: {e}")
        raise

async def health_check() -> bool:
    """
    Check ATS system health
    """
    if ATS_PROVIDER == "local":
        return True
    
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            headers = {"Authorization": f"Bearer {ATS_TOKEN}"} if ATS_TOKEN else {}
            response = await client.get(
                f"{ATS_BASE_URL}/api/health",
                headers=headers
            )
            return response.status_code == 200
    except Exception as e:
        logger.error(f"ATS health check failed: {e}")
        return False
