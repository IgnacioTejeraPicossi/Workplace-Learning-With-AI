#!/usr/bin/env python3
"""
Script para inicializar AgentOps Studio con datos de ejemplo
Incluye flows, playbooks y runs de demostración
"""

import asyncio
import sys
import os
from datetime import datetime, timedelta
import json
import random

# Agregar el directorio raíz al path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.services.agentic_rag.your_mongo import _db

def seed_agentops_data():
    """Inicializar datos de ejemplo para AgentOps Studio"""
    
    print("🌱 Inicializando AgentOps Studio con datos de ejemplo...")
    
    # Usar la conexión existente
    db = _db
    
    # Colecciones
    flows_collection = db["agent_flows"]
    playbooks_collection = db["digital_playbooks"]
    runs_collection = db["agent_runs"]
    
    # Limpiar datos existentes
    print("🧹 Limpiando datos existentes...")
    flows_collection.delete_many({})
    playbooks_collection.delete_many({})
    runs_collection.delete_many({})
    
    # 1. CREAR FLOWS DE EJEMPLO
    print("📋 Creando flows de ejemplo...")
    
    flows_data = [
        {
            "name": "Web Research → Report (LM Studio)",
            "description": "Investiga un tema web y genera un reporte usando LM Studio",
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
                    "topic": {"type": "string", "description": "Tema a investigar"},
                    "max_results": {"type": "number", "description": "Máximo número de resultados"}
                },
                "required": ["topic"]
            },
            "output_schema": {
                "type": "object",
                "properties": {
                    "report": {"type": "string", "description": "Reporte generado"},
                    "sources": {"type": "array", "description": "Fuentes consultadas"}
                }
            },
            "status": "active",
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        },
        {
            "name": "Plan → Safety → Sim → Judge (Software)",
            "description": "Pipeline completo para tareas de software con validación de seguridad",
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
                    "task_spec": {"type": "object", "description": "Especificación de la tarea"},
                    "software_twin": {"type": "object", "description": "Configuración del gemelo digital"}
                },
                "required": ["task_spec", "software_twin"]
            },
            "output_schema": {
                "type": "object",
                "properties": {
                    "plan": {"type": "object", "description": "Plan generado"},
                    "safety_report": {"type": "object", "description": "Reporte de seguridad"},
                    "simulation_result": {"type": "object", "description": "Resultado de simulación"},
                    "judge_result": {"type": "object", "description": "Evaluación final"}
                }
            },
            "status": "active",
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
    ]
    
    # Insertar flows
    flow_ids = []
    for flow_data in flows_data:
        result = flows_collection.insert_one(flow_data)
        flow_ids.append(str(result.inserted_id))
        print(f"  ✅ Flow creado: {flow_data['name']}")
    
    # 2. CREAR PLAYBOOKS DE EJEMPLO
    print("📚 Creando playbooks de ejemplo...")
    
    playbooks_data = [
        {
            "name": "Análisis de Código con IA",
            "description": "Analizar código fuente usando IA para detectar problemas y sugerir mejoras",
            "task_spec": {
                "name": "Análisis de Código con IA",
                "description": "Analizar un repositorio de código usando técnicas de IA para detectar problemas, vulnerabilidades y oportunidades de mejora",
                "actions": [
                    {
                        "id": "scan_code",
                        "name": "Escanear Código",
                        "description": "Analizar estructura y patrones del código",
                        "type": "analysis",
                        "estimated_duration": 300
                    },
                    {
                        "id": "detect_issues",
                        "name": "Detectar Problemas",
                        "description": "Identificar vulnerabilidades y code smells",
                        "type": "detection",
                        "estimated_duration": 180
                    },
                    {
                        "id": "generate_recommendations",
                        "name": "Generar Recomendaciones",
                        "description": "Crear sugerencias de mejora basadas en IA",
                        "type": "generation",
                        "estimated_duration": 240
                    }
                ],
                "expected_duration": 720,
                "complexity": "medium"
            },
            "software_twin": {
                "name": "Code Analyzer Twin",
                "description": "Gemelo digital especializado en análisis de código",
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
            "name": "Automatización de Testing",
            "description": "Automatizar pruebas de software usando IA para generar casos de prueba",
            "task_spec": {
                "name": "Automatización de Testing",
                "description": "Crear y ejecutar pruebas automatizadas usando IA para generar casos de prueba comprehensivos",
                "actions": [
                    {
                        "id": "analyze_requirements",
                        "name": "Analizar Requisitos",
                        "description": "Extraer casos de prueba de los requisitos",
                        "type": "analysis",
                        "estimated_duration": 200
                    },
                    {
                        "id": "generate_tests",
                        "name": "Generar Pruebas",
                        "description": "Crear casos de prueba usando IA",
                        "type": "generation",
                        "estimated_duration": 300
                    },
                    {
                        "id": "execute_tests",
                        "name": "Ejecutar Pruebas",
                        "description": "Ejecutar las pruebas generadas",
                        "type": "execution",
                        "estimated_duration": 400
                    }
                ],
                "expected_duration": 900,
                "complexity": "high"
            },
            "software_twin": {
                "name": "Test Automation Twin",
                "description": "Gemelo digital para automatización de pruebas",
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
    
    # Insertar playbooks
    playbook_ids = []
    for playbook_data in playbooks_data:
        result = playbooks_collection.insert_one(playbook_data)
        playbook_ids.append(str(result.inserted_id))
        print(f"  ✅ Playbook creado: {playbook_data['name']}")
    
    # 3. CREAR RUNS DE EJEMPLO
    print("🏃 Creando runs de ejemplo...")
    
    runs_data = []
    for i in range(5):
        # Seleccionar flow y playbook aleatorios
        flow_id = random.choice(flow_ids)
        playbook_id = random.choice(playbook_ids)
        
        # Obtener datos del playbook
        from bson import ObjectId
        playbook = playbooks_collection.find_one({"_id": ObjectId(playbook_id)})
        
        run_data = {
            "flow_id": flow_id,
            "playbook_id": playbook_id,
            "status": random.choice(["completed", "running", "failed"]),
            "input_data": {
                "topic": f"Ejemplo de análisis {i+1}",
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
    
    # Insertar runs
    for run_data in runs_data:
        result = runs_collection.insert_one(run_data)
        print(f"  ✅ Run creado: {run_data['status']} - {run_data['input_data']['topic']}")
    
    print(f"\n🎉 ¡Inicialización completada!")
    print(f"  📋 Flows creados: {len(flows_data)}")
    print(f"  📚 Playbooks creados: {len(playbooks_data)}")
    print(f"  🏃 Runs creados: {len(runs_data)}")
    print(f"\n💡 Ahora puedes probar AgentOps Studio con datos reales!")

if __name__ == "__main__":
    seed_agentops_data()
