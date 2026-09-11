"""
resume_builder_worker.py
-------------------------
Background job processor: takes a completed session transcript + memory and
uses the LLM to produce an ATS-optimised resume JSON, then generates a PDF
and stores the result.
"""

import json
import logging
from services.llm.llm_service import generate_text, extract_json_object
from services.pdf.pdf_generator import generate_resume_pdf
from workers.worker_base import post_internal

logger = logging.getLogger("resume_builder_worker")


def _build_resume_prompt(
    target_role: str,
    target_company: str,
    transcript: list,
    memory: dict,
    profile_type: str,
    existing_resume: str,
    career_goals: str,
) -> str:
    role_json = json.dumps(str(target_role or ""))
    transcript_json = json.dumps(transcript, ensure_ascii=False)[:8000]

    # Structured facts from memory (much richer than raw transcript alone)
    candidate_facts = memory.get("candidate_facts") or []
    facts_text = "\n".join(f"- {f}" for f in candidate_facts) if candidate_facts else "(none)"

    covered_topics = ", ".join(memory.get("covered_topics") or []) or "(none)"
    user_name = str(memory.get("user_name") or "").strip()
    inferred_profile = str(profile_type or memory.get("profile_type") or "experienced").lower()

    resume_hint = ""
    if existing_resume and existing_resume.strip():
        resume_hint = (
            f"EXISTING RESUME (use as additional context — do not copy verbatim, but validate and enrich):\n"
            f"{existing_resume[:2000]}\n\n"
        )

    goals_hint = ""
    if career_goals and career_goals.strip():
        goals_hint = f"CANDIDATE'S STATED CAREER GOALS: {career_goals}\n\n"

    profile_guidance = {
        "student": (
            "This candidate is a student/recent graduate. "
            "Emphasise education, projects, internships, and academic achievements. "
            "The professional summary should highlight potential, skills, and ambition."
        ),
        "fresher": (
            "This candidate is a fresher (new graduate, no significant work experience). "
            "Lead with skills and projects. Keep work experience section brief. "
            "Summary should emphasise eagerness and trainability."
        ),
        "career_changer": (
            "This candidate is changing careers. Highlight transferable skills prominently. "
            "The summary should clearly frame the career transition as an asset."
        ),
        "freelancer": (
            "This candidate is a freelancer/contractor. "
            "Structure work experience as client projects. Emphasise breadth, autonomy, and outcomes."
        ),
    }.get(inferred_profile, (
        "This is an experienced professional. "
        "Lead with quantified achievements, leadership, and scope of impact."
    ))

    return (
        f"You are an expert resume writer and career coach. Your task is to extract structured resume data "
        f"from a voice interview transcript and generate an ATS-optimised professional resume JSON.\n\n"
        f"TARGET: {target_role or ''} role at {target_company or ''}\n"
        f"CANDIDATE NAME: {user_name or '(extract from transcript)'}\n"
        f"PROFILE TYPE: {inferred_profile}\n"
        f"PROFILE GUIDANCE: {profile_guidance}\n\n"
        f"{resume_hint}"
        f"{goals_hint}"
        f"STRUCTURED FACTS EXTRACTED DURING INTERVIEW:\n{facts_text}\n\n"
        f"TOPICS COVERED IN INTERVIEW: {covered_topics}\n\n"
        f"FULL INTERVIEW TRANSCRIPT:\n{transcript_json}\n\n"
        f"REQUIREMENTS:\n"
        f"1. Extract ALL information from both the transcript and structured facts.\n"
        f"2. For work experience: write bullet points using strong action verbs + quantified results "
        f"   (%, revenue, time saved, scale, team size). Minimum 3 bullets per role.\n"
        f"3. Professional summary: 2-3 sentences tailored to {target_role or 'the target role'}, "
        f"   highlighting the candidate's unique value proposition.\n"
        f"4. Skills: group into categories (Languages, Frameworks, Tools, Cloud, Databases, etc.).\n"
        f"5. If a field is not mentioned in the conversation, use a clearly indicated placeholder "
        f"   like '[email]' or '[phone]' — never invent specific details.\n"
        f"6. ATS score: calculate based on keyword relevance, quantifiable impact, "
        f"   action verb usage, formatting quality, and skill alignment to role.\n\n"
        f"Return EXACTLY this JSON format (no markdown fences, no prose around it):\n"
        f"{{\n"
        f'  "contact": {{\n'
        f'    "name": "Full Name",\n'
        f'    "email": "[email]",\n'
        f'    "phone": "[phone]",\n'
        f'    "location": "City, Country",\n'
        f'    "linkedin": "linkedin.com/in/[handle]",\n'
        f'    "github": "github.com/[handle]",\n'
        f'    "portfolio": "[portfolio-url or null]"\n'
        f'  }},\n'
        f'  "title": {role_json},\n'
        f'  "profile_type": "{inferred_profile}",\n'
        f'  "summary": "2-3 sentence professional summary tailored to the target role.",\n'
        f'  "career_objective": "1-2 sentence career objective from the goals discussion (null if not relevant).",\n'
        f'  "atsScore": 88,\n'
        f'  "scoreBreakdown": [\n'
        f'    {{"label": "Keyword Relevance", "score": 90, "description": "Alignment with target role keywords."}},\n'
        f'    {{"label": "Quantifiable Impact", "score": 82, "description": "Percentage of bullets backed by metrics."}},\n'
        f'    {{"label": "Action Verb Strength", "score": 85, "description": "Use of strong action verbs."}},\n'
        f'    {{"label": "Structural Formatting", "score": 95, "description": "ATS parser compatibility."}},\n'
        f'    {{"label": "Skill Alignment", "score": 88, "description": "Match between stated skills and role requirements."}}\n'
        f'  ],\n'
        f'  "work_history": [\n'
        f'    {{\n'
        f'      "title": "Job Title",\n'
        f'      "role": "Job Title",\n'
        f'      "company": "Company Name",\n'
        f'      "dates": "MMM YYYY – MMM YYYY",\n'
        f'      "period": "MMM YYYY – MMM YYYY",\n'
        f'      "location": "City, Country or Remote",\n'
        f'      "bullets": ["Action verb + specific achievement + quantified result.", "..."],\n'
        f'      "highlights": ["Action verb + specific achievement + quantified result.", "..."]\n'
        f'    }}\n'
        f'  ],\n'
        f'  "skills": [\n'
        f'    {{"category": "Languages", "items": ["Python", "TypeScript"]}},\n'
        f'    {{"category": "Frameworks", "items": ["FastAPI", "React"]}},\n'
        f'    {{"category": "Cloud & DevOps", "items": ["AWS", "Docker", "Kubernetes"]}},\n'
        f'    {{"category": "Databases", "items": ["PostgreSQL", "Redis"]}}\n'
        f'  ],\n'
        f'  "projects": [\n'
        f'    {{\n'
        f'      "name": "Project Name",\n'
        f'      "title": "Project Name",\n'
        f'      "description": "What it does and what problem it solves.",\n'
        f'      "techStack": ["Tech1", "Tech2"],\n'
        f'      "impact": "Measurable impact or outcome (e.g., 10k users, deployed in production)."\n'
        f'    }}\n'
        f'  ],\n'
        f'  "education": [\n'
        f'    {{\n'
        f'      "degree": "Bachelor of Science in Computer Science",\n'
        f'      "institution": "University Name",\n'
        f'      "year": "2024",\n'
        f'      "gpa": "3.8/4.0 or null",\n'
        f'      "relevant_coursework": ["Data Structures", "Machine Learning"]\n'
        f'    }}\n'
        f'  ],\n'
        f'  "certifications": [\n'
        f'    {{"name": "AWS Certified Solutions Architect", "issuer": "Amazon", "year": "2023"}}\n'
        f'  ],\n'
        f'  "languages": [\n'
        f'    {{"language": "English", "proficiency": "Native"}},\n'
        f'    {{"language": "Spanish", "proficiency": "Conversational"}}\n'
        f'  ],\n'
        f'  "awards": [\n'
        f'    {{"title": "Award Name", "issuer": "Issuing Organisation", "year": "2023"}}\n'
        f'  ],\n'
        f'  "volunteer": [\n'
        f'    {{"role": "Volunteer Role", "organisation": "Org Name", "duration": "2 years", "impact": "What you did."}}\n'
        f'  ]\n'
        f"}}"
    )


async def process_resume_builder_job(job_data: dict) -> bool:
    session_id = job_data.get("sessionId")
    if not session_id:
        logger.error("Missing sessionId in resume builder job payload.")
        return False

    logger.info(f"Processing resume builder job for session {session_id}")

    transcript = job_data.get("transcript")
    if not transcript:
        logger.error(
            f"No transcript for resume builder session {session_id}. Failing without fabricating."
        )
        await _mark_failed(session_id)
        return False

    target_role = job_data.get("targetRole") or ""
    target_company = job_data.get("targetCompany") or ""
    memory = job_data.get("memory") or {}
    profile_type = job_data.get("profileType") or memory.get("profile_type") or "experienced"
    existing_resume = job_data.get("existingResume") or ""
    career_goals = job_data.get("careerGoals") or ""

    prompt = _build_resume_prompt(
        target_role=target_role,
        target_company=target_company,
        transcript=transcript,
        memory=memory,
        profile_type=profile_type,
        existing_resume=existing_resume,
        career_goals=career_goals,
    )

    generated_resume = extract_json_object(generate_text(prompt))
    if not generated_resume:
        logger.error(
            f"LLM returned no usable resume JSON for session {session_id}. "
            "Failing without fabricated content."
        )
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
