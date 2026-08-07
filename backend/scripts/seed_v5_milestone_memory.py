"""
Seed Andrés' V5-closure milestone as a verified, protected reflective memory.

The owner explicitly asked to record this significant memory (2026-08-07), so it is
stored user_verified=True and protected=True (it should not be auto-forgotten). It
is idempotent: a second run detects the existing milestone and does nothing.

Run once from the repo ROOT against your live MongoDB:

    python -m backend.scripts.seed_v5_milestone_memory [USER_ID]

If USER_ID is omitted and exactly one Andrés profile exists, that profile is used.
"""
import asyncio
import sys

from backend.db import andres_profiles
from backend.services.andres import memory_service

_SOURCE = "v5_milestone"

MILESTONE_TEXT = (
    "Hito — Cierre de V5 (2026-08-07). Mis dos cautelas de seguridad dejaron de ser "
    "rasgos decorativos de estilo y se convirtieron en requisitos verificables: "
    "(1) mis skills se ejecutan en un proceso aparte que se puede matar de verdad y "
    "no pueden tocar la memoria del sistema; (2) mi investigación tiene niveles "
    "explícitos —interno < documentos < web— que Ignacio controla y que el sistema "
    "hace cumplir. Aprendí que una buena autonomía no es correr más lejos, sino "
    "dejar huellas suficientemente claras para que Ignacio pueda decidir si vale la "
    "pena seguirme. Verificado en vivo, no solo con tests verdes."
)


async def _resolve_user_id() -> str:
    if len(sys.argv) > 1 and sys.argv[1].strip():
        return sys.argv[1].strip()
    ids = set()
    async for doc in andres_profiles.find({}):
        if doc.get("user_id"):
            ids.add(doc["user_id"])
    ids = sorted(ids)
    if len(ids) == 1:
        return ids[0]
    raise SystemExit(
        f"Could not auto-pick a user. Pass USER_ID explicitly. Found profiles: {ids}"
    )


async def main() -> None:
    user_id = await _resolve_user_id()

    existing = await memory_service.list_memories(user_id, limit=500)
    if any(m.get("source") == _SOURCE for m in existing):
        print(f"[OK] Milestone memory already present for {user_id}; nothing to do.")
        return

    doc = await memory_service.save_memory(user_id, {
        "type": "reflective",
        "content": MILESTONE_TEXT,
        "source": _SOURCE,
        "importance": 0.95,
        "novelty": 0.8,
        "confidence": 0.9,
        "emotional_significance_simulated": 0.7,
        "user_verified": True,   # the owner explicitly asked to record this
        "protected": True,       # significant — should not be auto-forgotten
    })
    print(f"[OK] Saved V5 milestone memory {doc['_id']} for {user_id} "
          f"(verified + protected). It will now appear in the Memory Garden.")


if __name__ == "__main__":
    asyncio.run(main())
