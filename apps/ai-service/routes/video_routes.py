import logging
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from services.video_analysis_service import (
    analyze_frame_expression,
    analyze_video_session
)

logger = logging.getLogger("video_routes")

video_analysis_router = APIRouter(prefix="/api/v1/ai/video", tags=["video-expression-analysis"])


class FrameAnalysisRequest(BaseModel):
    image_base64: Optional[str] = Field(None, description="Base64 encoded webcam image frame")
    landmark_data: Optional[Dict[str, Any]] = Field(None, description="Optional MediaPipe landmark telemetry (yaw, pitch, roll, smile_ratio, eye_openness)")


class SessionAnalysisRequest(BaseModel):
    frames: List[Dict[str, Any]] = Field(..., description="List of webcam frame data objects")


@video_analysis_router.post("/analyze-frame")
async def analyze_webcam_frame(request: FrameAnalysisRequest):
    """
    Analyze single webcam video frame or MediaPipe landmark telemetry to return facial emotion distribution,
    gaze tracking direction, and instant engagement metrics.
    """
    if not request.image_base64 and not request.landmark_data:
        raise HTTPException(status_code=400, detail="Either image_base64 or landmark_data must be provided")

    result = analyze_frame_expression(
        image_base64=request.image_base64 or "",
        landmark_data=request.landmark_data
    )

    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "Frame analysis failed"))

    return result


@video_analysis_router.post("/analyze-session")
async def analyze_video_interview_session(request: SessionAnalysisRequest):
    """
    Aggregate multi-frame interview video telemetry to compute full interview session statistics,
    emotion distribution percentages, eye contact ratio, focus stability score, and timeline metrics.
    """
    if not request.frames or len(request.frames) == 0:
        raise HTTPException(status_code=400, detail="Frames list cannot be empty")

    result = analyze_video_session(request.frames)

    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "Session analysis failed"))

    return result
