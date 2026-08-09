"""
Unit tests for Interview Worker honesty behavior.

Batch 1 contract:
- An empty/malformed transcript is skipped (AgentJobSkip) — no synthetic
  "Thank you for the interview." closing turn is injected and no fabricated
  completion score is posted.
- When the sentiment service reports "unavailable", the worker still posts the
  interview result but SKIPS posting a sentiment report (never persists
  fabricated metrics).

These tests mock only the external dependencies (HTTP callback client and the
interviewer agent) and exercise the real worker/sentiment-skip logic.
"""
import pytest
from workers.interview_worker import process_interview_job


class FakeCallbackClient:
    def __init__(self):
        self.patch_calls = []
        self.post_calls = []

    async def patch(self, endpoint, json=None):
        self.patch_calls.append((endpoint, json))

    async def post_callback(self, endpoint, payload):
        self.post_calls.append((endpoint, payload))


def _fake_scorecard_state():
    """A valid interviewer-agent output with a real total_turns scorecard."""
    return {
        "final_scorecard": {
            "overall_score": 82.0,
            "technical_score": 80.0,
            "communication_score": 85.0,
            "problem_solving_score": 81.0,
            "evasion_flags_count": 0,
            "total_turns": 4,
            "summary_feedback": "Candidate completed the interview.",
        }
    }


def _stub_external_deps(monkeypatch):
    fake = FakeCallbackClient()
    monkeypatch.setattr("workers.interview_worker.callback_client", fake)
    monkeypatch.setattr("workers.worker_base.callback_client", fake)
    return fake


@pytest.mark.asyncio
async def test_empty_transcript_skips_without_fabricated_score(monkeypatch):
    """An empty transcript aborts the job: no result callback, no audit record,
    no synthetic closing turn, no fabricated completion score."""
    fake = _stub_external_deps(monkeypatch)

    result = await process_interview_job(
        {"interviewId": "int-empty", "applicationId": "app-1", "transcript": []}
    )
    assert result is False
    assert fake.patch_calls == []
    assert fake.post_calls == []


@pytest.mark.asyncio
async def test_malformed_transcript_skips_without_callbacks(monkeypatch):
    """A non-list transcript is treated as absent and skipped the same way."""
    fake = _stub_external_deps(monkeypatch)

    result = await process_interview_job(
        {"interviewId": "int-bad", "applicationId": "app-1", "transcript": "not a list"}
    )
    assert result is False
    assert fake.patch_calls == []


@pytest.mark.asyncio
async def test_missing_ids_returns_false(monkeypatch):
    fake = _stub_external_deps(monkeypatch)

    result = await process_interview_job({})
    assert result is False
    assert fake.patch_calls == []


@pytest.mark.asyncio
async def test_skips_posting_sentiment_report_when_unavailable(monkeypatch):
    """With a real transcript the result callback fires, but the sentiment
    report is NOT posted when the real sentiment service reports unavailable."""
    fake = _stub_external_deps(monkeypatch)
    monkeypatch.setattr(
        "workers.interview_worker.run_interviewer_agent",
        lambda state: _fake_scorecard_state(),
    )

    transcript = [
        {"speaker": "ai", "text": "Welcome to the interview."},
        {"speaker": "candidate", "text": "I built distributed systems with Kafka and Kubernetes."},
    ]

    result = await process_interview_job(
        {"interviewId": "int-1", "applicationId": "app-1", "transcript": transcript}
    )
    assert result is True

    result_endpoint = next(
        (e for e, _ in fake.patch_calls if e == "internal/interviews/int-1/result"), None
    )
    assert result_endpoint is not None, "interview result must still be posted"

    sentiment_endpoint = next(
        (e for e, _ in fake.patch_calls if e == "internal/interviews/int-1/sentiment"), None
    )
    assert sentiment_endpoint is None, (
        "sentiment report must not be posted when the service reports unavailable"
    )

    # A completed audit record is posted.
    assert any(e == "internal/agent-logs" for e, _ in fake.post_calls)
