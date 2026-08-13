import ast
import json
import logging
import os
import resource
import subprocess
import textwrap
import time
from typing import Dict, Any, List, Tuple, Optional

logger = logging.getLogger("code_executor_service")

FORBIDDEN_MODULES = {
    "os", "sys", "subprocess", "socket", "shutil", "importlib",
    "builtins", "pty", "commands", "ctypes", "signal", "threading",
    "multiprocessing", "pickle", "urllib", "requests", "httpx"
}

FORBIDDEN_CALLS = {
    "eval", "exec", "open", "__import__", "getattr", "setattr", "delattr"
}


def validate_ast_security(code: str, language: str = "python") -> Tuple[bool, str]:
    """
    Perform AST static security analysis on Python code to block malicious imports,
    forbidden system calls, and file I/O operations.
    """
    if language.lower() not in ("python", "py", "python3"):
        return True, ""

    dedented_code = textwrap.dedent(code or "").strip()
    try:
        tree = ast.parse(dedented_code)
    except SyntaxError as e:
        return False, f"Syntax Error: {e.msg} on line {e.lineno}"
    except Exception as e:
        return False, f"Invalid code syntax: {e}"


    for node in ast.walk(tree):

        if isinstance(node, ast.Import):
            for alias in node.names:
                mod_base = alias.name.split(".")[0]
                if mod_base in FORBIDDEN_MODULES:
                    return False, f"Security Violation: Import of module '{alias.name}' is strictly forbidden in sandbox."


        elif isinstance(node, ast.ImportFrom):
            if node.module:
                mod_base = node.module.split(".")[0]
                if mod_base in FORBIDDEN_MODULES:
                    return False, f"Security Violation: Import from module '{node.module}' is strictly forbidden in sandbox."


        elif isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name):
                if node.func.id in FORBIDDEN_CALLS:
                    return False, f"Security Violation: Execution of forbidden function '{node.func.id}()' is prohibited."
            elif isinstance(node.func, ast.Attribute):
                if node.func.attr in FORBIDDEN_CALLS:
                    return False, f"Security Violation: Method call '{node.func.attr}()' is prohibited."

    return True, ""


def set_sandbox_resource_limits():
    """Set OS process resource caps for execution child processes (Linux only)."""
    if os.name == "nt":
        return

    try:

        max_mem_bytes = 256 * 1024 * 1024
        resource.setrlimit(resource.RLIMIT_AS, (max_mem_bytes, max_mem_bytes))
    except Exception as e:
        logger.debug(f"Failed to set RLIMIT_AS: {e}")

    try:

        resource.setrlimit(resource.RLIMIT_CPU, (5, 5))
    except Exception as e:
        logger.debug(f"Failed to set RLIMIT_CPU: {e}")


def _detect_function_name(code: str) -> str:
    """Extract candidate function name from Python code AST."""
    try:
        tree = ast.parse(code)
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                return node.name
    except Exception:
        pass
    return "solution"


