from typing import Dict, TypedDict, List

ACTIONS = ("FOLLOW_UP", "DEEPEN", "CLARIFY", "VERIFY", "NEXT_TOPIC", "END")

MAX_TURNS = 12

class InterviewerState(TypedDict, total=False):
    interview_id: str
    application_id: str
    candidate_id: str
    job_id: str
    job_title: str
    job_rubric: dict
    candidate_resume: str
    candidate_context: dict
    conversation_history: List[Dict[str, str]]
    current_stage: str
    turn_number: int
    scores_so_far: Dict[str, float]
    is_complete: bool
    follow_up_depth: int
    evasion_flags: List[str]
    latest_candidate_response: str
    latest_ai_response: str
    next_action: str
    final_scorecard: dict
    required_skills: List[str]
    skills_to_evaluate: List[str]
    evaluated_skills: List[str]
    current_skill: str
    asked_questions: List[str]
    last_analysis: dict
    turn_records: List[dict]
    evidence_used: List[str]
