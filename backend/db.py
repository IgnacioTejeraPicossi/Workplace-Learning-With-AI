from motor.motor_asyncio import AsyncIOMotorClient

MONGO_DETAILS = "mongodb://localhost:27017"  # Default local URI

client = AsyncIOMotorClient(MONGO_DETAILS)
database = client["ai_learning"]  # Your database name
users_collection = database.get_collection("users")  # Example collection
lessons_collection = database.get_collection("lessons")
career_coach_sessions = database.get_collection("career_coach_sessions")
skills_forecasts = database.get_collection("skills_forecasts")

# Team Management Collections
teams_collection = database.get_collection("teams")
team_members_collection = database.get_collection("team_members")
team_analytics_collection = database.get_collection("team_analytics")

# Certification Collections
certifications_collection = database.get_collection("certifications")
study_plans_collection = database.get_collection("study_plans")
certification_simulations_collection = database.get_collection("certification_simulations")

unknown_intents_collection = database.get_collection("unknown_intents")
scaffold_history_collection = database.get_collection("scaffold_history")
