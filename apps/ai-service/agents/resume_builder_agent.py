import logging
import json
import re
from typing import Dict, Any, TypedDict, List, Optional
from core.config import settings

logger = logging.getLogger("resume_builder_agent")

genai_client = None
if settings.gemini_api_key:
    try:
        from google import genai
        genai_client = genai.Client(api_key=settings.gemini_api_key)
    except Exception as e:
        logger.warning(f"Failed to initialize GenAI client in resume_builder_agent: {e}")

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

    if genai_client:
        try:
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
            res = genai_client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )
            if res and res.text:
                match = re.search(r"\{.*\}", res.text, re.DOTALL)
                if match:
                    parsed = json.loads(match.group(0))
                    ai_response = parsed.get("response", "")
                    insight = parsed.get("realtime_insight", None)
        except Exception as e:
            logger.warning(f"GenAI resume builder turn warning: {e}")

    if not ai_response:
        stage_prompts = {
            "intro": f"Welcome! I'm your AI Resume Builder assistant. To tailor your resume for {target_role}, tell me briefly about your background and top career goals.",
            "work_history": "Let's discuss your recent work experience. What was your job title, key responsibilities, and major achievements?",
            "skills": "What core technical skills, programming languages, tools, and frameworks do you use daily?",
            "projects": "Can you highlight 1 or 2 key projects you've built? What impact or scale did they achieve?",
            "education": "Please share your degree, university name, graduation year, and any relevant certifications.",
            "closing": "Great work! I have captured all details needed. Let's finish up so I can generate your polished ATS-friendly resume.",
        }
        ai_response = stage_prompts.get(current_stage, stage_prompts["intro"])
        insight = f"Focusing on {current_stage.replace('_', ' ')}: try to mention percentages, team size, or technologies used."

    state["latest_ai_response"] = ai_response
    state["realtime_insight"] = insight
    state["is_complete"] = current_stage == "closing" or turn >= 10

    return state
