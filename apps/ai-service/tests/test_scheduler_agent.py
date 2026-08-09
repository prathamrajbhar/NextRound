"""
Unit tests for Scheduler Agent slot + email honesty.

Batch 7b contract:
- Slots are driven by the real org availability config when present, and are
  honest derived future UTC datetimes (never hardcoded strings).
- With no org availability config the agent still produces real future UTC
  slots but reports slot_source "default_business_hours".
- With no real candidate email the agent returns status "email_unavailable"
  with an empty formatted_email — it never drafts an invite to a fabricated
  address (e.g. candidate@example.com).
"""
import pytest
from datetime import datetime, timedelta

from agents.scheduler_agent import (
    compute_available_slots,
    default_slots,
    run_scheduler_agent,
)


def _naive(slot: str) -> datetime:
    return datetime.fromisoformat(slot.replace("Z", "+00:00")).replace(tzinfo=None)


def test_compute_available_slots_driven_by_org_availability():
    now = datetime(2026, 8, 10, 8, 0, 0)  # Monday
    availability = {
        "weekday": {"morning": True, "afternoon": True, "evening": False},
        "weekend": {"morning": False, "afternoon": False, "evening": False},
    }
    slots = compute_available_slots(now, availability, count=3)
    assert len(slots) == 3
    for slot in slots:
        dt = _naive(slot)
        assert dt > now
        assert dt.weekday() < 5  # weekday windows only
    # First slot is tomorrow morning (10:00 UTC), inside the weekday morning band.
    first = _naive(slots[0])
    assert first.hour == 10 and first.minute == 0
    assert first.date() == now.date() + timedelta(days=1)


def test_compute_available_slots_respects_evening_only_window():
    now = datetime(2026, 8, 10, 8, 0, 0)  # Monday
    availability = {
        "weekday": {"morning": False, "afternoon": False, "evening": True},
        "weekend": {"morning": False, "afternoon": False, "evening": False},
    }
    slots = compute_available_slots(now, availability, count=3)
    assert len(slots) == 3
    for slot in slots:
        assert _naive(slot).hour == 18  # evening band representative time


def test_compute_available_slots_skips_weekend_when_weekday_only():
    # Friday -> the next slots must land on Monday (weekday), not the weekend.
    now = datetime(2026, 8, 7, 8, 0, 0)  # Friday
    availability = {
        "weekday": {"morning": True, "afternoon": False, "evening": False},
        "weekend": {"morning": False, "afternoon": False, "evening": False},
    }
    slots = compute_available_slots(now, availability, count=3)
    assert len(slots) == 3
    for slot in slots:
        dt = _naive(slot)
        assert dt.weekday() < 5
    assert _naive(slots[0]).date() == now.date() + timedelta(days=3)  # Monday


def test_compute_available_slots_returns_empty_when_no_valid_future_slot():
    now = datetime(2026, 8, 10, 8, 0, 0)  # Monday
    availability = {
        "weekday": {"morning": False, "afternoon": False, "evening": False},
        "weekend": {"morning": False, "afternoon": False, "evening": False},
    }
    assert compute_available_slots(now, availability, count=3) == []


def test_default_slots_are_honest_future_business_days():
    now = datetime(2026, 8, 8, 8, 0, 0)  # Saturday
    slots = default_slots(now, count=3)
    assert len(slots) == 3
    for slot in slots:
        dt = _naive(slot)
        assert dt > now
        assert dt.weekday() < 5  # business days only


@pytest.mark.asyncio
async def test_no_email_never_fabricates_recipient():
    result = await run_scheduler_agent(
        application_id="app-1",
        interview_id="int-1",
        candidate_email="",
        job_title="Backend Engineer",
    )
    assert result["status"] == "email_unavailable"
    assert result["formatted_email"] == ""
    assert "candidate@example.com" not in str(result)
    # Slots are still real and present so the candidate schedule page can use them.
    assert len(result["available_slots"]) > 0


@pytest.mark.asyncio
async def test_no_email_skips_llm_invite_drafting(monkeypatch):
    calls = []

    def fake_generate_text(prompt):
        calls.append(prompt)
        return "draft"

    monkeypatch.setattr("agents.scheduler_agent.generate_text", fake_generate_text)
    result = await run_scheduler_agent(
        application_id="app-1",
        candidate_email="",
        job_title="Backend Engineer",
    )
    assert calls == []
    assert result["formatted_email"] == ""
    assert result["status"] == "email_unavailable"


@pytest.mark.asyncio
async def test_with_email_uses_org_availability_and_drafts_invite(monkeypatch):
    availability = {
        "weekday": {"morning": True, "afternoon": True, "evening": False},
        "weekend": {"morning": False, "afternoon": False, "evening": False},
    }
    monkeypatch.setattr(
        "agents.scheduler_agent.generate_text",
        lambda prompt: "Your interview invitation is ready.",
    )
    result = await run_scheduler_agent(
        application_id="app-1",
        interview_id="int-1",
        candidate_email="cand@real.com",
        job_title="Backend Engineer",
        availability_hours=availability,
    )
    assert result["status"] == "completed"
    assert result["slot_source"] == "org_availability"
    assert len(result["available_slots"]) == 3
    assert result["formatted_email"] == "Your interview invitation is ready."
