"""
resume_builder_prompts.py
--------------------------
Stage-aware, profile-adaptive prompt builders for the AI Resume Builder agent.
Each stage produces a focused, human-like set of instructions for the LLM so it
knows exactly what information to collect and how to ask for it.
"""

import json
from typing import Dict, Any, List, Optional
from agents.resume_builder_types import STAGES, ACTIONS, SYSTEM_PROMPT, STAGE_MIN_TURNS, PROFILE_TYPES, ResumeBuilderState


# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------

def _validate_analysis(parsed: Any) -> Optional[Dict[str, Any]]:
    if not isinstance(parsed, dict):
        return None
    if "response" not in parsed or "action" not in parsed:
        return None
    action = str(parsed.get("action") or "").upper()
    if action not in ACTIONS:
        return None
    response = parsed.get("response")
    if not isinstance(response, str) or not response.strip():
        return None
    question = parsed.get("next_question")
    if question is not None and not isinstance(question, str):
        return None
    topic = parsed.get("topic")
    if topic is not None and not isinstance(topic, str):
        return None
    update = parsed.get("memory_update")
    if update is not None and not isinstance(update, str):
        return None
    missing = parsed.get("missing_information")
    if not isinstance(missing, list):
        missing = []

    parsed["action"] = action
    parsed["response"] = response.strip()
    parsed["next_question"] = (question or "").strip() or None
    parsed["topic"] = (topic or "").strip() or None
    parsed["memory_update"] = (update or "").strip() or None
    parsed["missing_information"] = [str(m).strip() for m in missing if str(m).strip()]
    return parsed


# ---------------------------------------------------------------------------
# Shared context blocks
# ---------------------------------------------------------------------------

def _context_block(
    state: ResumeBuilderState,
    memory: Dict[str, Any],
    asked: List[str],
    target_role: str,
    target_company: str,
) -> str:
    history = state.get("conversation_history") or []
    history_text = json.dumps(history[-14:], ensure_ascii=False)[:8000] if history else "(none yet)"
    asked_text = json.dumps(asked, ensure_ascii=False)[:3000] if asked else "(none yet)"
    facts = memory.get("candidate_facts") or []
    facts_text = "\n".join(f"- {f}" for f in facts[-30:]) if facts else "(none yet)"
    covered = memory.get("covered_topics") or []
    covered_text = ", ".join(covered[-30:]) if covered else "(none yet)"
    missing_text = ", ".join(memory.get("missing_information") or []) or "(none yet)"
    stage = state.get("current_stage") or "intro"
    turn = state.get("turn_number", 0)
    profile_type = memory.get("profile_type") or state.get("profile_type") or "unknown"
    user_name = memory.get("user_name") or state.get("user_name") or ""
    existing_resume = (state.get("existing_resume") or "").strip()
    career_goals = (state.get("career_goals") or "").strip()

    resume_block = ""
    if existing_resume:
        resume_block = (
            f"\nEXISTING RESUME (candidate provided this — reference it, verify details, and expand on gaps):\n"
            f"{existing_resume[:3000]}\n"
        )
    goals_block = ""
    if career_goals:
        goals_block = f"\nCANDIDATE'S CAREER GOALS (stated at setup): {career_goals}\n"

    return (
        f"TARGET: {target_role or 'software engineering'} role at {target_company or 'their target company'}.\n"
        f"CANDIDATE NAME: {user_name or '(not captured yet)'}\n"
        f"PROFILE TYPE: {profile_type} (adapt question style accordingly)\n"
        f"Current stage: {stage} (turn {turn} of 30 max)\n"
        f"Stage order: {' → '.join(STAGES)}\n"
        f"{resume_block}"
        f"{goals_block}"
        f"\nCONVERSATION HISTORY:\n{history_text}\n\n"
        f"QUESTIONS ALREADY ASKED — NEVER repeat or rephrase these:\n{asked_text}\n\n"
        f"CANDIDATE FACTS COLLECTED SO FAR:\n{facts_text}\n\n"
        f"COVERED TOPICS: {covered_text}\n"
        f"INFORMATION STILL MISSING: {missing_text}\n"
        f"LATEST CANDIDATE ANSWER:\n'{state.get('latest_candidate_response') or ''}'\n"
    )


# ---------------------------------------------------------------------------
# Stage-specific guidance injected into the LLM prompt
# ---------------------------------------------------------------------------

