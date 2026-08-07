import logging
import json
import re
from typing import Dict, Any, List
from core.config import settings

logger = logging.getLogger("sentiment_service")

# Initialize Gemini Client if API Key is configured
genai_client = None
if settings.gemini_api_key:
    try:
        from google import genai
        genai_client = genai.Client(api_key=settings.gemini_api_key)
    except Exception as e:
        logger.warning(f"Failed to initialize GenAI client in sentiment_service: {e}")


# ML_BYPASS: audio prosody/pitch analysis — upgrade to pyAudioAnalysis or wav2vec2 when available
def analyze_interview_sentiment(interview_id: str, transcript: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Analyze voice interview transcript for sentiment, emotional trajectory, and stress biomarkers.
    Uses Gemini API. Raises RuntimeError when analysis is unavailable — no fabricated reports.
    """
    logger.info(f"Analyzing sentiment and stress biomarkers for interview: {interview_id}")

    if not transcript or not isinstance(transcript, list) or len(transcript) == 0:
        raise ValueError("No transcript available for sentiment analysis.")

    if not genai_client:
        raise RuntimeError("Sentiment analysis requires a configured Gemini client. No fabricated report is returned.")

    prompt = (
        f"You are an expert speech sentiment and psychological stress analyser.\n"
        f"Analyze the following interview transcript for tone, emotional journey, and stress peak moments:\n"
        f"{json.dumps(transcript)}\n\n"
        f"Return JSON format ONLY:\n"
        f"{{\n"
        f'  "overallTone": "confident" | "enthusiastic" | "neutral" | "anxious",\n'
        f'  "overallStressLevel": "low" | "medium" | "high",\n'
        f'  "emotionalJourney": [\n'
        f'    {{"turnNumber": int, "speaker": str, "text": str, "sentiment": str, "confidence": float, "stressIndicator": int}}\n'
        f"  ],\n"
        f'  "stressPeakMoments": [\n'
        f'    {{"turnIndex": int, "questionText": str, "candidateResponseSnippet": str, "stressScore": int, "reason": str}}\n'
        f"  ],\n"
        f'  "summaryNarrative": str\n'
        f"}}\n"
    )

    try:
        res = genai_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        if res and res.text:
            match = re.search(r"\{.*\}", res.text, re.DOTALL)
            if match:
                parsed = json.loads(match.group(0))
                parsed["interviewId"] = interview_id
                return parsed
    except Exception as e:
        logger.warning(f"GenAI sentiment analysis warning: {e}")

    raise RuntimeError("Sentiment analysis failed to produce a report. No fabricated sentiment is returned.")
