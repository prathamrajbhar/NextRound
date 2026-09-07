from typing import Any, Dict, List, Optional

IDEAL_WPM = 135.0
RATE_DEVIATION_WEIGHT = 0.45
PAUSE_DENSITY_WEIGHT = 0.35
TREMOR_WEIGHT = 0.20
PAUSE_THRESHOLD_SEC = 0.6
LONG_PAUSE_SEC = 3.0
PAUSE_DENSITY_NORM = 12.0

def _clamp_percent(value: float) -> int:
    return int(round(max(0.0, min(value, 100.0))))

def _compute_timing_metrics(words: List[Dict[str, Any]]) -> Optional[Dict[str, float]]:
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

def _derive_overall(
    pitch: Dict[str, float], timing: Dict[str, float]
) -> Dict[str, Any]:
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
