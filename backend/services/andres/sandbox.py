"""
Andrés — skill sandbox (V4). THE safety core of the Skills module.

Andrés (the agent) explicitly asked that Skills never become "an opaque expansion
vector": strict sandbox, comprehensible metrics, proposal traceability, human
approval. This module is the strict-sandbox part.

A "skill" is a single pure Python function `def skill(x): ...`. Before anything
runs we do a **static AST safety check** (the ground truth, like the
self-correcting-loop's ast.parse gate) that hard-rejects the classic escape
routes; then execution happens in a **stripped namespace** (a tiny safe builtins
whitelist, no imports, no dunder access) under a wall-clock timeout.

Hard rules enforced here (mirror plan §7):
- no imports, no dunder names/attributes (blocks `().__class__.__mro__…` escapes),
- no eval/exec/open/compile/__import__/globals/getattr/… ,
- no file/network/OS access is even reachable (those names don't exist in-scope),
- CPU-only, wall-clock bounded. Skills can never touch the app, disk or network.
"""
import ast
import builtins as _builtins
import threading
import time

# A deliberately tiny, side-effect-free builtins whitelist.
_SAFE_BUILTIN_NAMES = [
    "abs", "all", "any", "bool", "dict", "divmod", "enumerate", "filter",
    "float", "int", "len", "list", "map", "max", "min", "pow", "range",
    "reversed", "round", "set", "sorted", "str", "sum", "tuple", "zip",
    "bin", "hex", "oct", "chr", "ord", "isinstance", "abs", "format",
]
SAFE_BUILTINS = {n: getattr(_builtins, n) for n in _SAFE_BUILTIN_NAMES if hasattr(_builtins, n)}

# Names that are never allowed to appear, even though most aren't in SAFE_BUILTINS.
_DENY_NAMES = {
    "eval", "exec", "open", "compile", "__import__", "input", "exit", "quit",
    "breakpoint", "globals", "locals", "vars", "getattr", "setattr", "delattr",
    "help", "memoryview", "classmethod", "staticmethod", "super", "object",
    "type", "dir", "id", "hash", "property",
}

MAX_CODE_LEN = 4000


def static_safety_check(code: str) -> dict:
    """Return {ok: bool, reasons: [str], has_skill_fn: bool}. No execution."""
    reasons = []
    if not code or not code.strip():
        return {"ok": False, "reasons": ["Empty code."], "has_skill_fn": False}
    if len(code) > MAX_CODE_LEN:
        return {"ok": False, "reasons": [f"Code exceeds {MAX_CODE_LEN} chars."], "has_skill_fn": False}

    try:
        tree = ast.parse(code)
    except SyntaxError as e:
        return {"ok": False, "reasons": [f"Syntax error: {e.msg} (line {e.lineno})"], "has_skill_fn": False}

    has_skill_fn = any(
        isinstance(n, ast.FunctionDef) and n.name == "skill" for n in tree.body
    )
    if not has_skill_fn:
        reasons.append("Must define a top-level function named `skill(x)`.")

    for node in ast.walk(tree):
        if isinstance(node, (ast.Import, ast.ImportFrom)):
            reasons.append("Imports are not allowed.")
        elif isinstance(node, (ast.Global, ast.Nonlocal)):
            reasons.append("global/nonlocal are not allowed.")
        elif isinstance(node, ast.Attribute):
            if node.attr.startswith("_"):
                reasons.append(f"Access to dunder/private attribute `{node.attr}` is not allowed.")
        elif isinstance(node, ast.Name):
            if node.id.startswith("_"):
                reasons.append(f"Use of name starting with `_` (`{node.id}`) is not allowed.")
            elif node.id in _DENY_NAMES:
                reasons.append(f"Use of `{node.id}` is not allowed.")

    reasons = sorted(set(reasons))
    return {"ok": len(reasons) == 0, "reasons": reasons, "has_skill_fn": has_skill_fn}


def run_in_sandbox(code: str, test_input, timeout: float = 2.0) -> dict:
    """Execute `skill(test_input)` in a stripped namespace under a timeout.

    Returns {ok, output, error, duration_ms}. Assumes static_safety_check passed;
    still re-checks so it can never be bypassed by calling this directly.
    """
    check = static_safety_check(code)
    if not check["ok"]:
        return {"ok": False, "output": None, "error": "unsafe: " + "; ".join(check["reasons"]),
                "duration_ms": 0}

    ns = {"__builtins__": SAFE_BUILTINS}
    try:
        compiled = compile(code, "<andres_skill>", "exec")
        exec(compiled, ns)  # noqa: S102 - sandboxed namespace, no real builtins
    except Exception as e:  # pragma: no cover - defensive
        return {"ok": False, "output": None, "error": f"load error: {type(e).__name__}: {e}",
                "duration_ms": 0}

    fn = ns.get("skill")
    if not callable(fn):
        return {"ok": False, "output": None, "error": "No callable `skill` defined.", "duration_ms": 0}

    result = {}

    def _target():
        try:
            result["value"] = fn(test_input)
        except Exception as e:  # skill raised
            result["error"] = f"{type(e).__name__}: {e}"

    t = threading.Thread(target=_target, daemon=True)
    start = time.perf_counter()
    t.start()
    t.join(timeout)
    duration_ms = int((time.perf_counter() - start) * 1000)

    if t.is_alive():
        return {"ok": False, "output": None,
                "error": f"Timed out after {timeout}s (possible infinite loop).",
                "duration_ms": duration_ms}
    if "error" in result:
        return {"ok": False, "output": None, "error": result["error"], "duration_ms": duration_ms}

    output = result.get("value")
    # keep output JSON-friendly
    try:
        import json
        json.dumps(output)
    except (TypeError, ValueError):
        output = str(output)
    return {"ok": True, "output": output, "error": None, "duration_ms": duration_ms}
