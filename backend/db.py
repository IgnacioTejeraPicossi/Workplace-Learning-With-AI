import os
from motor.motor_asyncio import AsyncIOMotorClient

# Support cloud MongoDB via MONGO_URI env var; fallback to local
MONGO_DETAILS = os.getenv("MONGO_URI") or os.getenv("MONGO_DETAILS", "mongodb://localhost:27017")

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

# Prompts Collection
prompts_collection = database.get_collection("prompts")

# Security Telemetry Collections
security_events_collection = database.get_collection("security_events")
agent_security_status_collection = database.get_collection("agent_security_status")

# Babel Library AI Metadata
babel_ai_metadata_collection = database.get_collection("babel_ai_metadata")

# Learning Profiles (Phase 2)
learning_profiles_collection = database.get_collection("learning_profiles")

# ATM V&V Test Copilot Collections
atm_requirement_bundles_collection = database.get_collection("atm_requirement_bundles")
atm_test_designs_collection = database.get_collection("atm_test_designs")
atm_scenario_matrices_collection = database.get_collection("atm_scenario_matrices")
atm_test_runs_collection = database.get_collection("atm_test_runs")

# EA Second Brain Agent Collections
ea_portfolio_items_collection = database.get_collection("ea_portfolio_items")
ea_watchlists_collection = database.get_collection("ea_watchlists")
ea_source_feeds_collection = database.get_collection("ea_source_feeds")
ea_insights_collection = database.get_collection("ea_insights")

# Red Cross Web QA Agent Collections (Agent #9)
red_cross_qa_runs_collection = database.get_collection("red_cross_qa_runs")
red_cross_qa_findings_collection = database.get_collection("red_cross_qa_findings")
red_cross_qa_test_cases_collection = database.get_collection("red_cross_qa_test_cases")
red_cross_qa_generated_scripts_collection = database.get_collection("red_cross_qa_generated_scripts")
red_cross_qa_jira_dispatches_collection = database.get_collection("red_cross_qa_jira_dispatches")
red_cross_qa_settings_collection = database.get_collection("red_cross_qa_settings")
red_cross_qa_reports_collection = database.get_collection("red_cross_qa_reports")