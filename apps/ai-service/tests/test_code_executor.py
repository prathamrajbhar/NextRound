import pytest
from fastapi.testclient import TestClient
from services.code_executor_service import validate_ast_security, execute_code_sandbox
from routes.coding_routes import CodeExecutionResponse


def _assert_no_fabricated_telemetry(res: dict):
    """memory_kb must be a measured int or None — never the old 42000 constant."""
    assert res["memory_kb"] is None or isinstance(res["memory_kb"], int)
    assert res["memory_kb"] != 42000


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
    _assert_no_fabricated_telemetry(res)


def test_execute_code_sandbox_security_rejection():
    """Verify execute_code_sandbox rejects dangerous submissions before process launch."""
    code = "import socket\ns = socket.socket()"
    res = execute_code_sandbox(code, "python", test_cases=[])
    assert res["security_passed"] is False
    assert res["pass_rate"] == 0.0
    assert "socket" in res["error"]
    assert res["memory_kb"] is None


def test_empty_code_returns_none_memory():
    """Empty code never reports a fabricated peak-memory figure."""
    res = execute_code_sandbox("", "python", test_cases=[{"input": "x = 1", "expectedOutput": "1"}])
    assert res["memory_kb"] is None
    assert res["error"] == "Code payload cannot be empty"


def test_no_test_cases_returns_none_memory():
    """No test cases is an honest failure with memory_kb=None (no hardcoded KB)."""
    res = execute_code_sandbox("def solution():\n    return 1", "python", test_cases=None)
    assert res["memory_kb"] is None
    assert "No test cases" in res["error"]


# --- Response-model serialization (memory_kb / complexity_analysis) --------


def test_code_execution_response_serializes_none_telemetry():
    model = CodeExecutionResponse(
        success=True,
        score=80.0,
        pass_rate=0.8,
        passed_cases=4,
        total_cases=5,
        execution_time_ms=12.5,
        memory_kb=None,
        complexity_analysis=None,
        passed=True,
        feedback="Passed 4/5 test cases.",
    )
    data = model.model_dump()
    assert data["memory_kb"] is None
    assert data["complexity_analysis"] is None


def test_code_execution_response_accepts_int_memory_and_dict_complexity():
    model = CodeExecutionResponse(
        success=True,
        score=100.0,
        pass_rate=1.0,
        passed_cases=1,
        total_cases=1,
        execution_time_ms=1.0,
        memory_kb=12345,
        complexity_analysis={"time_complexity": "O(N)"},
        passed=True,
        feedback="ok",
    )
    assert model.memory_kb == 12345
    assert model.complexity_analysis == {"time_complexity": "O(N)"}


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
    # Direct sandbox path: real memory (int or None) and no canned complexity.
    assert data["memory_kb"] is None or isinstance(data["memory_kb"], int)
    assert data["memory_kb"] != 42000
    assert data["complexity_analysis"] is None
