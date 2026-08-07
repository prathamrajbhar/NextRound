import pytest
from agents.mock_interviewer_agent import run_mock_interviewer_agent, MockInterviewerState

def test_run_mock_interviewer_agent_first_turn_without_client():
    state: MockInterviewerState = {
        "session_id": "mock-session-123",
        "topic": "System Design",
        "difficulty": "medium",
        "target_role": "Backend Architect",
        "target_company": "Stripe",
        "turn_number": 0,
        "latest_candidate_response": ""
    }
    result = run_mock_interviewer_agent(state)
    assert "latest_ai_response" in result
    # Without a Gemini client the agent must not fabricate a canned response.
    assert result["latest_ai_response"] == ""
    assert result["coaching_hint"] is None
    assert result["turn_number"] == 1
    assert result["is_complete"] is False

def test_run_mock_interviewer_agent_completes_after_6_turns():
    state: MockInterviewerState = {
        "session_id": "mock-session-456",
        "topic": "Algorithms",
        "turn_number": 5,
        "latest_candidate_response": "I used a hash map to achieve O(N) time complexity."
    }
    result = run_mock_interviewer_agent(state)
    assert result["turn_number"] == 6
    assert result["is_complete"] is True