"""
Unit tests for the Analytics Agent funnel computation (agents/analytics_agent.py).

Batch 6 contract:
- time_to_hire_days is computed from REAL offer.created_at timestamps (the
  terminal timestamp on offered/accepted applications), never a fabricated figure.
- When no terminal offer timestamp exists, time_to_hire_days is None (honest).
"""
from agents.analytics_agent import compute_funnel_node


def _state(jobs):
    return {"org_id": "org-1", "raw_data": {"orgId": "org-1", "jobs": jobs}}


def test_compute_funnel_node_derives_time_to_hire_from_real_offer_timestamps():
    jobs = [
        {
            "applications": [
                {
                    "status": "accepted",
                    "applied_at": "2026-07-01T00:00:00Z",
                    "offer": {"created_at": "2026-07-08T00:00:00Z"},
                },
                {
                    "status": "offered",
                    "applied_at": "2026-06-15T00:00:00Z",
                    "offer": {"created_at": "2026-06-20T00:00:00Z"},
                },
            ]
        }
    ]

    state = compute_funnel_node(_state(jobs))

    # accepted: 7 days, offered: 5 days -> mean 6 days
    assert state["time_to_hire_days"] == 6
    assert state["funnel_metrics"] == {
        "applied": 2,
        "screened": 2,
        "interviewed": 2,
        "offered": 2,
        "accepted": 1,
    }


def test_compute_funnel_node_returns_none_when_no_terminal_offer_timestamp_exists():
    jobs = [
        {
            "applications": [
                # accepted but the offer relation is missing entirely
                {"status": "accepted", "applied_at": "2026-07-01T00:00:00Z", "offer": None},
                # offered but the offer carries no created_at
                {"status": "offered", "applied_at": "2026-06-15T00:00:00Z", "offer": {}},
                # not offered/accepted -> never contributes to time-to-hire
                {"status": "applied", "applied_at": "2026-07-02T00:00:00Z", "offer": {"created_at": "2026-07-03T00:00:00Z"}},
            ]
        }
    ]

    state = compute_funnel_node(_state(jobs))

    assert state["time_to_hire_days"] is None
    # funnel still counts the applied app as applied-only, but accepted+offered
    # statuses both land in the screened/interviewed/offered buckets.
    assert state["funnel_metrics"]["applied"] == 3
    assert state["funnel_metrics"]["screened"] == 2
    assert state["funnel_metrics"]["offered"] == 2
    assert state["funnel_metrics"]["accepted"] == 1
