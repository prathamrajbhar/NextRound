import logging
import httpx
from core.config import settings
from core.http_client import callback_client
from agents.decision_agent import run_decision_agent

logger = logging.getLogger("decision_worker")


async def process_decision_job(job_data: dict) -> bool:
    """
    Process decision job.
    1. Extract applicationId, evaluationId, compositeScore, confidence.
    2. Execute Decision LangGraph agent.
    3. Send decision result & drafted content back to Express internal endpoint.
    4. Log agent audit record.
    """
    application_id = job_data.get("applicationId")
    if not application_id:
        logger.error("Missing applicationId in decision job payload.")
        return False

    logger.info(f"Processing decision job for applicationId: {application_id}")

    try:
        evaluation_id = job_data.get("evaluationId")
        composite_score = job_data.get("compositeScore")
        confidence = job_data.get("confidence")

        # Defensive: if the decision job was enqueued without explicit scores or an
        # evaluation id (e.g., legacy HR path), fetch the stored evaluation record
        # from Express so the Decision Agent operates on real composite data.
        if evaluation_id is None or composite_score is None:
            try:
                async with httpx.AsyncClient() as client:
                    resp = await client.get(
                        f"{settings.express_api_base_url}/internal/applications/{application_id}/raw",
                        headers={"X-Internal-Service-Secret": settings.internal_service_secret},
                    )
                    resp.raise_for_status()
                    data = resp.json().get("data", {})
                    evals = data.get("evaluations") or []
                    if evals:
                        evaluation_id = evaluation_id or evals[0].get("id")
                        if composite_score is None:
                            composite_score = evals[0].get("composite_score")
                        if confidence is None:
                            confidence = evals[0].get("confidence")
            except Exception as fetch_err:
                logger.warning(f"Failed to fetch stored evaluation for decision fallback: {fetch_err}")

        composite_score = float(composite_score or 0.0)
        confidence = float(confidence or 1.0)

        # Run Decision LangGraph Agent
        result = await run_decision_agent(
            application_id=application_id,
            evaluation_id=evaluation_id,
            composite_score=composite_score,
            confidence=confidence,
        )

        eval_id = evaluation_id or f"eval_{application_id}"

        # Send decision result to Express API internal callback endpoint
        patch_payload = {
            "application_id": application_id,
            "decision": result.get("decision"),
            "decision_rationale": result.get("reasoning"),
            "auto_offer": result.get("auto_offer"),
            "offer_letter_content": result.get("offer_letter_content"),
            "rejection_email_content": result.get("rejection_email_content"),
        }

        async with httpx.AsyncClient() as client:
            resp = await client.patch(
                f"{settings.express_api_base_url}/internal/evaluations/{eval_id}/decision",
                json=patch_payload,
                headers={"X-Internal-Service-Secret": settings.internal_service_secret},
            )
            resp.raise_for_status()

        # Log agent execution
        log_payload = {
            "agent_name": "decision_agent",
            "action": "automated_decision",
            "input": {"application_id": application_id, "composite_score": composite_score, "confidence": confidence},
            "output": result,
            "status": "completed",
        }
        await callback_client.post_callback("internal/agent-logs", log_payload)

        logger.info(f"Successfully processed decision job for applicationId: {application_id} (Decision: {result.get('decision')})")
        return True

    except Exception as e:
        logger.error(f"Failed to process decision job for applicationId {application_id}: {e}")
        try:
            log_payload = {
                "agent_name": "decision_agent",
                "action": "automated_decision",
                "status": "failed",
                "error": str(e),
            }
            await callback_client.post_callback("internal/agent-logs", log_payload)
        except Exception:
            pass
        return False
