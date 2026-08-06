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

    default_questions: List[Dict[str, str]] = []
    for dim in dimensions:
        for i in range(1, 6):  # 5 questions per dimension = 20 total
            default_questions.append({
                "dimension": dim,
                "question": f"Question {i} for {dim}: How do you handle complex technical constraints in {dim.lower()} at {company_name}?",
                "suggestedAnswerKey": f"Focus on trade-offs, measurable metrics, structured STAR methodology, and scalability considerations for {dim}.",
            })

    culture_notes = f"Culture at {company_name}: Driven by customer obsession, high engineering standards, rapid iteration, and open architectural reviews."
    skill_checklist = [
        "Distributed Systems Design",
        "Data Structure Optimization",
        "Unit & Integration Testing",
        "CI/CD Deployment Pipelines",
        "Cross-functional Communication",
    ]

    questions = default_questions

    if genai_client:
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
                    questions = parsed.get("questions", questions)
                    culture_notes = parsed.get("cultureNotes", culture_notes)
                    skill_checklist = parsed.get("skillChecklist", skill_checklist)
        except Exception as e:
            logger.warning(f"GenAI prep worker generation warning: {e}")

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
