import logging
import json
from typing import Dict, Any, TypedDict, List, Optional
from services.llm_service import generate_text, extract_json_object

logger = logging.getLogger("resume_builder_agent")

STAGES = ["intro", "work_history", "skills", "projects", "education", "closing"]


class ResumeBuilderState(TypedDict, total=False):
    session_id: str
    target_role: str
    target_company: str
    current_stage: str
    turn_number: int
    latest_candidate_response: str
    conversation_history: List[Dict[str, Any]]
    latest_ai_response: str
    realtime_insight: Optional[str]
    is_complete: bool


def run_resume_builder_agent(state: ResumeBuilderState) -> ResumeBuilderState:
    """Runs one stage turn for the AI Voice Resume Builder Agent."""
    target_role = state.get("target_role")
    target_company = state.get("target_company")
    current_stage = state.get("current_stage") or "intro"
    turn = state.get("turn_number", 0) + 1
    state["turn_number"] = turn

    history = state.get("conversation_history", [])
    candidate_input = state.get("latest_candidate_response", "").strip()

    # Determine next stage
    stage_idx = STAGES.index(current_stage) if current_stage in STAGES else 0
    if turn % 2 == 0 and stage_idx < len(STAGES) - 1:
        stage_idx += 1
        current_stage = STAGES[stage_idx]
        state["current_stage"] = current_stage

    prompt = (
        f"You are a friendly, highly professional peer engineering manager helping the candidate construct a powerful, ATS-optimized resume.\n"
        f"Target Role: {target_role or ''} at {target_company or ''}.\n"
        f"Current Stage: {current_stage}\n"
        f"Turn: {turn}\n"
        f"History: {json.dumps(history[-6:])}\n"
        f"Candidate Input: '{candidate_input}'\n\n"
        f"Respond in JSON format with two fields:\n"
        f"1. 'response': A highly natural, warm, conversational response/question. React directly to what the candidate just said. Do NOT sound like a robot or use canned templates like 'Hello! I am excited to help you...' or generic phrases. Avoid long bulleted checklists. Ask only one specific question at a time to build their resume dynamically. Sound like you are pair-reviewing their resume over coffee.\n"
        f"2. 'realtime_insight': A brief extraction or tip highlighting a quantifiable metric or strong keyword derived from candidate input."
    )
    parsed = extract_json_object(generate_text(prompt, force_provider="groq"))
    ai_response = (parsed or {}).get("response")
    insight = (parsed or {}).get("realtime_insight") if parsed else None

    # A turn without real LLM output must fail — the caller raises a proper HTTP
    # error instead of receiving canned text.
    if not ai_response:
        raise RuntimeError("Resume builder LLM returned no response for this turn.")

    state["latest_ai_response"] = ai_response
    state["realtime_insight"] = insight
    state["is_complete"] = current_stage == "closing" or turn >= 10

    return state
