import logging
from core.http_client import callback_client
from services.embedding_service import embed_text
from workers.worker_base import fetch_internal, run_agent_job

logger = logging.getLogger("sourcing_worker")


# ML_BYPASS: external sourcing — integrate LinkedIn Recruiter API or scraping pipeline when ready
async def rank_candidates(job_vector: list) -> list:
    """
    Source in-platform candidates ranked by semantic match against the job embedding.
    External sourcing infra is not connected; returns an empty pool until real
    candidate-source integration is available. Never fabricates candidates.
    """
    return []


async def process_sourcing_job(job_data: dict) -> bool:
    """
    Process auto-sourcing & vector indexing job for published job openings.
    1. Fetch job description from Express API.
    2. Generate job description embedding (768-dim vector).
    3. Save pre-ranked recommended candidate pool.
    4. Report back to Express API via internal callback.
    """
    job_id = job_data.get("jobId")
    if not job_id:
        logger.error("Missing jobId in sourcing job payload.")
        return False

    logger.info(f"Processing sourcing index job for jobId: {job_id}")

    log_extra: dict = {"job_id": job_id}

    async def run() -> dict:
        job_info = await fetch_internal(f"internal/jobs/{job_id}/raw")
        job_desc = job_info.get("description", "")
        log_extra["org_id"] = job_info.get("org_id")

        # Generate 768-dim vector embedding for job
        job_vector = embed_text(job_desc)

        # Query platform CandidateProfiles ranked by cosine similarity against the job embedding
        recommended_candidates = await rank_candidates(job_vector)

        # Callback candidates back to Express
        await callback_client.post_callback(
            f"internal/sourcing/{job_id}/candidates",
            {"candidates": recommended_candidates},
        )
        return {"candidates_count": len(recommended_candidates)}

    return await run_agent_job(
        agent_name="sourcing_agent",
        action="sourcing_index",
        job_input={"job_id": job_id},
        work=run,
        log_extra=log_extra,
    )
