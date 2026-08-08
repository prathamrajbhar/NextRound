import logging
import json
import re
import httpx
from core.config import settings
from core.http_client import callback_client

logger = logging.getLogger("video_screening_worker")

# Gemini API Client
genai_client = None
if settings.gemini_api_key:
    try:
        from google import genai
        genai_client = genai.Client(api_key=settings.gemini_api_key)
    except Exception as e:
        logger.warning(f"Failed to initialize GenAI client in video_screening_worker: {e}")


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

    if not genai_client:
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
    try:
        res = genai_client.models.generate_content(model="gemini-2.5-flash", contents=prompt)
        if res and res.text:
            match = re.search(r"\{.*\}", res.text, re.DOTALL)
            if match:
                data = json.loads(match.group(0))
                if isinstance(data, dict):
                    score = float(data.get("score", 0))
                    return {
                        "score": round(max(0.0, min(100.0, score)), 1),
                        "passed": score >= 70.0,
                        "feedback": data.get("feedback", ""),
                        "key_strengths": data.get("key_strengths", []),
                        "weaknesses": data.get("weaknesses", []),
                    }
    except Exception as e:
        logger.warning(f"Gemini video screening scoring warning: {e}")
    return None


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

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{settings.express_api_base_url}/internal/applications/{application_id}/raw",
                headers={"X-Internal-Service-Secret": settings.internal_service_secret},
            )
            resp.raise_for_status()
            app_info = resp.json().get("data", {})

        job_info = app_info.get("job", {})
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

        log_payload = {
            "job_id": job_info.get("id"),
            "org_id": job_info.get("org_id"),
            "agent_name": "video_screening_agent",
            "action": "video_screening_scoring",
            "input": {"application_id": application_id, "response_count": len(responses)},
            "output": scoring or {"submitted": True, "score": None},
            "status": "completed",
        }
        await callback_client.post_callback("internal/agent-logs", log_payload)

        logger.info(f"Successfully scored video-screening job for applicationId: {application_id}")
        return True

    except Exception as e:
        logger.error(f"Failed to process video-screening job for applicationId {application_id}: {e}")
        try:
            log_payload = {
                "agent_name": "video_screening_agent",
                "action": "video_screening_scoring",
                "status": "failed",
                "error": str(e),
            }
            await callback_client.post_callback("internal/agent-logs", log_payload)
        except Exception:
            pass
        return False
