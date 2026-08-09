import pytest

from agents import coding_agent
from agents.coding_agent import (
    execute_sandbox_node,
    run_coding_agent,
    CodingState,
)

VALID_CODE = """
def get_visible_range(heights, scroll_y, viewport_height):
    current = 0
    start = None
    end = None
    for i, h in enumerate(heights):
        if current + h > scroll_y and start is None:
            start = i
        if current >= scroll_y + viewport_height and end is None:
            end = i - 1
            break
        current += h
    if start is not None and end is None:
        end = len(heights) - 1
    return [start if start is not None else 0, end if end is not None else 0]
"""

MOCK_TEST_CASES = [
    {
        "input": "heights = [50, 50, 50, 50, 50], scroll_y = 100, viewport_height = 100",
        "expectedOutput": "[2, 3]",
        "hidden": False
    }
]

def _base_state(problem_id="virtualized-list", code=VALID_CODE, language="python"):
    return {
        "application_id": "app-coding-123",
        "problem_id": problem_id,
        "code": code,
        "language": language,
        "test_cases": MOCK_TEST_CASES,
        "entry_function": "get_visible_range"
    }


def _force_static_heuristic(monkeypatch):
    monkeypatch.setattr(coding_agent, "generate_text", lambda prompt: None)


def test_execute_sandbox_node_runs_valid_python_code():
    state: CodingState = _base_state()
    result = execute_sandbox_node(state)
    assert result["passed_cases"] > 0
    assert result["pass_rate"] == 1.0


def test_execute_sandbox_node_handles_syntax_error():
    invalid_code = """
def broken_function(:
    return 100
"""
    state: CodingState = _base_state(code=invalid_code)
    result = execute_sandbox_node(state)
    assert result["passed_cases"] == 0
    assert result["pass_rate"] == 0.0


@pytest.mark.asyncio
async def test_run_coding_evaluation_end_to_end(monkeypatch):
    _force_static_heuristic(monkeypatch)
    result = await run_coding_agent(
        application_id="app-coding-789",
        problem_id="virtualized-list",
        code=VALID_CODE,
        language="python",
        test_cases=MOCK_TEST_CASES,
        entry_function="get_visible_range"
    )

    assert "passed" in result
    assert "pass_rate" in result
    assert "feedback" in result


@pytest.mark.asyncio
async def test_run_coding_agent_reports_real_telemetry(monkeypatch):
    _force_static_heuristic(monkeypatch)
    result = await run_coding_agent(
        application_id="app-coding-tel",
        problem_id="virtualized-list",
        code=VALID_CODE,
        language="python",
        test_cases=MOCK_TEST_CASES,
        entry_function="get_visible_range"
    )

    assert "memory_kb" in result
    assert result["memory_kb"] is None or isinstance(result["memory_kb"], int)
    assert result["memory_kb"] != 42000

    assert "complexity_analysis" in result
    assert result["complexity_analysis"] is None or isinstance(result["complexity_analysis"], dict)


def test_execute_sandbox_node_raises_on_missing_test_cases():
    state: CodingState = {
        "application_id": "app-coding-123",
        "problem_id": "virtualized-list",
        "code": VALID_CODE,
        "language": "python",
    }
    with pytest.raises(RuntimeError, match="No test cases provided"):
        execute_sandbox_node(state)



