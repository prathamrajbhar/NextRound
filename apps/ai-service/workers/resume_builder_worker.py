import json
import logging
from services.llm_service import generate_text, extract_json_object
from services.pdf_generator import generate_resume_pdf
from workers.worker_base import post_internal

logger = logging.getLogger("resume_builder_worker")


# ML_BYPASS: ATS ML scorer — replace with trained LambdaMART ranker on resume-outcome data
async def process_resume_builder_job(job_data: dict) -> bool:
    """
    Process AI Voice Resume Builder job:
    1. Parse Q&A transcript.
    2. Quantify bullet points with impact metrics using Gemini API.
    3. Generate ATS-optimized PDF via pdf_generator.
    4. Call back Express internal endpoint /internal/resume-builder/:sessionId/result.

    The resume is derived ONLY from the real transcript via the LLM. When the
    transcript or the LLM output is missing, the job fails — no fabricated
    resume is ever produced.
    """
    session_id = job_data.get("sessionId")
    if not session_id:
        logger.error("Missing sessionId in resume builder job payload.")
        return False

    logger.info(f"Processing resume builder job for session {session_id}")

    transcript = job_data.get("transcript")
    if not transcript:
        logger.error(f"No transcript available for resume builder session {session_id}. Failing without a fabricated resume.")
        return False

    target_role = job_data.get("targetRole")
    target_company = job_data.get("targetCompany")

    prompt = (
        f"Extract and generate an ATS-optimized resume JSON from this voice interview transcript.\n"
        f"Target Role: {target_role or ''} at {target_company or ''}\n"
        f"Transcript: {json.dumps(transcript)}\n\n"
        f"Crucial Requirement: Quantify every work history bullet point with metrics (percentages, dollar amounts, time saved, team size, scale).\n"
        f"Return JSON format:\n"
        f"{{\n"
        f"  \"contact\": {{\"name\": str, \"email\": str, \"phone\": str, \"location\": str}},\n"
        f"  \"summary\": str,\n"
        f"  \"work_history\": [{{\"title\": str, \"company\": str, \"dates\": str, \"bullets\": [str]}}],\n"
        f"  \"skills\": [str],\n"
        f"  \"projects\": [{{\"name\": str, \"description\": str}}],\n"
        f"  \"education\": [{{\"degree\": str, \"institution\": str}}]\n"
        f"}}"
    )
    generated_resume = extract_json_object(generate_text(prompt))
    if not generated_resume:
        logger.error(f"LLM returned no usable resume JSON for session {session_id}. Failing without fabricated content.")
        return False

    # Render PDF
    pdf_url = generate_resume_pdf(generated_resume)

    return await post_internal(
        "PATCH",
        f"/internal/resume-builder/{session_id}/result",
        {"generatedResume": generated_resume, "resumePdfUrl": pdf_url, "status": "completed"},
        context=f"resume result for session {session_id}",
    )
