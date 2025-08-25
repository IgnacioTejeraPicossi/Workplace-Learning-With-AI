#!/usr/bin/env python3
"""
Check the specific README document that was generated
"""

import asyncio
from db import lessons_collection

async def check_specific_doc():
    try:
        print("🔍 Checking the specific README document...")
        
        # Look for the document with cursor_ai_analysis type
        doc = await lessons_collection.find_one({"type": "cursor_ai_analysis"})
        
        if doc:
            print(f"✅ Found README document!")
            print(f"ID: {doc.get('_id')}")
            print(f"Title: {doc.get('title', 'No title')}")
            print(f"Type: {doc.get('type', 'No type')}")
            print(f"Source: {doc.get('source', 'No source')}")
            print(f"Created: {doc.get('created_at', 'No date')}")
            print(f"Content length: {len(doc.get('content', ''))}")
            
            # Show first 500 characters of content
            content = doc.get('content', '')
            if content:
                print(f"\n📝 Content Preview (first 500 chars):")
                print("-" * 50)
                print(content[:500])
                print("-" * 50)
        else:
            print("❌ No README document found with type 'cursor_ai_analysis'")
            
    except Exception as e:
        print(f"❌ Error checking document: {e}")

if __name__ == "__main__":
    asyncio.run(check_specific_doc())
