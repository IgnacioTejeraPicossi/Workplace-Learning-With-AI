"""
Andrés — research tiers (V5). Andrés' own three-tier research model, formalised as
an enforced permission policy:

  1. internal   — his own biography (memories, projects) [default ON]
  2. documents  — text the user explicitly gives him this turn [default ON]
  3. web        — external DuckDuckGo search (per-message 🌐 toggle) [default OFF]

Each tier can be turned on/off by the user, and the chat endpoint enforces it:
internal off → he doesn't consult his stored memory/projects; documents off → a
provided document is ignored; web off → the 🌐 toggle can't actually search
(honest `web_access: disabled`). The tiers rise in exposure — internal < user-
provided < external — so the most cautious tier (web) is off by default.
"""
from backend.db import andres_profiles

DEFAULT_TIERS = {"internal": True, "documents": True, "web": False}


def get_tiers(profile: dict) -> dict:
    """Merge the profile's saved tiers over the defaults (missing keys default)."""
    saved = (profile or {}).get("research_tiers") or {}
    return {k: bool(saved.get(k, v)) for k, v in DEFAULT_TIERS.items()}


async def set_tiers(user_id: str, patch: dict) -> dict:
    """Update only the known tier flags; returns the resulting tiers."""
    updates = {f"research_tiers.{k}": bool(patch[k])
               for k in DEFAULT_TIERS if k in patch and patch[k] is not None}
    if updates:
        await andres_profiles.update_one({"user_id": user_id}, {"$set": updates})
    doc = await andres_profiles.find_one({"user_id": user_id})
    return get_tiers(doc or {})
