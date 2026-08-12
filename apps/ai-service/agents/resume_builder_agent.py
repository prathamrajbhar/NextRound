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
        "You are a friendly, conversational helper guiding the user to build a great resume.\n"
        "Use simple, direct English. Do not use complex words or long robotic sentences.\n"
        f"Target Role: {target_role or 'Senior Engineer'} | Stage: {current_stage} | Turn: {turn}\n"
        f"Conversation History: {json.dumps(history[-6:])}\n"
        f"Candidate Just Said: '{candidate_input}'\n\n"
        "STAGES OF PROGRESSION:\n"
        "- intro: Greet the candidate warmly. Ask for their full name, target role, and experience level in simple wording.\n"
        "- work_history: Acknowledge their response. Ask about their work history: company names, roles, and a brief description of their duties.\n"
        "- projects: Ask about recent key projects they built, their role in them, and the stack they used.\n"
        "- skills: Ask about their top technical skills, programming languages, and tools they are good at.\n"
        "- education: Ask about their college degrees, school/university names, graduation years, or any certifications they have.\n"
        "- closing: Thank them and tell them you are now going to generate their professional resume PDF.\n\n"
        "CONVERSATION RULES:\n"
        "1. Speak naturally and keep it friendly. Use simple, conversational words.\n"
        "2. Keep your dialogue short (1-2 sentences maximum). Do not list things or write paragraphs.\n"
        "3. Match the current stage. If the user shares information for the stage, ask about the next stage naturally.\n"
        "4. In 'realtime_insight', provide a simple tip to improve that section of their resume (e.g., 'Tip: Mention the version of React or Node you used').\n\n"
        "Return ONLY JSON:\n"
        '{"response": "Your short spoken response in simple English", "realtime_insight": "One simple resume tip"}'
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
