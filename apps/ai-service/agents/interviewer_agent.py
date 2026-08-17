import logging
import json
import re
from typing import Dict, Any, Optional, TypedDict, List
from services.llm_service import generate_text, extract_json_object

logger = logging.getLogger("interviewer_agent")

from core.langgraph_shim import LANGGRAPH_AVAILABLE, StateGraph, END

ACTIONS = ("FOLLOW_UP", "DEEPEN", "CLARIFY", "VERIFY", "NEXT_TOPIC", "END")

MAX_TURNS = 12

class InterviewerState(TypedDict, total=False):
    interview_id: str
    application_id: str
    candidate_id: str
    job_id: str
    job_title: str
    job_rubric: dict
    candidate_resume: str
    candidate_context: dict
    conversation_history: List[Dict[str, str]]
    current_stage: str
    turn_number: int
    scores_so_far: Dict[str, float]
    is_complete: bool
    follow_up_depth: int
    evasion_flags: List[str]
    latest_candidate_response: str
    latest_ai_response: str
    next_action: str
    final_scorecard: dict
    required_skills: List[str]
    skills_to_evaluate: List[str]
    evaluated_skills: List[str]
    current_skill: str
    asked_questions: List[str]
    last_analysis: dict
    turn_records: List[dict]
    evidence_used: List[str]

def _derive_required_skills(state: InterviewerState) -> List[str]:
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

def _build_profile_text(state: InterviewerState) -> str:
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

def _stage_for_skill(skill: str) -> str:
    s = skill.lower()
    if any(k in s for k in ("communication", "behavioral", "culture", "team", "collab", "leadership")):
        return "behavioral"
    if any(k in s for k in ("project", "architecture", "github", "portfolio", "system design")):
        return "project"
    return "technical"

def _base_prompt(state: InterviewerState) -> str:
    job_title = state.get("job_title") or "an open role"
    current_skill = state.get("current_skill") or "relevant experience"
    return (
        f"You are a professional, human-like interviewer conducting a live interview for {job_title}.\n"
        f"Current skill being evaluated: {current_skill}\n"
        f"Required skills to evaluate: {', '.join(state.get('skills_to_evaluate') or [])}\n"
        f"Skills sufficiently evaluated: {', '.join(state.get('evaluated_skills') or []) or 'none yet'}\n\n"
        f"CANDIDATE PROFILE (only facts present here may be referenced — never invent candidate info):\n"
        f"{_build_profile_text(state)}\n"
    )

def _history_text(state: InterviewerState) -> str:
    history = state.get("conversation_history") or []
    if not history:
        return "(none — this is the very start of the conversation)"
    return json.dumps(history, ensure_ascii=False)[:8000]

def _asked_questions_text(state: InterviewerState) -> str:
    asked = state.get("asked_questions") or []
    if not asked:
        return "(none)"
    return json.dumps(asked, ensure_ascii=False)[:3000]

