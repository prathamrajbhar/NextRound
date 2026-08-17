import asyncio
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from agents.mock_interviewer_agent import run_mock_interviewer_agent, MockInterviewerState
from agents.resume_builder_agent import run_resume_builder_agent, ResumeBuilderState
from services.tts_service import generate_tts_audio_base64

mock_voice_router = APIRouter(prefix="/api/v1/ai", tags=["candidate-voice-ai"])

class MockRespondRequest(BaseModel):
    sessionId: str
    transcript: str
    topic: Optional[str] = None
    difficulty: Optional[str] = None
    targetRole: Optional[str] = None
    targetCompany: Optional[str] = None
    turnNumber: int = 0
    conversationHistory: List[Dict[str, Any]] = Field(default_factory=list)
    voice: Optional[str] = "en-US-ChristopherNeural"

class MockRespondResponse(BaseModel):
    text: str
    coachingHint: Optional[str] = None
    turnNumber: int
    isComplete: bool = False
    audioUrl: Optional[str] = None

class ResumeBuilderRespondRequest(BaseModel):
    sessionId: str
    transcript: str
    targetRole: Optional[str] = None
    targetCompany: Optional[str] = None
    stage: Optional[str] = None
    turnNumber: int = 0
    conversationHistory: List[Dict[str, Any]] = Field(default_factory=list)
    memory: Optional[Dict[str, Any]] = None
    voice: Optional[str] = "en-US-ChristopherNeural"

class ResumeBuilderRespondResponse(BaseModel):
    text: str
    realtimeInsight: Optional[str] = None
    stage: str
    turnNumber: int
    isComplete: bool = False
    memory: Optional[Dict[str, Any]] = None
    audioUrl: Optional[str] = None

@mock_voice_router.post("/mock/respond", response_model=MockRespondResponse)
async def generate_mock_response(request: MockRespondRequest):
    state: MockInterviewerState = {
        "session_id": request.sessionId,
        "topic": request.topic,
        "difficulty": request.difficulty,
        "target_role": request.targetRole,
        "target_company": request.targetCompany,
        "turn_number": request.turnNumber,
        "latest_candidate_response": request.transcript,
        "conversation_history": request.conversationHistory or [],
    }

    output = await asyncio.to_thread(run_mock_interviewer_agent, state)
    text = output.get("latest_ai_response")
    if not text:
        raise HTTPException(status_code=503, detail="Mock interviewer LLM returned no response. Try again in a moment.")

    audio_url = await generate_tts_audio_base64(text, voice=request.voice or "en-US-ChristopherNeural")

    return MockRespondResponse(
        text=text,
        coachingHint=output.get("coaching_hint"),
        turnNumber=output.get("turn_number", request.turnNumber + 1),
        isComplete=output.get("is_complete", False),
        audioUrl=audio_url,
    )

@mock_voice_router.post("/resume-builder/respond", response_model=ResumeBuilderRespondResponse)
async def generate_resume_builder_response(request: ResumeBuilderRespondRequest):
    state: ResumeBuilderState = {
        "session_id": request.sessionId,
        "target_role": request.targetRole,
        "target_company": request.targetCompany,
        "current_stage": request.stage,
        "turn_number": request.turnNumber,
        "latest_candidate_response": request.transcript,
        "conversation_history": request.conversationHistory or [],
        "memory": request.memory or {},
    }

    output = await asyncio.to_thread(run_resume_builder_agent, state)
    text = output.get("latest_ai_response")
    if not text:
        raise HTTPException(status_code=503, detail="Resume builder LLM returned no response. Try again in a moment.")

    audio_url = await generate_tts_audio_base64(text, voice=request.voice or "en-US-ChristopherNeural")

    return ResumeBuilderRespondResponse(
        text=text,
        realtimeInsight=output.get("realtime_insight"),
        stage=output.get("current_stage") or request.stage or "",
        turnNumber=output.get("turn_number", request.turnNumber + 1),
        isComplete=output.get("is_complete", False),
        memory=output.get("memory") or {},
        audioUrl=audio_url,
    )
