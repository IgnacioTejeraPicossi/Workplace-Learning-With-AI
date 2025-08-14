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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Add both!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include new routers
app.include_router(repo_router, prefix="/api", tags=["Repository Analysis"])
app.include_router(doc_router, prefix="/api", tags=["Documentation Generation"])
app.include_router(cursor_readme_router, prefix="/api", tags=["Cursor AI README Generator"])
app.include_router(cursor_agent_router, prefix="/api", tags=["Cursor Agent"])

# Enterprise Architecture routers
from backend.ea_processes import router as ea_processes_router
from backend.ea_catalog import router as ea_catalog_router

app.include_router(ea_processes_router)
app.include_router(ea_catalog_router)

import os
from fastapi.staticfiles import StaticFiles

static_dir = os.path.join(os.path.dirname(__file__), "static")
app.mount("/static", StaticFiles(directory=static_dir), name="static")

from fastapi.responses import FileResponse
from fastapi.responses import StreamingResponse
from backend.llm import ask_openai_stream

@app.get("/favicon.ico")
async def favicon():
    favicon_path = os.path.join(os.path.dirname(__file__), "static", "favicon.ico")
    return FileResponse(favicon_path)

def verify_token(request: Request):
    """Verify Firebase authentication token"""
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
        
        # Verify the token with Firebase
        decoded_token = firebase_auth.verify_id_token(token)
        
        # Return user information
        return {
            "uid": decoded_token["uid"],
            "sub": decoded_token["uid"],
            "email": decoded_token.get("email", ""),
            "name": decoded_token.get("name", ""),
            "picture": decoded_token.get("picture", "")
        }
    except Exception as e:
        print(f"❌ Firebase token verification failed: {e}")
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
async def generate_concepts(user=Depends(verify_token)):
    """Generate AI-based workplace learning concepts."""
    result = ask_openai(CONCEPT_PROMPT)
    return {"concepts": result}

def generate_micro_lesson(topic: str) -> str:
    prompt = f"Write a concise, practical micro-lesson for the following workplace topic: {topic}"
    return ask_openai(prompt)

@app.post("/micro-lesson")
async def micro_lesson(request: Request, user=Depends(verify_token)):
    data = await request.json()
    topic = data.get("topic", "default topic")
    lesson_text = data.get("lesson")
    if not lesson_text:
        lesson_text = generate_micro_lesson(topic)
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
async def generate_simulation(user=Depends(verify_token)):
    """Generate a customer conversation simulation."""
    result = ask_openai(SIMULATION_PROMPT)
    return {"simulation": result}

@app.post("/recommendation")
async def generate_recommendation(request: RecommendationRequest, user=Depends(verify_token)):
    prompt = RECOMMENDATION_PROMPT.replace("{skill_gap}", request.skill_gap)
    result = ask_openai(prompt)
    return {"recommendation": result}

