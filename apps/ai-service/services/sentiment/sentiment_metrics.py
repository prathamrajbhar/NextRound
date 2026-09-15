from typing import Any, Dict, List, Optional

def _compute_timing_metrics(words: List[Dict[str, Any]]) -> Optional[Dict[str, float]]:
    if not words:
        return None
    start = float(words[0]["start"])
    end = float(words[-1]["end"])
    speech_duration = max(end - start, 1.0)

    pauses = [
        float(nxt["start"]) - float(prev["end"])
        for prev, nxt in zip(words, words[1:])
        if float(nxt["start"]) - float(prev["end"]) > 0.6
    ]
    pauses_per_min = len(pauses) / (speech_duration / 60.0)
    avg_pause = (sum(pauses) / len(pauses)) if pauses else 0.0
    long_pause_count = sum(1 for pause in pauses if pause > 3.0)

    return {
        "speakingRateWpm": round(len(words) / (speech_duration / 60.0), 1),
        "avgPauseDurationSec": round(avg_pause, 2),
        "pausesPerMinute": round(pauses_per_min, 1),
        "longPauseCount": long_pause_count,
        "speechDurationSec": round(speech_duration, 1),
    }

def infer_speech_emotion_metrics(
    pitch_metrics: Optional[Dict[str, float]] = None,
    timing_metrics: Optional[Dict[str, float]] = None,
) -> Dict[str, Any]:
    """
    ML Extension Point: Speech Emotion Recognition (SER) / Acoustic Stress Model.
    Integration point for dedicated neural model (e.g. emotion2vec+, wav2vec2-emotion).
    Synthetic rate-deviation formulas and static heuristics have been removed.
    """
    raise NotImplementedError(
        "Acoustic Speech Emotion Recognition (SER) ML model is pending model integration. "
        "Static heuristics and synthetic stress formulas have been removed."
    )
