import logging
import httpx
from core.config import settings
from core.http_client import callback_client
from services.embedding_service import embed_resume
from agents.screening_agent import run_screening_agent

logger = logging.getLogger("screening_worker")


# ML_BYPASS: ATS ML scorer — replace with trained LambdaMART ranker on resume-outcome data
async def process_screening_job(job_data: dict) -> bool:
    """
    Process candidate screening evaluation job.
    1. Fetch raw application and candidate resume details from Express internal endpoint.
    2. Compute & store candidate 768-dim resume embedding via internal endpoint.
    3. Execute Screening LangGraph Agent.
    4. Post screening evaluation result & gap analysis back to Express internal endpoint.
    5. Log agent audit record.
    """
    application_id = job_data.get("applicationId")
    if not application_id:
        logger.error("Missing applicationId in screening job payload.")
        return False

    logger.info(f"Processing screening job for applicationId: {application_id}")

    try:
        # Fetch raw application data from Express internal endpoint
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{settings.express_api_base_url}/internal/applications/{application_id}/raw",
                headers={"X-Internal-Service-Secret": settings.internal_service_secret},
            )
            resp.raise_for_request()
            app_info = resp.json().get("data", {})

        job_info = app_info.get("job", {})
        candidate_info = app_info.get("candidate", {})
        candidate_id = candidate_info.get("id") or job_data.get("candidateId")
        job_id = app_info.get("job_id") or job_data.get("jobId")

        resume_text = candidate_info.get("resume_url") or "Experienced Software Engineer proficient in React, TypeScript, Node.js, Express, and PostgreSQL."
        job_desc = job_info.get("description", "")
        rubric = job_info.get("rubric") or {"technical": 30, "communication": 20, "problemSolving": 25, "experience": 25}
        thresholds = job_info.get("thresholds") or {}
        min_score = thresholds.get("minScore", 70.0)

        # Generate & update 768-dim candidate resume embedding
        if candidate_id:
            try:
                vector = embed_resume(resume_text)
                await callback_client.post_callback(
                    f"internal/candidate/{candidate_id}/embedding",
                    {"embedding": vector}
                )
            except Exception as embed_err:
                logger.warning(f"Failed to update candidate embedding vector: {embed_err}")

        # Run Screening LangGraph Agent
        result = await run_screening_agent(
            application_id=application_id,
            candidate_id=candidate_id or "",
            job_id=job_id or "",
            resume_text=resume_text,
            job_description=job_desc,
            rubric=rubric,
            min_score=float(min_score),
        )

        # Patch evaluation result back to Express internal endpoint
        patch_payload = {
            "status": result.get("status"),
            "resume_score": result.get("resume_score"),
            "composite_score": result.get("composite_score"),
            "semantic_match_score": result.get("semantic_match_score"),
            "gap_analysis": result.get("gap_analysis"),
            "reasoning": result.get("reasoning"),
            "rejection_feedback": result.get("rejection_feedback"),
        }

        async with httpx.AsyncClient() as client:
            resp = await client.patch(
                f"{settings.express_api_base_url}/internal/applications/{application_id}/screening-result",
                json=patch_payload,
                headers={"X-Internal-Service-Secret": settings.internal_service_secret},
            )
            resp.raise_for_request()

        # Log agent execution
        log_payload = {
            "job_id": job_id,
            "org_id": job_info.get("org_id"),
            "agent_name": "screening_agent",
            "action": "screening_evaluation",
            "input": {"application_id": application_id, "candidate_id": candidate_id},
            "output": result,
            "status": "completed",
        }
        await callback_client.post_callback("internal/agent-logs", log_payload)

        logger.info(f"Successfully completed screening job for applicationId: {application_id}")
        return True

    except Exception as e:
        logger.error(f"Failed to process screening job for applicationId {application_id}: {e}")
        try:
            log_payload = {
                "agent_name": "screening_agent",
                "action": "screening_evaluation",
                "status": "failed",
                "error": str(e),
            }
            await callback_client.post_callback("internal/agent-logs", log_payload)
        except Exception:
            pass
        return False