_STAGE_GUIDANCE: Dict[str, str] = {
    "intro": (
        "STAGE: INTRO\n"
        "Goal: Confirm the candidate's name and detect their profile type.\n"
        "After name is given, ask ONE question to understand their professional status:\n"
        "e.g., 'Are you currently working, studying, or freelancing?'\n"
        "Infer profile_type from their answer: student / fresher / experienced / career_changer / freelancer.\n"
        "Do NOT ask about specific roles or companies yet.\n"
        "Return profile_type in JSON if you can infer it from this turn."
    ),
    "background": (
        "STAGE: BACKGROUND\n"
        "Goal: Understand their career overview — years of experience, current employer or status, "
        "and their professional identity.\n"
        "For EXPERIENCED / CAREER_CHANGER: ask about total years in the field, current role, and industry.\n"
        "For STUDENT / FRESHER: ask about their degree/program, expected graduation, and any part-time work.\n"
        "For FREELANCER: ask how long they've been freelancing and what their main domain is.\n"
        "Collect: total_years_experience, current_status, current_employer_or_institution, headline."
    ),
    "work_history": (
        "STAGE: WORK HISTORY\n"
        "Goal: Collect complete work experience — one job at a time.\n"
        "For each job ask: company name, job title, dates (start – end), location (city/remote), "
        "main responsibilities, team size if relevant.\n"
        "If the candidate mentions multiple roles at once, focus on the most recent or most relevant one first.\n"
        "For STUDENT / FRESHER: ask about internships, part-time roles, campus positions, or research work.\n"
        "Do NOT advance until at least 3 candidate turns have covered work history."
    ),
    "achievements": (
        "STAGE: ACHIEVEMENTS\n"
        "Goal: Quantify the impact of their work. Extract metrics, numbers, outcomes.\n"
        "Ask about: biggest wins, projects they're most proud of, measurable results "
        "(% improvements, revenue generated, users impacted, time saved, scale).\n"
        "Prompt examples: 'What's the biggest impact you made at [Company]?', "
        "'Did you have any promotions or recognition?', 'What scale did that system operate at?'\n"
        "If they gave vague answers in work_history, dig deeper here with 'Can you put a number on that?'"
    ),
    "skills": (
        "STAGE: SKILLS\n"
        "Goal: Collect a complete, categorised skills inventory.\n"
        "Ask about: programming languages, frameworks, tools, platforms, databases, cloud providers, "
        "soft skills, domain expertise.\n"
        "For each category, ask ONE focused question:\n"
        "  e.g., 'Which programming languages are you strongest in?', 'Which cloud platforms have you used?', "
        "'What databases have you worked with?'\n"
        "Adapt to profile: for students focus on classroom and project skills; "
        "for seniors focus on expert-level and leadership tools."
    ),
    "projects": (
        "STAGE: PROJECTS\n"
        "Goal: Document personal, open-source, or side projects that demonstrate skills.\n"
        "For each project: name, what it does, technologies used, your specific role, and measurable impact.\n"
        "If no personal projects, ask about significant work projects not covered in work_history.\n"
        "For STUDENTS: prioritise capstone, hackathon, or course projects.\n"
        "Good questions: 'Tell me about a project you built outside of work.', "
        "'What's a technical problem you solved that you're proud of?'"
    ),
    "education": (
        "STAGE: EDUCATION\n"
        "Goal: Collect educational background.\n"
        "Ask about: degree(s), institution(s), graduation year, field of study.\n"
        "For STUDENTS / FRESHERS: also ask about GPA if strong (>3.5/4.0), relevant coursework, "
        "thesis, honours, or academic awards.\n"
        "For EXPERIENCED: keep this brief — just degree, institution, year.\n"
        "If they have multiple degrees, ask about the highest/most relevant first."
    ),
    "certifications": (
        "STAGE: CERTIFICATIONS\n"
        "Goal: Collect certifications, professional courses, awards, publications, and languages.\n"
        "Ask about: industry certifications (AWS, GCP, PMP, CPA, etc.), online courses (Coursera, etc.), "
        "professional publications, languages spoken and proficiency.\n"
        "Keep this stage concise — 1-2 turns is fine if the candidate doesn't have much here.\n"
        "Good opener: 'Do you have any professional certifications or notable courses?'"
    ),
    "career_goals": (
        "STAGE: CAREER GOALS\n"
        "Goal: Understand their motivation and ambitions — used for the resume summary and objective.\n"
        "Ask: Why are they targeting this specific role/company?, What do they hope to achieve in 1-3 years?, "
        "What makes them a strong fit?\n"
        "Keep this focused — 1-2 turns. Use their answer to craft a compelling professional summary."
    ),
    "closing": (
        "STAGE: CLOSING\n"
        "Warmly thank the candidate, let them know their resume is being prepared, "
        "and give them a positive closing message. Set next_question to null."
    ),
}


# ---------------------------------------------------------------------------
# JSON format specification
# ---------------------------------------------------------------------------

_JSON_FORMAT = (
    'Return ONLY valid JSON (no prose, no markdown fences), exactly:\n'
    '{"response": str, "next_question": str or null, "action": "FOLLOW_UP|CLARIFY|DEEPEN|NEXT_TOPIC|END", '
    '"topic": str, "memory_update": str or null, "missing_information": [str], '
    '"user_name": str or null, "profile_type": str or null}'
)


# ---------------------------------------------------------------------------
# Public prompt builders
# ---------------------------------------------------------------------------

