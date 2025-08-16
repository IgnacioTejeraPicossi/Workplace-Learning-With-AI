# This file will handle OpenAI GPT-5 configuration and integration 

import os
from dotenv import load_dotenv
import openai
from backend.prompts import CLASSIFY_UNKNOWN_INTENT, GENERATE_SCAFFOLD_PROMPT
from backend.gpt5_config import get_optimal_model, get_gpt5_parameters

load_dotenv()  # Loads .env file if present

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

def ask_openai(prompt=None, task_type=None, complexity="medium", max_tokens=512, messages=None):
    """
    Enhanced OpenAI function with GPT-5 model selection and optimization.
    
    Args:
        prompt: The prompt to send
        task_type: Type of task for optimal model selection
        complexity: Task complexity (low, medium, high)
        max_tokens: Maximum tokens for response
        messages: Alternative to prompt for conversation format
    """
    if not OPENAI_API_KEY or OPENAI_API_KEY.strip() == "":
        # No key found, return mock response
        if prompt:
            return f"[MOCKED RESPONSE] This would be the AI's answer to: {prompt[:60]}..."
        elif messages:
            return f"[MOCKED RESPONSE] This would be the AI's answer to: {messages[-1]['content'][:60]}..."
        else:
            return "[MOCKED RESPONSE] No prompt or messages provided."
    
    try:
        # Get optimal GPT-5 model and parameters
        model = get_optimal_model(task_type, complexity)
        params = get_gpt5_parameters(model, task_type)
        
        # Extract model from params and remove it to avoid conflict
        model_to_use = params.pop("model", model)
        
        # Override max_tokens if provided
        if max_tokens:
            params["max_tokens"] = max_tokens
        
        # Use old OpenAI syntax for compatibility with openai==0.28.1
        openai.api_key = OPENAI_API_KEY
        
        if messages:
            response = openai.ChatCompletion.create(
                model=model_to_use,
                messages=messages,
                **params
            )
        else:
            response = openai.ChatCompletion.create(
                model=model_to_use,
                messages=[{"role": "user", "content": prompt}],
                **params
            )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"[MOCKED RESPONSE - Error: {str(e)}] This would be the AI's answer to: {prompt[:60]}..." 

def ask_openai_stream(prompt=None, task_type=None, complexity="medium", max_tokens=512, messages=None):
    """
    Enhanced streaming OpenAI function with GPT-5 model selection.
    """
    if not OPENAI_API_KEY or OPENAI_API_KEY.strip() == "":
        # No key found, yield a mock response for testing
        mock_response = f"""I'm your AI Study Buddy powered by GPT-5! Here's a helpful response to your question:

"{prompt or 'Hello'}"

This is a mock response since no OpenAI API key is configured. In a real environment, I would provide detailed, AI-powered answers about workplace learning, micro-lessons, career development, and other topics.

To get real AI responses, please configure your OPENAI_API_KEY in the .env file.

For now, here are some general tips:
- Micro-lessons are bite-sized learning modules designed for quick consumption
- AI can help personalize learning paths based on your goals
- Skills forecasting uses data to predict future learning needs
- Scenario simulations provide hands-on practice in safe environments

Would you like to know more about any specific feature?"""
        
        # Stream the mock response character by character to simulate real streaming
        for char in mock_response:
            yield char
        return
    
    # If we have an API key, try to use OpenAI with GPT-5
    try:
        # Get optimal GPT-5 model and parameters
        model = get_optimal_model(task_type, complexity)
        params = get_gpt5_parameters(model, task_type)
        
        # Extract model from params and remove it to avoid conflict
        model_to_use = params.pop("model", model)
        
        # Override max_tokens if provided
        if max_tokens:
            params["max_tokens"] = max_tokens
        
        # Use old OpenAI syntax for compatibility with openai==0.28.1
        openai.api_key = OPENAI_API_KEY
        
        if messages:
            response = openai.ChatCompletion.create(
                model=model_to_use,
                messages=messages,
                stream=True,
                **params
            )
        else:
            response = openai.ChatCompletion.create(
                model=model_to_use,
                messages=[{"role": "user", "content": prompt}],
                stream=True,
                **params
            )
        for chunk in response:
            if hasattr(chunk, 'choices') and chunk.choices:
                delta = chunk.choices[0].delta
                content = getattr(delta, 'content', None)
                if content:
                    yield content
    except Exception as e:
        # Fallback to mock response if API call fails
        mock_response = f"Sorry, I encountered an error: {str(e)}. Here's a helpful response instead:\n\n"
        mock_response += f"Regarding your question about '{prompt or 'learning'}', here are some general insights:\n"
        mock_response += "- Micro-lessons are bite-sized learning modules\n"
        mock_response += "- AI can personalize your learning experience\n"
        mock_response += "- Skills forecasting helps plan your career path\n"
        mock_response += "- Scenario simulations provide hands-on practice\n\n"
        mock_response += "Would you like to know more about any specific topic?"
        
        for char in mock_response:
            yield char

