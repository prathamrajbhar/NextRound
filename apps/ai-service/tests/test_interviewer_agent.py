import sys
import json

sys.path.insert(0, "/home/pratham/Disk1/NextRound/apps/ai-service")

import pytest

import agents.interviewer_agent as ia
from agents.interviewer_agent import (
    load_context_node,
    evaluate_last_answer_node,
    decide_next_action_node,
    generate_question_node,
    generate_follow_up_node,
    advance_skill_node,
    close_interview_node,
    run_interviewer_agent,
    _is_duplicate,
)


SAMPLE_CONTEXT = {
    "candidate": {
        "fullName": "Alex Morgan",
        "headline": "Senior Full-Stack Engineer",
        "yearsOfExperience": 6,
    },
    "resume": {"rawText": "Experienced in React, Node and Go. Built payment systems."},
    "social": {
        "github": {
            "username": "alexmorgan",
            "repositories": [{"name": "pay-core", "description": "Payment platform", "language": "Go"}],
        },
        "linkedin": {
            "headline": "Senior Full-Stack Engineer",
            "experiences": [{"role": "Lead Engineer", "company": "Acme"}],
        },
    },
    "skills": ["TypeScript", "Go", "React"],
    "projects": [{"name": "pay-core"}],
    "experience": [{"title": "Lead Engineer", "company": "Acme"}],
    "education": [{"degree": "B.Tech"}],
    "job": {
        "title": "Staff Engineer",
        "description": "Lead platform initiatives.",
        "skills": ["Go", "System Design", "Team Leadership"],
        "rubric": {"technical": 0.4, "communication": 0.3},
    },
    "interviewFocus": [],
}


def _base_state(**overrides):
    state: ia.InterviewerState = {
        "interview_id": "i1",
        "application_id": "a1",
        "candidate_id": "c1",
        "job_id": "j1",
        "job_title": "Staff Engineer",
        "candidate_context": SAMPLE_CONTEXT,
        "conversation_history": [],
        "current_stage": "intro",
        "turn_number": 0,
        "latest_candidate_response": "",
        "latest_ai_response": "",
    }
    state.update(overrides)
    return state


def _mock_llm(monkeypatch, response_text: str):
    """Point generate_text at a canned JSON string and keep real JSON extraction."""
    monkeypatch.setattr(ia, "generate_text", lambda prompt, force_provider=None: response_text)


# ---------------------------------------------------------------------------
# 1. Follow-ups / deepening on shallow answers
# ---------------------------------------------------------------------------


def test_deepen_action_on_shallow_answer(monkeypatch):
    _mock_llm(
        monkeypatch,
        json.dumps({
            "action": "DEEPEN",
            "spoken_response": "I'd like to go deeper there.",
            "next_question": "What was the hardest part of building pay-core?",
            "target_skill": "Go",
            "answer_summary": "Mentions Go but no specifics.",
            "evidence_used": ["github", "conversation"],
            "skills_demonstrated": ["Go"],
            "missing_details": ["metrics", "architecture"],
            "skills_still_needed": ["System Design"],
        }),
    )

    state = _base_state(
        current_stage="technical",
        current_skill="Go",
        latest_candidate_response="I know Go pretty well.",
        conversation_history=[{"speaker": "ai", "text": "Tell me about your Go experience."}],
    )
    state = load_context_node(state)
    state = evaluate_last_answer_node(state)
    assert state["last_analysis"]["action"] == "DEEPEN"
    assert state["last_analysis"]["next_question"].startswith("What was the hardest part")

    state = decide_next_action_node(state)
    assert state["next_action"] == "generate_follow_up"
    state = generate_follow_up_node(state)
    assert state["follow_up_depth"] == 1
    assert "hardest part" in state["latest_ai_response"]


