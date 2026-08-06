import pytest
from agents.interviewer_agent import (
    load_context_node,
    evaluate_last_answer_node,
    decide_next_action_node,
    generate_question_node,
    close_interview_node,
    run_interviewer_agent,
    InterviewerState,
)

def test_load_context_node_initializes_defaults():
    state: InterviewerState = {
        "interview_id": "int-123",
        "job_title": "Fullstack Lead",
    }
    result = load_context_node(state)
    assert result["current_stage"] == "intro"
    assert result["turn_number"] == 0
    assert "technical" in result["scores_so_far"]

def test_evaluate_last_answer_flags_shallow_response():
    state: InterviewerState = {
        "interview_id": "int-123",
        "current_stage": "technical",
        "turn_number": 2,
        "latest_candidate_response": "I don't know",
        "evasion_flags": [],
        "scores_so_far": {"technical": 80.0},
    }
    result = evaluate_last_answer_node(state)
    assert len(result["evasion_flags"]) > 0

def test_decide_next_action_advances_stage():
    state: InterviewerState = {
        "turn_number": 1,
        "current_stage": "intro",
        "follow_up_depth": 0,
        "latest_candidate_response": "Hello, I am excited to interview for this position.",
    }
    result = decide_next_action_node(state)
    assert result["next_action"] == "advance_stage"

def test_close_interview_node_generates_final_scorecard():
    state: InterviewerState = {
        "interview_id": "int-999",
        "scores_so_far": {"technical": 85.0, "communication": 90.0, "problemSolving": 80.0},
        "turn_number": 10,
        "evasion_flags": [],
    }
    result = close_interview_node(state)
    assert result["is_complete"] is True
    assert "final_scorecard" in result
    assert result["final_scorecard"]["overall_score"] >= 80.0

def test_run_interviewer_agent_turn():
    state: InterviewerState = {
        "interview_id": "int-step-1",
        "job_title": "Senior AI Engineer",
        "turn_number": 0,
        "latest_candidate_response": "",
    }
    result = run_interviewer_agent(state)
    assert "latest_ai_response" in result
    assert result["turn_number"] >= 1
