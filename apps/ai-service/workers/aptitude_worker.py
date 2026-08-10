import logging
from core.http_client import callback_client
from agents.assessment_agent import run_assessment_agent
from services.question_cache_service import (
    get_cached_assessment_data,
    set_cached_assessment_data,
)
from workers.worker_base import run_agent_job

logger = logging.getLogger("aptitude_worker")


async def process_aptitude_job(job_data: dict) -> bool:
    """
    Process aptitude test scoring job.
    1. Extract candidate answers & test session telemetry.
    2. Run Assessment Agent to score answers against threshold (using cached questions).
    3. Post result back to Express internal endpoint.
    4. Log agent audit record.
    """
    application_id = job_data.get("applicationId")
    answers = job_data.get("answers", [])
    if not application_id:
        logger.error("Missing applicationId in aptitude job payload.")
        return False

    logger.info(f"Processing aptitude assessment job for applicationId: {application_id}")

    async def run() -> dict:
        # Try cache first, then fetch from Express if not cached.
        stored_questions = []
        min_score = None
        
        cached_data = get_cached_assessment_data(application_id)
        if cached_data:
            stored_questions, min_score = cached_data
            logger.info(f"Using cached assessment data for {application_id}")
        else:
            # Fetch stored generated questions and pass threshold for this session from Express.
            # Both are required: scoring against a fabricated threshold or empty
            # question set would be dishonest. The assessment agent raises when the
            # stored question set is empty.
            try:
                response = await callback_client.get(
                    f"internal/applications/{application_id}/assessment-data",
                    params={"type": "aptitude"},
                    timeout=10.0,
                )
                data = response.json().get("data", {})
                stored_questions = data.get("questions") or []
                threshold = data.get("minScore")
                if isinstance(threshold, (int, float)):
                    min_score = float(threshold)
                
                # Cache the fetched data for future jobs
                if stored_questions and min_score is not None:
                    set_cached_assessment_data(application_id, stored_questions, min_score)
                    logger.info(f"Cached assessment data for {application_id}")
            except Exception as err:
                raise RuntimeError(f"Could not fetch stored assessment questions for {application_id}: {err}") from err

        if min_score is None:
            raise RuntimeError(f"Aptitude job for application {application_id} has no pass threshold configured.")

        # Run Assessment LangGraph Agent
        result = await run_assessment_agent(
            application_id=application_id,
            answers=answers,
            stored_questions=stored_questions,
            total_time_seconds=job_data.get("totalTimeSeconds", 0),
            tab_switch_count=job_data.get("tabSwitchCount", 0),
            min_score=min_score,
        )

        # Patch assessment result back to Express internal endpoint
        await callback_client.patch(
            f"internal/applications/{application_id}/assessment-result",
            json={
                "score": result.get("score"),
                "category_scores": result.get("category_scores"),
                "total_questions": result.get("total_questions"),
                "correct_answers": result.get("correct_answers"),
                "passed": result.get("passed"),
                "feedback": result.get("feedback"),
            },
        )
        return result

    return await run_agent_job(
        agent_name="assessment_agent",
        action="aptitude_scoring",
        job_input={"application_id": application_id, "answer_count": len(answers)},
        work=run,
        log_extra={"job_id": None},
    )
