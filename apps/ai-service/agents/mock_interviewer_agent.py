import logging
import json
from typing import Dict, Any, TypedDict, List, Optional
from services.llm_service import generate_text, extract_json_object

logger = logging.getLogger("mock_interviewer_agent")


class MockInterviewerState(TypedDict, total=False):
    session_id: str
    topic: str
    difficulty: str
    target_role: str
    target_company: str
    focus_areas: List[str]
    current_stage: str
    turn_number: int
    latest_candidate_response: str
    conversation_history: List[Dict[str, Any]]
    latest_ai_response: str
    coaching_hint: Optional[str]
    is_complete: bool
    final_feedback: Optional[Dict[str, Any]]


def run_mock_interviewer_agent(state: MockInterviewerState) -> MockInterviewerState:
    """Runs a turn of the Mock Interviewer Agent with real-time coaching hints."""
    topic = state.get("topic")
    difficulty = state.get("difficulty")
    target_role = state.get("target_role")
    target_company = state.get("target_company")
    history = state.get("conversation_history", [])
    candidate_input = state.get("latest_candidate_response", "").strip()
    turn = state.get("turn_number", 0) + 1
    state["turn_number"] = turn

    prompt = (
        "You are an experienced, authentic Principal Engineer conducting a realistic mock interview.\n"
        f"Role: {target_role or 'Software Engineer'} at {target_company or 'Tech Firm'}\n"
        f"Topic: {topic or 'Technical & Behavioral'} (Difficulty: {difficulty or 'Medium'}) | Turn: {turn}\n"
        f"Conversation History: {json.dumps(history[-6:])}\n"
        f"Candidate Said: '{candidate_input}'\n\n"
        "GUIDELINES FOR NATURAL HUMAN CONVERSATION:\n"
        "- Turn 1: Give a brief, authentic greeting and casual opening question (e.g. 'Hey, thanks for joining! Let's jump into a practice session for the {target_role} role. To start, could you tell me about a challenging technical decision you had to make recently?').\n"
        "- Turns 2+: Actively listen and acknowledge what they said, then ask a sharp, focused follow-up (1-2 spoken sentences).\n"
        "- Style: Keep responses concise and conversational. No robotic boilerplate, no giant lists.\n\n"
        "Return ONLY JSON:\n"
        '{"response": "Spoken dialogue (1-2 sentences)", "coaching_hint": "Actionable STAR/metric hint"}'
    )
    parsed = extract_json_object(generate_text(prompt))
    ai_response = (parsed or {}).get("response")
    hint = (parsed or {}).get("coaching_hint") if parsed else None



    if not ai_response:
        raise RuntimeError("Mock interviewer LLM returned no response for this turn.")

    state["latest_ai_response"] = ai_response
    state["coaching_hint"] = hint
    state["is_complete"] = turn >= 6

    return state
