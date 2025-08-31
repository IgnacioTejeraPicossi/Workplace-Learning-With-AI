from datetime import datetime
import hashlib
from backend.db import micro_lessons_collection, saved_videos_collection, certifications_collection, \
                       simulation_results_collection, career_coach_collection, skills_forecast_collection, \
                       web_search_collection

async def extract_topics_from_modules():
    """Extract unique topics from all modules using existing API endpoints"""
    all_topics = {}
    
    try:
        print("🔍 Starting topic extraction from existing API endpoints...")
        
        # Use the existing micro-lessons endpoint instead of direct MongoDB access
        try:
            import httpx
            async with httpx.AsyncClient() as client:
                # Get micro-lessons from existing endpoint
                print("📚 Fetching micro-lessons from /api/micro-lessons/...")
                micro_response = await client.get("http://localhost:8000/api/micro-lessons/")
                if micro_response.status_code == 200:
                    micro_lessons = micro_response.json()
                    print(f"  Found {len(micro_lessons)} micro-lessons from API")
                    
                    for lesson in micro_lessons:
                        if "topic" in lesson and lesson["topic"]:
                            topic_key = lesson["topic"].lower().replace(" ", "_").replace("-", "_")
                            if topic_key not in all_topics:
                                all_topics[topic_key] = {
                                    "id": topic_key,
                                    "label": lesson["topic"],
                                    "description": lesson.get("content", "")[:100] + "..." if lesson.get("content") else f"Micro-lesson about {lesson['topic']}",
                                    "source": "micro_lessons",
                                    "module_data": {
                                        "module_type": "micro_lessons",
                                        "module_id": str(lesson.get("_id", "")),
                                        "created_at": lesson.get("created_at", ""),
                                        "user_id": lesson.get("user_id", "")
                                    },
                                    "count": 1,
                                    "last_activity": lesson.get("created_at", "")
                                }
                                print(f"  + Added topic: {lesson['topic']} (key: {topic_key})")
                            else:
                                all_topics[topic_key]["count"] += 1
                                # Update last activity if this lesson is more recent
                                if lesson.get("created_at", "") > all_topics[topic_key].get("last_activity", ""):
                                    all_topics[topic_key]["last_activity"] = lesson.get("created_at", "")
                                print(f"  ++ Updated topic: {lesson['topic']} (count: {all_topics[topic_key]['count']})")
                else:
                    print(f"  ❌ Micro-lessons API returned status {micro_response.status_code}")
                
                # Get videos from existing endpoint
                print("🎥 Fetching videos from /api/saved-videos...")
                videos_response = await client.get("http://localhost:8000/api/saved-videos")
                if videos_response.status_code == 200:
                    videos_data = videos_response.json()
                    videos = videos_data.get("videos", []) if isinstance(videos_data, dict) else videos_data
                    print(f"  Found {len(videos)} videos from API")
                    
                    for video in videos:
                        if "topic" in video and video["topic"]:
                            topic_key = video["topic"].lower().replace(" ", "_").replace("-", "_")
                            if topic_key not in all_topics:
                                all_topics[topic_key] = {
                                    "id": topic_key,
                                    "label": video["topic"],
                                    "description": video.get("description", "")[:100] + "..." if video.get("description") else f"Video about {video['topic']}",
                                    "source": "videos",
                                    "module_data": {
                                        "module_type": "videos",
                                        "module_id": str(video.get("_id", "")),
                                        "created_at": video.get("saved_at", ""),
                                        "user_id": video.get("user_id", "")
                                    },
                                    "count": 1,
                                    "last_activity": video.get("saved_at", "")
                                }
                                print(f"  + Added topic: {video['topic']} (key: {topic_key})")
                            else:
                                all_topics[topic_key]["count"] += 1
                                # Update last activity if this video is more recent
                                if video.get("saved_at", "") > all_topics[topic_key].get("last_activity", ""):
                                    all_topics[topic_key]["last_activity"] = video.get("saved_at", "")
                                print(f"  ++ Updated topic: {video['topic']} (count: {all_topics[topic_key]['count']})")
                else:
                    print(f"  ❌ Videos API returned status {videos_response.status_code}")
                    
        except Exception as api_error:
            print(f"❌ Error using API endpoints: {api_error}")
            print("🔄 Falling back to direct MongoDB access...")
            
            # Fallback to direct MongoDB access (original method)
            from backend.db import micro_lessons_collection, saved_videos_collection, certifications_collection, \
                               simulation_results_collection, career_coach_collection, skills_forecast_collection, \
                               web_search_collection
            
            # Extract from micro-lessons
            print("📚 Checking micro-lessons collection...")
            micro_lessons = await micro_lessons_collection.find({}, {"topic": 1, "title": 1, "content": 1, "created_at": 1, "user_id": 1}).to_list(length=None)
            print(f"  Found {len(micro_lessons)} micro-lessons")
            
            for lesson in micro_lessons:
                if "topic" in lesson and lesson["topic"]:
                    topic_key = lesson["topic"].lower().replace(" ", "_").replace("-", "_")
                    if topic_key not in all_topics:
                        all_topics[topic_key] = {
                            "id": topic_key,
                            "label": lesson["topic"],
                            "description": lesson.get("content", "")[:100] + "..." if lesson.get("content") else f"Micro-lesson about {lesson['topic']}",
                            "source": "micro_lessons",
                            "module_data": {
                                "module_type": "micro_lessons",
                                "module_id": str(lesson.get("_id", "")),
                                "created_at": lesson.get("created_at", ""),
                                "user_id": lesson.get("user_id", "")
                            },
                            "count": 1,
                            "last_activity": lesson.get("created_at", "")
                        }
                        print(f"  + Added topic: {lesson['topic']} (key: {topic_key})")
                    else:
                        all_topics[topic_key]["count"] += 1
                        # Update last activity if this lesson is more recent
                        if lesson.get("created_at", "") > all_topics[topic_key].get("last_activity", ""):
                            all_topics[topic_key]["last_activity"] = lesson.get("created_at", "")
                        print(f"  ++ Updated topic: {lesson['topic']} (count: {all_topics[topic_key]['count']})")
            
            # Extract from videos
            print("🎥 Checking videos collection...")
            videos = await saved_videos_collection.find({}, {"topic": 1, "title": 1, "description": 1, "saved_at": 1, "user_id": 1}).to_list(length=None)
            print(f"  Found {len(videos)} videos")
            
            for video in videos:
                if "topic" in video and video["topic"]:
                    topic_key = video["topic"].lower().replace(" ", "_").replace("-", "_")
                    if topic_key not in all_topics:
                        all_topics[topic_key] = {
                            "id": topic_key,
                            "label": video["topic"],
                            "description": video.get("description", "")[:100] + "..." if video.get("description") else f"Video about {video['topic']}",
                            "source": "videos",
                            "module_data": {
                                "module_type": "videos",
                                "module_id": str(video.get("_id", "")),
                                "created_at": video.get("saved_at", ""),
                                "user_id": video.get("user_id", "")
                            },
                            "count": 1,
                            "last_activity": video.get("saved_at", "")
                        }
                        print(f"  + Added topic: {video['topic']} (key: {topic_key})")
                    else:
                        all_topics[topic_key]["count"] += 1
                        # Update last activity if this video is more recent
                        if video.get("saved_at", "") > all_topics[topic_key].get("last_activity", ""):
                            all_topics[topic_key]["last_activity"] = video.get("saved_at", "")
                        print(f"  ++ Updated topic: {video['topic']} (count: {all_topics[topic_key]['count']})")
        
        print(f"📊 Extraction complete: {len(all_topics)} unique topics found")
        if all_topics:
            print("📋 Final topics:")
            for topic_id, topic_data in all_topics.items():
                print(f"  - {topic_id}: {topic_data['label']} (source: {topic_data['source']}, count: {topic_data['count']})")
        
        return all_topics
        
    except Exception as e:
        print(f"❌ Error extracting topics from modules: {e}")
        import traceback
        traceback.print_exc()
        return {}

