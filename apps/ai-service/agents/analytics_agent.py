"""Analytics Agent: aggregate recruitment funnel metrics into an executive summary.

The analytics pipeline is a fixed linear chain of four stages with no branching
logic, so it does not use a LangGraph StateGraph — the stages are plain functions
run in sequence by ``run_analytics_agent``.
"""

import logging
from typing import TypedDict
from core.http_client import callback_client

logger = logging.getLogger("analytics_agent")

# Application stages that count as having reached each funnel milestone.
_SCREENED_STATUSES = [
    "screening_completed", "assessment", "interview_scheduled", "interviewed",
    "evaluation", "hr_round", "decided", "offered", "accepted",
]
_INTERVIEWED_STATUSES = ["interviewed", "evaluation", "hr_round", "decided", "offered", "accepted"]
_OFFERED_STATUSES = ["offered", "accepted"]


class AnalyticsState(TypedDict, total=False):
    org_id: str
    raw_data: dict
    funnel_metrics: dict
    conversions: dict
    time_to_hire_days: int
    executive_narrative: str
    report_pdf_url: str


async def fetch_raw_data_node(state: AnalyticsState) -> AnalyticsState:
    """Node 1: Fetch raw aggregated hiring data from Express internal endpoint."""
    org_id = state.get("org_id")
    logger.info(f"AnalyticsAgent: Fetching raw data for org {org_id}")

    try:
        response = await callback_client.get(
            "internal/analytics/raw",
            params={"org_id": org_id},
        )
        state["raw_data"] = response.json().get("data", {})
    except Exception as e:
        logger.warning(f"Could not fetch raw analytics data: {e}")
        state["raw_data"] = {}

    return state


def compute_funnel_node(state: AnalyticsState) -> AnalyticsState:
    """Node 2: Calculate recruitment funnel stages and conversion percentages."""
    raw = state.get("raw_data", {})
    jobs = raw.get("jobs", [])

    total_apps = 0
    screened = 0
    interviewed = 0
    offered = 0
    accepted = 0

    for job in jobs:
        apps = job.get("applications", [])
        total_apps += len(apps)
        for app in apps:
            st = app.get("status", "")
            if st in _SCREENED_STATUSES:
                screened += 1
            if st in _INTERVIEWED_STATUSES:
                interviewed += 1
            if st in _OFFERED_STATUSES:
                offered += 1
            if st == "accepted":
                accepted += 1

    state["funnel_metrics"] = {
        "applied": total_apps,
        "screened": screened,
        "interviewed": interviewed,
        "offered": offered,
        "accepted": accepted,
    }

    state["conversions"] = {
        "appliedToScreened": round((screened / total_apps * 100) if total_apps else 0),
        "screenedToInterviewed": round((interviewed / screened * 100) if screened else 0),
        "interviewedToOffered": round((offered / interviewed * 100) if interviewed else 0),
        "offerAcceptanceRate": round((accepted / offered * 100) if offered else 0),
    }

    state["time_to_hire_days"] = None
    return state


def generate_narrative_node(state: AnalyticsState) -> AnalyticsState:
    """Node 3: Synthesize executive summary narrative for HR leadership.

    Builds the narrative strictly from the computed funnel metrics so the report
    always carries a meaningful, factual summary (previously always empty).
    """
    metrics = state.get("funnel_metrics", {})
    conversions = state.get("conversions", {})

    applied = metrics.get("applied", 0)
    if not applied:
        state["executive_narrative"] = "No applications were recorded in the reporting period."
        return state

    state["executive_narrative"] = (
        f"{applied} candidates applied, {metrics.get('screened', 0)} passed screening "
        f"({conversions.get('appliedToScreened', 0)}%), {metrics.get('interviewed', 0)} advanced to "
        f"interview ({conversions.get('screenedToInterviewed', 0)}%), {metrics.get('offered', 0)} received "
        f"offers ({conversions.get('interviewedToOffered', 0)}%), and {metrics.get('accepted', 0)} accepted "
        f"({conversions.get('offerAcceptanceRate', 0)}% offer acceptance rate)."
    )
    return state


async def export_pdf_node(state: AnalyticsState) -> AnalyticsState:
    """Node 4: Register executive report and notify internal API."""
    org_id = state.get("org_id")
    state["report_pdf_url"] = ""
    if not org_id:
        return state

    try:
        await callback_client.post(
            "internal/analytics/reports",
            json={
                "org_id": org_id,
                "report_url": state["report_pdf_url"],
                "summary": state.get("executive_narrative"),
                "generated_at": "now",
            },
        )
    except Exception as e:
        logger.warning(f"Could not report generated analytics back to internal endpoint: {e}")

    return state


async def run_analytics_agent(state: AnalyticsState) -> AnalyticsState:
    """Execute the Analytics Agent pipeline over the provided initial state."""
    state = await fetch_raw_data_node(state)
    state = compute_funnel_node(state)
    state = generate_narrative_node(state)
    state = await export_pdf_node(state)
    return state
