import pytest
from fastapi.testclient import TestClient
from services.video_analysis_service import (
    analyze_frame_expression,
    analyze_video_session
)


def test_analyze_frame_expression_landmarks():
    """Verify facial emotion classification and gaze tracking from landmark telemetry."""
    landmarks = {
        "yaw": 2.0,
        "pitch": -1.0,
        "roll": 0.0,
        "smile_ratio": 0.45,
        "eye_openness": 0.85
    }

    res = analyze_frame_expression(landmark_data=landmarks)
    assert res["success"] is True
    assert res["primary_emotion"] == "confident"
    assert res["gaze"]["eye_contact"] is True
    assert res["gaze"]["direction"] == "center"
    assert res["engagement_score"] > 80.0
    assert res["soft_skills_confidence"] > 50.0


def test_analyze_frame_expression_off_center_gaze():
    """Verify gaze tracking flags off-screen gaze when yaw exceeds threshold."""
    landmarks = {
        "yaw": 25.0,
        "pitch": 0.0,
        "roll": 0.0,
        "smile_ratio": 0.1,
        "eye_openness": 0.7
    }

    res = analyze_frame_expression(landmark_data=landmarks)
    assert res["success"] is True
    assert res["gaze"]["eye_contact"] is False
    assert res["gaze"]["direction"] == "right"
    assert res["primary_emotion"] == "hesitant"


def test_analyze_video_session():
    """Verify multi-frame session aggregation and timeline analytics generation."""
    frames = [
        {"yaw": 0.0, "pitch": 0.0, "smile_ratio": 0.4, "eye_openness": 0.8},
        {"yaw": 2.0, "pitch": -1.0, "smile_ratio": 0.5, "eye_openness": 0.9},
        {"yaw": -22.0, "pitch": 0.0, "smile_ratio": 0.1, "eye_openness": 0.7},
        {"yaw": 1.0, "pitch": 0.0, "smile_ratio": 0.3, "eye_openness": 0.85},
    ]

    session_res = analyze_video_session(frames)
    assert session_res["success"] is True
    assert session_res["total_frames_analyzed"] == 4
    summary = session_res["session_summary"]
    assert summary["eye_contact_percentage"] == 75.0
    assert summary["average_engagement_score"] > 50.0
    assert summary["soft_skills_confidence_index"] > 40.0
    assert len(session_res["timeline_samples"]) > 0


def test_video_analysis_endpoints():
    """Test REST API endpoints POST /api/v1/ai/video/analyze-frame and /analyze-session."""
    from main import app
    client = TestClient(app)

    # 1. Single frame
    f_resp = client.post(
        "/api/v1/ai/video/analyze-frame",
        json={
            "landmark_data": {
                "yaw": 0.0,
                "pitch": 0.0,
                "smile_ratio": 0.4,
                "eye_openness": 0.8
            }
        }
    )
    assert f_resp.status_code == 200
    f_data = f_resp.json()
    assert f_data["success"] is True
    assert "primary_emotion" in f_data
    assert f_data["gaze"]["eye_contact"] is True

    # 2. Full session
    s_resp = client.post(
        "/api/v1/ai/video/analyze-session",
        json={
            "frames": [
                {"yaw": 0.0, "pitch": 0.0, "smile_ratio": 0.4, "eye_openness": 0.8},
                {"yaw": 1.0, "pitch": 0.0, "smile_ratio": 0.3, "eye_openness": 0.85}
            ]
        }
    )
    assert s_resp.status_code == 200
    s_data = s_resp.json()
    assert s_data["success"] is True
    assert s_data["session_summary"]["eye_contact_percentage"] == 100.0
