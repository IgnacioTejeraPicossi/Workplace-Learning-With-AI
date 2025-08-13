# FastAPI app skeleton for AI Workplace Learning (Clean Version - No Firebase)
from fastapi import FastAPI, Request, Body, HTTPException, Depends, status, UploadFile, Form, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
from pathlib import Path
import json
import os
from datetime import datetime
import uuid
from typing import List, Optional, Dict, Any
from backend.prompts import CONCEPT_PROMPT, MICROLESSON_PROMPT, SIMULATION_PROMPT, RECOMMENDATION_PROMPT, PROMPTS, CERTIFICATION_RECOMMENDATION_PROMPT, CERTIFICATION_STUDY_PLAN_PROMPT, CERTIFICATION_SIMULATION_PROMPT, CERTIFICATION_CAREER_COACH_PROMPT, video_quiz_prompt, video_summary_prompt
from backend.llm import ask_openai, web_search_query, classify_intent, generate_scaffold
from backend.repo_analysis import router as repo_router
from backend.documentation_generator import router as doc_router
from backend.cursor_readme_routes import router as cursor_readme_router
from backend.cursor_agent_routes import router as cursor_agent_router
from backend.simple_web_search import router as simple_web_search_router
from backend.db import lessons_collection, career_coach_sessions, skills_forecasts, teams_collection, team_members_collection, team_analytics_collection, certifications_collection, study_plans_collection, certification_simulations_collection, unknown_intents_collection, scaffold_history_collection, saved_videos_collection
from bson import ObjectId
from fastapi.staticfiles import StaticFiles

# Create FastAPI app
app = FastAPI(title="AI Learning Platform", version="1.0.0")

# Mock verify_token function (no Firebase dependency)
def verify_token(request: Request):
    """Mock authentication - always returns a mock user for testing"""
    return {"sub": "mock_user_id", "email": "test@example.com", "name": "Test User"}

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
static_dir = os.path.join(os.path.dirname(__file__), "static")
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Favicon endpoint
@app.get("/favicon.ico")
async def favicon():
    favicon_path = os.path.join(os.path.dirname(__file__), "static", "favicon.ico")
    return FileResponse(favicon_path)

# Basic models
class MicroLessonRequest(BaseModel):
    topic: str

class SimulationRequest(BaseModel):
    history: list
    user_input: str

class RecommendationRequest(BaseModel):
    skill_gap: str

class Turn(BaseModel):
    speaker: str
    text: str

class SimulationStepRequest(BaseModel):
    history: List[Turn]

# Team Management Models
class TeamMember(BaseModel):
    name: str
    role: str
    email: str
    skills: List[str]
    performance_score: Optional[float] = None

class TeamCreateRequest(BaseModel):
    name: str
    description: str
    members: List[TeamMember]

# Basic endpoints for testing
@app.get("/")
async def root():
    return {"message": "AI Learning Platform - Clean Version"}

@app.get("/test")
async def test():
    return {"message": "Test endpoint works!"}

@app.post("/api/test")
async def api_test():
    return {"message": "API test endpoint works!"}

# Include all routers
print("🔍 DEBUG: Including routers...")

print("🔍 DEBUG: Including repo_router...")
app.include_router(repo_router, prefix="/api", tags=["Repository Analysis"])

print("🔍 DEBUG: Including doc_router...")
app.include_router(doc_router, prefix="/api", tags=["Documentation Generation"])

print("🔍 DEBUG: Including cursor_readme_router...")
app.include_router(cursor_readme_router, prefix="/api", tags=["Cursor AI README Generator"])

print("🔍 DEBUG: Including cursor_agent_router...")
app.include_router(cursor_agent_router, prefix="/api", tags=["Cursor Agent"])

print("🔍 DEBUG: Including simple_web_search_router...")
app.include_router(simple_web_search_router, prefix="/api", tags=["Simple Web Search"])

# Debug: Print all registered routes
print("🔍 DEBUG: All registered routes:")
for route in app.routes:
    if hasattr(route, 'methods') and hasattr(route, 'path'):
        print(f"  {route.methods} {route.path}")

print("🔍 DEBUG: App setup complete!")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