def generate_topic_embedding(topic_text):
    """Generate a simple embedding vector for a topic"""
    hash_obj = hashlib.md5(topic_text.encode())
    hash_hex = hash_obj.hexdigest()
    
    # Convert hex to 10-dimensional vector
    embedding = []
    for i in range(0, 20, 2):
        val = int(hash_hex[i:i+2], 16) / 255.0
        embedding.append(val)
    
    return embedding[:10]  # Return 10-dimensional vector

def generate_dynamic_categories(topics):
    """Generate dynamic categories based on actual topics using pattern matching"""
    if not topics:
        return {}
    
    print("🔍 Generating dynamic categories from topics...")
    
    # Initialize category buckets
    categories = {
        "Programming & Development": [],
        "AI & Machine Learning": [],
        "Development Tools": [],
        "Web Technologies": [],
        "Data & Analytics": [],
        "General Skills": []
    }
    
    # Pattern matching for categorization
    for topic_id, topic_data in topics.items():
        topic_label = topic_data["label"].lower()
        
        # Programming & Development
        if any(word in topic_label for word in ['python', 'javascript', 'java', 'pascal', 'programming', 'code', 'development']):
            categories["Programming & Development"].append(topic_id)
            print(f"  📝 {topic_data['label']} → Programming & Development")
            
        # AI & Machine Learning
        elif any(word in topic_label for word in ['ai', 'machine learning', 'llm', 'openai', 'rag', 'agentic', 'chatgpt', 'artificial intelligence']):
            categories["AI & Machine Learning"].append(topic_id)
            print(f"  🤖 {topic_data['label']} → AI & Machine Learning")
            
        # Development Tools
        elif any(word in topic_label for word in ['studio', 'localhost', 'port', 'tool', 'ide', 'environment']):
            categories["Development Tools"].append(topic_id)
            print(f"  🛠️ {topic_data['label']} → Development Tools")
            
        # Web Technologies
        elif any(word in topic_label for word in ['web', 'api', 'http', 'url', 'frontend', 'backend']):
            categories["Web Technologies"].append(topic_id)
            print(f"  🌐 {topic_data['label']} → Web Technologies")
            
        # Data & Analytics
        elif any(word in topic_label for word in ['data', 'analytics', 'science', 'database', 'sql', 'nosql']):
            categories["Data & Analytics"].append(topic_id)
            print(f"  📊 {topic_data['label']} → Data & Analytics")
            
        # General Skills (fallback)
        else:
            categories["General Skills"].append(topic_id)
            print(f"  📚 {topic_data['label']} → General Skills")
    
    # Remove empty categories
    categories = {k: v for k, v in categories.items() if v}
    
    print(f"✅ Generated {len(categories)} dynamic categories:")
    for category, topic_ids in categories.items():
        print(f"  - {category}: {len(topic_ids)} topics")
    
    return categories

def categorize_topic(topic_text):
    """Automatically categorize a topic based on keywords"""
    topic_lower = topic_text.lower()
    
    if any(word in topic_lower for word in ['ai', 'machine learning', 'data', 'programming', 'technology', 'python', 'javascript', 'code']):
        return "AI & Technology"
    elif any(word in topic_lower for word in ['leadership', 'management', 'team', 'project', 'agile', 'scrum', 'conflict resolution']):
        return "Leadership & Management"
    elif any(word in topic_lower for word in ['business', 'sales', 'customer', 'negotiation', 'strategy', 'service']):
        return "Business & Sales"
    elif any(word in topic_lower for word in ['communication', 'presentation', 'writing', 'speaking', 'listening']):
        return "Communication Skills"
    elif any(word in topic_lower for word in ['java', 'localhost', 'port', 'rag', 'retrieval', 'generation']):
        return "General Skills"
    else:
        return "General Skills"
