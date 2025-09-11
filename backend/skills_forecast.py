from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
from bson import ObjectId
from typing import List, Optional
from db import database

skills_forecast_router = APIRouter(prefix='/api/skills-forecast', tags=['skills-forecast'])

@skills_forecast_router.get('/test')
async def test_endpoint():
    return {"message": "Skills Forecast API is working"}

@skills_forecast_router.get('/health')
async def health_check():
    try:
        # Test database connection
        await database.skills_forecast_collection.find_one()
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return {"status": "error", "database": "disconnected", "error": str(e)}

class SkillsForecastCreate(BaseModel):
    title: str
    description: str
    skills: List[str]
    industry: str
    timeframe: str
    confidence_level: str
    analysis: str

class SkillsForecastResponse(BaseModel):
    id: str
    title: str
    description: str
    skills: List[str]
    industry: str
    timeframe: str
    confidence_level: str
    analysis: str
    created_at: str

@skills_forecast_router.post('/', response_model=SkillsForecastResponse)
async def create_skills_forecast(forecast: SkillsForecastCreate):
    forecast_data = forecast.dict()
    forecast_data['created_at'] = datetime.now().isoformat()
    
    db_result = await database.skills_forecast_collection.insert_one(forecast_data)
    
    return SkillsForecastResponse(
        id=str(db_result.inserted_id),
        **forecast_data
    )

@skills_forecast_router.get('/')
async def get_skills_forecasts():
    try:
        forecasts = []
        cursor = database.skills_forecast_collection.find()
        
        async for doc in cursor:
            doc['id'] = str(doc['_id'])
            del doc['_id']
            forecasts.append(doc)
        
        return forecasts
    except Exception as e:
        print(f"Error in get_skills_forecasts: {e}")
        # Return empty list instead of raising exception for better UX
        return []

@skills_forecast_router.delete('/{forecast_id}')
async def delete_skills_forecast(forecast_id: str):
    try:
        # Validate ObjectId format
        if not ObjectId.is_valid(forecast_id):
            raise HTTPException(status_code=400, detail='Invalid forecast ID format')
            
        result = await database.skills_forecast_collection.delete_one({'_id': ObjectId(forecast_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail='Skills forecast not found')
        return {'message': 'Skills forecast deleted successfully'}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in delete_skills_forecast: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
