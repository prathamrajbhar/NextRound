import logging
import base64
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, File, UploadFile, Body
from pydantic import BaseModel, Field
from agents.interviewer_agent import run_interviewer_agent, InterviewerState
from agents.mock_interviewer_agent import run_mock_interviewer_agent, MockInterviewerState
from agents.resume_builder_agent import run_resume_builder_agent, ResumeBuilderState
from core.config import settings

logger = logging.getLogger("voice_routes")

voice_router = APIRouter(prefix="/api/v1/ai/interview", tags=["voice-interview"])


class TranscribeRequest(BaseModel):
    audio_base64: Optional[str] = None
    language: Optional[str] = "en"


class TranscribeResponse(BaseModel):
    transcript: str
    confidence: float


class InterviewRespondRequest(BaseModel):
    interviewId: str
    applicationId: Optional[str] = None
    transcript: str
    turnNumber: int = 0
    stage: str = "intro"
    candidateResume: Optional[str] = None
    jobTitle: Optional[str] = "Software Engineer"
    conversationHistory: List[Dict[str, Any]] = Field(default_factory=list)


class InterviewRespondResponse(BaseModel):
    text: str
    audioUrl: Optional[str] = None
    stage: str
    isComplete: bool = False
    scorecard: Optional[Dict[str, Any]] = None


class TTSRequest(BaseModel):
    text: str
    voice: Optional[str] = "en_US-male-medium"


class TTSResponse(BaseModel):
    audio_url: str
    audio_format: str = "mp3"


@voice_router.post("/transcribe", response_model=TranscribeResponse)
async def transcribe_audio(
    file: Optional[UploadFile] = File(None),
    payload: Optional[TranscribeRequest] = Body(None)
):
    """STT Speech-to-Text endpoint using Groq Whisper API / Faster-Whisper."""
    logger.info("Voice: Received audio transcription request")

    audio_bytes = None
    if payload and payload.audio_base64:
        try:
            audio_bytes = base64.b64decode(payload.audio_base64)
        except Exception as e:
            logger.error(f"Voice: Failed to decode base64 audio: {e}")
            raise HTTPException(status_code=400, detail="Invalid base64 audio payload.")
    elif file:
        audio_bytes = await file.read()
        logger.info(f"Received audio file {file.filename} of size {len(audio_bytes)} bytes")

    if not audio_bytes:
        raise HTTPException(status_code=400, detail="No audio provided.")

    raise HTTPException(status_code=501, detail="Speech-to-text service not available. No mock transcripts are returned.")


@voice_router.post("/respond", response_model=InterviewRespondResponse)
async def generate_interview_response(request: InterviewRespondRequest):
    """Generate next interviewer turn using LangGraph Interviewer Agent."""
    logger.info(f"Voice: Generating turn response for interview {request.interviewId}, stage {request.stage}")

    # Build InterviewerState input
    state: InterviewerState = {
        "interview_id": request.interviewId,
        "application_id": request.applicationId or request.interviewId,
        "current_stage": request.stage,
        "turn_number": request.turnNumber,
        "job_title": request.jobTitle or "Software Engineer",
        "latest_candidate_response": request.transcript,
        "conversation_history": request.conversationHistory or [],
        "candidate_resume": request.candidateResume or "",
    }

    # Execute LangGraph agent
    output_state = run_interviewer_agent(state)

    ai_text = output_state.get("latest_ai_response") or "Thank you for sharing that context. Could you tell me more about your technical architecture decisions?"
    next_stage = output_state.get("current_stage", request.stage)
    is_complete = Boolean(output_state.get("is_complete", False))
    scorecard = output_state.get("final_scorecard")

    return InterviewRespondResponse(
        text=ai_text,
        audioUrl=None,
        stage=next_stage,
        isComplete=is_complete,
        scorecard=scorecard,
    )


def Boolean(val: Any) -> bool:
    return bool(val)


@voice_router.post("/tts", response_model=TTSResponse)
async def generate_tts(request: TTSRequest):
    """Text-to-Speech endpoint using Piper/Coqui TTS."""
    logger.info(f"Voice: Generating TTS for text length {len(request.text)}")
    raise HTTPException(status_code=501, detail="Text-to-speech service not available. No mock audio is returned.")


class MockRespondRequest(BaseModel):
    sessionId: str
    transcript: str
    topic: Optional[str] = "System Design & Architecture"
    difficulty: Optional[str] = "medium"
    targetRole: Optional[str] = "Software Engineer"
    targetCompany: Optional[str] = "Tech Enterprise"
    turnNumber: int = 0
    conversationHistory: List[Dict[str, Any]] = Field(default_factory=list)


class MockRespondResponse(BaseModel):
    text: str
    coachingHint: Optional[str] = None
    turnNumber: int
    isComplete: bool = False


class ResumeBuilderRespondRequest(BaseModel):
    sessionId: str
    transcript: str
    targetRole: Optional[str] = "Software Engineer"
    targetCompany: Optional[str] = "Target Enterprise"
    stage: Optional[str] = "intro"
    turnNumber: int = 0
    conversationHistory: List[Dict[str, Any]] = Field(default_factory=list)


class ResumeBuilderRespondResponse(BaseModel):
    text: str
    realtimeInsight: Optional[str] = None
    stage: str
    turnNumber: int
    isComplete: bool = False


mock_voice_router = APIRouter(prefix="/api/v1/ai", tags=["candidate-voice-ai"])


@mock_voice_router.post("/mock/respond", response_model=MockRespondResponse)
async def generate_mock_response(request: MockRespondRequest):
    """Generate next mock interviewer turn response with inline coaching hints."""
    state: MockInterviewerState = {
        "session_id": request.sessionId,
        "topic": request.topic or "System Design & Architecture",
        "difficulty": request.difficulty or "medium",
        "target_role": request.targetRole or "Software Engineer",
        "target_company": request.targetCompany or "Tech Enterprise",
        "turn_number": request.turnNumber,
        "latest_candidate_response": request.transcript,
        "conversation_history": request.conversationHistory or [],
    }

    output = run_mock_interviewer_agent(state)
    return MockRespondResponse(
        text=output.get("latest_ai_response", "Thank you. Let's continue to the next architectural component."),
        coachingHint=output.get("coaching_hint"),
        turnNumber=output.get("turn_number", request.turnNumber + 1),
        isComplete=output.get("is_complete", False),
    )


@mock_voice_router.post("/resume-builder/respond", response_model=ResumeBuilderRespondResponse)
async def generate_resume_builder_response(request: ResumeBuilderRespondRequest):
    """Generate next voice resume builder turn response with real-time metric extraction hints."""
    state: ResumeBuilderState = {
        "session_id": request.sessionId,
        "target_role": request.targetRole or "Software Engineer",
        "target_company": request.targetCompany or "Target Enterprise",
        "current_stage": request.stage or "intro",
        "turn_number": request.turnNumber,
        "latest_candidate_response": request.transcript,
        "conversation_history": request.conversationHistory or [],
    }

    output = run_resume_builder_agent(state)
    return ResumeBuilderRespondResponse(
        text=output.get("latest_ai_response", "Let's explore your core engineering achievements next."),
        realtimeInsight=output.get("realtime_insight"),
        stage=output.get("current_stage", request.stage or "intro"),
        turnNumber=output.get("turn_number", request.turnNumber + 1),
        isComplete=output.get("is_complete", False),
    )

