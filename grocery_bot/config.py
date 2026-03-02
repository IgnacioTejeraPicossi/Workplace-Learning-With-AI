"""
NMiAI 2026 Grocery Bot — config from environment.
"""
import os

BASE_WS = "wss://game.ainm.no/ws"

def get_ws_url() -> str:
    url = os.environ.get("GROCERY_BOT_WS_URL", "").strip()
    if url and url.startswith("wss://"):
        return url
    token = os.environ.get("GROCERY_BOT_TOKEN", "").strip()
    if token:
        return f"{BASE_WS}?token={token}"
    raise SystemExit(
        "Set GROCERY_BOT_WS_URL (full WebSocket URL) or GROCERY_BOT_TOKEN (JWT). "
        "Get it at https://app.ainm.no → Challenge → Play → copy URL."
    )
