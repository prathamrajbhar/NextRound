import json
import logging
from typing import Dict, Any
from services.llm_service import generate_text, extract_json_object
from services.pdf_generator import generate_resume_pdf
from workers.worker_base import post_internal

logger = logging.getLogger("resume_builder_worker")


def _template_resume(target_role: str, target_company: str) -> Dict[str, Any]:
    """Placeholder resume used only when no transcript / LLM is available.

    NOTE: this is scaffolded placeholder data (not derived from the candidate).
    It preserves the historical fallback so a session always produces a PDF;
    revisit if placeholder content is no longer acceptable for this feature.
    """
    return {
        "contact": {
            "name": "Candidate",
            "email": "candidate@example.com",
            "phone": "+1 (555) 019-2834",
            "location": "San Francisco, CA",
        },
        "target_role": target_role,
        "target_company": target_company,
        "summary": f"Targeting {target_role} at {target_company}. Results-oriented engineer with experience architecting high-availability cloud applications and leading cross-functional delivery.",
        "work_history": [
            {
                "title": target_role,
                "company": "Tech Solutions Inc.",
                "dates": "2022 - Present",
                "bullets": [
                    "Architected and deployed microservices architecture handling 10M+ daily active requests with 99.99% uptime SLA.",
                    "Optimized PostgreSQL database query latency by 45% using Redis caching and index refactoring.",
                    "Led team of 5 engineers delivering CI/CD pipeline automation, cutting deployment cycle times by 60%.",
                ],
            }
        ],
        "skills": [
            "TypeScript", "React 19", "Next.js", "Express.js", "Python", "FastAPI",
            "PostgreSQL", "Redis", "Docker", "AWS S3", "System Architecture",
        ],
        "projects": [
            {
                "name": "High-Throughput Analytics Engine",
                "description": "Engineered real-time data streaming pipeline using Kafka and Node.js, processing 50K events/sec.",
            }
        ],
        "education": [
            {
                "degree": "B.S. in Computer Science",
                "institution": "University of Technology",
            }
        ],
    }


# ML_BYPASS: ATS ML scorer — replace with trained LambdaMART ranker on resume-outcome data
async def process_resume_builder_job(job_data: dict) -> bool:
    """
    Process AI Voice Resume Builder job:
    1. Parse Q&A transcript.
    2. Quantify bullet points with impact metrics using Gemini API.
    3. Generate ATS-optimized PDF via pdf_generator.
    4. Call back Express internal endpoint /internal/resume-builder/:sessionId/result.
    """
    session_id = job_data.get("sessionId")
    if not session_id:
        logger.error("Missing sessionId in resume builder job payload.")
        return False

    logger.info(f"Processing resume builder job for session {session_id}")

    transcript = job_data.get("transcript") or []
    target_role = job_data.get("targetRole", "Software Engineer")
    target_company = job_data.get("targetCompany", "Target Enterprise")

    generated_resume = _template_resume(target_role, target_company)

    if transcript:
        prompt = (
            f"Extract and generate an ATS-optimized resume JSON from this voice interview transcript.\n"
            f"Target Role: {target_role} at {target_company}\n"
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
        parsed = extract_json_object(generate_text(prompt))
        if parsed:
            generated_resume = parsed

    # Render PDF
    pdf_url = generate_resume_pdf(generated_resume)

    return await post_internal(
        "PATCH",
        f"/internal/resume-builder/{session_id}/result",
        {"generatedResume": generated_resume, "resumePdfUrl": pdf_url, "status": "completed"},
        context=f"resume result for session {session_id}",
    )
