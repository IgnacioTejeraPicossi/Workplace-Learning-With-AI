from datetime import datetime
import hashlib
from backend.db import database, saved_videos_collection, certifications_collection, \
                       simulation_results_collection, career_coach_collection, skills_forecast_collection, \
                       web_search_collection

async def extract_topics_from_modules():
    """Extract unique topics using direct MongoDB access for better performance"""
    all_topics = {}
    
    print("🔍 Starting topic extraction using direct MongoDB access...")
    
    try:
        # Direct MongoDB access - much faster than HTTP calls
        print("📚 Fetching micro-lessons from MongoDB...")
        micro_lessons = await database.micro_lessons_collection.find({}).to_list(length=None)
        print(f"  Found {len(micro_lessons)} micro-lessons from MongoDB")
        
        # Process micro-lessons
        for lesson in micro_lessons:
            if lesson.get("topic"):
                topic_key = lesson["topic"]
                print(f"  📝 Processing micro-lesson: '{topic_key}'")
                
                # Check if we already have this topic (case-insensitive)
                existing_key = None
                for existing_topic in all_topics.keys():
                    if existing_topic.lower() == topic_key.lower():
                        existing_key = existing_topic
                        break
                
                if existing_key:
                    # Update existing topic
                    all_topics[existing_key]["count"] += 1
                    print(f"    🔄 Updated existing topic: '{existing_key}' (count: {all_topics[existing_key]['count']})")
                else:
                    # Add new topic
                    all_topics[topic_key] = {
                        "id": topic_key.lower().replace(" ", "_").replace("-", "_").replace("(", "").replace(")", ""),
                        "label": lesson["topic"],
                        "description": lesson.get("content", "")[:100] + "..." if lesson.get("content") else f"Micro-lesson about {lesson['topic']}",
                        "source": "micro_lessons",
                        "count": 1,
                        "last_activity": lesson.get("created_at", "")
                    }
                    print(f"    ✅ Added new topic: '{topic_key}'")
            else:
                print(f"  ⚠️ Micro-lesson without topic: {lesson.get('title', 'Unknown')}")

        print("🎥 Fetching videos from MongoDB...")
        videos = await saved_videos_collection.find({}).to_list(length=None)
        print(f"  Found {len(videos)} videos from MongoDB")

        # Process videos
        for video in videos:
            if video.get("topic"):
                topic_key = video["topic"]
                if topic_key not in all_topics:
                    all_topics[topic_key] = {
                        "id": topic_key.lower().replace(" ", "_").replace("-", "_").replace("(", "").replace(")", ""),
                        "label": video["topic"],
                        "description": video.get("description", "")[:100] + "..." if video.get("description") else f"Video about {video['topic']}",
                        "source": "videos",
                        "count": 1,
                        "last_activity": video.get("saved_at", "")
                    }
                else:
                    all_topics[topic_key]["count"] += 1

        print(f"✅ Total topics extracted: {len(all_topics)}")
        return all_topics

    except Exception as e:
        print(f"❌ Error in MongoDB access: {e}")
        return {}

async def extract_topics_from_modules_fallback():
    """Fallback function using direct MongoDB access"""
    all_topics = {}
    
    print("🔄 Using fallback: direct MongoDB access...")
    
    # Direct MongoDB access
    micro_lessons = await database.micro_lessons_collection.find({}).to_list(length=None)
    videos = await saved_videos_collection.find({}).to_list(length=None)
    
    # Process micro-lessons
    for lesson in micro_lessons:
        if lesson.get("topic"):
            topic_key = lesson["topic"]
            if topic_key not in all_topics:
                all_topics[topic_key] = {
                    "id": topic_key.lower().replace(" ", "_").replace("-", "_").replace("(", "").replace(")", ""),
                    "label": lesson["topic"],
                    "description": lesson.get("content", "")[:100] + "..." if lesson.get("content") else f"Micro-lesson about {lesson['topic']}",
                    "source": "micro_lessons",
                    "count": 1,
                    "last_activity": lesson.get("created_at", "")
                }
            else:
                all_topics[topic_key]["count"] += 1
    
    # Process videos
    for video in videos:
        if video.get("topic"):
            topic_key = video["topic"]
            if topic_key not in all_topics:
                all_topics[topic_key] = {
                    "id": topic_key.lower().replace(" ", "_").replace("-", "_").replace("(", "").replace(")", ""),
                    "label": video["topic"],
                    "description": video.get("description", "")[:100] + "..." if video.get("description") else f"Video about {video['topic']}",
                    "source": "videos",
                    "count": 1,
                    "last_activity": video.get("saved_at", "")
                }
            else:
                all_topics[topic_key]["count"] += 1
    
    print(f"✅ Fallback: Total topics extracted: {len(all_topics)}")
    return all_topics

