import logging
import asyncio
import base64
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, File, UploadFile, Body, Request
from fastapi.responses import StreamingResponse
import json
from pydantic import BaseModel, Field
from agents.interviewer_agent import run_interviewer_agent, InterviewerState
from services.stt_service import transcribe_audio_bytes
from services.tts_service import generate_tts_audio_base64, stream_sentence_tts
from core.config import settings

logger = logging.getLogger("voice_routes")

voice_router = APIRouter(prefix="/api/v1/ai/interview", tags=["voice-interview"])


class TranscribeRequest(BaseModel):
    audio_base64: Optional[str] = None
    language: Optional[str] = "en"


class TranscribeResponse(BaseModel):
    transcript: str
    confidence: Optional[float] = None


class InterviewRespondRequest(BaseModel):
    interviewId: str
    applicationId: Optional[str] = None
    transcript: str
    turnNumber: int = 0
    stage: str = "intro"
    candidateResume: Optional[str] = None
    candidateContext: Optional[Dict[str, Any]] = None
    requiredSkills: Optional[List[str]] = None
    jobRubric: Optional[Dict[str, Any]] = None
    jobTitle: Optional[str] = None
    conversationHistory: List[Dict[str, Any]] = Field(default_factory=list)
    voice: Optional[str] = "en-US-ChristopherNeural"


class InterviewRespondResponse(BaseModel):
    text: str
    audioUrl: Optional[str] = None
    stage: str
    isComplete: bool = False
    scorecard: Optional[Dict[str, Any]] = None
    analysis: Optional[Dict[str, Any]] = None
    turnRecord: Optional[Dict[str, Any]] = None
    evaluatedSkills: Optional[List[str]] = None
    remainingSkills: Optional[List[str]] = None
    currentSkill: Optional[str] = None


class TTSRequest(BaseModel):
    text: str
    voice: Optional[str] = "en-US-ChristopherNeural"


class TTSResponse(BaseModel):
    audio_url: str
    audio_format: str = "mp3"


@voice_router.post("/transcribe", response_model=TranscribeResponse)
async def transcribe_audio(
    request: Request,
    file: Optional[UploadFile] = File(None),
):
    """STT Speech-to-Text endpoint using Groq Whisper API (whisper-large-v3-turbo)."""
    logger.info("Voice: Received audio transcription request")

    audio_bytes = None
    filename = "audio.webm"

    content_type = request.headers.get("content-type", "")
    if "application/json" in content_type:
        try:
            body = await request.json()
            if isinstance(body, dict) and body.get("audio_base64"):
                audio_bytes = base64.b64decode(body["audio_base64"])
        except Exception as e:
            logger.error(f"Voice: Failed to decode base64 audio payload: {e}")
            raise HTTPException(status_code=400, detail="Invalid base64 audio payload.")

    if not audio_bytes and file:
        filename = file.filename or "audio.webm"
        audio_bytes = await file.read()
        logger.info(f"Received audio file {filename} of size {len(audio_bytes)} bytes")

    if not audio_bytes or len(audio_bytes) == 0:
        raise HTTPException(status_code=400, detail="No audio provided.")

    transcript, confidence = transcribe_audio_bytes(audio_bytes, filename=filename)
    return TranscribeResponse(transcript=transcript, confidence=confidence)


@voice_router.post("/respond", response_model=InterviewRespondResponse)
async def generate_interview_response(request: InterviewRespondRequest):
    """Generate next interviewer turn using LangGraph Interviewer Agent & synthesize audio."""
    logger.info(f"Voice: Generating turn response for interview {request.interviewId}, stage {request.stage}")


    state: InterviewerState = {
        "interview_id": request.interviewId,
        "application_id": request.applicationId or request.interviewId,
        "current_stage": request.stage,
        "turn_number": request.turnNumber,
        "job_title": request.jobTitle,
        "latest_candidate_response": request.transcript,
        "conversation_history": request.conversationHistory or [],
        "candidate_resume": request.candidateResume,
        "candidate_context": request.candidateContext,
        "job_rubric": request.jobRubric,
    }
    if request.requiredSkills:
        state["required_skills"] = request.requiredSkills


    output_state = await asyncio.to_thread(run_interviewer_agent, state)

    ai_text = output_state.get("latest_ai_response")
    if not ai_text:
        raise HTTPException(status_code=503, detail="Interviewer LLM returned no response. Try again in a moment.")
    next_stage = output_state.get("current_stage", request.stage)
    is_complete = bool(output_state.get("is_complete", False))
    scorecard = output_state.get("final_scorecard")
    analysis = output_state.get("last_analysis")
    turn_records = output_state.get("turn_records") or []
    turn_record = turn_records[-1] if turn_records else None


    audio_url = await generate_tts_audio_base64(ai_text, voice=request.voice or "en-US-ChristopherNeural")

    return InterviewRespondResponse(
        text=ai_text,
        audioUrl=audio_url,
        stage=next_stage,
        isComplete=is_complete,
        scorecard=scorecard,
        analysis=analysis,
        turnRecord=turn_record,
        evaluatedSkills=output_state.get("evaluated_skills") or [],
        remainingSkills=output_state.get("skills_to_evaluate") or [],
        currentSkill=output_state.get("current_skill"),
    )


@voice_router.post("/tts", response_model=TTSResponse)
async def generate_tts(request: TTSRequest):
    """Text-to-Speech endpoint using Edge TTS neural synthesis."""
    logger.info(f"Voice: Generating TTS for text length {len(request.text)}")
    if not request.text or not request.text.strip():
        raise HTTPException(status_code=400, detail="Text parameter cannot be empty.")

    audio_url = await generate_tts_audio_base64(request.text, voice=request.voice or "en-US-ChristopherNeural")
    return TTSResponse(audio_url=audio_url, audio_format="mp3")


@voice_router.post("/voice-stream")
async def voice_stream_response(request: InterviewRespondRequest):
    """
    Low-latency streaming endpoint yielding chunked sentence audio segments for sub-500ms voice interaction.
    """
    state: InterviewerState = {
        "interview_id": request.interviewId,
        "application_id": request.applicationId or request.interviewId,
        "current_stage": request.stage,
        "turn_number": request.turnNumber,
        "job_title": request.jobTitle,
        "latest_candidate_response": request.transcript,
        "conversation_history": request.conversationHistory or [],
        "candidate_resume": request.candidateResume,
        "candidate_context": request.candidateContext,
        "job_rubric": request.jobRubric,
    }
    if request.requiredSkills:
        state["required_skills"] = request.requiredSkills

    output_state = await asyncio.to_thread(run_interviewer_agent, state)
    ai_text = output_state.get("latest_ai_response")
    if not ai_text:
        raise HTTPException(status_code=503, detail="Interviewer LLM returned no response. Try again in a moment.")

    async def event_generator():
        async for chunk in stream_sentence_tts(ai_text, voice=request.voice or "en-US-ChristopherNeural"):
            yield f"data: {json.dumps(chunk)}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

