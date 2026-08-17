import logging
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from services.sourcing_service import (
    fetch_github_profile,
    fetch_linkedin_profile,
    aggregate_external_profile
)

logger = logging.getLogger("sourcing_routes")

sourcing_router = APIRouter(prefix="/api/v1/ai/sourcing", tags=["external-talent-sourcing"])

class ExternalSourcingRequest(BaseModel):
    github_id: Optional[str] = Field(None, description="GitHub username or handle")
    linkedin_id: Optional[str] = Field(None, description="LinkedIn username or profile ID")
    job_description: Optional[str] = Field("", description="Job description text for semantic similarity matching")
    target_role: Optional[str] = Field("", description="Target role title (e.g. Senior Backend Engineer)")

@sourcing_router.get("/github/{github_id}")
async def get_github_profile(github_id: str):
    result = await fetch_github_profile(github_id)
    if not result.get("success"):
        raise HTTPException(status_code=404, detail=result.get("error", "GitHub profile not found"))
    return result

@sourcing_router.get("/linkedin/{linkedin_id}")
async def get_linkedin_profile(linkedin_id: str):
    result = await fetch_linkedin_profile(linkedin_id)
    if not result.get("success"):
        raise HTTPException(status_code=404, detail=result.get("error", "LinkedIn profile not found"))
    return result

@sourcing_router.post("/profile")
async def get_external_candidate_profile(request: ExternalSourcingRequest):
    if not request.github_id and not request.linkedin_id:
        raise HTTPException(status_code=400, detail="At least one of 'github_id' or 'linkedin_id' must be provided")

    result = await aggregate_external_profile(
        github_id=request.github_id,
        linkedin_id=request.linkedin_id,
        job_description=request.job_description or "",
        target_role=request.target_role or ""
    )

    if not result.get("success"):
        raise HTTPException(status_code=404, detail="Failed to source external profile from GitHub or LinkedIn")

    return result
