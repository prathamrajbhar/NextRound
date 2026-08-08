import logging
import httpx
from core.config import settings
from core.http_client import callback_client
from agents.coding_agent import run_coding_agent

logger = logging.getLogger("coding_worker")


# ML_BYPASS: WASM sandbox — upgrade to Judge0 CE or Firecracker MicroVM when available
async def process_coding_job(job_data: dict) -> bool:
    """
    Process coding assessment evaluation job.
    1. Extract candidate code, problemId, submissionId.
    2. Run Coding Agent in Python subprocess sandbox.
    3. Post test case pass rate & complexity analysis back to Express internal endpoint.
    4. Log agent audit record.
    """
    application_id = job_data.get("applicationId")
    problem_id = job_data.get("problemId", "virtualized-list")
    code = job_data.get("code", "")
    submission_id = job_data.get("submissionId", "")

    if not application_id:
        logger.error("Missing applicationId in coding job payload.")
        return False

    logger.info(f"Processing coding evaluation job for applicationId: {application_id}, problem: {problem_id}")

    try:
        # Run Coding Agent
        result = await run_coding_agent(
            application_id=application_id,
            problem_id=problem_id,
            code=code,
            language=job_data.get("language", "python"),
            submission_id=submission_id,
        )

        # Patch coding evaluation result back to Express internal endpoint
        patch_payload = {
            "submissionId": submission_id,
            "score": result.get("score"),
            "pass_rate": result.get("pass_rate"),
            "complexity_analysis": result.get("complexity_analysis"),
            "passed": result.get("passed"),
            "feedback": result.get("feedback"),
            "execution_time_ms": result.get("execution_time_ms"),
            "memory_kb": result.get("memory_kb"),
        }

        async with httpx.AsyncClient() as client:
            resp = await client.patch(
                f"{settings.express_api_base_url}/internal/applications/{application_id}/coding-result",
                json=patch_payload,
                headers={"X-Internal-Service-Secret": settings.internal_service_secret},
            )
            resp.raise_for_status()

        # Log agent execution
        log_payload = {
            "job_id": None,
            "agent_name": "coding_agent",
            "action": "coding_evaluation",
            "input": {"application_id": application_id, "problem_id": problem_id, "submission_id": submission_id},
            "output": result,
            "status": "completed",
        }
        await callback_client.post_callback("internal/agent-logs", log_payload)

        logger.info(f"Successfully completed coding job for applicationId: {application_id}")
        return True

    except Exception as e:
        logger.error(f"Failed to process coding job for applicationId {application_id}: {e}")
        try:
            log_payload = {
                "agent_name": "coding_agent",
                "action": "coding_evaluation",
                "status": "failed",
                "error": str(e),
            }
            await callback_client.post_callback("internal/agent-logs", log_payload)
        except Exception:
            pass
        return False
