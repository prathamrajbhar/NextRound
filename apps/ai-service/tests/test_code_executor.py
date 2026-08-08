import pytest
from fastapi.testclient import TestClient
from services.code_executor_service import validate_ast_security, execute_code_sandbox


def test_ast_security_blocks_forbidden_imports():
    """Verify AST security filter blocks dangerous system module imports."""
    bad_code_1 = "import os\nos.system('echo hacked')"
    is_safe_1, err_1 = validate_ast_security(bad_code_1)
    assert is_safe_1 is False
    assert "module 'os' is strictly forbidden" in err_1

    bad_code_2 = "from subprocess import Popen"
    is_safe_2, err_2 = validate_ast_security(bad_code_2)
    assert is_safe_2 is False
    assert "subprocess" in err_2


def test_ast_security_blocks_forbidden_calls():
    """Verify AST security filter blocks dangerous builtins like eval(), exec(), open()."""
    bad_code = "f = open('/etc/passwd', 'r')"
    is_safe, err = validate_ast_security(bad_code)
    assert is_safe is False
    assert "open()" in err


def test_ast_security_allows_valid_algorithms():
    """Verify AST security filter allows standard algorithmic Python code."""
    valid_code = """
def get_visible_range(heights, scroll_y, viewport_height):
    start = scroll_y // 50
    end = (scroll_y + viewport_height) // 50
    return [start, end]
"""
    is_safe, err = validate_ast_security(valid_code)
    assert is_safe is True
    assert err == ""


def test_execute_code_sandbox_valid_solution():
    """Verify execute_code_sandbox runs valid algorithm against test cases."""
    code = """
def get_visible_range(heights, scroll_y, viewport_height):
    start = scroll_y // 50
    end = (scroll_y + viewport_height) // 50
    return [start, end]
"""
    cases = [
        {"input": "heights = [50, 50, 50, 50, 50], scroll_y = 100, viewport_height = 100", "expectedOutput": "[2, 4]"}
    ]
    res = execute_code_sandbox(code, "python", test_cases=cases)
    assert res["security_passed"] is True
    assert res["total_cases"] == 1
    assert res["passed_cases"] == 1
    assert res["pass_rate"] == 1.0


def test_execute_code_sandbox_security_rejection():
    """Verify execute_code_sandbox rejects dangerous submissions before process launch."""
    code = "import socket\ns = socket.socket()"
    res = execute_code_sandbox(code, "python", test_cases=[])
    assert res["security_passed"] is False
    assert res["pass_rate"] == 0.0
    assert "socket" in res["error"]


def test_coding_execute_endpoint():
    """Test POST /api/v1/ai/coding/execute endpoint."""
    from main import app
    client = TestClient(app)

    code = """
def get_visible_range(heights, scroll_y, viewport_height):
    return [2, 4]
"""
    res = client.post(
        "/api/v1/ai/coding/execute",
        json={
            "code": code,
            "language": "python",
            "problemId": "virtualized-list",
            "testCases": [
                {"input": "heights = [50], scroll_y = 100, viewport_height = 100", "expectedOutput": "[2, 4]"}
            ]
        }
    )
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["pass_rate"] == 1.0
    assert data["security_passed"] is True
    assert "execution_time_ms" in data
