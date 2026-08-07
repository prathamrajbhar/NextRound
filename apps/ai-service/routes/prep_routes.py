import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from workers.prep_content_worker import process_prep_job

logger = logging.getLogger("prep_routes")

prep_router = APIRouter(prefix="/prep", tags=["Prep Content"])


class PrepGenerateRequest(BaseModel):
    job_id: str
    org_id: str
    job_title: str
    job_description: str


@prep_router.post("/generate")
async def generate_prep_content(request: PrepGenerateRequest):
    """Directly trigger AI prep content generation for a job posting."""
    try:
        payload = {
            "action": "prep-generate",
            "jobId": request.job_id,
            "extraData": {
                "orgId": request.org_id,
                "jobTitle": request.job_title,
                "jobDescription": request.job_description,
            },
        }
        result = await process_prep_job(payload)
        return {"success": True, "data": result}
    except Exception as e:
        logger.error(f"Prep content generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@prep_router.get("/health")
async def prep_health():
    return {"status": "ok", "service": "prep_content_agent"}
