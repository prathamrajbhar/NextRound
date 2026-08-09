import json
import os

import pytest

from agents import coding_agent
from agents.coding_agent import (
    execute_sandbox_node,
    run_coding_agent,
    CodingState,
)
from core.config import settings

CODING_BANK_PATH = os.path.join(settings.shared_data_dir, "coding-problems.json")

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


def _base_state(problem_id="virtualized-list", code=VALID_CODE, language="python"):
    return {
        "application_id": "app-coding-123",
        "problem_id": problem_id,
        "code": code,
        "language": language,
    }


def _force_static_heuristic(monkeypatch):
    """Short-circuit the LLM complexity analysis so tests only exercise the
    deterministic static heuristic (no live Gemini/network in tests)."""
    monkeypatch.setattr(coding_agent, "generate_text", lambda prompt: None)

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
async def test_run_coding_evaluation_end_to_end(monkeypatch):
    _force_static_heuristic(monkeypatch)
    result = await run_coding_agent(
        application_id="app-coding-789",
        problem_id="virtualized-list",
        code=VALID_CODE,
        language="python",
    )

    assert "passed" in result
    assert "pass_rate" in result
    assert "feedback" in result


@pytest.mark.asyncio
async def test_run_coding_agent_reports_real_telemetry(monkeypatch):
    """memory_kb must be int-or-None (never the old fabricated 42000) and
    complexity_analysis must be dict-or-None (never a canned value)."""
    _force_static_heuristic(monkeypatch)
    result = await run_coding_agent(
        application_id="app-coding-tel",
        problem_id="virtualized-list",
        code=VALID_CODE,
        language="python",
    )

    assert "memory_kb" in result
    assert result["memory_kb"] is None or isinstance(result["memory_kb"], int)
    assert result["memory_kb"] != 42000

    assert "complexity_analysis" in result
    assert result["complexity_analysis"] is None or isinstance(result["complexity_analysis"], dict)


# --- Canonical coding problem bank (packages/shared/data) -------------------


def test_canonical_coding_bank_loads_and_every_problem_has_test_cases():
    """Guards the execute_sandbox_node RuntimeError: the canonical bank must
    never be empty and every problem must define >= 1 test case so the honest
    failure path cannot fire spuriously."""
    with open(CODING_BANK_PATH, "r", encoding="utf-8") as f:
        problems = json.load(f)

    assert isinstance(problems, list)
    assert len(problems) > 0

    ids = [p.get("id") for p in problems]
    assert len(ids) == len(set(ids)), "coding problem ids must be unique"

    for p in problems:
        assert p.get("id"), p.get("title")
        assert p.get("title")
        assert isinstance(p.get("testCases"), list) and len(p["testCases"]) >= 1
        for tc in p["testCases"]:
            assert "input" in tc and "expectedOutput" in tc


def test_execute_sandbox_node_raises_on_empty_bank(monkeypatch, tmp_path):
    empty_bank = tmp_path / "coding-problems.json"
    empty_bank.write_text("[]", encoding="utf-8")
    monkeypatch.setattr(coding_agent, "_CODING_PROBLEMS_PATH", str(empty_bank))

    with pytest.raises(RuntimeError, match="empty"):
        execute_sandbox_node(_base_state())


def test_execute_sandbox_node_raises_when_bank_missing(monkeypatch):
    monkeypatch.setattr(
        coding_agent,
        "_CODING_PROBLEMS_PATH",
        "/nonexistent/shared/data/coding-problems.json",
    )

    with pytest.raises(RuntimeError, match="not found"):
        execute_sandbox_node(_base_state())


def test_execute_sandbox_node_raises_on_problem_without_test_cases(monkeypatch, tmp_path):
    bank = [{"id": "no-cases", "title": "Broken problem", "testCases": []}]
    broken = tmp_path / "coding-problems.json"
    broken.write_text(json.dumps(bank), encoding="utf-8")
    monkeypatch.setattr(coding_agent, "_CODING_PROBLEMS_PATH", str(broken))

    with pytest.raises(RuntimeError, match="no testCases"):
        execute_sandbox_node(_base_state(problem_id="no-cases"))

