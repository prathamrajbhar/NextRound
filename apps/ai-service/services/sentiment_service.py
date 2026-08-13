import logging
from typing import Dict, Any, List

logger = logging.getLogger("sentiment_service")





def analyze_interview_sentiment(interview_id: str, transcript: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Analyze voice interview transcript for sentiment, emotional trajectory, and stress biomarkers.

    Returns an explicit ``status: "unavailable"`` result with no fabricated metrics until the
    audio-prosody ML pipeline ships. Callers must skip persisting a sentiment report when the
    status is unavailable.
    """
    logger.info(
        f"Sentiment analysis unavailable for interview: {interview_id} "
        "(audio-prosody ML pipeline not built; no metrics fabricated)"
    )
    return {
        "interviewId": interview_id,
        "status": "unavailable",
        "reason": "Audio prosody/pitch ML pipeline is not available yet. No sentiment metrics were generated.",
    }