def test_follow_up_appends_to_history_and_turn_records(monkeypatch):
    _mock_llm(
        monkeypatch,
        json.dumps({
            "action": "FOLLOW_UP",
            "spoken_response": "Nice, that helps.",
            "next_question": "How did you scale it?",
            "target_skill": "Go",
            "answer_summary": "Good detail on implementation.",
            "evidence_used": ["conversation"],
            "skills_demonstrated": ["Go"],
            "missing_details": [],
            "skills_still_needed": ["System Design"],
        }),
    )

    state = _base_state(
        current_stage="technical",
        current_skill="Go",
        latest_candidate_response="I built pay-core in Go.",
        conversation_history=[{"speaker": "ai", "text": "Tell me about your Go experience."}],
    )
    state = load_context_node(state)
    state = evaluate_last_answer_node(state)
    state = decide_next_action_node(state)
    state = generate_follow_up_node(state)

    assert len(state["conversation_history"]) == 2
    assert state["conversation_history"][-1]["speaker"] == "ai"
    assert len(state["turn_records"]) == 1
    record = state["turn_records"][-1]
    assert record["answer"] == "I built pay-core in Go."
    assert record["answer_summary"] == "Good detail on implementation."
    assert record["action"] == "FOLLOW_UP"
    assert record["stage"] == "technical"


# ---------------------------------------------------------------------------
# 2. Memory: full conversation history carried across turns
# ---------------------------------------------------------------------------


def test_memory_preserves_conversation_history(monkeypatch):
    history = [
        {"speaker": "ai", "text": "Greeting and opening question."},
        {"speaker": "candidate", "text": "I've led teams building payment infra."},
        {"speaker": "ai", "text": "Tell me about the hardest bug you fixed."},
    ]
    _mock_llm(
        monkeypatch,
        json.dumps({
            "action": "NEXT_TOPIC",
            "spoken_response": "Great.",
            "next_question": "Let's discuss system design.",
            "target_skill": "System Design",
            "answer_summary": "Answered.",
            "evidence_used": ["conversation"],
            "skills_demonstrated": ["Go"],
            "missing_details": [],
            "skills_still_needed": ["Team Leadership"],
        }),
    )

    state = _base_state(
        current_stage="technical",
        current_skill="Go",
        conversation_history=list(history),
        turn_number=3,
        latest_candidate_response="The hardest bug was a race condition in the scheduler.",
    )
    state = load_context_node(state)
    state = evaluate_last_answer_node(state)
    state = decide_next_action_node(state)
    state = advance_skill_node(state)

    # History grew by exactly one AI turn; nothing was dropped.
    assert len(state["conversation_history"]) == len(history) + 1
    assert state["conversation_history"][: len(history)] == history
    assert state["turn_records"][-1]["question"] == "Tell me about the hardest bug you fixed."


# ---------------------------------------------------------------------------
# 3. Duplicate-question prevention
# ---------------------------------------------------------------------------


def test_is_duplicate_detects_rephrased_questions():
    asked = ["What was the hardest part of building pay-core?"]
    assert _is_duplicate("What was the hardest part of building pay-core?", asked)
    assert _is_duplicate("what was the hardest part of building pay-core?", asked)
    assert not _is_duplicate("What technology would you pick for a new payment system?", asked)


def test_duplicate_question_is_regenerated(monkeypatch):
    duplicate = json.dumps({
        "action": "FOLLOW_UP",
        "spoken_response": "Interesting.",
        "next_question": "What was the hardest part of building pay-core?",
        "target_skill": "Go",
        "answer_summary": "x",
        "evidence_used": ["conversation"],
        "skills_demonstrated": [],
        "missing_details": [],
        "skills_still_needed": [],
    })
    fresh = json.dumps({
        "action": "FOLLOW_UP",
        "spoken_response": "Interesting.",
        "next_question": "How did you decide on that architecture?",
        "target_skill": "Go",
        "answer_summary": "x",
        "evidence_used": ["conversation"],
        "skills_demonstrated": [],
        "missing_details": [],
        "skills_still_needed": [],
    })
    calls = {"n": 0}

    def fake_llm(prompt, force_provider=None):
        calls["n"] += 1
        # First call produces the duplicate; the retry call produces a fresh question.
        return fresh if calls["n"] > 1 else duplicate

    monkeypatch.setattr(ia, "generate_text", fake_llm)

    state = _base_state(
        current_stage="technical",
        current_skill="Go",
        latest_candidate_response="I built it in Go.",
        asked_questions=["What was the hardest part of building pay-core?"],
        conversation_history=[{"speaker": "ai", "text": "Tell me about your Go experience."}],
    )
    state = load_context_node(state)
    state = evaluate_last_answer_node(state)
    assert state["last_analysis"]["next_question"] == "How did you decide on that architecture?"
    assert state["last_analysis"]["action"] == "FOLLOW_UP"


