#!/usr/bin/env python3
import requests
import json

def test_cursor_agent_clone():
    """Test the cursor agent clone endpoint to diagnose 400 error"""
    
    url = "http://localhost:8000/api/cursor-agent/clone-repo"
    
    # Test data - using a smaller repo to avoid Windows filename length issues
    test_data = {
        "repo_url": "https://github.com/tiangolo/fastapi",
        "branch": "main"
    }
    
    print("🧪 Testing Cursor Agent Clone Endpoint")
    print("=" * 50)
    print(f"URL: {url}")
    print(f"Data: {json.dumps(test_data, indent=2)}")
    print()
    
    try:
        response = requests.post(url, json=test_data)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        print()
        
        if response.status_code == 200:
            print("✅ SUCCESS!")
            print(f"Response: {json.dumps(response.json(), indent=2)}")
        else:
            print("❌ ERROR!")
            print(f"Error Response: {response.text}")
            
            # Try to parse as JSON for better error details
            try:
                error_json = response.json()
                print(f"Error Details: {json.dumps(error_json, indent=2)}")
            except:
                print(f"Raw Error: {response.text}")
                
    except requests.exceptions.ConnectionError:
        print("❌ Connection Error: Backend not running on localhost:8000")
    except Exception as e:
        print(f"❌ Unexpected Error: {e}")

def test_cursor_agent_endpoints():
    """Test all cursor agent endpoints"""
    
    base_url = "http://localhost:8000"
    
    print("🔍 Testing All Cursor Agent Endpoints")
    print("=" * 50)
    
    # Test 1: Check if endpoints are available
    try:
        response = requests.get(f"{base_url}/docs")
        if response.status_code == 200:
            print("✅ API Documentation accessible")
        else:
            print("❌ API Documentation not accessible")
    except Exception as e:
        print(f"❌ Cannot access API docs: {e}")
    
    # Test 2: Clone endpoint
    print("\n📋 Testing Clone Endpoint...")
    test_cursor_agent_clone()

if __name__ == "__main__":
    test_cursor_agent_endpoints() 