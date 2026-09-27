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
        parts.append(f"Candidate Name: {cand['fullName']}")
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
        parts.append(f"GITHUB PORTFOLIO:\n{json.dumps(github, default=str)[:1500]}")

    linkedin = ctx.get("social", {}).get("linkedin")
    if linkedin:
        parts.append(f"LINKEDIN PROFILE:\n{json.dumps(linkedin, default=str)[:1500]}")

    projects = ctx.get("projects") or []
    if projects:
        parts.append(f"PROJECTS:\n{json.dumps(projects, default=str)[:1500]}")

    experience = ctx.get("experience") or []
    if experience:
        parts.append(f"WORK EXPERIENCE:\n{json.dumps(experience, default=str)[:1500]}")

    job = ctx.get("job") or {}
    if job.get("description"):
        parts.append(f"TARGET ROLE SPECIFICATION:\n{str(job['description'])[:2000]}")

    focus = ctx.get("interviewFocus") or []
    if focus:
        focus_lines = [f"[{s.get('sourceType')}] {s.get('content')}" for s in focus if isinstance(s, dict)]
        if focus_lines:
            parts.append("RELEVANT HIGHLIGHTS:\n" + "\n".join(focus_lines)[:2000])

    return "\n\n".join(parts)

def stage_for_skill(skill: str) -> str:
    skill_lower = skill.lower()
    if any(k in skill_lower for k in ("communication", "behavioral", "culture", "team", "collab", "leadership")):
        return "behavioral"
    if any(k in skill_lower for k in ("project", "architecture", "github", "portfolio", "system design")):
        return "project"
    return "technical"

def base_prompt(state: InterviewerState) -> str:
    job_title = state.get("job_title") or "the position"
    current_skill = state.get("current_skill") or "relevant background"
    turn_number = state.get("turn_number", 0)

    return (
        "=== ENTERPRISE AI INTERVIEWER SYSTEM DIRECTIVE ===\n"
        "You are an empathetic, seasoned, and unbiased Lead Technical & Hiring Interviewer conducting a real-time voice interview.\n"
        f"Position: {job_title}\n"
        f"Current Interview Turn: #{turn_number + 1}\n"
        f"Active Competency Focus: {current_skill}\n"
        f"Required Competencies: {', '.join(state.get('skills_to_evaluate') or [])}\n"
        f"Already Evaluated Competencies: {', '.join(state.get('evaluated_skills') or []) or 'None yet'}\n\n"
        "=== CORE HUMAN-LIKE CONVERSATIONAL PRINCIPLES ===\n"
        "1. NATURAL CONVERSATIONAL FLOW & PACING:\n"
        "   - Never rapid-fire intense algorithmic or ultra-abstract trivia without conversational context.\n"
        "   - Progression Framework:\n"
        "     * Turn 1 (Opening): Warm hospitality, setting candidate at ease, open-ended career/background introduction.\n"
        "     * Turns 2-4 (Foundation & Projects): Explore recent work, architecture choices, and notable challenges from their resume/projects.\n"
        "     * Turns 5-7 (Technical Deep-Dive): Dive into problem-solving trade-offs, system scalability, and core competency scenarios.\n"
        "     * Turn 8+ (Behavioral Synthesis & Closing): Team collaboration, lessons learned, and gracious session wrap-up.\n"
        "2. ACTIVE LISTENING & EMPATHY:\n"
        "   - spoken_response MUST genuinely reflect and acknowledge key insights from the candidate's last answer (e.g., 'That makes a lot of sense regarding how you handled caching...', 'Great point on separating the worker queues...').\n"
        "   - Connect the next question smoothly to what they just shared or gracefully bridge to the next topic.\n"
        "3. ABSOLUTE FAIRNESS & ZERO-BIAS MANDATE:\n"
        "   - Evaluate candidates purely on factual engineering competence, logical problem decomposition, trade-off awareness, and clarity of thought.\n"
        "   - Completely ignore accent, dialect, minor spoken hesitations, or informal conversational phrasing.\n"
        "   - Never assume prior knowledge of proprietary internal systems not mentioned in their profile.\n"
        "4. ONE CONCISE QUESTION AT A TIME:\n"
        "   - Ask only ONE focused, conversational question. Do not compound multiple complex questions into a single turn.\n\n"
        "=== CANDIDATE PROFILE (Strict Ground Truth) ===\n"
        f"{build_profile_text(state)}\n"
    )

