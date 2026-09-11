"""
resume_builder_agent.py
------------------------
Main orchestrator for the AI Resume Builder voice conversation.
Manages state transitions, stage progression, memory, and LLM calls.
"""

import logging
from typing import Dict, Any, List, Optional
from services.llm.llm_service import generate_text, extract_json_object
from agents.resume_builder_types import (
    STAGES,
    ACTIONS,
    MAX_TURNS,
    STAGE_MIN_TURNS,
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
    _stage_complete,
    _infer_profile_type,
)
from agents.resume_builder_prompts import (
    _validate_analysis,
    _build_greeting_prompt,
    _build_turn_prompt,
    _build_closing_prompt,
)

logger = logging.getLogger("resume_builder_agent")


# ---------------------------------------------------------------------------
# Private helpers
# ---------------------------------------------------------------------------

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
    user_name = state.get("user_name") or ""
    name_suffix = f" {user_name}" if user_name else ""
    return (
        f"Thank you so much{name_suffix} — your professional resume is being prepared right now. "
        "You've done a great job today!"
    )


def _handle_greeting(
    state: ResumeBuilderState,
    memory: Dict[str, Any],
    target_role: str,
    target_company: str,
) -> ResumeBuilderState:
    raw = generate_text(_build_greeting_prompt(state, target_role, target_company))
    analysis = _validate_analysis(extract_json_object(raw)) if raw else None
    if not analysis:
        raise RuntimeError("ResumeBuilderAgent: LLM failed to generate a valid greeting response.")
    analysis["action"] = "NEXT_TOPIC"
    analysis["topic"] = "intro"
    state["last_analysis"] = analysis
    state["next_action"] = "NEXT_TOPIC"
    state["latest_ai_response"] = _compose_response(analysis)
    state["current_stage"] = "intro"
    state["realtime_insight"] = None
    state["is_complete"] = False
    _update_memory(memory, analysis, "", "intro")
    return state


def _route_action(
    state: ResumeBuilderState,
    analysis: Dict[str, Any],
    memory: Dict[str, Any],
) -> ResumeBuilderState:
    action = str(analysis.get("action") or "").upper()
    current_stage = state.get("current_stage") or "intro"

    if action == "END":
        state["current_stage"] = "closing"
        state["is_complete"] = True
        return state

    if action == "NEXT_TOPIC":
        # Enforce minimum turns before allowing stage advance
        if not _stage_complete(memory, current_stage):
            # Ignore NEXT_TOPIC — treat as DEEPEN and stay in current stage
            logger.info(
                f"ResumeBuilderAgent: NEXT_TOPIC rejected for stage '{current_stage}' "
                f"— minimum turns not yet met. Treating as DEEPEN."
            )
            analysis["action"] = "DEEPEN"
            state["current_stage"] = current_stage
            state["is_complete"] = False
            return state

        next_stage = _next_stage(current_stage)
        if next_stage is None or next_stage == "closing":
            state["current_stage"] = "closing"
            state["is_complete"] = True
        else:
            state["current_stage"] = next_stage
            state["is_complete"] = False
        return state

    # FOLLOW_UP / CLARIFY / DEEPEN — stay in current stage
    state["current_stage"] = current_stage
    state["is_complete"] = current_stage == "closing"
    return state


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def run_resume_builder_agent(state: ResumeBuilderState) -> ResumeBuilderState:
    target_role = state.get("target_role") or ""
    target_company = state.get("target_company") or ""
    turn = state.get("turn_number", 0) + 1
    state["turn_number"] = turn

    history = state.get("conversation_history") or []
    candidate_input = (state.get("latest_candidate_response") or "").strip()
    memory = _normalize_memory(state.get("memory"))
    state["memory"] = memory

    # Sync profile_type and user_name from memory back to state for prompt builders
    if memory.get("profile_type") and not state.get("profile_type"):
        state["profile_type"] = memory["profile_type"]
    if memory.get("user_name") and not state.get("user_name"):
        state["user_name"] = memory["user_name"]

    # Force close when max turns reached
    if turn > MAX_TURNS and not state.get("is_complete"):
        logger.info(f"ResumeBuilderAgent: MAX_TURNS ({MAX_TURNS}) reached — forcing close.")
        state["current_stage"] = "closing"
        state["is_complete"] = True
        state["latest_ai_response"] = _generate_closing(state, target_role, target_company)
        return state

    # Greeting — first turn with no candidate input
    is_start = turn == 1 and not candidate_input and not history
    if is_start:
        return _handle_greeting(state, memory, target_role, target_company)

    # Generate turn response
    asked = _collect_asked_questions(memory, history)
    analysis = _generate_turn(state, memory, asked, target_role, target_company)

    if not analysis:
        logger.warning("ResumeBuilderAgent: LLM returned invalid/missing JSON — retrying with clarify fallback.")
        state["latest_ai_response"] = "I didn't quite catch that — could you say that again?"
        return state

    # Duplicate question guard — regenerate instead of silently dropping
    generated_q = analysis.get("next_question") or ""
    if generated_q and _is_duplicate(generated_q, asked):
        logger.info("ResumeBuilderAgent: Generated question duplicates a previous one — asking candidate to elaborate instead.")
        analysis["next_question"] = "Could you tell me a bit more about that?"
        analysis["action"] = "DEEPEN"

    # Update memory with current turn
    current_stage = state.get("current_stage") or "intro"
    _update_memory(memory, analysis, candidate_input, current_stage)

    # Propagate name and profile type from memory to state
    if memory.get("user_name"):
        state["user_name"] = memory["user_name"]
    if memory.get("profile_type"):
        state["profile_type"] = memory["profile_type"]
    # Heuristic fallback for profile type
    if not state.get("profile_type"):
        inferred = _infer_profile_type(memory.get("candidate_facts") or [])
        if inferred:
            state["profile_type"] = inferred
            memory["profile_type"] = inferred

    state["last_analysis"] = analysis
    state["next_action"] = str(analysis.get("action") or "")
    state["latest_ai_response"] = _compose_response(analysis)
    state["realtime_insight"] = _derive_insight(analysis.get("missing_information") or [])

    _route_action(state, analysis, memory)

    # Final max-turn check after routing
    if not state.get("is_complete") and turn >= MAX_TURNS:
        state["current_stage"] = "closing"
        state["is_complete"] = True
        state["latest_ai_response"] = _generate_closing(state, target_role, target_company)

    return state