"""
ATM V&V Test Copilot — Service Layer
=====================================
AI-powered testing copilot for safety-critical ATM/ATC verification & validation.

Implements 4 MVP tools:
  1. ingest_requirement_bundle  — parse & normalize a requirement
  2. generate_test_design       — LLM-driven test design from requirement
  3. build_atm_scenario_matrix  — LLM-driven scenario matrix generation
  4. analyze_test_run           — LLM-driven test run failure analysis
"""

from datetime import datetime, timezone
from typing import Optional, List
from bson import ObjectId

# ── DB imports ──────────────────────────────────────────────────────
try:
    from backend.db import (
        atm_requirement_bundles_collection,
        atm_test_designs_collection,
        atm_scenario_matrices_collection,
        atm_test_runs_collection,
    )
except ImportError:
    from db import (
        atm_requirement_bundles_collection,
        atm_test_designs_collection,
        atm_scenario_matrices_collection,
        atm_test_runs_collection,
    )

# ── LLM import ─────────────────────────────────────────────────────
try:
    from backend.llm import ask_ai_unified
except ImportError:
    from llm import ask_ai_unified

import json, re

# ═══════════════════════════════════════════════════════════════════
# Constants — source types & scenario families
# ═══════════════════════════════════════════════════════════════════

VALID_SOURCE_TYPES = [
    "requirement", "user_story", "defect", "change_request",
    "spec_excerpt", "validation_note"
]

VALID_SCENARIO_TYPES = [
    "conflict_detection", "sector_handover", "trajectory_update",
    "degraded_surveillance", "conformance_monitoring", "alert_timing",
    "contingency_fallback"
]

# ═══════════════════════════════════════════════════════════════════
# Prompt templates
# ═══════════════════════════════════════════════════════════════════

REQUIREMENT_NORMALIZE_PROMPT = """You are an ATM (Air Traffic Management) V&V requirements analyst.

Given a requirement or specification text, extract and normalize it into structured sections.

Return ONLY a JSON object with this exact structure:
{
  "intent": "one sentence describing the core purpose",
  "conditions": ["condition 1", "condition 2"],
  "constraints": ["constraint 1", "constraint 2"],
  "expectedBehavior": ["expected behavior 1", "expected behavior 2"]
}

If a section has no items, use an empty array [].
Be precise and safety-aware. Focus on testable, verifiable statements."""

TEST_DESIGN_PROMPT = """You are an ATM (Air Traffic Management) V&V test design expert specializing in safety-critical systems.

Given a requirement with its normalized sections, generate a comprehensive test design.

Return ONLY a JSON object with this structure:
{
  "intent": "what this test design verifies",
  "assumptions": ["assumption 1", "assumption 2"],
  "testConditions": ["precondition 1", "precondition 2"],
  "positiveTests": [
    {"title": "test name", "description": "what it tests", "steps": ["step 1", "step 2"], "expectedOutcome": "expected result"}
  ],
  "negativeTests": [
    {"title": "test name", "description": "what it tests", "steps": ["step 1", "step 2"], "expectedOutcome": "expected result"}
  ],
  "edgeCases": [
    {"title": "test name", "description": "what it tests", "steps": ["step 1", "step 2"], "expectedOutcome": "expected result"}
  ],
  "automationCandidates": ["test that can be automated"],
  "traceabilityIds": ["REQ-xxx"],
  "openQuestions": ["question about ambiguities"]
}

Generate at least 2 positive tests, 2 negative tests, and 1 edge case.
Focus on safety-critical aspects of ATM systems."""

SCENARIO_BUILDER_PROMPT = """You are an ATM (Air Traffic Management) scenario builder for V&V testing.

Given a scenario type and parameters, generate a comprehensive scenario matrix for validation testing.

Return ONLY a JSON object with this structure:
{
  "title": "descriptive scenario title",
  "preconditions": ["precondition 1", "precondition 2"],
  "nominalScenarios": [
    {"name": "scenario name", "variables": {"key": "value"}, "expectedOutcome": "what should happen"}
  ],
  "degradedScenarios": [
    {"name": "scenario name", "variables": {"key": "value"}, "expectedOutcome": "what should happen"}
  ],
  "edgeCases": [
    {"name": "edge case name", "variables": {"key": "value"}, "expectedOutcome": "what should happen"}
  ],
  "expectedOutcomes": ["high-level expected outcome 1"],
  "riskNotes": ["safety risk note 1"],
  "automationNotes": ["automation consideration 1"]
}

Generate at least 2 nominal scenarios, 1 degraded scenario, and 1 edge case.
Consider ATM safety standards (EUROCAE ED-153, DO-278A) when applicable."""

