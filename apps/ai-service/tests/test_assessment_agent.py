import sys
import os
import pytest

sys.path.insert(0, '/home/pratham/Disk1/NextRound/apps/ai-service')

from agents.assessment_agent import run_assessment_agent


@pytest.mark.asyncio
async def test_assessment_agent_scoring_with_selected_option():
    """Verify that scoring works correctly when candidate answers use the 'selectedOption' key."""
    stored_questions = [
        {"id": "q1", "category": "Math", "correctIndex": 2},
        {"id": "q2", "category": "Logic", "correctIndex": 0},
        {"id": "q3", "category": "Verbal", "correctIndex": 3},
    ]

    # Two correct answers (q1 correct: 2, q2 correct: 0), one incorrect (q3 correct: 3, given: 1)
    answers = [
        {"questionId": "q1", "selectedOption": 2},
        {"questionId": "q2", "selectedOption": 0},
        {"questionId": "q3", "selectedOption": 1},
    ]

    result = await run_assessment_agent(
        application_id="test_app_1",
        answers=answers,
        stored_questions=stored_questions,
        min_score=50.0
    )

    # 2/3 correct = 66.7%
    assert result["score"] == 66.7
    assert result["correct_answers"] == 2
    assert result["total_questions"] == 3
    assert result["passed"] is True
    assert "Logical" in result["category_scores"] or "Logic" in result["category_scores"]
    print("✓ test_assessment_agent_scoring_with_selected_option passed")


@pytest.mark.asyncio
async def test_assessment_agent_scoring_with_selected_option_index():
    """Verify that scoring also works correctly when candidate answers use the legacy 'selectedOptionIndex' key."""
    stored_questions = [
        {"id": "q1", "category": "Math", "correctIndex": 2},
        {"id": "q2", "category": "Logic", "correctIndex": 1},
    ]

    # One correct answer (q1 correct: 2), one incorrect (q2 correct: 1, given: 2)
    answers = [
        {"questionId": "q1", "selectedOptionIndex": 2},
        {"questionId": "q2", "selectedOptionIndex": 2},
    ]

    result = await run_assessment_agent(
        application_id="test_app_2",
        answers=answers,
        stored_questions=stored_questions,
        min_score=60.0
    )

    # 1/2 correct = 50.0%
    assert result["score"] == 50.0
    assert result["correct_answers"] == 1
    assert result["total_questions"] == 2
    assert result["passed"] is False
    print("✓ test_assessment_agent_scoring_with_selected_option_index passed")


@pytest.mark.asyncio
async def test_assessment_agent_scoring_with_correct_index_property():
    """Verify that scoring handles the 'correct_index' DB column style key in stored questions."""
    stored_questions = [
        {"id": "q1", "category": "Math", "correct_index": 2},
        {"id": "q2", "category": "Logic", "correct_index": 1},
    ]

    # Both correct
    answers = [
        {"questionId": "q1", "selectedOption": 2},
        {"questionId": "q2", "selectedOption": 1},
    ]

    result = await run_assessment_agent(
        application_id="test_app_3",
        answers=answers,
        stored_questions=stored_questions,
        min_score=60.0
    )

    assert result["score"] == 100.0
    assert result["correct_answers"] == 2
    assert result["total_questions"] == 2
    assert result["passed"] is True
    print("✓ test_assessment_agent_scoring_with_correct_index_property passed")
