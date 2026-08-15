import io
import logging
import os
import subprocess
from typing import Any, Dict, List, Optional, Tuple

import httpx
import numpy as np

from core.config import settings

logger = logging.getLogger("sentiment_service")

SAMPLING_RATE = 16000
FRAME_SIZE = 1024
HOP_SIZE = 512
PITCH_MIN_HZ = 75.0
PITCH_MAX_HZ = 400.0
IDEAL_WPM = 135.0
RATE_DEVIATION_WEIGHT = 0.45
PAUSE_DENSITY_WEIGHT = 0.35
TREMOR_WEIGHT = 0.20
PAUSE_THRESHOLD_SEC = 0.6
LONG_PAUSE_SEC = 3.0
PAUSE_DENSITY_NORM = 12.0
WINDOW_SEC = 60.0
VOICED_RMS_THRESHOLD = 0.01
MIN_VOICED_FRAMES = 5


def _resolve_audio_bytes(audio_url: str) -> Optional[bytes]:
    """Fetch the interview audio from ``audio_url`` (HTTP(S) URL or local upload path)."""
    if not audio_url or not audio_url.strip():
        return None

    if audio_url.startswith(("http://", "https://")):
        try:
            response = httpx.get(audio_url, timeout=60)
            response.raise_for_status()
            return response.content
        except Exception as err:
            logger.error(f"Failed to fetch interview audio from URL: {err}")
            return None

    path = audio_url
    if not os.path.isabs(path):
        path = os.path.join(settings.upload_dir, path)
    try:
        with open(path, "rb") as audio_file:
            return audio_file.read()
    except Exception as err:
        logger.error(f"Failed to read interview audio file {path}: {err}")
        return None


def _decode_to_mono_pcm(audio_bytes: bytes) -> Optional[np.ndarray]:
    """Decode audio bytes into mono 16 kHz float32 PCM via ffmpeg."""
    if not audio_bytes:
        return None
    try:
        result = subprocess.run(
            [
                "ffmpeg",
                "-y",
                "-i",
                "pipe:0",
                "-f",
                "s16le",
                "-ac",
                "1",
                "-ar",
                str(SAMPLING_RATE),
                "pipe:1",
            ],
            input=audio_bytes,
            capture_output=True,
            timeout=120,
        )
    except Exception as err:
        logger.error(f"ffmpeg decode failed: {err}")
        return None
    if result.returncode != 0 or not result.stdout:
        logger.error(f"ffmpeg returned {result.returncode}: {result.stderr.decode(errors='replace')[-500:]}")
        return None
    pcm = np.frombuffer(result.stdout, dtype=np.int16)
    return pcm.astype(np.float32) / 32768.0


def _estimate_f0(frame: np.ndarray, sample_rate: int) -> Optional[float]:
    """Estimate fundamental frequency (Hz) of a single voiced frame via autocorrelation."""
    centered = frame - frame.mean()
    power = float(np.dot(centered, centered))
    if power <= 0.0:
        return None
    autocorr = np.correlate(centered, centered, mode="full")[len(centered) - 1:]
    autocorr = autocorr / autocorr[0]
    min_lag = int(sample_rate / PITCH_MAX_HZ)
    max_lag = int(sample_rate / PITCH_MIN_HZ)
    if min_lag >= len(autocorr) - 1 or max_lag > len(autocorr) - 1:
        return None
    segment = autocorr[min_lag:max_lag + 1]
    peak_idx = int(np.argmax(segment))
    peak_value = float(segment[peak_idx])
    if peak_value < 0.35:
        return None
    lag = min_lag + peak_idx
    if lag <= 0:
        return None
    return sample_rate / lag


