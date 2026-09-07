import logging
from typing import Dict, Any, List, Optional
from services.llm_service import generate_text, extract_json_object
from agents.resume_builder_types import (
    STAGES,
    ACTIONS,
    MAX_TURNS,
    SYSTEM_PROMPT,
    ResumeBuilderState,
)
from agents.resume_builder_memory import (
    _is_duplicate,
    _normalize_memory,
    _collect_asked_questions,
    _update_memory,
    _derive_insight,
    _next_stage,
)
from agents.resume_builder_prompts import (
    _validate_analysis,
    _build_greeting_prompt,
    _build_turn_prompt,
    _build_closing_prompt,
    _is_unclear_input,
    _heuristic_turn,
    _force_next_topic,
)

logger = logging.getLogger("resume_builder_agent")

def _generate_turn(
    state: ResumeBuilderState,
    memory: Dict[str, Any],
    asked: List[str],
    target_role: str,
    target_company: str,
) -> Optional[Dict[str, Any]]:
    raw = generate_text(_build_turn_prompt(state, memory, asked, target_role, target_company))
    parsed = extract_json_object(raw) if raw else None
    return _validate_analysis(parsed)

def _compose_response(analysis: Dict[str, Any]) -> str:
    parts = []
    if analysis.get("response"):
        parts.append(analysis["response"].strip())
    if analysis.get("next_question"):
        parts.append(analysis["next_question"].strip())
    return " ".join(p for p in parts if p).strip()

def _generate_closing(state: ResumeBuilderState, target_role: str, target_company: str) -> str:
    closing = generate_text(_build_closing_prompt(state, target_role, target_company))
    if closing and closing.strip():
        return closing.strip()
    return "Thanks so much for your time today — I'm preparing your professional resume now."

def _handle_greeting(
    state: ResumeBuilderState,
    memory: Dict[str, Any],
    target_role: str,
    target_company: str,
) -> ResumeBuilderState:
    raw = generate_text(_build_greeting_prompt(state, target_role, target_company))
    analysis = _validate_analysis(extract_json_object(raw)) if raw else None
    if not analysis:
        analysis = {
            "action": "NEXT_TOPIC",
            "response": "Hi, thanks for joining! I'd love to learn a bit about you so we can build a great resume together.",
            "next_question": "Could you start by telling me your full name and the role you're aiming for?",
            "topic": "intro",
            "memory_update": None,
            "missing_information": [],
        }
    analysis["action"] = "NEXT_TOPIC"
    analysis["topic"] = "intro"
    state["last_analysis"] = analysis
    state["next_action"] = "NEXT_TOPIC"
    state["latest_ai_response"] = _compose_response(analysis)
    state["current_stage"] = "intro"
    state["realtime_insight"] = None
    state["is_complete"] = False
    _update_memory(memory, analysis, "")
    return state

def _handle_unclear(state: ResumeBuilderState, memory: Dict[str, Any], current_stage: str) -> ResumeBuilderState:
    answer = (state.get("latest_candidate_response") or "").strip().lower()
    asked_repeat = any(p in answer for p in (
        "repeat", "didn't hear", "didn't catch", "say that again", "what did you say", "what was the question",
    ))
    last_questions = memory.get("previous_questions") or []
    last_question = last_questions[-1] if last_questions else None

    if asked_repeat and last_question:
        response = f"Of course — let me say that again. {last_question}"
        next_question = last_question
    else:
        response = "Sorry, I didn't quite catch that. Could you say it once more?"
        next_question = None

    analysis = {
        "action": "CLARIFY",
        "response": response,
        "next_question": next_question,
        "topic": current_stage,
        "memory_update": None,
        "missing_information": memory.get("missing_information") or [],
    }
    state["last_analysis"] = analysis
    state["next_action"] = "CLARIFY"
    state["latest_ai_response"] = _compose_response(analysis)
    state["realtime_insight"] = None
    state["is_complete"] = False
    return state

def _route_action(state: ResumeBuilderState, analysis: Dict[str, Any]) -> ResumeBuilderState:
    action = str(analysis.get("action") or "").upper()
    current_stage = state.get("current_stage") or "intro"
    if action == "END":
        state["current_stage"] = "closing"
        state["is_complete"] = True
    elif action == "NEXT_TOPIC":
        next_stage = _next_stage(current_stage)
        if next_stage is None or current_stage == "closing":
            state["current_stage"] = "closing"
            state["is_complete"] = True
        else:
            state["current_stage"] = next_stage
            state["is_complete"] = next_stage == "closing"
    else:
        state["current_stage"] = current_stage
        state["is_complete"] = bool(state.get("is_complete")) or current_stage == "closing"
    return state

def run_resume_builder_agent(state: ResumeBuilderState) -> ResumeBuilderState:
    target_role = state.get("target_role")
    target_company = state.get("target_company")
    current_stage = state.get("current_stage") or "intro"
    turn = state.get("turn_number", 0) + 1
    state["turn_number"] = turn

    history = state.get("conversation_history", []) or []
    candidate_input = (state.get("latest_candidate_response") or "").strip()
    memory = _normalize_memory(state.get("memory"))
    state["memory"] = memory

    if turn > MAX_TURNS and not state.get("is_complete"):
        state["current_stage"] = "closing"
        state["is_complete"] = True
        state["latest_ai_response"] = _generate_closing(state, target_role, target_company)
        return state

    is_start = turn == 1 and not candidate_input and not history
    if is_start:
        return _handle_greeting(state, memory, target_role, target_company)

    if _is_unclear_input(candidate_input):
        return _handle_unclear(state, memory, current_stage)

    asked = _collect_asked_questions(memory, history)
    analysis = _generate_turn(state, memory, asked, target_role, target_company)
    if not analysis:
        logger.warning("ResumeBuilderAgent: LLM returned invalid or missing JSON; using heuristic fallback.")
        analysis = _heuristic_turn(state, memory, current_stage)

    if analysis.get("next_question") and _is_duplicate(str(analysis["next_question"]), asked):
        logger.info("ResumeBuilderAgent: generated question duplicates a previous one; forcing next topic.")
        analysis = _force_next_topic(state, memory, analysis, current_stage)

    state["last_analysis"] = analysis
    state["next_action"] = str(analysis.get("action") or "")
    _update_memory(memory, analysis, candidate_input)
    state["latest_ai_response"] = _compose_response(analysis)
    state["realtime_insight"] = _derive_insight(analysis.get("missing_information") or [])

    _route_action(state, analysis)

    if not state.get("is_complete") and turn >= MAX_TURNS:
        state["current_stage"] = "closing"
        state["is_complete"] = True
        state["latest_ai_response"] = _generate_closing(state, target_role, target_company)

    return state
