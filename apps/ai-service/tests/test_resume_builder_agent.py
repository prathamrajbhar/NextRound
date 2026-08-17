import pytest
from agents.resume_builder_agent import run_resume_builder_agent, _build_turn_prompt, SYSTEM_PROMPT

def test_system_prompt_conciseness_rules():
    """Verify that the system prompt strictly enforces concise human-like questions."""
    assert "under 15 words" in SYSTEM_PROMPT.lower()
    assert "one single, short question" in SYSTEM_PROMPT.lower()
    assert "never repeat yourself" in SYSTEM_PROMPT.lower()

def test_build_turn_prompt_formatting():
    """Test turn prompt formatting for resume builder agent."""
    state = {
        "session_id": "test-session-123",
        "target_role": "Senior Full Stack Engineer",
        "target_company": "Target Enterprise",
        "current_stage": "intro",
        "turn_number": 1,
        "latest_candidate_response": "I have 5 years of React and Python experience.",
        "conversation_history": [
            {"speaker": "ai", "text": "Hi! What's your primary tech stack?"},
            {"speaker": "candidate", "text": "I have 5 years of React and Python experience."}
        ],
        "memory": {}
    }
    
    prompt = _build_turn_prompt(
        state=state,
        memory={},
        asked=["What is your tech stack?"],
        target_role="Senior Full Stack Engineer",
        target_company="Target Enterprise"
    )

    assert "Senior Full Stack Engineer" in prompt
    assert "React and Python" in prompt
    assert "JSON" in prompt

def test_run_resume_builder_agent_initial_turn():
    """Test initial greeting turn of resume builder agent."""
    initial_state = {
        "session_id": "session-1",
        "target_role": "Frontend Developer",
        "target_company": "Acme Inc",
        "current_stage": "intro",
        "turn_number": 0,
        "latest_candidate_response": "",
        "conversation_history": [],
        "memory": {}
    }

    res_state = run_resume_builder_agent(initial_state)

    assert res_state["turn_number"] == 1
    assert "latest_ai_response" in res_state
    assert res_state["current_stage"] == "intro"
    assert res_state["is_complete"] is False

def test_run_resume_builder_agent_closing():
    """Test automatic session completion on max turns reached."""
    max_state = {
        "session_id": "session-2",
        "target_role": "Backend Engineer",
        "target_company": "Acme Inc",
        "current_stage": "education",
        "turn_number": 13,
        "latest_candidate_response": "I graduated with a CS degree.",
        "conversation_history": [],
        "memory": {}
    }

    res_state = run_resume_builder_agent(max_state)

    assert res_state["is_complete"] is True
    assert res_state["current_stage"] == "closing"
