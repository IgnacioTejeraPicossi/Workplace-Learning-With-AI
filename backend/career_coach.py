from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
from bson import ObjectId
from typing import List, Optional
from backend.db import database

career_coach_router = APIRouter(prefix='/api/career-coach', tags=['career-coach'])

class CareerCoachSessionCreate(BaseModel):
    title: str
    topic: str
    content: str
    status: str = 'active'
    growth_area: Optional[str] = None
    custom_topic: Optional[str] = None

class CareerCoachSessionResponse(BaseModel):
    id: str
    title: str
    topic: str
    content: str
    status: str
    growth_area: Optional[str] = None
    custom_topic: Optional[str] = None
    created_at: str

@career_coach_router.post('/', response_model=CareerCoachSessionResponse)
async def create_career_coach_session(session: CareerCoachSessionCreate):
    session_data = session.dict()
    session_data['created_at'] = datetime.now().isoformat()
    
    result = await database.career_coach_collection.insert_one(session_data)
    
    return CareerCoachSessionResponse(
        id=str(result.inserted_id),
        **session_data
    )

@career_coach_router.get('/', response_model=List[CareerCoachSessionResponse])
async def get_career_coach_sessions():
    sessions = []
    cursor = database.career_coach_collection.find()
    
    async for doc in cursor:
        doc['id'] = str(doc['_id'])
        del doc['_id']
        sessions.append(doc)
    
    return sessions

@career_coach_router.put('/{session_id}')
async def update_career_coach_session(session_id: str, session: CareerCoachSessionCreate):
    try:
        result = await database.career_coach_collection.update_one(
            {'_id': ObjectId(session_id)},
            {'$set': session.dict()}
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail='Career coach session not found')
        return {'message': 'Career coach session updated successfully'}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@career_coach_router.delete('/{session_id}')
async def delete_career_coach_session(session_id: str):
    try:
        result = await database.career_coach_collection.delete_one({'_id': ObjectId(session_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail='Career coach session not found')
        return {'message': 'Career coach session deleted successfully'}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
