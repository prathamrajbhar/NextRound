import json
import logging
from typing import List
from agents.interviewer_types import InterviewerState
from agents.interviewer_guards import (
    normalize_question,
    is_duplicate,
    force_next_topic,
    guard_duplicates,
    heuristic_analysis,
)

logger = logging.getLogger("interviewer_agent")

def derive_required_skills(state: InterviewerState) -> List[str]:
    ctx = state.get("candidate_context") or {}
    job = ctx.get("job") or {}
    job_skills = [str(s) for s in (job.get("skills") or []) if str(s).strip()]
    if job_skills:
        return job_skills

    rubric = job.get("rubric") or state.get("job_rubric") or {}
    if isinstance(rubric, dict):
        dims = [str(k) for k in rubric.keys() if not str(k).startswith("_")]
        if dims:
            return dims

    candidate_skills = [str(s) for s in (ctx.get("skills") or []) if str(s).strip()]
    if candidate_skills:
        return candidate_skills

    return ["technical depth", "communication", "problem solving"]

def build_profile_text(state: InterviewerState) -> str:
    ctx = state.get("candidate_context") or {}
    if not ctx:
        return state.get("candidate_resume") or ""

    parts: List[str] = []
    cand = ctx.get("candidate") or {}
    if cand.get("fullName"):
        parts.append(f"Candidate: {cand['fullName']}")
    if cand.get("headline"):
        parts.append(f"Headline: {cand['headline']}")

    skills = ctx.get("skills") or []
    if skills:
        parts.append(f"Skills: {', '.join(str(s) for s in skills)}")

    resume = ctx.get("resume") or {}
    raw = resume.get("rawText")
    if raw:
        parts.append(f"RESUME:\n{str(raw)[:3000]}")

    github = ctx.get("social", {}).get("github")
    if github:
        parts.append(f"GITHUB: {json.dumps(github, default=str)[:1500]}")

    linkedin = ctx.get("social", {}).get("linkedin")
    if linkedin:
        parts.append(f"LINKEDIN: {json.dumps(linkedin, default=str)[:1500]}")

    projects = ctx.get("projects") or []
    if projects:
        parts.append(f"PROJECTS: {json.dumps(projects, default=str)[:1500]}")

    experience = ctx.get("experience") or []
    if experience:
        parts.append(f"EXPERIENCE: {json.dumps(experience, default=str)[:1500]}")

    job = ctx.get("job") or {}
    if job.get("description"):
        parts.append(f"JOB DESCRIPTION: {str(job['description'])[:2000]}")

    focus = ctx.get("interviewFocus") or []
    if focus:
        focus_lines = [f"[{s.get('sourceType')}] {s.get('content')}" for s in focus if isinstance(s, dict)]
        if focus_lines:
            parts.append("MOST RELEVANT PROFILE SECTIONS:\n" + "\n".join(focus_lines)[:2000])

    return "\n\n".join(parts)

def stage_for_skill(skill: str) -> str:
    skill_lower = skill.lower()
    if any(k in skill_lower for k in ("communication", "behavioral", "culture", "team", "collab", "leadership")):
        return "behavioral"
    if any(k in skill_lower for k in ("project", "architecture", "github", "portfolio", "system design")):
        return "project"
    return "technical"

def base_prompt(state: InterviewerState) -> str:
    job_title = state.get("job_title") or "an open role"
    current_skill = state.get("current_skill") or "relevant experience"
    return (
        f"You are a professional, human-like interviewer conducting a live interview for {job_title}.\n"
        f"Current skill being evaluated: {current_skill}\n"
        f"Required skills to evaluate: {', '.join(state.get('skills_to_evaluate') or [])}\n"
        f"Skills sufficiently evaluated: {', '.join(state.get('evaluated_skills') or []) or 'none yet'}\n\n"
        f"CANDIDATE PROFILE (only facts present here may be referenced — never invent candidate info):\n"
        f"{build_profile_text(state)}\n"
    )

def history_text(state: InterviewerState) -> str:
    history = state.get("conversation_history") or []
    if not history:
        return "(none — this is the very start of the conversation)"
    return json.dumps(history, ensure_ascii=False)[:8000]

def asked_questions_text(state: InterviewerState) -> str:
    asked = state.get("asked_questions") or []
    if not asked:
        return "(none)"
    return json.dumps(asked, ensure_ascii=False)[:3000]

def build_turn_prompt(state: InterviewerState) -> str:
    return (
        base_prompt(state)
        + f"\nCONVERSATION HISTORY (full memory of the interview so far):\n{history_text(state)}\n"
        + f"\nQUESTIONS ALREADY ASKED — never repeat or rephrase these:\n{asked_questions_text(state)}\n"
        + f"\nLATEST CANDIDATE ANSWER:\n{state.get('latest_candidate_response') or '(empty)'}\n\n"
        "Instructions:\n"
        "- Carefully understand the candidate's complete answer. Analyze what they said, skills demonstrated, "
        "missing details, relevant evidence, and which skills still need evaluation.\n"
        "- Choose ONE action: FOLLOW_UP (good answer, explore one more aspect), DEEPEN (answer too short/shallow), "
        "CLARIFY (answer unclear or ambiguous), VERIFY (candidate made a claim to verify with concrete evidence), "
        "NEXT_TOPIC (current skill is sufficiently evaluated — move to the next required skill), "
        "END (interview complete).\n"
        "- spoken_response: a short, natural, conversational acknowledgment or transition (1-2 sentences).\n"
        "- next_question: one clear, focused spoken question grounded in the candidate's resume, LinkedIn, GitHub, "
        "projects, or their actual answer. For END, set next_question to null. Never repeat a question already asked.\n"
        "- target_skill: the skill this turn targets. For NEXT_TOPIC, pick the next un-evaluated required skill.\n"
        "- evidence_used: list which sources informed this turn: 'resume', 'linkedin', 'github', 'conversation'.\n"
        "Return ONLY valid JSON in this exact shape:\n"
        '{"action": "FOLLOW_UP|DEEPEN|CLARIFY|VERIFY|NEXT_TOPIC|END", "spoken_response": str, '
        '"next_question": str or null, "target_skill": str, "answer_summary": str, '
        '"evidence_used": ["resume","linkedin","github","conversation"], '
        '"skills_demonstrated": [str], "missing_details": [str], "skills_still_needed": [str]}'
    )

def build_greeting_prompt(state: InterviewerState) -> str:
    return (
        base_prompt(state)
        + f"\nQUESTIONS ALREADY ASKED — never repeat or rephrase these:\n{asked_questions_text(state)}\n"
        + "\nThis is the very first moment of the interview. Greet the candidate naturally and warmly, "
        "introduce the conversation briefly, and ask ONE clear opening question about their experience "
        "relevant to this role.\n"
        "Return ONLY valid JSON in this exact shape:\n"
        '{"action": "NEXT_TOPIC", "spoken_response": str, "next_question": str, "target_skill": str, '
        '"answer_summary": "", "evidence_used": ["resume","linkedin","github"], '
        '"skills_demonstrated": [], "missing_details": [], "skills_still_needed": []}'
    )