def _compute_pitch_metrics(wave: np.ndarray) -> Optional[Dict[str, float]]:
    """Compute pitch mean/std-dev, tremor and steady percentages from raw PCM."""
    if wave is None or len(wave) < FRAME_SIZE:
        return None

    f0s: List[float] = []
    total_frames = 0
    for start in range(0, len(wave) - FRAME_SIZE, HOP_SIZE):
        frame = wave[start:start + FRAME_SIZE]
        total_frames += 1
        rms = float(np.sqrt(np.mean(frame ** 2)))
        if rms < VOICED_RMS_THRESHOLD:
            continue
        f0 = _estimate_f0(frame, SAMPLING_RATE)
        if f0 is not None:
            f0s.append(f0)

    if len(f0s) < MIN_VOICED_FRAMES:
        return None

    f0_array = np.array(f0s)
    jumps = np.abs(np.diff(f0_array)) / np.maximum(f0_array[:-1], 1e-6)
    tremor_frames = int(np.sum(jumps > 0.08))
    tremor_percent = round(tremor_frames / max(len(f0_array) - 1, 1) * 100)

    return {
        "pitchMeanHz": round(float(np.mean(f0_array)), 1),
        "pitchStdDevHz": round(float(np.std(f0_array)), 1),
        "tremorPercent": tremor_percent,
        "steadyPercent": 100 - tremor_percent,
        "voicedRatio": round(len(f0_array) / max(total_frames, 1), 3),
    }


def _compute_timing_metrics(words: List[Dict[str, Any]]) -> Optional[Dict[str, float]]:
    """Derive speaking rate and pause metrics from word-level timestamps."""
    if not words:
        return None
    start = float(words[0]["start"])
    end = float(words[-1]["end"])
    speech_duration = max(end - start, 1.0)

    pauses = [
        float(nxt["start"]) - float(prev["end"])
        for prev, nxt in zip(words, words[1:])
        if float(nxt["start"]) - float(prev["end"]) > PAUSE_THRESHOLD_SEC
    ]
    pauses_per_min = len(pauses) / (speech_duration / 60.0)
    avg_pause = (sum(pauses) / len(pauses)) if pauses else 0.0
    long_pause_count = sum(1 for pause in pauses if pause > LONG_PAUSE_SEC)

    return {
        "speakingRateWpm": round(len(words) / (speech_duration / 60.0), 1),
        "avgPauseDurationSec": round(avg_pause, 2),
        "pausesPerMinute": round(pauses_per_min, 1),
        "longPauseCount": long_pause_count,
        "speechDurationSec": round(speech_duration, 1),
    }


def _clamp_percent(value: float) -> int:
    return int(round(max(0.0, min(value, 100.0))))


def _derive_overall(
    pitch: Dict[str, float], timing: Dict[str, float]
) -> Dict[str, Any]:
    """Combine pitch and timing metrics into stress/confidence/clarity/tone scores."""
    rate_deviation = abs(timing["speakingRateWpm"] - IDEAL_WPM) / IDEAL_WPM
    pause_density = min(timing["pausesPerMinute"] / PAUSE_DENSITY_NORM, 1.0)
    tremor_fraction = pitch.get("tremorPercent", 0.0) / 100.0

    stress = (
        rate_deviation * (RATE_DEVIATION_WEIGHT * 100)
        + pause_density * (PAUSE_DENSITY_WEIGHT * 100)
        + tremor_fraction * (TREMOR_WEIGHT * 100)
    )
    stress_score = _clamp_percent(stress)
    confidence_score = 100 - stress_score
    clarity_score = _clamp_percent(
        100 - pause_density * 55 - tremor_fraction * 45
    )

    if stress_score < 20:
        tone = "calm"
    elif stress_score < 40:
        tone = "steady"
    elif stress_score < 65:
        tone = "anxious"
    else:
        tone = "stressed"

    return {
        "stressScore": stress_score,
        "confidenceScore": confidence_score,
        "clarityScore": clarity_score,
        "tone": tone,
    }


