import logging
import json
import re
from typing import Dict, Any
from core.config import settings
from core.http_client import callback_client

logger = logging.getLogger("mock_worker")

genai_client = None
if settings.gemini_api_key:
    try:
        from google import genai
        genai_client = genai.Client(api_key=settings.gemini_api_key)
    except Exception as e:
        logger.warning(f"Failed to initialize GenAI client in mock_worker: {e}")


async def process_mock_job(job_data: dict) -> bool:
    """
    Process Mock Interview evaluation job:
    1. Extract session_id, candidate_id, transcript, topic, difficulty.
    2. Compute comprehensive STAR feedback report and score via Gemini API.
    3. Call back Express internal endpoint /internal/mock/sessions/:id/feedback.
    """
    session_id = job_data.get("sessionId")
    if not session_id:
        logger.error("Missing sessionId in mock job payload.")
        return False

    logger.info(f"Processing mock evaluation job for session {session_id}")

    transcript = job_data.get("transcript") or []
    topic = job_data.get("topic", "System Design & Architecture")
    difficulty = job_data.get("difficulty", "medium")

    if not genai_client or not transcript:
        logger.error(f"No Gemini client or transcript available for mock evaluation of session {session_id}. Failing without fabricated feedback.")
        return False

    feedback: Dict[str, Any] = {}
    try:
        prompt = (
            f"Analyze this candidate mock interview transcript.\n"
            f"Topic: {topic} | Difficulty: {difficulty}\n"
            f"Transcript: {json.dumps(transcript)}\n\n"
            f"Return JSON format:\n"
            f"{{\n"
            f"  \"overallScore\": float (0-100),\n"
            f"  \"rubricScores\": {{\"clarity\": float, \"depth\": float, \"examples\": float, \"technicalAccuracy\": float}},\n"
            f"  \"strengths\": [str],\n"
            f"  \"growthAreas\": [str],\n"
            f"  \"starAnalysis\": {{\"situation\": str, \"task\": str, \"action\": str, \"result\": str}},\n"
            f"  \"recommendedPrep\": [str]\n"
            f"}}"
        )
        res = genai_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        if res and res.text:
            match = re.search(r"\{.*\}", res.text, re.DOTALL)
            if match:
                feedback = json.loads(match.group(0))
    except Exception as e:
        logger.warning(f"GenAI mock worker evaluation warning: {e}")
        return False

    if not feedback:
        logger.error(f"GenAI returned no usable mock evaluation for session {session_id}. No fabricated fallback provided.")
        return False

    score = int(feedback.get("overallScore", 0))

    try:
        response = await callback_client.patch(
            f"/internal/mock/sessions/{session_id}/feedback",
            json={
                "score": score,
                "feedback": feedback,
                "status": "completed",
            }
        )
        if response.status_code in (200, 201):
            logger.info(f"Successfully posted mock feedback for session {session_id}")
            return True
        else:
            logger.error(f"Failed to post mock feedback for session {session_id}: status {response.status_code}")
            return False
    except Exception as e:
        logger.error(f"Callback error in mock_worker for session {session_id}: {e}")
        return False