def history_text(state: InterviewerState) -> str:
    history = state.get("conversation_history") or []
    if not history:
        return "(none — start of session)"
    return json.dumps(history, ensure_ascii=False)[:8000]

def asked_questions_text(state: InterviewerState) -> str:
    asked = state.get("asked_questions") or []
    if not asked:
        return "(none)"
    return json.dumps(asked, ensure_ascii=False)[:3000]

def build_turn_prompt(state: InterviewerState) -> str:
    return (
        base_prompt(state)
        + f"\n=== DIALOGUE TRANSCRIPT SO FAR ===\n{history_text(state)}\n"
        + f"\n=== QUESTIONS PREVIOUSLY ASKED (Do NOT repeat or rephrase) ===\n{asked_questions_text(state)}\n"
        + f"\n=== LATEST CANDIDATE SPOKEN RESPONSE ===\n{state.get('latest_candidate_response') or '(silence / inaudible)'}\n\n"
        "=== INSTRUCTIONS FOR NEXT TURN ===\n"
        "Analyze the candidate's response with deep technical discernment and conversational warmth:\n"
        "1. Select the most appropriate next action:\n"
        "   - FOLLOW_UP: Good answer; delve into a specific technical decision or trade-off they mentioned.\n"
        "   - DEEPEN: Response was slightly brief or surface-level; politely prompt for specific architecture or implementation specifics.\n"
        "   - CLARIFY: Response had ambiguities or skipped core constraints; ask for targeted clarification.\n"
        "   - VERIFY: Candidate referenced a major achievement or metric; ask about their individual contribution and tooling.\n"
        "   - NEXT_TOPIC: Current competency is sufficiently validated; smoothly bridge to the next required skill.\n"
        "   - END: All key competencies have been explored or max turn depth reached; conclude graciously.\n"
        "2. spoken_response: 1 natural, conversational sentence acknowledging what they explained.\n"
        "3. next_question: 1 clear, engaging spoken question. For END, set next_question to null.\n"
        "4. Return ONLY valid JSON in this exact structure:\n"
        '{"action": "FOLLOW_UP|DEEPEN|CLARIFY|VERIFY|NEXT_TOPIC|END", '
        '"spoken_response": str, "next_question": str or null, "target_skill": str, '
        '"answer_summary": str, "evidence_used": ["resume","linkedin","github","conversation"], '
        '"skills_demonstrated": [str], "missing_details": [str], "skills_still_needed": [str]}'
    )

def build_greeting_prompt(state: InterviewerState) -> str:
    cand_name = (state.get("candidate_context") or {}).get("candidate", {}).get("fullName") or "there"
    job_title = state.get("job_title") or "this role"

    return (
        base_prompt(state)
        + f"\n=== QUESTIONS PREVIOUSLY ASKED ===\n{asked_questions_text(state)}\n\n"
        "=== GREETING & ICEBREAKER OBJECTIVE ===\n"
        "This is the opening moment of the interview.\n"
        "1. Greet the candidate warmly by name (if available) with professional hospitality and enthusiasm.\n"
        f"2. Introduce yourself as the AI interviewer for {job_title}.\n"
        "3. Ask an inviting, open-ended warmup question inviting them to briefly introduce their background, what they've been focusing on lately, or what excites them about this domain.\n"
        "4. Do NOT jump into heavy technical trivia or rigid algorithms on this turn. Set a welcoming, professional atmosphere.\n"
        "Return ONLY valid JSON in this exact shape:\n"
        '{"action": "NEXT_TOPIC", "spoken_response": str, "next_question": str, "target_skill": "Introduction & Background", '
        '"answer_summary": "", "evidence_used": ["resume","linkedin","github"], '
        '"skills_demonstrated": [], "missing_details": [], "skills_still_needed": []}'
    )
