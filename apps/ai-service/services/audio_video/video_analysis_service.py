import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger("video_analysis_service")

EMOTIONS = ["confident", "focused", "neutral", "stressed", "confused", "hesitant"]

def analyze_frame_expression(
    image_base64: str = "",
    landmark_data: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    ML Extension Point: Facial Emotion Recognition (FER) & Gaze Estimation.
    Integration point for dedicated deep learning model (e.g. AffectNet / MediaPipe Action Units classifier).
    Static heuristics, hardcoded angle thresholds, and mock fallbacks have been removed.
    """
    if not image_base64 and not landmark_data:
        return {
            "success": False,
            "error": "Either image_base64 or landmark_data must be provided"
        }

    raise NotImplementedError(
        "Facial expression and gaze ML model is pending model integration. "
        "Static heuristics and fallbacks have been disabled."
    )

def analyze_video_session(frames: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    ML Extension Point: Video Session Aggregation & Affect Temporal Modeling.
    Integration point for sequence-based affect analysis.
    Static heuristics and mock fallbacks have been removed.
    """
    if not frames:
        return {
            "success": False,
            "error": "Frames list cannot be empty"
        }

    raise NotImplementedError(
        "Video session sequence ML model is pending model integration. "
        "Static heuristics and fallbacks have been disabled."
    )