def test_no_question_is_repeated_across_session(monkeypatch):
    asked_so_far = []
    responses = [
        # Turn 1
        json.dumps({
            "action": "NEXT_TOPIC",
            "spoken_response": "Great.",
            "next_question": "Tell me about your experience with Go.",
            "target_skill": "Go",
            "answer_summary": "",
            "evidence_used": ["resume"],
            "skills_demonstrated": [],
            "missing_details": [],
            "skills_still_needed": ["System Design"],
        }),
        # Turn 2
        json.dumps({
            "action": "NEXT_TOPIC",
            "spoken_response": "Great.",
            "next_question": "Tell me about your experience with System Design.",
            "target_skill": "System Design",
            "answer_summary": "",
            "evidence_used": ["resume"],
            "skills_demonstrated": [],
            "missing_details": [],
            "skills_still_needed": ["Team Leadership"],
        }),
    ]
    state = _base_state()
    state = load_context_node(state)

    for i, raw in enumerate(responses):
        state["latest_candidate_response"] = f"Answer {i}"
        monkeypatch.setattr(ia, "generate_text", lambda prompt, force_provider=None, _r=raw: _r)
        state = evaluate_last_answer_node(state)
        state = decide_next_action_node(state)
        state = advance_skill_node(state)

    all_questions = [t["question"] for t in state["turn_records"] if t["question"]]
    # No duplicate normalized question appears twice.
    normalized = [ia._normalize_question(q) for q in all_questions]
    assert len(set(normalized)) == len(normalized)


# ---------------------------------------------------------------------------
# 4. Profile-data usage: resume / linkedin / github feed the prompts
# ---------------------------------------------------------------------------


def test_profile_data_appears_in_prompt(monkeypatch):
    captured = {}

    def fake_llm(prompt, force_provider=None):
        captured["prompt"] = prompt
        return json.dumps({
            "action": "NEXT_TOPIC",
            "spoken_response": "Hi!",
            "next_question": "Tell me about pay-core.",
            "target_skill": "Go",
            "answer_summary": "",
            "evidence_used": ["resume", "github"],
            "skills_demonstrated": [],
            "missing_details": [],
            "skills_still_needed": [],
        })

    monkeypatch.setattr(ia, "generate_text", fake_llm)
    state = _base_state()
    state = load_context_node(state)
    state = evaluate_last_answer_node(state)

    prompt = captured["prompt"]
    assert "pay-core" in prompt or "payment" in prompt
    assert "Acme" in prompt
    assert "Senior Full-Stack Engineer" in prompt
    assert "Lead platform initiatives." in prompt


# ---------------------------------------------------------------------------
# 5. Clarification for empty / unclear answers
# ---------------------------------------------------------------------------


def test_empty_answer_triggers_clarify(monkeypatch):
    state = _base_state(
        current_stage="technical",
        current_skill="Go",
        turn_number=2,
        latest_candidate_response="",
        conversation_history=[{"speaker": "ai", "text": "Tell me about your Go experience."}],
    )
    state = load_context_node(state)
    state = evaluate_last_answer_node(state)
    assert state["last_analysis"]["action"] == "CLARIFY"
    assert "repeat" in state["last_analysis"]["spoken_response"].lower() or "catch" in state["last_analysis"]["spoken_response"].lower()

    state = decide_next_action_node(state)
    assert state["next_action"] == "generate_follow_up"


def test_clarify_next_question_is_null():
    state = _base_state(
        current_stage="technical",
        current_skill="Go",
        turn_number=2,
        latest_candidate_response="",
        conversation_history=[{"speaker": "ai", "text": "Tell me about your Go experience."}],
    )
    state = load_context_node(state)
    state = evaluate_last_answer_node(state)
    assert state["last_analysis"]["next_question"] is None


# ---------------------------------------------------------------------------
# 6. Interview completion
# ---------------------------------------------------------------------------


