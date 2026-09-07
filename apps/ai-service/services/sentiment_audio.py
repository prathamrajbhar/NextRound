import io
import logging
import subprocess
from typing import Any, Dict, List, Optional
import httpx
import numpy as np
from core.config import settings

logger = logging.getLogger("sentiment_audio")

SAMPLING_RATE = 16000
FRAME_SIZE = 1024
HOP_SIZE = 512
PITCH_MIN_HZ = 75.0
PITCH_MAX_HZ = 400.0
VOICED_RMS_THRESHOLD = 0.01
MIN_VOICED_FRAMES = 5

def _resolve_audio_bytes(audio_url: str) -> Optional[bytes]:
    if not audio_url or not audio_url.strip():
        return None

    if not audio_url.startswith(("http://", "https://")):
        logger.error(f"Local audio fallback is disabled. Invalid audio URL: {audio_url}")
        return None

    try:
        response = httpx.get(audio_url, timeout=60)
        response.raise_for_status()
        return response.content
    except Exception as err:
        logger.error(f"Failed to fetch interview audio from URL: {err}")
        return None

def _decode_to_mono_pcm(audio_bytes: bytes) -> Optional[np.ndarray]:
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

def _transcribe_word_timings(
    audio_bytes: bytes, filename: str = "interview_audio.webm"
) -> Optional[List[Dict[str, Any]]]:
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