@app.post("/simulation-step")
async def simulation_step(request: SimulationRequest, user=Depends(verify_token)):
    # Build conversation history as text
    history_text = ""
    for turn in request.history:
        if not isinstance(turn, dict) or 'speaker' not in turn or 'text' not in turn:
            print("Malformed turn in history:", turn)
            continue  # or raise an error, or handle as needed
        history_text += f"{turn['speaker']}: {turn['text']}\n"
        if 'user_choice' in turn:
            history_text += f"Employee: {turn['user_choice']}\n"
    prompt = (
        f"{SIMULATION_PROMPT}\n"
        f"Conversation so far:\n{history_text}\n"
        f"Employee's next response: {request.user_input}\n"
        "Continue the scenario."
    )
    result = ask_openai(prompt)
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
    result = ask_openai(messages=messages)
    
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
    result = ask_openai(prompt)
    
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
async def generate_team_analytics(team_id: str, request: TeamAnalyticsRequest, user=Depends(verify_token)):
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
        "metrics": request.metrics
    }
    
    # Generate AI analysis
    analysis_prompt = f"""
    Analyze the following team data and provide insights on the requested metrics:
    
    Team: {team_data['team_name']}
    Description: {team_data['team_description']}
    
    Team Members:
    {chr(10).join([f"- {m['name']} ({m['role']}): Skills: {', '.join(m['skills'])}" for m in members])}
    
    Requested Metrics: {', '.join(request.metrics)}
    
    Please provide:
    1. Overall team assessment
    2. Individual member analysis
    3. Recommendations for improvement
    4. Collaboration insights
    """
    
    analysis_result = ask_openai(analysis_prompt)
    
    # Save analytics
    analytics_doc = {
        "team_id": team_id,
        "user_id": user["uid"],
        "metrics": request.metrics,
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
async def recommend_certifications(request: CertificationProfile, user=Depends(verify_token)):
    """Generate AI-powered certification recommendations based on user profile."""
    prompt = CERTIFICATION_RECOMMENDATION_PROMPT.format(
        role=request.role,
        skills=", ".join(request.skills),
        goals=request.goals,
        experience_level=request.experience_level
    )
    
    result = ask_openai(prompt)
    
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
async def generate_study_plan(request: CertificationStudyPlan, user=Depends(verify_token)):
    """Generate a personalized study plan for a specific certification."""
    prompt = CERTIFICATION_STUDY_PLAN_PROMPT.format(
        certification_name=request.certification_name,
        current_skills=", ".join(request.current_skills),
        study_time=request.study_time,
        target_date=request.target_date
    )
    
    result = ask_openai(prompt)
    
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
async def certification_simulation(request: CertificationSimulation, user=Depends(verify_token)):
    """Generate certification interview simulation."""
    prompt = CERTIFICATION_SIMULATION_PROMPT.format(
        certification_name=request.certification_name
    )
    
    result = ask_openai(prompt)
    
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
async def llm_stream(request: LLMStreamRequest):
    print(f"[LLM STREAM] New request: {request}", flush=True)
    def event_stream():
        for chunk in ask_openai_stream(
            prompt=request.prompt,
            task_type=request.task_type,  # Use new parameter
            complexity=request.complexity,   # Use new parameter
            max_tokens=request.max_tokens,
            messages=request.messages
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
        result = ask_openai(prompt)
        
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
    summary = ask_openai(prompt)
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
    """Get all available knowledge topics with their embeddings and metadata"""
    topics = {
        "prompt_engineering": {
            "id": "prompt_engineering",
            "label": "Prompt Engineering",
            "description": "Master the art of crafting effective AI prompts for optimal results",
            "embedding": [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
            "category": "AI Fundamentals"
        },
        "ai_ethics": {
            "id": "ai_ethics",
            "label": "AI Ethics",
            "description": "Understanding ethical considerations and responsible AI development",
            "embedding": [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 0.1],
            "category": "AI Fundamentals"
        },
        "machine_learning": {
            "id": "machine_learning",
            "label": "Machine Learning",
            "description": "Learn the fundamentals of ML algorithms and data-driven decision making",
            "embedding": [0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 0.1, 0.2],
            "category": "AI Fundamentals"
        },
        "team_leadership": {
            "id": "team_leadership",
            "label": "Team Leadership",
            "description": "Develop skills to lead and motivate teams effectively",
            "embedding": [0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 0.1, 0.2, 0.3],
            "category": "Leadership"
        },
        "project_management": {
            "id": "project_management",
            "label": "Project Management",
            "description": "Master project planning, execution, and delivery methodologies",
            "embedding": [0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 0.1, 0.2, 0.3, 0.4],
            "category": "Business Applications"
        },
        "customer_service": {
            "id": "customer_service",
            "label": "Customer Service",
            "description": "Excel in customer interactions and satisfaction management",
            "embedding": [0.6, 0.7, 0.8, 0.9, 1.0, 0.1, 0.2, 0.3, 0.4, 0.5],
            "category": "Business Applications"
        },
        "sales_negotiation": {
            "id": "sales_negotiation",
            "label": "Sales & Negotiation",
            "description": "Master sales techniques and negotiation strategies",
            "embedding": [0.7, 0.8, 0.9, 1.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6],
            "category": "Business Applications"
        },
        "conflict_resolution": {
            "id": "conflict_resolution",
            "label": "Conflict Resolution",
            "description": "Learn to resolve workplace conflicts and build consensus",
            "embedding": [0.8, 0.9, 1.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7],
            "category": "Leadership"
        },
        "presentation_skills": {
            "id": "presentation_skills",
            "label": "Presentation Skills",
            "description": "Deliver compelling presentations and public speaking",
            "embedding": [0.9, 1.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8],
            "category": "Communication"
        },
        "data_analysis": {
            "id": "data_analysis",
            "label": "Data Analysis",
            "description": "Analyze data to drive business insights and decisions",
            "embedding": [1.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9],
            "category": "AI Fundamentals"
        },
        "communication": {
            "id": "communication",
            "label": "Communication",
            "description": "Master effective communication in professional settings",
            "embedding": [0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85, 0.95, 0.05],
            "category": "Communication"
        },
        "strategic_thinking": {
            "id": "strategic_thinking",
            "label": "Strategic Thinking",
            "description": "Develop long-term strategic planning and decision-making skills",
            "embedding": [0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85, 0.95, 0.05, 0.15],
            "category": "Leadership"
        },
        "innovation_management": {
            "id": "innovation_management",
            "label": "Innovation Management",
            "description": "Lead innovation initiatives and creative problem-solving",
            "embedding": [0.35, 0.45, 0.55, 0.65, 0.75, 0.85, 0.95, 0.05, 0.15, 0.25],
            "category": "Business Applications"
        }
    }
    
    return {"topics": topics}

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
    """Get knowledge topic clusters for visualization"""
    clusters = {
        "AI Fundamentals": [
            "prompt_engineering", 
            "ai_ethics", 
            "machine_learning", 
            "data_analysis"
        ],
        "Leadership": [
            "team_leadership", 
            "conflict_resolution", 
            "strategic_thinking"
        ],
        "Business Applications": [
            "project_management", 
            "customer_service", 
            "sales_negotiation", 
            "innovation_management"
        ],
        "Communication": [
            "presentation_skills", 
            "communication"
        ]
    }
    
    return {"clusters": clusters}

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

# Saved Videos endpoints
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
    """Get advanced vector-based learning recommendations with proximity analysis"""
    try:
        # Get user's current mastery scores
        user_response = await get_user_knowledge_map(user_id)
        mastery_scores = user_response.get("mastery_scores", {})
        
        # Get all available topics with embeddings
        topics_response = await get_knowledge_topics()
        all_topics = topics_response.get("topics", {})
        
        # Advanced recommendation calculation
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
        cursor = lessons_collection.find({"type": "repository_analysis"})
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