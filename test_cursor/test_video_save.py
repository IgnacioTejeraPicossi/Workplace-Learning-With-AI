#!/usr/bin/env python3
"""
Test script to verify video saving functionality
"""

import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_save_video():
    """Test the video saving endpoint"""
    
    # Test data
    video_data = {
        "title": "Test Video",
        "description": "This is a test video description",
        "topic": "Testing",
        "url": "https://www.youtube.com/embed/test123",
        "duration": "10:00"
    }
    
    print("🧪 Testing video save endpoint...")
    print(f"📡 URL: {BASE_URL}/api/saved-videos")
    print(f"📝 Data: {json.dumps(video_data, indent=2)}")
    
    try:
        # Test POST request
        response = requests.post(
            f"{BASE_URL}/api/saved-videos",
            json=video_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"📊 Status Code: {response.status_code}")
        print(f"📄 Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Success! Response: {json.dumps(result, indent=2)}")
        else:
            print(f"❌ Error! Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection Error: Backend server not running")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

def test_get_videos():
    """Test getting saved videos"""
    
    print("\n🧪 Testing get videos endpoint...")
    print(f"📡 URL: {BASE_URL}/api/saved-videos")
    
    try:
        response = requests.get(f"{BASE_URL}/api/saved-videos")
        
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Success! Found {len(result.get('videos', []))} videos")
            print(f"📄 Response: {json.dumps(result, indent=2)}")
        else:
            print(f"❌ Error! Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection Error: Backend server not running")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

if __name__ == "__main__":
    print("🚀 Video Save Test Script")
    print("=" * 50)
    
    test_save_video()
    test_get_videos()
    
    print("\n🎉 Test completed!")
