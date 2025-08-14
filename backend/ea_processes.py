"""
Enterprise Architecture - Processes API
Handles process creation, updates, and management
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from pymongo import MongoClient
from typing import List, Optional
from datetime import datetime
import uuid
from bson import ObjectId

from .ea_models import (
    ProcessCreate, ProcessUpdate, ProcessResponse, 
    Node, Edge, ProcessStatus
)

router = APIRouter(prefix="/api/ea", tags=["Enterprise Architecture"])

# Database connection
def get_ea_db():
    from backend.db import get_database
    db = get_database()
    return db

@router.post("/processes", response_model=dict)
async def create_process(process: ProcessCreate, db=Depends(get_ea_db)):
    """Create a new process"""
    try:
        # Generate unique IDs for nodes and edges if not provided
        for node in process.nodes:
            if not node.id:
                node.id = str(uuid.uuid4())
        
        for edge in process.edges:
            if not edge.id:
                edge.id = str(uuid.uuid4())
        
        # Prepare document
        doc = process.dict()
        doc.update({
            "version": 1,
            "createdAt": datetime.now(),
            "updatedAt": datetime.now()
        })
        
        # Insert into database
        result = db["ea_processes"].insert_one(doc)
        
        return {
            "success": True,
            "process_id": str(result.inserted_id),
            "message": "Process created successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create process: {str(e)}")

@router.get("/processes", response_model=List[dict])
async def list_processes(
    db=Depends(get_ea_db),
    owner: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    risk_min: Optional[float] = Query(None),
    risk_max: Optional[float] = Query(None)
):
    """List processes with optional filters"""
    try:
        # Build query
        query = {}
        if owner:
            query["owner"] = owner
        if status:
            query["status"] = status
        if category:
            query["category"] = category
        if risk_min is not None or risk_max is not None:
            risk_query = {}
            if risk_min is not None:
                risk_query["$gte"] = risk_min
            if risk_max is not None:
                risk_query["$lte"] = risk_max
            query["risk"] = risk_query
        
        # Execute query
        processes = list(db["ea_processes"].find(
            query, 
            {
                "_id": 1, "name": 1, "owner": 1, "risk": 1, 
                "maturity": 1, "status": 1, "category": 1,
                "createdAt": 1, "updatedAt": 1
            }
        ).sort("createdAt", -1))
        
        # Convert ObjectId to string
        for process in processes:
            process["_id"] = str(process["_id"])
            process["createdAt"] = process["createdAt"].isoformat()
            process["updatedAt"] = process["updatedAt"].isoformat()
        
        return processes
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list processes: {str(e)}")

@router.get("/processes/{process_id}", response_model=dict)
async def get_process(process_id: str, db=Depends(get_ea_db)):
    """Get a specific process by ID"""
    try:
        if not ObjectId.is_valid(process_id):
            raise HTTPException(status_code=400, detail="Invalid process ID")
        
        process = db["ea_processes"].find_one({"_id": ObjectId(process_id)})
        if not process:
            raise HTTPException(status_code=404, detail="Process not found")
        
        # Convert ObjectId to string
        process["_id"] = str(process["_id"])
        process["createdAt"] = process["createdAt"].isoformat()
        process["updatedAt"] = process["updatedAt"].isoformat()
        
        return process
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get process: {str(e)}")

@router.put("/processes/{process_id}", response_model=dict)
async def update_process(
    process_id: str, 
    process_update: ProcessUpdate, 
    db=Depends(get_ea_db)
):
    """Update an existing process"""
    try:
        if not ObjectId.is_valid(process_id):
            raise HTTPException(status_code=400, detail="Invalid process ID")
        
        # Check if process exists
        existing = db["ea_processes"].find_one({"_id": ObjectId(process_id)})
        if not existing:
            raise HTTPException(status_code=404, detail="Process not found")
        
        # Prepare update data
        update_data = process_update.dict(exclude_unset=True)
        update_data["updatedAt"] = datetime.now()
        
        # Update process
        result = db["ea_processes"].update_one(
            {"_id": ObjectId(process_id)},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=400, detail="No changes made")
        
        return {
            "success": True,
            "message": "Process updated successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update process: {str(e)}")

@router.delete("/processes/{process_id}", response_model=dict)
async def delete_process(process_id: str, db=Depends(get_ea_db)):
    """Delete a process"""
    try:
        if not ObjectId.is_valid(process_id):
            raise HTTPException(status_code=400, detail="Invalid process ID")
        
        result = db["ea_processes"].delete_one({"_id": ObjectId(process_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Process not found")
        
        return {
            "success": True,
            "message": "Process deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete process: {str(e)}")

@router.post("/processes/{process_id}/clone", response_model=dict)
async def clone_process(process_id: str, db=Depends(get_ea_db)):
    """Clone a process with version bump"""
    try:
        if not ObjectId.is_valid(process_id):
            raise HTTPException(status_code=400, detail="Invalid process ID")
        
        # Get original process
        original = db["ea_processes"].find_one({"_id": ObjectId(process_id)})
        if not original:
            raise HTTPException(status_code=404, detail="Process not found")
        
        # Create clone
        clone = original.copy()
        clone["_id"] = ObjectId()  # New ID
        clone["name"] = f"{original['name']} (Copy)"
        clone["status"] = ProcessStatus.DRAFT
        clone["version"] = original.get("version", 1) + 1
        clone["createdAt"] = datetime.now()
        clone["updatedAt"] = datetime.now()
        
        # Insert clone
        result = db["ea_processes"].insert_one(clone)
        
        return {
            "success": True,
            "process_id": str(result.inserted_id),
            "message": "Process cloned successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clone process: {str(e)}")

@router.post("/processes/{process_id}/approve", response_model=dict)
async def approve_process(process_id: str, db=Depends(get_ea_db)):
    """Approve a process (change status to approved)"""
    try:
        if not ObjectId.is_valid(process_id):
            raise HTTPException(status_code=400, detail="Invalid process ID")
        
        result = db["ea_processes"].update_one(
            {"_id": ObjectId(process_id)},
            {
                "$set": {
                    "status": ProcessStatus.APPROVED,
                    "updatedAt": datetime.now()
                }
            }
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=400, detail="Process not found or already approved")
        
        return {
            "success": True,
            "message": "Process approved successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to approve process: {str(e)}")

@router.post("/processes/{process_id}/link-app", response_model=dict)
async def link_application(
    process_id: str, 
    app_id: str, 
    db=Depends(get_ea_db)
):
    """Link an application to a process"""
    try:
        if not ObjectId.is_valid(process_id):
            raise HTTPException(status_code=400, detail="Invalid process ID")
        
        result = db["ea_processes"].update_one(
            {"_id": ObjectId(process_id)},
            {
                "$addToSet": {"linkedApps": app_id},
                "$set": {"updatedAt": datetime.now()}
            }
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=400, detail="Process not found")
        
        return {
            "success": True,
            "message": "Application linked successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to link application: {str(e)}")

@router.post("/processes/{process_id}/attach-training", response_model=dict)
async def attach_training(
    process_id: str,
    node_id: Optional[str] = None,
    training_module_id: str = None,
    db=Depends(get_ea_db)
):
    """Attach a training module to a process or specific node"""
    try:
        if not ObjectId.is_valid(process_id):
            raise HTTPException(status_code=400, detail="Invalid process ID")
        
        if node_id:
            # Attach to specific node
            result = db["ea_processes"].update_one(
                {
                    "_id": ObjectId(process_id),
                    "nodes.id": node_id
                },
                {
                    "$set": {
                        f"nodes.$.trainingModuleId": training_module_id,
                        "updatedAt": datetime.now()
                    }
                }
            )
        else:
            # Attach to process level (store in metadata)
            result = db["ea_processes"].update_one(
                {"_id": ObjectId(process_id)},
                {
                    "$set": {
                        "metadata.trainingModuleId": training_module_id,
                        "updatedAt": datetime.now()
                    }
                }
            )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=400, detail="Process or node not found")
        
        return {
            "success": True,
            "message": "Training module attached successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to attach training: {str(e)}")
