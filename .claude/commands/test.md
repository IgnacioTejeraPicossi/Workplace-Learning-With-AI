# /test — Run WLWAI Test Suite

Run the available tests and report results.

## Instructions

Run these test commands from the **repository root** (not from inside `backend/`):

### 1. Full test suite
```bash
python -m pytest backend/tests/ -v
```

### 2. Robomind Clinic contract tests (27 tests)
```bash
python -m pytest backend/tests/test_robomind_api_contracts.py -v
```

### 3. MCP smoke tests (4 tests)
```bash
python -m pytest backend/tests/test_mcp_smoke.py -v
```

### 4. All tests with coverage summary
```bash
python -m pytest backend/tests/ -v --tb=short
```

## Expected Results
- `test_robomind_api_contracts.py`: 27/27 passed
- `test_mcp_smoke.py`: 4/4 passed
- `test_robomind_clinic.py`: check for regressions
- `test_app.py`: basic smoke should pass

## If Tests Fail
1. Check Firebase is patched in `conftest.py` (should be automatic)
2. Check MongoDB is not required for unit tests (conftest patches it)
3. Read the error message carefully — do NOT retry blindly
4. Report: test name, error, likely cause, proposed fix

## Adding New Tests
- Add to `backend/tests/`
- Follow the pattern in `test_robomind_api_contracts.py`
- Use fixtures from `conftest.py` (Firebase is auto-patched)
- Run immediately after writing to verify

## Test Infrastructure
- `pytest.ini` at repo root: `testpaths=backend/tests`, `asyncio_mode=auto`
- `backend/tests/conftest.py`: patches Firebase at module load time
- Python env: `pytest==8.4.1`, `pytest-asyncio==1.3.0`
