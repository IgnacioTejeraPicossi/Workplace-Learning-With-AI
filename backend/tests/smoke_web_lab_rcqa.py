"""Web Lab ↔ RCQA Settings contract (V1-RCQA).

Mirrors docs/web-lab-plan.md §7 / §9:
  - Partial POST updates env_local_url (+ env_default) only
  - env_test_url (TestSide) and enonic_admin_url stay unchanged
  - save_settings response is a full get_settings-style merge

No clone / process management — Settings-only, same path as
frontend/src/web-lab/components/ConnectToQaAgent.jsx.
"""
from __future__ import annotations

import asyncio
import os
import sys

# Windows consoles often default to cp1252; llm import may print non-ASCII.
os.environ.setdefault("PYTHONIOENCODING", "utf-8")
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

from backend.services.red_cross_qa import (
    DEFAULT_SETTINGS,
    get_settings,
    save_settings,
)

PROBE_LOCAL = "http://localhost:3102"


def _norm(url: str | None) -> str:
    return (url or "").rstrip("/")


async def main() -> None:
    before = (await get_settings())["settings"]
    prev_local = before.get("env_local_url")
    prev_test = _norm(before.get("env_test_url") or DEFAULT_SETTINGS["env_test_url"])
    prev_admin = _norm(
        before.get("enonic_admin_url") or DEFAULT_SETTINGS["enonic_admin_url"]
    )

    partial = await save_settings({
        "env_local_url": PROBE_LOCAL,
        "env_default": "local",
    })
    assert partial.get("status") == "ok", f"partial save failed: {partial}"
    merged = partial["settings"]

    assert _norm(merged.get("env_local_url")) == _norm(PROBE_LOCAL), (
        f"env_local_url not applied: {merged.get('env_local_url')}"
    )
    assert _norm(merged.get("env_test_url")) == prev_test, (
        f"env_test_url overwritten: {merged.get('env_test_url')} (was {prev_test})"
    )
    assert _norm(merged.get("enonic_admin_url")) == prev_admin, (
        f"enonic_admin_url overwritten: {merged.get('enonic_admin_url')} (was {prev_admin})"
    )
    assert merged.get("env_default") == "local", (
        f"env_default not applied: {merged.get('env_default')}"
    )

    # Published TestSide default must still be the known host when prior
    # settings were already on the current default (soft-migrate path).
    expected_testside = _norm(DEFAULT_SETTINGS["env_test_url"])
    if prev_test == expected_testside:
        assert _norm(merged.get("env_test_url")) == expected_testside

    # Round-trip GET matches POST merge.
    again = (await get_settings())["settings"]
    assert _norm(again.get("env_local_url")) == _norm(PROBE_LOCAL)
    assert _norm(again.get("env_test_url")) == prev_test
    assert _norm(again.get("enonic_admin_url")) == prev_admin

    if prev_local:
        restore = await save_settings({"env_local_url": prev_local})
        assert restore.get("status") == "ok", f"restore failed: {restore}"

    print("[OK] Web Lab V1-RCQA: env_local_url set; TestSide + Enonic preserved")


if __name__ == "__main__":
    asyncio.run(main())
