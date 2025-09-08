from fastapi import APIRouter, HTTPException, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
# Database connection
def get_ea_db():
    from backend.db import database
    return database
from backend.llm import ask_ai_unified_sync
import asyncio
from typing import List, Dict, Any
from datetime import datetime, timezone
import json

router = APIRouter(prefix="/api/ea/ai-risk", tags=["EA AI Risk Analysis"])

@router.post("/analyze-application-risk")
async def analyze_application_risk(
    data: dict,
    db: AsyncIOMotorDatabase = Depends(get_ea_db)
):
    application_id = data.get("application_id")
    if not application_id:
        raise HTTPException(status_code=400, detail="application_id is required")
    """
    Analyze application risk using AI based on multiple factors
    """
    try:
        # Get application data
        application = await db["ea_applications"].find_one({"_id": ObjectId(application_id)})
        if not application:
            raise HTTPException(status_code=404, detail="Application not found")
        
        # Get related data for comprehensive analysis
        processes = await db["ea_processes"].find({"applications": application_id}).to_list(length=None)
        capabilities = await db["ea_capabilities"].find({"applications": application_id}).to_list(length=None)
        
        # Calculate risk factors
        risk_factors = await calculate_risk_factors(application, processes, capabilities)
        
        # Generate AI risk assessment
        ai_assessment = await generate_ai_risk_assessment(application, risk_factors)
        
        # Convert ObjectId to string
        application["_id"] = str(application["_id"])
        
        return {
            "success": True,
            "application_id": application_id,
            "risk_factors": risk_factors,
            "ai_assessment": ai_assessment,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing application risk: {str(e)}")

@router.post("/analyze-portfolio-risk")
async def analyze_portfolio_risk(
    db: AsyncIOMotorDatabase = Depends(get_ea_db)
):
    """
    Analyze overall portfolio risk using AI
    """
    try:
        # Get all applications
        applications = await db["ea_applications"].find({}).to_list(length=None)
        
        # Get all processes and capabilities
        processes = await db["ea_processes"].find({}).to_list(length=None)
        capabilities = await db["ea_capabilities"].find({}).to_list(length=None)
        
        # Convert ObjectIds to strings
        for app in applications:
            app["_id"] = str(app["_id"])
        for proc in processes:
            proc["_id"] = str(proc["_id"])
        for cap in capabilities:
            cap["_id"] = str(cap["_id"])
        
        # Calculate portfolio risk metrics
        portfolio_metrics = await calculate_portfolio_risk_metrics(
            applications, processes, capabilities
        )
        
        # Generate AI portfolio assessment
        ai_portfolio_assessment = await generate_ai_portfolio_assessment(portfolio_metrics)
        
        return {
            "success": True,
            "portfolio_metrics": portfolio_metrics,
            "ai_assessment": ai_portfolio_assessment,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing portfolio risk: {str(e)}")

@router.post("/generate-risk-recommendations")
async def generate_risk_recommendations(
    risk_data: Dict[str, Any],
    db: AsyncIOMotorDatabase = Depends(get_ea_db)
):
    """
    Generate AI-powered risk mitigation recommendations
    """
    try:
        recommendations = await generate_ai_risk_recommendations(risk_data)
        
        return {
            "success": True,
            "recommendations": recommendations,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating recommendations: {str(e)}")

async def calculate_risk_factors(application: Dict, processes: List[Dict], capabilities: List[Dict]) -> Dict[str, Any]:
    """Calculate quantitative risk factors for an application"""
    
    # Calculate age-based risk
    created_date = application.get("created_date", datetime.now(timezone.utc))
    if isinstance(created_date, str):
        created_date = datetime.fromisoformat(created_date.replace('Z', '+00:00'))
    
    age_years = (datetime.now(timezone.utc) - created_date).days / 365.25
    age_risk = min(10, max(1, age_years * 0.5))  # 0.5 risk points per year, max 10
    
    # Calculate dependency risk
    dependency_risk = min(10, len(processes) * 0.8 + len(capabilities) * 0.6)
    
    # Calculate lifecycle risk
    lifecycle_risk_map = {
        "Development": 3,
        "Production": 1,
        "Maintenance": 5,
        "Retirement": 8
    }
    lifecycle_risk = lifecycle_risk_map.get(application.get("lifecycle", "Production"), 5)
    
    # Calculate maturity risk (inverse relationship)
    maturity = application.get("maturity", 3)
    maturity_risk = max(1, 6 - maturity)  # Lower maturity = higher risk
    
    # Calculate vendor risk
    vendor_risk = 2 if application.get("vendor") else 5  # No vendor = higher risk
    
    # Calculate overall risk score
    overall_risk = (age_risk + dependency_risk + lifecycle_risk + maturity_risk + vendor_risk) / 5
    
    return {
        "age_risk": round(age_risk, 2),
        "dependency_risk": round(dependency_risk, 2),
        "lifecycle_risk": lifecycle_risk,
        "maturity_risk": maturity_risk,
        "vendor_risk": vendor_risk,
        "overall_risk": round(overall_risk, 2),
        "risk_level": get_risk_level(overall_risk),
        "age_years": round(age_years, 1),
        "dependencies_count": len(processes) + len(capabilities)
    }

async def calculate_portfolio_risk_metrics(applications: List[Dict], processes: List[Dict], capabilities: List[Dict]) -> Dict[str, Any]:
    """Calculate portfolio-wide risk metrics"""
    
    total_apps = len(applications)
    total_processes = len(processes)
    total_capabilities = len(capabilities)
    
    # Calculate risk distribution
    risk_levels = {"Low": 0, "Medium": 0, "High": 0, "Critical": 0}
    
    for app in applications:
        risk_score = app.get("risk", 0)
        risk_level = get_risk_level(risk_score)
        risk_levels[risk_level] += 1
    
    # Calculate average risk scores
    avg_risk = sum(app.get("risk", 0) for app in applications) / total_apps if total_apps > 0 else 0
    
    # Calculate technology diversity risk
    technologies = set()
    for app in applications:
        if app.get("technology"):
            technologies.add(app["technology"])
    
    tech_diversity_risk = 10 - min(10, len(technologies) * 0.5)  # More diversity = lower risk
    
    return {
        "total_applications": total_apps,
        "total_processes": total_processes,
        "total_capabilities": total_capabilities,
        "risk_distribution": risk_levels,
        "average_risk_score": round(avg_risk, 2),
        "technology_diversity_risk": round(tech_diversity_risk, 2),
        "portfolio_health_score": round(max(0, 100 - avg_risk * 10), 1)
    }

async def generate_ai_risk_assessment(application: Dict, risk_factors: Dict) -> Dict[str, Any]:
    """Generate AI-powered risk assessment using OpenAI"""
    
    prompt = f"""
    Analiza el riesgo de esta aplicación empresarial y proporciona una evaluación detallada.
    
    **Información de la Aplicación:**
    - Nombre: {application.get('name', 'N/A')}
    - Descripción: {application.get('description', 'N/A')}
    - Categoría: {application.get('category', 'N/A')}
    - Ciclo de vida: {application.get('lifecycle', 'N/A')}
    - Madurez: {application.get('maturity', 'N/A')}/5
    - Proveedor: {application.get('vendor', 'N/A')}
    
    **Factores de Riesgo Calculados:**
    - Riesgo por edad: {risk_factors['age_risk']}/10 (Edad: {risk_factors['age_years']} años)
    - Riesgo por dependencias: {risk_factors['dependency_risk']}/10 ({risk_factors['dependencies_count']} dependencias)
    - Riesgo por ciclo de vida: {risk_factors['lifecycle_risk']}/10
    - Riesgo por madurez: {risk_factors['maturity_risk']}/10
    - Riesgo por proveedor: {risk_factors['vendor_risk']}/10
    - **Riesgo General: {risk_factors['overall_risk']}/10 ({risk_factors['risk_level']})**
    
    **Proporciona:**
    1. **Evaluación del Riesgo** (1-10) con justificación
    2. **Análisis de Factores Críticos** (máximo 3 puntos principales)
    3. **Recomendaciones Inmediatas** (3-5 acciones prioritarias)
    4. **Plan de Mitigación** (corto, medio y largo plazo)
    5. **Impacto en el Negocio** (bajo, medio, alto)
    
    Responde en formato JSON estructurado.
    """
    
    try:
        response = ask_ai_unified_sync(prompt, task_type="risk_analysis", complexity="high", max_tokens=1000)
        
        # Check if it's a mock response (no API key)
        if response.startswith("[MOCKED RESPONSE"):
            return {
                "risk_evaluation": "AI assessment requires API key configuration",
                "critical_factors": ["API key not configured", "Mock response generated"],
                "immediate_recommendations": [
                    "Configure OPENAI_API_KEY in .env file",
                    "Restart backend after configuration",
                    "Verify API key validity"
                ],
                "mitigation_plan": {
                    "immediate": "Add OpenAI API key to .env file",
                    "short_term": "Test API key connectivity",
                    "long_term": "Monitor API usage and costs"
                },
                "business_impact": "Medium",
                "ai_analysis": "Mock response - no real AI analysis performed"
            }
        
        # Try to parse JSON response
        try:
            ai_response = json.loads(response)
            return ai_response
        except json.JSONDecodeError:
            # If not valid JSON, return structured response
            return {
                "risk_evaluation": "AI response received but not in expected JSON format",
                "critical_factors": ["Response format error"],
                "immediate_recommendations": ["Review AI prompt structure", "Check response format"],
                "mitigation_plan": {
                    "immediate": "Review AI prompt",
                    "short_term": "Adjust prompt format",
                    "long_term": "Implement response validation"
                },
                "business_impact": "Low",
                "ai_analysis": response
            }
            
    except Exception as e:
        return {
            "risk_evaluation": f"Error generating AI assessment: {str(e)}",
            "critical_factors": ["System error", "AI service unavailable"],
            "immediate_recommendations": [
                "Check backend logs",
                "Verify OpenAI service status",
                "Review network connectivity"
            ],
            "mitigation_plan": {
                "immediate": "Check system logs",
                "short_term": "Verify external services",
                "long_term": "Implement error monitoring"
            },
            "business_impact": "High",
            "error": str(e)
        }

async def generate_ai_portfolio_assessment(portfolio_metrics: Dict) -> Dict[str, Any]:
    """Generate AI-powered portfolio risk assessment"""
    
    prompt = f"""
    Analiza el riesgo general del portafolio de aplicaciones empresariales.
    
    **Métricas del Portafolio:**
    - Total de aplicaciones: {portfolio_metrics['total_applications']}
    - Total de procesos: {portfolio_metrics['total_processes']}
    - Total de capacidades: {portfolio_metrics['total_capabilities']}
    - Distribución de riesgo: {portfolio_metrics['risk_distribution']}
    - Puntuación promedio de riesgo: {portfolio_metrics['average_risk_score']}/10
    - Riesgo de diversidad tecnológica: {portfolio_metrics['technology_diversity_risk']}/10
    - Puntuación de salud del portafolio: {portfolio_metrics['portfolio_health_score']}/100
    
    **Proporciona:**
    1. **Estado General del Portafolio** (excelente, bueno, regular, crítico)
    2. **Principales Áreas de Preocupación** (máximo 3)
    3. **Oportunidades de Mejora** (3-5 acciones)
    4. **Estrategia de Gestión de Riesgos** (recomendaciones generales)
    5. **Prioridades de Inversión** (dónde enfocar recursos)
    
    Responde en formato JSON estructurado.
    """
    
    try:
        response = ask_ai_unified_sync(prompt, task_type="portfolio_analysis", complexity="high", max_tokens=1000)
        
        # Check if it's a mock response (no API key)
        if response.startswith("[MOCKED RESPONSE"):
            return {
                "portfolio_status": "AI assessment requires API key configuration",
                "concern_areas": ["API key not configured", "Mock response generated"],
                "improvement_opportunities": [
                    "Configure OPENAI_API_KEY in .env file",
                    "Restart backend after configuration",
                    "Verify API key validity"
                ],
                "risk_management_strategy": "Implement proper AI integration for enhanced risk analysis",
                "investment_priorities": ["AI infrastructure", "API key management", "Error monitoring"],
                "ai_analysis": "Mock response - no real AI analysis performed"
            }
        
        try:
            ai_response = json.loads(response)
            return ai_response
        except json.JSONDecodeError:
            return {
                "portfolio_status": "AI response received but not in expected JSON format",
                "concern_areas": ["Response format error"],
                "improvement_opportunities": ["Review AI prompt structure", "Check response format"],
                "risk_management_strategy": "Implement response validation and error handling",
                "investment_priorities": ["AI prompt optimization", "Response validation"],
                "ai_analysis": response
            }
            
    except Exception as e:
        return {
            "portfolio_status": f"Error generating AI assessment: {str(e)}",
            "concern_areas": ["System error", "AI service unavailable"],
            "improvement_opportunities": [
                "Check backend logs",
                "Verify OpenAI service status",
                "Review network connectivity"
            ],
            "risk_management_strategy": "Implement comprehensive error monitoring and fallback systems",
            "investment_priorities": ["Error monitoring", "System reliability", "AI service integration"],
            "error": str(e)
        }

async def generate_ai_risk_recommendations(risk_data: Dict) -> Dict[str, Any]:
    """Generate AI-powered risk mitigation recommendations"""
    
    prompt = f"""
    Basándote en estos datos de riesgo, genera recomendaciones específicas para mitigar el riesgo.
    
    **Datos de Riesgo:**
    {json.dumps(risk_data, indent=2, ensure_ascii=False)}
    
    **Proporciona:**
    1. **Recomendaciones Técnicas** (3-5 acciones específicas)
    2. **Recomendaciones de Proceso** (3-5 mejoras de workflow)
    3. **Recomendaciones de Gobernanza** (3-5 políticas o controles)
    4. **Timeline de Implementación** (inmediato, 30 días, 90 días, 6 meses)
    5. **Estimación de Costos** (bajo, medio, alto)
    6. **ROI Esperado** (beneficios vs. costos)
    
    Responde en formato JSON estructurado.
    """
    
    try:
        response = ask_ai_unified_sync(prompt, task_type="recommendations", complexity="high", max_tokens=1000)
        
        # Check if it's a mock response (no API key)
        if response.startswith("[MOCKED RESPONSE"):
            return {
                "technical_recommendations": [
                    "Configure OpenAI API key in .env file",
                    "Implement proper error handling",
                    "Add API key validation"
                ],
                "process_recommendations": [
                    "Establish API key management process",
                    "Create configuration documentation",
                    "Implement fallback mechanisms"
                ],
                "governance_recommendations": [
                    "Define API key access policies",
                    "Implement key rotation procedures",
                    "Monitor API usage and costs"
                ],
                "implementation_timeline": {
                    "immediate": "Add API key to .env file",
                    "30_days": "Test API connectivity",
                    "90_days": "Implement monitoring",
                    "6_months": "Optimize AI prompts"
                },
                "cost_estimation": "Low",
                "expected_roi": "High - enables full AI functionality",
                "ai_analysis": "Mock response - no real AI analysis performed"
            }
        
        try:
            ai_response = json.loads(response)
            return ai_response
        except json.JSONDecodeError:
            return {
                "technical_recommendations": [
                    "Review AI prompt structure",
                    "Implement response validation",
                    "Add error handling for malformed responses"
                ],
                "process_recommendations": [
                    "Standardize prompt format",
                    "Create response templates",
                    "Implement quality checks"
                ],
                "governance_recommendations": [
                    "Define response quality standards",
                    "Establish prompt review process",
                    "Implement response monitoring"
                ],
                "implementation_timeline": {
                    "immediate": "Review current prompts",
                    "30_days": "Implement validation",
                    "90_days": "Add quality monitoring",
                    "6_months": "Optimize response handling"
                },
                "cost_estimation": "Medium",
                "expected_roi": "Medium - improves reliability",
                "ai_analysis": response
            }
            
    except Exception as e:
        return {
            "technical_recommendations": [
                "Check backend logs for errors",
                "Verify OpenAI service status",
                "Review network connectivity"
            ],
            "process_recommendations": [
                "Implement comprehensive error logging",
                "Create error monitoring dashboard",
                "Establish incident response procedures"
            ],
            "governance_recommendations": [
                "Define error handling policies",
                "Implement system health monitoring",
                "Create disaster recovery plans"
            ],
            "implementation_timeline": {
                "immediate": "Check system logs",
                "30_days": "Implement monitoring",
                "90_days": "Add alerting",
                "6_months": "Create recovery procedures"
            },
            "cost_estimation": "High",
            "expected_roi": "Critical - ensures system reliability",
            "error": str(e)
        }

def get_risk_level(risk_score: float) -> str:
    """Convert risk score to risk level"""
    if risk_score <= 2.5:
        return "Low"
    elif risk_score <= 5.0:
        return "Medium"
    elif risk_score <= 7.5:
        return "High"
    else:
        return "Critical"
