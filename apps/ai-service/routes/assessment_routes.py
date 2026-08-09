import logging
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from agents.aptitude_generator_agent import generate_aptitude_questions

logger = logging.getLogger("assessment_routes")

assessment_router = APIRouter(prefix="/api/v1/ai/assessment", tags=["assessment"])


class GenerateAptitudeRequest(BaseModel):
    jobTitle: str = Field(default="Software Engineer", description="Job title for target application")
    jobDescription: Optional[str] = Field(default="", description="Job description / requirements text")
    count: Optional[int] = Field(default=5, ge=1, le=100, description="Number of questions to generate")


class GenerateAptitudeResponse(BaseModel):
    success: bool
    jobTitle: str
    count: int
    questions: List[Dict[str, Any]]


@assessment_router.post("/generate-aptitude", response_model=GenerateAptitudeResponse)
async def generate_aptitude_endpoint(request: GenerateAptitudeRequest):
    """
    Generate N dynamic, role-tailored aptitude test questions using Google GenAI (gemini-2.5-flash).
    """
    logger.info(f"Generating dynamic aptitude questions for jobTitle: {request.jobTitle}")
    
    questions = await generate_aptitude_questions(
        job_title=request.jobTitle,
        job_description=request.jobDescription or "",
        count=request.count or 5
    )

    return GenerateAptitudeResponse(
        success=True,
        jobTitle=request.jobTitle,
        count=len(questions),
        questions=questions
    )
