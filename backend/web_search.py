from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
from bson import ObjectId
from typing import List, Optional
from backend.db import database

web_search_router = APIRouter(prefix='/api/web-search', tags=['web-search'])

class WebSearchResultCreate(BaseModel):
    title: str
    url: str
    snippet: str
    topic: str
    search_query: str
    source: str = 'web_search'

class WebSearchResultResponse(BaseModel):
    id: str
    title: str
    url: str
    snippet: str
    topic: str
    search_query: str
    source: str
    created_at: str

@web_search_router.post('/', response_model=WebSearchResultResponse)
async def create_web_search_result(result: WebSearchResultCreate):
    result_data = result.dict()
    result_data['created_at'] = datetime.now().isoformat()
    
    db_result = await database.web_search_collection.insert_one(result_data)
    
    return WebSearchResultResponse(
        id=str(db_result.inserted_id),
        **result_data
    )

@web_search_router.get('/', response_model=List[WebSearchResultResponse])
async def get_web_search_results():
    results = []
    cursor = database.web_search_collection.find()
    
    async for doc in cursor:
        doc['id'] = str(doc['_id'])
        del doc['_id']
        results.append(doc)
    
    return results

@web_search_router.delete('/{result_id}')
async def delete_web_search_result(result_id: str):
    try:
        result = await database.web_search_collection.delete_one({'_id': ObjectId(result_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail='Web search result not found')
        return {'message': 'Web search result deleted successfully'}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
