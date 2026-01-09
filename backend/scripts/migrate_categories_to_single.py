#!/usr/bin/env python3
"""
Script to migrate J-messages categories from array to single string value.
- Converts categories (array) to category (string) - takes first element
- Removes old categories field
- Ensures only valid categories: "Annet", "Bunnfisk", "Pelagisk fisk"
"""

import os
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

# Valid categories
VALID_CATEGORIES = ["Annet", "Bunnfisk", "Pelagisk fisk"]

async def migrate_categories():
    """Migrate categories from array to single string"""
    
    # MongoDB connection
    MONGO_DETAILS = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(MONGO_DETAILS)
    database = client["ai_learning"]
    j_messages_collection = database.get_collection("j_messages")
    
    try:
        # Find all documents
        all_docs = await j_messages_collection.find({}).to_list(length=None)
        
        print(f"[INFO] Found {len(all_docs)} J-messages documents")
        
        migrated_count = 0
        invalid_count = 0
        already_migrated_count = 0
        
        for doc in all_docs:
            doc_id = doc.get("_id")
            update_needed = False
            new_category = None
            
            # Check if already migrated (has category field and no categories field)
            if "category" in doc and "categories" not in doc:
                already_migrated_count += 1
                # Verify category is valid
                if doc.get("category") not in VALID_CATEGORIES:
                    print(f"[WARN] Document {doc_id} has invalid category: {doc.get('category')}")
                    invalid_count += 1
                continue
            
            # Case 1: Has categories array
            if "categories" in doc:
                categories = doc.get("categories", [])
                if isinstance(categories, list) and len(categories) > 0:
                    # Take first category
                    first_cat = categories[0]
                    # Validate it's one of the valid categories
                    if first_cat in VALID_CATEGORIES:
                        new_category = first_cat
                    else:
                        print(f"[WARN] Document {doc_id} has invalid category in array: {first_cat}")
                        # Set to "Annet" as default for invalid categories
                        new_category = "Annet"
                    update_needed = True
                elif isinstance(categories, list) and len(categories) == 0:
                    # Empty array, set to null
                    new_category = None
                    update_needed = True
            
            # Case 2: Has category field but also has categories (needs cleanup)
            if "category" in doc and "categories" in doc:
                # Keep existing category if valid, otherwise use first from array
                existing_cat = doc.get("category")
                if existing_cat in VALID_CATEGORIES:
                    new_category = existing_cat
                else:
                    # Try to get from array
                    categories = doc.get("categories", [])
                    if isinstance(categories, list) and len(categories) > 0:
                        first_cat = categories[0]
                        if first_cat in VALID_CATEGORIES:
                            new_category = first_cat
                        else:
                            new_category = "Annet"
                    else:
                        new_category = "Annet"
                update_needed = True
            
            # Case 3: Has category but it's invalid
            if "category" in doc and doc.get("category") not in VALID_CATEGORIES and doc.get("category") is not None:
                print(f"[WARN] Document {doc_id} has invalid category: {doc.get('category')}")
                new_category = "Annet"  # Default to "Annet"
                update_needed = True
            
            if update_needed:
                # Update document
                update_doc = {
                    "$set": {"category": new_category},
                    "$unset": {"categories": ""}
                }
                await j_messages_collection.update_one(
                    {"_id": doc_id},
                    update_doc
                )
                migrated_count += 1
                print(f"[OK] Migrated document {doc_id}: category = {new_category}")
        
        print(f"\n[MIGRATION SUMMARY]")
        print(f"  - Already migrated: {already_migrated_count}")
        print(f"  - Newly migrated: {migrated_count}")
        print(f"  - Invalid categories found: {invalid_count}")
        print(f"  - Total documents: {len(all_docs)}")
        
        # Verify migration
        print(f"\n[VERIFICATION]")
        docs_with_categories = await j_messages_collection.count_documents({"categories": {"$exists": True}})
        docs_with_category = await j_messages_collection.count_documents({"category": {"$exists": True}})
        
        print(f"  - Documents with old 'categories' field: {docs_with_categories}")
        print(f"  - Documents with new 'category' field: {docs_with_category}")
        
        if docs_with_categories == 0:
            print("[SUCCESS] Migration complete! All documents migrated successfully.")
        else:
            print(f"[WARN] Warning: {docs_with_categories} documents still have 'categories' field")
        
    except Exception as e:
        print(f"[ERROR] Error during migration: {e}")
        import traceback
        traceback.print_exc()
    finally:
        client.close()

if __name__ == "__main__":
    import asyncio
    print("[START] Starting J-messages categories migration...")
    print(f"   Valid categories: {', '.join(VALID_CATEGORIES)}")
    print()
    asyncio.run(migrate_categories())

