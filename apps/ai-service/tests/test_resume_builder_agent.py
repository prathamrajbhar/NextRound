import sys
import json

sys.path.insert(0, "/home/pratham/Disk1/NextRound/apps/ai-service")

from fastapi import FastAPI
from fastapi.testclient import TestClient

import agents.resume_builder_agent as rba
from agents.resume_builder_agent import (
    run_resume_builder_agent,
    _is_duplicate,
    _validate_analysis,
    _next_stage,
    STAGES,
)


def _base_state(**overrides):
    state = {
        "session_id": "rb1",
        "target_role": "Senior Full Stack Engineer",
        "target_company": "Target Enterprise",
        "current_stage": "intro",
        "turn_number": 0,
        "latest_candidate_response": "",
        "conversation_history": [],
        "memory": {},
    }
    state.update(overrides)
    return state


def _mock_llm(monkeypatch, response_text):
    monkeypatch.setattr(rba, "generate_text", lambda prompt: response_text)


def _follow_up_analysis(**overrides):
    analysis = {
        "response": "That sounds interesting.",
        "next_question": "What was the biggest challenge you faced while building it?",
        "action": "FOLLOW_UP",
        "topic": "payments platform",
        "memory_update": "Built a payments platform with React and Node.",
        "missing_information": [],
    }
    analysis.update(overrides)
    return analysis


# ---------------------------------------------------------------------------
# 1. Follow-up questions
# ---------------------------------------------------------------------------


def test_follow_up_keeps_stage_and_grounds_question(monkeypatch):
    _mock_llm(monkeypatch, json.dumps(_follow_up_analysis()))

    state = _base_state(
        current_stage="work_history",
        turn_number=2,
        latest_candidate_response="I built a payments platform using React and Node at Acme.",
        conversation_history=[
            {"speaker": "ai", "text": "Hi, what's your name and the role you're aiming for?"},
            {"speaker": "candidate", "text": "I'm Alex, aiming for a Senior Full Stack role."},
            {"speaker": "ai", "text": "Tell me about your work history."},
        ],
    )
    out = run_resume_builder_agent(state)

    assert out["current_stage"] == "work_history"
    assert out["last_analysis"]["action"] == "FOLLOW_UP"
    assert "challenge" in out["latest_ai_response"]
    assert out["memory"]["next_action"] == "FOLLOW_UP"
    assert "payments platform" in out["memory"]["candidate_facts"][0]


# ---------------------------------------------------------------------------
# 2. Clarification questions
# ---------------------------------------------------------------------------


def test_empty_answer_triggers_clarification(monkeypatch):
    state = _base_state(
        current_stage="work_history",
        turn_number=2,
        latest_candidate_response="",
        conversation_history=[{"speaker": "ai", "text": "Tell me about your work history."}],
    )
    out = run_resume_builder_agent(state)

    assert out["last_analysis"]["action"] == "CLARIFY"
    assert "catch" in out["latest_ai_response"].lower() or "again" in out["latest_ai_response"].lower()
    assert out["current_stage"] == "work_history"
    assert out["is_complete"] is False


def test_candidate_repeat_request_reasks_last_question(monkeypatch):
    state = _base_state(
        current_stage="work_history",
        turn_number=3,
        latest_candidate_response="Can you repeat that?",
        conversation_history=[{"speaker": "ai", "text": "Tell me about your work history."}],
        memory={"previous_questions": ["Tell me about your work history at Acme."]},
    )
    out = run_resume_builder_agent(state)

    assert out["last_analysis"]["action"] == "CLARIFY"
    assert "Tell me about your work history at Acme" in out["latest_ai_response"]


# ---------------------------------------------------------------------------
# 3. Deeper questions
# ---------------------------------------------------------------------------


def test_deepen_action_keeps_stage(monkeypatch):
    _mock_llm(
        monkeypatch,
        json.dumps(_follow_up_analysis(
            action="DEEPEN",
            response="That's helpful.",
            next_question="Could you walk me through the technical decisions you made?",
            missing_information=["technical decisions"],
        )),
    )
    state = _base_state(
        current_stage="work_history",
        turn_number=2,
        latest_candidate_response="It was a payments platform.",
        conversation_history=[{"speaker": "ai", "text": "Tell me about your work history."}],
    )
    out = run_resume_builder_agent(state)

    assert out["current_stage"] == "work_history"
    assert out["last_analysis"]["action"] == "DEEPEN"
    assert "technical decisions" in out["latest_ai_response"]
    assert "technical decisions" in out["memory"]["missing_information"]