def test_end_action_closes_interview(monkeypatch):
    history = [
        {"speaker": "ai", "text": "Tell me about Go."},
        {"speaker": "candidate", "text": "I have deep Go experience building pay-core."},
        {"speaker": "ai", "text": "Let's discuss system design."},
        {"speaker": "candidate", "text": "I designed a payment platform that scaled to 10k TPS."},
    ]
    scorecard = json.dumps({
        "technical_depth": 82.0,
        "communication": 78.0,
        "problem_solving": 88.0,
        "overall_score": 84.0,
        "summary_feedback": "Strong technical depth and communication.",
    })

    def fake_llm(prompt, force_provider=None):
        if "technical_depth" in prompt:
            return scorecard
        return json.dumps({
            "action": "END",
            "spoken_response": "That wraps up our interview, thank you!",
            "next_question": None,
            "target_skill": "Team Leadership",
            "answer_summary": "All skills sufficiently evaluated.",
            "evidence_used": ["conversation"],
            "skills_demonstrated": ["Go", "System Design"],
            "missing_details": [],
            "skills_still_needed": [],
        })

    monkeypatch.setattr(ia, "generate_text", fake_llm)

    state = _base_state(
        current_stage="technical",
        current_skill="Team Leadership",
        conversation_history=list(history),
        turn_number=4,
        latest_candidate_response="I led the team that shipped pay-core.",
    )
    state = load_context_node(state)
    state = evaluate_last_answer_node(state)
    state = decide_next_action_node(state)
    assert state["next_action"] == "close_interview"

    state = close_interview_node(state)
    assert state["is_complete"] is True
    assert state["latest_ai_response"]
    assert "thank" in state["latest_ai_response"].lower()
    assert "final_scorecard" in state
    assert state["final_scorecard"]["total_turns"] >= 4


def test_turn_cap_forces_completion(monkeypatch):
    state = _base_state(
        current_stage="technical",
        current_skill="Go",
        turn_number=12,
        latest_candidate_response="I know Go.",
        conversation_history=[{"speaker": "ai", "text": "Q"}, {"speaker": "candidate", "text": "A"}],
    )
    state = load_context_node(state)
    state = decide_next_action_node(state)
    assert state["next_action"] == "close_interview"


def test_run_interviewer_agent_end_to_end(monkeypatch):
    responses = iter([
        # Greeting
        json.dumps({
            "action": "NEXT_TOPIC",
            "spoken_response": "Hi, welcome!",
            "next_question": "Tell me about your Go experience.",
            "target_skill": "Go",
            "answer_summary": "",
            "evidence_used": ["resume", "github"],
            "skills_demonstrated": [],
            "missing_details": [],
            "skills_still_needed": ["System Design", "Team Leadership"],
        }),
        # Follow-up
        json.dumps({
            "action": "DEEPEN",
            "spoken_response": "Got it.",
            "next_question": "What was the hardest problem in pay-core?",
            "target_skill": "Go",
            "answer_summary": "Shallow.",
            "evidence_used": ["github"],
            "skills_demonstrated": ["Go"],
            "missing_details": ["metrics"],
            "skills_still_needed": ["System Design", "Team Leadership"],
        }),
        # Completion
        json.dumps({
            "action": "END",
            "spoken_response": "Thanks, that's all we need!",
            "next_question": None,
            "target_skill": "Team Leadership",
            "answer_summary": "Done.",
            "evidence_used": ["conversation"],
            "skills_demonstrated": ["Go"],
            "missing_details": [],
            "skills_still_needed": [],
        }),
    ])

    def fake_llm(prompt, force_provider=None):
        if "technical_depth" in prompt:
            return json.dumps({
                "technical_depth": 80.0,
                "communication": 84.0,
                "problem_solving": 86.0,
                "overall_score": 84.0,
                "summary_feedback": "Solid.",
            })
        return next(responses)

    monkeypatch.setattr(ia, "generate_text", fake_llm)

    state = _base_state()
    state = run_interviewer_agent(state)
    assert state["latest_ai_response"]
    assert "welcome" in state["latest_ai_response"].lower() or "Tell me" in state["latest_ai_response"]

    # Mirror the real frontend: candidate answers are returned to the agent
    # via conversation_history on the next turn.
    state["latest_candidate_response"] = "I built pay-core in Go, scaling to 10k TPS."
    state["conversation_history"].append(
        {"speaker": "candidate", "text": "I built pay-core in Go, scaling to 10k TPS."}
    )
    state = run_interviewer_agent(state)
    assert "hardest problem" in state["latest_ai_response"]

    state["latest_candidate_response"] = "We hit all targets, shipped on time."
    state["conversation_history"].append(
        {"speaker": "candidate", "text": "We hit all targets, shipped on time."}
    )
    state = run_interviewer_agent(state)
    assert state["is_complete"] is True
    assert "final_scorecard" in state


