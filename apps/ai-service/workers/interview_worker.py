import logging
import httpx
from core.config import settings
from core.http_client import callback_client
from agents.interviewer_agent import run_interviewer_agent, InterviewerState
from services.sentiment_service import analyze_interview_sentiment

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

    try:
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
            return False

        composite_score = scorecard.get("overall_score", 0.0)
        technical_score = scorecard.get("technical_score", 0.0)
        communication_score = scorecard.get("communication_score", 0.0)
        problem_solving_score = scorecard.get("problem_solving_score", 0.0)
        summary_feedback = scorecard.get("summary_feedback", "")

        patch_payload = {
            "interview_score": composite_score,
            "scores": {
                "composite": composite_score,
                "technical": technical_score,
                "communication": communication_score,
                "problemSolving": problem_solving_score,
            },
            "reasoning": summary_feedback,
            "feedback": summary_feedback,
            "transcript": raw_transcript,
        }

        async with httpx.AsyncClient() as client:
            resp = await client.patch(
                f"{settings.express_api_base_url}/internal/interviews/{target_interview_id}/result",
                json=patch_payload,
                headers={"X-Internal-Service-Secret": settings.internal_service_secret},
            )
            resp.raise_for_status()

            # Execute Sentiment + Stress Analyser on voice interview transcript
            try:
                sentiment_report = analyze_interview_sentiment(target_interview_id, raw_transcript)
                await client.patch(
                    f"{settings.express_api_base_url}/internal/interviews/{target_interview_id}/sentiment",
                    json={"sentiment_report": sentiment_report},
                    headers={"X-Internal-Service-Secret": settings.internal_service_secret},
                )
            except Exception as sentiment_err:
                logger.warning(f"Failed to post sentiment report for interview {target_interview_id}: {sentiment_err}")

        log_payload = {
            "job_id": None,
            "agent_name": "interviewer_agent",
            "action": "voice_interview_evaluation",
            "input": {"interview_id": target_interview_id, "application_id": application_id},
            "output": scorecard,
            "status": "completed",
        }
        await callback_client.post_callback("internal/agent-logs", log_payload)

        logger.info(f"Successfully completed interview evaluation job for: {target_interview_id}")
        return True

    except Exception as e:
        logger.error(f"Failed to process interview job for {target_interview_id}: {e}")
        try:
            log_payload = {
                "agent_name": "interviewer_agent",
                "action": "voice_interview_evaluation",
                "status": "failed",
                "error": str(e),
            }
            await callback_client.post_callback("internal/agent-logs", log_payload)
        except Exception:
            pass
        return False