def test_short_vague_answer_triggers_heuristic_deepen(monkeypatch):
    _mock_llm(monkeypatch, "not valid json")
    state = _base_state(
        current_stage="work_history",
        turn_number=2,
        latest_candidate_response="It was fine, nothing special.",
        conversation_history=[{"speaker": "ai", "text": "Tell me about your work history."}],
    )
    out = run_resume_builder_agent(state)

    assert out["last_analysis"]["action"] == "DEEPEN"
    assert out["current_stage"] == "work_history"


# ---------------------------------------------------------------------------
# 4. Topic progression
# ---------------------------------------------------------------------------


def test_next_topic_advances_stage(monkeypatch):
    _mock_llm(
        monkeypatch,
        json.dumps(_follow_up_analysis(
            action="NEXT_TOPIC",
            response="Great, let's talk about your work history.",
            next_question="Where did you work most recently and what was your role?",
            topic="work_history",
        )),
    )
    state = _base_state(
        current_stage="intro",
        turn_number=2,
        latest_candidate_response="I'm Alex Morgan, a Senior Full Stack Engineer with 6 years of experience.",
        conversation_history=[{"speaker": "ai", "text": "What's your name and role?"}],
    )
    out = run_resume_builder_agent(state)

    assert out["current_stage"] == "work_history"
    assert out["is_complete"] is False


def test_next_stage_mapping():
    assert [_next_stage(s) for s in STAGES] == ["work_history", "skills", "projects", "education", "closing", None]


def test_full_stage_progression_ends_at_closing(monkeypatch):
    def fake_llm(prompt):
        stage = "intro"
        for line in prompt.splitlines():
            if line.startswith("Current topic:"):
                stage = line.split("Current topic:")[1].split("(")[0].strip()
                break
        if stage == "closing":
            return json.dumps({
                "action": "NEXT_TOPIC",
                "response": "Thanks, your resume is ready.",
                "next_question": None,
                "topic": "closing",
                "memory_update": None,
                "missing_information": [],
            })
        next_stage = {
            "intro": "work_history",
            "work_history": "skills",
            "skills": "projects",
            "projects": "education",
            "education": "closing",
        }[stage]
        return json.dumps(_follow_up_analysis(
            action="NEXT_TOPIC",
            response=f"Great, let's talk about {next_stage}.",
            next_question=f"What should I know about {next_stage}?",
            topic=next_stage,
        ))

    monkeypatch.setattr(rba, "generate_text", fake_llm)

    state = _base_state()
    out = run_resume_builder_agent(state)  # greeting
    assert out["current_stage"] == "intro"
    assert out["is_complete"] is False

    turn = 1
    seen_stages = ["intro"]
    while not out["is_complete"] and turn < 12:
        state["latest_candidate_response"] = f"Candidate answer {turn}."
        state["conversation_history"] = [{"speaker": "ai", "text": out["latest_ai_response"]}]
        state["memory"] = out["memory"]
        state["current_stage"] = out["current_stage"]
        state["turn_number"] = out["turn_number"]
        out = run_resume_builder_agent(state)
        seen_stages.append(out["current_stage"])
        turn += 1

    assert out["is_complete"] is True
    assert out["current_stage"] == "closing"
    assert seen_stages == ["intro", "work_history", "skills", "projects", "education", "closing"]


# ---------------------------------------------------------------------------
# 5. Conversation memory
# ---------------------------------------------------------------------------


