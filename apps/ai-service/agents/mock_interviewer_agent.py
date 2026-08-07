import logging
import json
import re
from typing import Dict, Any, TypedDict, List, Optional
from core.config import settings

logger = logging.getLogger("mock_interviewer_agent")

genai_client = None
if settings.gemini_api_key:
    try:
        from google import genai
        genai_client = genai.Client(api_key=settings.gemini_api_key)
    except Exception as e:
        logger.warning(f"Failed to initialize GenAI client in mock_interviewer_agent: {e}")


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
    topic = state.get("topic", "System Design & Architecture")
    difficulty = state.get("difficulty", "medium")
    target_role = state.get("target_role", "Software Engineer")
    target_company = state.get("target_company", "Tech Enterprise")
    history = state.get("conversation_history", [])
    candidate_input = state.get("latest_candidate_response", "").strip()
    turn = state.get("turn_number", 0) + 1
    state["turn_number"] = turn

    ai_response = ""
    hint = None

    if not genai_client:
        state["latest_ai_response"] = ""
        state["coaching_hint"] = None
        state["is_complete"] = turn >= 6
        return state

    try:
        prompt = (
            f"You are NextRound AI Mock Interviewer simulating a practice interview.\n"
            f"Role: {target_role} at {target_company}\n"
            f"Topic: {topic} (Difficulty: {difficulty})\n"
            f"Turn: {turn}\n"
            f"Conversation History: {json.dumps(history[-6:])}\n"
            f"Latest Candidate Response: '{candidate_input}'\n\n"
            f"Respond in JSON format with two fields:\n"
            f"1. 'response': The next natural, realistic interview question or follow-up from the interviewer (1-3 sentences).\n"
            f"2. 'coaching_hint': A brief, actionable real-time tip for the candidate on how to structure their answer (e.g., 'Use STAR format', 'Quantify metrics', 'Address scalability edge cases')."
        )
        res = genai_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        if res and res.text:
            match = re.search(r"\{.*\}", res.text, re.DOTALL)
            if match:
                parsed = json.loads(match.group(0))
                ai_response = parsed.get("response", "")
                hint = parsed.get("coaching_hint", None)
    except Exception as e:
        logger.warning(f"GenAI mock turn warning: {e}")

    state["latest_ai_response"] = ai_response or ""
    state["coaching_hint"] = hint
    state["is_complete"] = turn >= 6

    return state
