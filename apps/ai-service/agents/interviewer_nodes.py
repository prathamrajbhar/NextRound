import logging
import json
from services.llm_service import generate_text, extract_json_object
from agents.interviewer_types import MAX_TURNS, InterviewerState
from agents.interviewer_prompts import (
    derive_required_skills,
    build_greeting_prompt,
    build_turn_prompt,
    stage_for_skill,
)
from agents.interviewer_guards import (
    guard_duplicates,
    heuristic_analysis,
)
from agents.interviewer_turn import persist_turn
from agents.interviewer_scoring import finalize_scores_node

logger = logging.getLogger("interviewer_agent")

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

    required = derive_required_skills(state)
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
        raw = generate_text(build_greeting_prompt(state), force_provider="groq")
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

    raw = generate_text(build_turn_prompt(state), force_provider="groq")
    analysis = extract_json_object(raw) if raw else None
    if not analysis:
        analysis = heuristic_analysis(state)

    analysis = guard_duplicates(state, analysis)
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

def generate_question_node(state: InterviewerState) -> InterviewerState:
    persist_turn(state)
    return state

def generate_follow_up_node(state: InterviewerState) -> InterviewerState:
    state["follow_up_depth"] = state.get("follow_up_depth", 0) + 1
    persist_turn(state)
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
    state["current_stage"] = stage_for_skill(str(target or ""))
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