def test_memory_persists_facts_and_missing_info(monkeypatch):
    _mock_llm(monkeypatch, json.dumps(_follow_up_analysis(
        next_question="What specific results did you deliver?",
        missing_information=["quantified results"],
    )))
    state = _base_state(
        current_stage="work_history",
        turn_number=2,
        latest_candidate_response="I built a payments platform using React and Node.",
        conversation_history=[{"speaker": "ai", "text": "Tell me about your work history."}],
    )
    out = run_resume_builder_agent(state)

    assert "payments platform" in out["memory"]["candidate_facts"][0]
    assert "quantified results" in out["memory"]["missing_information"]
    assert out["memory"]["current_topic"] == "payments platform"
    assert "payments platform" in out["memory"]["covered_topics"]
    assert out["memory"]["previous_questions"][-1] == "What specific results did you deliver?"

    # Second turn: memory carried over accumulates without dropping anything.
    _mock_llm(monkeypatch, json.dumps(_follow_up_analysis(
        response="Nice work.",
        next_question="How did you measure the improvement?",
        memory_update="Cut latency by 40% after optimizing the API.",
        missing_information=[],
    )))
    state2 = _base_state(
        current_stage="work_history",
        turn_number=3,
        latest_candidate_response="I cut latency by 40%.",
        conversation_history=[
            {"speaker": "ai", "text": "Tell me about your work history."},
            {"speaker": "candidate", "text": "I built a payments platform using React and Node."},
            {"speaker": "ai", "text": "What specific results did you deliver?"},
        ],
        memory=out["memory"],
    )
    out2 = run_resume_builder_agent(state2)

    assert len(out2["memory"]["candidate_facts"]) == 2
    assert any("latency" in f for f in out2["memory"]["candidate_facts"])
    assert out2["memory"]["previous_questions"][-1] == "How did you measure the improvement?"


def test_duplicate_facts_are_not_repeated(monkeypatch):
    _mock_llm(monkeypatch, json.dumps(_follow_up_analysis(memory_update="Built a payments platform.")))
    state = _base_state(
        current_stage="work_history",
        turn_number=2,
        latest_candidate_response="Built a payments platform.",
        conversation_history=[{"speaker": "ai", "text": "Tell me about your work history."}],
    )
    out = run_resume_builder_agent(state)
    facts = out["memory"]["candidate_facts"]
    assert len(facts) == 1
    normalized = {rba._normalize_question(f) for f in facts}
    assert len(normalized) == len(facts)


# ---------------------------------------------------------------------------
# 6. Duplicate-question prevention
# ---------------------------------------------------------------------------


def test_is_duplicate_detects_rephrased_questions():
    asked = ["What was the biggest challenge you faced while building it?"]
    assert _is_duplicate("What was the biggest challenge you faced while building it?", asked)
    assert _is_duplicate("what was the biggest challenge you faced while building it?", asked)
    assert not _is_duplicate("Which tools did you use to build it?", asked)


def test_duplicate_question_is_regenerated(monkeypatch):
    duplicate = json.dumps(_follow_up_analysis(
        next_question="What was your role at Acme?",
        memory_update="Worked at Acme.",
    ))
    fresh = json.dumps(_follow_up_analysis(
        next_question="What was the biggest challenge in that project?",
        memory_update="Worked at Acme.",
    ))
    calls = {"n": 0}

    def fake_llm(prompt):
        calls["n"] += 1
        return fresh if calls["n"] > 1 else duplicate

    monkeypatch.setattr(rba, "generate_text", fake_llm)

    state = _base_state(
        current_stage="work_history",
        turn_number=2,
        latest_candidate_response="I worked as a lead engineer at Acme.",
        conversation_history=[{"speaker": "ai", "text": "Tell me about your work history."}],
        memory={"previous_questions": ["What was your role at Acme?"]},
    )
    out = run_resume_builder_agent(state)

    assert out["last_analysis"]["next_question"] == "What was the biggest challenge in that project?"
    assert "challenge" in out["latest_ai_response"]


