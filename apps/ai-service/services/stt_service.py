import io
import logging
from typing import Tuple, Optional
from core.config import settings

logger = logging.getLogger("stt_service")


groq_client = None
if settings.groq_api_key and settings.groq_api_key != "your_groq_api_key_here":
    try:
        from groq import Groq
        groq_client = Groq(api_key=settings.groq_api_key)
        logger.info("Groq Whisper STT client initialized successfully")
    except Exception as e:
        logger.warning(f"Failed to initialize Groq client: {e}")


def transcribe_audio_bytes(audio_bytes: bytes, filename: str = "audio.webm") -> Tuple[str, Optional[float]]:
    """
    Transcribe audio bytes to text using Groq Whisper STT (whisper-large-v3-turbo).
    Returns a tuple of (transcript_text, confidence_score).

    The Whisper API does not expose a per-transcription confidence score, so the
    confidence is always None — a hardcoded 0.98 was a fabricated value and is
    never reported.
    """
    if not audio_bytes or len(audio_bytes) == 0:
        return "", None


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
                return transcript_text, None
        except Exception as e:
            logger.error(f"Groq Whisper transcription failed: {e}")




    logger.warning(f"Whisper STT unavailable for {len(audio_bytes)} bytes; returning empty transcript.")
    return "", None
