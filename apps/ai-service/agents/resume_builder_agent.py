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
    target_role = state.get("target_role", "Software Engineer")
    target_company = state.get("target_company", "Top Tech Company")
    current_stage = state.get("current_stage", "intro")
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

    ai_response = ""
    insight = None

    prompt = (
        f"You are the NextRound AI Voice Resume Builder Agent.\n"
        f"Goal: Help candidate build an ATS-optimized resume for {target_role} at {target_company}.\n"
        f"Current Stage: {current_stage}\n"
        f"Turn: {turn}\n"
        f"History: {json.dumps(history[-6:])}\n"
        f"Candidate Input: '{candidate_input}'\n\n"
        f"Respond in JSON format with two fields:\n"
        f"1. 'response': Conversational, encouraging question asking for specific quantifiable details, metrics, technologies, or achievements for stage '{current_stage}'.\n"
        f"2. 'realtime_insight': A brief extraction or tip highlighting a quantifiable metric or strong keyword derived from candidate input."
    )
    parsed = extract_json_object(generate_text(prompt))
    if parsed:
        ai_response = parsed.get("response", "")
        insight = parsed.get("realtime_insight", None)

    state["latest_ai_response"] = ai_response or ""
    state["realtime_insight"] = insight
    state["is_complete"] = current_stage == "closing" or turn >= 10

    return state