def test_no_question_repeated_across_turns(monkeypatch):
    responses = iter([
        json.dumps(_follow_up_analysis(
            next_question="What was your role at Acme?",
            memory_update="Worked at Acme.",
        )),
        json.dumps(_follow_up_analysis(
            next_question="What tools did you use at Acme?",
            memory_update="Used React and Node.",
        )),
        json.dumps(_follow_up_analysis(
            next_question="What tools did you use at Acme?",
            memory_update="Used React and Node.",
        )),
        json.dumps(_follow_up_analysis(
            next_question="How did you measure success on that project?",
            memory_update="Improved API latency.",
        )),
    ])

    def fake_llm(prompt):
        return next(responses)

    monkeypatch.setattr(rba, "generate_text", fake_llm)

    out = run_resume_builder_agent(_base_state(
        current_stage="work_history",
        turn_number=2,
        latest_candidate_response="I worked at Acme.",
        conversation_history=[{"speaker": "ai", "text": "Tell me about your work history."}],
    ))

    out2 = run_resume_builder_agent(_base_state(
        current_stage=out["current_stage"],
        turn_number=out["turn_number"],
        latest_candidate_response="I used React and Node.",
        conversation_history=[{"speaker": "ai", "text": "Tell me about your work history."}],
        memory=out["memory"],
    ))

    out3 = run_resume_builder_agent(_base_state(
        current_stage=out2["current_stage"],
        turn_number=out2["turn_number"],
        latest_candidate_response="React and Node for the whole stack.",
        conversation_history=[{"speaker": "ai", "text": "Tell me about your work history."}],
        memory=out2["memory"],
    ))

    # The duplicated question from turn 3 must have been regenerated.
    assert out3["last_analysis"]["next_question"] == "How did you measure success on that project?"
    normalized = [rba._normalize_question(q) for q in out3["memory"]["previous_questions"]]
    assert len(set(normalized)) == len(normalized)


# ---------------------------------------------------------------------------
# 7. Incomplete answers never advance the topic
# ---------------------------------------------------------------------------


def test_incomplete_answer_stays_on_topic(monkeypatch):
    _mock_llm(monkeypatch, json.dumps(_follow_up_analysis(
        action="DEEPEN",
        response="Could you elaborate?",
        next_question="What specifically did you build?",
        missing_information=["specifics"],
    )))
    state = _base_state(
        current_stage="work_history",
        turn_number=2,
        latest_candidate_response="It was fine, nothing special.",
        conversation_history=[{"speaker": "ai", "text": "Tell me about your work history."}],
    )
    out = run_resume_builder_agent(state)

    assert out["last_analysis"]["action"] == "DEEPEN"
    assert out["current_stage"] == "work_history"


def test_clarify_never_advances_stage():
    state = _base_state(
        current_stage="skills",
        turn_number=4,
        latest_candidate_response="",
        conversation_history=[{"speaker": "ai", "text": "What tools do you use?"}],
    )
    out = run_resume_builder_agent(state)
    assert out["current_stage"] == "skills"
    assert out["is_complete"] is False


# ---------------------------------------------------------------------------
# 8. Interview completion
# ---------------------------------------------------------------------------


def test_end_action_completes_interview(monkeypatch):
    _mock_llm(monkeypatch, json.dumps(_follow_up_analysis(
        action="END",
        response="Thanks so much, that's everything I need.",
        next_question=None,
        topic="closing",
        memory_update=None,
    )))
    state = _base_state(
        current_stage="education",
        turn_number=10,
        latest_candidate_response="I studied computer science at MIT.",
        conversation_history=[{"speaker": "ai", "text": "Where did you study?"}],
    )
    out = run_resume_builder_agent(state)

    assert out["is_complete"] is True
    assert out["current_stage"] == "closing"
    assert out["latest_ai_response"]


def test_turn_cap_forces_completion(monkeypatch):
    _mock_llm(monkeypatch, json.dumps(_follow_up_analysis(next_question="What else?")))
    state = _base_state(
        current_stage="projects",
        turn_number=11,
        latest_candidate_response="I built a dashboard.",
        conversation_history=[{"speaker": "ai", "text": "Tell me about a project."}],
    )
    out = run_resume_builder_agent(state)

    assert out["is_complete"] is True
    assert out["current_stage"] == "closing"


def test_turn_cap_above_max_skips_llm(monkeypatch):
    _mock_llm(monkeypatch, json.dumps(_follow_up_analysis(next_question="What else?")))
    state = _base_state(
        current_stage="projects",
        turn_number=12,
        latest_candidate_response="I built a dashboard.",
        conversation_history=[{"speaker": "ai", "text": "Tell me about a project."}],
    )
    out = run_resume_builder_agent(state)

    assert out["is_complete"] is True
    assert out["current_stage"] == "closing"


# ---------------------------------------------------------------------------
# 9. Strict JSON validation
# ---------------------------------------------------------------------------


def _assert_valid_analysis(analysis):
    for key in ("response", "next_question", "action", "topic", "memory_update", "missing_information"):
        assert key in analysis
    assert analysis["action"] in rba.ACTIONS


