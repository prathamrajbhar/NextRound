import re
import logging
from typing import List
from agents.interviewer_types import InterviewerState

logger = logging.getLogger("interviewer_agent")

def normalize_question(question_text: str) -> str:
    if not question_text:
        return ""
    cleaned = question_text.lower()
    cleaned = re.sub(r"[^a-z0-9\s]", " ", cleaned)
    return " ".join(cleaned.split())

def is_duplicate(candidate_question: str, asked: List[str]) -> bool:
    normalized_candidate = normalize_question(candidate_question)
    if not normalized_candidate:
        return False
    for existing in asked:
        normalized_existing = normalize_question(str(existing))
        if not normalized_existing:
            continue
        if normalized_candidate == normalized_existing:
            return True
        if normalized_candidate in normalized_existing or normalized_existing in normalized_candidate:
            return True
        tokens = set(normalized_candidate.split())
        if tokens and len(tokens & set(normalized_existing.split())) / len(tokens) >= 0.9:
            return True
    return False

def force_next_topic(state: InterviewerState, analysis: dict) -> dict:
    remaining = state.get("skills_to_evaluate") or []
    current = state.get("current_skill")
    target = next((s for s in remaining if s != current), None) or current
    analysis["action"] = "NEXT_TOPIC"
    analysis["target_skill"] = target
    analysis["next_question"] = None
    analysis["spoken_response"] = (
        "Thanks — that gives me what I needed on this. Let's move on to something I'd like to hear more about."
    )
    analysis["evidence_used"] = list(set(analysis.get("evidence_used") or []) | {"conversation"})
    return analysis

def guard_duplicates(state: InterviewerState, analysis: dict) -> dict:
    if not analysis:
        return analysis
    action = str(analysis.get("action") or "").upper()
    if action == "END":
        return analysis
    question = analysis.get("next_question")
    if not question or not is_duplicate(str(question), state.get("asked_questions") or []):
        return analysis

    logger.info("InterviewerAgent: generated question duplicates a previous one; forcing next topic.")
    return force_next_topic(state, analysis)

def heuristic_analysis(state: InterviewerState) -> dict:
    answer = (state.get("latest_candidate_response") or "").strip()
    current_skill = state.get("current_skill") or "relevant experience"
    remaining = state.get("skills_to_evaluate") or []
    words = answer.split()
    if len(words) < 8 or any(t in answer.lower() for t in ("don't know", "not sure", "skip", "pass", "no idea")):
        return {
            "action": "DEEPEN",
            "spoken_response": "I'd like to understand that a bit better.",
            "next_question": f"Could you walk me through a concrete example related to {current_skill}?",
            "target_skill": current_skill,
            "answer_summary": "Shallow or evasive answer detected.",
            "evidence_used": ["conversation"],
            "skills_demonstrated": [],
            "missing_details": ["specific example", "metrics", "personal contribution"],
            "skills_still_needed": remaining,
        }
    return {
        "action": "NEXT_TOPIC",
        "spoken_response": "Thanks for that.",
        "next_question": None,
        "target_skill": next((s for s in remaining if s != current_skill), current_skill),
        "answer_summary": "Answer received but could not be deeply analyzed.",
        "evidence_used": ["conversation"],
        "skills_demonstrated": [],
        "missing_details": [],
        "skills_still_needed": remaining,
    }
