"""
Unit tests for Evaluator & Bias Audit Agent (Zero-Leakage Scoring Isolation)
"""
import pytest
from agents.evaluator_agent import (
    aggregate_scores_node,
    validate_isolation_node,
    compute_confidence_node,
    run_evaluator_agent,
    ScoringIsolationError,
    EvaluatorState,
)


def test_aggregate_scores_weighting():
    """Verify composite score is calculated with exact 20% Scr, 20% Apt, 30% Cod, 30% Inv weighting."""
    state: EvaluatorState = {
        "application_id": "app-test-1",
        "screening_score": 80.0,
        "aptitude_score": 90.0,
        "coding_score": 100.0,
        "interview_score": 70.0,
    }
    updated = aggregate_scores_node(state)
    # Expected: (80*0.2) + (90*0.2) + (100*0.3) + (70*0.3) = 16 + 18 + 30 + 21 = 85.0
    assert updated["composite_score"] == 85.0
    assert "technical_competency" in updated["dimension_scores"]


def test_validate_isolation_passes():
    """Verify validate_isolation_node passes when no proctoring signals are present."""
    state: EvaluatorState = {
        "application_id": "app-clean",
        "scoring_inputs_used": {"screening_score": 80, "coding_score": 90},
        "prompt_payload_used": "Analyze candidate technical competency and problem solving metrics.",
    }
    res = validate_isolation_node(state)
    assert res["isolation_valid"] is True


def test_validate_isolation_raises_on_scoring_inputs_leak():
    """Verify validate_isolation_node raises ScoringIsolationError if proctor_flags in scoring_inputs."""
    state: EvaluatorState = {
        "application_id": "app-leaked-inputs",
        "scoring_inputs_used": {"screening_score": 80, "proctor_flags": ["gaze_off_screen"]},
        "prompt_payload_used": "Analyze metrics",
    }
    with pytest.raises(ScoringIsolationError) as exc_info:
        validate_isolation_node(state)
    assert "proctor_flags" in str(exc_info.value)


def test_validate_isolation_raises_on_prompt_leak():
    """Verify validate_isolation_node raises ScoringIsolationError if gaze/face signals leak into LLM prompt."""
    state: EvaluatorState = {
        "application_id": "app-leaked-prompt",
        "scoring_inputs_used": {"screening_score": 80},
        "prompt_payload_used": "Candidate had 3 tab_switches and low eye_contact during interview.",
    }
    with pytest.raises(ScoringIsolationError) as exc_info:
        validate_isolation_node(state)
    assert "tab_switches" in str(exc_info.value) or "eye_contact" in str(exc_info.value)


@pytest.mark.asyncio
async def test_run_evaluator_agent_e2e():
    """Verify run_evaluator_agent executes end-to-end and returns structured evaluation payload."""
    res = await run_evaluator_agent(
        application_id="app-e2e-123",
        screening_score=85.0,
        aptitude_score=88.0,
        coding_score=92.0,
        interview_score=90.0,
    )
    assert res["application_id"] == "app-e2e-123"
    assert res["composite_score"] > 85.0
    assert res["isolation_valid"] is True