def test_greeting_on_first_turn(monkeypatch):
    _mock_llm(
        monkeypatch,
        json.dumps({
            "action": "NEXT_TOPIC",
            "spoken_response": "Hi Alex, thanks for joining today.",
            "next_question": "Tell me about your most recent work.",
            "target_skill": "Go",
            "answer_summary": "",
            "evidence_used": ["resume", "linkedin"],
            "skills_demonstrated": [],
            "missing_details": [],
            "skills_still_needed": ["System Design", "Team Leadership"],
        }),
    )
    state = _base_state()
    state = run_interviewer_agent(state)
    assert "Hi Alex" in state["latest_ai_response"]
    assert state["current_skill"] == "Go"


def test_advance_skill_tracks_evaluated_and_remaining(monkeypatch):
    _mock_llm(
        monkeypatch,
        json.dumps({
            "action": "NEXT_TOPIC",
            "spoken_response": "Great.",
            "next_question": "Let's talk system design.",
            "target_skill": "System Design",
            "answer_summary": "Good.",
            "evidence_used": ["conversation"],
            "skills_demonstrated": ["Go"],
            "missing_details": [],
            "skills_still_needed": ["Team Leadership"],
        }),
    )
    state = _base_state(
        current_stage="technical",
        current_skill="Go",
        latest_candidate_response="I built pay-core.",
        conversation_history=[{"speaker": "ai", "text": "Tell me about Go."}],
    )
    state = load_context_node(state)
    state = evaluate_last_answer_node(state)
    state = decide_next_action_node(state)
    state = advance_skill_node(state)

    assert "Go" in state["evaluated_skills"]
    assert state["current_skill"] == "System Design"
    assert "Go" not in state["skills_to_evaluate"]


# ---------------------------------------------------------------------------
# 7. Post-interview evaluation path (interview_worker compatibility)
# ---------------------------------------------------------------------------


def test_worker_path_closing_stage_finalizes_scorecard(monkeypatch):
    """The interview worker runs the agent with stage 'closing' + full transcript
    and no live answer; it must short-circuit straight to final scoring."""
    transcript = [
        {"speaker": "ai", "text": "Tell me about your Go experience."},
        {"speaker": "candidate", "text": "I built pay-core in Go, handling 10k TPS at peak."},
        {"speaker": "ai", "text": "How did you scale the scheduler?"},
        {"speaker": "candidate", "text": "We sharded by tenant and used Redis for rate limiting."},
    ]

    def fake_llm(prompt, force_provider=None):
        return json.dumps({
            "technical_depth": 84.0,
            "communication": 80.0,
            "problem_solving": 87.0,
            "overall_score": 85.0,
            "summary_feedback": "Strong candidate; Redis-based rate limiting and sharding show real depth.",
        })

    monkeypatch.setattr(ia, "generate_text", fake_llm)

    state = _base_state(
        current_stage="closing",
        turn_number=len(transcript),
        conversation_history=list(transcript),
        latest_candidate_response="",
    )
    state = run_interviewer_agent(state)

    assert state["is_complete"] is True
    assert "final_scorecard" in state
    assert state["final_scorecard"]["overall_score"] == 85.0
    assert state["final_scorecard"]["technical_score"] == 84.0
    assert "Redis" in state["final_scorecard"].get("summary_feedback", "")


def test_worker_path_accepts_frontend_message_shape(monkeypatch):
    """Frontend persists messages as {role, content}; the worker must still score them."""
    transcript = [
        {"role": "ai", "content": "Tell me about your Go experience."},
        {"role": "candidate", "content": "I led the pay-core build and scaled it to 10k TPS."},
        {"role": "ai", "content": "What was the hardest problem?"},
        {"role": "candidate", "content": "A race condition in the sharding layer we eventually fixed."},
    ]

    def fake_llm(prompt, force_provider=None):
        return json.dumps({
            "technical_depth": 82.0,
            "communication": 79.0,
            "problem_solving": 85.0,
            "overall_score": 82.0,
            "summary_feedback": "Good depth.",
        })

    monkeypatch.setattr(ia, "generate_text", fake_llm)

    state = _base_state(
        current_stage="closing",
        turn_number=len(transcript),
        conversation_history=list(transcript),
        latest_candidate_response="",
    )
    state = run_interviewer_agent(state)

    assert state["is_complete"] is True
    assert state["final_scorecard"]["overall_score"] == 82.0
    assert state["final_scorecard"]["total_turns"] >= 4