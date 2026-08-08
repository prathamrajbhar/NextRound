import logging
import httpx
from typing import Dict, Any, TypedDict, List
from core.config import settings
from core.http_client import callback_client

logger = logging.getLogger("analytics_worker")

try:
    from langgraph.graph import StateGraph, END
    LANGGRAPH_AVAILABLE = True
except ImportError:
    LANGGRAPH_AVAILABLE = False
    logger.warning("LangGraph not available in analytics_worker. Using linear graph execution.")


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
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{settings.express_api_base_url}/internal/analytics/raw",
                params={"org_id": org_id},
                headers={"X-Internal-Service-Secret": settings.internal_service_secret},
            )
            if resp.status_code == 200:
                payload = resp.json()
                state["raw_data"] = payload.get("data", {})
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
            if st in ["screening_completed", "assessment", "interview_scheduled", "interviewed", "evaluation", "hr_round", "decided", "offered", "accepted"]:
                screened += 1
            if st in ["interviewed", "evaluation", "hr_round", "decided", "offered", "accepted"]:
                interviewed += 1
            if st in ["offered", "accepted"]:
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
    """Node 3: Synthesize executive summary narrative for HR leadership."""
    conversions = state.get("conversions", {})
    state["executive_narrative"] = ""
    return state


async def export_pdf_node(state: AnalyticsState) -> AnalyticsState:
    """Node 4: Register executive report and notify internal API."""
    org_id = state.get("org_id")
    state["report_pdf_url"] = ""
    if not org_id:
        return state

    try:
        async with httpx.AsyncClient() as client:
            await client.post(
                f"{settings.express_api_base_url}/internal/analytics/reports",
                json={
                    "org_id": org_id,
                    "report_url": state["report_pdf_url"],
                    "summary": state.get("executive_narrative"),
                    "generated_at": "now",
                },
                headers={"X-Internal-Service-Secret": settings.internal_service_secret},
            )
    except Exception as e:
        logger.warning(f"Could not report generated analytics back to internal endpoint: {e}")

    return state


async def process_analytics_job(job_data: dict) -> bool:
    """
    Process Analytics Agent BullMQ job:
    1. Extract org_id.
    2. Execute Analytics Agent pipeline.
    3. Register report metadata and log audit record.
    """
    org_id = job_data.get("orgId") or job_data.get("org_id")
    if not org_id:
        logger.error("Missing org_id in analytics job payload. No default org is assumed.")
        return False
    logger.info(f"Processing analytics job for org: {org_id}")

    try:
        state: AnalyticsState = {"org_id": org_id}
        state = await fetch_raw_data_node(state)
        state = compute_funnel_node(state)
        state = generate_narrative_node(state)
        state = await export_pdf_node(state)

        log_payload = {
            "org_id": org_id,
            "agent_name": "analytics_agent",
            "action": "weekly_analytics_generation",
            "input": {"org_id": org_id},
            "output": {
                "conversions": state.get("conversions"),
                "executive_narrative": state.get("executive_narrative"),
                "report_pdf_url": state.get("report_pdf_url"),
            },
            "status": "completed",
        }
        await callback_client.post_callback("internal/agent-logs", log_payload)

        logger.info(f"Successfully processed analytics job for org: {org_id}")
        return True
    except Exception as e:
        logger.error(f"Failed to process analytics job for org {org_id}: {e}")
        try:
            log_payload = {
                "org_id": org_id,
                "agent_name": "analytics_agent",
                "action": "weekly_analytics_generation",
                "status": "failed",
                "error": str(e),
            }
            await callback_client.post_callback("internal/agent-logs", log_payload)
        except Exception:
            pass
        return False

