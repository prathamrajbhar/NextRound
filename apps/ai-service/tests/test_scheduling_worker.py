"""
Unit tests for Scheduling Worker honesty.

Batch 7b contract:
- When the candidate has no real email the worker still posts the real slots,
  but the formatted invitation email is empty (never a fabricated address).
- Without a real interview id the worker does NOT post to a fabricated
  "intv_xxx" endpoint; the slots are recorded in the agent audit log only.
"""
import pytest
from workers.scheduling_worker import process_scheduling_job


class FakeClient:
    def __init__(self):
        self.post_calls = []

    async def post(self, endpoint, json=None):
        self.post_calls.append(("post", endpoint, json))

    async def post_callback(self, endpoint, payload):
        self.post_calls.append(("post_callback", endpoint, payload))


@pytest.mark.asyncio
async def test_no_email_posts_real_slots_with_empty_invite(monkeypatch):
    fake = FakeClient()
    monkeypatch.setattr("workers.scheduling_worker.callback_client", fake)
    monkeypatch.setattr("workers.worker_base.callback_client", fake)

    result = await process_scheduling_job(
        {
            "applicationId": "app-1",
            "interviewId": "int-1",
            "candidateEmail": "",
            "jobTitle": "Backend Engineer",
        }
    )
    assert result is True

    slots_post = next(
        (c for c in fake.post_calls if c[0] == "post" and c[1] == "internal/interviews/int-1/schedule-slots"),
        None,
    )
    assert slots_post is not None, "real slots must still be posted for the candidate page"
    body = slots_post[2]
    assert body["formatted_email"] == ""
    assert len(body["slots"]) > 0
    assert "candidate@example.com" not in str(body)

    # A completed agent audit record is still posted.
    assert any(c[0] == "post_callback" and c[1] == "internal/agent-logs" for c in fake.post_calls)


@pytest.mark.asyncio
async def test_missing_interview_id_does_not_post_to_fabricated_endpoint(monkeypatch):
    fake = FakeClient()
    monkeypatch.setattr("workers.scheduling_worker.callback_client", fake)
    monkeypatch.setattr("workers.worker_base.callback_client", fake)

    result = await process_scheduling_job(
        {
            "applicationId": "app-1",
            "candidateEmail": "cand@real.com",
            "jobTitle": "Backend Engineer",
        }
    )
    assert result is True

    # No callback to any internal/interviews/... schedule-slots endpoint.
    assert not any(
        c[0] == "post" and "schedule-slots" in c[1] for c in fake.post_calls
    )
    # The agent audit record still captures the outcome.
    assert any(c[0] == "post_callback" and c[1] == "internal/agent-logs" for c in fake.post_calls)


@pytest.mark.asyncio
async def test_missing_application_id_returns_false(monkeypatch):
    fake = FakeClient()
    monkeypatch.setattr("workers.scheduling_worker.callback_client", fake)
    monkeypatch.setattr("workers.worker_base.callback_client", fake)

    result = await process_scheduling_job({})
    assert result is False
    assert fake.post_calls == []