def _window_scores(metrics: Dict[str, float]) -> Tuple[int, int, int, str]:
    """Per-window stress/confidence/hesitation/tone-label from audio timing features."""
    rate_deviation = abs(metrics["speakingRateWpm"] - IDEAL_WPM) / IDEAL_WPM
    pause_density = min(metrics["pausesPerMinute"] / PAUSE_DENSITY_NORM, 1.0)
    stress = _clamp_percent(rate_deviation * 55 + pause_density * 45)
    confidence = 100 - stress
    hesitation = _clamp_percent(pause_density * 100)

    if confidence >= 75:
        label = "Confident"
    elif stress >= 65:
        label = "Stressed"
    elif hesitation >= 45:
        label = "Hesitant"
    else:
        label = "Neutral"
    return stress, confidence, hesitation, label


def _format_time(seconds: float) -> str:
    minutes = int(seconds // 60)
    secs = int(seconds % 60)
    return f"{minutes:02d}:{secs:02d}"


def _build_journey(words: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Partition word timings into time windows and score each audio window."""
    if not words:
        return []

    end_time = float(words[-1]["end"])
    journey: List[Dict[str, Any]] = []
    window_start = 0.0
    while window_start < end_time:
        window_end = min(window_start + WINDOW_SEC, end_time)
        window_words = [
            word for word in words
            if float(word["start"]) >= window_start and float(word["start"]) < window_end
        ]
        if len(window_words) >= 2:
            metrics = _compute_timing_metrics(window_words)
            if metrics is not None:
                stress, confidence, hesitation, label = _window_scores(metrics)
                journey.append({
                    "timeLabel": _format_time(window_start),
                    "minute": int(window_start // 60),
                    "confidence": confidence,
                    "stress": stress,
                    "hesitation": hesitation,
                    "emotionLabel": label,
                })
        window_start += WINDOW_SEC
    return journey


def _build_narrative(overall: Dict[str, Any], timing: Dict[str, float]) -> str:
    return (
        f"Audio prosody analysis of the candidate's voice detected a "
        f"stress score of {overall['stressScore']}/100 and confidence of "
        f"{overall['confidenceScore']}/100. Speech rate averaged "
        f"{timing['speakingRateWpm']} WPM with {timing['pausesPerMinute']} pauses/min "
        f"({timing['longPauseCount']} long pauses), giving an overall tone of "
        f"{overall['tone']}."
    )


def _unavailable(interview_id: str, reason: str) -> Dict[str, Any]:
    return {
        "interviewId": interview_id,
        "status": "unavailable",
        "source": "audio",
        "reason": reason,
    }


def _transcribe_word_timings(
    audio_bytes: bytes, filename: str = "interview_audio.webm"
) -> Optional[List[Dict[str, Any]]]:
    """Transcribe audio to word-level timestamps (Whisper) for rate/pause analysis."""
    if not settings.groq_api_key or settings.groq_api_key == "your_groq_api_key_here":
        return None
    try:
        from groq import Groq

        client = Groq(api_key=settings.groq_api_key)
        transcription = client.audio.transcriptions.create(
            file=(filename, io.BytesIO(audio_bytes)),
            model="whisper-large-v3-turbo",
            response_format="verbose_json",
            timestamp_granularities=["word"],
            temperature=0.0,
        )
        words = getattr(transcription, "words", None)
        if not words:
            return None
        return [
            {
                "word": getattr(word, "word", ""),
                "start": float(getattr(word, "start", 0.0)),
                "end": float(getattr(word, "end", 0.0)),
            }
            for word in words
        ]
    except Exception as err:
        logger.error(f"Whisper word-timing transcription failed: {err}")
        return None


def analyze_interview_sentiment(interview_id: str, audio_url: str) -> Dict[str, Any]:
    """Analyze an interview recording for sentiment strictly from audio-derived metrics.

    Derives tone, pitch, speaking rate, pauses, stress, and confidence from the audio
    file referenced by ``audio_url`` (pitch via autocorrelation on decoded PCM, rate and
    pause features via word-level transcription timings). Never inspects the interview
    transcript. Returns ``status: "unavailable"`` with no fabricated metrics when the
    audio cannot be fetched, decoded, or contains no analyzable speech.
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

    overall = _derive_overall(pitch_metrics, timing_metrics)
    journey = _build_journey(words)

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
