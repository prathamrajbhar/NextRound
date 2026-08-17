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

    prompt = (
        f"Extract and generate an ATS-optimized resume JSON and compliance evaluation scorecard from this voice interview transcript.\n"
        f"Target Role: {target_role or ''} at {target_company or ''}\n"
        f"Transcript: {transcript_json}\n\n"
        f"Requirements:\n"
        f"1. Contact details: Fill in candidate details. If missing in transcript, infer professional placeholders (e.g. email, phone, location, links).\n"
        f"2. Experience/Work History: Quantify work history bullet points with metrics (percentages, revenue, time saved, scale).\n"
        f"3. Alignment: Ensure all keys accommodate both ReportLab PDF compiler keys and React frontend keys.\n\n"
        f"Return exactly in this JSON format (no surrounding markdown codeblocks except raw json text):\n"
        f"{{\n"
        f"  \"contact\": {{\n"
        f"    \"name\": \"Candidate Name\",\n"
        f"    \"email\": \"email@example.com\",\n"
        f"    \"phone\": \"+1-555-0199\",\n"
        f"    \"location\": \"City, State\",\n"
        f"    \"linkedin\": \"linkedin.com/in/candidate\",\n"
        f"    \"github\": \"github.com/candidate\",\n"
        f"    \"portfolio\": \"candidate.dev\"\n"
        f"  }},\n"
        f"  \"title\": {role_json},\n"
        f"  \"summary\": \"Professional summary focusing on target role capabilities.\",\n"
        f"  \"atsScore\": 88,\n"
        f"  \"scoreBreakdown\": [\n"
        f"    {{\"label\": \"Keyword Relevance\", \"score\": 90, \"description\": \"Relevance to target role competencies.\"}},\n"
        f"    {{\"label\": \"Quantifiable Impact\", \"score\": 82, \"description\": \"Percentage of achievements backed by metrics.\"}},\n"
        f"    {{\"label\": \"Structural Formatting\", \"score\": 95, \"description\": \"ATS parser compatibility of layouts.\"}}\n"
        f"  ],\n"
        f"  \"work_history\": [\n"
        f"    {{\n"
        f"      \"title\": \"Role Title\",\n"
        f"      \"role\": \"Role Title\",\n"
        f"      \"company\": \"Company Name\",\n"
        f"      \"dates\": \"Dates / Period\",\n"
        f"      \"period\": \"Dates / Period\",\n"
        f"      \"location\": \"City, State\",\n"
        f"      \"bullets\": [\"Quantified achievement 1\", \"Quantified achievement 2\"],\n"
        f"      \"highlights\": [\"Quantified achievement 1\", \"Quantified achievement 2\"]\n"
        f"    }}\n"
        f"  ],\n"
        f"  \"skills\": [\"Skill1\", \"Skill2\"],\n"
        f"  \"projects\": [\n"
        f"    {{\n"
        f"      \"name\": \"Project Name\",\n"
        f"      \"title\": \"Project Name\",\n"
        f"      \"description\": \"Description of what was built.\",\n"
        f"      \"techStack\": [\"Tech1\", \"Tech2\"],\n"
        f"      \"impact\": \"Quantifiable impact or metrics of the project.\"\n"
        f"    }}\n"
        f"  ],\n"
        f"  \"education\": [\n"
        f"    {{\n"
        f"      \"degree\": \"Degree Name\",\n"
        f"      \"institution\": \"University Name\",\n"
        f"      \"year\": \"Graduation Year\",\n"
        f"      \"gpa\": \"GPA score (optional)\"\n"
        f"    }}\n"
        f"  ],\n"
        f"  \"certifications\": []\n"
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
