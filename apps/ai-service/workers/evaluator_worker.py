import logging
from core.http_client import callback_client
from agents.evaluator_agent import run_evaluator_agent
from workers.worker_base import run_agent_job

logger = logging.getLogger("evaluator_worker")


async def process_evaluator_job(job_data: dict) -> bool:
    application_id = job_data.get("applicationId")
    if not application_id:
        logger.error("Missing applicationId in evaluator job payload.")
        return False

    logger.info(f"Processing evaluator job for applicationId: {application_id}")

    stage = job_data.get("stage", "final_evaluation")
    interview_id = job_data.get("interviewId")
    extra = job_data.get("extraData") or {}

    async def run() -> dict:
        result = await run_evaluator_agent(
            application_id=application_id,
            stage=stage,
            interview_id=interview_id,
            screening_score=extra.get("screening_score"),
            aptitude_score=extra.get("aptitude_score"),
            coding_score=extra.get("coding_score"),
            interview_score=extra.get("interview_score"),
            proctor_flags=extra.get("proctor_flags", []),
            proctor_telemetry=extra.get("proctor_telemetry", {}),
        )

        eval_id = interview_id or application_id

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
