import logging
from core.http_client import callback_client
from agents.evaluator_agent import run_evaluator_agent
from workers.worker_base import run_agent_job

logger = logging.getLogger("evaluator_worker")


async def process_evaluator_job(job_data: dict) -> bool:
    """
    Process evaluation job.
    1. Extract application_id, stage, interview_id from job_data.
    2. Execute Evaluator LangGraph agent (asserts scoring isolation).
    3. Patch evaluation results back to Express internal endpoint.
    4. Log agent audit record.
    """
    application_id = job_data.get("applicationId")
    if not application_id:
        logger.error("Missing applicationId in evaluator job payload.")
        return False

    logger.info(f"Processing evaluator job for applicationId: {application_id}")

    stage = job_data.get("stage", "final_evaluation")
    interview_id = job_data.get("interviewId")
    extra = job_data.get("extraData") or {}

    async def run() -> dict:
        # Run Evaluator LangGraph Agent
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
        await callback_client.patch(
            f"internal/evaluations/{eval_id}",
            json={
                "application_id": application_id,
                "composite_score": result.get("composite_score"),
                "confidence": result.get("confidence"),
                "dimension_scores": result.get("dimension_scores"),
                "reasoning": result.get("reasoning"),
            },
        )
        return result

    return await run_agent_job(
        agent_name="evaluator_agent",
        action="final_evaluation_audit",
        job_input={"application_id": application_id, "stage": stage},
        work=run,
    )
