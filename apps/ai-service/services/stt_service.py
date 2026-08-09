import io
import logging
from typing import Tuple
from core.config import settings

logger = logging.getLogger("stt_service")

# Initialize Groq client if API key is configured
groq_client = None
if settings.groq_api_key and settings.groq_api_key != "your_groq_api_key_here":
    try:
        from groq import Groq
        groq_client = Groq(api_key=settings.groq_api_key)
        logger.info("Groq Whisper STT client initialized successfully")
    except Exception as e:
        logger.warning(f"Failed to initialize Groq client: {e}")


def transcribe_audio_bytes(audio_bytes: bytes, filename: str = "audio.webm") -> Tuple[str, float]:
    """
    Transcribe audio bytes to text using Groq Whisper STT (whisper-large-v3-turbo).
    Returns a tuple of (transcript_text, confidence_score).
    """
    if not audio_bytes or len(audio_bytes) == 0:
        return "", 0.0

    # 1. Primary: Groq Whisper STT API
    if groq_client:
        try:
            audio_file = (filename, io.BytesIO(audio_bytes))
            transcription = groq_client.audio.transcriptions.create(
                file=audio_file,
                model="whisper-large-v3-turbo",
                response_format="json",
                temperature=0.0,
            )
            transcript_text = getattr(transcription, "text", "").strip()
            if transcript_text:
                logger.info(f"Groq Whisper transcribed {len(audio_bytes)} bytes -> {len(transcript_text)} chars")
                return transcript_text, 0.98
        except Exception as e:
            logger.error(f"Groq Whisper transcription failed: {e}")

    # 2. Fallback: STT unavailable/failed — never fabricate a candidate response.
    # Returning an empty transcript keeps downstream evaluation honest instead of
    # scoring a synthetic sentence as if the candidate spoke it.
    logger.warning(f"Whisper STT unavailable for {len(audio_bytes)} bytes; returning empty transcript.")
    return "", 0.0