def test_invalid_llm_json_falls_back_to_heuristic(monkeypatch):
    _mock_llm(monkeypatch, "this is not json at all")
    state = _base_state(
        current_stage="work_history",
        turn_number=2,
        latest_candidate_response="I have 6 years of experience building web apps.",
        conversation_history=[{"speaker": "ai", "text": "Tell me about your work history."}],
    )
    out = run_resume_builder_agent(state)
    _assert_valid_analysis(out["last_analysis"])
    assert out["last_analysis"]["action"] in ("FOLLOW_UP", "CLARIFY", "DEEPEN", "NEXT_TOPIC", "END")
    assert out["latest_ai_response"]


def test_malformed_json_missing_keys_falls_back(monkeypatch):
    _mock_llm(monkeypatch, json.dumps({"foo": "bar", "action": "FOLLOW_UP"}))
    state = _base_state(
        current_stage="work_history",
        turn_number=2,
        latest_candidate_response="I built web apps with React.",
        conversation_history=[{"speaker": "ai", "text": "Tell me about your work history."}],
    )
    out = run_resume_builder_agent(state)
    _assert_valid_analysis(out["last_analysis"])


def test_validate_analysis_rejects_invalid_shapes():
    assert _validate_analysis(None) is None
    assert _validate_analysis({"response": "hi", "action": "BOGUS"}) is None
    assert _validate_analysis({"action": "FOLLOW_UP", "response": ""}) is None
    assert _validate_analysis({"action": "FOLLOW_UP", "response": "hi", "next_question": 42}) is None

    valid = _validate_analysis({
        "response": "hi", "next_question": None, "action": "follow_up",
        "topic": "x", "memory_update": None, "missing_information": ["a", "", "b"],
    })
    assert valid is not None
    assert valid["action"] == "FOLLOW_UP"
    assert valid["missing_information"] == ["a", "b"]
    assert valid["next_question"] is None


# ---------------------------------------------------------------------------
# 10. Greeting + route-level memory round-trip
# ---------------------------------------------------------------------------


def test_greeting_on_first_turn(monkeypatch):
    _mock_llm(monkeypatch, json.dumps({
        "response": "Hi, I'm Alex's AI resume coach.",
        "next_question": "Could you start by telling me your full name and the role you're aiming for?",
        "action": "NEXT_TOPIC",
        "topic": "intro",
        "memory_update": None,
        "missing_information": [],
    }))
    out = run_resume_builder_agent(_base_state())

    assert out["current_stage"] == "intro"
    assert out["is_complete"] is False
    assert "name" in out["latest_ai_response"].lower()
    assert out["memory"]["previous_questions"]


def test_resume_builder_respond_round_trips_memory(monkeypatch):
    import routes.mock_voice_routes as mvr

    captured = {}

    def fake_run(state):
        captured.update(state)
        state["latest_ai_response"] = "Tell me about your role at Acme."
        state["current_stage"] = "work_history"
        state["turn_number"] = 2
        state["is_complete"] = False
        state["memory"] = {
            "previous_questions": ["Tell me about your work history."],
            "candidate_facts": ["Built a payments platform."],
            "covered_topics": [],
            "missing_information": [],
            "current_topic": "Acme",
            "next_action": "FOLLOW_UP",
        }
        return state

    async def fake_tts(text, voice=None):
        return "data:audio/mp3;base64,QUJD"

    monkeypatch.setattr(mvr, "run_resume_builder_agent", fake_run)
    monkeypatch.setattr(mvr, "generate_tts_audio_base64", fake_tts)

    app = FastAPI()
    app.include_router(mvr.mock_voice_router)
    client = TestClient(app)

    res = client.post(
        "/api/v1/ai/resume-builder/respond",
        json={
            "sessionId": "rb1",
            "transcript": "I worked at Acme.",
            "stage": "intro",
            "turnNumber": 1,
            "conversationHistory": [{"speaker": "ai", "text": "Hi there."}],
            "memory": {"candidate_facts": ["Alex Morgan"]},
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert captured["memory"]["candidate_facts"] == ["Alex Morgan"]
    assert data["text"] == "Tell me about your role at Acme."
    assert data["stage"] == "work_history"
    assert data["memory"]["candidate_facts"] == ["Built a payments platform."]
    assert data["memory"]["next_action"] == "FOLLOW_UP"
