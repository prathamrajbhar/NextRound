import logging

from workers.worker_base import AgentJobSkip, fetch_internal, run_agent_job

logger = logging.getLogger("sourcing_worker")


async def process_sourcing_job(job_data: dict) -> bool:
    job_id = job_data.get("jobId")
    if not job_id:
        logger.error("Missing jobId in sourcing job payload.")
        return False

    logger.info(f"Processing sourcing index job for jobId: {job_id}")

    log_extra: dict = {"job_id": job_id}

    async def run() -> dict:
        job_info = await fetch_internal(f"internal/jobs/{job_id}/raw")
        log_extra["org_id"] = job_info.get("org_id")

        raise AgentJobSkip(
            "External candidate sourcing is not connected; no candidates sourced."
        )

    return await run_agent_job(
        agent_name="sourcing_agent",
        action="sourcing_index",
        job_input={"job_id": job_id},
        work=run,
        log_extra=log_extra,
    )