def generate_topic_embedding(topic_text):
    """Generate a simple hash-based embedding for a topic"""
    # Simple hash-based embedding (8 dimensions)
    hash_obj = hashlib.md5(topic_text.encode())
    hash_bytes = hash_obj.digest()
    
    # Convert to float values between -1 and 1
    embedding = []
    for i in range(0, len(hash_bytes), 2):
        if i + 1 < len(hash_bytes):
            # Combine two bytes and normalize to [-1, 1]
            combined = (hash_bytes[i] << 8) + hash_bytes[i + 1]
            normalized = (combined / 65535.0) * 2 - 1
            embedding.append(normalized)
    
    # Pad or truncate to exactly 8 dimensions
    while len(embedding) < 8:
        embedding.append(0.0)
    
    return embedding[:8]

def categorize_topic(topic_label):
    """Categorize a topic based on its label"""
    topic_lower = topic_label.lower()
    
    if any(word in topic_lower for word in ['python', 'javascript', 'java', 'pascal', 'programming', 'code', 'development']):
        return 'Programming & Development'
    elif any(word in topic_lower for word in ['ai', 'machine learning', 'llm', 'openai', 'rag', 'agentic', 'chatgpt', 'artificial intelligence']):
        return 'AI & Machine Learning'
    elif any(word in topic_lower for word in ['studio', 'localhost', 'port', 'tool', 'ide', 'environment']):
        return 'Development Tools'
    elif any(word in topic_lower for word in ['web', 'api', 'http', 'url', 'frontend', 'backend']):
        return 'Web Technologies'
    elif any(word in topic_lower for word in ['data', 'analytics', 'science', 'database', 'sql', 'nosql']):
        return 'Data & Analytics'
    else:
        return 'General Skills'

def generate_dynamic_categories(topics):
    """Generate dynamic categories based on actual topics using pattern matching"""
    if not topics:
        return {}
    
    categories = {
        "Programming & Development": [],
        "AI & Machine Learning": [],
        "Development Tools": [],
        "Web Technologies": [],
        "Data & Analytics": [],
        "General Skills": []
    }
    
    for topic_id, topic_data in topics.items():
        topic_label = topic_data["label"].lower()
        
        if any(word in topic_label for word in ['python', 'javascript', 'java', 'pascal', 'programming', 'code', 'development']):
            categories["Programming & Development"].append(topic_id)
        elif any(word in topic_label for word in ['ai', 'machine learning', 'llm', 'openai', 'rag', 'agentic', 'chatgpt', 'artificial intelligence']):
            categories["AI & Machine Learning"].append(topic_id)
        elif any(word in topic_label for word in ['studio', 'localhost', 'port', 'tool', 'ide', 'environment']):
            categories["Development Tools"].append(topic_id)
        elif any(word in topic_label for word in ['web', 'api', 'http', 'url', 'frontend', 'backend']):
            categories["Web Technologies"].append(topic_id)
        elif any(word in topic_label for word in ['data', 'analytics', 'science', 'database', 'sql', 'nosql']):
            categories["Data & Analytics"].append(topic_id)
        else:
            categories["General Skills"].append(topic_id)
    
    # Return only categories that have topics
    return {k: v for k, v in categories.items() if v}