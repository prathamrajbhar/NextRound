import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from workers.analytics_worker import process_analytics_job

logger = logging.getLogger("analytics_routes")

analytics_router = APIRouter(prefix="/analytics", tags=["Analytics"])

class AnalyticsReportRequest(BaseModel):
    org_id: str
    report_type: str = "full"

@analytics_router.post("/report")
async def generate_analytics_report(request: AnalyticsReportRequest):
    try:
        payload = {
            "orgId": request.org_id,
            "reportType": request.report_type,
        }
        result = await process_analytics_job(payload)
        return {"success": True, "data": result}
    except Exception as e:
        logger.error(f"Analytics report generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@analytics_router.get("/health")
async def analytics_health():
    return {"status": "ok", "service": "analytics_agent"}
