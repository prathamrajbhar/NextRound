import json
import logging
from services.llm_service import generate_text, extract_json_object
from workers.worker_base import post_internal, fetch_internal

logger = logging.getLogger("prep_content_worker")

DEFAULT_RUBRIC_DIMENSIONS = [
    "System Architecture",
    "Problem Solving & Algorithms",
    "Behavioral & STAR Method",
    "Technical Excellence & Testing",
]

async def process_prep_job(job_data: dict) -> bool:

    extra = job_data.get("extraData") or {}
    job_id = job_data.get("jobId") or extra.get("jobId")
    if not job_id:
        logger.error("Missing jobId in prep content job payload.")
        return False

    org_id = extra.get("orgId") or job_data.get("orgId")
    payload_title = (
        extra.get("jobTitle")
        or job_data.get("jobTitle")
        or extra.get("roleArchetype")
        or job_data.get("roleArchetype")
        or ""
    ).strip()
    payload_company = (extra.get("companyName") or job_data.get("companyName") or "").strip()
    description = extra.get("jobDescription") or job_data.get("jobDescription") or ""

    logger.info(f"Processing prep content generation for job {job_id}")

    job_title = payload_title
    company_name = payload_company
    try:
        job_info = await fetch_internal(f"internal/jobs/{job_id}/raw")
        if job_info:
            organization = job_info.get("organization") or {}
            if isinstance(organization, dict):
                company_name = (organization.get("name") or "").strip() or company_name
            job_title = (job_info.get("title") or "").strip() or job_title
            description = description or job_info.get("description") or ""
            org_id = org_id or job_info.get("org_id")
    except Exception as e:
        logger.warning(f"Failed to fetch job {job_id} for prep content generation: {e}")

    if not company_name or not job_title:
        logger.error(
            f"Cannot generate prep content for job {job_id}: "
            "organization name or job title unavailable. No fabricated fallback is generated."
        )
        return False

    role_archetype = job_title
    dimensions = extra.get("rubricDimensions") or job_data.get("rubricDimensions") or DEFAULT_RUBRIC_DIMENSIONS

    prompt = (
        f"Generate a comprehensive company interview prep guide for {role_archetype} at {company_name}.\n"
        f"Rubric Dimensions: {json.dumps(dimensions)}\n\n"
        f"Return JSON format:\n"
        f"{{\n"
        f"  \"questions\": [\n"
        f"    {{\"dimension\": str, \"question\": str, \"suggestedAnswerKey\": str}}\n"
        f"  ],\n"
        f"  \"cultureNotes\": str,\n"
        f"  \"skillChecklist\": [str]\n"
        f"}}\n"
        f"Provide 5 detailed, realistic interview questions per dimension."
    )

    parsed = extract_json_object(generate_text(prompt))
    questions = parsed.get("questions", []) if parsed else []
    culture_notes = parsed.get("cultureNotes", "") if parsed else ""
    skill_checklist = parsed.get("skillChecklist", []) if parsed else []

    if not questions:
        logger.error(f"GenAI returned no prep content for {company_name}. No templated fallback is generated.")
        return False

    return await post_internal(
        "POST",
        "/internal/prep/generate",
        {
            "companyName": company_name,
            "roleArchetype": role_archetype,
            "questions": questions,
            "cultureNotes": culture_notes,
            "skillChecklist": skill_checklist,
            "jobId": job_id,
            "orgId": org_id,
        },
        context=f"prep content for {company_name}",
    )
