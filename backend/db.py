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

# AI Learning & Training — per-user progress + quiz history (1.30.0). Replaces
# the previous localStorage-only storage so a user's course progress and quiz
# results survive across devices and browsers. One document per user
# (`user_id`), with a `progress` map (lessonId → {section, quizCompleted}) and a
# capped `quiz_results` list.
ai_training_progress_collection = database.get_collection("ai_training_progress")

# Scenario Simulator — per-user interactive-run progress (1.30.5). Replaces the
# previous localStorage-only "Save/Load Progress" so an in-progress simulation
# survives across devices and browsers. One document per user (`user_id`) with a
# `progress` object (scenario_type, current_step, selected_option, ...).
simulation_progress_collection = database.get_collection("simulation_progress")

# Andrés the Robot — developmental AI companion (V0, 2026-08). One document per
# user for the profile; the rest hold the growing biography (memory, reflections,
# skills, projects, evolution, safety events). See docs/andres-robot-plan.md.
andres_profiles = database.get_collection("andres_profiles")
andres_identity_versions = database.get_collection("andres_identity_versions")
andres_conversations = database.get_collection("andres_conversations")
andres_memories = database.get_collection("andres_memories")
andres_memory_links = database.get_collection("andres_memory_links")
andres_reflections = database.get_collection("andres_reflections")
andres_curiosity_queue = database.get_collection("andres_curiosity_queue")
andres_skills = database.get_collection("andres_skills")
andres_skill_runs = database.get_collection("andres_skill_runs")
andres_projects = database.get_collection("andres_projects")
andres_creative_artifacts = database.get_collection("andres_creative_artifacts")
andres_evolution_proposals = database.get_collection("andres_evolution_proposals")
andres_feedback = database.get_collection("andres_feedback")
andres_development_metrics = database.get_collection("andres_development_metrics")
andres_safety_events = database.get_collection("andres_safety_events")
andres_development_suggestions = database.get_collection("andres_development_suggestions")
andres_curriculum_modules = database.get_collection("andres_curriculum_modules")

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
# Phase H+ (1.15.8, 2026-05-28) — persistence layer for the 5 in-memory baselines
# (_GRAPHQL_BASELINES, _PERF_HOT_QUERY_BASELINES, _DS_COMPLIANCE_BASELINES,
# _ROLE_MATRIX_BASELINES, _RESILIENCE_BASELINES). Single collection with
# `baseline_type` discriminator field; `_id` = "{type}::{key}" for upsert.
red_cross_qa_baselines_collection = database.get_collection("red_cross_qa_baselines")

# Homo Sapiens vs. KI i Test — Prompt Evolution (Phase E)
# Versioned system-prompt revisions for the workshop challenges, with
# human-in-the-loop approval, regression harness output and full audit trail.
# The collections are intentionally separate (not folded into `prompts`) so
# the workshop module remains independent and easy to wipe between sessions.
homo_vs_ai_prompt_revisions_collection = database.get_collection("homo_vs_ai_prompt_revisions")
homo_vs_ai_prompt_audit_collection = database.get_collection("homo_vs_ai_prompt_audit")

# Option A — Log-only feedback (1.15.1, 2026-05-22). Persists every human
# feedback note the workshop host writes, independent of whether it triggers
# an Option B re-run or an Option C prompt-revision proposal. Used for
# post-workshop analysis: which tasks attract the most critique, what
# wording patterns recur, etc. Each document carries the task code, the
# raw text, an ISO timestamp, the actor (workshop-host by default), the
# context (free-text — e.g. "ephemeral-rerun" / "manual-note" / "proposal-trigger")
# and a deterministic `entry_id` so duplicate-entry guards are possible.
homo_vs_ai_feedback_log_collection = database.get_collection("homo_vs_ai_feedback_log")

# QA Security & Privacy (Phase H / Pack 2) — backend-driven workbench for
# the Sikkerhet og personvern tab. Three collections:
#   • qa_security_scans     — one document per scan run (pass/warn/fail counts,
#                              full snapshot of checks + findings, environment)
#   • qa_security_findings  — one document per actionable finding with owner,
#                              status (open / accepted_risk / fixed / verified),
#                              evidence, recommendation, severity, createdAt
#   • qa_security_dpia      — one document with the structured DPIA form
#                              (purpose, dataTypes, sensitiveData, storage,
#                              retention, third parties, legal basis, mitigations)
qa_security_scans_collection = database.get_collection("qa_security_scans")
qa_security_findings_collection = database.get_collection("qa_security_findings")
qa_security_dpia_collection = database.get_collection("qa_security_dpia")

# Cybersecurity module (1.24.1) — persistence for the two in-memory stores that
# previously reset on every backend restart/hot-reload:
#   • cyber_compliance_status — one doc per control override; `_id` =
#     "{framework}:{control_id}" for upsert. The 22-control seed stays in code;
#     Mongo only stores user edits, merged over the seed on first access.
#   • cyber_drill_history    — one doc per COMPLETED drill session (`_id` =
#     session id). Active sessions remain in memory (they are transient).
# All access is best-effort with short timeouts: with Mongo down the module
# still works fully from the in-memory seed (CI-safe).
cyber_compliance_collection = database.get_collection("cyber_compliance_status")
cyber_drill_history_collection = database.get_collection("cyber_drill_history")