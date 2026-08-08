import logging
import httpx
from core.config import settings
from core.http_client import callback_client
from agents.scheduler_agent import run_scheduler_agent

logger = logging.getLogger("scheduling_worker")


async def process_scheduling_job(job_data: dict) -> bool:
    """
    Process interview time slot negotiation job.
    1. Extract application & candidate metadata.
    2. Execute Scheduler Agent.
    3. Post available slots back to Express internal endpoint.
    4. Log agent audit record.
    """
    application_id = job_data.get("applicationId")
    if not application_id:
        logger.error("Missing applicationId in scheduling job payload.")
        return False

    logger.info(f"Processing scheduling job for applicationId: {application_id}")

    try:
        candidate_email = job_data.get("candidateEmail", "")
        job_title = job_data.get("jobTitle", "Software Engineer")
        interview_id = job_data.get("interviewId", "")
        action = job_data.get("action", "generate_slots")

        # Run Scheduler Agent
        result = await run_scheduler_agent(
            application_id=application_id,
            interview_id=interview_id,
            candidate_email=candidate_email,
            job_title=job_title,
            action=action,
        )

        # Post generated slots back to Express internal endpoint
        target_interview_id = interview_id or f"intv_{application_id[:8]}"
        patch_payload = {
            "slots": result.get("available_slots", []),
            "formatted_email": result.get("formatted_email", ""),
        }

        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{settings.express_api_base_url}/internal/interviews/{target_interview_id}/schedule-slots",
                json=patch_payload,
                headers={"X-Internal-Service-Secret": settings.internal_service_secret},
            )
            resp.raise_for_status()

        # Log agent execution
        log_payload = {
            "job_id": None,
            "agent_name": "scheduler_agent",
            "action": "slot_negotiation",
            "input": {"application_id": application_id, "action": action},
            "output": result,
            "status": "completed",
        }
        await callback_client.post_callback("internal/agent-logs", log_payload)

        logger.info(f"Successfully completed scheduling job for applicationId: {application_id}")
        return True

    except Exception as e:
        logger.error(f"Failed to process scheduling job for applicationId {application_id}: {e}")
        try:
            log_payload = {
                "agent_name": "scheduler_agent",
                "action": "slot_negotiation",
                "status": "failed",
                "error": str(e),
            }
            await callback_client.post_callback("internal/agent-logs", log_payload)
        except Exception:
            pass
        return False
