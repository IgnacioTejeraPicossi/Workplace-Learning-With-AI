#!/usr/bin/env python3
"""
Test script for Agent Cursor AI functionality
"""

import asyncio
import sys
import os

# Add the backend directory to the path (from test_cursor: go up to root, then backend)
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from cursor_agent_routes import check_cursor_installation, simulate_documentation_generation

async def test_cursor_installation():
    """Test if Cursor AI is installed"""
    print("🔍 Testing Cursor AI installation...")
    
    try:
        is_installed = await check_cursor_installation()
        if is_installed:
            print("✅ Cursor AI is installed and accessible")
        else:
            print("❌ Cursor AI is not installed or not accessible")
            print("💡 Please install Cursor AI from https://cursor.sh/")
        return is_installed
    except Exception as e:
        print(f"❌ Error checking Cursor AI installation: {e}")
        return False

async def test_documentation_generation():
    """Test documentation generation simulation"""
    print("\n📝 Testing documentation generation...")
    
    try:
        # Create a temporary directory for testing
        import tempfile
        import shutil
        
        temp_dir = tempfile.mkdtemp(prefix="test_cursor_agent_")
        test_repo_path = os.path.join(temp_dir, "test-repo")
        os.makedirs(test_repo_path)
        
        # Test documentation generation
        await simulate_documentation_generation(test_repo_path, "https://github.com/test/repo")
        
        # Check if README was created
        readme_path = os.path.join(test_repo_path, "README.md")
        if os.path.exists(readme_path):
            with open(readme_path, 'r', encoding='utf-8') as f:
                content = f.read()
            print("✅ README.md generated successfully")
            print(f"📄 Content length: {len(content)} characters")
            print("📄 First 200 characters:")
            print(content[:200] + "...")
        else:
            print("❌ README.md was not created")
        
        # Cleanup
        shutil.rmtree(temp_dir)
        return True
        
    except Exception as e:
        print(f"❌ Error testing documentation generation: {e}")
        return False

async def main():
    """Main test function"""
    print("🚀 Testing Agent Cursor AI functionality...\n")
    
    # Test 1: Cursor AI installation
    cursor_installed = await test_cursor_installation()
    
    # Test 2: Documentation generation
    doc_generation_ok = await test_documentation_generation()
    
    # Summary
    print("\n" + "="*50)
    print("📊 TEST SUMMARY")
    print("="*50)
    print(f"Cursor AI Installation: {'✅ PASS' if cursor_installed else '❌ FAIL'}")
    print(f"Documentation Generation: {'✅ PASS' if doc_generation_ok else '❌ FAIL'}")
    
    if cursor_installed and doc_generation_ok:
        print("\n🎉 All tests passed! Agent Cursor AI is ready to use.")
    else:
        print("\n⚠️  Some tests failed. Please check the issues above.")
        
        if not cursor_installed:
            print("\n💡 To install Cursor AI:")
            print("   1. Visit https://cursor.sh/")
            print("   2. Download and install Cursor AI")
            print("   3. Make sure 'cursor' command is available in your PATH")

if __name__ == "__main__":
    asyncio.run(main())
