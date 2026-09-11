from typing import TypedDict, List
from pydantic import BaseModel, Field

class GapAnalysis(BaseModel):
    missing_skills: List[str] = Field(default_factory=list)
    experience_gaps: List[str] = Field(default_factory=list)
    strengths: List[str] = Field(default_factory=list)
    feedback: str = ""

class ScreeningOutput(BaseModel):
    status: str
    resume_score: float
    composite_score: float
    semantic_match_score: float
    gap_analysis: GapAnalysis
    reasoning: str
    rejection_feedback: str = ""

class ScreeningState(TypedDict, total=False):
    application_id: str
    candidate_id: str
    job_id: str
    resume_text: str
    job_description: str
    rubric: dict
    min_score: float
    parsed_skills: list
    resume_score: float
    semantic_match_score: float
    composite_score: float
    video_telemetry: list
    video_expression_summary: dict
    gap_analysis: dict
    decision: str
    rejection_feedback: str
    reasoning: str
