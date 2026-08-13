import logging
from core.http_client import callback_client
from agents.jd_parser_agent import run_jd_parser_agent
from workers.worker_base import fetch_internal, run_agent_job

logger = logging.getLogger("jd_parser_worker")


async def process_jd_parser_job(job_data: dict) -> bool:
    """
    Process job description AI assistance job.
    1. Fetch raw job details from Express internal endpoint.
    2. Run JD Parser LangGraph agent.
    3. Send result back to Express internal endpoint.
    4. Post agent execution log.
    """
    job_id = job_data.get("jobId")
    if not job_id:
        logger.error("Missing jobId in JD Parser job payload.")
        return False

    logger.info(f"Processing JD Parser job for jobId: {job_id}")


    log_extra: dict = {"job_id": job_id}
    job_input: dict = {}

    async def run() -> dict:
        job_info = await fetch_internal(f"internal/jobs/{job_id}/raw")
        raw_desc = job_info.get("description") or job_data.get("description", "")
        log_extra["org_id"] = job_info.get("org_id") or job_data.get("orgId")
        job_input["raw_description"] = raw_desc[:200]


        result = await run_jd_parser_agent(job_id=job_id, raw_description=raw_desc)


        await callback_client.patch(
            f"internal/jobs/{job_id}/ai-assist-result",
            json={
                "description": result.get("description"),
                "rubric": result.get("rubric"),
                "thresholds": result.get("thresholds"),
                "skills": result.get("skills"),
            },
        )
        return result

    return await run_agent_job(
        agent_name="jd_parser_agent",
        action="ai_jd_assist",
        job_input=job_input,
        work=run,
        log_extra=log_extra,
    )
