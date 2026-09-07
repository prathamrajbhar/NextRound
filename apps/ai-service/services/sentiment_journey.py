from typing import Any, Dict, List, Tuple
from services.sentiment_metrics import (
    IDEAL_WPM,
    PAUSE_DENSITY_NORM,
    _clamp_percent,
    _compute_timing_metrics,
)

WINDOW_SEC = 60.0

def _window_scores(metrics: Dict[str, float]) -> Tuple[int, int, int, str]:
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
