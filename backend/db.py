import os
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_DETAILS = os.getenv('MONGO_URI', 'mongodb://localhost:27017')

client = AsyncIOMotorClient(MONGO_DETAILS)
database = client["ai_learning"]  # Your database name
users_collection = database.get_collection("users")  # Example collection

# TODO: all user-specific collections should be retrieved from a user-specific db
lessons_collection = database.get_collection("lessons")
career_coach_sessions = database.get_collection("career_coach_sessions")
skills_forecasts = database.get_collection("skills_forecasts")

# Team Management Collections
teams_collection = database.get_collection("teams")
team_members_collection = database.get_collection("team_members")
team_analytics_collection = database.get_collection("team_analytics")

# Certification Collections
certifications_collection = database.get_collection("certifications")
micro_lessons_collection = database.get_collection("micro_lessons")
study_plans_collection = database.get_collection("study_plans")
certification_simulations_collection = database.get_collection("certification_simulations")

unknown_intents_collection = database.get_collection("unknown_intents")
scaffold_history_collection = database.get_collection("scaffold_history")

# Video Collections
saved_videos_collection = database.get_collection("saved_videos")

# Document Analysis Collections
document_analyses_collection = database.get_collection("document_analyses")

# Repository Analysis Collections
repo_analyses_collection = database.get_collection("repo_analyses")
repo_documentation_collection = database.get_collection("repo_documentation")
repo_quizzes_collection = database.get_collection("repo_quizzes")
repo_learning_paths_collection = database.get_collection("repo_learning_paths")

# Collections
applications_collection = database.get_collection("ea_applications")
micro_lessons_collection = database.get_collection("micro_lessons")
certifications_collection = database.get_collection("certifications")
web_search_collection = database.get_collection("web_search")
skills_forecast_collection = database.get_collection("skills_forecasts")  # CORRECTED: Use consistent name
career_coach_collection = database.get_collection("career_coach")
simulation_results_collection = database.get_collection("simulation_results")