RUN_ANALYZER_PROMPT = """You are an ATM (Air Traffic Management) test run analyst specializing in failure diagnosis.

Given test run artifacts (logs, JSON results, console output), analyze the run and identify issues.

Return ONLY a JSON object with this structure:
{
  "runSummary": "brief summary of the test run",
  "primaryFailureSignals": [
    {"signal": "description of failure signal", "count": 1, "affectedComponents": ["component 1"]}
  ],
  "repeatedPatterns": ["pattern that appears multiple times"],
  "probableRootCauses": [
    {"cause": "description", "confidence": "high|medium|low", "affectedTests": ["test name"]}
  ],
  "affectedAreas": ["system area affected"],
  "severityProposal": "critical|high|medium|low",
  "suggestedNextSteps": ["next step 1", "next step 2"],
  "suggestedRegressionScope": ["area to retest"]
}

Be precise about failure signals. Separate noise from real issues.
Consider safety implications for ATM systems."""


# ═══════════════════════════════════════════════════════════════════
# JSON Parsing Helper (3-tier: direct → regex → markdown fallback)
# ═══════════════════════════════════════════════════════════════════

def _parse_json_response(raw: str) -> Optional[dict]:
    """Parse JSON from LLM response using 3-tier strategy."""
    if not raw or raw.startswith("[MOCKED RESPONSE"):
        return None

    # Tier 1: direct parse
    try:
        return json.loads(raw.strip())
    except json.JSONDecodeError:
        pass

    # Tier 2: greedy regex for outermost { ... }
    m = re.search(r'\{[\s\S]*\}', raw)
    if m:
        try:
            return json.loads(m.group())
        except json.JSONDecodeError:
            pass

    # Tier 3: markdown code block
    m = re.search(r'```(?:json)?\s*(\{[\s\S]*?\})\s*```', raw)
    if m:
        try:
            return json.loads(m.group(1))
        except json.JSONDecodeError:
            pass

    return None


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _doc_to_json(doc: dict) -> dict:
    """Convert MongoDB document to JSON-serializable dict."""
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc


# ═══════════════════════════════════════════════════════════════════
# Tool 1: Ingest Requirement Bundle
# ═══════════════════════════════════════════════════════════════════

