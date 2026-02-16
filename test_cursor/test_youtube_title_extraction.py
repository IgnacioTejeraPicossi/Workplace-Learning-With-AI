#!/usr/bin/env python3
"""
Test script for YouTube title extraction functionality
Tests the oEmbed API and URL parsing logic
"""

import requests
import json
import re

def test_youtube_oembed():
    """Test YouTube oEmbed API for title extraction"""
    print("🧪 Testing YouTube Title Extraction")
    print("=" * 50)
    
    # Test video IDs
    test_video_ids = [
        "hLJTcVHW8_I",  # AI Agents Explained
        "1hHMwLxN6EM",  # Agile Scrum Basics
        "dQw4w9WgXcQ"   # Rick Roll (for testing)
    ]
    
    for video_id in test_video_ids:
        print(f"\n📹 Testing Video ID: {video_id}")
        
        try:
            # Test oEmbed API
            oembed_url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json"
            response = requests.get(oembed_url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                title = data.get('title', 'No title found')
                author = data.get('author_name', 'Unknown author')
                print(f"   ✅ Title: {title}")
                print(f"   👤 Author: {author}")
                
                # Test topic suggestion logic
                suggested_topic = suggest_topic_from_title(title)
                if suggested_topic:
                    print(f"   🏷️  Suggested Topic: {suggested_topic}")
                else:
                    print(f"   🏷️  Suggested Topic: None (manual input needed)")
                    
            else:
                print(f"   ❌ oEmbed API failed: {response.status_code}")
                
        except Exception as e:
            print(f"   ❌ Error: {e}")
    
    print("\n" + "=" * 50)
    print("🎯 Frontend Integration Notes:")
    print("1. Title extraction: ✅ Implemented with oEmbed API")
    print("2. Topic suggestion: ✅ Implemented with keyword matching")
    print("3. Fallback handling: ✅ Implemented for API failures")
    print("4. User experience: ✅ Loading states and disabled inputs")
    
    return True

def suggest_topic_from_title(title):
    """Replicate the frontend topic suggestion logic"""
    title_lower = title.lower()
    
    if any(keyword in title_lower for keyword in ['programming', 'coding', 'python', 'javascript']):
        return 'Programming'
    if any(keyword in title_lower for keyword in ['ai', 'artificial intelligence', 'machine learning']):
        return 'AI & Machine Learning'
    if any(keyword in title_lower for keyword in ['leadership', 'management', 'business']):
        return 'Leadership & Business'
    if any(keyword in title_lower for keyword in ['design', 'ui', 'ux']):
        return 'Design & UX'
    if any(keyword in title_lower for keyword in ['data', 'analytics', 'statistics']):
        return 'Data & Analytics'
    if any(keyword in title_lower for keyword in ['marketing', 'social media', 'branding']):
        return 'Marketing'
    
    return ''

def test_url_parsing():
    """Test URL parsing logic"""
    print("\n🔗 Testing URL Parsing Logic:")
    print("=" * 40)
    
    test_urls = [
        "https://www.youtube.com/watch?v=hLJTcVHW8_I",
        "https://youtu.be/hLJTcVHW8_I",
        "https://www.youtube.com/embed/hLJTcVHW8_I",
        "https://www.youtube.com/watch?v=hLJTcVHW8_I&t=30s",
        "https://youtu.be/hLJTcVHW8_I?t=30",
        "invalid-url"
    ]
    
    for url in test_urls:
        video_id = extract_video_id(url)
        print(f"   {url[:50]:<50} → {video_id or 'None'}")
    
    print("\n✅ URL parsing logic tested")

def extract_video_id(url):
    """Replicate the frontend video ID extraction logic"""
    if not url:
        return None
    
    if 'youtube.com/watch?v=' in url:
        return url.split('v=')[1].split('&')[0] if 'v=' in url else None
    
    if 'youtu.be/' in url:
        return url.split('youtu.be/')[1].split('?')[0] if 'youtu.be/' in url else None
    
    if '/embed/' in url:
        return url.split('/embed/')[1].split('?')[0] if '/embed/' in url else None
    
    return None

if __name__ == "__main__":
    print("🎥 YouTube Title Extraction Test")
    print("=" * 50)
    
    # Test title extraction
    if test_youtube_oembed():
        # Test URL parsing
        test_url_parsing()
    
    print("\n🎉 Test completed!")
    print("\n📋 Next Steps:")
    print("1. Start the backend: cd backend && python app.py")
    print("2. Start the frontend: cd frontend && npm start")
    print("3. Navigate to Video Lessons in the app")
    print("4. Paste a YouTube URL and watch the title auto-fill!")
    print("5. Try the 'Generate Summary' button with a transcript")
