from typing import Any, Dict, List, Optional

def _format_time(seconds: float) -> str:
    minutes = int(seconds // 60)
    secs = int(seconds % 60)
    return f"{minutes:02d}:{secs:02d}"

def infer_temporal_emotion_journey(
    words: List[Dict[str, Any]],
    window_sec: float = 60.0
) -> List[Dict[str, Any]]:
    """
    ML Extension Point: Temporal Speech Emotion Recognition (SER) Timeline.
    Integration point for sequence-based acoustic emotion prediction.
    Static WPM-deviation heuristics and arbitrary score thresholds have been removed.
    """
    raise NotImplementedError(
        "Temporal Speech Emotion Recognition (SER) model is pending model integration. "
        "Static heuristics and synthetic journey calculations have been removed."
    )

def _build_narrative(overall: Dict[str, Any], timing: Dict[str, float]) -> str:
    return (
        f"Audio speech rate averaged {timing.get('speakingRateWpm', 0)} WPM with "
        f"{timing.get('pausesPerMinute', 0)} pauses/min "
        f"({timing.get('longPauseCount', 0)} long pauses)."
    )

def _unavailable(interview_id: str, reason: str) -> Dict[str, Any]:
    return {
        "interviewId": interview_id,
        "status": "unavailable",
        "source": "audio",
        "reason": reason,
    }
