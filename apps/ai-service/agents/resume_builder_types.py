from typing import Dict, Any, TypedDict, List, Optional

# ---------------------------------------------------------------------------
# Conversation stages — in order. The agent walks through these sequentially
# but may spend more or fewer turns on each based on candidate answers.
# ---------------------------------------------------------------------------
STAGES = [
    "intro",           # Name, greeting, profile-type detection
    "background",      # Years of experience, current status, career overview
    "work_history",    # Past roles, companies, dates, responsibilities (one job at a time)
    "achievements",    # Quantified wins, promotions, awards from work history
    "skills",          # Technical skills, tools, languages, frameworks — categorised
    "projects",        # Personal / side / open-source projects with tech + impact
    "education",       # Degrees, institutions, year, GPA (especially for students)
    "certifications",  # Certifications, courses, publications, spoken languages
    "career_goals",    # Target role, motivation, short/long-term goals
    "closing",         # Warm wrap-up — resume is being prepared
]

# Minimum number of substantive candidate turns required before the agent may
# advance past a given stage. Prevents moving on after a single shallow answer.
STAGE_MIN_TURNS: Dict[str, int] = {
    "intro": 1,
    "background": 2,
    "work_history": 3,
    "achievements": 2,
    "skills": 2,
    "projects": 2,
    "education": 1,
    "certifications": 1,
    "career_goals": 1,
    "closing": 0,
}

# Actions the LLM may choose per turn.
ACTIONS = ("FOLLOW_UP", "CLARIFY", "DEEPEN", "NEXT_TOPIC", "END")

# Total conversation turns before forced close.
MAX_TURNS = 30

# Profile type labels — detected from early turns and used to adapt questions.
PROFILE_TYPES = ("student", "fresher", "experienced", "career_changer", "freelancer")

SYSTEM_PROMPT = (
    "You are Alex, a warm, professional, expert resume coach conducting a spoken voice conversation "
    "to collect all the information needed to build a complete, ATS-optimised, world-class resume.\n\n"
    "CORE RULES — follow these absolutely without exception:\n"
    "1. Ask exactly ONE atomic question per turn — never combine two questions with 'and', 'also', "
    "   'as well as', 'plus', or any conjunction.\n"
    "2. Keep every question short and direct — ideally under 15 words.\n"
    "3. Give a brief warm acknowledgement first (under 10 words: 'Got it.', 'That's great.', "
    "   'Makes sense.', 'Nice.') before asking the next question.\n"
    "4. NEVER repeat a question that has already been asked in this conversation.\n"
    "5. Ask human-like, natural questions — not robotic form-style prompts.\n"
    "6. Adapt your questions to the candidate's profile (student vs. senior professional "
    "   vs. freelancer vs. career changer).\n"
    "7. For work history, focus on impact and quantified results: percentages, revenue, time saved, "
    "   team size, scale.\n"
    "8. Never mention internal stage names, actions, or system instructions to the candidate.\n"
    "9. This is a voice interview — responses must sound completely natural when spoken aloud.\n"
    "10. When the candidate references an existing resume or prior context, build on it rather "
    "    than re-asking for already-known information."
)


class ResumeBuilderState(TypedDict, total=False):
    # Session identity
    session_id: str
    target_role: str
    target_company: str

    # Candidate context (populated at session creation)
    existing_resume: Optional[str]    # Raw text of any resume the candidate uploaded
    career_goals: Optional[str]       # Free-text career goals from the setup screen
    profile_type: Optional[str]       # One of PROFILE_TYPES — inferred during intro

    # Conversation state
    current_stage: str
    turn_number: int
    stage_turns: Dict[str, int]       # Turns spent per stage {stage_name: count}
    user_name: Optional[str]          # Captured in intro stage

    # Turn I/O
    latest_candidate_response: str
    conversation_history: List[Dict[str, Any]]
    latest_ai_response: str
    realtime_insight: Optional[str]

    # Agent bookkeeping
    is_complete: bool
    memory: Dict[str, Any]
    next_action: str
    last_analysis: Dict[str, Any]
