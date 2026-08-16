import sys
import json

sys.path.insert(0, "/home/pratham/Disk1/NextRound/apps/ai-service")

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

import routes.voice_routes as vr


SAMPLE_CONTEXT = {
    "candidate": {"fullName": "Alex Morgan", "headline": "Senior Full-Stack Engineer"},
    "resume": {"rawText": "Experienced in React, Node and Go."},
    "skills": ["TypeScript", "Go", "React"],
    "job": {"title": "Staff Engineer", "description": "Lead platform initiatives.", "rubric": {"technical": 0.4}},
}


def _make_app(monkeypatch, fake_llm_output, fake_tts_url="data:audio/mp3;base64,QUJD"):
    """Build a FastAPI app with the voice router and a stubbed LLM + TTS."""
    app = FastAPI()
    app.include_router(vr.voice_router)

    def fake_run(state):
        return {
            **state,
            "latest_ai_response": fake_llm_output,
            "current_stage": "technical",
            "is_complete": False,
            "last_analysis": {
                "action": "FOLLOW_UP",
                "spoken_response": "Nice.",
                "next_question": "How did you scale pay-core?",
                "target_skill": "Go",
                "answer_summary": "Built payment platform.",
                "evidence_used": ["github", "conversation"],
                "skills_demonstrated": ["Go"],
                "missing_details": [],
                "skills_still_needed": ["System Design"],
            },
            "turn_records": [
                {
                    "turn": 1,
                    "question": "Tell me about your Go experience.",
                    "answer": "I built pay-core.",
                    "answer_summary": "Built payment platform.",
                    "action": "FOLLOW_UP",
                    "target_skill": "Go",
                    "evaluated_skills": [],
                    "remaining_skills": ["Go", "System Design"],
                    "evidence_used": ["github"],
                    "stage": "technical",
                }
            ],
            "evaluated_skills": [],
            "skills_to_evaluate": ["Go", "System Design"],
            "current_skill": "Go",
        }

    async def fake_tts(text, voice=None):
        return fake_tts_url

    monkeypatch.setattr(vr, "run_interviewer_agent", fake_run)
    monkeypatch.setattr(vr, "generate_tts_audio_base64", fake_tts)
    return app


def test_respond_passes_candidate_context_and_required_skills(monkeypatch):
    captured = {}

    def fake_run(state):
        captured.update(state)
        return {
            **state,
            "latest_ai_response": "Let's start.",
            "current_stage": "intro",
            "is_complete": False,
            "last_analysis": {"action": "NEXT_TOPIC", "next_question": "Tell me about Go."},
            "turn_records": [],
            "evaluated_skills": [],
            "skills_to_evaluate": ["Go"],
            "current_skill": "Go",
        }

    async def fake_tts(text, voice=None):
        return "data:audio/mp3;base64,QUJD"

    monkeypatch.setattr(vr, "run_interviewer_agent", fake_run)
    monkeypatch.setattr(vr, "generate_tts_audio_base64", fake_tts)

    app = FastAPI()
    app.include_router(vr.voice_router)
    client = TestClient(app)

    res = client.post(
        "/api/v1/ai/interview/respond",
        json={
            "interviewId": "i1",
            "applicationId": "a1",
            "transcript": "",
            "turnNumber": 0,
            "stage": "intro",
            "jobTitle": "Staff Engineer",
            "candidateContext": SAMPLE_CONTEXT,
            "requiredSkills": ["Go", "System Design"],
            "jobRubric": {"technical": 0.4, "communication": 0.3},
            "conversationHistory": [],
        },
    )
    assert res.status_code == 200
    assert captured["candidate_context"] == SAMPLE_CONTEXT
    assert captured["required_skills"] == ["Go", "System Design"]
    assert captured["job_rubric"] == {"technical": 0.4, "communication": 0.3}
    assert captured["job_title"] == "Staff Engineer"


