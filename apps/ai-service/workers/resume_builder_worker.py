import json
import logging
from services.llm_service import generate_text, extract_json_object
from services.pdf_generator import generate_resume_pdf
from workers.worker_base import post_internal

logger = logging.getLogger("resume_builder_worker")

async def process_resume_builder_job(job_data: dict) -> bool:
    session_id = job_data.get("sessionId")
    if not session_id:
        logger.error("Missing sessionId in resume builder job payload.")
        return False

    logger.info(f"Processing resume builder job for session {session_id}")

    transcript = job_data.get("transcript")
    if not transcript:
        logger.error(f"No transcript available for resume builder session {session_id}. Failing without a fabricated resume.")
        await _mark_failed(session_id)
        return False

    target_role = job_data.get("targetRole")
    target_company = job_data.get("targetCompany")

    role_json = json.dumps(str(target_role or ""))
    transcript_json = json.dumps(transcript, ensure_ascii=False)
    memory = job_data.get("memory") or {}
    memory_json = json.dumps(memory, ensure_ascii=False) if memory else "(none)"

    prompt = (
        f"Extract and generate an ATS-optimized resume JSON from this voice interview transcript.\n"
        f"Target Role: {target_role or ''} at {target_company or ''}\n\n"
        f"STRUCTURED FACTS extracted during the interview (use as primary source of truth):\n"
        f"{memory_json}\n\n"
        f"FULL CONVERSATION TRANSCRIPT (use for additional detail):\n"
        f"{transcript_json}\n\n"
        f"CRITICAL RULES — MUST FOLLOW:\n"
        f"1. ONLY include information the candidate actually stated. Do NOT invent, guess, or fabricate ANY field.\n"
        f"2. If a field (email, phone, GitHub, LinkedIn, GPA, company name, dates, etc.) was NOT mentioned by the candidate, set it to null. NEVER make one up.\n"
        f"3. Work history bullets: only use achievements the candidate described. You may rephrase for clarity but do NOT invent metrics, percentages, or numbers that were not stated.\n"
        f"4. Skills: only list technologies and tools the candidate explicitly mentioned.\n"
        f"5. Summary: based only on what the candidate said. No aspirational statements they didn't make.\n"
        f"6. ATS score should honestly reflect data completeness — do not inflate it.\n\n"
        f"Return exactly this JSON (set any unknown field to null — do NOT use placeholder text):\n"
        f"{{\n"
        f"  \"contact\": {{\n"
        f"    \"name\": \"<candidate full name or null>\",\n"
        f"    \"email\": \"<only if mentioned, else null>\",\n"
        f"    \"phone\": \"<only if mentioned, else null>\",\n"
        f"    \"location\": \"<only if mentioned, else null>\",\n"
        f"    \"linkedin\": \"<only if mentioned, else null>\",\n"
        f"    \"github\": \"<only if mentioned, else null>\",\n"
        f"    \"portfolio\": \"<only if mentioned, else null>\"\n"
        f"  }},\n"
        f"  \"title\": {role_json},\n"
        f"  \"summary\": \"<honest 2-3 sentence summary based strictly on candidate statements>\",\n"
        f"  \"atsScore\": <integer 0-100 based on actual data completeness>,\n"
        f"  \"scoreBreakdown\": [\n"
        f"    {{\"label\": \"Keyword Relevance\", \"score\": <int>, \"description\": \"<honest assessment>\"}},\n"
        f"    {{\"label\": \"Quantifiable Impact\", \"score\": <int>, \"description\": \"<honest assessment>\"}},\n"
        f"    {{\"label\": \"Data Completeness\", \"score\": <int>, \"description\": \"<honest assessment>\"}}\n"
        f"  ],\n"
        f"  \"work_history\": [\n"
        f"    {{\n"
        f"      \"title\": \"<role title candidate stated>\",\n"
        f"      \"role\": \"<role title candidate stated>\",\n"
        f"      \"company\": \"<company name candidate stated>\",\n"
        f"      \"dates\": \"<dates if mentioned, else null>\",\n"
        f"      \"period\": \"<dates if mentioned, else null>\",\n"
        f"      \"location\": \"<location if mentioned, else null>\",\n"
        f"      \"bullets\": [\"<real achievement candidate described>\"],\n"
        f"      \"highlights\": [\"<real achievement candidate described>\"]\n"
        f"    }}\n"
        f"  ],\n"
        f"  \"skills\": [\"<only skills the candidate explicitly mentioned>\"],\n"
        f"  \"projects\": [\n"
        f"    {{\n"
        f"      \"name\": \"<project name candidate mentioned>\",\n"
        f"      \"title\": \"<project name candidate mentioned>\",\n"
        f"      \"description\": \"<what candidate described>\",\n"
        f"      \"techStack\": [\"<tech candidate mentioned>\"],\n"
        f"      \"impact\": \"<impact candidate described or null>\"\n"
        f"    }}\n"
        f"  ],\n"
        f"  \"education\": [\n"
        f"    {{\n"
        f"      \"degree\": \"<degree candidate mentioned or null>\",\n"
        f"      \"institution\": \"<institution candidate mentioned or null>\",\n"
        f"      \"year\": \"<year if mentioned or null>\",\n"
        f"      \"gpa\": \"<GPA only if candidate stated it, else null>\"\n"
        f"    }}\n"
        f"  ],\n"
        f"  \"certifications\": [\"<only certifications candidate explicitly mentioned>\"]\n"
        f"}}"
    )
    generated_resume = extract_json_object(generate_text(prompt))
    if not generated_resume:
        logger.error(f"LLM returned no usable resume JSON for session {session_id}. Failing without fabricated content.")
        await _mark_failed(session_id)
        return False

    try:
        pdf_url = generate_resume_pdf(generated_resume)

        return await post_internal(
            "PATCH",
            f"/internal/resume-builder/{session_id}/result",
            {"generatedResume": generated_resume, "resumePdfUrl": pdf_url, "status": "completed"},
            context=f"resume result for session {session_id}",
        )
    except Exception as e:
        logger.error(f"Resume builder job failed for session {session_id}: {e}")
        await _mark_failed(session_id)
        return False

async def _mark_failed(session_id: str) -> None:
    try:
        await post_internal(
            "PATCH",
            f"/internal/resume-builder/{session_id}/result",
            {"status": "failed"},
            context=f"resume failure for session {session_id}",
        )
    except Exception as e:
        logger.error(f"Failed to mark resume builder session {session_id} as failed: {e}")
