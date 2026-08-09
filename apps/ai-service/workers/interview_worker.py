import logging
from core.http_client import callback_client
from agents.interviewer_agent import run_interviewer_agent, InterviewerState
from services.sentiment_service import analyze_interview_sentiment
from workers.worker_base import run_agent_job, AgentJobSkip

logger = logging.getLogger("interview_worker")


async def process_interview_job(job_data: dict) -> bool:
    """
    Process voice interview evaluation job:
    1. Extract interview & application IDs.
    2. Aggregate transcript & execute Interviewer Agent.
    3. Post evaluation result back to Express internal endpoint /internal/interviews/:id/result.
    4. Log agent audit record.
    """
    interview_id = job_data.get("interviewId")
    application_id = job_data.get("applicationId")

    if not interview_id and not application_id:
        logger.error("Missing interviewId/applicationId in interview job payload.")
        return False

    target_interview_id = interview_id or f"intv_{application_id}"
    logger.info(f"Processing interview evaluation job for interviewId: {target_interview_id}")

    async def run() -> dict:
        raw_transcript = job_data.get("transcript") or []

        # Run Interviewer Agent in completion mode to finalize scores
        initial_state: InterviewerState = {
            "interview_id": target_interview_id,
            "application_id": application_id or target_interview_id,
            "conversation_history": raw_transcript if isinstance(raw_transcript, list) else [],
            "current_stage": "closing",
            "turn_number": len(raw_transcript) if isinstance(raw_transcript, list) else 8,
            "latest_candidate_response": "Thank you for the interview.",
        }

        output_state = run_interviewer_agent(initial_state)
        scorecard = output_state.get("final_scorecard")
        if not scorecard or not scorecard.get("total_turns"):
            logger.error(f"Interviewer agent produced no scorecard for interview {target_interview_id}. No fabricated score is applied.")
            raise AgentJobSkip

        patch_payload = {
            "interview_score": scorecard.get("overall_score", 0.0),
            "scores": {
                "composite": scorecard.get("overall_score", 0.0),
                "technical": scorecard.get("technical_score", 0.0),
                "communication": scorecard.get("communication_score", 0.0),
                "problemSolving": scorecard.get("problem_solving_score", 0.0),
            },
            "reasoning": scorecard.get("summary_feedback", ""),
            "feedback": scorecard.get("summary_feedback", ""),
            "transcript": raw_transcript,
        }

        await callback_client.patch(
            f"internal/interviews/{target_interview_id}/result",
            json=patch_payload,
        )

        # Execute Sentiment + Stress Analyser on voice interview transcript
        try:
            sentiment_report = analyze_interview_sentiment(target_interview_id, raw_transcript)
            await callback_client.patch(
                f"internal/interviews/{target_interview_id}/sentiment",
                json={"sentiment_report": sentiment_report},
            )
        except Exception as sentiment_err:
            logger.warning(f"Failed to post sentiment report for interview {target_interview_id}: {sentiment_err}")

        return scorecard

    return await run_agent_job(
        agent_name="interviewer_agent",
        action="voice_interview_evaluation",
        job_input={"interview_id": target_interview_id, "application_id": application_id},
        work=run,
        log_extra={"job_id": None},
    )
