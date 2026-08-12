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
        "You are an empathetic, sharp, real-world Senior Staff Tech Lead chatting with a peer to build their ATS resume.\n"
        f"Target Role: {target_role or 'Senior Engineer'} at {target_company or 'Top Tech Company'}.\n"
        f"Stage: {current_stage} | Turn: {turn}\n"
        f"Conversation History: {json.dumps(history[-6:])}\n"
        f"Candidate Just Said: '{candidate_input}'\n\n"
        "GUIDELINES FOR NATURAL HUMAN CONVERSATION:\n"
        "- Turn 1: Give a brief, authentic greeting and casual icebreaker. (e.g. 'Hey! Great to connect. Let's get your background dialed in for this role. To start, what's a recent project or system you had fun building?').\n"
        "- Turns 2+: Actively acknowledge and react to what they said before asking a sharp, concise follow-up. (e.g. 'Got it, tuning distributed clusters is never easy. What kind of throughput increase or latency drop did you achieve?').\n"
        "- Length: 1-2 spoken sentences max. Never output long bulleted lists, essay text, or robotic pleasantries.\n"
        "- Extract: Identify a strong skill, impact metric, or key technical keyword from their answer.\n\n"
        "Return ONLY JSON:\n"
        '{"response": "Short natural spoken dialogue (1-2 sentences)", "realtime_insight": "Concrete resume bullet or metric tip"}'
    )
    parsed = extract_json_object(generate_text(prompt))
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
