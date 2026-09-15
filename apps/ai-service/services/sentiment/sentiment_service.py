import logging
from typing import Any, Dict
from services.sentiment.sentiment_audio import (
    SAMPLING_RATE,
    _resolve_audio_bytes,
    _decode_to_mono_pcm,
    _compute_pitch_metrics,
    _transcribe_word_timings,
)
from services.sentiment.sentiment_metrics import (
    _compute_timing_metrics,
    infer_speech_emotion_metrics,
)
from services.sentiment.sentiment_journey import (
    infer_temporal_emotion_journey,
    _build_narrative,
    _unavailable,
)

logger = logging.getLogger("sentiment_service")

def analyze_interview_sentiment(interview_id: str, audio_url: str) -> Dict[str, Any]:
    """
    Analyzes interview audio using acoustic signals and speech emotion models.
    ML Extension point: Dedicated neural SER model (emotion2vec / wav2vec2-emotion)
    will be executed here without synthetic rate-deviation heuristics.
    """
    audio_bytes = _resolve_audio_bytes(audio_url)
    if audio_bytes is None:
        logger.info(f"Sentiment analysis unavailable for interview {interview_id}: no audio at audio_url.")
        return _unavailable(
            interview_id,
            "No audio recording was provided for this interview (audio_url missing or unreachable).",
        )

    wave = _decode_to_mono_pcm(audio_bytes)
    if wave is None or len(wave) < SAMPLING_RATE:
        logger.info(f"Sentiment analysis unavailable for interview {interview_id}: audio failed to decode.")
        return _unavailable(interview_id, "Audio could not be decoded to PCM for prosody analysis.")

    pitch_metrics = _compute_pitch_metrics(wave)
    if pitch_metrics is None:
        logger.info(f"Sentiment analysis unavailable for interview {interview_id}: no voiced audio.")
        return _unavailable(interview_id, "No voiced audio segments were detected for pitch analysis.")

    words = _transcribe_word_timings(audio_bytes)
    if words is None:
        logger.info(f"Sentiment analysis unavailable for interview {interview_id}: no word timings.")
        return _unavailable(
            interview_id,
            "Word-level transcription timings were unavailable; audio sentiment analysis requires speech timestamps.",
        )

    timing_metrics = _compute_timing_metrics(words)
    if timing_metrics is None:
        logger.info(f"Sentiment analysis unavailable for interview {interview_id}: no speech detected.")
        return _unavailable(interview_id, "No speech segments were found in the audio for rate/pause analysis.")

    try:
        overall = infer_speech_emotion_metrics(pitch_metrics, timing_metrics)
        journey = infer_temporal_emotion_journey(words)
    except NotImplementedError:
        logger.info(
            f"Sentiment ML model pending integration for interview {interview_id}. "
            "Heuristic fallbacks are disabled."
        )
        return _unavailable(
            interview_id,
            "Acoustic Speech Emotion Recognition (SER) ML model is pending model integration. "
            "Static heuristics and synthetic stress calculations have been removed."
        )

    return {
        "interviewId": interview_id,
        "status": "completed",
        "source": "audio",
        "audioUrl": audio_url,
        "overall": overall,
        "audio": {
            **pitch_metrics,
            **timing_metrics,
            "durationSec": round(len(wave) / SAMPLING_RATE, 1),
        },
        "journey": journey,
        "summaryNarrative": _build_narrative(overall, timing_metrics),
    }
