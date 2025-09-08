from datetime import datetime
import hashlib
from backend.db import database, saved_videos_collection, certifications_collection, \
                       simulation_results_collection, career_coach_collection, skills_forecast_collection, \
                       web_search_collection

async def extract_topics_from_modules(user_id: str = None):
    """Extract unique topics using direct MongoDB access for better performance"""
    all_topics = {}
    
    print(f"🔍 Starting topic extraction using direct MongoDB access for user: {user_id}")
    
    try:
        # Direct MongoDB access - much faster than HTTP calls
        print("📚 Fetching micro-lessons from MongoDB...")
        
        # Micro-lessons are global (shared between users), so we get all of them
        micro_lessons = await database.micro_lessons_collection.find({}).to_list(length=None)
        print(f"  Found {len(micro_lessons)} micro-lessons from MongoDB (global)")
        
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

async def extract_topics_from_modules_fallback(user_id: str = None):
    """Fallback function using direct MongoDB access"""
    all_topics = {}
    
    print(f"🔄 Using fallback: direct MongoDB access for user: {user_id}")
    
    # Direct MongoDB access - micro-lessons are global
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

# Cache for topic categorization to avoid repeated AI calls
_topic_category_cache = {}

def clear_topic_cache():
    """Clear the topic categorization cache"""
    global _topic_category_cache
    _topic_category_cache.clear()
    print("🧹 Topic categorization cache cleared")

def categorize_topic(topic_label):
    """Categorize a topic using cached pattern matching (fast) with optional AI batch processing"""
    # Check cache first
    if topic_label in _topic_category_cache:
        return _topic_category_cache[topic_label]
    
    # Use fast pattern matching (no AI calls for individual topics)
    topic_lower = topic_label.lower()
    
    if any(word in topic_lower for word in ['python', 'javascript', 'java', 'pascal', 'programming', 'code', 'development']):
        category = 'Programming & Development'
    elif any(word in topic_lower for word in ['ai', 'machine learning', 'llm', 'openai', 'rag', 'agentic', 'chatgpt', 'artificial intelligence']):
        category = 'AI & Machine Learning'
    elif any(word in topic_lower for word in ['studio', 'localhost', 'port', 'tool', 'ide', 'environment']):
        category = 'Development Tools'
    elif any(word in topic_lower for word in ['web', 'api', 'http', 'url', 'frontend', 'backend']):
        category = 'Web Technologies'
    elif any(word in topic_lower for word in ['data', 'analytics', 'science', 'database', 'sql', 'nosql']):
        category = 'Data & Analytics'
    else:
        category = 'General Skills'
    
    # Cache the result
    _topic_category_cache[topic_label] = category
    return category

def generate_dynamic_categories(topics):
    """Generate dynamic categories using fast pattern matching (optimized for performance)"""
    if not topics:
        return {}
    
    # Use fast pattern matching (no AI calls for better performance)
    categories = {
        "Programming & Development": [],
        "AI & Machine Learning": [],
        "Development Tools": [],
        "Web Technologies": [],
        "Data & Analytics": [],
        "General Skills": []
    }
    
    # Process all topics at once using cached categorization
    for topic_id, topic_data in topics.items():
        topic_label = topic_data.get("label", "")
        category = categorize_topic(topic_label)  # Uses cache
        categories[category].append(topic_id)
    
    # Return only categories that have topics
    result = {k: v for k, v in categories.items() if v}
    print(f"⚡ Fast categorization: {len(result)} categories with {sum(len(v) for v in result.values())} topics")
    return result

def generate_ai_recommendations(user_topics, all_topics, user_mastery_scores):
    """Generate fast learning recommendations using pattern-based analysis (optimized for performance)"""
    # Fast pattern-based recommendations (no AI calls for better performance)
    recommendations = []
    
    # Add topics with low mastery (0-30%) - prioritize these
    low_mastery_topics = []
    for topic_id, mastery in user_mastery_scores.items():
        if mastery <= 30 and topic_id in all_topics:
            topic_label = all_topics[topic_id].get('label', '')
            if topic_label:
                low_mastery_topics.append((topic_label, mastery))
    
    # Sort by mastery level (lowest first)
    low_mastery_topics.sort(key=lambda x: x[1])
    recommendations.extend([topic[0] for topic in low_mastery_topics[:3]])
    
    # Add new topics not yet started
    new_topics = []
    for topic_id, topic_data in all_topics.items():
        if topic_id not in user_mastery_scores:
            topic_label = topic_data.get('label', '')
            if topic_label and topic_label not in recommendations:
                new_topics.append(topic_label)
    
    # Add new topics (limit to avoid too many)
    recommendations.extend(new_topics[:2])
    
    # Remove duplicates while preserving order
    seen = set()
    unique_recommendations = []
    for rec in recommendations:
        if rec not in seen:
            seen.add(rec)
            unique_recommendations.append(rec)
    
    # Limit to 5 recommendations
    result = unique_recommendations[:5]
    print(f"⚡ Fast recommendations: {len(result)} topics")
    return result