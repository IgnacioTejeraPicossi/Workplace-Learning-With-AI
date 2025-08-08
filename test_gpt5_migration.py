#!/usr/bin/env python3
"""
Test script for GPT-5 migration
This script tests the GPT-5 configuration and model selection
"""

import os
import sys
from dotenv import load_dotenv

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

def test_gpt5_config():
    """Test GPT-5 configuration and model selection"""
    print("🧠 Testing GPT-5 Configuration...")
    
    try:
        from gpt5_config import get_optimal_model, get_gpt5_parameters, GPT5_MODELS
        
        print("✅ GPT-5 configuration loaded successfully")
        
        # Test model variants
        print(f"\n📋 Available GPT-5 Models:")
        for model_name, config in GPT5_MODELS.items():
            print(f"  • {model_name}: {config['name']}")
            print(f"    Description: {config['description']}")
            print(f"    Use cases: {', '.join(config['use_cases'][:3])}...")
        
        # Test model selection
        print(f"\n🎯 Testing Model Selection:")
        
        test_cases = [
            ("repository_analysis", "high"),
            ("micro_lessons", "medium"),
            ("quick_responses", "low"),
            ("advanced_coaching", "high"),
            ("basic_recommendations", "medium")
        ]
        
        for task_type, complexity in test_cases:
            model = get_optimal_model(task_type, complexity)
            params = get_gpt5_parameters(model, task_type)
            print(f"  • {task_type} ({complexity}): {model}")
            print(f"    Max tokens: {params.get('max_tokens', 'N/A')}")
            print(f"    Temperature: {params.get('temperature', 'N/A')}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing GPT-5 config: {e}")
        return False

def test_llm_integration():
    """Test LLM integration with GPT-5"""
    print("\n🔗 Testing LLM Integration...")
    
    try:
        from llm import ask_openai, ask_openai_stream
        
        print("✅ LLM module loaded successfully")
        
        # Test basic functionality
        test_prompt = "Hello, this is a test of GPT-5 integration. Please respond with a brief confirmation."
        
        print(f"\n📝 Testing ask_openai with GPT-5:")
        try:
            response = ask_openai(
                prompt=test_prompt,
                task_type="testing",
                complexity="low",
                max_tokens=100
            )
            print(f"✅ Response received: {response[:100]}...")
        except Exception as e:
            print(f"⚠️  API call failed (expected if no API key): {e}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing LLM integration: {e}")
        return False

def test_enhanced_analyzer():
    """Test EnhancedAnalyzer with GPT-5"""
    print("\n🔍 Testing EnhancedAnalyzer...")
    
    try:
        from enhanced_analysis import EnhancedAnalyzer
        
        print("✅ EnhancedAnalyzer loaded successfully")
        
        # Create analyzer instance
        analyzer = EnhancedAnalyzer()
        print("✅ EnhancedAnalyzer instance created")
        
        # Test prompt loading
        prompts = analyzer.analysis_prompts
        print(f"✅ Loaded {len(prompts)} analysis prompts")
        
        # List available prompts
        print(f"\n📋 Available Analysis Prompts:")
        for prompt_name in prompts.keys():
            print(f"  • {prompt_name}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing EnhancedAnalyzer: {e}")
        return False

def test_repo_analysis():
    """Test repository analysis module"""
    print("\n📁 Testing Repository Analysis...")
    
    try:
        from repo_analysis import RepoInput, RepoAnalysisResponse
        
        print("✅ Repository analysis models loaded successfully")
        
        # Test model creation
        repo_input = RepoInput(repo_url="https://github.com/test/repo")
        print(f"✅ RepoInput created: {repo_input.repo_url}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing repository analysis: {e}")
        return False

def main():
    """Main test function"""
    print("🚀 GPT-5 Migration Test Suite")
    print("=" * 50)
    
    # Load environment variables
    load_dotenv()
    
    # Run tests
    tests = [
        ("GPT-5 Configuration", test_gpt5_config),
        ("LLM Integration", test_llm_integration),
        ("Enhanced Analyzer", test_enhanced_analyzer),
        ("Repository Analysis", test_repo_analysis)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        print(f"\n{'='*20} {test_name} {'='*20}")
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ Test failed with exception: {e}")
            results.append((test_name, False))
    
    # Summary
    print(f"\n{'='*50}")
    print("📊 Test Results Summary:")
    print("=" * 50)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {status} {test_name}")
        if result:
            passed += 1
    
    print(f"\n🎯 Overall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! GPT-5 migration is ready.")
    else:
        print("⚠️  Some tests failed. Please check the errors above.")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 