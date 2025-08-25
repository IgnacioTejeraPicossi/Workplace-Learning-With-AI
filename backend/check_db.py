#!/usr/bin/env python3
"""
Simple script to check what's in the lessons_collection database
"""

import asyncio
from db import lessons_collection

async def check_database():
    try:
        print("🔍 Checking lessons_collection database...")
        
        # Count total documents
        total = await lessons_collection.count_documents({})
        print(f"📊 Total documents: {total}")
        
        if total > 0:
            # Get all documents
            cursor = lessons_collection.find({})
            docs = await cursor.to_list(length=20)
            
            print("\n📋 Documents found:")
            for i, doc in enumerate(docs, 1):
                print(f"\n{i}. ID: {doc.get('_id')}")
                print(f"   Title: {doc.get('title', 'No title')}")
                print(f"   Type: {doc.get('type', 'No type')}")
                print(f"   Source: {doc.get('source', 'No source')}")
                print(f"   Created: {doc.get('created_at', 'No date')}")
                
                # Show content preview if it exists
                content = doc.get('content', '')
                if content:
                    preview = content[:100] + "..." if len(content) > 100 else content
                    print(f"   Content Preview: {preview}")
        else:
            print("❌ No documents found in lessons_collection")
            
    except Exception as e:
        print(f"❌ Error checking database: {e}")

if __name__ == "__main__":
    asyncio.run(check_database())
