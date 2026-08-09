import logging
import json
from core.http_client import callback_client
from services.llm_service import generate_text, extract_json_object
from workers.worker_base import fetch_internal, run_agent_job

logger = logging.getLogger("video_screening_worker")


def _response_text(response) -> str:
    """Extract candidate answer text from a video-screening response record."""
    if not isinstance(response, dict):
        return ""
    for key in ("answer", "transcript", "text", "content"):
        value = response.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return ""


def _score_responses_with_gemini(responses, job_title: str, rubric) -> dict:
    """Score recorded video-screening answers with Gemini against the role rubric.

    Returns a dict with score/passed/feedback. Returns None when there is no real
    candidate answer content to score (never fabricates a score on empty data).
    """
    transcript_text = "\n\n".join(
        f"Q: {r.get('questionText') or r.get('question') or ''}\nA: {_response_text(r)}"
        for r in responses if _response_text(r)
    )

    if len(transcript_text.strip()) < 30:
        return None

    rubric_str = json.dumps(rubric) if isinstance(rubric, dict) else ""
    prompt = (
        f"You are an unbiased evaluator scoring asynchronous video interview responses "
        f"for a {job_title} role.\n"
        f"Rubric: {rubric_str}\n\n"
        f"Candidate responses:\n{transcript_text[:8000]}\n\n"
        'Return JSON only: {"score": float (0-100), "feedback": str, "key_strengths": [str], '
        '"weaknesses": [str]}'
    )

    data = extract_json_object(generate_text(prompt))
    if not data:
        return None

    score = float(data.get("score", 0))
    return {
        "score": round(max(0.0, min(100.0, score)), 1),
        "passed": score >= 70.0,
        "feedback": data.get("feedback", ""),
        "key_strengths": data.get("key_strengths", []),
        "weaknesses": data.get("weaknesses", []),
    }


async def process_video_screening_job(job_data: dict) -> bool:
    """
    Score asynchronous video-screening responses with real LLM transcription/scoring.
    1. Fetch raw application + job context from Express internal endpoint.
    2. Score recorded answers with Gemini (real LLM) when answer text exists.
    3. Post result back to Express internal endpoint.
    4. Log agent audit record.
    """
    application_id = job_data.get("applicationId")
    if not application_id:
        logger.error("Missing applicationId in video-screening job payload.")
        return False

    logger.info(f"Processing video-screening scoring job for applicationId: {application_id}")

    # job_id/org_id are only known after fetching the application record.
    log_extra: dict = {}

    async def run() -> dict:
        app_info = await fetch_internal(f"internal/applications/{application_id}/raw")
        job_info = app_info.get("job", {})
        log_extra["job_id"] = job_info.get("id")
        log_extra["org_id"] = job_info.get("org_id")

        responses = job_data.get("responses") or app_info.get("video_responses") or []
        scoring = _score_responses_with_gemini(
            responses,
            job_info.get("title", "Software Engineer"),
            job_info.get("rubric", {}),
        )

        if scoring is None:
            # No real candidate answer content was submitted. Record the submission
            # without fabricating an AI score; the pipeline advances on submission.
            patch_payload = {
                "submitted": True,
                "score": None,
                "passed": None,
                "feedback": "Video screening submitted. No answer transcript captured for scoring.",
            }
        else:
            patch_payload = {
                "submitted": True,
                "score": scoring["score"],
                "passed": scoring["passed"],
                "feedback": scoring["feedback"],
                "key_strengths": scoring["key_strengths"],
                "weaknesses": scoring["weaknesses"],
            }

        await callback_client.post_callback(
            f"internal/applications/{application_id}/video-screening-result",
            patch_payload,
        )
        return scoring or {"submitted": True, "score": None}

    return await run_agent_job(
        agent_name="video_screening_agent",
        action="video_screening_scoring",
        job_input={"application_id": application_id, "response_count": len(job_data.get("responses") or [])},
        work=run,
        log_extra=log_extra,
    )
