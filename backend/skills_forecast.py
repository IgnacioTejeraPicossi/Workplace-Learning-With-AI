from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
from bson import ObjectId
from typing import List, Optional
from backend.db import database

skills_forecast_router = APIRouter(prefix='/api/skills-forecast', tags=['skills-forecast'])

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

@skills_forecast_router.get('/', response_model=List[SkillsForecastResponse])
async def get_skills_forecasts():
    forecasts = []
    cursor = database.skills_forecast_collection.find()
    
    async for doc in cursor:
        doc['id'] = str(doc['_id'])
        del doc['_id']
        forecasts.append(doc)
    
    return forecasts

@skills_forecast_router.delete('/{forecast_id}')
async def delete_skills_forecast(forecast_id: str):
    try:
        result = await database.skills_forecast_collection.delete_one({'_id': ObjectId(forecast_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail='Skills forecast not found')
        return {'message': 'Skills forecast deleted successfully'}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
