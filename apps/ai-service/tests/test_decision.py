"""
Unit tests for Decision Agent (Threshold Match, Auto-Offer, Rejection & HR Hold Routing)
"""
import pytest
from agents.decision_agent import (
    threshold_match_node,
    route_decision_branch,
    run_decision_agent,
    draft_offer_node,
    DecisionState,
)


def _no_llm(monkeypatch):
    """Force the deterministic fallback offer-letter body (no live LLM call)."""
    monkeypatch.setattr("agents.decision_agent.generate_text", lambda prompt: None)


def test_threshold_match_hire():
    """Verify composite_score >= 80.0 and confidence >= 0.70 produces 'hire' decision."""
    state: DecisionState = {
        "application_id": "app-hire",
        "composite_score": 88.5,
        "confidence": 0.95,
    }
    res = threshold_match_node(state)
    assert res["decision"] == "hire"
    assert "HIRE" in res["reasoning"]


def test_threshold_match_reject():
    """Verify composite_score < 65.0 and confidence >= 0.70 produces 'reject' decision."""
    state: DecisionState = {
        "application_id": "app-reject",
        "composite_score": 58.0,
        "confidence": 0.85,
    }
    res = threshold_match_node(state)
    assert res["decision"] == "reject"
    assert "REJECT" in res["reasoning"]


def test_threshold_match_hold_low_confidence():
    """Verify confidence < 0.70 routes to 'hold_for_review' regardless of high score."""
    state: DecisionState = {
        "application_id": "app-hold-conf",
        "composite_score": 92.0,
        "confidence": 0.65,
    }
    res = threshold_match_node(state)
    assert res["decision"] == "hold_for_review"
    assert "Hold Queue" in res["reasoning"]


def test_threshold_match_hold_intermediate_score():
    """Verify score in band [65.0, 79.9] routes to 'hold_for_review'."""
    state: DecisionState = {
        "application_id": "app-hold-score",
        "composite_score": 75.0,
        "confidence": 0.90,
    }
    res = threshold_match_node(state)
    assert res["decision"] == "hold_for_review"


def test_threshold_match_missing_composite_routes_to_hold():
    """A null composite is never coerced to a number: it routes to HR hold, not reject."""
    state: DecisionState = {
        "application_id": "app-no-score",
        "composite_score": None,
        "confidence": 1.0,
    }
    res = threshold_match_node(state)
    assert res["decision"] == "hold_for_review"
    assert "No composite score" in res["reasoning"]


def test_decision_worker_coerce_optional_float_never_zero():
    """The worker coercion helper keeps None as None instead of rewriting it to 0.0."""
    from workers.decision_worker import _coerce_optional_float

    assert _coerce_optional_float(None) is None
    assert _coerce_optional_float(0.0) == 0.0
    assert _coerce_optional_float("85") == 85.0
    assert _coerce_optional_float("garbage") is None


def test_route_decision_branch():
    """Verify conditional router branches correctly."""
    assert route_decision_branch({"decision": "hire"}) == "draft_offer"
    assert route_decision_branch({"decision": "reject"}) == "draft_rejection"
    assert route_decision_branch({"decision": "hold_for_review"}) == "draft_hold_notice"


@pytest.mark.asyncio
async def test_run_decision_agent_hire_auto_offer():
    """Verify run_decision_agent returns offer_letter_content and auto_offer=True for HIRE decision."""
    res = await run_decision_agent(
        application_id="app-decision-hire",
        composite_score=86.0,
        confidence=0.92,
    )
    assert res["decision"] == "hire"
    assert res["auto_offer"] is True
    assert res["offer_letter_content"] is not None
    assert "OFFER OF EMPLOYMENT" in res["offer_letter_content"] or "offer" in res["offer_letter_content"].lower()


def test_draft_offer_node_uses_job_terms(monkeypatch):
    """The offer letter is drafted from the job title/salary/equity, never constants."""
    _no_llm(monkeypatch)
    state: DecisionState = {
        "application_id": "app-offer-terms",
        "composite_score": 88.0,
        "confidence": 0.95,
        "decision": "hire",
        "job_title": "Staff Engineer",
        "salary": "180000",
        "equity": "0.25%",
    }
    res = draft_offer_node(state)
    assert res["auto_offer"] is True
    assert "Position: Staff Engineer" in res["offer_letter_content"]
    assert "Base Salary: 180000 / year" in res["offer_letter_content"]
    assert "Equity: 0.25%" in res["offer_letter_content"]


def test_draft_offer_node_pending_when_terms_missing(monkeypatch):
    """Absent salary/equity are carried as 'To be confirmed', never invented."""
    _no_llm(monkeypatch)
    state: DecisionState = {
        "application_id": "app-no-salary",
        "composite_score": 88.0,
        "confidence": 0.95,
        "decision": "hire",
        "job_title": "Staff Engineer",
    }
    res = draft_offer_node(state)
    assert res["auto_offer"] is True
    assert "Base Salary: To be confirmed" in res["offer_letter_content"]
    assert "Equity: To be confirmed" in res["offer_letter_content"]


