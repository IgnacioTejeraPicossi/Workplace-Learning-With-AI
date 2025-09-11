from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from typing import List, Optional

# Router para micro-lessons
micro_lessons_router = APIRouter(prefix='/api/micro-lessons', tags=['micro-lessons'])

# Modelos Pydantic
class MicroLessonCreate(BaseModel):
    title: str
    topic: str
    level: str
    duration: str
    content: str

class MicroLessonResponse(BaseModel):
    id: str
    title: str
    topic: str
    level: str
    duration: str
    content: str
    created_at: str

# Base de datos
from db import database

@micro_lessons_router.post('/', response_model=MicroLessonResponse)
async def create_micro_lesson(micro_lesson: MicroLessonCreate):
    micro_lesson_data = micro_lesson.dict()
    micro_lesson_data['created_at'] = datetime.now().isoformat()
    
    result = await database.micro_lessons_collection.insert_one(micro_lesson_data)
    
    return MicroLessonResponse(
        id=str(result.inserted_id),
        **micro_lesson_data
    )

@micro_lessons_router.get('/', response_model=List[MicroLessonResponse])
async def get_micro_lessons():
    micro_lessons = []
    cursor = database.micro_lessons_collection.find()
    
    async for doc in cursor:
        doc['id'] = str(doc['_id'])
        del doc['_id']
        micro_lessons.append(doc)
    
    return micro_lessons

@micro_lessons_router.put('/{micro_lesson_id}')
async def update_micro_lesson(micro_lesson_id: str, micro_lesson: MicroLessonCreate):
    try:
        result = await database.micro_lessons_collection.update_one(
            {'_id': ObjectId(micro_lesson_id)},
            {'$set': micro_lesson.dict()}
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail='Micro-lesson not found')
        return {'message': 'Micro-lesson updated successfully'}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@micro_lessons_router.delete('/{micro_lesson_id}')
async def delete_micro_lesson(micro_lesson_id: str):
    try:
        result = await database.micro_lessons_collection.delete_one({'_id': ObjectId(micro_lesson_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail='Micro-lesson not found')
        return {'message': 'Micro-lesson deleted successfully'}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
