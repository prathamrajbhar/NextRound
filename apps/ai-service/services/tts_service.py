import base64
import logging
import re
from typing import AsyncGenerator, Dict, Any
import edge_tts

logger = logging.getLogger("tts_service")

DEFAULT_VOICE = "en-US-ChristopherNeural"


async def generate_tts_audio_bytes(text: str, voice: str = DEFAULT_VOICE) -> bytes:
    """
    Synthesize neural MP3 audio bytes for input text using Edge TTS.
    """
    if not text or not text.strip():
        return b""

    cleaned_text = text.strip()
    voice_name = voice or DEFAULT_VOICE

    try:
        communicate = edge_tts.Communicate(cleaned_text, voice_name)
        audio_buffer = bytearray()
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_buffer.extend(chunk["data"])
        return bytes(audio_buffer)
    except Exception as e:
        logger.error(f"Edge TTS synthesis failed for text length {len(text)}: {e}")
        return b""


async def generate_tts_audio_base64(text: str, voice: str = DEFAULT_VOICE) -> str:
    """
    Synthesize neural TTS and return data URL formatted Base64 string ('data:audio/mp3;base64,...').
    """
    audio_bytes = await generate_tts_audio_bytes(text, voice)
    if not audio_bytes:
        return ""
    b64_str = base64.b64encode(audio_bytes).decode("utf-8")
    return f"data:audio/mp3;base64,{b64_str}"


async def stream_sentence_tts(text: str, voice: str = DEFAULT_VOICE) -> AsyncGenerator[Dict[str, Any], None]:
    """
    Sentence-based streaming audio generator yielding chunked audio Base64 segments
    for sub-500ms real-time conversational voice interaction.
    """
    if not text or not text.strip():
        yield {"sentence": "", "audio": "", "is_final": True}
        return


    sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', text) if s.strip()]
    if not sentences:
        sentences = [text.strip()]

    total_sentences = len(sentences)
    for idx, sentence in enumerate(sentences):
        audio_b64 = await generate_tts_audio_base64(sentence, voice)
        is_final = (idx == total_sentences - 1)
        yield {
            "index": idx,
            "sentence": sentence,
            "audio": audio_b64,
            "is_final": is_final,
        }