@pytest.mark.asyncio
async def test_run_decision_agent_offer_letter_carries_job_terms(monkeypatch):
    """End-to-end: job terms flow through run_decision_agent into the offer letter."""
    _no_llm(monkeypatch)
    res = await run_decision_agent(
        application_id="app-terms-e2e",
        composite_score=88.0,
        confidence=0.95,
        job_title="Staff Engineer",
        salary="180000",
        equity="0.25%",
    )
    assert res["decision"] == "hire"
    assert res["auto_offer"] is True
    assert "Base Salary: 180000 / year" in res["offer_letter_content"]
    assert "Equity: 0.25%" in res["offer_letter_content"]


@pytest.mark.asyncio
async def test_run_decision_agent_offer_letter_pending_when_salary_missing(monkeypatch):
    """End-to-end: absent salary is carried as pending, not invented."""
    _no_llm(monkeypatch)
    res = await run_decision_agent(
        application_id="app-pending-e2e",
        composite_score=88.0,
        confidence=0.95,
        job_title="Staff Engineer",
    )
    assert res["decision"] == "hire"
    assert res["auto_offer"] is True
    assert "Base Salary: To be confirmed" in res["offer_letter_content"]
    assert "Equity: To be confirmed" in res["offer_letter_content"]


def test_decision_worker_extract_equity_reads_job_thresholds():
    """The worker-side equity helper mirrors the API deriveEquity contract."""
    from workers.decision_worker import _extract_equity

    assert _extract_equity({"thresholds": {"equity": "0.25%"}}) == "0.25%"
    assert _extract_equity({"thresholds": {"equity": ""}}) is None
    assert _extract_equity({"thresholds": {"equity": 123}}) is None
    assert _extract_equity({"thresholds": "not-a-dict"}) is None
    assert _extract_equity({}) is None


class _FakeCallbackClient:
    def __init__(self):
        self.patch_calls = []
        self.post_calls = []

    async def patch(self, endpoint, json=None):
        self.patch_calls.append((endpoint, json))

    async def post_callback(self, endpoint, payload):
        self.post_calls.append((endpoint, payload))


@pytest.mark.asyncio
async def test_decision_worker_real_zero_composite_still_rejects(monkeypatch):
    """A genuine 0.0 composite (a real measurement, not a missing one) must still
    auto-reject — only None is held for review. This guards the null-to-hold
    routing from accidentally swallowing a real failing score."""
    from workers.decision_worker import process_decision_job

    fake = _FakeCallbackClient()
    monkeypatch.setattr("workers.decision_worker.callback_client", fake)
    monkeypatch.setattr("workers.worker_base.callback_client", fake)

    async def _fake_fetch(endpoint):
        # Stored application has no evaluation to fall back to; the job's 0.0
        # composite is the only signal and must be treated as a real zero.
        return {"job": {"title": "Engineer"}, "evaluations": []}

    monkeypatch.setattr("workers.decision_worker.fetch_internal", _fake_fetch)

    result = await process_decision_job(
        {
            "applicationId": "app-zero-score",
            "compositeScore": 0.0,
            "confidence": 1.0,
        }
    )
    assert result is True
    decision_call = next((j for e, j in fake.patch_calls if "decision" in e), None)
    assert decision_call is not None
    assert decision_call["decision"] == "reject"
    assert decision_call["decision"] != "hold_for_review"


@pytest.mark.asyncio
async def test_decision_worker_null_composite_routes_to_hold(monkeypatch):
    """A null composite (even after the stored-application fallback) must NOT
    become an auto-reject: the worker passes None through and the agent routes
    the application to HR hold review."""
    from workers.decision_worker import process_decision_job

    fake = _FakeCallbackClient()
    monkeypatch.setattr("workers.decision_worker.callback_client", fake)
    monkeypatch.setattr("workers.worker_base.callback_client", fake)

    async def _fake_fetch(endpoint):
        # Stored application also has no evaluation/composite to fall back to.
        return {"job": {"title": "Engineer"}, "evaluations": []}

    monkeypatch.setattr("workers.decision_worker.fetch_internal", _fake_fetch)

    result = await process_decision_job(
        {
            "applicationId": "app-null-score",
            "compositeScore": None,
            "confidence": 1.0,
        }
    )
    assert result is True
    decision_call = next((j for e, j in fake.patch_calls if "decision" in e), None)
    assert decision_call is not None
    assert decision_call["decision"] == "hold_for_review"
    assert decision_call["decision"] != "reject"
