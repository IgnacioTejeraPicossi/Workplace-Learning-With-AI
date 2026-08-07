"""
Andrés — profile / identity service (V0).

One profile document per user, holding the current evolving identity plus simple
developmental counters. The immutable constitution lives in constitution.py and
is never stored on the mutable profile. Later phases add identity versioning
(andres_identity_versions) and user-approved Evolution Proposals.
"""
from datetime import datetime

from backend.db import andres_profiles
from backend.services.andres.constitution import default_identity


async def get_or_create_profile(user_id: str) -> dict:
    """Return the user's Andrés profile, creating the V0 'birth' profile if none."""
    doc = await andres_profiles.find_one({"user_id": user_id})
    if doc:
        doc["_id"] = str(doc["_id"])
        return doc

    now = datetime.utcnow().isoformat()
    profile = {
        "user_id": user_id,
        "identity": default_identity(),
        "autonomy_level": 2,          # default per plan (Reflective Companion)
        "development_paused": False,
        "identity_frozen": False,
        # Andrés' research-tier permissions: internal < user-provided < external.
        "research_tiers": {"internal": True, "documents": True, "web": False},
        "created_at": now,
        "counters": {
            "memories": 0,
            "reflections": 0,
            "active_skills": 0,
            "current_projects": 0,
            "conversations": 0,
            "creative_artifacts": 0,
        },
        "last_evolution": None,
        "simulated_disposition": {
            "curiosity": 0.78,
            "confidence": 0.5,
            "social_warmth": 0.7,
            "creative_energy": 0.6,
            "uncertainty": 0.5,
            "surprise": 0.4,
        },
    }
    await andres_profiles.insert_one(dict(profile))
    # find_one again to normalise the _id we just inserted
    doc = await andres_profiles.find_one({"user_id": user_id})
    if doc:
        doc["_id"] = str(doc["_id"])
        return doc
    return profile


async def developmental_age_days(profile: dict) -> int:
    """Whole days since the profile was created (Andrés' 'developmental age')."""
    try:
        created = datetime.fromisoformat(profile["created_at"])
        return max(0, (datetime.utcnow() - created).days)
    except Exception:
        return 0
