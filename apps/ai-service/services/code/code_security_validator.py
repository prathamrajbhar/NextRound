import ast
import logging
import os
import textwrap
from typing import Tuple

try:
    import resource
except ImportError:
    resource = None

logger = logging.getLogger("code_security_validator")

FORBIDDEN_MODULES = {
    "os", "sys", "subprocess", "socket", "shutil", "importlib",
    "builtins", "pty", "commands", "ctypes", "signal", "threading",
    "multiprocessing", "pickle", "urllib", "requests", "httpx"
}

FORBIDDEN_CALLS = {
    "eval", "exec", "open", "__import__", "getattr", "setattr", "delattr"
}

def validate_ast_security(code: str, language: str = "python") -> Tuple[bool, str]:
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
    if os.name == "nt" or resource is None:
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
    try:
        tree = ast.parse(code)
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                return node.name
    except Exception:
        pass
    return "solution"
