import sys

sys.path.insert(0, "/home/pratham/Disk1/NextRound/apps/ai-service")

import pytest
import workers.interview_worker as iw
from core import http_client as core_http_client
from workers import worker_base as wb
from workers.interview_worker import _build_context_text
from workers.worker_base import AgentJobSkip


def test_build_context_text_composes_facts():
    context = {
        "candidate": {
            "fullName": "Alex Morgan",
            "headline": "Senior Full-Stack Engineer",
            "location": "Bengaluru, India",
            "yearsOfExperience": 6,
            "targetRoles": ["Senior Engineer"],
            "bio": "Builder of scalable systems.",
        },
        "resume": {"rawText": "Experienced in React, Node and Go."},
        "social": {
            "github": {"username": "alexmorgan", "totalStars": 420},
            "linkedin": {"headline": "Senior Full-Stack Engineer"},
        },
        "skills": ["TypeScript", "Go", "React"],
        "experience": [{"title": "Senior Engineer", "company": "Acme"}],
        "projects": [{"name": "nextround"}],
        "education": [{"degree": "B.Tech"}],
        "job": {
            "title": "Staff Engineer",
            "description": "Lead platform initiatives.",
            "rubric": {"technical": 0.4},
        },
        "interviewFocus": [
            {"sourceType": "github", "section": "projects", "content": "Pushed 400 commits to nextround."}
        ],
    }
    text = _build_context_text(context)
    assert "Candidate: Alex Morgan" in text
    assert "Headline: Senior Full-Stack Engineer" in text
    assert "JOB: Staff Engineer" in text
    assert "Skills: TypeScript, Go, React" in text
    assert "MOST RELEVANT PROFILE SECTIONS" in text


def test_build_context_text_caps_length():
    context = {
        "candidate": {"fullName": "A"},
        "resume": {"rawText": ""},
        "social": {"github": None, "linkedin": None},
        "skills": [],
        "experience": [],
        "projects": [],
        "education": [],
        "job": {"title": "Role", "description": "", "rubric": None},
        "interviewFocus": [],
    }
    text = _build_context_text(context, max_length=100)
    assert len(text) <= 100


def test_build_context_text_handles_empty_context():
    text = _build_context_text({})
    assert "Candidate: N/A" in text


# ---------------------------------------------------------------------------
# process_interview_job functional coverage
# ---------------------------------------------------------------------------


SAMPLE_APPLICATION = {
    "candidate_id": "c1",
    "job_id": "j1",
    "status": "interview",
}

SAMPLE_CONTEXT = {
    "candidate": {"fullName": "Alex Morgan", "headline": "Senior Full-Stack Engineer"},
    "resume": {"rawText": "Experienced in React, Node and Go."},
    "skills": ["TypeScript", "Go", "React"],
    "job": {"title": "Staff Engineer", "description": "Lead platform initiatives.", "rubric": {"technical": 0.4}},
}

TRANSCRIPT = [
    {"speaker": "ai", "text": "Tell me about your Go experience."},
    {"speaker": "candidate", "text": "I built pay-core in Go, handling 10k TPS."},
    {"speaker": "ai", "text": "How did you scale it?"},
    {"speaker": "candidate", "text": "Sharded by tenant with Redis rate limiting."},
]

SCORECARD = {
    "overall_score": 85.0,
    "technical_score": 84.0,
    "communication_score": 80.0,
    "problem_solving_score": 87.0,
    "summary_feedback": "Strong candidate.",
    "total_turns": 4,
}


class FakeResponse:
    def __init__(self, payload=None, status_code=200):
        self._payload = payload if payload is not None else {}
        self.status_code = status_code

    def json(self):
        return {"data": self._payload}


class FakeCallbackClient:
    """Instance-attribute callback client so mocks aren't bound as class methods."""

    def __init__(self, patch=None, post_callback=None):
        self.patch = patch or (lambda *a, **k: FakeResponse(status_code=200))
        self.post_callback = post_callback or (lambda *a, **k: {})


