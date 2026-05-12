# FastAPI app skeleton for AI Workplace Learning
from fastapi import FastAPI, Request, Body, HTTPException, Depends, status, UploadFile, Form, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
from pathlib import Path
import json
import os
from datetime import datetime
import uuid
import sys
import importlib.util

# ↓ Debug para verificar el entorno
print("PY:", sys.executable)
print("HAS email_validator?:", importlib.util.find_spec("email_validator"))

# ↓ Import tracing para AgentOps Studio
import importlib
def _trace_mod(name):
    try:
        m = importlib.import_module(name)
        print(f"✅ imported {name} from", getattr(m, "__file__", "?"))
        return m
    except Exception as e:
        print(f"❌ import failed for {name}:", e)
        return None

from typing import List, Optional, Dict, Any

# Fix imports to work from both root and backend directories
try:
    from backend.prompts import CONCEPT_PROMPT, MICROLESSON_PROMPT, SIMULATION_PROMPT, RECOMMENDATION_PROMPT, PROMPTS, CERTIFICATION_RECOMMENDATION_PROMPT, CERTIFICATION_STUDY_PLAN_PROMPT, CERTIFICATION_SIMULATION_PROMPT, CERTIFICATION_CAREER_COACH_PROMPT, video_quiz_prompt, video_summary_prompt
    from backend.llm import ask_openai, ask_ai_unified_sync, web_search_query, classify_intent, generate_scaffold
    from backend.repo_analysis import router as repo_router
    from backend.documentation_generator import router as doc_router
    from backend.cursor_readme_routes import router as cursor_readme_router
    from backend.cursor_agent_routes import router as cursor_agent_router
    from backend.simple_web_search import router as simple_web_search_router
    from backend.db import lessons_collection, career_coach_sessions, skills_forecasts, teams_collection, team_members_collection, team_analytics_collection, certifications_collection, study_plans_collection, certification_simulations_collection, unknown_intents_collection, scaffold_history_collection, saved_videos_collection
except ImportError:
    # Fallback for when running from root directory
    from prompts import CONCEPT_PROMPT, MICROLESSON_PROMPT, SIMULATION_PROMPT, RECOMMENDATION_PROMPT, PROMPTS, CERTIFICATION_RECOMMENDATION_PROMPT, CERTIFICATION_STUDY_PLAN_PROMPT, CERTIFICATION_SIMULATION_PROMPT, CERTIFICATION_CAREER_COACH_PROMPT, video_quiz_prompt, video_summary_prompt
    from llm import ask_openai, ask_ai_unified_sync, web_search_query, classify_intent, generate_scaffold
    from repo_analysis import router as repo_router
    from documentation_generator import router as doc_router
    from cursor_readme_routes import router as cursor_readme_router
    from cursor_agent_routes import router as cursor_agent_router
    from simple_web_search import router as simple_web_search_router
    from db import lessons_collection, career_coach_sessions, skills_forecasts, teams_collection, team_members_collection, team_analytics_collection, certifications_collection, study_plans_collection, certification_simulations_collection, unknown_intents_collection, scaffold_history_collection, saved_videos_collection

from bson import ObjectId

# Firebase Authentication
import firebase_admin
from firebase_admin import credentials
from firebase_admin import auth as firebase_auth

# Initialize Firebase with service account
try:
    cred = credentials.Certificate("serviceAccountKey.json")  # Path from root
    firebase_admin.initialize_app(cred)
    print("✅ Firebase initialized successfully")
except Exception as e:
    print(f"⚠️ Firebase initialization failed: {e}")
    print("⚠️ Running in mock authentication mode")
    firebase_admin = None

app = FastAPI()

# CORS: support cloud origins via ALLOWED_ORIGINS env var
_default_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]
_env_origins = os.getenv("ALLOWED_ORIGINS", "")
_extra_origins = [o.strip() for o in _env_origins.split(",") if o.strip()] if _env_origins else []
_all_origins = list(dict.fromkeys(_default_origins + _extra_origins))  # deduplicate, preserve order

