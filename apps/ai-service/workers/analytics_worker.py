import logging
from agents.analytics_agent import run_analytics_agent, AnalyticsState
from workers.worker_base import run_agent_job

logger = logging.getLogger("analytics_worker")

async def process_analytics_job(job_data: dict) -> bool:
    org_id = job_data.get("orgId") or job_data.get("org_id")
    if not org_id:
        logger.error("Missing org_id in analytics job payload. No default org is assumed.")
        return False
    logger.info(f"Processing analytics job for org: {org_id}")

    async def run() -> dict:
        state: AnalyticsState = await run_analytics_agent({"org_id": org_id})
        return {
            "conversions": state.get("conversions"),
            "executive_narrative": state.get("executive_narrative"),
            "report_pdf_url": state.get("report_pdf_url"),
        }

    return await run_agent_job(
        agent_name="analytics_agent",
        action="weekly_analytics_generation",
        job_input={"org_id": org_id},
        work=run,
        log_extra={"org_id": org_id},
    )
