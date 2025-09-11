from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from typing import List, Optional

# Router para certificaciones
certifications_router = APIRouter(prefix='/api/certifications', tags=['certifications'])

# Modelos Pydantic
class CertificationCreate(BaseModel):
    title: str
    description: str
    level: str
    duration: str
    topics: List[str]
    status: str = 'completed'
    study_plan: Optional[str] = ''  # Make study_plan optional

class CertificationResponse(BaseModel):
    id: str
    title: str
    description: str
    level: str
    duration: str
    topics: List[str]
    status: str
    created_at: str
    completed_at: str
    study_plan: Optional[str] = ''  # Make study_plan optional

# Base de datos
from db import database

@certifications_router.post('/', response_model=CertificationResponse)
async def create_certification(certification: CertificationCreate):
    certification_data = certification.dict()
    certification_data['created_at'] = datetime.now().isoformat()
    certification_data['completed_at'] = datetime.now().isoformat()
    
    result = await database.certifications_collection.insert_one(certification_data)
    
    return CertificationResponse(
        id=str(result.inserted_id),
        **certification_data
    )

@certifications_router.get('/', response_model=List[CertificationResponse])
async def get_certifications():
    certifications = []
    cursor = database.certifications_collection.find()
    
    async for doc in cursor:
        doc['id'] = str(doc['_id'])
        del doc['_id']
        certifications.append(doc)
    
    return certifications

@certifications_router.delete('/{certification_id}')
async def delete_certification(certification_id: str):
    try:
        result = await database.certifications_collection.delete_one({'_id': ObjectId(certification_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail='Certification not found')
        return {'message': 'Certification deleted successfully'}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
