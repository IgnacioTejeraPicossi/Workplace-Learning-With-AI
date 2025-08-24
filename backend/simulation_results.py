from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from datetime import datetime
from bson import ObjectId
from typing import List, Optional
from backend.db import database
from motor.motor_asyncio import AsyncIOMotorClient

simulation_results_router = APIRouter(prefix='/api/simulation-results', tags=['simulation-results'])

# Create unique index for _id field to prevent duplicates
async def ensure_unique_indexes(db: AsyncIOMotorClient):
    try:
        # Create unique index on _id field
        await db.simulation_results.create_index("_id", unique=True)
        print("✅ Unique index created on _id field for simulation_results collection")
    except Exception as e:
        print(f"⚠️ Warning: Could not create unique index: {e}")

class SimulationResultCreate(BaseModel):
    simulation_type: str
    title: str
    topic: str
    description: str
    content: str
    difficulty: str = 'beginner'
    duration: Optional[int] = None
    scenario_type: Optional[str] = None
    learning_objectives: Optional[List[str]] = None
    user_score: Optional[int] = None
    completion_time: Optional[int] = None
    feedback: Optional[str] = None

class SimulationResultResponse(BaseModel):
    id: str
    simulation_type: str
    title: str
    topic: str
    description: str
    content: str
    difficulty: str
    duration: Optional[int] = None
    scenario_type: Optional[str] = None
    learning_objectives: Optional[List[str]] = None
    user_score: Optional[int] = None
    completion_time: Optional[int] = None
    feedback: Optional[str] = None
    created_at: str

@simulation_results_router.post('/', response_model=SimulationResultResponse)
async def create_simulation_result(result: SimulationResultCreate):
    result_data = result.dict()
    result_data['created_at'] = datetime.now().isoformat()
    
    result_doc = await database.simulation_results_collection.insert_one(result_data)
    
    return SimulationResultResponse(
        id=str(result_doc.inserted_id),
        **result_data
    )

@simulation_results_router.get('/', response_model=List[SimulationResultResponse])
async def get_simulation_results():
    try:
        # Ensure unique indexes are created
        await ensure_unique_indexes(database)
        
        results = []
        cursor = database.simulation_results_collection.find()
        
        async for doc in cursor:
            doc['id'] = str(doc['_id'])
            del doc['_id']
            results.append(doc)
        
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@simulation_results_router.put('/{result_id}')
async def update_simulation_result(result_id: str, result: SimulationResultCreate):
    try:
        update_result = await database.simulation_results_collection.update_one(
            {'_id': ObjectId(result_id)},
            {'$set': result.dict()}
        )
        if update_result.modified_count == 0:
            raise HTTPException(status_code=404, detail='Simulation result not found')
        return {'message': 'Simulation result updated successfully'}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@simulation_results_router.delete('/{result_id}')
async def delete_simulation_result(result_id: str):
    try:
        delete_result = await database.simulation_results_collection.delete_one({'_id': ObjectId(result_id)})
        if delete_result.deleted_count == 0:
            raise HTTPException(status_code=404, detail='Simulation result not found')
        return {'message': 'Simulation result deleted successfully'}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
