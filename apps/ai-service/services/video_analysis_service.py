import logging
import math
from typing import Dict, Any, List, Optional

logger = logging.getLogger("video_analysis_service")

EMOTIONS = ["confident", "focused", "neutral", "stressed", "confused", "hesitant"]


def analyze_frame_expression(
    image_base64: str = "",
    landmark_data: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Analyze single webcam frame image or landmark telemetry to compute facial emotion distribution,
    gaze direction, eye contact status, and instant engagement metrics.
    """
    if not image_base64 and not landmark_data:
        return {
            "success": False,
            "error": "Either image_base64 or landmark_data must be provided"
        }




    if not landmark_data:
        return {
            "success": True,
            "signal_available": False,
            "primary_emotion": None,
            "emotions_distribution": None,
            "gaze": {
                "eye_contact": None,
                "direction": "no_signal",
                "head_pose": None,
            },
            "engagement_score": None,
            "soft_skills_confidence": None,
        }




    yaw = float(landmark_data.get("yaw", 0.0))
    pitch = float(landmark_data.get("pitch", 0.0))
    roll = float(landmark_data.get("roll", 0.0))
    smile_ratio = float(landmark_data.get("smile_ratio", 0.2))
    eye_openness = float(landmark_data.get("eye_openness", 0.8))


    abs_yaw = abs(yaw)
    abs_pitch = abs(pitch)

    if abs_yaw <= 12.0 and abs_pitch <= 10.0:
        gaze_direction = "center"
        eye_contact = True
    elif yaw < -12.0:
        gaze_direction = "left"
        eye_contact = False
    elif yaw > 12.0:
        gaze_direction = "right"
        eye_contact = False
    elif pitch < -10.0:
        gaze_direction = "up"
        eye_contact = False
    else:
        gaze_direction = "down"
        eye_contact = False


    if smile_ratio > 0.4 and eye_contact:
        emotions_dist = {"confident": 0.55, "focused": 0.30, "neutral": 0.10, "stressed": 0.03, "confused": 0.01, "hesitant": 0.01}
        primary_emotion = "confident"
    elif eye_contact and eye_openness > 0.6:
        emotions_dist = {"focused": 0.60, "confident": 0.25, "neutral": 0.10, "stressed": 0.03, "confused": 0.01, "hesitant": 0.01}
        primary_emotion = "focused"
    elif not eye_contact and abs_yaw > 20.0:
        emotions_dist = {"hesitant": 0.45, "confused": 0.30, "stressed": 0.15, "neutral": 0.05, "focused": 0.03, "confident": 0.02}
        primary_emotion = "hesitant"
    elif eye_openness < 0.4:
        emotions_dist = {"stressed": 0.50, "hesitant": 0.25, "confused": 0.15, "neutral": 0.05, "focused": 0.03, "confident": 0.02}
        primary_emotion = "stressed"
    else:
        emotions_dist = {"neutral": 0.50, "focused": 0.30, "confident": 0.10, "stressed": 0.05, "confused": 0.03, "hesitant": 0.02}
        primary_emotion = "neutral"




    base_engagement = 85.0 if eye_contact else 55.0
    engagement_score = round(min(100.0, max(0.0, base_engagement - (abs_yaw * 1.2) + (smile_ratio * 15.0))), 1)
    soft_skills_confidence = round(min(100.0, max(0.0, (emotions_dist["confident"] * 40.0) + (emotions_dist["focused"] * 35.0) + (emotions_dist["neutral"] * 25.0) + (engagement_score * 0.2))), 1)


    return {
        "success": True,
        "primary_emotion": primary_emotion,
        "emotions_distribution": emotions_dist,
        "gaze": {
            "eye_contact": eye_contact,
            "direction": gaze_direction,
            "head_pose": {"pitch": round(pitch, 2), "yaw": round(yaw, 2), "roll": round(roll, 2)}
        },
        "engagement_score": engagement_score,
        "soft_skills_confidence": soft_skills_confidence,
    }


def analyze_video_session(frames: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Aggregate multi-frame interview video telemetry to calculate overall session statistics,
    emotion distribution trajectory, eye contact percentage, and focus stability score.
    """
    if not frames:
        return {
            "success": False,
            "error": "Frames list cannot be empty"
        }

    total_frames = len(frames)
    frame_results = []
    eye_contact_count = 0
    total_engagement = 0.0
    total_confidence = 0.0
    emotion_counts: Dict[str, int] = {e: 0 for e in EMOTIONS}
    off_screen_flags = 0
    no_signal_frames = 0

    for f in frames:
        img_b64 = f.get("image_base64", "")



        landmarks = f.get("landmark_data")
        if not landmarks:
            present = {
                key: f[key]
                for key in ("yaw", "pitch", "roll", "smile_ratio", "eye_openness")
                if f.get(key) is not None
            }
            landmarks = present or None

        analysis = analyze_frame_expression(img_b64, landmarks)
        if not analysis.get("success"):
            continue
        frame_results.append(analysis)
        if analysis.get("signal_available") is False:
            no_signal_frames += 1
            continue
        p_emotion = analysis.get("primary_emotion", "neutral")
        emotion_counts[p_emotion] = emotion_counts.get(p_emotion, 0) + 1

        if analysis.get("gaze", {}).get("eye_contact"):
            eye_contact_count += 1
        else:
            if abs(analysis.get("gaze", {}).get("head_pose", {}).get("yaw", 0.0)) > 20.0:
                off_screen_flags += 1

        total_engagement += analysis.get("engagement_score", 0.0)
        total_confidence += analysis.get("soft_skills_confidence", 0.0)


    num_valid = len(frame_results) - no_signal_frames
    if num_valid <= 0:
        return {
            "success": True,
            "total_frames_analyzed": total_frames,
            "session_summary": {
                "eye_contact_percentage": None,
                "average_engagement_score": None,
                "soft_skills_confidence_index": None,
                "focus_stability_score": None,
                "off_screen_gaze_events": off_screen_flags,
                "primary_dominant_emotion": None,
                "emotion_distribution_percentages": None,
            },
            "timeline_samples": [],
        }

    eye_contact_percentage = round((eye_contact_count / num_valid) * 100.0, 1)
    avg_engagement = round(total_engagement / num_valid, 1)
    avg_confidence = round(total_confidence / num_valid, 1)


    overall_emotion_percentages = {
        e: round((count / num_valid) * 100.0, 1) for e, count in emotion_counts.items()
    }


    focus_stability = round(min(100.0, max(0.0, eye_contact_percentage - (off_screen_flags * 5.0))), 1)

    return {
        "success": True,
        "total_frames_analyzed": total_frames,
        "session_summary": {
            "eye_contact_percentage": eye_contact_percentage,
            "average_engagement_score": avg_engagement,
            "soft_skills_confidence_index": avg_confidence,
            "focus_stability_score": focus_stability,
            "off_screen_gaze_events": off_screen_flags,
            "primary_dominant_emotion": max(overall_emotion_percentages, key=overall_emotion_percentages.get),
            "emotion_distribution_percentages": overall_emotion_percentages,
        },
        "timeline_samples": [
            {
                "frame_index": i * max(1, len(frame_results) // 10),
                "primary_emotion": fr.get("primary_emotion"),
                "engagement": fr.get("engagement_score"),
                "eye_contact": fr.get("gaze", {}).get("eye_contact")
            }
            for i, fr in enumerate(frame_results[::max(1, len(frame_results) // 10)])
        ][:10]
    }
