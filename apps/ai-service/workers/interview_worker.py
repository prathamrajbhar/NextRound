import logging
from core.http_client import callback_client
from agents.interviewer_agent import run_interviewer_agent, InterviewerState
from services.sentiment_service import analyze_interview_sentiment
from workers.worker_base import fetch_internal, run_agent_job, AgentJobSkip

logger = logging.getLogger("interview_worker")

def _build_context_text(context: dict, max_length: int = 3000) -> str:
    parts = []
    candidate = context.get("candidate") or {}
    parts.append(f"Candidate: {candidate.get('fullName') or 'N/A'}")
    parts.append(f"Headline: {candidate.get('headline') or 'N/A'}")
    if candidate.get("location"):
        parts.append(f"Location: {candidate.get('location')}")
    if candidate.get("yearsOfExperience") is not None:
        parts.append(f"Years of experience: {candidate.get('yearsOfExperience')}")
    target_roles = candidate.get("targetRoles") or []
    if target_roles:
        parts.append(f"Target roles: {', '.join(target_roles)}")
    if candidate.get("bio"):
        parts.append(f"Bio: {candidate.get('bio')}")

    skills = context.get("skills") or []
    if skills:
        parts.append(f"Skills: {', '.join(skills)}")

    resume_raw = (context.get("resume") or {}).get("rawText")
    if resume_raw:
        parts.append(f"RESUME:\n{str(resume_raw)[:4000]}")

    github = context.get("social", {}).get("github")
    if github:
        parts.append(f"GITHUB: {str(github)[:2000]}")
    linkedin = context.get("social", {}).get("linkedin")
    if linkedin:
        parts.append(f"LINKEDIN: {str(linkedin)[:2000]}")

    experience = context.get("experience") or []
    if experience:
        parts.append(f"EXPERIENCE: {str(experience)[:1500]}")
    projects = context.get("projects") or []
    if projects:
        parts.append(f"PROJECTS: {str(projects)[:1500]}")
    education = context.get("education") or []
    if education:
        parts.append(f"EDUCATION: {str(education)[:1000]}")

    interview_focus = context.get("interviewFocus") or []
    if interview_focus:
        focus_text = "\n\n".join(
            f"[{s.get('sourceType')}/{s.get('section')}]\n{s.get('content')}" for s in interview_focus
        )
        parts.append(f"MOST RELEVANT PROFILE SECTIONS FOR THE ROLE:\n{focus_text[:2500]}")

    job = context.get("job") or {}
    parts.append(f"JOB: {job.get('title') or 'N/A'}")
    if job.get("description"):
        parts.append(f"JOB DESCRIPTION: {str(job.get('description'))[:2500]}")

    text = "\n\n".join(part for part in parts if part)
    return text[:max_length]

async def process_interview_job(job_data: dict) -> bool:
    interview_id = job_data.get("interviewId")
    application_id = job_data.get("applicationId")

    if not interview_id:
        logger.error("Missing interviewId in interview job payload. Refusing to fabricate an interview ID.")
        return False

    target_interview_id = interview_id
    logger.info(f"Processing interview evaluation job for interviewId: {target_interview_id}")

    async def run() -> dict:
        raw_transcript = job_data.get("transcript") or []

        if not isinstance(raw_transcript, list) or len(raw_transcript) == 0:
            logger.warning(
                f"Interview {target_interview_id} has no transcript turns; "
                "skipping completion scoring (needs human review)."
            )
            raise AgentJobSkip

        initial_state: InterviewerState = {
            "interview_id": target_interview_id,
            "application_id": application_id or target_interview_id,
            "conversation_history": raw_transcript,
            "current_stage": "closing",
            "turn_number": len(raw_transcript),
        }

        try:
            application = await fetch_internal(f"internal/applications/{application_id or target_interview_id}/raw")
            candidate_id = application.get("candidate_id")
            job_id = application.get("job_id")
            if candidate_id:
                initial_state["candidate_id"] = candidate_id
            if job_id:
                initial_state["job_id"] = job_id

            if candidate_id and job_id:
                context = await fetch_internal(
                    f"internal/candidates/{candidate_id}/context?jobId={job_id}"
                )
                initial_state["candidate_resume"] = _build_context_text(context or {})
                initial_state["candidate_context"] = context or {}
                job = (context or {}).get("job") or {}
                if job.get("title"):
                    initial_state["job_title"] = job["title"]
                if job.get("rubric"):
                    initial_state["job_rubric"] = job["rubric"]
                logger.info(
                    f"Loaded candidate context for interview {target_interview_id}: "
                    f"candidate={candidate_id}, job={job_id}"
                )
            elif not candidate_id:
                logger.warning(
                    f"Interview {target_interview_id}: application {application_id} has no candidate_id; "
                    "proceeding transcript-only."
                )
            else:
                logger.warning(
                    f"Interview {target_interview_id}: candidate {candidate_id} has no job_id; "
                    "skipping candidate context (needs a job for relevance focus)."
                )
        except Exception as context_err:
            logger.warning(
                f"Failed to load candidate context for interview {target_interview_id}: {context_err}. "
                "Proceeding with transcript-only evaluation."
            )

        output_state = run_interviewer_agent(initial_state)
        scorecard = output_state.get("final_scorecard")
        if not scorecard or not scorecard.get("total_turns"):
            logger.error(f"Interviewer agent produced no scorecard for interview {target_interview_id}. No fabricated score is applied.")
            raise AgentJobSkip

        patch_payload = {
            "interview_score": scorecard.get("overall_score", 0.0),
            "scores": {
                "composite": scorecard.get("overall_score", 0.0),
                "technical": scorecard.get("technical_score", 0.0),
                "communication": scorecard.get("communication_score", 0.0),
                "problemSolving": scorecard.get("problem_solving_score", 0.0),
            },
            "reasoning": scorecard.get("summary_feedback", ""),
            "feedback": scorecard.get("summary_feedback", ""),
            "transcript": raw_transcript,
        }

        await callback_client.patch(
            f"internal/interviews/{target_interview_id}/result",
            json=patch_payload,
        )

        try:
            audio_url = job_data.get("audioUrl") or ""
            sentiment_report = analyze_interview_sentiment(target_interview_id, audio_url)
            if not sentiment_report or sentiment_report.get("status") == "unavailable":
                logger.info(
                    f"Sentiment analysis unavailable for interview {target_interview_id}; "
                    "skipping sentiment report persistence."
                )
            else:
                await callback_client.patch(
                    f"internal/interviews/{target_interview_id}/sentiment",
                    json={"sentiment_report": sentiment_report},
                )
        except Exception as sentiment_err:
            logger.warning(f"Failed to post sentiment report for interview {target_interview_id}: {sentiment_err}")

        return scorecard

    return await run_agent_job(
        agent_name="interviewer_agent",
        action="voice_interview_evaluation",
        job_input={"interview_id": target_interview_id, "application_id": application_id},
        work=run,
        log_extra={"job_id": None},
    )
