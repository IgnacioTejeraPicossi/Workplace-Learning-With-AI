# agentic_rag_service.py
import time, hashlib, json, re
from dataclasses import dataclass
from typing import List, Dict, Any, Optional
from uuid import uuid4

from .your_parsers import parse_to_sections_and_paragraphs
from .your_mongo import save_document, save_chunks_tree, get_chunks_tree, save_run, save_eval
from .your_bm25 import bm25_topk
from .your_embeddings import embed_small
from .your_llm import LLMClient

def convert_objectids_to_strings(obj):
    """Convert MongoDB ObjectId objects to strings for JSON serialization"""
    if isinstance(obj, dict):
        return {k: convert_objectids_to_strings(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_objectids_to_strings(item) for item in obj]
    elif hasattr(obj, '__class__') and obj.__class__.__name__ == 'ObjectId':
        return str(obj)
    else:
        return obj

@dataclass
class Chunk:
    id: str
    level: int
    text: str
    title: str
    path: List[str]

def build_or_update_index(filename: str, content: bytes) -> Dict[str, Any]:
    doc_id = hashlib.sha1((filename+str(len(content))).encode()).hexdigest()[:16]
    sections = parse_to_sections_and_paragraphs(content, filename)
    chunks_tree = []
    for s_idx, s in enumerate(sections):
        mega_id = f"{s_idx}"
        mega = Chunk(id=mega_id, level=0, text=s.text, title=s.title, path=[mega_id])
        subs = []
        # nivel 1: secciones lógicas -> las convertimos en párrafos finos (nivel 2)
        for p_idx, p in enumerate(s.paragraphs):
            # usamos solo nivel 2 económicos (mega->para)
            para_id = f"{s_idx}.{p_idx}.0"
            subs.append(Chunk(id=para_id, level=2, text=p.text, title=p.title or s.title, path=[str(s_idx), str(p_idx), "0"]))
        chunks_tree.append({"mega": mega, "subs": subs})

    save_document(doc_id, filename)
    save_chunks_tree(doc_id, chunks_tree)
    result = {"doc_id": doc_id, "filename": filename, "mega_chunks": len(chunks_tree)}
    
    # Convert ObjectIds to strings for JSON serialization
    result = convert_objectids_to_strings(result)
    return result

# ---- Navegación / retrieval ----
def _get_megas(doc_ids: List[str]) -> List[Chunk]:
    megas: List[Chunk] = []
    for d in doc_ids:
        nodes = get_chunks_tree(doc_id=d, level=0)
        for n in nodes:
            megas.append(Chunk(id=n["id"], level=n["level"], text=n["text"], title=n.get("title",""), path=n["path"] if isinstance(n["path"], list) else str(n["path"]).split(".")))
    return megas

def _get_subs_under_path(doc_id: str, mega: Chunk) -> List[Chunk]:
    nodes = get_chunks_tree(level=2, path_prefix=mega.path)
    out = []
    for n in nodes:
        out.append(Chunk(id=n["id"], level=n["level"], text=n["text"], title=n.get("title",""), path=n["path"] if isinstance(n["path"], list) else str(n["path"]).split(".")))
    return out

def pass1_router(llm: LLMClient, question: str, mega_chunks: List[Chunk], k_init: int) -> List[str]:
    previews = [{"id": c.id, "title": c.title, "lead": c.text[:800]} for c in mega_chunks]
    prompt = f"""
You are a routing assistant. From the previews, pick the {k_init} most promising sections for the user question.
Return ONLY a JSON array of IDs.
QUESTION: {question}
PREVIEWS: {json.dumps(previews)[:12000]}
"""
    ids = llm.complete_json("mini-router", prompt, schema="array_of_strings")
    if not ids:
        texts = [c.title + " " + c.text[:1800] for c in mega_chunks]
        bm = bm25_topk(question, texts, k_init)
        ids = [mega_chunks[i].id for i in bm]
    return ids

def recursive_navigate(question: str, doc_ids: List[str], cand_ids: List[str], max_paragraphs: int, use_hybrid: bool) -> List[Chunk]:
    selected: List[Chunk] = []
    for d in doc_ids:
        megas = [m for m in _get_megas([d]) if m.id in cand_ids]
        for mega in megas:
            subs = _get_subs_under_path(d, mega)
            if not subs: continue
            if use_hybrid:
                tops_bm = bm25_topk(question, [s.text for s in subs], k=min(6,len(subs)))
                subs_ranked = [subs[i] for i in tops_bm]
                try:
                    from math import sqrt
                    qv = embed_small(question)
                    sv = [embed_small(s.text) for s in subs_ranked]
                    def cos(a,b):
                        da = sqrt(sum(x*x for x in a)); db = sqrt(sum(x*x for x in b))
                        return sum(x*y for x,y in zip(a,b))/(da*db + 1e-9)
                    subs_ranked = [x for _,x in sorted(((cos(qv,v),s) for v,s in zip(sv,subs_ranked)), reverse=True)]
                except Exception:
                    pass
            else:
                subs_ranked = [subs[i] for i in bm25_topk(question, [s.text for s in subs], k=min(6,len(subs)))]
            selected.extend(subs_ranked[:3])
    return selected[:max_paragraphs]

def synthesize(llm: LLMClient, question: str, paragraphs: List[Chunk]) -> Dict[str, Any]:
    sources = [{"id": p.id, "title": p.title, "text": p.text[:4000]} for p in paragraphs]
    prompt = f"""
You answer WITH GROUNDED CITATIONS. Use only the provided sources. After each claim, add citations like [ID:{paragraphs[0].id}].
Return JSON with fields: answer (markdown), citations (list of {{id, snippet}}).
QUESTION: {question}
SOURCES: {json.dumps(sources)[:24000]}
"""
    return llm.complete_json("synth-strong", prompt, schema="answer_with_citations")

def judge(llm: LLMClient, question: str, answer: str, citations: List[Dict[str,str]]) -> Dict[str, Any]:
    prompt = f"""
Evaluate the answer on three metrics 0-10: Faithfulness (grounded in cited text), Relevance, Completeness.
Return JSON: {{faithfulness, relevance, completeness, comment}}.
QUESTION: {question}
ANSWER: {answer}
CITATIONS: {json.dumps(citations)[:8000]}
"""
    return llm.complete_json("judge-strong", prompt, schema="judge_scores")

def ask_agentic(doc_ids: List[str], question: str, depth:int, k_init:int, use_hybrid:bool, max_paragraphs:int):
    t0 = time.time()
    run_id = str(uuid4())
    llm = LLMClient(run_id=run_id)

    megas = _get_megas(doc_ids)
    cand_ids = pass1_router(llm, question, megas, k_init)
    selected = recursive_navigate(question, doc_ids, cand_ids, max_paragraphs, use_hybrid)

    synthesis = synthesize(llm, question, selected)
    
    # Validate synthesis result
    if not synthesis or "answer" not in synthesis:
        print(f"❌ Synthesis failed or missing answer: {synthesis}")
        # Return error response
        return {
            "run_id": run_id,
            "doc_ids": doc_ids,
            "question": question,
            "error": "Failed to generate answer from document analysis",
            "elapsed_sec": round(time.time()-t0, 3),
        }
    
    scores = judge(llm, question, synthesis["answer"], synthesis.get("citations", []))
    metrics = llm.metrics()

    result = {
        "run_id": run_id,
        "doc_ids": doc_ids,
        "question": question,
        "router_selected": cand_ids,
        "used_paragraphs": [p.id for p in selected],
        "answer": synthesis["answer"],
        "citations": synthesis.get("citations", []),
        "scores": scores,
        "metrics": metrics,
        "elapsed_sec": round(time.time()-t0, 3),
    }
    save_run(result); save_eval(run_id, scores)
    
    # Convert ObjectIds to strings for JSON serialization
    result = convert_objectids_to_strings(result)
    return result

def summarize_agentic(doc_ids: List[str], length: str):
    q = f"Write a {length} executive summary covering key points, with paragraph-level citations."
    return ask_agentic(doc_ids, q, depth=2, k_init=8, use_hybrid=True, max_paragraphs=16)
