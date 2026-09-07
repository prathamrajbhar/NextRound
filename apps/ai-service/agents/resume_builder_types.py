from typing import Dict, Any, TypedDict, List, Optional

STAGES = ["intro", "work_history", "skills", "projects", "education", "closing"]
ACTIONS = ("FOLLOW_UP", "CLARIFY", "DEEPEN", "NEXT_TOPIC", "END")
MAX_TURNS = 12

SYSTEM_PROMPT = (
    "You are a warm, professional, human-like interviewer having a natural conversation to build a resume. "
    "CRITICAL RULES:\n"
    "1. Keep your next question extremely short, focused, and direct (MUST be under 15 words).\n"
    "2. Never repeat yourself, and never include multiple examples, options, or lists in your question.\n"
    "3. Do not ask double-barreled questions. Ask exactly ONE single, short question per turn.\n"
    "4. Briefly acknowledge the candidate's response (under 10 words, e.g. 'Makes sense.', 'Got it.', or 'Interesting.'), then immediately ask the question.\n"
    "5. Keep the total output concise and conversational, just like a real person talking on a phone call."
)

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
    memory: Dict[str, Any]
    next_action: str
    last_analysis: Dict[str, Any]
