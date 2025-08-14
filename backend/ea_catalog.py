"""
Enterprise Architecture - Catalog API
Handles applications, capabilities, and data objects
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

from .ea_models import (
    CapabilityCreate, ApplicationCreate, 
    LifecycleStatus
)

router = APIRouter(prefix="/api/ea", tags=["Enterprise Architecture"])

# Database connection
def get_ea_db():
    from backend.db import get_database
    db = get_database()
    return db

# ============================================================================
# CAPABILITIES API
# ============================================================================

@router.post("/capabilities", response_model=dict)
async def create_capability(capability: CapabilityCreate, db=Depends(get_ea_db)):
    """Create a new business capability"""
    try:
        doc = capability.dict()
        doc.update({
            "createdAt": datetime.now(),
            "updatedAt": datetime.now()
        })
        
        result = db["ea_capabilities"].insert_one(doc)
        
        return {
            "success": True,
            "capability_id": str(result.inserted_id),
            "message": "Capability created successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create capability: {str(e)}")

@router.get("/capabilities", response_model=List[dict])
async def list_capabilities(
    db=Depends(get_ea_db),
    level: Optional[str] = Query(None),
    owner: Optional[str] = Query(None)
):
    """List business capabilities"""
    try:
        query = {}
        if level:
            query["level"] = level
        if owner:
            query["owner"] = {"$in": [owner]}
        
        capabilities = list(db["ea_capabilities"].find(query).sort("name", 1))
        
        for cap in capabilities:
            cap["_id"] = str(cap["_id"])
            cap["createdAt"] = cap["createdAt"].isoformat()
            cap["updatedAt"] = cap["updatedAt"].isoformat()
        
        return capabilities
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list capabilities: {str(e)}")

@router.get("/capabilities/{capability_id}", response_model=dict)
async def get_capability(capability_id: str, db=Depends(get_ea_db)):
    """Get a specific capability by ID"""
    try:
        if not ObjectId.is_valid(capability_id):
            raise HTTPException(status_code=400, detail="Invalid capability ID")
        
        capability = db["ea_capabilities"].find_one({"_id": ObjectId(capability_id)})
        if not capability:
            raise HTTPException(status_code=404, detail="Capability not found")
        
        capability["_id"] = str(capability["_id"])
        capability["createdAt"] = capability["createdAt"].isoformat()
        capability["updatedAt"] = capability["updatedAt"].isoformat()
        
        return capability
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get capability: {str(e)}")

# ============================================================================
# APPLICATIONS API
# ============================================================================

@router.post("/applications", response_model=dict)
async def create_application(application: ApplicationCreate, db=Depends(get_ea_db)):
    """Create a new application"""
    try:
        doc = application.dict()
        doc.update({
            "createdAt": datetime.now(),
            "updatedAt": datetime.now()
        })
        
        result = db["ea_applications"].insert_one(doc)
        
        return {
            "success": True,
            "application_id": str(result.inserted_id),
            "message": "Application created successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create application: {str(e)}")

@router.get("/applications", response_model=List[dict])
async def list_applications(
    db=Depends(get_ea_db),
    lifecycle: Optional[str] = Query(None),
    owner: Optional[str] = Query(None),
    capability: Optional[str] = Query(None),
    data_class: Optional[str] = Query(None)
):
    """List applications with optional filters"""
    try:
        query = {}
        if lifecycle:
            query["lifecycle"] = lifecycle
        if owner:
            query["owners"] = {"$in": [owner]}
        if capability:
            query["capabilities"] = {"$in": [capability]}
        if data_class:
            query["dataClasses"] = {"$in": [data_class]}
        
        applications = list(db["ea_applications"].find(query).sort("name", 1))
        
        for app in applications:
            app["_id"] = str(app["_id"])
            app["createdAt"] = app["createdAt"].isoformat()
            app["updatedAt"] = app["updatedAt"].isoformat()
        
        return applications
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list applications: {str(e)}")

@router.get("/applications/{application_id}", response_model=dict)
async def get_application(application_id: str, db=Depends(get_ea_db)):
    """Get a specific application by ID"""
    try:
        if not ObjectId.is_valid(application_id):
            raise HTTPException(status_code=400, detail="Invalid application ID")
        
        application = db["ea_applications"].find_one({"_id": ObjectId(application_id)})
        if not application:
            raise HTTPException(status_code=404, detail="Application not found")
        
        application["_id"] = str(application["_id"])
        application["createdAt"] = application["createdAt"].isoformat()
        application["updatedAt"] = application["updatedAt"].isoformat()
        
        return application
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get application: {str(e)}")

@router.put("/applications/{application_id}", response_model=dict)
async def update_application(
    application_id: str,
    application_update: dict,
    db=Depends(get_ea_db)
):
    """Update an existing application"""
    try:
        if not ObjectId.is_valid(application_id):
            raise HTTPException(status_code=400, detail="Invalid application ID")
        
        # Check if application exists
        existing = db["ea_applications"].find_one({"_id": ObjectId(application_id)})
        if not existing:
            raise HTTPException(status_code=404, detail="Application not found")
        
        # Prepare update data
        update_data = {k: v for k, v in application_update.items() if v is not None}
        update_data["updatedAt"] = datetime.now()
        
        # Update application
        result = db["ea_applications"].update_one(
            {"_id": ObjectId(application_id)},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=400, detail="No changes made")
        
        return {
            "success": True,
            "message": "Application updated successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update application: {str(e)}")

@router.delete("/applications/{application_id}", response_model=dict)
async def delete_application(application_id: str, db=Depends(get_ea_db)):
    """Delete an application"""
    try:
        if not ObjectId.is_valid(application_id):
            raise HTTPException(status_code=400, detail="Invalid application ID")
        
        result = db["ea_applications"].delete_one({"_id": ObjectId(application_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Application not found")
        
        return {
            "success": True,
            "message": "Application deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete application: {str(e)}")

# ============================================================================
# DEMO DATA INITIALIZATION
# ============================================================================

@router.post("/init-demo-data", response_model=dict)
async def initialize_demo_data(db=Depends(get_ea_db)):
    """Initialize demo data for Enterprise Architecture catalog"""
    try:
        # Sample capabilities
        demo_capabilities = [
            {
                "name": "Customer Management",
                "description": "Manage customer relationships and interactions",
                "category": "Customer Service",
                "level": "Strategic",
                "risk": 30,
                "maturity": 4,
                "owner": ["Customer Service Team"],
                "tags": ["customer", "relationship", "service"],
                "applications": ["CRM Platform", "Customer Portal"],
                "status": "Active"
            },
            {
                "name": "Financial Operations",
                "description": "Manage financial transactions and reporting",
                "category": "Finance",
                "level": "Core",
                "risk": 70,
                "maturity": 2,
                "owner": ["Finance Team"],
                "tags": ["finance", "accounting", "reporting"],
                "applications": ["ERP System", "Financial Reporting Tool"],
                "status": "Active"
            },
            {
                "name": "IT Infrastructure",
                "description": "Manage IT infrastructure and services",
                "category": "Information Technology",
                "level": "Supporting",
                "risk": 50,
                "maturity": 3,
                "owner": ["IT Team"],
                "tags": ["infrastructure", "technology", "support"],
                "applications": ["Monitoring System", "Backup System"],
                "status": "Active"
            }
        ]

        # Sample applications
        demo_applications = [
            {
                "name": "ERP System",
                "description": "Enterprise Resource Planning system for business operations",
                "category": "Business Operations",
                "lifecycle": "Production",
                "risk": 35,
                "maturity": 4,
                "vendor": "SAP",
                "owners": ["IT Department", "Business Operations"],
                "capabilities": ["Financial Management", "Inventory Control", "HR Management"],
                "dataClasses": ["Financial Data", "Employee Data", "Inventory Data"],
                "dependencies": ["Database", "Authentication Service"],
                "status": "Active"
            },
            {
                "name": "CRM Platform",
                "description": "Customer Relationship Management platform",
                "category": "Sales & Marketing",
                "lifecycle": "Production",
                "risk": 55,
                "maturity": 3,
                "vendor": "Salesforce",
                "owners": ["Sales Team", "Marketing Team"],
                "capabilities": ["Lead Management", "Customer Analytics", "Campaign Management"],
                "dataClasses": ["Customer Data", "Sales Data", "Marketing Data"],
                "dependencies": ["Email Service", "Analytics Engine"],
                "status": "Active"
            },
            {
                "name": "Legacy Database",
                "description": "Legacy database system for historical data",
                "category": "Data Management",
                "lifecycle": "Sunset",
                "risk": 85,
                "maturity": 1,
                "vendor": "Oracle",
                "owners": ["Data Team"],
                "capabilities": ["Data Storage", "Data Retrieval"],
                "dataClasses": ["Historical Data", "Reference Data"],
                "dependencies": ["Backup System"],
                "status": "Deprecated"
            }
        ]

        # Sample processes
        demo_processes = [
            {
                "name": "Order Processing",
                "description": "Process customer orders from receipt to fulfillment",
                "category": "Operations",
                "risk": 25,
                "maturity": 4,
                "owner": "Operations Team",
                "status": "Approved",
                "applications": ["ERP System", "Order Management"],
                "capabilities": ["Order Management", "Inventory Control"],
                "dependencies": ["Customer Data", "Inventory Data"],
                "steps": ["Order Receipt", "Validation", "Fulfillment", "Delivery"]
            },
            {
                "name": "Payment Processing",
                "description": "Process financial transactions and payments",
                "category": "Finance",
                "risk": 75,
                "maturity": 2,
                "owner": "Finance Team",
                "status": "Draft",
                "applications": ["Payment Gateway", "Financial System"],
                "capabilities": ["Financial Operations", "Risk Management"],
                "dependencies": ["Payment Gateway", "Banking API"],
                "steps": ["Payment Initiation", "Validation", "Processing", "Confirmation"]
            }
        ]

        # Insert capabilities
        if "ea_capabilities" not in db.list_collection_names():
            db.create_collection("ea_capabilities")
        
        capabilities_result = db["ea_capabilities"].insert_many(demo_capabilities)
        
        # Insert applications
        if "ea_applications" not in db.list_collection_names():
            db.create_collection("ea_applications")
        
        applications_result = db["ea_applications"].insert_many(demo_applications)
        
        # Insert processes
        if "ea_processes" not in db.list_collection_names():
            db.create_collection("ea_processes")
        
        processes_result = db["ea_processes"].insert_many(demo_processes)

        return {
            "success": True,
            "message": "Demo data initialized successfully",
            "capabilities_inserted": len(capabilities_result.inserted_ids),
            "applications_inserted": len(applications_result.inserted_ids),
            "processes_inserted": len(processes_result.inserted_ids)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to initialize demo data: {str(e)}")

# ============================================================================
# CATALOG OVERVIEW API
# ============================================================================

@router.get("/catalog/overview", response_model=dict)
async def get_catalog_overview():
    """Get catalog overview statistics"""
    # Return empty overview for now - will be populated when data is added
    return {
        "success": True,
        "overview": {
            "total_capabilities": 0,
            "total_applications": 0,
            "total_processes": 0,
            "lifecycle_distribution": [],
            "risk_distribution": []
        }
    }

@router.get("/catalog/search", response_model=List[dict])
async def search_catalog(
    query: str = Query(..., description="Search term"),
    db=Depends(get_ea_db)
):
    """Search across catalog items"""
    try:
        # Search in capabilities
        capabilities = list(db["ea_capabilities"].find({
            "$or": [
                {"name": {"$regex": query, "$options": "i"}},
                {"description": {"$regex": query, "$options": "i"}}
            ]
        }).limit(10))
        
        # Search in applications
        applications = list(db["ea_applications"].find({
            "$or": [
                {"name": {"$regex": query, "$options": "i"}},
                {"description": {"$regex": query, "$options": "i"}},
                {"vendor": {"$regex": query, "$options": "i"}}
            ]
        }).limit(10))
        
        # Search in processes
        processes = list(db["ea_processes"].find({
            "$or": [
                {"name": {"$regex": query, "$options": "i"}},
                {"description": {"$regex": query, "$options": "i"}},
                {"category": {"$regex": query, "$options": "i"}}
            ]
        }).limit(10))
        
        # Format results
        results = []
        
        for cap in capabilities:
            cap["_id"] = str(cap["_id"])
            cap["type"] = "capability"
            cap["createdAt"] = cap["createdAt"].isoformat()
            results.append(cap)
        
        for app in applications:
            app["_id"] = str(app["_id"])
            app["type"] = "application"
            app["createdAt"] = app["createdAt"].isoformat()
            results.append(app)
        
        for proc in processes:
            proc["_id"] = str(proc["_id"])
            proc["type"] = "process"
            proc["createdAt"] = proc["createdAt"].isoformat()
            results.append(proc)
        
        # Sort by relevance (simple: name matches first)
        results.sort(key=lambda x: (
            not x["name"].lower().startswith(query.lower()),
            x["name"]
        ))
        
        return results[:20]  # Limit total results
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to search catalog: {str(e)}")
