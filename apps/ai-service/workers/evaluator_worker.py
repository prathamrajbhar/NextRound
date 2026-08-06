import logging
import httpx
from core.config import settings
from core.http_client import callback_client
from agents.evaluator_agent import run_evaluator_agent

logger = logging.getLogger("evaluator_worker")


async def process_evaluator_job(job_data: dict) -> bool:
    """
    Process evaluation job.
    1. Extract application_id, stage, interview_id from job_data.
    2. Execute Evaluator & Bias Audit LangGraph agent (asserts scoring isolation).
    3. Patch evaluation results & bias report back to Express internal endpoint.
    4. Log agent audit record.
    """
    application_id = job_data.get("applicationId")
    if not application_id:
        logger.error("Missing applicationId in evaluator job payload.")
        return False

    logger.info(f"Processing evaluator job for applicationId: {application_id}")

    try:
        stage = job_data.get("stage", "final_evaluation")
        interview_id = job_data.get("interviewId")
        extra = job_data.get("extraData") or {}

        # Run Evaluator & Bias Audit LangGraph Agent
        result = await run_evaluator_agent(
            application_id=application_id,
            stage=stage,
            interview_id=interview_id,
            screening_score=extra.get("screening_score", 85.0),
            aptitude_score=extra.get("aptitude_score", 88.0),
            coding_score=extra.get("coding_score", 92.0),
            interview_score=extra.get("interview_score", 90.0),
            proctor_flags=extra.get("proctor_flags", []),
            proctor_telemetry=extra.get("proctor_telemetry", {}),
        )

        eval_id = interview_id or f"eval_{application_id}"

        # Send evaluation result to Express API internal callback endpoint
        patch_payload = {
            "application_id": application_id,
            "composite_score": result.get("composite_score"),
            "confidence": result.get("confidence"),
            "dimension_scores": result.get("dimension_scores"),
            "bias_report": result.get("bias_report"),
            "reasoning": result.get("reasoning"),
        }

        async with httpx.AsyncClient() as client:
            resp = await client.patch(
                f"{settings.express_api_base_url}/internal/evaluations/{eval_id}",
                json=patch_payload,
                headers={"X-Internal-Service-Secret": settings.internal_service_secret},
            )
            resp.raise_for_request()

        # Log agent execution
        log_payload = {
            "agent_name": "evaluator_agent",
            "action": "final_evaluation_audit",
            "input": {"application_id": application_id, "stage": stage},
            "output": result,
            "status": "completed",
        }
        await callback_client.post_callback("internal/agent-logs", log_payload)

        logger.info(f"Successfully processed evaluator job for applicationId: {application_id}")
        return True

    except Exception as e:
        logger.error(f"Failed to process evaluator job for applicationId {application_id}: {e}")
        try:
            log_payload = {
                "agent_name": "evaluator_agent",
                "action": "final_evaluation_audit",
                "status": "failed",
                "error": str(e),
            }
            await callback_client.post_callback("internal/agent-logs", log_payload)
        except Exception:
            pass
        return False
