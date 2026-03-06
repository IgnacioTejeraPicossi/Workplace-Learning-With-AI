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
from unittest.mock import MagicMock, patch

# ---------------------------------------------------------------------------
# Firebase — prevent credential file reads and network calls at import time
# ---------------------------------------------------------------------------
patch("firebase_admin.credentials.Certificate", return_value=MagicMock()).start()
patch("firebase_admin.initialize_app", return_value=None).start()
