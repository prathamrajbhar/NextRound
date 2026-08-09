import json
import logging
from services.llm_service import generate_text, extract_json_object
from workers.worker_base import post_internal

logger = logging.getLogger("prep_content_worker")

DEFAULT_RUBRIC_DIMENSIONS = [
    "System Architecture",
    "Problem Solving & Algorithms",
    "Behavioral & STAR Method",
    "Technical Excellence & Testing",
]


async def process_prep_job(job_data: dict) -> bool:
    """
    Process Company Prep Content Generation job:
    1. Extract companyName, roleArchetype, jobId, orgId, rubricDimensions.
    2. Generate questions (targeting 20+ total across dimensions), culture notes, and skill checklist via Gemini API.
    3. Call back Express internal endpoint /internal/prep/generate.
    """
    # The API's prep-generate payload carries jobTitle/jobDescription; fall back
    # to roleArchetype when the older "prep" queue shape is used.
    company_name = job_data.get("companyName", "Tech Corp")
    role_archetype = job_data.get("roleArchetype") or job_data.get("jobTitle", "Software Engineer")
    job_id = job_data.get("jobId")
    org_id = job_data.get("orgId")

    logger.info(f"Processing prep content generation for {company_name} - {role_archetype}")

    dimensions = job_data.get("rubricDimensions") or DEFAULT_RUBRIC_DIMENSIONS

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
