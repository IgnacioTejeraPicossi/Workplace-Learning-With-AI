"""
Regression Service — Visual UI regression via Playwright + pixelmatch.

Spawns the Node.js runner (playwright-regression/runner.js) as a subprocess.
Stores/retrieves baseline screenshots in MongoDB collection: regression_baselines.

Endpoints (called from routers/regression.py):
  capture_baselines(db, app_url)  — run Playwright capture, upsert into MongoDB
  run_regression(db, app_url)     — fetch baselines, run compare, return diff data
  get_baseline_status(db)         — list stored module names + capture dates
"""

import asyncio
import json
import logging
import os
import subprocess
import tempfile
from datetime import datetime, timezone
from typing import Optional

logger = logging.getLogger(__name__)

# Absolute path to runner.js (works from both root and backend/ CWD)
_THIS_DIR    = os.path.dirname(os.path.abspath(__file__))
_BACKEND_DIR = os.path.dirname(_THIS_DIR)
_REPO_ROOT   = os.path.dirname(_BACKEND_DIR)
RUNNER_PATH  = os.path.join(_REPO_ROOT, "playwright-regression", "runner.js")


def _regression_collection(db):
    return db["regression_baselines"]


# ── Capture ───────────────────────────────────────────────────────────────────

async def capture_baselines(db, app_url: str = "http://localhost:3000") -> dict:
    """
    Launch Playwright in capture mode.
    For each module: take a screenshot and upsert it in MongoDB.
    Returns { captured, total, errors, captured_at }.
    """
    if not os.path.exists(RUNNER_PATH):
        return {"error": f"Runner not found at {RUNNER_PATH}. Run 'npm install' in playwright-regression/."}

    loop = asyncio.get_event_loop()

    def _spawn():
        env = {**os.environ, "APP_URL": app_url}
        return subprocess.run(
            ["node", RUNNER_PATH, "--mode", "capture"],
            capture_output=True,
            text=True,
            timeout=600,
            env=env,
        )

    result = await loop.run_in_executor(None, _spawn)

    if not result.stdout.strip():
        err = result.stderr[:500] if result.stderr else "Runner produced no output"
        logger.error("Playwright capture failed: %s", err)
        return {"error": err, "captured": 0, "total": 0}

    try:
        data = json.loads(result.stdout)
    except json.JSONDecodeError as exc:
        logger.error("JSON parse error from runner: %s\nstdout: %s", exc, result.stdout[:200])
        return {"error": f"JSON parse error: {exc}", "captured": 0, "total": 0}

    collection   = _regression_collection(db)
    captured_at  = datetime.now(timezone.utc)
    captured     = 0
    errors       = 0

    for mod in data.get("modules", []):
        if mod.get("status") == "captured" and mod.get("screenshot_b64"):
            await collection.update_one(
                {"name": mod["name"]},
                {"$set": {
                    "name":            mod["name"],
                    "section":         mod.get("section", ""),
                    "screenshot_b64":  mod["screenshot_b64"],
                    "captured_at":     captured_at,
                    "viewport":        {"width": 1280, "height": 800},
                    "app_url":         app_url,
                }},
                upsert=True,
            )
            captured += 1
        else:
            errors += 1

    total = len(data.get("modules", []))
    logger.info("Baseline capture complete: %d/%d captured, %d errors", captured, total, errors)

    return {
        "captured":    captured,
        "total":       total,
        "errors":      errors,
        "captured_at": captured_at.isoformat(),
    }


# ── Compare ───────────────────────────────────────────────────────────────────

async def run_regression(db, app_url: str = "http://localhost:3000") -> dict:
    """
    Fetch baselines from MongoDB, write to a temp file, launch Playwright in
    compare mode, return per-module diff results.
    """
    if not os.path.exists(RUNNER_PATH):
        return {"error": f"Runner not found at {RUNNER_PATH}.", "modules": []}

    collection = _regression_collection(db)

    # Load all baselines (name + screenshot only — skip _id)
    baselines = []
    async for doc in collection.find({}, {"name": 1, "screenshot_b64": 1, "_id": 0}):
        baselines.append({"name": doc["name"], "screenshot_b64": doc["screenshot_b64"]})

    if not baselines:
        return {"error": "No baselines found. Please capture baselines first.", "modules": []}

    # Write baselines to a temp file so the Node process can read them
    tmp = tempfile.NamedTemporaryFile(
        mode="w", suffix=".json", delete=False, encoding="utf-8"
    )
    try:
        json.dump(baselines, tmp)
        tmp.close()
        temp_path = tmp.name

        loop = asyncio.get_event_loop()

        def _spawn():
            env = {**os.environ, "APP_URL": app_url}
            return subprocess.run(
                ["node", RUNNER_PATH, "--mode", "compare", "--baselines", temp_path],
                capture_output=True,
                text=True,
                timeout=900,   # 30 modules × ~3 s each = ~90 s; give plenty of headroom
                env=env,
            )

        result = await loop.run_in_executor(None, _spawn)

        if not result.stdout.strip():
            err = result.stderr[:500] if result.stderr else "Runner produced no output"
            logger.error("Playwright compare failed: %s", err)
            return {"error": err, "modules": []}

        data = json.loads(result.stdout)

    except json.JSONDecodeError as exc:
        return {"error": f"JSON parse error: {exc}", "modules": []}
    finally:
        try:
            os.unlink(temp_path)
        except Exception:
            pass

    modules     = data.get("modules", [])
    passed      = sum(1 for m in modules if m.get("status") == "pass")
    failed      = sum(1 for m in modules if m.get("status") == "fail")
    errors      = sum(1 for m in modules if m.get("status") == "error")
    no_baseline = sum(1 for m in modules if m.get("status") == "no_baseline")

    return {
        "modules": modules,
        "summary": {
            "total":       len(modules),
            "passed":      passed,
            "failed":      failed,
            "errors":      errors,
            "no_baseline": no_baseline,
            "run_at":      datetime.now(timezone.utc).isoformat(),
        },
    }


# ── Status ────────────────────────────────────────────────────────────────────

async def get_baseline_status(db) -> dict:
    """Return list of stored module names and capture timestamps."""
    collection = _regression_collection(db)
    baselines  = []
    async for doc in collection.find(
        {}, {"name": 1, "section": 1, "captured_at": 1, "_id": 0}
    ):
        baselines.append({
            "name":        doc["name"],
            "section":     doc.get("section", ""),
            "captured_at": doc["captured_at"].isoformat() if doc.get("captured_at") else None,
        })
    return {"baselines": baselines, "count": len(baselines)}


# ── Single baseline image ──────────────────────────────────────────────────────

async def get_baseline_image(db, name: str) -> Optional[str]:
    """Return base64 PNG string for a named baseline, or None."""
    collection = _regression_collection(db)
    doc = await collection.find_one({"name": name}, {"screenshot_b64": 1})
    return doc.get("screenshot_b64") if doc else None
