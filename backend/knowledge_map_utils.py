from datetime import datetime
import hashlib
from backend.db import micro_lessons_collection, saved_videos_collection, certifications_collection, \
                       simulation_results_collection, career_coach_collection, skills_forecast_collection, \
                       web_search_collection

async def extract_topics_from_modules():
    """Extract unique topics using the SAME logic as Dashboard - exact same API calls"""
    import httpx
    
    all_topics = {}
    
    print("🔍 Starting topic extraction using SAME logic as Dashboard...")
    
    try:
        # Use the SAME API calls as Dashboard
        print("📚 Fetching micro-lessons via API (same as Dashboard)...")
        async with httpx.AsyncClient() as client:
            micro_lessons_response = await client.get("http://localhost:8000/api/micro-lessons/")
            micro_lessons = micro_lessons_response.json() if micro_lessons_response.status_code == 200 else []
        
        print(f"  Found {len(micro_lessons)} micro-lessons from API")
        
        # Debug: Print all micro-lesson topics
        print("📋 All micro-lesson topics:")
        for i, lesson in enumerate(micro_lessons):
            print(f"  {i+1}. Topic: '{lesson.get('topic', 'NO_TOPIC')}' - ID: {lesson.get('id')}")
        
        # Process micro-lessons exactly like Dashboard
        for lesson in micro_lessons:
            if lesson.get("topic"):
                topic_key = lesson["topic"]
                if topic_key not in all_topics:
                    all_topics[topic_key] = {
                        "id": topic_key.lower().replace(" ", "_").replace("-", "_").replace("(", "").replace(")", ""),
                        "label": lesson["topic"],
                        "description": lesson.get("content", "")[:100] + "..." if lesson.get("content") else f"Micro-lesson about {lesson['topic']}",
                        "source": "micro_lessons",
                        "module_data": {
                            "module_type": "micro_lessons",
                            "module_id": str(lesson.get("id", "")),
                            "created_at": lesson.get("created_at", ""),
                            "user_id": lesson.get("user_id", "")
                        },
                        "count": 1,
                        "last_activity": lesson.get("created_at", "")
                    }
                    print(f"  + Added topic: {lesson['topic']}")
                else:
                    all_topics[topic_key]["count"] += 1
                    print(f"  ++ Updated topic: {lesson['topic']} (count: {all_topics[topic_key]['count']})")
        
        print("🎥 Fetching videos via API (same as Dashboard)...")
        async with httpx.AsyncClient() as client:
            videos_response = await client.get("http://localhost:8000/api/saved-videos")
            videos_data = videos_response.json() if videos_response.status_code == 200 else {}
            videos = videos_data.get("videos", [])
        
        print(f"  Found {len(videos)} videos from API")
        
        # Process videos exactly like Dashboard
        for video in videos:
            if video.get("topic"):
                topic_key = video["topic"]
                if topic_key not in all_topics:
                    all_topics[topic_key] = {
                        "id": topic_key.lower().replace(" ", "_").replace("-", "_").replace("(", "").replace(")", ""),
                        "label": video["topic"],
                        "description": video.get("description", "")[:100] + "..." if video.get("description") else f"Video about {video['topic']}",
                        "source": "videos",
                        "module_data": {
                            "module_type": "videos",
                            "module_id": str(video.get("id", "")),
                            "created_at": video.get("saved_at", ""),
                            "user_id": video.get("user_id", "")
                        },
                        "count": 1,
                        "last_activity": video.get("saved_at", "")
                    }
                    print(f"  + Added video topic: {video['topic']}")
                else:
                    all_topics[topic_key]["count"] += 1
                    print(f"  ++ Updated video topic: {video['topic']} (count: {all_topics[topic_key]['count']})")
        
        print(f"✅ Total topics extracted: {len(all_topics)}")
        print("📊 Final topics list:")
        for i, (key, topic) in enumerate(all_topics.items()):
            print(f"  {i+1}. Key: '{key}' -> Label: '{topic['label']}' (count: {topic['count']})")
        
        return all_topics
        
    except Exception as e:
        print(f"❌ Error in API calls: {e}")
        # Fallback to direct MongoDB access
        print("🔄 Falling back to direct MongoDB access...")
        return await extract_topics_from_modules_fallback()

async def extract_topics_from_modules_fallback():
    """Fallback function using direct MongoDB access"""
    all_topics = {}
    
    print("🔄 Using fallback: direct MongoDB access...")
    
    # Direct MongoDB access
    micro_lessons = await micro_lessons_collection.find({}).to_list(length=None)
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