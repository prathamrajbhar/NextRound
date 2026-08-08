import pytest
from agents.coding_agent import (
    execute_sandbox_node,
    run_coding_agent,
    CodingState,
)

def test_execute_sandbox_node_runs_valid_python_code():
    valid_code = """
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
    state: CodingState = {
        "application_id": "app-coding-123",
        "problem_id": "virtualized-list",
        "code": valid_code,
        "language": "python",
    }

    result = execute_sandbox_node(state)
    assert result["passed_cases"] > 0
    assert result["pass_rate"] == 1.0


def test_execute_sandbox_node_handles_syntax_error():
    invalid_code = """
def broken_function(:
    return 100
"""
    state: CodingState = {
        "application_id": "app-coding-123",
        "problem_id": "virtualized-list",
        "code": invalid_code,
        "language": "python",
    }

    result = execute_sandbox_node(state)
    assert result["passed_cases"] == 0
    assert result["pass_rate"] == 0.0


@pytest.mark.asyncio
async def test_run_coding_evaluation_end_to_end():
    valid_code = """
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
    result = await run_coding_agent(
        application_id="app-coding-789",
        problem_id="virtualized-list",
        code=valid_code,
        language="python",
    )

    assert "passed" in result
    assert "pass_rate" in result
    assert "feedback" in result

