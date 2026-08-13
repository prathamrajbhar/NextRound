import logging
from typing import Optional
from core.http_client import callback_client
from agents.decision_agent import run_decision_agent
from workers.worker_base import fetch_internal, run_agent_job

logger = logging.getLogger("decision_worker")


def _coerce_optional_float(value):
    """Coerce a number/string to float; None stays None.

    A missing composite is never rewritten to 0.0 — coercing an unknown score to
    zero would silently turn it into an auto-reject downstream.
    """
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _extract_equity(job: dict) -> Optional[str]:
    """Read equity from the job's thresholds JSON, mirroring the API deriveEquity helper."""
    thresholds = job.get("thresholds")
    if isinstance(thresholds, dict):
        equity = thresholds.get("equity")
        if isinstance(equity, str) and equity:
            return equity
    return None


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

    async def run() -> dict:
        evaluation_id = job_data.get("evaluationId")
        composite_score = job_data.get("compositeScore")
        confidence = job_data.get("confidence")




        job_terms = {}
        try:
            data = await fetch_internal(f"internal/applications/{application_id}/raw")
            job = data.get("job") or {}
            job_terms = {
                "job_title": job.get("title"),
                "salary": job.get("salary"),
                "equity": _extract_equity(job),
            }
            evals = data.get("evaluations") or []
            if evals:
                evaluation_id = evaluation_id or evals[0].get("id")
                if composite_score is None:
                    composite_score = evals[0].get("composite_score")
                if confidence is None:
                    confidence = evals[0].get("confidence")
        except Exception as fetch_err:
            logger.warning(f"Failed to fetch stored application for decision context: {fetch_err}")






        composite_score = _coerce_optional_float(composite_score)
        confidence = _coerce_optional_float(confidence)


        result = await run_decision_agent(
            application_id=application_id,
            evaluation_id=evaluation_id,
            composite_score=composite_score,
            confidence=confidence,
            job_title=job_terms.get("job_title"),
            salary=job_terms.get("salary"),
            equity=job_terms.get("equity"),
        )




        if not evaluation_id:
            raise RuntimeError(
                f"No evaluation id available for decision job on application {application_id}. "
                "Refusing to write a decision to a fabricated evaluation."
            )
        eval_id = evaluation_id


        await callback_client.patch(
            f"internal/evaluations/{eval_id}/decision",
            json={
                "application_id": application_id,
                "decision": result.get("decision"),
                "decision_rationale": result.get("reasoning"),
                "auto_offer": result.get("auto_offer"),
                "offer_letter_content": result.get("offer_letter_content"),
                "rejection_email_content": result.get("rejection_email_content"),
            },
        )
        return result

    return await run_agent_job(
        agent_name="decision_agent",
        action="automated_decision",
        job_input={
            "application_id": application_id,
            "composite_score": job_data.get("compositeScore"),
            "confidence": job_data.get("confidence"),
        },
        work=run,
    )
