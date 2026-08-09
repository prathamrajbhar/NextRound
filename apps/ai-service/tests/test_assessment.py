import pytest
from agents.assessment_agent import (
    evaluate_answers_node,
    compute_verdict_node,
    run_assessment_agent,
    AssessmentState,
)

def test_evaluate_answers_node_calculates_scores():
    state: AssessmentState = {
        "application_id": "app-test-123",
        "answers": [
            {"questionId": "q1", "selectedOptionIndex": 0, "category": "Logical"},
            {"questionId": "q2", "selectedOptionIndex": 1, "category": "Logical"},
            {"questionId": "q3", "selectedOptionIndex": 2, "category": "Numerical"},
        ],
        "stored_questions": [
            {"id": "q1", "correctIndex": 0, "category": "Logical"},
            {"id": "q2", "correctIndex": 1, "category": "Logical"},
            {"id": "q3", "correctIndex": 2, "category": "Numerical"},
        ],
        "total_time_seconds": 120,
        "tab_switch_count": 1,
        "min_score": 60.0,
    }

    result = evaluate_answers_node(state)
    assert "score" in result
    assert "category_scores" in result
    assert result["total_questions"] == 3
    assert result["score"] >= 0.0

def test_compute_verdict_node_evaluates_thresholds():
    state: AssessmentState = {
        "application_id": "app-test-123",
        "score": 80.0,
        "min_score": 70.0,
        "correct_count": 4,
        "total_questions": 5,
        "tab_switch_count": 4,
    }

    result = compute_verdict_node(state)
    assert result["passed"] is True
    assert "Warning: 4 tab switches recorded" in result["feedback"]

@pytest.mark.asyncio
async def test_run_assessment_pipeline_end_to_end():
    result = await run_assessment_agent(
        application_id="app-456",
        answers=[
            {"questionId": "q1", "selectedOptionIndex": 0, "category": "Logical"},
            {"questionId": "q2", "selectedOptionIndex": 0, "category": "Verbal"},
        ],
        total_time_seconds=90,
        tab_switch_count=0,
        min_score=50.0,
        stored_questions=[
            {"id": "q1", "correctIndex": 0, "category": "Logical"},
            {"id": "q2", "correctIndex": 1, "category": "Verbal"},
        ],
    )

    assert "score" in result
    assert "passed" in result
    assert "feedback" in result
