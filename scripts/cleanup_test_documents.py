#!/usr/bin/env python3
"""
Script to clean up test documents from MongoDB
Removes documents with 'test-document' in filename
"""

import os
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

async def cleanup_test_documents():
    """Remove test documents from MongoDB"""
    
    # MongoDB connection
    MONGO_DETAILS = "mongodb://localhost:27017"
    client = AsyncIOMotorClient(MONGO_DETAILS)
    database = client["ai_learning"]
    document_analyses_collection = database.get_collection("document_analyses")
    
    try:
        # Find all documents with 'test-document' in filename
        test_docs = await document_analyses_collection.find({
            "filename": {"$regex": "test-document", "$options": "i"}
        }).to_list(length=None)
        
        print(f"🔍 Found {len(test_docs)} test documents:")
        for doc in test_docs:
            print(f"  - {doc.get('filename', 'Unknown')} (ID: {doc.get('_id')})")
        
        if not test_docs:
            print("✅ No test documents found to clean up")
            return
        
        # Confirm deletion
        print(f"\n⚠️  About to delete {len(test_docs)} test documents")
        confirm = input("Do you want to proceed? (y/N): ").strip().lower()
        
        if confirm != 'y':
            print("❌ Operation cancelled")
            return
        
        # Delete test documents
        result = await document_analyses_collection.delete_many({
            "filename": {"$regex": "test-document", "$options": "i"}
        })
        
        print(f"✅ Successfully deleted {result.deleted_count} test documents")
        
        # Show remaining documents
        remaining_docs = await document_analyses_collection.find({}).to_list(length=None)
        print(f"\n📋 Remaining documents ({len(remaining_docs)}):")
        for doc in remaining_docs:
            print(f"  - {doc.get('filename', 'Unknown')} (ID: {doc.get('_id')})")
            
    except Exception as e:
        print(f"❌ Error cleaning up documents: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    import asyncio
    asyncio.run(cleanup_test_documents())