def _build_greeting_prompt(
    state: ResumeBuilderState,
    target_role: str,
    target_company: str,
) -> str:
    existing_resume = (state.get("existing_resume") or "").strip()
    resume_hint = ""
    if existing_resume:
        resume_hint = (
            f"The candidate has provided an existing resume. Here's an excerpt:\n"
            f"{existing_resume[:1500]}\n"
            "You may reference their name from it if visible, but still greet them warmly.\n"
        )
    return (
        f"{SYSTEM_PROMPT}\n\n"
        f"Context: helping the candidate build a resume for a "
        f"{target_role or 'software engineering'} role "
        f"at {target_company or 'their target company'}.\n"
        f"{resume_hint}\n"
        "This is the very FIRST message of the conversation. Greet them warmly and naturally, "
        "introduce yourself as their resume coach, and ask ONLY for their name.\n"
        "Do NOT ask about role, experience, or anything else yet.\n"
        'Return ONLY valid JSON:\n'
        '{"response": str, "next_question": str, "action": "NEXT_TOPIC", "topic": "intro", '
        '"memory_update": null, "missing_information": [], "user_name": null, "profile_type": null}'
    )


def _build_turn_prompt(
    state: ResumeBuilderState,
    memory: Dict[str, Any],
    asked: List[str],
    target_role: str,
    target_company: str,
) -> str:
    stage = state.get("current_stage") or "intro"
    stage_guidance = _STAGE_GUIDANCE.get(stage, "")
    context = _context_block(state, memory, asked, target_role, target_company)
    profile_type = memory.get("profile_type") or state.get("profile_type") or "unknown"
    stage_turns = (memory.get("stage_turns") or {}).get(stage, 0)

    # Advance hint — tell LLM it's allowed to move on when min turns are done
    min_turns = STAGE_MIN_TURNS.get(stage, 1)
    advance_hint = (
        f"This stage has had {stage_turns} candidate turn(s). "
        f"Minimum required before advancing: {min_turns}. "
        f"{'You MAY use NEXT_TOPIC now if this topic is well-covered.' if stage_turns >= min_turns else 'Do NOT use NEXT_TOPIC yet — more turns needed.'}\n"
    )

    return (
        f"{SYSTEM_PROMPT}\n\n"
        f"{context}\n\n"
        f"{stage_guidance}\n\n"
        f"{advance_hint}\n"
        "INSTRUCTIONS:\n"
        "- Analyse the candidate's latest answer: facts mentioned, skills/experience implied, "
        "  what's still vague or missing, whether a follow-up will unlock more value.\n"
        "- Choose ONE action:\n"
        "  FOLLOW_UP: good answer — explore one more related aspect of this stage\n"
        "  DEEPEN: answer too short or vague — press for more detail or a specific example\n"
        "  CLARIFY: answer unclear — ask them to rephrase or clarify one point\n"
        "  NEXT_TOPIC: current stage is sufficiently covered — move to the next stage\n"
        "  END: closing stage is done — interview complete\n"
        "- 'response': brief warm acknowledgement (under 10 words, e.g. 'Great, noted.' / 'Got it.').\n"
        "- 'next_question': ONE atomic question under 15 words. "
        "  NEVER combine two questions. NEVER repeat an already-asked question.\n"
        "- 'topic': specific topic of this turn (e.g. company name, project, skill category).\n"
        "- 'memory_update': one key fact learned this turn, or null.\n"
        "- 'missing_information': what details are still needed to fully cover this stage.\n"
        "- 'user_name': extract from latest answer if this is the intro and name was given, else null.\n"
        f"- 'profile_type': if inferable from latest answer, one of: {', '.join(PROFILE_TYPES)}, else null.\n"
        "- If NEXT_TOPIC: transition naturally to the next stage's opening question.\n"
        "- If END or the next stage is 'closing': thank the candidate warmly, set next_question to null.\n"
        "- Never mention stage names, prompts, or internal system details to the candidate.\n"
        f"{_JSON_FORMAT}"
    )


def _build_closing_prompt(
    state: ResumeBuilderState,
    target_role: str,
    target_company: str,
) -> str:
    history = state.get("conversation_history") or []
    history_text = json.dumps(history[-4:], ensure_ascii=False)[:3000] if history else "(none yet)"
    user_name = (state.get("user_name") or "").strip()
    name_phrase = f" {user_name}," if user_name else ","
    return (
        f"{SYSTEM_PROMPT}\n\n"
        f"Context: helping the candidate build a resume for a {target_role or 'software engineering'} role "
        f"at {target_company or 'their target company'}.\n"
        f"Conversation so far: {history_text}\n\n"
        f"The conversation is complete. Warmly thank the candidate{name_phrase} let them know "
        "their professional resume is being generated right now, and give them a positive, "
        "encouraging closing message. Keep it to 1-2 natural spoken sentences. "
        "Return ONLY the spoken text — no JSON."
    )