def web_search_query(query):
    """
    Enhanced web search with GPT-5 model selection.
    """
    # Use GPT-5-mini for web search (fast and cost-effective)
    model = get_optimal_model("web_search", "medium")
    params = get_gpt5_parameters(model, "web_search")
    
    response = openai.ChatCompletion.create(
        model=model,
        messages=[{"role": "user", "content": query}],
        tools=[{"type": "web_search"}],
        tool_choice="auto",
        **params
    )
    return response.choices[0].message.content 

import json

ROUTER_PROMPT = """
You are an AI router in a workplace learning platform powered by GPT-5.
A user sends a free-form request. Your job is to determine which module should handle it.

Available modules:
- concepts: Generate 3 learning concepts
- microlesson: Generate a short learning module with quiz
- simulation: Create a scenario-based training simulation
- recommendation: Suggest what to learn next
- certification: Recommend and plan for official certification
- coach: Career advice and planning
- forecast: Skill prediction and development advice
- videolesson: Show a video-based lesson with quiz

Respond with:
{ \"module\": \"<module_name>\", \"reason\": \"<why this module is a good fit>\" }

User query:
\"{query}\"
"""

async def call_llm_router(query):
    # Use the classifier to get intent and confidence
    classification = classify_intent(query)
    confidence = classification.get('confidence', 'Low')
    module = classification.get('module_match')
    reason = classification.get('intent')
    if confidence == 'High' and module:
        return {"module": module, "reason": reason, "confidence": confidence}
    else:
        return {"module": None, "reason": reason, "confidence": confidence} 

def classify_intent(user_input: str) -> dict:
    """Classify a user's unknown request and return structured insight using GPT-5."""
    prompt = CLASSIFY_UNKNOWN_INTENT.format(user_input=user_input)
    
    # Check if we have OpenAI API key first
    if not OPENAI_API_KEY or OPENAI_API_KEY.strip() == "":
        # No API key - return a smart mock classification based on keywords
        return classify_with_keywords(user_input)
    
    try:
        # Use GPT-5-mini for classification (fast and accurate)
        response = ask_openai(
            prompt=prompt, 
            task_type="classification", 
            complexity="medium", 
            max_tokens=512
        )
        
        # Check if response is already a valid JSON string
        if response.startswith('{') and response.endswith('}'):
            import json
            return json.loads(response)
        elif '```json' in response and '```' in response:
            # Response is in Markdown code block format, extract JSON
            try:
                import json
                import re
                # Extract content between ```json and ```
                json_match = re.search(r'```json\s*(\{.*?\})\s*```', response, re.DOTALL)
                if json_match:
                    json_content = json_match.group(1)
                    return json.loads(json_content)
                else:
                    print("Could not extract JSON from Markdown block, using keyword classification")
                    return classify_with_keywords(user_input)
            except Exception as e:
                print(f"Error parsing JSON from Markdown: {e}, using keyword classification")
                return classify_with_keywords(user_input)
        else:
            # Response is not JSON, use keyword classification as fallback
            print("AI response is not valid JSON, using keyword classification")
            return classify_with_keywords(user_input)
            
    except Exception as e:
        print("Classification error:", e)
        return classify_with_keywords(user_input)

