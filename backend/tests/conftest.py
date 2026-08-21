"""
conftest.py — test bootstrap for WLWAI backend tests.

Patches Firebase and MongoDB before backend.app is imported, so the test
suite runs without live credentials or a running MongoDB instance.

These patches start at module-load time (not inside fixtures) so they are
active during pytest collection, when test files execute
`from backend.app import app` at their top level.

Notes:
- Firebase: app.py already catches init failures and falls back to mock-auth
  mode, but we patch to keep startup clean and portable in CI.
- Motor (MongoDB): AsyncIOMotorClient is lazy — it does not open a TCP
  connection until a query is issued. No patch needed for import. Individual
  tests that write to MongoDB already mock save_screening / save_therapy_plan
  via @patch decorators.
"""
import os
from unittest.mock import MagicMock, patch

# ---------------------------------------------------------------------------
# Offline fast-path defaults (P2, 2026-08-20) — set BEFORE any backend import
# ---------------------------------------------------------------------------
# These make the whole suite run fast and hermetically offline. Both are
# `setdefault`, so an explicit value in the environment (CI, a developer with a
# real MongoDB) always wins — we only fill the gap when nothing is set.
#
# 1) AI_FORCE_MOCK — makes ask_ai_unified/_sync return an instant
#    "[MOCKED RESPONSE …]" without touching the network. Without this, every
#    LLM call with no keys still probes the local endpoints (localhost:1234,
#    192.168.50.142:1234) and waits ~seconds per call for a connection timeout
#    before falling back to mock. Downstream services detect the sentinel via
#    their existing is_mock path, so behaviour is identical to "all providers
#    unavailable" — only faster. (Tests that inject their own mock via @patch
#    bypass this entirely, so they are unaffected.)
# 2) MONGO_URI — a fast-failing dead host (100 ms server-selection timeout) so
#    Mongo-backed code paths degrade to their in-memory fallback in ~0.1 s
#    instead of the 30 s pymongo default when no MongoDB is running locally.
os.environ.setdefault("AI_FORCE_MOCK", "1")
os.environ.setdefault("MONGO_URI", "mongodb://127.0.0.1:1/?serverSelectionTimeoutMS=100")

# ---------------------------------------------------------------------------
# Firebase — prevent credential file reads and network calls at import time
# ---------------------------------------------------------------------------
patch("firebase_admin.credentials.Certificate", return_value=MagicMock()).start()
patch("firebase_admin.initialize_app", return_value=None).start()
