import pytest
from agents.resume_builder_agent import run_resume_builder_agent, ResumeBuilderState

def test_run_resume_builder_agent_initial_turn():
    state: ResumeBuilderState = {
        "session_id": "res-session-123",
        "target_role": "Lead Frontend Engineer",
        "target_company": "Acme Corp",
        "turn_number": 0,
        "latest_candidate_response": ""
    }
    result = run_resume_builder_agent(state)
    assert "latest_ai_response" in result
    assert result["turn_number"] == 1
    assert result["is_complete"] is False

def test_run_resume_builder_agent_advances_to_closing():
    state: ResumeBuilderState = {
        "session_id": "res-session-456",
        "current_stage": "education",
        "turn_number": 9,
        "latest_candidate_response": "B.S. in Computer Science from UC Berkeley."
    }
    result = run_resume_builder_agent(state)
    assert result["is_complete"] is True
