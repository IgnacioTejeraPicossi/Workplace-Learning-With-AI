#!/usr/bin/env python3
"""
Test script to check OpenAI API key configuration
"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Check if API key exists
api_key = os.getenv("OPENAI_API_KEY")

print("🔍 OpenAI API Key Status:")
print(f"API Key exists: {'Yes' if api_key else 'No'}")
print(f"API Key length: {len(api_key) if api_key else 0}")
print(f"API Key starts with 'sk-': {'Yes' if api_key and api_key.startswith('sk-') else 'No'}")

if not api_key:
    print("\n❌ No API key found!")
    print("Please create a .env file in the backend directory with:")
    print("OPENAI_API_KEY=your-actual-api-key-here")
elif not api_key.startswith('sk-'):
    print("\n❌ Invalid API key format!")
    print("API key should start with 'sk-'")
else:
    print("\n✅ API key looks valid!")
    print("You can now test the Generate Script feature.") 