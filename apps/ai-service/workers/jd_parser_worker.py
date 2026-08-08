import logging
import httpx
from core.config import settings
from core.http_client import callback_client
from agents.jd_parser_agent import run_jd_parser_agent

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

    try:
        # Fetch job raw details
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{settings.express_api_base_url}/internal/jobs/{job_id}/raw",
                headers={"X-Internal-Service-Secret": settings.internal_service_secret},
            )
            resp.raise_for_status()
            job_info = resp.json().get("data", {})

        raw_desc = job_info.get("description") or job_data.get("description", "")
        org_id = job_info.get("org_id") or job_data.get("orgId")

        # Execute JD Parser LangGraph Agent
        result = await run_jd_parser_agent(job_id=job_id, raw_description=raw_desc)

        # Patch AI assist result back to Express
        patch_payload = {
            "description": result.get("description"),
            "rubric": result.get("rubric"),
            "thresholds": result.get("thresholds"),
        }

        async with httpx.AsyncClient() as client:
            resp = await client.patch(
                f"{settings.express_api_base_url}/internal/jobs/{job_id}/ai-assist-result",
                json=patch_payload,
                headers={"X-Internal-Service-Secret": settings.internal_service_secret},
            )
            resp.raise_for_status()

        # Log agent execution
        log_payload = {
            "job_id": job_id,
            "org_id": org_id,
            "agent_name": "jd_parser_agent",
            "action": "ai_jd_assist",
            "input": {"raw_description": raw_desc[:200]},
            "output": result,
            "status": "completed",
        }
        await callback_client.post_callback("internal/agent-logs", log_payload)

        logger.info(f"Successfully completed JD Parser job for jobId: {job_id}")
        return True

    except Exception as e:
        logger.error(f"Failed to process JD Parser job for jobId {job_id}: {e}")
        # Log failure
        try:
            log_payload = {
                "job_id": job_id,
                "agent_name": "jd_parser_agent",
                "action": "ai_jd_assist",
                "status": "failed",
                "error": str(e),
            }
            await callback_client.post_callback("internal/agent-logs", log_payload)
        except Exception:
            pass
        return False
