"""
Cloud Install module — service + endpoint contract tests (offline).

Guards the deployment workbench so the readiness sections, refreshed env template,
troubleshooting and the new "modules" smoke-test layer stay well-formed. No network
for the deterministic parts; the smoke-test layer is pointed at an unreachable host
so every module check fails cleanly (structured, never crashes) without real I/O.

Run: python -m pytest backend/tests/test_cloud_install.py -v
"""
import pytest
from httpx import AsyncClient, ASGITransport

from backend.app import app
from backend.services import cloud_install_service as svc

BASE = "http://test"


def test_status_has_six_sections_and_score():
    s = svc.get_cloud_install_status()
    assert s["ok"] is True and s["module"] == "cloud_install"
    assert isinstance(s["readinessScore"], int) and 0 <= s["readinessScore"] <= 100
    ids = [sec["id"] for sec in s["sections"]]
    assert ids == ["architecture", "env_secrets", "frontend", "backend", "data_auth", "smoke_tests"]
    for sec in s["sections"]:
        assert 0 <= sec["progress"] <= 100
        assert sec["status"] in {"ready", "partial", "not_started"}


def test_env_template_includes_new_module_vars():
    tpl = svc.generate_env_template(scope="backend", include_optional=True)
    names = {v["name"] for g in tpl["groups"] for v in g["variables"]}
    # security-critical + newer-module env vars must be present now
    for expected in ("ALLOW_MOCK_AUTH", "AZURE_DEVOPS_PAT", "EMBED_MODEL",
                     "API_PROVIDER", "ROBOMIND_ADMIN_TOKEN", "EMAIL_PROVIDER"):
        assert expected in names, f"env template missing {expected}"
    # ALLOW_MOCK_AUTH is flagged required (it must be explicitly false in prod)
    allow_mock = next(v for g in tpl["groups"] for v in g["variables"] if v["name"] == "ALLOW_MOCK_AUTH")
    assert allow_mock["required"] is True


def test_troubleshooting_covers_modules_and_security():
    ts = svc.get_troubleshooting()
    cats = {i["category"] for i in ts["items"]}
    assert "modules" in cats and "security" in cats
    # the mock-auth security item is critical
    sec = [i for i in ts["items"] if i["category"] == "security"]
    assert any(i["severity"] == "critical" for i in sec)


@pytest.mark.asyncio
async def test_modules_smoke_layer_produces_module_checks():
    # unreachable host → every module check fails cleanly, structured, no crash
    res = await svc.run_smoke_tests(layers=["modules"], backend_url="http://127.0.0.1:1")
    assert res["total_checks"] == len(svc.MODULE_HEALTH_ENDPOINTS)
    assert all(c["layer"] == "modules" for c in res["checks"])
    assert res["failed"] == res["total_checks"] and res["ok"] is False
    names = {c["name"] for c in res["checks"]}
    assert "Andrés the Robot" in names and "Self-Simulating Reality" in names


@pytest.mark.asyncio
async def test_status_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE) as c:
        r = await c.get("/api/cloud-install/status")
    assert r.status_code == 200
    assert r.json()["module"] == "cloud_install"
