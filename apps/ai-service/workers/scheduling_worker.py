import logging
from core.http_client import callback_client
from agents.scheduler_agent import run_scheduler_agent
from workers.worker_base import run_agent_job

logger = logging.getLogger("scheduling_worker")


async def process_scheduling_job(job_data: dict) -> bool:
    """
    Process interview time slot negotiation job.
    1. Extract application & candidate metadata.
    2. Execute Scheduler Agent (slots are driven by org availability when set).
    3. Post available slots back to Express internal endpoint.
    4. Log agent audit record.
    """
    application_id = job_data.get("applicationId")
    if not application_id:
        logger.error("Missing applicationId in scheduling job payload.")
        return False

    logger.info(f"Processing scheduling job for applicationId: {application_id}")

    candidate_email = job_data.get("candidateEmail", "")
    job_title = job_data.get("jobTitle", "")
    interview_id = job_data.get("interviewId", "")
    action = job_data.get("action", "generate_slots")
    org_id = job_data.get("orgId", "")
    availability_hours = job_data.get("availabilityHours") or None

    async def run() -> dict:



        result = await run_scheduler_agent(
            application_id=application_id,
            interview_id=interview_id,
            candidate_email=candidate_email,
            job_title=job_title,
            action=action,
            org_id=org_id,
            availability_hours=availability_hours,
        )




        if interview_id:
            await callback_client.post(
                f"internal/interviews/{interview_id}/schedule-slots",
                json={
                    "slots": result.get("available_slots", []),
                    "formatted_email": result.get("formatted_email", ""),
                },
            )
        else:
            logger.warning(
                f"No interviewId in scheduling payload for application {application_id}; "
                "slots recorded in agent audit log only."
            )

        return result

    return await run_agent_job(
        agent_name="scheduler_agent",
        action="slot_negotiation",
        job_input={"application_id": application_id, "action": action},
        work=run,
        log_extra={"job_id": None},
    )
