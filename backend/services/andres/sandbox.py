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
- input and output are size-capped; the skill receives a *copy* of the input so it
  can't mutate the caller's value.

Isolation (V5 hardening, Andrés' V4 follow-up): execution runs in a **separate
Python subprocess** with `subprocess.run(timeout=…)`, which really KILLS a runaway
(CPU-bound) skill on timeout — the old thread-join could only abandon a lingering
thread. Running in another process also means a skill can never touch the parent's
memory, so input mutation is impossible by construction. If a subprocess can't be
started, it falls back to the in-thread runner (still safe, just no hard kill).
Size caps still bound input/output. OS-level CPU/RAM rlimits remain a Unix-only
future step; the hard kill + caps cover the main risks cross-platform.
"""
import ast
import builtins as _builtins
import copy
import json as _json
import os
import subprocess
import sys
import threading
import time

# Size caps (chars of JSON) — bound input/output regardless of isolation mode.
MAX_INPUT_LEN = 100_000
MAX_OUTPUT_LEN = 200_000

# Default isolation: a real subprocess (hard kill on timeout). Set
# ANDRES_SANDBOX_ISOLATION=thread to force the in-thread fallback.
_ISOLATION = os.environ.get("ANDRES_SANDBOX_ISOLATION", "process")

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


# The child program run in an isolated subprocess. It is fully self-contained
# (duplicates only the safe-builtins whitelist + the exec/output-cap), imports no
# project code, reads {code, input, max_output} as JSON on stdin, runs
# skill(input) in a stripped namespace and prints a JSON result on stdout. Because
# it is a separate OS process, a runaway loop is killed by subprocess timeout and
# the skill can never touch the parent's memory.
_CHILD_RUNNER = r'''
import sys, json, builtins as _b
_data = json.loads(sys.stdin.read())
_code = _data["code"]; _inp = _data["input"]; _maxout = _data.get("max_output", 200000)
_names = %r
_safe = {n: getattr(_b, n) for n in _names if hasattr(_b, n)}
_ns = {"__builtins__": _safe}
def _emit(d): sys.stdout.write(json.dumps(d)); sys.exit(0)
try:
    exec(compile(_code, "<andres_skill>", "exec"), _ns)
except Exception as e:
    _emit({"ok": False, "output": None, "error": "load error: %%s: %%s" %% (type(e).__name__, e)})
_fn = _ns.get("skill")
if not callable(_fn):
    _emit({"ok": False, "output": None, "error": "No callable skill defined."})
try:
    _out = _fn(_inp)
except Exception as e:
    _emit({"ok": False, "output": None, "error": "%%s: %%s" %% (type(e).__name__, e)})
try:
    _s = json.dumps(_out)
except Exception:
    _out = str(_out); _s = json.dumps(_out)
if len(_s) > _maxout:
    _emit({"ok": False, "output": None, "error": "Output too large (> %%d chars)." %% _maxout})
_emit({"ok": True, "output": _out, "error": None})
''' % (_SAFE_BUILTIN_NAMES,)


def _run_in_subprocess(code: str, test_input, timeout: float) -> dict:
    """Run the skill in a separate Python process with a hard-kill timeout."""
    payload = _json.dumps({"code": code, "input": test_input, "max_output": MAX_OUTPUT_LEN})
    start = time.perf_counter()
    proc = subprocess.run(
        [sys.executable, "-I", "-c", _CHILD_RUNNER],
        input=payload, capture_output=True, text=True, timeout=timeout,
    )
    duration_ms = int((time.perf_counter() - start) * 1000)
    out = (proc.stdout or "").strip()
    if not out:
        err = (proc.stderr or "").strip()[:300] or "no output from sandbox process"
        return {"ok": False, "output": None, "error": f"sandbox error: {err}", "duration_ms": duration_ms}
    data = _json.loads(out)
    data["duration_ms"] = duration_ms
    return data


def _run_in_thread(code: str, test_input, timeout: float) -> dict:
    """Fallback: run in a daemon thread (no hard kill; a runaway thread lingers)."""
    ns = {"__builtins__": SAFE_BUILTINS}
    try:
        exec(compile(code, "<andres_skill>", "exec"), ns)  # noqa: S102
    except Exception as e:  # pragma: no cover - defensive
        return {"ok": False, "output": None, "error": f"load error: {type(e).__name__}: {e}", "duration_ms": 0}
    fn = ns.get("skill")
    if not callable(fn):
        return {"ok": False, "output": None, "error": "No callable `skill` defined.", "duration_ms": 0}
    try:
        call_input = copy.deepcopy(test_input)
    except Exception:
        call_input = test_input
    result = {}

    def _target():
        try:
            result["value"] = fn(call_input)
        except Exception as e:
            result["error"] = f"{type(e).__name__}: {e}"

    t = threading.Thread(target=_target, daemon=True)
    start = time.perf_counter()
    t.start(); t.join(timeout)
    duration_ms = int((time.perf_counter() - start) * 1000)
    if t.is_alive():
        return {"ok": False, "output": None,
                "error": f"Timed out after {timeout}s (possible infinite loop).", "duration_ms": duration_ms}
    if "error" in result:
        return {"ok": False, "output": None, "error": result["error"], "duration_ms": duration_ms}
    output = result.get("value")
    try:
        serialised = _json.dumps(output)
    except (TypeError, ValueError):
        output = str(output); serialised = _json.dumps(output)
    if len(serialised) > MAX_OUTPUT_LEN:
        return {"ok": False, "output": None, "error": f"Output too large (> {MAX_OUTPUT_LEN} chars).",
                "duration_ms": duration_ms}
    return {"ok": True, "output": output, "error": None, "duration_ms": duration_ms}


def run_in_sandbox(code: str, test_input, timeout: float = 2.0) -> dict:
    """Execute `skill(test_input)` under a timeout. Returns {ok, output, error,
    duration_ms}. Re-runs the static safety check so it can never be bypassed.

    Primary path: a real subprocess (hard kill on timeout). Falls back to a daemon
    thread if a subprocess can't be started or the input isn't serialisable.
    """
    check = static_safety_check(code)
    if not check["ok"]:
        return {"ok": False, "output": None, "error": "unsafe: " + "; ".join(check["reasons"]),
                "duration_ms": 0}

    # Cap the input size up front (cheap; before spawning anything).
    try:
        if len(_json.dumps(test_input, default=str)) > MAX_INPUT_LEN:
            return {"ok": False, "output": None,
                    "error": f"Input too large (> {MAX_INPUT_LEN} chars).", "duration_ms": 0}
        serialisable = True
    except (TypeError, ValueError):
        serialisable = False  # can't ship to a subprocess → use the thread fallback

    if _ISOLATION == "process" and serialisable:
        try:
            return _run_in_subprocess(code, test_input, timeout)
        except subprocess.TimeoutExpired:
            return {"ok": False, "output": None,
                    "error": f"Timed out after {timeout}s (process killed).",
                    "duration_ms": int(timeout * 1000)}
        except Exception as e:  # subprocess unavailable → fall back to thread
            print(f"⚠️ sandbox subprocess unavailable ({e}); falling back to thread")

    return _run_in_thread(code, test_input, timeout)