async def ingest_requirement_bundle(
    title: str,
    source_type: str,
    content: str,
    tags: List[str] = None,
    request_headers: dict = None,
) -> dict:
    """
    Ingest a requirement, normalize it via LLM, and store in MongoDB.
    Returns the stored bundle with normalizedSections.
    """
    if source_type not in VALID_SOURCE_TYPES:
        source_type = "requirement"

    # LLM call to normalize the requirement
    user_prompt = (
        f"Source type: {source_type}\n"
        f"Title: {title}\n"
        f"Content:\n{content[:2000]}"
    )

    normalized = None
    try:
        result = await ask_ai_unified(
            prompt=user_prompt,
            messages=[
                {"role": "system", "content": REQUIREMENT_NORMALIZE_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            max_tokens=512,
            temperature=0.1,
            request_headers=request_headers,
        )
        normalized = _parse_json_response(result)
    except Exception as e:
        print(f"[ATM-Copilot] Requirement normalization error: {e}")

    # Fallback if LLM fails
    if normalized is None:
        normalized = {
            "intent": title,
            "conditions": [],
            "constraints": [],
            "expectedBehavior": [],
        }

    doc = {
        "title": title,
        "sourceType": source_type,
        "content": content,
        "tags": tags or [],
        "normalizedSections": normalized,
        "createdAt": _now_iso(),
    }

    inserted = await atm_requirement_bundles_collection.insert_one(doc)
    doc["_id"] = str(inserted.inserted_id)

    return {"bundleId": doc["_id"], "status": "stored", "normalizedSections": normalized}


# ═══════════════════════════════════════════════════════════════════
# Tool 2: Generate Test Design
# ═══════════════════════════════════════════════════════════════════

async def generate_test_design(
    requirement_bundle_id: str,
    request_headers: dict = None,
) -> dict:
    """
    Generate a test design from a stored requirement bundle.
    Returns the test design document.
    """
    # Fetch the requirement bundle
    try:
        bundle = await atm_requirement_bundles_collection.find_one(
            {"_id": ObjectId(requirement_bundle_id)}
        )
    except Exception:
        return {"status": "error", "message": "Invalid requirement bundle ID"}

    if not bundle:
        return {"status": "error", "message": "Requirement bundle not found"}

    # Build the LLM prompt with the normalized requirement
    ns = bundle.get("normalizedSections", {})
    user_prompt = (
        f"Requirement Title: {bundle.get('title', 'Unknown')}\n"
        f"Source Type: {bundle.get('sourceType', 'requirement')}\n"
        f"Intent: {ns.get('intent', 'N/A')}\n"
        f"Conditions: {json.dumps(ns.get('conditions', []))}\n"
        f"Constraints: {json.dumps(ns.get('constraints', []))}\n"
        f"Expected Behavior: {json.dumps(ns.get('expectedBehavior', []))}\n"
        f"Full Content:\n{bundle.get('content', '')[:1500]}"
    )

    design = None
    try:
        result = await ask_ai_unified(
            prompt=user_prompt,
            messages=[
                {"role": "system", "content": TEST_DESIGN_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            max_tokens=1024,
            temperature=0.3,
            request_headers=request_headers,
        )
        design = _parse_json_response(result)
    except Exception as e:
        print(f"[ATM-Copilot] Test design generation error: {e}")

    if design is None:
        return {
            "status": "fallback",
            "message": "LLM unavailable, test design could not be generated",
            "design": None,
        }

    # Store the design
    design_doc = {
        "requirementId": requirement_bundle_id,
        "requirementTitle": bundle.get("title", ""),
        **design,
        "createdAt": _now_iso(),
    }

    inserted = await atm_test_designs_collection.insert_one(design_doc)
    design_doc["_id"] = str(inserted.inserted_id)

    return {"status": "ok", "design": design_doc}


# ═══════════════════════════════════════════════════════════════════
# Tool 3: Build ATM Scenario Matrix
# ═══════════════════════════════════════════════════════════════════

async def build_atm_scenario_matrix(
    scenario_type: str,
    risk_level: str = "medium",
    include_edge_cases: bool = True,
    include_fallbacks: bool = True,
    parameters: dict = None,
    request_headers: dict = None,
) -> dict:
    """
    Generate an ATM scenario matrix for the given scenario type.
    Returns the scenario matrix document.
    """
    if scenario_type not in VALID_SCENARIO_TYPES:
        scenario_type = "conflict_detection"
    if risk_level not in ("low", "medium", "high"):
        risk_level = "medium"

    params_str = json.dumps(parameters or {}, indent=2)
    user_prompt = (
        f"Scenario Type: {scenario_type}\n"
        f"Risk Level: {risk_level}\n"
        f"Include Edge Cases: {include_edge_cases}\n"
        f"Include Fallback Scenarios: {include_fallbacks}\n"
        f"Custom Parameters:\n{params_str}"
    )

    matrix = None
    try:
        result = await ask_ai_unified(
            prompt=user_prompt,
            messages=[
                {"role": "system", "content": SCENARIO_BUILDER_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            max_tokens=1024,
            temperature=0.3,
            request_headers=request_headers,
        )
        matrix = _parse_json_response(result)
    except Exception as e:
        print(f"[ATM-Copilot] Scenario matrix generation error: {e}")

    if matrix is None:
        return {
            "status": "fallback",
            "message": "LLM unavailable, scenario matrix could not be generated",
            "matrix": None,
        }

    # Store the matrix
    matrix_doc = {
        "scenarioType": scenario_type,
        "riskLevel": risk_level,
        "parameters": parameters or {},
        "includeEdgeCases": include_edge_cases,
        "includeFallbacks": include_fallbacks,
        **matrix,
        "createdAt": _now_iso(),
    }

    inserted = await atm_scenario_matrices_collection.insert_one(matrix_doc)
    matrix_doc["_id"] = str(inserted.inserted_id)

    return {"status": "ok", "matrix": matrix_doc}


# ═══════════════════════════════════════════════════════════════════
# Tool 4: Analyze Test Run
# ═══════════════════════════════════════════════════════════════════

async def analyze_test_run(
    run_id: str,
    artifacts: List[dict],
    request_headers: dict = None,
) -> dict:
    """
    Analyze test run artifacts and produce a failure analysis report.
    Returns the analysis document.
    """
    # Build artifact summary for LLM
    artifact_texts = []
    for i, art in enumerate(artifacts[:10]):  # limit to 10 artifacts
        art_type = art.get("type", "unknown")
        content = art.get("content", "")
        if isinstance(content, dict):
            content = json.dumps(content, indent=2)
        artifact_texts.append(
            f"--- Artifact {i+1} ({art_type}) ---\n{str(content)[:1000]}"
        )

    user_prompt = (
        f"Run ID: {run_id}\n"
        f"Number of artifacts: {len(artifacts)}\n\n"
        + "\n\n".join(artifact_texts)
    )

    analysis = None
    try:
        result = await ask_ai_unified(
            prompt=user_prompt,
            messages=[
                {"role": "system", "content": RUN_ANALYZER_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            max_tokens=1024,
            temperature=0.2,
            request_headers=request_headers,
        )
        analysis = _parse_json_response(result)
    except Exception as e:
        print(f"[ATM-Copilot] Run analysis error: {e}")

    if analysis is None:
        return {
            "status": "fallback",
            "message": "LLM unavailable, run analysis could not be generated",
            "analysis": None,
        }

    # Store the analysis
    analysis_doc = {
        "runId": run_id,
        "artifactCount": len(artifacts),
        "artifactTypes": [a.get("type", "unknown") for a in artifacts],
        **analysis,
        "createdAt": _now_iso(),
    }

    inserted = await atm_test_runs_collection.insert_one(analysis_doc)
    analysis_doc["_id"] = str(inserted.inserted_id)

    return {"status": "ok", "analysis": analysis_doc}


# ═══════════════════════════════════════════════════════════════════
# CRUD Helpers — List / Get / Delete
# ═══════════════════════════════════════════════════════════════════

async def list_requirement_bundles(limit: int = 50) -> list:
    """List recent requirement bundles."""
    docs = []
    cursor = atm_requirement_bundles_collection.find().sort("createdAt", -1).limit(limit)
    async for doc in cursor:
        docs.append(_doc_to_json(doc))
    return docs


async def get_requirement_bundle(bundle_id: str) -> Optional[dict]:
    """Get a single requirement bundle by ID."""
    try:
        doc = await atm_requirement_bundles_collection.find_one({"_id": ObjectId(bundle_id)})
        return _doc_to_json(doc) if doc else None
    except Exception:
        return None


async def list_test_designs(requirement_id: str = None, limit: int = 50) -> list:
    """List test designs, optionally filtered by requirement ID."""
    query = {}
    if requirement_id:
        query["requirementId"] = requirement_id
    docs = []
    cursor = atm_test_designs_collection.find(query).sort("createdAt", -1).limit(limit)
    async for doc in cursor:
        docs.append(_doc_to_json(doc))
    return docs


async def list_scenario_matrices(scenario_type: str = None, limit: int = 50) -> list:
    """List scenario matrices, optionally filtered by type."""
    query = {}
    if scenario_type:
        query["scenarioType"] = scenario_type
    docs = []
    cursor = atm_scenario_matrices_collection.find(query).sort("createdAt", -1).limit(limit)
    async for doc in cursor:
        docs.append(_doc_to_json(doc))
    return docs


async def list_test_run_analyses(limit: int = 50) -> list:
    """List recent test run analyses."""
    docs = []
    cursor = atm_test_runs_collection.find().sort("createdAt", -1).limit(limit)
    async for doc in cursor:
        docs.append(_doc_to_json(doc))
    return docs


async def delete_document(collection_name: str, doc_id: str) -> bool:
    """Delete a document from any ATM collection."""
    collections = {
        "requirements": atm_requirement_bundles_collection,
        "designs": atm_test_designs_collection,
        "scenarios": atm_scenario_matrices_collection,
        "runs": atm_test_runs_collection,
    }
    col = collections.get(collection_name)
    if not col:
        return False
    try:
        result = await col.delete_one({"_id": ObjectId(doc_id)})
        return result.deleted_count > 0
    except Exception:
        return False


async def get_stats() -> dict:
    """Get counts for all ATM V&V collections."""
    return {
        "requirements": await atm_requirement_bundles_collection.count_documents({}),
        "testDesigns": await atm_test_designs_collection.count_documents({}),
        "scenarioMatrices": await atm_scenario_matrices_collection.count_documents({}),
        "testRuns": await atm_test_runs_collection.count_documents({}),
    }


# ═══════════════════════════════════════════════════════════════════
# Export helpers — Markdown & JSON
# ═══════════════════════════════════════════════════════════════════

def export_test_design_markdown(design: dict) -> str:
    """Export a test design as formatted Markdown."""
    lines = [
        f"# Test Design: {design.get('intent', 'Untitled')}",
        f"\n**Requirement:** {design.get('requirementTitle', design.get('requirementId', 'N/A'))}",
        f"\n**Generated:** {design.get('createdAt', 'N/A')}",
        "\n## Assumptions",
    ]
    for a in design.get("assumptions", []):
        lines.append(f"- {a}")

    lines.append("\n## Test Conditions")
    for tc in design.get("testConditions", []):
        lines.append(f"- {tc}")

    for section, label in [
        ("positiveTests", "Positive Tests"),
        ("negativeTests", "Negative Tests"),
        ("edgeCases", "Edge Cases"),
    ]:
        tests = design.get(section, [])
        if tests:
            lines.append(f"\n## {label}")
            for t in tests:
                lines.append(f"\n### {t.get('title', 'Test')}")
                lines.append(f"{t.get('description', '')}")
                lines.append("\n**Steps:**")
                for i, s in enumerate(t.get("steps", []), 1):
                    lines.append(f"{i}. {s}")
                lines.append(f"\n**Expected Outcome:** {t.get('expectedOutcome', 'N/A')}")

    if design.get("automationCandidates"):
        lines.append("\n## Automation Candidates")
        for ac in design["automationCandidates"]:
            lines.append(f"- {ac}")

    if design.get("openQuestions"):
        lines.append("\n## Open Questions")
        for q in design["openQuestions"]:
            lines.append(f"- {q}")

    return "\n".join(lines)


def export_scenario_matrix_markdown(matrix: dict) -> str:
    """Export a scenario matrix as formatted Markdown."""
    lines = [
        f"# Scenario Matrix: {matrix.get('title', matrix.get('scenarioType', 'Untitled'))}",
        f"\n**Type:** {matrix.get('scenarioType', 'N/A')}",
        f"\n**Risk Level:** {matrix.get('riskLevel', 'N/A')}",
        f"\n**Generated:** {matrix.get('createdAt', 'N/A')}",
    ]

    if matrix.get("preconditions"):
        lines.append("\n## Preconditions")
        for p in matrix["preconditions"]:
            lines.append(f"- {p}")

    for section, label in [
        ("nominalScenarios", "Nominal Scenarios"),
        ("degradedScenarios", "Degraded Scenarios"),
        ("edgeCases", "Edge Cases"),
    ]:
        scenarios = matrix.get(section, [])
        if scenarios:
            lines.append(f"\n## {label}")
            for s in scenarios:
                lines.append(f"\n### {s.get('name', 'Scenario')}")
                if s.get("variables"):
                    lines.append(f"**Variables:** {json.dumps(s['variables'])}")
                lines.append(f"**Expected Outcome:** {s.get('expectedOutcome', 'N/A')}")

    if matrix.get("riskNotes"):
        lines.append("\n## Risk Notes")
        for rn in matrix["riskNotes"]:
            lines.append(f"- {rn}")

    if matrix.get("automationNotes"):
        lines.append("\n## Automation Notes")
        for an in matrix["automationNotes"]:
            lines.append(f"- {an}")

    return "\n".join(lines)
