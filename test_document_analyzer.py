#!/usr/bin/env python3
"""
Test script for Document Analyzer module
"""

import requests
import json

def test_health_endpoint():
    """Test the health check endpoint"""
    try:
        response = requests.get("http://localhost:8000/api/document-analyzer/health")
        print(f"✅ Health check: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Module: {data.get('module')}")
            print(f"   PDF support: {data.get('pdf_support')}")
            print(f"   DOCX support: {data.get('docx_support')}")
        return True
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False

def test_supported_formats():
    """Test the supported formats endpoint"""
    try:
        response = requests.get("http://localhost:8000/api/document-analyzer/supported-formats")
        print(f"✅ Supported formats: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Supported formats: {data.get('supported_formats')}")
            print(f"   Max files: {data.get('max_files_per_request')}")
            print(f"   Max size: {data.get('max_file_size_mb')} MB")
        return True
    except Exception as e:
        print(f"❌ Supported formats failed: {e}")
        return False

def test_swagger_docs():
    """Test if the Swagger docs are accessible"""
    try:
        response = requests.get("http://localhost:8000/docs")
        print(f"✅ Swagger docs: {response.status_code}")
        if response.status_code == 200:
            print("   Swagger UI accessible")
        return True
    except Exception as e:
        print(f"❌ Swagger docs failed: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Testing Document Analyzer Module")
    print("=" * 40)
    
    # Test health endpoint
    test_health_endpoint()
    print()
    
    # Test supported formats
    test_supported_formats()
    print()
    
    # Test Swagger docs
    test_swagger_docs()
    print()
    
    print("🎯 Test completed!")
    print("\nTo test the full functionality:")
    print("1. Start the backend: python backend/app.py")
    print("2. Start the frontend: npm start (in frontend directory)")
    print("3. Navigate to Document Analyzer in the sidebar")
    print("4. Upload a test document (PDF, DOCX, TXT, or MD)")