def classify_with_keywords(user_input: str) -> dict:
    """Fallback classification using keyword matching when AI is not available."""
    input_lower = user_input.lower()
    
    # Define keyword mappings for modules
    module_keywords = {
        "ai-concepts": ["concept", "concepto", "idea", "learn", "aprender", "knowledge", "conocimiento"],
        "micro-lessons": ["micro", "lesson", "lección", "short", "corto", "quick", "rápido"],
        "video-lessons": ["video", "video lesson", "lección de video", "watch", "ver"],
        "simulations": ["simulation", "simulación", "scenario", "escenario", "practice", "práctica"],
        "ai-career-coach": ["coach", "career", "carrera", "advice", "consejo", "planning", "planificación"],
        "skills-forecast": ["forecast", "predicción", "future", "futuro", "skill", "habilidad"],
        "certifications": ["certification", "certificación", "cert", "study plan", "plan de estudio"],
        "web-search": ["search", "buscar", "web", "internet", "research", "investigar"],
        "recommendations": ["recommend", "recomendar", "what to learn", "qué aprender", "next", "siguiente"]
    }
    
    # Find the best module match
    best_match = None
    best_score = 0
    
    for module, keywords in module_keywords.items():
        score = sum(1 for keyword in keywords if keyword in input_lower)
        if score > best_score:
            best_score = score
            best_match = module
    
    # Determine confidence based on match quality
    if best_score >= 2:
        confidence = "High"
    elif best_score >= 1:
        confidence = "Medium"
    else:
        confidence = "Low"
    
    # Generate appropriate response
    if best_match and confidence in ["High", "Medium"]:
        return {
            "intent": f"User wants to access {best_match.replace('-', ' ')}",
            "module_match": best_match,
            "new_feature": None,
            "confidence": confidence,
            "follow_up_question": "Is this what you were looking for?"
        }
    else:
        return {
            "intent": "User request unclear",
            "module_match": None,
            "new_feature": "Enhanced Intent Recognition",
            "confidence": "Low",
            "follow_up_question": "Sorry, I didn't quite understand that. Could you rephrase?"
        } 

def generate_scaffold(feature_name, feature_summary, scaffold_type="API Route"):
    from backend.prompts import SCAFFOLD_TYPE_PROMPT
    prompt = SCAFFOLD_TYPE_PROMPT.format(
        scaffold_type=scaffold_type,
        feature_name=feature_name,
        feature_summary=feature_summary
    )
    # Use GPT-5 for scaffold generation (complex task)
    return ask_openai(
        prompt=prompt, 
        task_type="code_generation", 
        complexity="high", 
        max_tokens=800
    )

async def generate_summary(filename: str, content: str) -> str:
    """Generate a summary of a code file for documentation using GPT-5."""
    prompt = f"""
You are a technical documentation assistant powered by GPT-5. Analyze the following code file and provide a clear, concise summary.

File: {filename}
Content:
{content[:3000]}

Please provide a summary that includes:
1. What this file does (purpose and functionality)
2. Key components or functions
3. Important dependencies or relationships
4. Any notable patterns or architecture decisions

Write in clear, professional language suitable for technical documentation.
"""
    # Use GPT-5-mini for documentation (good balance of quality and cost)
    return ask_openai(
        prompt, 
        task_type="documentation", 
        complexity="medium", 
        max_tokens=500
    )

async def generate_quiz_questions(markdown_content: str, num_questions: int = 3, difficulty: str = "medium") -> list:
    """Generate quiz questions from markdown content using GPT-5."""
    prompt = f"""
You are a workplace learning assistant powered by GPT-5. Based on this markdown documentation, generate {num_questions} multiple-choice quiz questions.

Documentation:
{markdown_content[:4000]}

Difficulty Level: {difficulty}

Please generate questions in this exact JSON format:
[
  {{
    "question": "What is the main purpose of this component?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": "Option B",
    "explanation": "This is the correct answer because..."
  }}
]

Make sure the questions are relevant to the content and appropriate for the specified difficulty level.
"""
    
    try:
        # Use GPT-5-mini for quiz generation (good for structured output)
        response = ask_openai(
            prompt, 
            task_type="quiz_generation", 
            complexity="medium", 
            max_tokens=1000
        )
        # Try to parse the JSON response
        import json
        import re
        
        # Extract JSON from the response
        json_match = re.search(r'\[.*\]', response, re.DOTALL)
        if json_match:
            quiz_data = json.loads(json_match.group())
            return quiz_data
        else:
            # Fallback: return a simple quiz structure
            return [
                {
                    "question": "What is the main purpose of this documentation?",
                    "options": ["To explain the codebase", "To provide installation instructions", "To list all files", "To show examples"],
                    "correct_answer": "To explain the codebase",
                    "explanation": "The documentation explains the structure and purpose of the codebase."
                }
            ]
    except Exception as e:
        print(f"Error generating quiz questions: {e}")
        # Return a fallback quiz if parsing fails
        return [
            {
                "question": "What is the main purpose of this documentation?",
                "options": ["To explain the codebase", "To provide installation instructions", "To list all files", "To show examples"],
                "correct_answer": "To explain the codebase",
                "explanation": "The documentation explains the structure and purpose of the codebase."
            }
        ] 