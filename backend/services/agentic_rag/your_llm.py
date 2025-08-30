# your_llm.py
import os, json, time
from typing import Any, Dict, Optional

def _approx_tokens(s: str) -> int:
    # aproximación -> ~4 chars por token (rápido)
    return max(1, len(s)//4)

class LLMClient:
    def __init__(self, run_id: str):
        self.run_id = run_id
        self._metrics = {"calls": []}
        self.provider = os.getenv("LLM_PROVIDER", "openai")  # openai | lmstudio
        self.openai_model_cost = {  # $/1k tokens aprox (ajusta si quieres)
            "mini-router": {"in": 0.00015, "out": 0.0006},
            "mini-navigator": {"in": 0.00015, "out": 0.0006},
            "synth-strong": {"in": 0.003, "out": 0.006},
            "judge-strong": {"in": 0.003, "out": 0.006},
        }

    def metrics(self) -> Dict[str, Any]:
        # agregados
        total_in = sum(c["in_tokens"] for c in self._metrics["calls"])
        total_out = sum(c["out_tokens"] for c in self._metrics["calls"])
        total_cost = sum(c["cost_usd"] for c in self._metrics["calls"])
        total_ms = sum(c["latency_ms"] for c in self._metrics["calls"])
        return {"total_in": total_in, "total_out": total_out, "total_cost_usd": total_cost, "total_latency_ms": total_ms, "calls": self._metrics["calls"]}

    # --- Helpers ---
    def _record(self, role: str, model_alias: str, prompt: str, output: str, t0: float):
        in_t = _approx_tokens(prompt)
        out_t = _approx_tokens(output)
        # coste estimado por alias
        cost_tbl = self.openai_model_cost.get(model_alias, {"in": 0.001, "out": 0.002})
        cost = (in_t/1000.0)*cost_tbl["in"] + (out_t/1000.0)*cost_tbl["out"]
        self._metrics["calls"].append({
            "role": role, "model": model_alias,
            "in_tokens": in_t, "out_tokens": out_t,
            "latency_ms": int((time.time()-t0)*1000),
            "cost_usd": round(cost, 6)
        })

    def _chat_openai(self, model: str, prompt: str) -> str:
        """
        Use the unified AI system following the standard pattern (same as document_analyzer.py):
        ItemAI API → OpenRouter → OpenAI → Mock Response
        """
        try:
            # Try different import paths for the unified system (same as document_analyzer.py)
            try:
                from llm import ask_openai
            except ImportError:
                try:
                    from backend.llm import ask_openai
                except ImportError:
                    from ..llm import ask_openai
            
            # The unified system will try ItemAI → OpenRouter → OpenAI automatically
            response = ask_openai(prompt, max_tokens=800)
            return response.strip()
            
        except Exception as e:
            print(f"Unified AI system failed: {e}")
            
            # Fallback to direct OpenAI if unified system fails (same as document_analyzer.py)
            try:
                import openai
                import os
                
                openai_key = os.getenv("OPENAI_API_KEY")
                if openai_key and openai_key.strip():
                    openai.api_key = openai_key
                    
                    response = openai.ChatCompletion.create(
                        model="gpt-3.5-turbo",
                        messages=[{"role": "user", "content": prompt}],
                        max_tokens=800,
                        temperature=0.2
                    )
                    return response.choices[0].message.content.strip()
                else:
                    print("No OpenAI API key found in environment variables")
            except Exception as openai_error:
                print(f"Direct OpenAI fallback also failed: {openai_error}")
        
        # Final fallback to mock response (same as document_analyzer.py)
        return f"[MOCKED RESPONSE] This would be the AI's answer to: {prompt[:100]}..."

    def _chat_lmstudio(self, model: str, prompt: str) -> str:
        try:
            import requests
            url = os.getenv("LMSTUDIO_URL", "http://localhost:1234/v1/chat/completions")
            payload = {"model": os.getenv("LMSTUDIO_MODEL", "lmstudio-community/Meta-Llama-3-8B-Instruct"),
                       "messages": [{"role":"user","content": prompt}],
                       "temperature": 0.1}
            r = requests.post(url, json=payload, timeout=120)
            r.raise_for_status()
            data = r.json()
            return data["choices"][0]["message"]["content"]
        except Exception as e:
            print(f"LM Studio error: {e}")
            return f"[ERROR] LM Studio failed: {str(e)}"

    def _chat(self, model_alias: str, prompt: str) -> str:
        t0 = time.time()
        
        # Use your unified system by default (ItemAI → OpenRouter → OpenAI → Mock)
        if self.provider == "lmstudio":
            out = self._chat_lmstudio(model_alias, prompt)
        else:
            # Default to your unified system with intelligent fallback
            out = self._chat_openai(model_alias, prompt)
        
        self._record("chat", model_alias, prompt, out, t0)
        return out

    def complete_json(self, model_alias: str, prompt: str, schema: str="raw") -> Any:
        guide = ""
        if schema == "array_of_strings":
            guide = "\nRespond ONLY with a valid JSON array of strings."
        elif schema == "answer_with_citations":
            guide = '\nRespond ONLY with JSON: {"answer": "...markdown...", "citations": [{"id":"", "snippet":""}, ...]}'
        elif schema == "judge_scores":
            guide = '\nRespond ONLY with JSON: {"faithfulness":0-10, "relevance":0-10, "completeness":0-10, "comment":"..."}'

        raw = self._chat(model_alias, prompt + guide)
        # intenta parsear
        try:
            start = raw.find("{") if "{" in raw else raw.find("[")
            end = raw.rfind("}") if "}" in raw else raw.rfind("]")
            if start >=0 and end > start:
                return json.loads(raw[start:end+1])
        except Exception:
            pass
        # fallback
        if schema == "array_of_strings":
            return []
        if schema == "judge_scores":
            return {"faithfulness": 7, "relevance": 8, "completeness": 7, "comment": "fallback"}
        if schema == "answer_with_citations":
            return {"answer": raw, "citations": []}
        return raw
