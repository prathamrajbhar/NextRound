import logging
from core.http_client import callback_client
from services.embedding_service import embed_resume
from agents.screening_agent import run_screening_agent
from workers.worker_base import fetch_internal, run_agent_job

logger = logging.getLogger("screening_worker")


def _as_list(value) -> list:
    if isinstance(value, list):
        return [str(x) for x in value if x is not None]
    return []


def build_profile_summary(candidate_info: dict) -> str:
    """Build a factual candidate profile summary when raw resume text is unavailable.

    Feeds the LLM real, structured profile data (never a file path or URL).
    """
    parts = []
    full_name = candidate_info.get("full_name")
    headline = candidate_info.get("headline")
    location = candidate_info.get("location")
    if full_name:
        parts.append(f"Candidate: {full_name}")
    if headline:
        parts.append(f"Headline: {headline}")
    if location:
        parts.append(f"Location: {location}")
    if candidate_info.get("years_of_experience") is not None:
        parts.append(f"Years of experience: {candidate_info.get('years_of_experience')}")
    skills = _as_list(candidate_info.get("skills"))
    if skills:
        parts.append(f"Skills: {', '.join(skills)}")
    target_roles = _as_list(candidate_info.get("target_roles"))
    if target_roles:
        parts.append(f"Target roles: {', '.join(target_roles)}")
    bio = candidate_info.get("bio")
    if bio:
        parts.append(f"Bio: {bio}")
    if parts:
        return "\n".join(parts)
    return "Candidate profile available for screening."



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



    log_extra: dict = {}

    async def run() -> dict:
        app_info = await fetch_internal(f"internal/applications/{application_id}/raw")
        job_info = app_info.get("job", {})
        candidate_info = app_info.get("candidate", {})
        candidate_id = candidate_info.get("id") or job_data.get("candidateId")
        job_id = app_info.get("job_id") or job_data.get("jobId")
        log_extra["job_id"] = job_id
        log_extra["org_id"] = job_info.get("org_id")


        resume_text = (candidate_info.get("raw_resume_text") or "").strip()
        if not resume_text:
            resume_text = build_profile_summary(candidate_info)
        job_desc = job_info.get("description", "")



        rubric = job_info.get("rubric")
        thresholds = job_info.get("thresholds") or {}
        min_score = thresholds.get("minScore")
        if not rubric:
            raise RuntimeError(f"Screening job for application {application_id} has no scoring rubric configured.")
        if min_score is None:
            raise RuntimeError(f"Screening job for application {application_id} has no minScore threshold configured.")


        if candidate_id:
            try:
                vector = embed_resume(resume_text)
                await callback_client.post_callback(
                    f"internal/candidate/{candidate_id}/embedding",
                    {"embedding": vector}
                )
            except Exception as embed_err:
                logger.warning(f"Failed to update candidate embedding vector: {embed_err}")


        result = await run_screening_agent(
            application_id=application_id,
            candidate_id=candidate_id or "",
            job_id=job_id or "",
            resume_text=resume_text,
            job_description=job_desc,
            rubric=rubric,
            min_score=float(min_score),
        )


        await callback_client.patch(
            f"internal/applications/{application_id}/screening-result",
            json={
                "status": result.get("status"),
                "resume_score": result.get("resume_score"),
                "composite_score": result.get("composite_score"),
                "semantic_match_score": result.get("semantic_match_score"),
                "gap_analysis": result.get("gap_analysis"),
                "reasoning": result.get("reasoning"),
                "rejection_feedback": result.get("rejection_feedback"),
            },
        )
        return result

    return await run_agent_job(
        agent_name="screening_agent",
        action="screening_evaluation",
        job_input={"application_id": application_id, "candidate_id": job_data.get("candidateId")},
        work=run,
        log_extra=log_extra,
    )