def _build_turn_prompt(state: InterviewerState) -> str:
    return (
        _base_prompt(state)
        + f"\nCONVERSATION HISTORY (full memory of the interview so far):\n{_history_text(state)}\n"
        + f"\nQUESTIONS ALREADY ASKED — never repeat or rephrase these:\n{_asked_questions_text(state)}\n"
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

def _build_greeting_prompt(state: InterviewerState) -> str:
    return (
        _base_prompt(state)
        + f"\nQUESTIONS ALREADY ASKED — never repeat or rephrase these:\n{_asked_questions_text(state)}\n"
        + "\nThis is the very first moment of the interview. Greet the candidate naturally and warmly, "
        "introduce the conversation briefly, and ask ONE clear opening question about their experience "
        "relevant to this role.\n"
        "Return ONLY valid JSON in this exact shape:\n"
        '{"action": "NEXT_TOPIC", "spoken_response": str, "next_question": str, "target_skill": str, '
        '"answer_summary": "", "evidence_used": ["resume","linkedin","github"], '
        '"skills_demonstrated": [], "missing_details": [], "skills_still_needed": []}'
    )


def _normalize_question(q: str) -> str:
    if not q:
        return ""
    q = q.lower()
    q = re.sub(r"[^a-z0-9\s]", " ", q)
    return " ".join(q.split())

def _is_duplicate(candidate_q: str, asked: List[str]) -> bool:
    nq = _normalize_question(candidate_q)
    if not nq:
        return False
    for existing in asked:
        na = _normalize_question(str(existing))
        if not na:
            continue
        if nq == na:
            return True
        if nq in na or na in nq:
            return True
        tokens = set(nq.split())
        if tokens and len(tokens & set(na.split())) / len(tokens) >= 0.9:
            return True
    return False

def _force_next_topic(state: InterviewerState, analysis: dict) -> dict:
    remaining = state.get("skills_to_evaluate") or []
    current = state.get("current_skill")
    target = next((s for s in remaining if s != current), None) or current
    analysis["action"] = "NEXT_TOPIC"
    analysis["target_skill"] = target
    analysis["next_question"] = None
    analysis["spoken_response"] = (
        "Thanks — that gives me what I needed on this. Let's move on to something I'd like to hear more about."
    )
    analysis["evidence_used"] = list(set(analysis.get("evidence_used") or []) | {"conversation"})
    return analysis

def _guard_duplicates(state: InterviewerState, analysis: dict) -> dict:
    if not analysis:
        return analysis
    action = str(analysis.get("action") or "").upper()
    if action == "END":
        return analysis
    question = analysis.get("next_question")
    if not question or not _is_duplicate(str(question), state.get("asked_questions") or []):
        return analysis

    logger.info("InterviewerAgent: generated question duplicates a previous one; forcing next topic.")
    return _force_next_topic(state, analysis)

def _heuristic_analysis(state: InterviewerState) -> dict:
    ans = (state.get("latest_candidate_response") or "").strip()
    current_skill = state.get("current_skill") or "relevant experience"
    remaining = state.get("skills_to_evaluate") or []
    words = ans.split()
    if len(words) < 8 or any(t in ans.lower() for t in ("don't know", "not sure", "skip", "pass", "no idea")):
        return {
            "action": "DEEPEN",
            "spoken_response": "I'd like to understand that a bit better.",
            "next_question": f"Could you walk me through a concrete example related to {current_skill}?",
            "target_skill": current_skill,
            "answer_summary": "Shallow or evasive answer detected.",
            "evidence_used": ["conversation"],
            "skills_demonstrated": [],
            "missing_details": ["specific example", "metrics", "personal contribution"],
            "skills_still_needed": remaining,
        }
    return {
        "action": "NEXT_TOPIC",
        "spoken_response": "Thanks for that.",
        "next_question": None,
        "target_skill": next((s for s in remaining if s != current_skill), current_skill),
        "answer_summary": "Answer received but could not be deeply analyzed.",
        "evidence_used": ["conversation"],
        "skills_demonstrated": [],
        "missing_details": [],
        "skills_still_needed": remaining,
    }

def load_context_node(state: InterviewerState) -> InterviewerState:
    logger.info(f"InterviewerAgent: Loading context for interview {state.get('interview_id')}")
    state["conversation_history"] = state.get("conversation_history") or []
    state["current_stage"] = state.get("current_stage") or "intro"
    state["turn_number"] = state.get("turn_number") or 0
    state["scores_so_far"] = state.get("scores_so_far") or {}
    state["follow_up_depth"] = state.get("follow_up_depth") or 0
    state["evasion_flags"] = state.get("evasion_flags") or []
    state["evaluated_skills"] = state.get("evaluated_skills") or []
    state["turn_records"] = state.get("turn_records") or []

    required = _derive_required_skills(state)
    state["required_skills"] = required
    state["skills_to_evaluate"] = state.get("skills_to_evaluate") or list(required)
    if not state.get("current_skill"):
        state["current_skill"] = state["skills_to_evaluate"][0] if state["skills_to_evaluate"] else required[0]

    state["asked_questions"] = state.get("asked_questions") or []
    for entry in state["conversation_history"]:
        if not isinstance(entry, dict):
            continue
        entry_text = entry.get("text") or entry.get("content") or ""
        if str(entry.get("speaker") or entry.get("role") or "").lower() in ("ai", "interviewer") and entry_text:
            state["asked_questions"].append(str(entry_text))
    return state

def evaluate_last_answer_node(state: InterviewerState) -> InterviewerState:
    if state.get("current_stage") == "closing" and not state.get("latest_candidate_response"):
        return state

    answer = (state.get("latest_candidate_response") or "").strip()
    history = state.get("conversation_history") or []
    has_ai_turns = any(str(e.get("speaker") or e.get("role") or "").lower() in ("ai", "interviewer") for e in history if isinstance(e, dict))
    is_start = (not has_ai_turns) and state.get("turn_number", 0) == 0

    if is_start:
        raw = generate_text(_build_greeting_prompt(state), force_provider="groq")
        analysis = extract_json_object(raw) if raw else None
        if not analysis:
            analysis = {
                "action": "NEXT_TOPIC",
                "spoken_response": f"Hi, thanks for joining. Let's talk about {state.get('current_skill') or 'your experience'}.",
                "next_question": "Tell me a bit about your background and what you've been working on recently.",
                "target_skill": state.get("current_skill") or "technical depth",
                "answer_summary": "",
                "evidence_used": ["resume", "linkedin", "github"],
                "skills_demonstrated": [],
                "missing_details": [],
                "skills_still_needed": state.get("skills_to_evaluate") or [],
            }
        state["last_analysis"] = analysis
        return state

    if not answer:
        state["last_analysis"] = {
            "action": "CLARIFY",
            "spoken_response": "Sorry, I didn't quite catch that. Could you repeat your answer?",
            "next_question": None,
            "target_skill": state.get("current_skill") or "relevant experience",
            "answer_summary": "No usable answer received (silence or unclear audio).",
            "evidence_used": ["conversation"],
            "skills_demonstrated": [],
            "missing_details": [],
            "skills_still_needed": state.get("skills_to_evaluate") or [],
        }
        return state

    raw = generate_text(_build_turn_prompt(state), force_provider="groq")
    analysis = extract_json_object(raw) if raw else None
    if not analysis:
        analysis = _heuristic_analysis(state)

    analysis = _guard_duplicates(state, analysis)
    state["last_analysis"] = analysis
    state["evidence_used"] = analysis.get("evidence_used") or []
    return state

def decide_next_action_node(state: InterviewerState) -> InterviewerState:
    if state.get("current_stage") == "closing" or state.get("turn_number", 0) >= MAX_TURNS:
        state["next_action"] = "close_interview"
        return state

    analysis = state.get("last_analysis") or {}
    action = str(analysis.get("action") or "").upper()
    if action == "END":
        state["next_action"] = "close_interview"
    elif action == "NEXT_TOPIC":
        state["next_action"] = "advance_skill"
    elif action in ("FOLLOW_UP", "DEEPEN", "CLARIFY", "VERIFY"):
        state["next_action"] = "generate_follow_up"
    else:
        state["next_action"] = "generate_question"
    return state

def _persist_turn(state: InterviewerState) -> InterviewerState:
    analysis = state.get("last_analysis") or {}
    spoken = str(analysis.get("spoken_response") or "").strip()
    question = str(analysis.get("next_question") or "").strip()
    combined = " ".join(p for p in (spoken, question) if p).strip()

    state["latest_ai_response"] = combined
    state["turn_number"] = state.get("turn_number", 0) + 1

    history = state.get("conversation_history") or []
    previous_question = ""
    for entry in reversed(history):
        if isinstance(entry, dict) and str(entry.get("speaker") or entry.get("role") or "").lower() in ("ai", "interviewer"):
            previous_question = str(entry.get("text") or entry.get("content") or "")
            break
    history.append({"speaker": "ai", "text": combined, "stage": state.get("current_stage")})
    state["conversation_history"] = history

    if question:
        asked = state.get("asked_questions") or []
        asked.append(question)
        state["asked_questions"] = asked

    turn_records = state.get("turn_records") or []
    turn_records.append({
        "turn": state["turn_number"],
        "question": previous_question,
        "answer": state.get("latest_candidate_response") or "",
        "answer_summary": analysis.get("answer_summary"),
        "action": analysis.get("action"),
        "target_skill": analysis.get("target_skill"),
        "evaluated_skills": list(state.get("evaluated_skills") or []),
        "remaining_skills": list(state.get("skills_to_evaluate") or []),
        "evidence_used": analysis.get("evidence_used") or [],
        "stage": state.get("current_stage"),
    })
    state["turn_records"] = turn_records
    return state

def generate_question_node(state: InterviewerState) -> InterviewerState:
    _persist_turn(state)
    return state

def generate_follow_up_node(state: InterviewerState) -> InterviewerState:
    state["follow_up_depth"] = state.get("follow_up_depth", 0) + 1
    _persist_turn(state)
    return state

def advance_skill_node(state: InterviewerState) -> InterviewerState:
    analysis = state.get("last_analysis") or {}
    target = analysis.get("target_skill") or state.get("current_skill")
    current = state.get("current_skill")
    is_greeting = not (state.get("latest_candidate_response") or "").strip()

    if current and not is_greeting and str(current) != str(target):
        evaluated = state.get("evaluated_skills") or []
        if str(current) not in evaluated:
            evaluated.append(str(current))
        state["evaluated_skills"] = evaluated

        remaining = state.get("skills_to_evaluate") or []
        if str(current) in remaining:
            remaining.remove(str(current))
        if target and str(target) not in remaining and str(target) != str(current):
            remaining.insert(0, str(target))
        state["skills_to_evaluate"] = remaining

    state["current_skill"] = target
    state["follow_up_depth"] = 0
    state["current_stage"] = _stage_for_skill(str(target or ""))
    return generate_question_node(state)

def close_interview_node(state: InterviewerState) -> InterviewerState:
    analysis = state.get("last_analysis") or {}
    history = state.get("conversation_history") or []

    closing = str(analysis.get("spoken_response") or "").strip()
    if not closing:
        prompt = (
            "You are a professional AI interviewer ending a completed interview.\n"
            f"Candidate Context: {json.dumps(history[-4:])}\n\n"
            "Say goodbye to the candidate in 1-2 sentences, thank them for their time, and tell them "
            "their results are being prepared. Do not invent scores."
        )
        closing = generate_text(prompt, force_provider="groq")
        if not closing:
            raise RuntimeError("Interviewer LLM returned no closing message.")

    state["latest_ai_response"] = closing
    state["is_complete"] = True
    history.append({"speaker": "ai", "text": closing, "stage": "closing"})
    state["conversation_history"] = history
    return finalize_scores_node(state)

def _collect_transcript_text(history: Any) -> tuple:
    if not isinstance(history, list):
        return "", 0
    candidate_lines = []
    total = 0
    for entry in history:
        if not isinstance(entry, dict):
            continue
        text = entry.get("text") or entry.get("content") or ""
        if not isinstance(text, str):
            continue
        speaker = str(entry.get("speaker") or entry.get("role") or "").lower()
        total += 1
        if speaker in ("candidate", "human", "interviewee", "me", "user"):
            candidate_lines.append(text.strip())
    return "\n".join(line for line in candidate_lines if line), total

def _gemini_score_transcript(history: Any, job_title: str) -> Optional[Dict[str, Any]]:
    transcript_text, _ = _collect_transcript_text(history)
    if len(transcript_text.strip()) < 40:
        return None
    prompt = (
        f"You are an unbiased technical interviewer evaluating a completed interview for a {job_title} role.\n"
        "Score the candidate's actual answers on three dimensions (0-100): technical_depth, communication, problem_solving.\n"
        "Base every score strictly on the transcript content. Return JSON only.\n\n"
        f"Transcript:\n{transcript_text[:8000]}\n\n"
        'Return JSON: {"technical_depth": float, "communication": float, "problem_solving": float, '
        '"overall_score": float, "summary_feedback": str}'
    )
    return extract_json_object(generate_text(prompt, force_provider="groq"))

def finalize_scores_node(state: InterviewerState) -> InterviewerState:
    scores = state.get("scores_so_far", {})
    history = state.get("conversation_history", [])
    _, turn_count = _collect_transcript_text(history)
    turn_number = state.get("turn_number", 0)
    total_turns = max(turn_count, turn_number, 1)

    tech = comm = prob = composite = summary_feedback = None

    llm = _gemini_score_transcript(history, state.get("job_title") or "")
    if llm:
        tech = round(float(llm["technical_depth"]), 1) if llm.get("technical_depth") is not None else None
        comm = round(float(llm["communication"]), 1) if llm.get("communication") is not None else None
        prob = round(float(llm["problem_solving"]), 1) if llm.get("problem_solving") is not None else None
        if llm.get("overall_score") is not None:
            composite = round(float(llm["overall_score"]), 1)
        summary_feedback = llm.get("summary_feedback")

    if tech is None and scores.get("technical") is not None:
        tech = round(float(scores["technical"]), 1)
    if comm is None and scores.get("communication") is not None:
        comm = round(float(scores["communication"]), 1)
    if prob is None and scores.get("problemSolving") is not None:
        prob = round(float(scores["problemSolving"]), 1)

    if tech is not None or comm is not None or prob is not None:
        if composite is None:
            dims = [d for d in (tech, comm, prob) if d is not None]
            if dims:
                composite = round(sum(dims) / len(dims), 1)
    else:
        raise RuntimeError("No real interview scores were produced; refusing to emit a fabricated scorecard.")

    state["final_scorecard"] = {
        "overall_score": composite,
        "technical_score": tech,
        "communication_score": comm,
        "problem_solving_score": prob,
        "evasion_flags_count": len(state.get("evasion_flags", [])),
        "total_turns": total_turns,
        "summary_feedback": summary_feedback,
        "evaluated_skills": state.get("evaluated_skills") or [],
        "skills_to_evaluate": state.get("skills_to_evaluate") or [],
    }
    return state

if LANGGRAPH_AVAILABLE:
    graph_builder = StateGraph(InterviewerState)

    graph_builder.add_node("load_context", load_context_node)
    graph_builder.add_node("evaluate_last_answer", evaluate_last_answer_node)
    graph_builder.add_node("decide_next_action", decide_next_action_node)
    graph_builder.add_node("generate_question", generate_question_node)
    graph_builder.add_node("generate_follow_up", generate_follow_up_node)
    graph_builder.add_node("advance_skill", advance_skill_node)
    graph_builder.add_node("close_interview", close_interview_node)
    graph_builder.add_node("finalize_scores", finalize_scores_node)

    graph_builder.set_entry_point("load_context")
    graph_builder.add_edge("load_context", "evaluate_last_answer")
    graph_builder.add_edge("evaluate_last_answer", "decide_next_action")

    def route_action(state: InterviewerState) -> str:
        return state.get("next_action", "generate_question")

    graph_builder.add_conditional_edges(
        "decide_next_action",
        route_action,
        {
            "generate_follow_up": "generate_follow_up",
            "generate_question": "generate_question",
            "advance_skill": "advance_skill",
            "close_interview": "close_interview",
        }
    )

    graph_builder.add_edge("generate_question", END)
    graph_builder.add_edge("generate_follow_up", END)
    graph_builder.add_edge("advance_skill", END)
    graph_builder.add_edge("close_interview", "finalize_scores")
    graph_builder.add_edge("finalize_scores", END)

    interviewer_graph = graph_builder.compile()
else:
    interviewer_graph = None

def run_interviewer_agent(state: InterviewerState) -> InterviewerState:
    if interviewer_graph:
        try:
            return interviewer_graph.invoke(state)
        except Exception as e:
            logger.error(f"LangGraph execution error: {e}. Falling back to linear execution.")

    state = load_context_node(state)
    state = evaluate_last_answer_node(state)
    state = decide_next_action_node(state)
    action = state.get("next_action", "generate_question")

    if action == "generate_follow_up":
        state = generate_follow_up_node(state)
    elif action == "advance_skill":
        state = advance_skill_node(state)
    elif action == "close_interview":
        state = close_interview_node(state)
    else:
        state = generate_question_node(state)

    return state
