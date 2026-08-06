"""
Unit tests for Decision Agent (Threshold Match, Auto-Offer, Rejection & HR Hold Routing)
"""
import pytest
from agents.decision_agent import (
    threshold_match_node,
    route_decision_branch,
    run_decision_agent,
    DecisionState,
)


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