def test_respond_returns_analysis_turn_record_and_skill_lists(monkeypatch):
    app = _make_app(
        monkeypatch,
        fake_llm_output="How did you scale pay-core?",
    )
    client = TestClient(app)

    res = client.post(
        "/api/v1/ai/interview/respond",
        json={
            "interviewId": "i1",
            "transcript": "I built pay-core in Go.",
            "turnNumber": 1,
            "stage": "technical",
            "conversationHistory": [{"speaker": "ai", "text": "Tell me about Go."}],
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["text"] == "How did you scale pay-core?"
    assert data["stage"] == "technical"
    assert data["isComplete"] is False
    assert data["audioUrl"] == "data:audio/mp3;base64,QUJD"
    assert data["analysis"]["action"] == "FOLLOW_UP"
    assert data["analysis"]["target_skill"] == "Go"
    assert data["turnRecord"]["turn"] == 1
    assert data["turnRecord"]["answer"] == "I built pay-core."
    assert data["turnRecord"]["remaining_skills"] == ["Go", "System Design"]
    assert data["evaluatedSkills"] == []
    assert data["remainingSkills"] == ["Go", "System Design"]
    assert data["currentSkill"] == "Go"


def test_respond_503_when_agent_returns_no_text(monkeypatch):
    def fake_run(state):
        return {**state, "latest_ai_response": None, "turn_records": []}

    async def fake_tts(text, voice=None):
        return ""

    monkeypatch.setattr(vr, "run_interviewer_agent", fake_run)
    monkeypatch.setattr(vr, "generate_tts_audio_base64", fake_tts)

    app = FastAPI()
    app.include_router(vr.voice_router)
    client = TestClient(app)

    res = client.post(
        "/api/v1/ai/interview/respond",
        json={"interviewId": "i1", "transcript": "x", "turnNumber": 1},
    )
    assert res.status_code == 503
    assert "no response" in res.json()["detail"].lower()


def test_respond_complete_returns_scorecard(monkeypatch):
    def fake_run(state):
        return {
            **state,
            "latest_ai_response": "Thanks, that wraps up the interview.",
            "current_stage": "closing",
            "is_complete": True,
            "final_scorecard": {
                "overall_score": 85.0,
                "technical_score": 84.0,
                "communication_score": 80.0,
                "problem_solving_score": 87.0,
                "summary_feedback": "Strong candidate.",
                "total_turns": 6,
            },
            "last_analysis": {"action": "END"},
            "turn_records": [{"turn": 6, "action": "END"}],
            "evaluated_skills": ["Go", "System Design"],
            "skills_to_evaluate": [],
            "current_skill": None,
        }

    async def fake_tts(text, voice=None):
        return "data:audio/mp3;base64,QUJD"

    monkeypatch.setattr(vr, "run_interviewer_agent", fake_run)
    monkeypatch.setattr(vr, "generate_tts_audio_base64", fake_tts)

    app = FastAPI()
    app.include_router(vr.voice_router)
    client = TestClient(app)

    res = client.post(
        "/api/v1/ai/interview/respond",
        json={"interviewId": "i1", "transcript": "Final answer.", "turnNumber": 6, "stage": "closing"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["isComplete"] is True
    assert data["scorecard"]["overall_score"] == 85.0
    assert data["stage"] == "closing"


def test_voice_stream_returns_sse_chunks(monkeypatch):
    def fake_run(state):
        return {
            **state,
            "latest_ai_response": "First sentence. Second sentence.",
            "current_stage": "technical",
            "is_complete": False,
            "turn_records": [],
            "evaluated_skills": [],
            "skills_to_evaluate": ["Go"],
            "current_skill": "Go",
        }

    async def fake_stream(text, voice=None):
        yield {"sentence": "First sentence.", "audio": "QUJD", "is_final": False}
        yield {"sentence": "Second sentence.", "audio": "REVG", "is_final": True}

    monkeypatch.setattr(vr, "run_interviewer_agent", fake_run)
    monkeypatch.setattr(vr, "stream_sentence_tts", fake_stream)

    app = FastAPI()
    app.include_router(vr.voice_router)
    client = TestClient(app)

    res = client.post(
        "/api/v1/ai/interview/voice-stream",
        json={"interviewId": "i1", "transcript": "I built it.", "turnNumber": 2},
    )
    assert res.status_code == 200
    assert res.headers["content-type"].startswith("text/event-stream")
    body = res.text
    assert "First sentence." in body
    assert "is_final" in body