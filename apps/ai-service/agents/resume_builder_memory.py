import re
from typing import Dict, Any, List, Optional
from agents.resume_builder_types import STAGES

def _normalize_question(q: str) -> str:
    if not q:
        return ""
    q = q.lower()
    q = re.sub(r"[^a-z0-9\s]", " ", q)
    return " ".join(q.split())

def _is_duplicate(candidate_q: str, asked: List[str]) -> bool:
    nq = _normalize_question(candidate_q)
    if not nq:
        return False
    for existing in asked:
        na = _normalize_question(str(existing))
        if not na:
            continue
        if nq == na:
            return True
        if nq in na or na in nq:
            return True
        tokens = set(nq.split())
        if tokens and len(tokens & set(na.split())) / len(tokens) >= 0.9:
            return True
    return False

def _normalize_memory(memory: Any) -> Dict[str, Any]:
    if not isinstance(memory, dict):
        memory = {}
    defaults = {
        "candidate_facts": [],
        "covered_topics": [],
        "missing_information": [],
        "previous_questions": [],
        "current_topic": None,
        "next_action": None,
    }
    for key, value in defaults.items():
        if key not in memory:
            memory[key] = value
    for key in ("candidate_facts", "covered_topics", "missing_information", "previous_questions"):
        if not isinstance(memory[key], list):
            memory[key] = []
    return memory

def _collect_asked_questions(memory: Dict[str, Any], history: List[Dict[str, Any]]) -> List[str]:
    asked = list(memory.get("previous_questions") or [])
    for entry in history:
        if not isinstance(entry, dict):
            continue
        speaker = str(entry.get("speaker") or entry.get("role") or "").lower()
        text = entry.get("text") or entry.get("content") or ""
        if speaker in ("ai", "interviewer") and text:
            asked.append(str(text))
    seen = set()
    out: List[str] = []
    for q in asked:
        n = _normalize_question(q)
        if n and n not in seen:
            seen.add(n)
            out.append(q)
    return out

def _contains_similar(facts: List[str], fact: str) -> bool:
    f = fact.lower().strip()
    if not f:
        return True
    for existing in facts:
        e = str(existing).lower().strip()
        if not e:
            continue
        if e == f or e in f or f in e:
            return True
    return False

def _update_memory(memory: Dict[str, Any], analysis: Dict[str, Any], candidate_input: str) -> Dict[str, Any]:
    answer = candidate_input.strip()
    if answer:
        fact = str(analysis.get("memory_update") or "").strip() or answer
        if not _contains_similar(memory["candidate_facts"], fact):
            memory["candidate_facts"].append(fact)

    topic = str(analysis.get("topic") or "").strip()
    if topic:
        memory["current_topic"] = topic
        if answer and topic not in memory["covered_topics"]:
            memory["covered_topics"].append(topic)

    action = analysis.get("action")
    if action:
        memory["next_action"] = str(action)

    missing = analysis.get("missing_information")
    if isinstance(missing, list) and missing:
        memory["missing_information"] = [str(m).strip() for m in missing]

    question = analysis.get("next_question")
    if question and not _is_duplicate(question, memory["previous_questions"]):
        memory["previous_questions"].append(question)
    return memory

def _derive_insight(missing_information: List[str]) -> Optional[str]:
    if not missing_information:
        return None
    detail = str(missing_information[0]).strip()
    if not detail:
        return None
    return f"Tip: mention {detail} to make this section stronger."

def _next_stage(current_stage: str) -> Optional[str]:
    try:
        idx = STAGES.index(current_stage)
    except ValueError:
        idx = 0
    if idx >= len(STAGES) - 1:
        return None
    return STAGES[idx + 1]

def _stage_fallback_question(stage: Optional[str]) -> Optional[str]:
    return {
        "intro": "What's your full name and what kind of role are you aiming for?",
        "work_history": "What was your most recent role and what were your main responsibilities?",
        "skills": "Which tools and technologies do you work with most often?",
        "projects": "Tell me about a project you're proud of and what your part in it was.",
        "education": "Where did you study and what was your focus?",
        "closing": None,
    }.get(stage or "intro")
