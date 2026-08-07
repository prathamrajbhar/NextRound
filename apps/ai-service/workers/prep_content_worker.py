import logging
import json
import re
from typing import Dict, Any, List
from core.config import settings
from core.http_client import callback_client

logger = logging.getLogger("prep_content_worker")

genai_client = None
if settings.gemini_api_key:
    try:
        from google import genai
        genai_client = genai.Client(api_key=settings.gemini_api_key)
    except Exception as e:
        logger.warning(f"Failed to initialize GenAI client in prep_content_worker: {e}")


async def process_prep_job(job_data: dict) -> bool:
    """
    Process Company Prep Content Generation job:
    1. Extract companyName, roleArchetype, jobId, orgId, rubricDimensions.
    2. Generate questions (targeting 20+ total across dimensions), culture notes, and skill checklist via Gemini API.
    3. Call back Express internal endpoint /internal/prep/generate.
    """
    company_name = job_data.get("companyName", "Tech Corp")
    role_archetype = job_data.get("roleArchetype", "Software Engineer")
    job_id = job_data.get("jobId")
    org_id = job_data.get("orgId")

    logger.info(f"Processing prep content generation for {company_name} - {role_archetype}")

    dimensions = job_data.get("rubricDimensions") or [
        "System Architecture",
        "Problem Solving & Algorithms",
        "Behavioral & STAR Method",
        "Technical Excellence & Testing",
    ]

    if not genai_client:
        logger.error(f"No Gemini client available for prep content generation for {company_name}. No templated placeholder content is generated.")
        return False

    questions: List[Dict[str, str]] = []
    culture_notes = ""
    skill_checklist: List[str] = []

    try:
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
        res = genai_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        if res and res.text:
            match = re.search(r"\{.*\}", res.text, re.DOTALL)
            if match:
                parsed = json.loads(match.group(0))
                questions = parsed.get("questions", [])
                culture_notes = parsed.get("cultureNotes", "")
                skill_checklist = parsed.get("skillChecklist", [])
    except Exception as e:
        logger.warning(f"GenAI prep worker generation warning: {e}")
        return False

    if not questions:
        logger.error(f"GenAI returned no prep content for {company_name}. No templated fallback is generated.")
        return False

    try:
        response = await callback_client.post(
            "/internal/prep/generate",
            json={
                "companyName": company_name,
                "roleArchetype": role_archetype,
                "questions": questions,
                "cultureNotes": culture_notes,
                "skillChecklist": skill_checklist,
                "jobId": job_id,
                "orgId": org_id,
            }
        )
        if response.status_code in (200, 201):
            logger.info(f"Successfully posted generated prep content for {company_name}")
            return True
        else:
            logger.error(f"Failed to post prep content for {company_name}: status {response.status_code}")
            return False
    except Exception as e:
        logger.error(f"Callback error in prep_content_worker for {company_name}: {e}")
        return False
