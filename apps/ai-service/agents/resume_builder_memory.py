import re
from typing import Dict, Any, List, Optional
from agents.resume_builder_types import STAGES, STAGE_MIN_TURNS, PROFILE_TYPES


# ---------------------------------------------------------------------------
# Question normalisation & deduplication
# ---------------------------------------------------------------------------

def _normalize_question(q: str) -> str:
    if not q:
        return ""
    q = q.lower()
    q = re.sub(r"[^a-z0-9\s]", " ", q)
    return " ".join(q.split())


def _is_duplicate(candidate_q: str, asked: List[str]) -> bool:
    """Return True only if the candidate question is essentially identical to
    one already asked. Uses a strict 0.95 token-overlap threshold so valid
    follow-up questions on the same topic are not silently dropped."""
    nq = _normalize_question(candidate_q)
    if not nq:
        return False
    for existing in asked:
        na = _normalize_question(str(existing))
        if not na:
            continue
        if nq == na:
            return True
        tokens_q = set(nq.split())
        tokens_a = set(na.split())
        if not tokens_q:
            continue
        overlap = len(tokens_q & tokens_a) / len(tokens_q)
        if overlap >= 0.95:
            return True
    return False


# ---------------------------------------------------------------------------
# Memory normalisation
# ---------------------------------------------------------------------------

def _normalize_memory(memory: Any) -> Dict[str, Any]:
    if not isinstance(memory, dict):
        memory = {}
    defaults: Dict[str, Any] = {
        "candidate_facts": [],
        "covered_topics": [],
        "missing_information": [],
        "previous_questions": [],
        "current_topic": None,
        "next_action": None,
        "stage_turns": {},      # {stage: int} — turns spent per stage
        "profile_type": None,   # inferred profile type
        "user_name": None,
    }
    for key, value in defaults.items():
        if key not in memory:
            memory[key] = value
    for key in ("candidate_facts", "covered_topics", "missing_information", "previous_questions"):
        if not isinstance(memory[key], list):
            memory[key] = []
    if not isinstance(memory.get("stage_turns"), dict):
        memory["stage_turns"] = {}
    return memory


# ---------------------------------------------------------------------------
# Question history collection
# ---------------------------------------------------------------------------

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


# ---------------------------------------------------------------------------
# Memory update
# ---------------------------------------------------------------------------

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


def _update_memory(
    memory: Dict[str, Any],
    analysis: Dict[str, Any],
    candidate_input: str,
    current_stage: str = "",
) -> Dict[str, Any]:
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

    # Per-stage turn accounting
    if current_stage:
        stage_turns: Dict[str, int] = memory.get("stage_turns") or {}
        if answer:  # only count turns where candidate actually answered
            stage_turns[current_stage] = stage_turns.get(current_stage, 0) + 1
        memory["stage_turns"] = stage_turns

    # Capture user name from intro analysis
    user_name = str(analysis.get("user_name") or "").strip()
    if user_name:
        memory["user_name"] = user_name

    # Capture profile type if inferred by LLM
    profile_type = str(analysis.get("profile_type") or "").strip().lower()
    if profile_type in PROFILE_TYPES:
        memory["profile_type"] = profile_type

    return memory


# ---------------------------------------------------------------------------
# Stage progression
# ---------------------------------------------------------------------------

def _stage_complete(memory: Dict[str, Any], current_stage: str) -> bool:
    """Return True when the minimum required candidate turns for this stage
    have been logged. The LLM may still choose NEXT_TOPIC earlier, but this
    is used to prevent premature advancement."""
    stage_turns: Dict[str, int] = memory.get("stage_turns") or {}
    turns_done = stage_turns.get(current_stage, 0)
    min_required = STAGE_MIN_TURNS.get(current_stage, 1)
    return turns_done >= min_required


def _next_stage(current_stage: str) -> Optional[str]:
    try:
        idx = STAGES.index(current_stage)
    except ValueError:
        idx = 0
    if idx >= len(STAGES) - 1:
        return None
    return STAGES[idx + 1]


# ---------------------------------------------------------------------------
# Profile-type inference
# ---------------------------------------------------------------------------

def _infer_profile_type(candidate_facts: List[str]) -> Optional[str]:
    """Heuristic: scan candidate facts for keywords to guess profile type.
    Returns None if no clear signal found."""
    text = " ".join(str(f) for f in candidate_facts).lower()
    if any(kw in text for kw in ("student", "university", "college", "final year", "bachelor", "intern")):
        if "experience" not in text and "worked at" not in text:
            return "student"
    if any(kw in text for kw in ("fresher", "fresh graduate", "no experience", "looking for first")):
        return "fresher"
    if any(kw in text for kw in ("career change", "switching", "transitioning", "new field")):
        return "career_changer"
    if any(kw in text for kw in ("freelance", "freelancer", "self-employed", "contractor", "consultant", "independent")):
        return "freelancer"
    if any(kw in text for kw in ("years of experience", "senior", "lead", "manager", "director", "worked at")):
        return "experienced"
    return None


# ---------------------------------------------------------------------------
# Realtime insight
# ---------------------------------------------------------------------------

def _derive_insight(missing_information: List[str]) -> Optional[str]:
    if not missing_information:
        return None
    detail = str(missing_information[0]).strip()
    if not detail:
        return None
    return f"Tip: mention {detail} to make this section stronger."