app.add_middleware(
    CORSMiddleware,
    allow_origins=_all_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include new routers
app.include_router(repo_router, prefix="/api", tags=["Repository Analysis"])
app.include_router(doc_router, prefix="/api", tags=["Documentation Generation"])
app.include_router(cursor_readme_router, prefix="/api", tags=["Cursor AI README Generator"])
app.include_router(cursor_agent_router, prefix="/api", tags=["Cursor Agent"])

# Document Analyzer router
try:
    from backend.document_analyzer import router as document_analyzer_router
except ImportError:
    from document_analyzer import router as document_analyzer_router
app.include_router(document_analyzer_router, prefix="/api", tags=["Document Analyzer"])

# Agentic RAG router
try:
    from backend.routers.agentic_rag import router as agentic_rag_router
except ImportError:
    try:
        from routers.agentic_rag import router as agentic_rag_router
    except ImportError:
        try:
            from .routers.agentic_rag import router as agentic_rag_router
        except ImportError:
            # Skip Agentic RAG if not available - don't break other modules
            agentic_rag_router = None

if agentic_rag_router:
    app.include_router(agentic_rag_router, prefix="/api", tags=["Agentic RAG"])

# Cursor AI Automation router
try:
    from backend.cursor_ai_automation import router as cursor_automation_router
except ImportError:
    from cursor_ai_automation import router as cursor_automation_router
app.include_router(cursor_automation_router, prefix="/api", tags=["Cursor AI Automation"])

# Prompts Editor router
try:
    from backend.routers.prompts_editor import router as prompts_editor_router
except ImportError:
    from routers.prompts_editor import router as prompts_editor_router
app.include_router(prompts_editor_router)

# AGI Progress router
try:
    from backend.routers.agi_progress import router as agi_router
except ImportError:
    from routers.agi_progress import router as agi_router
app.include_router(agi_router)

# AGI AI Enrichment router (live web + LLM suggestions for the AGI Hub)
try:
    from backend.routers.agi_ai_enrich import router as agi_ai_enrich_router
except ImportError:
    from routers.agi_ai_enrich import router as agi_ai_enrich_router
app.include_router(agi_ai_enrich_router)

# Homo Sapiens vs. KI i Test — workshop challenges router
try:
    from backend.routers.homo_vs_ai import router as homo_vs_ai_router
except ImportError:
    from routers.homo_vs_ai import router as homo_vs_ai_router
app.include_router(homo_vs_ai_router)

# Homo Sapiens vs. KI i Test — Prompt Evolution governance (Phase E)
try:
    from backend.routers.prompt_evolution import router as prompt_evolution_router
except ImportError:  # pragma: no cover
    from routers.prompt_evolution import router as prompt_evolution_router  # type: ignore
app.include_router(prompt_evolution_router)

# Embeddings router (OpenAI REST)
try:
    from backend.routers.embeddings import router as embeddings_router
    app.include_router(embeddings_router, tags=["Embeddings"])
    print("✅ Embeddings router included successfully")
except Exception as e:
    print(f"❌ Error including Embeddings router: {e}")

# Babel Library Intelligence router
try:
    from backend.routers.babel_intelligence import router as babel_intelligence_router
    app.include_router(babel_intelligence_router, tags=["Babel Intelligence"])
    print("✅ Babel Intelligence router included successfully")
except Exception as e:
    print(f"❌ Error including Babel Intelligence router: {e}")

# Learning Profile & Recommendations router (Phase 2)
try:
    from backend.routers.learning_profile import router as learning_profile_router
    app.include_router(learning_profile_router, tags=["Learning Profile"])
    print("✅ Learning Profile router included successfully")
except Exception as e:
    print(f"❌ Error including Learning Profile router: {e}")

# ATM V&V Test Copilot router
try:
    from backend.routers.atm_copilot import router as atm_copilot_router
    app.include_router(atm_copilot_router, tags=["ATM V&V Test Copilot"])
    print("✅ ATM V&V Test Copilot router included successfully")
except Exception as e:
    print(f"❌ Error including ATM V&V Test Copilot router: {e}")

# Red Cross Web QA Agent router (Agent #9 — Future Item Agents)
try:
    from backend.routers.red_cross_qa import router as red_cross_qa_router
    app.include_router(red_cross_qa_router, tags=["Red Cross Web QA Agent"])
    print("✅ Red Cross Web QA Agent router included successfully")
except Exception as e:
    print(f"❌ Error including Red Cross Web QA Agent router: {e}")

# AgentOps Studio routers - Direct import method
try:
    from backend.routers.agentops import digital, prompt, playbooks, flows, runs, settings, mcp_router
    print("✅ AgentOps Studio routers imported successfully")
    
    # Include routers with specific prefixes to avoid route conflicts
    app.include_router(digital.router, prefix="/api/digital", tags=["AgentOps Digital"])
    app.include_router(prompt.router, prefix="/api/prompt", tags=["AgentOps Prompt"])
    app.include_router(playbooks.router, prefix="/api/playbooks", tags=["AgentOps Playbooks"])
    app.include_router(flows.router, prefix="/api/flows", tags=["AgentOps Flows"])
    app.include_router(runs.router, prefix="/api/runs", tags=["AgentOps Runs"])
    app.include_router(settings.router, prefix="/api/settings", tags=["AgentOps Settings"])
    # MCP manifest index
    app.include_router(mcp_router)
    
    print("✅ AgentOps Studio: 6 routers included successfully")
except ImportError as e:
    print(f"❌ Failed to import AgentOps Studio routers: {e}")
except Exception as e:
    print(f"❌ Error including AgentOps Studio routers: {e}")

# Learning modules routers
try:
    from backend.certifications import certifications_router
    from backend.micro_lessons import micro_lessons_router
    from backend.web_search import web_search_router
    from backend.skills_forecast import skills_forecast_router
    from backend.career_coach import career_coach_router
    from backend.simulation_results import simulation_results_router
except ImportError:
    from certifications import certifications_router
    from micro_lessons import micro_lessons_router
    from web_search import web_search_router
    from skills_forecast import skills_forecast_router
    from career_coach import career_coach_router
    from simulation_results import simulation_results_router

app.include_router(certifications_router)
app.include_router(micro_lessons_router)
app.include_router(web_search_router)
app.include_router(skills_forecast_router)
app.include_router(career_coach_router)
app.include_router(simulation_results_router)

# Enterprise Architecture routers
try:
    from backend.ea_processes import router as ea_processes_router
    from backend.ea_catalog import router as ea_catalog_router
    from backend.ea_ai_risk import router as ea_ai_risk_router
except ImportError:
    from ea_processes import router as ea_processes_router
    from ea_catalog import router as ea_catalog_router
    from ea_ai_risk import router as ea_ai_risk_router

app.include_router(ea_processes_router)
app.include_router(ea_catalog_router)
app.include_router(ea_ai_risk_router)

# Cloud Install Module router
try:
    from backend.routers.cloud_install import router as cloud_install_router
    app.include_router(cloud_install_router, tags=["Cloud Install"])
    print("✅ Cloud Install router included successfully")
except Exception as e:
    print(f"❌ Error including Cloud Install router: {e}")

# EA Second Brain Agent router
try:
    from backend.routers.ea_second_brain import router as ea_second_brain_router
    app.include_router(ea_second_brain_router, tags=["EA Second Brain"])
    print("✅ EA Second Brain router included successfully")
except Exception as e:
    print(f"❌ Error including EA Second Brain router: {e}")

# EA Execute router (agent bundle execution)
try:
    from backend.routers.ea_execute import router as ea_execute_router
    app.include_router(ea_execute_router, tags=["EA Execute"])
    print("✅ EA Execute router included successfully")
except Exception as e:
    print(f"❌ Error including EA Execute router: {e}")

# API Configuration routers
try:
    from backend.api_test import router as api_test_router
    from backend.itemai_api import router as itemai_api_router
except ImportError:
    from api_test import router as api_test_router
    from itemai_api import router as itemai_api_router

app.include_router(api_test_router)
app.include_router(itemai_api_router)

# Visual Regression Testing router (Playwright + pixelmatch)
try:
    from backend.routers.regression import router as regression_router
    app.include_router(regression_router, tags=["Visual Regression"])
    print("✅ Visual Regression router included successfully")
except Exception as e:
    print(f"❌ Error including Visual Regression router: {e}")

import os
from fastapi.staticfiles import StaticFiles

static_dir = os.path.join(os.path.dirname(__file__), "static")
app.mount("/static", StaticFiles(directory=static_dir), name="static")

from fastapi.responses import FileResponse
from fastapi.responses import StreamingResponse
try:
    from backend.llm import ask_openai_stream
except ImportError:
    from llm import ask_openai_stream

@app.get("/favicon.ico")
async def favicon():
    favicon_path = os.path.join(os.path.dirname(__file__), "static", "favicon.ico")
    return FileResponse(favicon_path)

def verify_token(request: Request):
    """Verify authentication token (Firebase or MongoDB JWT)"""
    if firebase_admin is None:
        # Fallback to mock authentication if Firebase is not available
        return {"uid": "mock_user_id", "sub": "mock_user_id", "email": "test@example.com", "name": "Test User"}
    
    try:
        # Get the Authorization header
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
        
        # Extract the token
        token = auth_header.split("Bearer ")[1]
        
        # First try to verify as MongoDB JWT token
        try:
            from backend.core.security import verify_access
            decoded_token = verify_access(token)
            
            # Return MongoDB user information in Firebase format
            return {
                "uid": decoded_token["sub"],
                "sub": decoded_token["sub"],
                "email": decoded_token.get("email", ""),
                "name": decoded_token.get("email", "").split("@")[0],  # Use email prefix as name
                "picture": None,
                "roles": decoded_token.get("roles", [])
            }
        except Exception as jwt_error:
            # If JWT verification fails, try Firebase verification
            try:
                decoded_token = firebase_auth.verify_id_token(token)
                
                # Return Firebase user information
                return {
                    "uid": decoded_token["uid"],
                    "sub": decoded_token["uid"],
                    "email": decoded_token.get("email", ""),
                    "name": decoded_token.get("name", ""),
                    "picture": decoded_token.get("picture", "")
                }
            except Exception as firebase_error:
                print(f"❌ Both JWT and Firebase token verification failed:")
                print(f"   JWT error: {jwt_error}")
                print(f"   Firebase error: {firebase_error}")
                raise HTTPException(status_code=401, detail="Invalid authentication token")
                
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Token verification failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid authentication token")

class MicroLessonRequest(BaseModel):
    topic: str

class SimulationRequest(BaseModel):
    history: list  # List of dicts: [{"speaker": "Customer", "text": "...", "user_choice": "..."}]
    user_input: str  # The user's latest choice/response

class RecommendationRequest(BaseModel):
    skill_gap: str

class Turn(BaseModel):
    speaker: str
    text: str

class SimulationStepRequest(BaseModel):
    history: List[Turn]
    # ... other fields

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

class TeamUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class TeamMemberUpdateRequest(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    skills: Optional[List[str]] = None
    performance_score: Optional[float] = None

class TeamAnalyticsRequest(BaseModel):
    metrics: List[str]  # e.g., ["collaboration", "productivity", "communication"]

# Certification Models
class CertificationProfile(BaseModel):
    role: str
    skills: List[str]
    goals: str
    experience_level: str

class CertificationStudyPlan(BaseModel):
    certification_name: str
    current_skills: List[str]
    study_time: int  # hours per week
    target_date: str

class CertificationSimulation(BaseModel):
    certification_name: str
    user_responses: List[str] = []

class LLMStreamRequest(BaseModel):
    prompt: str = None
    messages: list = None
    task_type: str = "general"  # New parameter for GPT-5
    complexity: str = "medium"   # New parameter for GPT-5
    max_tokens: int = 512

@app.get("/")
def root():
    return {"message": "AI Workplace Learning API is running."}




@app.get("/concepts")
async def generate_concepts(request: Request, user=Depends(verify_token)):
    """Generate AI-based workplace learning concepts."""
    result = ask_ai_unified_sync(CONCEPT_PROMPT, task_type="concepts", complexity="medium", max_tokens=800, request_headers=request.headers)
    return {"concepts": result}

def generate_micro_lesson(topic: str, request_headers=None) -> str:
    prompt = f"Write a concise, practical micro-lesson for the following workplace topic: {topic}"
    return ask_ai_unified_sync(prompt, task_type="micro_lesson", complexity="medium", max_tokens=600, request_headers=request_headers)

@app.post("/micro-lesson")
async def micro_lesson(request: Request, user=Depends(verify_token)):
    data = await request.json()
    topic = data.get("topic", "default topic")
    lesson_text = data.get("lesson")
    if not lesson_text:
        lesson_text = generate_micro_lesson(topic, request.headers)
    # Save to MongoDB with user ID
    await lessons_collection.insert_one({
        "topic": topic,
        "lesson": lesson_text,
        "user_id": user["uid"],
        "user_email": user.get("email", ""),
        "created_at": datetime.utcnow()
    })
    return {"lesson": lesson_text}

@app.get("/simulation")
async def generate_simulation(request: Request, user=Depends(verify_token)):
    """Generate a customer conversation simulation."""
    result = ask_ai_unified_sync(SIMULATION_PROMPT, task_type="simulation", complexity="medium", max_tokens=1000, request_headers=request.headers)
    return {"simulation": result}

@app.post("/recommendation")
async def generate_recommendation(recommendation_request: RecommendationRequest, http_request: Request, user=Depends(verify_token)):
    prompt = RECOMMENDATION_PROMPT.replace("{skill_gap}", recommendation_request.skill_gap)
    result = ask_ai_unified_sync(prompt, task_type="recommendation", complexity="medium", max_tokens=600, request_headers=http_request.headers)
    return {"recommendation": result}

@app.post("/simulation-step")
async def simulation_step(simulation_request: SimulationRequest, http_request: Request, user=Depends(verify_token)):
    # Build conversation history as text
    history_text = ""
    for turn in simulation_request.history:
        if not isinstance(turn, dict) or 'speaker' not in turn or 'text' not in turn:
            print("Malformed turn in history:", turn)
            continue  # or raise an error, or handle as needed
        history_text += f"{turn['speaker']}: {turn['text']}\n"
        if 'user_choice' in turn:
            history_text += f"Employee: {turn['user_choice']}\n"
    prompt = (
        f"{SIMULATION_PROMPT}\n"
        f"Conversation so far:\n{history_text}\n"
        f"Employee's next response: {simulation_request.user_input}\n"
        "Continue the scenario."
    )
    result = ask_ai_unified_sync(prompt, task_type="simulation", complexity="medium", max_tokens=1000, request_headers=http_request.headers)
    print("LLM raw response:", result)
    # Try to parse the LLM's response as JSON
    import json
    try:
        parsed = json.loads(result)
    except Exception:
        # If parsing fails, return the raw result for debugging
        parsed = {"customerText": "Sorry, could not parse AI response.", "choices": []}
    return parsed 

@app.post("/web-search")
async def web_search(request: Request):
    data = await request.json()
    query = data.get("query")
    if not query:
        return {"error": "No query provided"}
    result = web_search_query(query)
    return {"result": result} 

@app.get("/lessons")
async def get_lessons(user=Depends(verify_token)):
    lessons = []
    async for lesson in lessons_collection.find({"user_id": user["uid"]}):
        lesson["_id"] = str(lesson["_id"])
        lessons.append(lesson)
    return {"lessons": lessons} 

@app.delete("/lessons/{lesson_id}")
async def delete_lesson(lesson_id: str, user=Depends(verify_token)):
    # Only delete lessons owned by the authenticated user
    result = await lessons_collection.delete_one({
        "_id": ObjectId(lesson_id),
        "user_id": user["uid"]  # Ensure user owns this lesson
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return {"success": True}

@app.put("/lessons/{lesson_id}")
async def update_lesson(lesson_id: str, data: dict = Body(...), user=Depends(verify_token)):
    # Only update lessons owned by the authenticated user
    result = await lessons_collection.update_one(
        {
            "_id": ObjectId(lesson_id),
            "user_id": user["uid"]  # Ensure user owns this lesson
        },
        {"$set": {"topic": data.get("topic"), "lesson": data.get("lesson")}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return {"success": True} 

@app.post("/career-coach")
async def career_coach(request: Request, user=Depends(verify_token)):
    data = await request.json()
    history = data.get("history", [])
    # If no history, start with the system prompt
    if not history:
        messages = [{"role": "system", "content": PROMPTS["career_coach"]}]
    else:
        messages = history
    result = ask_ai_unified_sync(messages=messages, task_type="career_coach", complexity="high", max_tokens=800, request_headers=request.headers)
    
    # Optionally save the session for the user
    try:
        await career_coach_sessions.insert_one({
            "user_id": user["uid"],
            "user_email": user.get("email", ""),
            "history": history,
            "response": result,
            "created_at": datetime.utcnow()
        })
    except Exception as e:
        print(f"Failed to save career coach session: {e}")
    
    return {"response": result} 

@app.post("/skills-forecast")
async def skills_forecast(request: Request, user=Depends(verify_token)):
    data = await request.json()
    history = data.get("history", "")
    keywords = data.get("keywords", "")
    context = f"User history:\n{history}\n\nTranscript keywords:\n{keywords}\n\n"
    prompt = PROMPTS["skills_forecast"] + "\n" + context
    result = ask_ai_unified_sync(prompt, task_type="skills_forecast", complexity="high", max_tokens=800, request_headers=request.headers)
    
    # Optionally save the forecast for the user
    try:
        await skills_forecasts.insert_one({
            "user_id": user["uid"],
            "user_email": user.get("email", ""),
            "history": history,
            "keywords": keywords,
            "forecast": result,
            "created_at": datetime.utcnow()
        })
    except Exception as e:
        print(f"Failed to save skills forecast: {e}")
    
    return {"forecast": result}

@app.get("/user/career-sessions")
async def get_career_sessions(user=Depends(verify_token)):
    """Get user's career coach sessions."""
    sessions = []
    async for session in career_coach_sessions.find({"user_id": user["uid"]}).sort("created_at", -1):
        session["_id"] = str(session["_id"])
        sessions.append(session)
    return {"sessions": sessions}

@app.get("/user/skills-forecasts")
async def get_skills_forecasts(user=Depends(verify_token)):
    """Get user's skills forecasts."""
    forecasts = []
    async for forecast in skills_forecasts.find({"user_id": user["uid"]}).sort("created_at", -1):
        forecast["_id"] = str(forecast["_id"])
        forecasts.append(forecast)
    return {"forecasts": forecasts}

# Team Management Endpoints
@app.post("/teams")
async def create_team(request: TeamCreateRequest, user=Depends(verify_token)):
    """Create a new team."""
    print(f"[TEAM CREATION] Creating team: {request.name} with {len(request.members)} members")
    
    # Validate members - check for duplicate emails
    emails = [member.email.lower().strip() for member in request.members]
    if len(emails) != len(set(emails)):
        raise HTTPException(status_code=400, detail="Duplicate emails are not allowed in the same team")
    
    team_data = {
        "name": request.name,
        "description": request.description,
        "created_by": user["uid"],
        "created_by_email": user.get("email", ""),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    # Insert team
    team_result = await teams_collection.insert_one(team_data)
    team_id = str(team_result.inserted_id)
    print(f"[TEAM CREATION] Team created with ID: {team_id}")
    
    # Insert team members
    member_docs = []
    for i, member in enumerate(request.members):
        print(f"[TEAM CREATION] Processing member {i+1}: {member.name} ({member.email})")
        member_doc = {
            "team_id": team_id,
            "name": member.name.strip(),
            "role": member.role.strip(),
            "email": member.email.lower().strip(),
            "skills": member.skills,
            "performance_score": member.performance_score,
            "created_at": datetime.utcnow()
        }
        member_docs.append(member_doc)
    
    if member_docs:
        print(f"[TEAM CREATION] Inserting {len(member_docs)} members into database")
        result = await team_members_collection.insert_many(member_docs)
        print(f"[TEAM CREATION] Members inserted: {len(result.inserted_ids)}")
    else:
        print("[TEAM CREATION] No members to insert")
    
    return {"team_id": team_id, "message": "Team created successfully"}

@app.get("/teams")
async def get_teams(user=Depends(verify_token)):
    """Get all teams created by the user."""
    print(f"[GET TEAMS] Getting teams for user: {user['uid']}")
    teams = []
    async for team in teams_collection.find({"created_by": user["uid"]}):
        team["_id"] = str(team["_id"])
        # Get member count for each team
        member_count = await team_members_collection.count_documents({"team_id": team["_id"]})
        team["member_count"] = member_count
        print(f"[GET TEAMS] Team {team['name']} has {member_count} members")
        teams.append(team)
    print(f"[GET TEAMS] Returning {len(teams)} teams")
    return {"teams": teams}

@app.get("/teams/{team_id}")
async def get_team(team_id: str, user=Depends(verify_token)):
    """Get specific team details with members."""
    # Verify team ownership
    team = await teams_collection.find_one({
        "_id": ObjectId(team_id),
        "created_by": user["uid"]
    })
    
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    team["_id"] = str(team["_id"])
    
    # Get team members
    members = []
    async for member in team_members_collection.find({"team_id": team_id}):
        member["_id"] = str(member["_id"])
        members.append(member)
    
    team["members"] = members
    return {"team": team}

@app.put("/teams/{team_id}")
async def update_team(team_id: str, request: TeamUpdateRequest, user=Depends(verify_token)):
    """Update team details."""
    # Verify team ownership
    team = await teams_collection.find_one({
        "_id": ObjectId(team_id),
        "created_by": user["uid"]
    })
    
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Prepare update data
    update_data = {"updated_at": datetime.utcnow()}
    if request.name is not None:
        update_data["name"] = request.name
    if request.description is not None:
        update_data["description"] = request.description
    
    await teams_collection.update_one(
        {"_id": ObjectId(team_id)},
        {"$set": update_data}
    )
    
    return {"message": "Team updated successfully"}

@app.delete("/teams/{team_id}")
async def delete_team(team_id: str, user=Depends(verify_token)):
    """Delete a team and all its members."""
    # Verify team ownership
    team = await teams_collection.find_one({
        "_id": ObjectId(team_id),
        "created_by": user["uid"]
    })
    
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Delete team members first
    await team_members_collection.delete_many({"team_id": team_id})
    
    # Delete team
    await teams_collection.delete_one({"_id": ObjectId(team_id)})
    
    return {"message": "Team deleted successfully"}

@app.post("/teams/{team_id}/members")
async def add_team_member(team_id: str, member: TeamMember, user=Depends(verify_token)):
    """Add a new member to a team."""
    # Verify team ownership
    team = await teams_collection.find_one({
        "_id": ObjectId(team_id),
        "created_by": user["uid"]
    })
    
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    member_doc = {
        "team_id": team_id,
        "name": member.name,
        "role": member.role,
        "email": member.email,
        "skills": member.skills,
        "performance_score": member.performance_score,
        "created_at": datetime.utcnow()
    }
    
    result = await team_members_collection.insert_one(member_doc)
    member_doc["_id"] = str(result.inserted_id)
    
    return {"member": member_doc, "message": "Member added successfully"}

@app.put("/teams/{team_id}/members/{member_id}")
async def update_team_member(
    team_id: str, 
    member_id: str, 
    request: TeamMemberUpdateRequest, 
    user=Depends(verify_token)
):
    """Update a team member's details."""
    # Verify team ownership
    team = await teams_collection.find_one({
        "_id": ObjectId(team_id),
        "created_by": user["uid"]
    })
    
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Prepare update data
    update_data = {}
    if request.name is not None:
        update_data["name"] = request.name
    if request.role is not None:
        update_data["role"] = request.role
    if request.skills is not None:
        update_data["skills"] = request.skills
    if request.performance_score is not None:
        update_data["performance_score"] = request.performance_score
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await team_members_collection.update_one(
        {"_id": ObjectId(member_id), "team_id": team_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Member not found")
    
    return {"message": "Member updated successfully"}

@app.delete("/teams/{team_id}/members/{member_id}")
async def remove_team_member(team_id: str, member_id: str, user=Depends(verify_token)):
    """Remove a member from a team."""
    # Verify team ownership
    team = await teams_collection.find_one({
        "_id": ObjectId(team_id),
        "created_by": user["uid"]
    })
    
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    result = await team_members_collection.delete_one({
        "_id": ObjectId(member_id),
        "team_id": team_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Member not found")
    
    return {"message": "Member removed successfully"}

@app.post("/teams/{team_id}/analytics")
async def generate_team_analytics(team_id: str, analytics_request: TeamAnalyticsRequest, http_request: Request, user=Depends(verify_token)):
    """Generate AI-powered team analytics."""
    # Verify team ownership
    team = await teams_collection.find_one({
        "_id": ObjectId(team_id),
        "created_by": user["uid"]
    })
    
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Get team members
    members = []
    async for member in team_members_collection.find({"team_id": team_id}):
        members.append(member)
    
    # Prepare data for AI analysis
    team_data = {
        "team_name": team["name"],
        "team_description": team["description"],
        "members": members,
        "metrics": analytics_request.metrics
    }
    
    # Generate AI analysis
    analysis_prompt = f"""
    Analyze the following team data and provide insights on the requested metrics:
    
    Team: {team_data['team_name']}
    Description: {team_data['team_description']}
    
    Team Members:
    {chr(10).join([f"- {m['name']} ({m['role']}): Skills: {', '.join(m['skills'])}" for m in members])}
    
    Requested Metrics: {', '.join(analytics_request.metrics)}
    
    Please provide:
    1. Overall team assessment
    2. Individual member analysis
    3. Recommendations for improvement
    4. Collaboration insights
    """
    
    analysis_result = ask_ai_unified_sync(analysis_prompt, task_type="team_analytics", complexity="high", max_tokens=1000, request_headers=http_request.headers)
    
    # Save analytics
    analytics_doc = {
        "team_id": team_id,
        "user_id": user["uid"],
        "metrics": analytics_request.metrics,
        "analysis": analysis_result,
        "created_at": datetime.utcnow()
    }
    
    await team_analytics_collection.insert_one(analytics_doc)
    
    return {"analysis": analysis_result}

@app.get("/teams/{team_id}/analytics")
async def get_team_analytics(team_id: str, user=Depends(verify_token)):
    """Get historical analytics for a team."""
    # Verify team ownership
    team = await teams_collection.find_one({
        "_id": ObjectId(team_id),
        "created_by": user["uid"]
    })
    
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    analytics = []
    async for analysis in team_analytics_collection.find({"team_id": team_id}).sort("created_at", -1):
        analysis["_id"] = str(analysis["_id"])
        analytics.append(analysis)
    
    return {"analytics": analytics}

# Certification Endpoints
@app.post("/certifications/save-profile")
async def save_user_profile(request: CertificationProfile, user=Depends(verify_token)):
    """Save user profile for auto-fill functionality."""
    try:
        print(f"Saving profile for user {user['uid']}: {request.dict()}")
        
        # Save or update user profile
        result = await certifications_collection.update_one(
            {"user_id": user["uid"], "type": "profile"},
            {
                "$set": {
                    "user_id": user["uid"],
                    "user_email": user.get("email", ""),
                    "type": "profile",
                    "profile": request.dict(),
                    "updated_at": datetime.utcnow()
                }
            },
            upsert=True
        )
        
        print(f"Profile save result: {result.modified_count} modified, {result.upserted_id} upserted")
        return {"message": "Profile saved successfully"}
    except Exception as e:
        print(f"Failed to save user profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to save profile")

@app.get("/certifications/user-profile")
async def get_user_profile(user=Depends(verify_token)):
    """Get user's latest profile for auto-fill."""
    try:
        print(f"Getting profile for user {user['uid']}")
        
        profile_doc = await certifications_collection.find_one({
            "user_id": user["uid"],
            "type": "profile"
        })
        
        print(f"Found profile doc: {profile_doc}")
        
        if profile_doc and profile_doc.get("profile"):
            return {"profile": profile_doc["profile"]}
        return {"profile": None}
    except Exception as e:
        print(f"Failed to get user profile: {e}")
        return {"profile": None}

@app.post("/certifications/recommend")
async def recommend_certifications(certification_request: CertificationProfile, http_request: Request, user=Depends(verify_token)):
    """Generate AI-powered certification recommendations based on user profile."""
    prompt = CERTIFICATION_RECOMMENDATION_PROMPT.format(
        role=certification_request.role,
        skills=", ".join(certification_request.skills),
        goals=certification_request.goals,
        experience_level=certification_request.experience_level
    )
    
    result = ask_ai_unified_sync(prompt, task_type="certification_recommendation", complexity="medium", max_tokens=600, request_headers=http_request.headers)
    
    # Save recommendation for user
    try:
        await certifications_collection.insert_one({
            "user_id": user["uid"],
            "user_email": user.get("email", ""),
            "profile": request.dict(),
            "recommendation": result,
            "created_at": datetime.utcnow()
        })
    except Exception as e:
        print(f"Failed to save certification recommendation: {e}")
    
    return {"recommendation": result}

@app.post("/certifications/study-plan")
async def generate_study_plan(study_plan_request: CertificationStudyPlan, http_request: Request, user=Depends(verify_token)):
    """Generate a personalized study plan for a specific certification."""
    prompt = CERTIFICATION_STUDY_PLAN_PROMPT.format(
        certification_name=study_plan_request.certification_name,
        current_skills=", ".join(study_plan_request.current_skills),
        study_time=study_plan_request.study_time,
        target_date=study_plan_request.target_date
    )
    
    result = ask_ai_unified_sync(prompt, task_type="certification_study_plan", complexity="high", max_tokens=1000, request_headers=http_request.headers)
    
    # Save study plan for user
    try:
        await study_plans_collection.insert_one({
            "user_id": user["uid"],
            "user_email": user.get("email", ""),
            "certification_name": request.certification_name,
            "study_plan": result,
            "created_at": datetime.utcnow()
        })
    except Exception as e:
        print(f"Failed to save study plan: {e}")
    
    return {"study_plan": result}

@app.post("/certifications/simulate")
async def certification_simulation(simulation_request: CertificationSimulation, http_request: Request, user=Depends(verify_token)):
    """Generate certification interview simulation."""
    prompt = CERTIFICATION_SIMULATION_PROMPT.format(
        certification_name=simulation_request.certification_name
    )
    
    result = ask_ai_unified_sync(prompt, task_type="certification_simulation", complexity="medium", max_tokens=800, request_headers=http_request.headers)
    
    # Save simulation for user
    try:
        await certification_simulations_collection.insert_one({
            "user_id": user["uid"],
            "user_email": user.get("email", ""),
            "certification_name": request.certification_name,
            "simulation": result,
            "created_at": datetime.utcnow()
        })
    except Exception as e:
        print(f"Failed to save certification simulation: {e}")
    
    return {"simulation": result}

@app.get("/certifications/user-recommendations")
async def get_user_certifications(user=Depends(verify_token)):
    """Get user's certification recommendations and study plans."""
    recommendations = []
    async for rec in certifications_collection.find({"user_id": user["uid"]}).sort("created_at", -1):
        rec["_id"] = str(rec["_id"])
        recommendations.append(rec)
    
    study_plans = []
    async for plan in study_plans_collection.find({"user_id": user["uid"]}).sort("created_at", -1):
        plan["_id"] = str(plan["_id"])
        study_plans.append(plan)
    
    simulations = []
    async for sim in certification_simulations_collection.find({"user_id": user["uid"]}).sort("created_at", -1):
        sim["_id"] = str(sim["_id"])
        simulations.append(sim)
    
    return {
        "recommendations": recommendations,
        "study_plans": study_plans,
        "simulations": simulations
    } 

from backend.llm import call_llm_router

class RouteRequest(BaseModel):
    prompt: str

@app.post("/route")
async def route_prompt(request: RouteRequest):
    result = await call_llm_router(request.prompt)
    return result 

@app.post("/llm-stream")
async def llm_stream(llm_request: LLMStreamRequest, http_request: Request):
    print(f"[LLM STREAM] New request: {llm_request}", flush=True)
    def event_stream():
        for chunk in ask_openai_stream(
            prompt=llm_request.prompt,
            task_type=llm_request.task_type,  # Use new parameter
            complexity=llm_request.complexity,   # Use new parameter
            max_tokens=llm_request.max_tokens,
            messages=llm_request.messages,
            request_headers=http_request.headers
        ):
            print(f"[LLM STREAM] Sending chunk: {chunk}", flush=True)
            yield chunk
    return StreamingResponse(event_stream(), media_type="text/plain")

@app.post("/video-quiz")
async def video_quiz(request: Request):
    try:
        data = await request.json()
        summary = data.get("summary", "")
        if not summary:
            return {"error": "Summary is required"}
        
        prompt = video_quiz_prompt.format(summary=summary)
        result = ask_ai_unified_sync(prompt, task_type="video_quiz", complexity="medium", max_tokens=600, request_headers=request.headers)
        
        try:
            questions = json.loads(result)
            if not isinstance(questions, list):
                questions = [{"question": "Failed to parse quiz", "options": [], "answer": "", "explanation": ""}]
        except json.JSONDecodeError:
            questions = [{"question": "Failed to parse quiz", "options": [], "answer": "", "explanation": ""}]
        
        return {"quiz": questions}
    except Exception as e:
        print(f"Video quiz error: {e}")
        return {"error": "Failed to generate quiz", "quiz": []} 

@app.post("/video-summary")
async def video_summary(request: Request):
    data = await request.json()
    transcript = data.get("transcript", "")
    prompt = video_summary_prompt.format(transcript=transcript)
    summary = ask_ai_unified_sync(prompt, task_type="video_summary", complexity="medium", max_tokens=500, request_headers=request.headers)
    return {"summary": summary} 

class IntentInput(BaseModel):
    query: str

@app.post("/classify-intent")
async def handle_intent(input_data: IntentInput):
    result = classify_intent(input_data.query)
    # Log to database
    await unknown_intents_collection.insert_one({
        "user_input": input_data.query,
        "classification": result,
        "created_at": datetime.utcnow()
    })
    return result 

@app.get("/admin/unknown-intents")
async def get_unknown_intents():
    ideas = []
    async for idea in unknown_intents_collection.find().sort("created_at", -1):
        idea["_id"] = str(idea["_id"])
        ideas.append(idea)
    return {"ideas": ideas} 

@app.post("/admin/unknown-intents/{idea_id}/upvote")
async def upvote_idea(idea_id: str):
    result = await unknown_intents_collection.update_one(
        {"_id": ObjectId(idea_id)},
        {"$inc": {"upvotes": 1}}
    )
    return {"success": result.modified_count == 1}

@app.post("/admin/unknown-intents/{idea_id}/subscribe")
async def subscribe_idea(idea_id: str, data: dict = Body(...)):
    email = data.get("email")
    if not email:
        return {"success": False, "error": "Email required"}
    result = await unknown_intents_collection.update_one(
        {"_id": ObjectId(idea_id)},
        {"$addToSet": {"subscribers": email}}
    )
    return {"success": result.modified_count == 1}

@app.post("/admin/unknown-intents/{idea_id}/status")
async def update_idea_status(idea_id: str, data: dict = Body(...)):
    status_val = data.get("status")
    if not status_val:
        return {"success": False, "error": "Status required"}
    result = await unknown_intents_collection.update_one(
        {"_id": ObjectId(idea_id)},
        {"$set": {"status": status_val}}
    )
    return {"success": result.modified_count == 1} 

@app.delete("/admin/unknown-intents/{idea_id}")
async def delete_unknown_intent(idea_id: str):
    result = await unknown_intents_collection.delete_one({"_id": ObjectId(idea_id)})
    return {"success": result.deleted_count == 1}

class ScaffoldRequest(BaseModel):
    feature_name: str
    feature_summary: str
    scaffold_type: str = "API Route"

@app.post("/generate-scaffold")
async def generate_scaffold_endpoint(req: ScaffoldRequest, user: Optional[str] = None):
    code = generate_scaffold(req.feature_name, req.feature_summary, req.scaffold_type)
    # Save scaffold history
    await scaffold_history_collection.insert_one({
        "idea": req.feature_name,
        "feature_summary": req.feature_summary,
        "scaffold_type": req.scaffold_type,
        "code": code,
        "created_at": datetime.utcnow(),
        "user": user or "anonymous"
    })
    return {"code": code} 

@app.get("/scaffold-history/{idea}")
async def get_scaffold_history(idea: str):
    history = []
    async for entry in scaffold_history_collection.find({"idea": idea}).sort("created_at", -1):
        entry["_id"] = str(entry["_id"])
        history.append(entry)
    return {"history": history} 

@app.patch("/scaffold-history/{scaffold_id}/approve")
async def approve_scaffold(scaffold_id: str, data: dict = Body(...)):
    admin_comment = data.get("admin_comment", "")
    approved_by = data.get("approved_by", "admin")
    result = await scaffold_history_collection.update_one(
        {"_id": ObjectId(scaffold_id)},
        {"$set": {
            "approved": True,
            "admin_comment": admin_comment,
            "approved_at": datetime.utcnow(),
            "approved_by": approved_by
        }}
    )
    return {"success": result.modified_count == 1} 

# Voice Cloning endpoints removed - feature discontinued due to complexity
# Future implementation planned with lighter alternatives 

# Add this endpoint for AI Learning & Training module
@app.get("/api/ai-lessons")
async def get_ai_lessons():
    """Get available AI learning lessons"""
    lessons = [
        {
            "id": "ai_intro_001",
            "title": "Introduction to AI",
            "description": "Learn the fundamentals of Artificial Intelligence",
            "sections": [
                {
                    "heading": "What is Artificial Intelligence?",
                    "content": "Artificial Intelligence (AI) refers to machines that can simulate human intelligence — including reasoning, learning, and problem-solving. It powers everything from chatbots to autonomous vehicles.",
                    "type": "text"
                },
                {
                    "heading": "Subfields of AI",
                    "content": [
                        "Machine Learning (ML): Learn from data without explicit programming",
                        "Natural Language Processing (NLP): Understand and generate human language", 
                        "Computer Vision: Interpret and analyze visual input"
                    ],
                    "type": "list"
                },
                {
                    "heading": "Key Concepts",
                    "definitions": [
                        {"term": "AI", "definition": "Machine-driven cognitive capability"},
                        {"term": "ML", "definition": "AI technique using data to learn"},
                        {"term": "LLM", "definition": "Large Language Model trained on vast text datasets"}
                    ],
                    "type": "definitions"
                }
            ],
            "quiz": [
                {
                    "question": "What does AI stand for?",
                    "options": {
                        "a": "Artificial Intelligence",
                        "b": "Automated Information", 
                        "c": "Advanced Integration"
                    },
                    "correct_answer": "a"
                },
                {
                    "question": "Which is a subfield of AI?",
                    "options": {
                        "a": "Photosynthesis",
                        "b": "Machine Learning",
                        "c": "Quantum Painting"
                    },
                    "correct_answer": "b"
                }
            ]
        }
    ]
    return {"lessons": lessons}

@app.get("/api/ai-lessons/{lesson_id}")
async def get_ai_lesson(lesson_id: str):
    """Get specific AI lesson by ID"""
    # For now, return the same lesson for any ID
    # In a real implementation, this would fetch from a database
    lesson = {
        "id": lesson_id,
        "title": "Introduction to AI",
        "description": "Learn the fundamentals of Artificial Intelligence",
        "sections": [
            {
                "heading": "What is Artificial Intelligence?",
                "content": "Artificial Intelligence (AI) refers to machines that can simulate human intelligence — including reasoning, learning, and problem-solving. It powers everything from chatbots to autonomous vehicles.",
                "type": "text"
            }
        ]
    }
    return lesson 

# Quiz submission endpoint
@app.post("/api/quiz/submit")
async def submit_quiz(request: Request):
    """Submit quiz answers and get score"""
    try:
        data = await request.json()
        lesson_id = data.get("lesson_id")
        answers = data.get("answers", {})
        
        # For now, use hardcoded answer keys (in real implementation, fetch from database)
        answer_keys = {
            "ai_intro_001": {
                0: "a",  # What does AI stand for?
                1: "b",  # Which is a subfield of AI?
                2: "a"   # What does NLP stand for?
            }
        }
        
        lesson_answers = answer_keys.get(lesson_id, {})
        correct = 0
        total = len(lesson_answers)
        
        for question_index, user_answer in answers.items():
            if lesson_answers.get(int(question_index)) == user_answer:
                correct += 1
        
        score_percentage = round((correct / total) * 100) if total > 0 else 0
        
        return {
            "lesson_id": lesson_id,
            "score": {
                "correct": correct,
                "total": total,
                "percentage": score_percentage
            },
            "answers": answers,
            "correct_answers": lesson_answers
        }
    except Exception as e:
        return {"error": str(e)}, 400

# Get quiz results for a user
@app.get("/api/quiz/results/{user_id}")
async def get_quiz_results(user_id: str):
    """Get all quiz results for a user"""
    # In a real implementation, this would fetch from a database
    # For now, return mock data
    return {
        "user_id": user_id,
        "results": [
            {
                "lesson_id": "ai_intro_001",
                "score": 85,
                "timestamp": "2024-01-15T10:30:00Z",
                "completed": True
            }
        ]
    } 

# Knowledge Map endpoints
@app.get("/api/knowledge-map/topics")
async def get_knowledge_topics():
    """Get all available knowledge topics with their embeddings and metadata from MongoDB"""
    try:
        from backend.knowledge_map_utils import extract_topics_from_modules, generate_topic_embedding, categorize_topic
        
        # Extract topics from MongoDB (global, no user filtering)
        raw_topics = await extract_topics_from_modules()
        
        # Transform to expected format
        topics = {}
        for topic_key, topic_data in raw_topics.items():
            topics[topic_key] = {
                "id": topic_data["id"],
                "label": topic_data["label"],
                "description": topic_data["description"],
                "embedding": generate_topic_embedding(topic_data["label"]),
                "category": categorize_topic(topic_data["label"]),
                "source": topic_data["source"],
                "count": topic_data["count"]
            }
        
        if not topics:
            # Fallback to original data if no MongoDB topics found
            topics = {
                "programming": {
                    "id": "programming",
                    "label": "Programming",
                    "description": "Computer programming and software development",
                    "embedding": [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
                    "category": "AI & Technology"
                }
            }
        
        print(f"🚀 Using {len(topics)} topics for knowledge map")
        return {"topics": topics}
        
    except Exception as e:
        print(f"❌ Error loading topics: {e}")
        # Fallback to original data
        return {"topics": {"programming": {"id": "programming", "label": "Programming", "description": "Computer programming", "embedding": [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0], "category": "AI & Technology"}}}

@app.get("/api/knowledge-map/user/{user_id}")
async def get_user_knowledge_map(user_id: str):
    """Get user's knowledge map with progress and proximity scores"""
    # In production, this would come from a database
    # For now, we'll simulate reading from localStorage
    
    # Get user progress from localStorage (simulated)
    user_progress = {
        "lessonsCompleted": 12,
        "simulationsCompleted": 1,
        "simulationScore": 1,
        "lastActivity": "2025-01-30T10:00:00Z"
    }
    
    # Calculate mastery scores based on actual user activity
    # This would be more sophisticated in production
    base_mastery = {
        "prompt_engineering": 0.3,  # Base level
        "ai_ethics": 0.2,           # Base level
        "machine_learning": 0.1,    # Base level
        "team_leadership": 0.4,     # Base level
        "project_management": 0.3,  # Base level
        "customer_service": 0.2,    # Base level
        "sales_negotiation": 0.1,   # Base level
        "conflict_resolution": 0.3, # Base level
        "presentation_skills": 0.4, # Base level
        "data_analysis": 0.1        # Base level
    }
    
    # Map user activities to knowledge topics
    # This mapping would be more sophisticated in production
    activity_topic_mapping = {
        "simulations": {
            "team_leadership": ["team_leadership", "conflict_resolution"],
            "customer_service": ["customer_service", "communication"],
            "sales": ["sales_negotiation", "presentation_skills"],
            "project_management": ["project_management", "team_leadership"]
        },
        "ai_study_buddy": {
            "leadership": ["team_leadership", "conflict_resolution"],
            "communication": ["presentation_skills", "communication"],
            "ai": ["prompt_engineering", "ai_ethics", "machine_learning"],
            "business": ["project_management", "customer_service", "sales_negotiation"]
        },
        "recommendations": {
            "leadership": ["team_leadership", "conflict_resolution"],
            "management": ["project_management", "team_leadership"],
            "technical": ["prompt_engineering", "machine_learning", "data_analysis"],
            "communication": ["presentation_skills", "communication"]
        }
    }
    
    # Simulate reading user activities from localStorage
    # In production, this would come from a database
    user_activities = {
        "completed_simulations": ["team_leadership", "conflict_resolution"],
        "completed_lessons": ["prompt_engineering", "ai_ethics", "presentation_skills"],
        "ai_study_buddy_sessions": ["team_leadership", "communication"],
        "saved_recommendations": ["project_management", "leadership"]
    }
    
    # Calculate mastery scores based on activities
    mastery_scores = base_mastery.copy()
    
    # Boost mastery for completed activities
    for activity_type, topics in user_activities.items():
        for topic in topics:
            if topic in mastery_scores:
                # Boost mastery based on activity type
                if activity_type == "completed_simulations":
                    mastery_scores[topic] = min(1.0, mastery_scores[topic] + 0.3)
                elif activity_type == "completed_lessons":
                    mastery_scores[topic] = min(1.0, mastery_scores[topic] + 0.2)
                elif activity_type == "ai_study_buddy_sessions":
                    mastery_scores[topic] = min(1.0, mastery_scores[topic] + 0.15)
                elif activity_type == "saved_recommendations":
                    mastery_scores[topic] = min(1.0, mastery_scores[topic] + 0.1)
    
    # Determine recommended next topic (lowest mastery)
    recommended_next = min(mastery_scores.items(), key=lambda x: x[1])[0]
    
    return {
        "user_id": user_id,
        "mastery_scores": mastery_scores,
        "progress": user_progress,
        "recommended_next": recommended_next,
        "activities": user_activities  # Include for debugging
    }

@app.get("/api/knowledge-map/clusters")
async def get_knowledge_clusters():
    """Get dynamic knowledge clusters based on actual topics from MongoDB"""
    try:
        from backend.knowledge_map_utils import extract_topics_from_modules, generate_dynamic_categories
        
        # Extract topics from MongoDB (global, no user filtering)
        raw_topics = await extract_topics_from_modules()
        
        if raw_topics:
            # Generate dynamic categories based on actual topics
            clusters = generate_dynamic_categories(raw_topics)
            print(f"🚀 Generated {len(clusters)} dynamic clusters from {len(raw_topics)} topics")
            return {"clusters": clusters}
        else:
            # Fallback to basic clusters if no topics found
            fallback_clusters = {
                "Programming & Development": ["python", "javascript"],
                "AI & Machine Learning": ["ai_basics"],
                "General Skills": ["communication"]
            }
            print(f"⚠️ No topics found, using fallback clusters: {len(fallback_clusters)} clusters")
            return {"clusters": fallback_clusters}
            
    except Exception as e:
        print(f"❌ Error loading clusters: {e}")
        # Fallback to basic clusters
        return {"clusters": {
            "Programming & Development": ["python", "javascript"],
            "AI & Machine Learning": ["ai_basics"],
            "General Skills": ["communication"]
        }}

@app.post("/api/knowledge-map/activity")
async def update_user_activity(request: Request):
    """Update user activity for knowledge map tracking"""
    try:
        data = await request.json()
        user_id = data.get("user_id")
        activity_type = data.get("activity_type")  # "simulation", "lesson", "ai_study_buddy", "recommendation"
        topic = data.get("topic")  # The specific topic/area
        timestamp = data.get("timestamp", "2025-01-30T10:00:00Z")
        
        # In production, this would save to a database
        # For now, we'll simulate storing the activity
        
        # Return success response
        return {
            "success": True,
            "message": f"Activity {activity_type} for topic {topic} recorded successfully",
            "user_id": user_id,
            "activity": {
                "type": activity_type,
                "topic": topic,
                "timestamp": timestamp
            }
        }
    except Exception as e:
                return {"error": str(e)}, 400

@app.post("/api/knowledge-map/vector-search")
async def perform_vector_search(request: Request):
    """Perform vector similarity search for documents similar to the given topic"""
    try:
        data = await request.json()
        topic = data.get("topic", "")
        limit = data.get("limit", 10)
        
        if not topic:
            return {"error": "Topic is required"}, 400
        
        print(f"🔍 Vector search for topic: '{topic}'")
        
        # Get all micro-lessons from database
        from backend.db import micro_lessons_collection, saved_videos_collection
        
        # Search in micro-lessons
        micro_lessons = await micro_lessons_collection.find({}).to_list(length=None)
        print(f"📚 Found {len(micro_lessons)} micro-lessons")
        
        # Simple text similarity search (in real implementation, this would use vector embeddings)
        results = []
        
        for lesson in micro_lessons:
            title = lesson.get("title", "")
            content = lesson.get("content", "")
            topic_key = lesson.get("topic", "")
            
            # Calculate simple text similarity
            similarity_score = calculate_text_similarity(topic.lower(), f"{title} {content} {topic_key}".lower())
            
            if similarity_score > 0.1:  # Only include results with some similarity
                results.append({
                    "title": title,
                    "content": content[:200] + "..." if len(content) > 200 else content,
                    "topic": topic_key,
                    "source": "micro_lessons",
                    "similarity_score": round(similarity_score, 3),
                    "url": f"/micro-lessons/{lesson.get('_id')}",
                    "type": "micro_lesson"
                })
        
        # Search in saved videos
        videos = await saved_videos_collection.find({}).to_list(length=None)
        print(f"🎥 Found {len(videos)} videos")
        
        for video in videos:
            title = video.get("title", "")
            description = video.get("description", "")
            
            similarity_score = calculate_text_similarity(topic.lower(), f"{title} {description}".lower())
            
            if similarity_score > 0.1:
                results.append({
                    "title": title,
                    "content": description[:200] + "..." if len(description) > 200 else description,
                    "topic": video.get("topic", ""),
                    "source": "videos",
                    "similarity_score": round(similarity_score, 3),
                    "url": video.get("url", ""),
                    "type": "video"
                })
        
        # Sort by similarity score (highest first)
        results.sort(key=lambda x: x["similarity_score"], reverse=True)
        
        # Limit results
        results = results[:limit]
        
        print(f"🔍 Vector search for '{topic}' returned {len(results)} similar documents")
        return {"results": results, "query": topic, "total_found": len(results)}
        
    except Exception as e:
        print(f"❌ Error in vector search: {e}")
        return {"error": str(e)}, 500

def calculate_text_similarity(query, text):
    """Calculate simple text similarity using word overlap"""
    query_words = set(query.split())
    text_words = set(text.split())
    
    if not query_words or not text_words:
        return 0.0
    
    intersection = query_words.intersection(text_words)
    union = query_words.union(text_words)
    
    return len(intersection) / len(union) if union else 0.0

@app.post("/api/knowledge-map/web-search")
async def perform_web_search(request: Request):
    """Perform web search for a topic and prepare results for future library integration"""
    try:
        data = await request.json()
        topic = data.get("topic", "")
        limit = data.get("limit", 10)
        
        if not topic:
            return {"error": "Topic is required"}, 400
        
        # Perform web search (this would integrate with your existing search service)
        # For now, we'll simulate the search results
        search_results = [
            {
                "title": f"Search result 1 for {topic}",
                "url": f"https://example.com/result1",
                "snippet": f"This is a search result about {topic}",
                "score": 0.95,
                "topic": topic,
                "search_timestamp": "2025-01-30T10:00:00Z",
                "ready_for_library": True,
                "library_metadata": {
                    "type": "web_article",
                    "source": "web_search",
                    "topic": topic,
                    "relevance_score": 0.95
                }
            },
            {
                "title": f"Search result 2 for {topic}",
                "url": f"https://example.com/result2",
                "snippet": f"Another search result about {topic}",
                "score": 0.87,
                "topic": topic,
                "search_timestamp": "2025-01-30T10:00:00Z",
                "ready_for_library": True,
                "library_metadata": {
                    "type": "web_article",
                    "source": "web_search",
                    "topic": topic,
                    "relevance_score": 0.87
                }
            }
        ]
        
        # Limit results
        search_results = search_results[:limit]
        
        print(f"🔍 Web search for '{topic}' returned {len(search_results)} results")
        return {"results": search_results}
        
    except Exception as e:
        print(f"❌ Error in web search: {e}")
        return {"error": str(e)}, 500

# Saved Videos endpoints
@app.get("/api/saved-videos/test")
async def get_saved_videos_test():
    """Get saved videos for testing (no auth required)"""
    try:
        cursor = saved_videos_collection.find({})
        videos = await cursor.to_list(length=100)
        
        # Convert ObjectId to string for JSON serialization
        for video in videos:
            video["_id"] = str(video["_id"])
        
        return {"videos": videos, "count": len(videos)}
    except Exception as e:
        return {"error": str(e), "videos": [], "count": 0}

@app.get("/api/saved-videos")
async def get_saved_videos(user=Depends(verify_token)):
    """Get all saved videos for the authenticated user"""
    try:
        user_id = user.get("uid")
        cursor = saved_videos_collection.find({"user_id": user_id})
        videos = await cursor.to_list(length=100)
        
        # Convert ObjectId to string for JSON serialization
        for video in videos:
            video["_id"] = str(video["_id"])
        
        # If no videos exist, create initial data
        if not videos:
            initial_videos = [
                {
                    "user_id": user_id,
                    "title": "Agile Scrum Basics",
                    "description": "Learn the fundamentals of Agile methodology and Scrum framework for effective project management.",
                    "duration": "15:30",
                    "url": "https://www.youtube.com/embed/9TycLR0TqFA",
                    "topic": "Agile",
                    "saved_at": "2025-01-15T10:00:00Z"
                },
                {
                    "user_id": user_id,
                    "title": "Python for Beginners",
                    "description": "Complete introduction to Python programming language with hands-on examples and exercises.",
                    "duration": "25:45",
                    "url": "https://www.youtube.com/embed/kqtD5dpn9C8",
                    "topic": "Programming",
                    "saved_at": "2025-01-14T14:30:00Z"
                },
                {
                    "user_id": user_id,
                    "title": "Leadership Communication",
                    "description": "Master the art of effective communication in leadership roles and team management.",
                    "duration": "18:20",
                    "url": "https://www.youtube.com/embed/8jPQjjsBbIc",
                    "topic": "Leadership",
                    "saved_at": "2025-01-13T09:15:00Z"
                },
                {
                    "user_id": user_id,
                    "title": "JavaScript Fundamentals",
                    "description": "Essential JavaScript concepts for web development and modern applications.",
                    "duration": "22:15",
                    "url": "https://www.youtube.com/embed/W6NZfCO5SIk",
                    "topic": "Programming",
                    "saved_at": "2025-01-12T16:45:00Z"
                },
                {
                    "user_id": user_id,
                    "title": "Data Science Essentials",
                    "description": "Introduction to data science concepts, tools, and methodologies for beginners.",
                    "duration": "28:30",
                    "url": "https://www.youtube.com/embed/ua-CiDNNj30",
                    "topic": "Data Science",
                    "saved_at": "2025-01-11T11:20:00Z"
                }
            ]
            
            # Insert initial videos
            for video in initial_videos:
                result = await saved_videos_collection.insert_one(video)
                video["_id"] = str(result.inserted_id)
            
            videos = initial_videos
        
        return {"videos": videos}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching saved videos: {str(e)}")

@app.post("/api/saved-videos")
async def save_video(request: Request, user=Depends(verify_token)):
    """Save a new video for the authenticated user"""
    try:
        user_id = user.get("uid")
        video_data = await request.json()
        
        # Add user_id and timestamp
        video_data["user_id"] = user_id
        video_data["saved_at"] = datetime.utcnow().isoformat()
        
        result = await saved_videos_collection.insert_one(video_data)
        video_data["_id"] = str(result.inserted_id)
        
        return video_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving video: {str(e)}")

@app.delete("/api/saved-videos/{video_id}")
async def delete_saved_video(video_id: str, user=Depends(verify_token)):
    """Delete a saved video for the authenticated user"""
    try:
        user_id = user.get("uid")
        result = await saved_videos_collection.delete_one({
            "_id": ObjectId(video_id),
            "user_id": user_id
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Video not found or not owned by user")
        
        return {"message": "Video deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting video: {str(e)}")

@app.put("/api/saved-videos/{video_id}")
async def update_saved_video(video_id: str, request: Request, user=Depends(verify_token)):
    """Update a saved video for the authenticated user"""
    try:
        user_id = user.get("uid")
        update_data = await request.json()
        
        result = await saved_videos_collection.update_one(
            {"_id": ObjectId(video_id), "user_id": user_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Video not found or not owned by user")
        
        return {"message": "Video updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating video: {str(e)}")

@app.get("/api/knowledge-map/recommendations/{user_id}")
async def get_learning_recommendations(user_id: str):
    """Get AI-powered learning recommendations with fallback to vector-based analysis"""
    try:
        # Get user's current mastery scores
        user_response = await get_user_knowledge_map(user_id)
        mastery_scores = user_response.get("mastery_scores", {})
        
        # Get all available topics with embeddings
        topics_response = await get_knowledge_topics()
        all_topics = topics_response.get("topics", {})
        
        # Try AI-powered recommendations first
        try:
            from backend.knowledge_map_utils import generate_ai_recommendations
            
            ai_recommendations = generate_ai_recommendations(
                user_response.get("topics", {}), 
                all_topics, 
                mastery_scores
            )
            
            if ai_recommendations:
                # Convert AI recommendations to the expected format
                recommendations = []
                for i, topic_label in enumerate(ai_recommendations):
                    # Find the topic_id for this label
                    topic_id = None
                    for tid, topic_data in all_topics.items():
                        if topic_data.get('label', '') == topic_label:
                            topic_id = tid
                            break
                    
                    if topic_id:
                        current_mastery = mastery_scores.get(topic_id, 0.0)
                        recommendations.append({
                            "topic_id": topic_id,
                            "topic_label": topic_label,
                            "current_mastery": current_mastery,
                            "recommendation_score": 1.0 - (i * 0.1),  # Decreasing score
                            "reason": f"AI recommended based on learning progression",
                            "source": "ai_powered"
                        })
                
                if recommendations:
                    print(f"🤖 AI generated {len(recommendations)} recommendations")
                    return {"recommendations": recommendations}
            
        except Exception as e:
            print(f"⚠️ AI recommendations failed: {e}, using fallback")
        
        # Fallback to vector-based recommendations
        recommendations = []
        
        # Calculate user's learning vector (weighted average of mastered topics)
        user_vector = calculate_user_learning_vector(mastery_scores, all_topics)
        
        for topic_id, topic_data in all_topics.items():
            current_mastery = mastery_scores.get(topic_id, 0.0)
            
            # Skip topics with high mastery (>0.85)
            if current_mastery > 0.85:
                continue
                
            # Advanced scoring algorithm
            recommendation_data = calculate_advanced_recommendation_score(
                topic_id, topic_data, current_mastery, mastery_scores, all_topics, user_vector
            )
            
            recommendations.append(recommendation_data)
        
        # Sort by recommendation score (highest first)
        recommendations.sort(key=lambda x: x["recommendation_score"], reverse=True)
        
        # Return top 6 recommendations with detailed analysis
        top_recommendations = recommendations[:6]
        
        # Calculate learning path suggestions
        learning_paths = generate_learning_paths(top_recommendations, mastery_scores, all_topics)
        
        return {
            "user_id": user_id,
            "recommendations": top_recommendations,
            "learning_paths": learning_paths,
            "vector_analysis": {
                "user_vector": user_vector,
                "total_available": len(recommendations),
                "mastery_distribution": {
                    "low_mastery": len([r for r in recommendations if r["current_mastery"] < 0.3]),
                    "medium_mastery": len([r for r in recommendations if 0.3 <= r["current_mastery"] < 0.7]),
                    "high_mastery": len([r for r in recommendations if r["current_mastery"] >= 0.7])
                },
                "proximity_clusters": identify_proximity_clusters(recommendations)
            }
        }
        
    except Exception as e:
        print(f"Error generating advanced recommendations: {e}")
        return {
            "user_id": user_id,
            "recommendations": [],
            "error": "Failed to generate advanced recommendations"
        }

# Learning Module Creation from Repository Analysis
class LearningModuleRequest(BaseModel):
    title: str
    description: str
    content: str
    analysis_data: dict
    type: str = "repository_analysis"
    created_at: Optional[str] = None

@app.post("/api/create-learning-module")
async def create_learning_module(request: LearningModuleRequest):
    try:
        # Generate a unique ID for the learning module
        module_id = str(uuid.uuid4())
        
        # Prepare the learning module data
        learning_module = {
            "_id": module_id,
            "title": request.title,
            "description": request.description,
            "content": request.content,
            "analysis_data": request.analysis_data,
            "repo_url": getattr(request, 'repo_url', ''),
            "repo_name": getattr(request, 'repo_name', ''),
            "branch_used": getattr(request, 'branch_used', ''),
            "type": request.type,
            "created_at": request.created_at or datetime.now().isoformat(),
            "status": "active",
            "difficulty": getattr(request, 'difficulty', 'intermediate'),
            "estimated_time": getattr(request, 'estimated_time', '30-45 minutes'),
            "topics": getattr(request, 'topics', ["repository_analysis", "documentation", "code_review"]),
            "prerequisites": getattr(request, 'prerequisites', []),
            "learning_objectives": getattr(request, 'objectives', [
                "Understand the repository structure",
                "Learn from the generated documentation",
                "Apply best practices identified in the analysis"
            ])
        }
        
        # Save to database (using lessons_collection for now)
        result = await lessons_collection.insert_one(learning_module)
        
        # Check if the insert was successful
        if result and hasattr(result, 'inserted_id') and result.inserted_id:
            return {
                "success": True,
                "message": "Learning module created successfully",
                "module_id": module_id,
                "module": learning_module
            }
        else:
            return {"success": False, "message": "Failed to create learning module"}
            
    except Exception as e:
        print(f"Error creating learning module: {e}")
        return {"success": False, "message": f"Error: {str(e)}"}

@app.get("/api/learning-modules")
async def get_learning_modules():
    try:
        # Get all learning modules from the database using async cursor
        # Include both repository_analysis and cursor_ai_analysis types
        cursor = lessons_collection.find({
            "type": {"$in": ["repository_analysis", "cursor_ai_analysis", "imported_readme"]}
        })
        modules = await cursor.to_list(length=None)
        
        # Convert ObjectId to string for JSON serialization
        for module in modules:
            if "_id" in module:
                module["_id"] = str(module["_id"])
        
        return {
            "success": True,
            "modules": modules,
            "total": len(modules)
        }
        
    except Exception as e:
        print(f"Error fetching learning modules: {e}")
        return {"success": False, "message": f"Error: {str(e)}"}

@app.get("/api/learning-modules/{module_id}")
async def get_learning_module(module_id: str):
    try:
        # Get specific learning module by ID
        module = lessons_collection.find_one({"_id": module_id})
        
        if module:
            # Convert ObjectId to string for JSON serialization
            if "_id" in module:
                module["_id"] = str(module["_id"])
            return {"success": True, "module": module}
        else:
            return {"success": False, "message": "Learning module not found"}
            
    except Exception as e:
        print(f"Error fetching learning module: {e}")
        return {"success": False, "message": f"Error: {str(e)}"}

@app.delete("/api/learning-modules/{module_id}")
async def delete_learning_module(module_id: str):
    """Delete a learning module by ID"""
    try:
        # Delete the learning module from the database
        result = await lessons_collection.delete_one({"_id": module_id})
        
        if result.deleted_count > 0:
            print(f"✅ Learning module deleted successfully: {module_id}")
            return {"success": True, "message": "Learning module deleted successfully"}
        else:
            print(f"❌ Learning module not found: {module_id}")
            return {"success": False, "message": "Learning module not found"}
            
    except Exception as e:
        print(f"❌ Error deleting learning module: {e}")
        return {"success": False, "message": f"Error: {str(e)}"}

@app.get("/api/cursor-ai-docs")
async def get_cursor_ai_docs():
    """Get all Cursor AI generated documentation"""
    try:
        # Get all Cursor AI generated documents
        cursor = lessons_collection.find({
            "type": {"$in": ["cursor_ai_analysis", "imported_readme"]}
        }).sort("created_at", -1)  # Sort by newest first
        
        docs = await cursor.to_list(length=None)
        
        # Convert ObjectId to string for JSON serialization
        for doc in docs:
            if "_id" in doc:
                doc["_id"] = str(doc["_id"])
        
        return {
            "success": True,
            "docs": docs,
            "total": len(docs)
        }
        
    except Exception as e:
        print(f"Error fetching Cursor AI docs: {e}")
        return {"success": False, "message": f"Error: {str(e)}"}

@app.delete("/api/delete-cursor-ai-doc/{doc_id}")
async def delete_cursor_ai_doc(doc_id: str):
    """Delete a Cursor AI generated document"""
    try:
        from bson import ObjectId
        
        # Validate ObjectId format
        if not ObjectId.is_valid(doc_id):
            return {"success": False, "message": "Invalid document ID format"}
        
        # Convert string to ObjectId
        object_id = ObjectId(doc_id)
        
        # Find and delete the document
        result = await lessons_collection.delete_one({"_id": object_id})
        
        if result.deleted_count > 0:
            return {
                "success": True,
                "message": "Cursor AI document deleted successfully",
                "deleted_id": doc_id
            }
        else:
            return {"success": False, "message": "Document not found"}
            
    except Exception as e:
        print(f"Error deleting Cursor AI document: {e}")
        return {"success": False, "message": f"Error: {str(e)}"}

# Import README to Training Library endpoint
@app.post("/api/docs/import-from-readme")
async def import_readme_to_library(request: Request):
    """Import README.md content to the Training Library"""
    try:
        # Get request body
        body = await request.json()
        title = body.get("title", "Imported README")
        markdown = body.get("markdown", "")
        
        if not markdown.strip():
            return {"success": False, "message": "No markdown content provided"}
        
        # Create learning module from README
        learning_module = {
            "title": title,
            "content": markdown,
            "type": "imported_readme",
            "source": "cursor_ai_automation",
            "created_at": datetime.now().isoformat(),
            "user_id": "system",  # System-generated content
            "difficulty": "intermediate",
            "estimated_time": "15-30 minutes",
            "topics": ["documentation", "repository_analysis", "imported_content"],
            "prerequisites": [],
            "learning_objectives": [
                "Understand the repository structure and purpose",
                "Learn from the generated documentation",
                "Apply best practices identified in the analysis"
            ],
            "status": "active"
        }
        
        # Save to lessons collection
        result = await lessons_collection.insert_one(learning_module)
        
        if result and hasattr(result, 'inserted_id') and result.inserted_id:
            return {
                "success": True,
                "message": "README imported to Training Library successfully",
                "module_id": str(result.inserted_id),
                "title": title
            }
        else:
            return {"success": False, "message": "Failed to save to Training Library"}
            
    except Exception as e:
        print(f"Error importing README to library: {e}")
        return {"success": False, "message": f"Error: {str(e)}"}

# Simple endpoint to read the root README.md so the frontend can use it as context
@app.get("/api/readme")
async def get_root_readme():
    try:
        # Read README.md from repository root
        with open("README.md", "r", encoding="utf-8") as f:
            content = f.read()
        return {"success": True, "markdown": content}
    except FileNotFoundError:
        return {"success": False, "message": "README.md not found"}
    except Exception as e:
        return {"success": False, "message": f"Error reading README: {str(e)}"}

# Read a Markdown file from docs/ (safe, read-only)
@app.get("/api/docs/read")
async def read_docs_md(path: str):
    try:
        import os
        # Only allow files under ./docs and with .md extension
        if not path or not path.endswith(".md"):
            return {"success": False, "message": "Only .md files are allowed"}
        safe_root = os.path.abspath("docs")
        target = os.path.abspath(os.path.join(".", path))
        if not target.startswith(safe_root):
            return {"success": False, "message": "Access denied"}
        with open(target, "r", encoding="utf-8") as f:
            content = f.read()
        return {"success": True, "markdown": content, "path": path}
    except FileNotFoundError:
        return {"success": False, "message": f"File not found: {path}"}
    except Exception as e:
        return {"success": False, "message": f"Error reading file: {str(e)}"}

def calculate_user_learning_vector(mastery_scores, all_topics):
    """Calculate user's learning vector based on mastered topics"""
    user_vector = [0.0] * 10  # Assuming 10-dimensional embeddings
    
    mastered_topics = [(tid, score) for tid, score in mastery_scores.items() if score > 0.7]
    
    if not mastered_topics:
        return user_vector
    
    # Weighted average of mastered topic embeddings
    total_weight = 0
    for topic_id, mastery in mastered_topics:
        if topic_id in all_topics:
            topic_embedding = all_topics[topic_id].get("embedding", [0.0] * 10)
            weight = mastery
            for i, val in enumerate(topic_embedding):
                user_vector[i] += val * weight
            total_weight += weight
    
    # Normalize
    if total_weight > 0:
        user_vector = [v / total_weight for v in user_vector]
    
    return user_vector

def calculate_advanced_recommendation_score(topic_id, topic_data, current_mastery, mastery_scores, all_topics, user_vector):
    """Calculate advanced recommendation score using vector proximity and learning patterns"""
    
    # 1. Mastery Gap Priority (higher for lower mastery)
    mastery_gap = 1.0 - current_mastery
    mastery_priority = mastery_gap ** 2  # Quadratic scaling for stronger emphasis on gaps
    
    # 2. Vector Proximity Score
    topic_embedding = topic_data.get("embedding", [0.0] * 10)
    proximity_score = calculate_cosine_similarity(user_vector, topic_embedding)
    
    # 3. Category Importance Weights
    category_weights = {
        "AI Fundamentals": 1.3,
        "Leadership": 1.2,
        "Business Applications": 1.1,
        "Communication": 1.0,
        "Strategic Thinking": 1.2,
        "Innovation Management": 1.1
    }
    category_weight = category_weights.get(topic_data.get("category", "Other"), 1.0)
    
    # 4. Learning Path Continuity
    continuity_score = calculate_learning_continuity(topic_id, mastery_scores, all_topics)
    
    # 5. Topic Complexity Adjustment
    complexity_adjustment = 1.0 + (current_mastery * 0.2)  # Slightly favor topics at user's level
    
    # 6. Cluster Proximity Bonus
    cluster_bonus = calculate_cluster_proximity_bonus(topic_id, mastery_scores, all_topics)
    
    # Final weighted score
    recommendation_score = (
        mastery_priority * 0.35 +
        proximity_score * 0.25 +
        continuity_score * 0.20 +
        cluster_bonus * 0.15 +
        complexity_adjustment * 0.05
    ) * category_weight
    
    return {
        "topic_id": topic_id,
        "topic_name": topic_data.get("label", topic_id),
        "description": topic_data.get("description", ""),
        "category": topic_data.get("category", "Other"),
        "current_mastery": current_mastery,
        "recommendation_score": recommendation_score,
        "score_breakdown": {
            "mastery_priority": mastery_priority,
            "proximity_score": proximity_score,
            "continuity_score": continuity_score,
            "cluster_bonus": cluster_bonus,
            "category_weight": category_weight
        },
        "priority": "high" if current_mastery < 0.3 else "medium" if current_mastery < 0.6 else "low",
        "learning_difficulty": "beginner" if current_mastery < 0.2 else "intermediate" if current_mastery < 0.5 else "advanced"
    }

def calculate_cosine_similarity(vec1, vec2):
    """Calculate cosine similarity between two vectors"""
    if len(vec1) != len(vec2):
        return 0.0
    
    dot_product = sum(a * b for a, b in zip(vec1, vec2))
    norm1 = sum(a * a for a in vec1) ** 0.5
    norm2 = sum(b * b for b in vec2) ** 0.5
    
    if norm1 == 0 or norm2 == 0:
        return 0.0
    
    return dot_product / (norm1 * norm2)

def calculate_learning_continuity(topic_id, mastery_scores, all_topics):
    """Calculate how well this topic fits in the user's learning path"""
    topic_data = all_topics.get(topic_id, {})
    topic_category = topic_data.get("category", "Other")
    
    # Check if user has mastered topics in the same category
    category_mastery = []
    for tid, score in mastery_scores.items():
        if all_topics.get(tid, {}).get("category") == topic_category:
            category_mastery.append(score)
    
    if not category_mastery:
        return 0.3  # Neutral if no category experience
    
    avg_category_mastery = sum(category_mastery) / len(category_mastery)
    return min(avg_category_mastery, 1.0)

def calculate_cluster_proximity_bonus(topic_id, mastery_scores, all_topics):
    """Calculate bonus for topics near mastered topics in the same cluster"""
    topic_data = all_topics.get(topic_id, {})
    topic_cluster = topic_data.get("cluster", 0)
    
    # Find mastered topics in the same cluster
    cluster_mastered = []
    for tid, score in mastery_scores.items():
        if score > 0.7 and all_topics.get(tid, {}).get("cluster") == topic_cluster:
            cluster_mastered.append(score)
    
    if not cluster_mastered:
        return 0.0
    
    # Bonus based on number and strength of mastered topics in cluster
    cluster_strength = sum(cluster_mastered) / len(cluster_mastered)
    return cluster_strength * 0.5

def generate_learning_paths(recommendations, mastery_scores, all_topics):
    """Generate suggested learning paths based on recommendations"""
    paths = []
    
    # Path 1: Foundation First (low mastery topics)
    foundation_topics = [r for r in recommendations if r["current_mastery"] < 0.3]
    if foundation_topics:
        paths.append({
            "name": "Foundation Builder",
            "description": "Build strong fundamentals",
            "topics": foundation_topics[:3],
            "estimated_hours": len(foundation_topics) * 2
        })
    
    # Path 2: Category Deep Dive
    category_groups = {}
    for rec in recommendations:
        category = rec["category"]
        if category not in category_groups:
            category_groups[category] = []
        category_groups[category].append(rec)
    
    for category, topics in category_groups.items():
        if len(topics) >= 2:
            paths.append({
                "name": f"{category} Specialist",
                "description": f"Deep dive into {category}",
                "topics": topics[:3],
                "estimated_hours": len(topics) * 1.5
            })
    
    # Path 3: High-Impact Quick Wins
    high_impact = sorted(recommendations, key=lambda x: x["score_breakdown"]["category_weight"], reverse=True)[:3]
    paths.append({
        "name": "High-Impact Learning",
        "description": "Topics with highest business impact",
        "topics": high_impact,
        "estimated_hours": len(high_impact) * 1.5
    })
    
    return paths

def identify_proximity_clusters(recommendations):
    """Identify groups of topics that are close to each other"""
    clusters = []
    
    # Group by category first
    category_clusters = {}
    for rec in recommendations:
        category = rec["category"]
        if category not in category_clusters:
            category_clusters[category] = []
        category_clusters[category].append(rec)
    
    for category, topics in category_clusters.items():
        if len(topics) >= 2:
            clusters.append({
                "type": "category",
                "name": category,
                "topics": [t["topic_id"] for t in topics],
                "strength": len(topics)
            })
    
    return clusters 

# Include the simple web search router at the end
print("🔍 DEBUG: About to include simple_web_search_router")
print(f"🔍 DEBUG: Router object: {simple_web_search_router}")
print(f"🔍 DEBUG: Router routes: {simple_web_search_router.routes}")
app.include_router(simple_web_search_router, prefix="/api", tags=["Simple Web Search"])

# Robomind Clinic router
try:
    from backend.clinic.router import router as clinic_router
    app.include_router(clinic_router, tags=["Robomind Clinic"])
    print("✅ Robomind Clinic router included successfully")
except ImportError as e:
    print(f"❌ Failed to import Robomind Clinic router: {e}")
except Exception as e:
    print(f"❌ Error including Robomind Clinic router: {e}")

# Enhanced Robomind Clinic router
try:
    from backend.clinic.enhanced_router import router as enhanced_clinic_router
    app.include_router(enhanced_clinic_router, tags=["Enhanced Robomind Clinic"])
    print("✅ Enhanced Robomind Clinic router included successfully")
except ImportError as e:
    print(f"❌ Failed to import Enhanced Robomind Clinic router: {e}")
except Exception as e:
    print(f"❌ Error including Enhanced Robomind Clinic router: {e}")

# AI Gateway router
try:
    from backend.gateway.router import router as gateway_router
    app.include_router(gateway_router, tags=["AI Gateway"])
    print("✅ AI Gateway router included successfully")
except ImportError as e:
    print(f"❌ Failed to import AI Gateway router: {e}")
except Exception as e:
    print(f"❌ Error including AI Gateway router: {e}")

# MongoDB Authentication router
try:
    from backend.routers.auth import router as auth_router
    app.include_router(auth_router, tags=["MongoDB Authentication"])
    print("✅ MongoDB Authentication router included successfully")
except ImportError as e:
    print(f"❌ Failed to import MongoDB Authentication router: {e}")
except Exception as e:
    print(f"❌ Error including MongoDB Authentication router: {e}")

# Agent Catalog router
try:
    from backend.routers.agent_catalog import router as agent_catalog_router
    app.include_router(agent_catalog_router, tags=["Agent Catalog"])
    print("✅ Agent Catalog router included successfully")
except ImportError as e:
    print(f"❌ Failed to import Agent Catalog router: {e}")
except Exception as e:
    print(f"❌ Error including Agent Catalog router: {e}")

# AI Agent Bridge Platform routers
try:
    from backend.routers.agent_runs import router as agent_runs_router
    from backend.routers.compliance_agent import router as compliance_agent_router
    from backend.routers.productivity_agent import router as productivity_agent_router
    from backend.routers.unified_documents import router as unified_documents_router
    from backend.routers.cybersecurity import router as cybersecurity_router
    from backend.routers.agent_security import router as agent_security_router
    from backend.routers.ea_execute import router as ea_execute_router
    from backend.routers.sales_agent import router as sales_agent_router
    from backend.routers.attention_agent import router as attention_agent_router
    from backend.routers.telco_ops import router as telco_ops_router
    from backend.routers.grc_execute import router as grc_execute_router
    from backend.routers.council_execute import router as council_execute_router
    from backend.routers.opsx_execute import router as opsx_execute_router
    from backend.routers.dev_helpers import router as dev_helpers_router
    
    app.include_router(agent_runs_router, tags=["AI Agent Bridge Platform"])
    app.include_router(compliance_agent_router, tags=["AI Compliance Agent"])
    app.include_router(productivity_agent_router, tags=["AI Productivity Agent"])
    app.include_router(unified_documents_router, prefix="/api", tags=["Unified Documents"])
    app.include_router(cybersecurity_router, tags=["Cybersecurity"])
    app.include_router(agent_security_router, tags=["Agent Security"])
    app.include_router(ea_execute_router, tags=["EA Second Brain Agent"])
    app.include_router(sales_agent_router, tags=["Sales Assistant Agent"])
    app.include_router(attention_agent_router, tags=["Personal Attention Agent"])
    app.include_router(telco_ops_router, tags=["Telco Ops Decisioning Agent"])
    app.include_router(grc_execute_router, tags=["Responsible AI Ops (GRC)"])
    app.include_router(council_execute_router, tags=["Council of Diverse Lenses"])
    app.include_router(opsx_execute_router, tags=["Operations Efficiency Agent"])
    app.include_router(dev_helpers_router, tags=["Development Helpers"])
    print("✅ AI Agent Bridge Platform routers included successfully")
except ImportError as e:
    print(f"❌ Failed to import AI Agent Bridge Platform routers: {e}")
except Exception as e:
    print(f"❌ Error including AI Agent Bridge Platform routers: {e}")

# Hologram Agent router (conversational guide for the hologram portal)
try:
    from backend.routers.hologram_agent import router as hologram_agent_router
    from backend.routers.stt import router as stt_router
    app.include_router(hologram_agent_router, prefix="/api", tags=["Hologram Agent"])
    app.include_router(stt_router, prefix="/api", tags=["Speech to Text"])
    print("✅ Hologram Agent router included successfully")
except ImportError as e:
    print(f"❌ Failed to import Hologram Agent router: {e}")
except Exception as e:
    print(f"❌ Error including Hologram Agent router: {e}")

# J-messages Analyzer router
try:
    from backend.routers.j_messages_analyzer import router as j_messages_router
    app.include_router(j_messages_router, tags=["J-messages Analyzer"])
    print("✅ J-messages Analyzer router included successfully")
except ImportError as e:
    print(f"❌ Failed to import J-messages Analyzer router: {e}")
except Exception as e:
    print(f"❌ Error including J-messages Analyzer router: {e}")

# J-messages Training Pairs router (Retrospective Learning)
try:
    from backend.routers.j_messages_training import router as j_messages_training_router
    app.include_router(j_messages_training_router, tags=["J-messages Training"])
    print("✅ J-messages Training Pairs router included successfully")
except ImportError as e:
    print(f"❌ Failed to import J-messages Training router: {e}")
except Exception as e:
    print(f"❌ Error including J-messages Training router: {e}")

print("🔍 DEBUG: Router included successfully")

# Test route directly in app.py
@app.post("/api/test-direct")
async def test_direct():
    return {"message": "Direct route works!"}

# Debug: Show all registered routes
print("🔍 DEBUG: All registered routes:")
for route in app.routes:
    if hasattr(route, 'path') and hasattr(route, 'methods'):
        print(f"  {route.methods} {route.path}")
    elif hasattr(route, 'path'):
        print(f"  {route.path}")

@app.get("/api/knowledge-map/debug")
async def debug_knowledge_map():
    """Debug endpoint to check MongoDB connection and available data"""
    try:
        from backend.db import database, saved_videos_collection
        
        print("🔍 Debug: Checking MongoDB collections...")
        
        # Check micro-lessons collection
        micro_lessons_count = await micro_lessons_collection.count_documents({})
        print(f"📚 Micro-lessons count: {micro_lessons_count}")
        
        # Check videos collection
        videos_count = await saved_videos_collection.count_documents({})
        print(f"🎥 Videos count: {videos_count}")
        
        # Get sample data
        sample_micro_lessons = await micro_lessons_collection.find({}, {"topic": 1, "title": 1}).limit(3).to_list(length=None)
        sample_videos = await saved_videos_collection.find({}, {"topic": 1, "title": 1}).limit(3).to_list(length=None)
        
        debug_info = {
            "collections": {
                "micro_lessons": {
                    "count": micro_lessons_count,
                    "sample": sample_micro_lessons
                },
                "videos": {
                    "count": videos_count,
                    "sample": sample_videos
                }
            },
            "message": "MongoDB connection successful"
        }
        
        print(f"✅ Debug info: {debug_info}")
        return debug_info
        
    except Exception as e:
        print(f"❌ Debug error: {e}")
        import traceback
        traceback.print_exc()
        return {"error": str(e), "message": "MongoDB connection failed"}

@app.delete("/api/knowledge-map/clean-all")
async def clean_all_knowledge_data():
    """Temporary endpoint to clean all knowledge map data"""
    try:
        from backend.db import micro_lessons_collection, saved_videos_collection
        
        print("🧹 Cleaning all knowledge map data...")
        
        # Delete all micro-lessons
        micro_result = await micro_lessons_collection.delete_many({})
        print(f"🗑️ Deleted {micro_result.deleted_count} micro-lessons")
        
        # Delete all videos
        videos_result = await saved_videos_collection.delete_many({})
        print(f"🗑️ Deleted {videos_result.deleted_count} videos")
        
        return {
            "message": "All knowledge data cleaned successfully",
            "deleted": {
                "micro_lessons": micro_result.deleted_count,
                "videos": videos_result.deleted_count
            }
        }
        
    except Exception as e:
        print(f"❌ Clean error: {e}")
        return {"error": str(e), "message": "Failed to clean data"}

@app.get("/api/knowledge-map/debug-micro-lessons")
async def debug_micro_lessons():
    """Debug endpoint to check micro-lessons directly"""
    try:
        from backend.db import database
        
        print("🔍 Debug: Checking micro-lessons directly...")
        
        # Get all micro-lessons
        micro_lessons = await database.micro_lessons_collection.find({}).to_list(length=None)
        print(f"📚 Found {len(micro_lessons)} micro-lessons")
        
        # Extract topics
        topics = []
        for lesson in micro_lessons:
            if lesson.get("topic"):
                topics.append(lesson["topic"])
                print(f"  📝 Topic: '{lesson['topic']}' - Title: '{lesson.get('title', 'No title')}'")
            else:
                print(f"  ⚠️ No topic: {lesson.get('title', 'Unknown')}")
        
        return {
            "total_micro_lessons": len(micro_lessons),
            "topics_found": len(topics),
            "topics": topics,
            "micro_lessons": micro_lessons
        }
        
    except Exception as e:
        print(f"❌ Debug error: {e}")
        import traceback
        traceback.print_exc()
        return {"error": str(e), "message": "Failed to debug micro-lessons"}

@app.get("/api/debug/topic-comparison")
async def debug_topic_comparison():
    """Debug endpoint to compare topics between Dashboard and Knowledge Map"""
    try:
        from backend.db import micro_lessons_collection, saved_videos_collection
        from backend.knowledge_map_utils import extract_topics_from_modules
        
        print("🔍 Debug: Comparing topics between Dashboard and Knowledge Map...")
        
        # Get raw data from MongoDB (like Dashboard does)
        micro_lessons = await micro_lessons_collection.find({}).to_list(length=None)
        videos = await saved_videos_collection.find({}).to_list(length=None)
        
        # Extract topics like Dashboard does
        dashboard_topics = {}
        for lesson in micro_lessons:
            if lesson.get("topic"):
                topic = lesson["topic"]
                dashboard_topics[topic] = dashboard_topics.get(topic, 0) + 1
        
        for video in videos:
            if video.get("topic"):
                topic = video["topic"]
                dashboard_topics[topic] = dashboard_topics.get(topic, 0) + 1
        
        # Get topics like Knowledge Map does
        knowledge_map_topics = await extract_topics_from_modules()
        
        # Convert to simple format for comparison
        km_topics_simple = {topic_data["label"]: topic_data["count"] for topic_data in knowledge_map_topics.values()}
        
        comparison = {
            "dashboard_topics": {
                "count": len(dashboard_topics),
                "topics": dashboard_topics
            },
            "knowledge_map_topics": {
                "count": len(knowledge_map_topics),
                "topics": km_topics_simple
            },
            "missing_in_km": list(set(dashboard_topics.keys()) - set(km_topics_simple.keys())),
            "missing_in_dashboard": list(set(km_topics_simple.keys()) - set(dashboard_topics.keys())),
            "common_topics": list(set(dashboard_topics.keys()) & set(km_topics_simple.keys()))
        }
        
        print(f"📊 Dashboard topics: {len(dashboard_topics)}")
        print(f"🗺️ Knowledge Map topics: {len(knowledge_map_topics)}")
        print(f"❌ Missing in KM: {comparison['missing_in_km']}")
        print(f"❌ Missing in Dashboard: {comparison['missing_in_dashboard']}")
        
        return comparison
        
    except Exception as e:
        print(f"❌ Debug comparison error: {e}")
        import traceback
        traceback.print_exc()
        return {"error": str(e), "message": "Topic comparison failed"}

# Debug endpoint para verificar rutas
@app.get("/__debug/routes")
def _debug_routes():
    return [{"path": r.path, "name": getattr(r.endpoint, "__name__", "?"), "methods": list(getattr(r, "methods", []))} 
            for r in app.routes]

@app.post("/api/knowledge-map/clear-cache")
async def clear_knowledge_map_cache():
    """Clear the knowledge map cache for better performance"""
    try:
        from backend.knowledge_map_utils import clear_topic_cache
        clear_topic_cache()
        return {"message": "Knowledge map cache cleared successfully"}
    except Exception as e:
        return {"error": str(e), "message": "Failed to clear cache"}

# Health check endpoints
@app.get("/health")
async def health_check():
    return {
        "ok": True,
        "service": "wlwai-backend",
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
    }

@app.get("/api/health")
async def api_health_check():
    return {
        "ok": True,
        "service": "wlwai-backend",
        "status": "healthy",
        "message": "API is running",
        "timestamp": datetime.utcnow().isoformat(),
    }

@app.get("/ready")
async def readiness_check():
    """Readiness probe for cloud deployment (Cloud Run, K8s)"""
    checks = {
        "app_imports": True,
        "router_registration": True,
    }
    # Check MongoDB connectivity
    try:
        from backend.db import database
        await database.command("ping")
        checks["mongodb"] = True
    except Exception:
        checks["mongodb"] = False

    all_ok = all(checks.values())
    return {
        "ok": all_ok,
        "service": "wlwai-backend",
        "status": "ready" if all_ok else "degraded",
        "checks": checks,
        "timestamp": datetime.utcnow().isoformat(),
    }

 