def execute_code_sandbox(
    code: str,
    language: str = "python",
    test_cases: Optional[List[Dict[str, Any]]] = None,
    entry_function: str = ""
) -> Dict[str, Any]:
    """
    Execute candidate code against multiple test cases inside an AST-inspected,
    resource-constrained Python subprocess sandbox.
    """
    if not code or not code.strip():
        return {
            "success": False,
            "passed_cases": 0,
            "total_cases": 0,
            "pass_rate": 0.0,
            "execution_time_ms": 0.0,
            "memory_kb": None,
            "error": "Code payload cannot be empty",
            "security_passed": True,
            "test_results": [],
        }


    is_safe, sec_error = validate_ast_security(code, language)
    if not is_safe:
        return {
            "success": False,
            "passed_cases": 0,
            "total_cases": len(test_cases or []),
            "pass_rate": 0.0,
            "execution_time_ms": 0.0,
            "memory_kb": None,
            "error": sec_error,
            "security_passed": False,
            "test_results": [],
        }

    clean_code = textwrap.dedent(code or "").strip()

    if not test_cases:
        return {
            "success": False,
            "passed_cases": 0,
            "total_cases": 0,
            "pass_rate": 0.0,
            "execution_time_ms": 0.0,
            "memory_kb": None,
            "error": "No test cases provided for sandbox execution.",
            "security_passed": True,
            "test_results": [],
        }
    cases = test_cases
    fn_name = entry_function or _detect_function_name(clean_code)

    results = []
    passed_count = 0
    total_duration_ms = 0.0
    peak_memory_kb = None
    start_all = time.time()


    harness_template = f"""
import sys
import json
import traceback

{clean_code}


test_inputs = {repr(cases)}


for idx, case in enumerate(test_inputs):
    try:
        inp_raw = case.get("input", "")
        import re
        inp_statements = re.sub(r',\\s*([a-zA-Z_][a-zA-Z0-9_]*\\s*=)', r'\\n\\1', inp_raw)
        
        local_scope = {{}}
        exec(inp_statements, globals(), local_scope)
        
        if "{fn_name}" in globals():
            fn = globals()["{fn_name}"]
        elif "{fn_name}" in local_scope:
            fn = local_scope["{fn_name}"]
        else:
            funcs = [obj for name, obj in globals().items() if callable(obj) and not name.startswith("_")]
            fn = funcs[-1] if funcs else None

        if not fn:
            print(json.dumps({{"case": idx, "passed": False, "error": "Function '{fn_name}' not found."}}))
            continue

        result = fn(**local_scope) if local_scope else fn()
        expected_raw = case.get("expectedOutput", "")
        
        str_res = json.dumps(result) if isinstance(result, (list, dict)) else str(result)
        str_exp = str(expected_raw)
        
        passed = (
            str_res == str_exp or
            str_res.replace(" ", "") == str_exp.replace(" ", "") or
            str(result).lower() == str_exp.lower()
        )
        print(json.dumps({{"case": idx, "passed": passed, "output": str_res, "expected": str_exp}}))
    except Exception as err:
        print(json.dumps({{"case": idx, "passed": False, "error": str(err)}}))


import re as _re
try:
    with open("/proc/self/status") as _st:
        _hwm = [l for l in _st.read().splitlines() if l.startswith("VmHWM:")]
    _peak_kb = int(_hwm[0].split()[1]) if _hwm else None
except Exception:
    _peak_kb = None
print(json.dumps({{"__peak_memory_kb__": _peak_kb}}))
"""


    try:
        proc = subprocess.run(
            ["python3", "-c", harness_template],
            timeout=10,
            capture_output=True,
            text=True,
            preexec_fn=set_sandbox_resource_limits if os.name != "nt" else None,
        )
        total_duration_ms = round((time.time() - start_all) * 1000, 2)

        if proc.returncode == 0:
            for line in proc.stdout.strip().split("\n"):
                if not line.strip():
                    continue
                try:
                    res_obj = json.loads(line)
                except Exception:
                    continue
                if res_obj.get("__peak_memory_kb__") is not None:
                    peak_memory_kb = res_obj["__peak_memory_kb__"]
                    continue
                results.append(res_obj)
                if res_obj.get("passed"):
                    passed_count += 1
        else:
            error_msg = proc.stderr.strip() or f"Process exited with code {proc.returncode}"
            results.append({"passed": False, "error": error_msg})

    except subprocess.TimeoutExpired:
        total_duration_ms = 10000.0
        results.append({"passed": False, "error": "Execution timed out after 10 seconds limit."})
    except Exception as e:
        results.append({"passed": False, "error": str(e)})

    total_cases = len(cases)
    pass_rate = round(passed_count / max(1, total_cases), 2)



    measured_memory_kb = None
    if isinstance(peak_memory_kb, (int, float)) and peak_memory_kb >= 0:
        measured_memory_kb = int(peak_memory_kb)

    return {
        "success": pass_rate > 0 or len(results) > 0,
        "passed_cases": passed_count,
        "total_cases": total_cases,
        "pass_rate": pass_rate,
        "execution_time_ms": total_duration_ms,
        "memory_kb": measured_memory_kb,
        "security_passed": True,
        "test_results": results,
    }
