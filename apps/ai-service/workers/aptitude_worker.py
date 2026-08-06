import logging
import httpx
from core.config import settings
from core.http_client import callback_client
from agents.assessment_agent import run_assessment_agent

logger = logging.getLogger("aptitude_worker")


async def process_aptitude_job(job_data: dict) -> bool:
    """
    Process aptitude test scoring job.
    1. Extract candidate answers & test session telemetry.
    2. Run Assessment Agent to score answers against threshold.
    3. Post result back to Express internal endpoint.
    4. Log agent audit record.
    """
    application_id = job_data.get("applicationId")
    answers = job_data.get("answers", [])
    if not application_id:
        logger.error("Missing applicationId in aptitude job payload.")
        return False

    logger.info(f"Processing aptitude assessment job for applicationId: {application_id}")

    try:
        # Run Assessment LangGraph Agent
        result = await run_assessment_agent(
            application_id=application_id,
            answers=answers,
            total_time_seconds=job_data.get("totalTimeSeconds", 0),
            tab_switch_count=job_data.get("tabSwitchCount", 0),
            min_score=70.0,
        )

        # Patch assessment result back to Express internal endpoint
        patch_payload = {
            "score": result.get("score"),
            "category_scores": result.get("category_scores"),
            "total_questions": result.get("total_questions"),
            "correct_answers": result.get("correct_answers"),
            "passed": result.get("passed"),
            "feedback": result.get("feedback"),
        }

        async with httpx.AsyncClient() as client:
            resp = await client.patch(
                f"{settings.express_api_base_url}/internal/applications/{application_id}/assessment-result",
                json=patch_payload,
                headers={"X-Internal-Service-Secret": settings.internal_service_secret},
            )
            resp.raise_for_request()

        # Log agent execution
        log_payload = {
            "job_id": None,
            "agent_name": "assessment_agent",
            "action": "aptitude_scoring",
            "input": {"application_id": application_id, "answer_count": len(answers)},
            "output": result,
            "status": "completed",
        }
        await callback_client.post_callback("internal/agent-logs", log_payload)

        logger.info(f"Successfully completed aptitude assessment job for applicationId: {application_id}")
        return True

    except Exception as e:
        logger.error(f"Failed to process aptitude job for applicationId {application_id}: {e}")
        try:
            log_payload = {
                "agent_name": "assessment_agent",
                "action": "aptitude_scoring",
                "status": "failed",
                "error": str(e),
            }
            await callback_client.post_callback("internal/agent-logs", log_payload)
        except Exception:
            pass
        return False
