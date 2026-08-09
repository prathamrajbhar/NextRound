import json
import logging
from services.llm_service import generate_text, extract_json_object
from workers.worker_base import post_internal

logger = logging.getLogger("mock_worker")


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
    if not transcript:
        logger.error(f"No transcript available for mock evaluation of session {session_id}. Failing without fabricated feedback.")
        return False

    topic = job_data.get("topic", "System Design & Architecture")
    difficulty = job_data.get("difficulty", "medium")

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
    feedback = extract_json_object(generate_text(prompt))

    if not feedback:
        logger.error(f"GenAI returned no usable mock evaluation for session {session_id}. No fabricated fallback provided.")
        return False

    score = int(feedback.get("overallScore", 0))
    return await post_internal(
        "PATCH",
        f"/internal/mock/sessions/{session_id}/feedback",
        {"score": score, "feedback": feedback, "status": "completed"},
        context=f"mock feedback for session {session_id}",
    )