@pytest.mark.asyncio
async def test_process_job_propagates_context_and_posts_scorecard(monkeypatch):
    captured_state = {}
    posted = {}

    async def fake_fetch_internal(endpoint):
        if "applications" in endpoint:
            return SAMPLE_APPLICATION
        if "candidates" in endpoint:
            return SAMPLE_CONTEXT
        return {}

    async def fake_patch(endpoint, json=None):
        posted[endpoint] = json
        return FakeResponse(status_code=200)

    async def fake_post_callback(endpoint, payload):
        return {}

    def fake_run_interviewer(state):
        captured_state.update(state)
        return {**state, "final_scorecard": SCORECARD}

    monkeypatch.setattr(iw, "fetch_internal", fake_fetch_internal)
    monkeypatch.setattr(iw, "run_interviewer_agent", fake_run_interviewer)
    fake_client = FakeCallbackClient(patch=fake_patch, post_callback=fake_post_callback)
    monkeypatch.setattr(iw, "callback_client", fake_client)
    monkeypatch.setattr(core_http_client, "callback_client", fake_client)
    monkeypatch.setattr(wb, "callback_client", fake_client)
    monkeypatch.setattr(iw, "analyze_interview_sentiment", lambda iid, url: {"status": "unavailable"})

    ok = await iw.process_interview_job({
        "interviewId": "i1",
        "applicationId": "a1",
        "transcript": TRANSCRIPT,
        "audioUrl": "",
    })

    assert ok is True
    assert captured_state["candidate_id"] == "c1"
    assert captured_state["job_id"] == "j1"
    assert captured_state["candidate_context"] == SAMPLE_CONTEXT
    assert captured_state["candidate_resume"]
    assert "Staff Engineer" in captured_state["candidate_resume"]
    assert captured_state["job_rubric"] == {"technical": 0.4}
    assert captured_state["conversation_history"] == TRANSCRIPT
    assert captured_state["current_stage"] == "closing"
    assert "internal/interviews/i1/result" in posted
    assert posted["internal/interviews/i1/result"]["interview_score"] == 85.0


@pytest.mark.asyncio
async def test_process_job_skips_without_transcript(monkeypatch):
    async def fake_post_callback(endpoint, payload):
        return {}

    fake_client = FakeCallbackClient(post_callback=fake_post_callback)
    monkeypatch.setattr(iw, "callback_client", fake_client)
    monkeypatch.setattr(core_http_client, "callback_client", fake_client)
    monkeypatch.setattr(wb, "callback_client", fake_client)

    ok = await iw.process_interview_job({"interviewId": "i1", "applicationId": "a1", "transcript": []})
    assert ok is False


@pytest.mark.asyncio
async def test_process_job_skips_when_no_scorecard(monkeypatch):
    async def fake_fetch_internal(endpoint):
        return SAMPLE_APPLICATION if "applications" in endpoint else {}

    def fake_run_interviewer(state):
        return {**state}

    async def fake_post_callback(endpoint, payload):
        return {}

    monkeypatch.setattr(iw, "fetch_internal", fake_fetch_internal)
    monkeypatch.setattr(iw, "run_interviewer_agent", fake_run_interviewer)
    fake_client = FakeCallbackClient(post_callback=fake_post_callback)
    monkeypatch.setattr(iw, "callback_client", fake_client)
    monkeypatch.setattr(core_http_client, "callback_client", fake_client)
    monkeypatch.setattr(wb, "callback_client", fake_client)
    monkeypatch.setattr(iw, "analyze_interview_sentiment", lambda iid, url: {"status": "unavailable"})

    ok = await iw.process_interview_job({
        "interviewId": "i1",
        "applicationId": "a1",
        "transcript": TRANSCRIPT,
    })
    assert ok is False


@pytest.mark.asyncio
async def test_process_job_posts_sentiment_when_available(monkeypatch):
    posted = {}

    async def fake_fetch_internal(endpoint):
        return SAMPLE_APPLICATION if "applications" in endpoint else {}

    async def fake_patch(endpoint, json=None):
        posted[endpoint] = json
        return FakeResponse(status_code=200)

    async def fake_post_callback(endpoint, payload):
        return {}

    def fake_run_interviewer(state):
        return {**state, "final_scorecard": SCORECARD}

    monkeypatch.setattr(iw, "fetch_internal", fake_fetch_internal)
    monkeypatch.setattr(iw, "run_interviewer_agent", fake_run_interviewer)
    fake_client = FakeCallbackClient(patch=fake_patch, post_callback=fake_post_callback)
    monkeypatch.setattr(iw, "callback_client", fake_client)
    monkeypatch.setattr(core_http_client, "callback_client", fake_client)
    monkeypatch.setattr(wb, "callback_client", fake_client)
    monkeypatch.setattr(iw, "analyze_interview_sentiment", lambda iid, url: {"status": "ok", "tone": "confident"})

    await iw.process_interview_job({
        "interviewId": "i1",
        "applicationId": "a1",
        "transcript": TRANSCRIPT,
        "audioUrl": "https://example.com/audio.webm",
    })

    assert "internal/interviews/i1/result" in posted
    assert "internal/interviews/i1/sentiment" in posted
    assert posted["internal/interviews/i1/result"]["interview_score"] == 85.0
    assert posted["internal/interviews/i1/result"]["scores"]["technical"] == 84.0
    assert posted["internal/interviews/i1/sentiment"]["sentiment_report"]["tone"] == "confident"