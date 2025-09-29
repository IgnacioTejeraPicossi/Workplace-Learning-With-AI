#!/usr/bin/env python3
"""
Script to initialize AgentOps Studio with sample data
Includes flows, playbooks and demo runs
"""

import asyncio
import sys
import os
from datetime import datetime, timedelta
import json
import random

# Add root directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.services.agentic_rag.your_mongo import _db

def seed_agentops_data():
    """Initialize sample data for AgentOps Studio"""
    
    print("🌱 Initializing AgentOps Studio with sample data...")
    
    # Use existing connection
    db = _db
    
    # Collections
    flows_collection = db["agent_flows"]
    playbooks_collection = db["digital_playbooks"]
    runs_collection = db["agent_runs"]
    
    # Clean existing data
    print("🧹 Cleaning existing data...")
    flows_collection.delete_many({})
    playbooks_collection.delete_many({})
    runs_collection.delete_many({})
    
    # 1. CREATE SAMPLE FLOWS
    print("📋 Creating sample flows...")
    
    flows_data = [
        {
            "name": "Web Research → Report (LM Studio)",
            "description": "Research a web topic and generate a report using LM Studio",
            "webhook_url": "http://localhost:5678/webhook/web-research",
            "n8n_workflow": {
                "nodes": [
                    {
                        "id": "webhook",
                        "type": "n8n-nodes-base.webhook",
                        "parameters": {"httpMethod": "POST", "path": "web-research"}
                    },
                    {
                        "id": "web_search",
                        "type": "n8n-nodes-base.httpRequest",
                        "parameters": {"url": "https://api.example.com/search", "method": "GET"}
                    },
                    {
                        "id": "lm_studio",
                        "type": "n8n-nodes-base.httpRequest",
                        "parameters": {"url": "http://localhost:1234/v1/chat/completions", "method": "POST"}
                    }
                ],
                "connections": {
                    "webhook": {"main": [["web_search"]]},
                    "web_search": {"main": [["lm_studio"]]}
                }
            },
            "input_schema": {
                "type": "object",
                "properties": {
                    "topic": {"type": "string", "description": "Topic to research"},
                    "max_results": {"type": "number", "description": "Maximum number of results"}
                },
                "required": ["topic"]
            },
            "output_schema": {
                "type": "object",
                "properties": {
                    "report": {"type": "string", "description": "Generated report"},
                    "sources": {"type": "array", "description": "Consulted sources"}
                }
            },
            "status": "active",
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        },
        {
            "name": "Plan → Safety → Sim → Judge (Software)",
            "description": "Complete pipeline for software tasks with safety validation",
            "webhook_url": "http://localhost:5678/webhook/software-pipeline",
            "n8n_workflow": {
                "nodes": [
                    {
                        "id": "webhook",
                        "type": "n8n-nodes-base.webhook",
                        "parameters": {"httpMethod": "POST", "path": "software-pipeline"}
                    },
                    {
                        "id": "planner",
                        "type": "n8n-nodes-base.httpRequest",
                        "parameters": {"url": "http://localhost:8000/api/digital/plan", "method": "POST"}
                    },
                    {
                        "id": "safety",
                        "type": "n8n-nodes-base.httpRequest",
                        "parameters": {"url": "http://localhost:8000/api/digital/safety-check", "method": "POST"}
                    },
                    {
                        "id": "simulator",
                        "type": "n8n-nodes-base.httpRequest",
                        "parameters": {"url": "http://localhost:8000/api/digital/simulate", "method": "POST"}
                    },
                    {
                        "id": "judge",
                        "type": "n8n-nodes-base.httpRequest",
                        "parameters": {"url": "http://localhost:8000/api/digital/judge", "method": "POST"}
                    }
                ],
                "connections": {
                    "webhook": {"main": [["planner"]]},
                    "planner": {"main": [["safety"]]},
                    "safety": {"main": [["simulator"]]},
                    "simulator": {"main": [["judge"]]}
                }
            },
            "input_schema": {
                "type": "object",
                "properties": {
                    "task_spec": {"type": "object", "description": "Task specification"},
                    "software_twin": {"type": "object", "description": "Digital twin configuration"}
                },
                "required": ["task_spec", "software_twin"]
            },
            "output_schema": {
                "type": "object",
                "properties": {
                    "plan": {"type": "object", "description": "Generated plan"},
                    "safety_report": {"type": "object", "description": "Safety report"},
                    "simulation_result": {"type": "object", "description": "Simulation result"},
                    "judge_result": {"type": "object", "description": "Final evaluation"}
                }
            },
            "status": "active",
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
    ]
    
    # Insert flows
    flow_ids = []
    for flow_data in flows_data:
        result = flows_collection.insert_one(flow_data)
        flow_ids.append(str(result.inserted_id))
        print(f"  ✅ Flow created: {flow_data['name']}")
    
    # 2. CREATE SAMPLE PLAYBOOKS
    print("📚 Creating sample playbooks...")
    
    playbooks_data = [
        {
            "name": "AI Code Analysis",
            "description": "Analyze source code using AI to detect issues and suggest improvements",
            "task_spec": {
                "name": "AI Code Analysis",
                "description": "Analyze a code repository using AI techniques to detect issues, vulnerabilities and improvement opportunities",
                "actions": [
                    {
                        "id": "scan_code",
                        "name": "Scan Code",
                        "description": "Analyze code structure and patterns",
                        "type": "analysis",
                        "estimated_duration": 300
                    },
                    {
                        "id": "detect_issues",
                        "name": "Detect Issues",
                        "description": "Identify vulnerabilities and code smells",
                        "type": "detection",
                        "estimated_duration": 180
                    },
                    {
                        "id": "generate_recommendations",
                        "name": "Generate Recommendations",
                        "description": "Create improvement suggestions based on AI",
                        "type": "generation",
                        "estimated_duration": 240
                    }
                ],
                "expected_duration": 720,
                "complexity": "medium"
            },
            "software_twin": {
                "name": "Code Analyzer Twin",
                "description": "Digital twin specialized in code analysis",
                "capabilities": ["code_analysis", "security_scanning", "pattern_recognition"],
                "policies": {
                    "max_processing_time": 600,
                    "security_level": "high",
                    "data_privacy": "strict"
                },
                "resources": {
                    "cpu_cores": 4,
                    "memory_gb": 8,
                    "storage_gb": 50
                }
            },
            "status": "active",
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        },
        {
            "name": "Test Automation",
            "description": "Automate software testing using AI to generate test cases",
            "task_spec": {
                "name": "Test Automation",
                "description": "Create and execute automated tests using AI to generate comprehensive test cases",
                "actions": [
                    {
                        "id": "analyze_requirements",
                        "name": "Analyze Requirements",
                        "description": "Extract test cases from requirements",
                        "type": "analysis",
                        "estimated_duration": 200
                    },
                    {
                        "id": "generate_tests",
                        "name": "Generate Tests",
                        "description": "Create test cases using AI",
                        "type": "generation",
                        "estimated_duration": 300
                    },
                    {
                        "id": "execute_tests",
                        "name": "Execute Tests",
                        "description": "Execute the generated tests",
                        "type": "execution",
                        "estimated_duration": 400
                    }
                ],
                "expected_duration": 900,
                "complexity": "high"
            },
            "software_twin": {
                "name": "Test Automation Twin",
                "description": "Digital twin for test automation",
                "capabilities": ["test_generation", "test_execution", "coverage_analysis"],
                "policies": {
                    "max_processing_time": 1200,
                    "security_level": "medium",
                    "data_privacy": "standard"
                },
                "resources": {
                    "cpu_cores": 2,
                    "memory_gb": 4,
                    "storage_gb": 20
                }
            },
            "status": "active",
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
    ]
    
    # Insert playbooks
    playbook_ids = []
    for playbook_data in playbooks_data:
        result = playbooks_collection.insert_one(playbook_data)
        playbook_ids.append(str(result.inserted_id))
        print(f"  ✅ Playbook created: {playbook_data['name']}")
    
    # 3. CREATE SAMPLE RUNS
    print("🏃 Creating sample runs...")
    
    runs_data = []
    for i in range(5):
        # Select random flow and playbook
        flow_id = random.choice(flow_ids)
        playbook_id = random.choice(playbook_ids)
        
        # Get playbook data
        from bson import ObjectId
        playbook = playbooks_collection.find_one({"_id": ObjectId(playbook_id)})
        
        run_data = {
            "flow_id": flow_id,
            "playbook_id": playbook_id,
            "status": random.choice(["completed", "running", "failed"]),
            "input_data": {
                "topic": f"Sample analysis {i+1}",
                "task_spec": playbook["task_spec"],
                "software_twin": playbook["software_twin"]
            },
            "output_data": {
                "plan": {
                    "actions": playbook["task_spec"]["actions"],
                    "estimated_duration": playbook["task_spec"]["expected_duration"],
                    "confidence": random.uniform(0.7, 0.95)
                },
                "safety_report": {
                    "passed": random.choice([True, True, True, False]),  # 75% success rate
                    "issues": [] if random.random() > 0.25 else ["Potential data exposure risk"],
                    "score": random.uniform(0.6, 1.0)
                },
                "simulation_result": {
                    "success": random.choice([True, True, False]),  # 67% success rate
                    "kpis": {
                        "efficiency": random.uniform(0.7, 0.95),
                        "accuracy": random.uniform(0.8, 0.98),
                        "completion_time": random.uniform(0.8, 1.2)
                    }
                },
                "judge_result": {
                    "overall_score": random.uniform(0.6, 0.95),
                    "recommendations": [
                        "Consider adding more validation steps",
                        "Optimize resource allocation",
                        "Implement additional safety checks"
                    ]
                }
            },
            "started_at": datetime.now() - timedelta(hours=random.randint(1, 24)),
            "completed_at": datetime.now() - timedelta(minutes=random.randint(5, 120)) if random.random() > 0.2 else None,
            "duration_seconds": random.randint(60, 1800),
            "created_at": datetime.now() - timedelta(hours=random.randint(1, 48))
        }
        
        runs_data.append(run_data)
    
    # Insert runs
    for run_data in runs_data:
        result = runs_collection.insert_one(run_data)
        print(f"  ✅ Run created: {run_data['status']} - {run_data['input_data']['topic']}")
    
    print(f"\n🎉 Initialization completed!")
    print(f"  📋 Flows created: {len(flows_data)}")
    print(f"  📚 Playbooks created: {len(playbooks_data)}")
    print(f"  🏃 Runs created: {len(runs_data)}")
    print(f"\n💡 You can now test AgentOps Studio with real data!")

if __name__ == "__main__":
    seed_agentops_data()
