import logging
from core.http_client import callback_client
from agents.coding_agent import run_coding_agent
from workers.worker_base import run_agent_job

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

    async def run() -> dict:
        # Run Coding Agent
        result = await run_coding_agent(
            application_id=application_id,
            problem_id=problem_id,
            code=code,
            language=job_data.get("language", "python"),
            submission_id=submission_id,
            test_cases=job_data.get("testCases"),
            entry_function=job_data.get("entryPoint", "solution"),
        )

        # Patch coding evaluation result back to Express internal endpoint
        await callback_client.patch(
            f"internal/applications/{application_id}/coding-result",
            json={
                "submissionId": submission_id,
                "score": result.get("score"),
                "pass_rate": result.get("pass_rate"),
                "complexity_analysis": result.get("complexity_analysis"),
                "passed": result.get("passed"),
                "feedback": result.get("feedback"),
                "execution_time_ms": result.get("execution_time_ms"),
                "memory_kb": result.get("memory_kb"),
            },
        )
        return result

    return await run_agent_job(
        agent_name="coding_agent",
        action="coding_evaluation",
        job_input={
            "application_id": application_id,
            "problem_id": problem_id,
            "submission_id": submission_id,
        },
        work=run,
        log_extra={"job_id": None},
    )
