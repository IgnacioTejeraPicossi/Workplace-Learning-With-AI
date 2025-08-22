from datetime import datetime
import hashlib
from backend.db import micro_lessons_collection, saved_videos_collection, certifications_collection, \
                       simulation_results_collection, career_coach_collection, skills_forecast_collection, \
                       web_search_collection

async def extract_topics_from_modules():
    """Extract unique topics from all modules in MongoDB"""
    all_topics = {}
    
    try:
        # Extract from micro-lessons
        micro_lessons = await micro_lessons_collection.find({}, {"topic": 1, "title": 1, "content": 1, "created_at": 1}).to_list(length=None)
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
                            "created_at": lesson.get("created_at", "")
                        },
                        "count": 1
                    }
                else:
                    all_topics[topic_key]["count"] += 1
        
        # Extract from videos
        videos = await saved_videos_collection.find({}, {"topic": 1, "title": 1, "description": 1, "saved_at": 1}).to_list(length=None)
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
                            "created_at": video.get("saved_at", "")
                        },
                        "count": 1
                    }
                else:
                    all_topics[topic_key]["count"] += 1
        
        # Extract from certifications
        certifications = await certifications_collection.find({}, {"topics": 1, "title": 1, "description": 1, "created_at": 1}).to_list(length=None)
        for cert in certifications:
            if "topics" in cert and cert["topics"]:
                for topic in cert["topics"]:
                    if topic:
                        topic_key = topic.lower().replace(" ", "_").replace("-", "_")
                        if topic_key not in all_topics:
                            all_topics[topic_key] = {
                                "id": topic_key,
                                "label": topic,
                                "description": cert.get("description", "")[:100] + "..." if cert.get("description") else f"Certification in {topic}",
                                "source": "certifications",
                                "module_data": {
                                    "module_type": "certifications",
                                    "module_id": str(cert.get("_id", "")),
                                    "created_at": cert.get("created_at", "")
                                },
                                "count": 1
                            }
                        else:
                            all_topics[topic_key]["count"] += 1
        
        # Extract from simulations
        simulations = await simulation_results_collection.find({}, {"topic": 1, "title": 1, "description": 1, "created_at": 1}).to_list(length=None)
        for sim in simulations:
            if "topic" in sim and sim["topic"]:
                topic_key = sim["topic"].lower().replace(" ", "_").replace("-", "_")
                if topic_key not in all_topics:
                    all_topics[topic_key] = {
                        "id": topic_key,
                        "label": sim["topic"],
                        "description": sim.get("description", "")[:100] + "..." if sim.get("description") else f"Simulation about {sim['topic']}",
                        "source": "simulations",
                        "module_data": {
                            "module_type": "simulations",
                            "module_id": str(sim.get("_id", "")),
                            "created_at": sim.get("created_at", "")
                        },
                        "count": 1
                    }
                else:
                    all_topics[topic_key]["count"] += 1
        
        # Extract from career coach sessions
        coach_sessions = await career_coach_collection.find({}, {"topic": 1, "title": 1, "content": 1, "created_at": 1}).to_list(length=None)
        for session in coach_sessions:
            if "topic" in session and session["topic"]:
                topic_key = session["topic"].lower().replace(" ", "_").replace("-", "_")
                if topic_key not in all_topics:
                    all_topics[topic_key] = {
                        "id": topic_key,
                        "label": session["topic"],
                        "description": session.get("content", "")[:100] + "..." if session.get("content") else f"Career coaching session about {session['topic']}",
                        "source": "career_coach",
                        "module_data": {
                            "module_type": "career_coach",
                            "module_id": str(session.get("_id", "")),
                            "created_at": session.get("created_at", "")
                        },
                        "count": 1
                    }
                else:
                    all_topics[topic_key]["count"] += 1
        
        # Extract from skills forecasts
        skills_forecasts = await skills_forecast_collection.find({}, {"industry": 1, "title": 1, "description": 1, "created_at": 1}).to_list(length=None)
        for forecast in skills_forecasts:
            if "industry" in forecast and forecast["industry"]:
                topic_key = forecast["industry"].lower().replace(" ", "_").replace("-", "_")
                if topic_key not in all_topics:
                    all_topics[topic_key] = {
                        "id": topic_key,
                        "label": forecast["industry"],
                        "description": forecast.get("description", "")[:100] + "..." if forecast.get("description") else f"Skills forecast for {forecast['industry']}",
                        "source": "skills_forecast",
                        "module_data": {
                            "module_type": "skills_forecast",
                            "module_id": str(forecast.get("_id", "")),
                            "created_at": forecast.get("created_at", "")
                        },
                        "count": 1
                    }
                else:
                    all_topics[topic_key]["count"] += 1
        
        # Extract from web search results
        web_searches = await web_search_collection.find({}, {"topic": 1, "title": 1, "snippet": 1, "created_at": 1}).to_list(length=None)
        for search in web_searches:
            if "topic" in search and search["topic"]:
                topic_key = search["topic"].lower().replace(" ", "_").replace("-", "_")
                if topic_key not in all_topics:
                    all_topics[topic_key] = {
                        "id": topic_key,
                        "label": search["topic"],
                        "description": search.get("snippet", "")[:100] + "..." if search.get("snippet") else f"Web search results for {search['topic']}",
                        "source": "web_search",
                        "module_data": {
                            "module_type": "web_search",
                            "module_id": str(search.get("_id", "")),
                            "created_at": search.get("created_at", "")
                        },
                        "count": 1
                    }
                else:
                    all_topics[topic_key]["count"] += 1
        
        print(f"📊 Extracted {len(all_topics)} unique topics from MongoDB modules")
        return all_topics
        
    except Exception as e:
        print(f"❌ Error extracting topics from modules: {e}")
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

def categorize_topic(topic_text):
    """Automatically categorize a topic based on keywords"""
    topic_lower = topic_text.lower()
    
    if any(word in topic_lower for word in ['ai', 'machine learning', 'data', 'programming', 'technology', 'python', 'javascript', 'code']):
        return "AI & Technology"
    elif any(word in topic_lower for word in ['leadership', 'management', 'team', 'project', 'agile', 'scrum']):
        return "Leadership & Management"
    elif any(word in topic_lower for word in ['business', 'sales', 'customer', 'negotiation', 'strategy']):
        return "Business & Sales"
    elif any(word in topic_lower for word in ['communication', 'presentation', 'writing', 'speaking']):
        return "Communication Skills"
    elif any(word in topic_lower for word in ['conflict', 'resolution', 'mediation']):
        return "Conflict Resolution"
    else:
        return "General Skills"
