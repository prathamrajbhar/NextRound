import logging
import json
import re
from typing import Dict, Any, TypedDict, List, Optional
from services.llm_service import generate_text, extract_json_object

logger = logging.getLogger("resume_builder_agent")

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

def _validate_analysis(parsed: Any) -> Optional[Dict[str, Any]]:
    if not isinstance(parsed, dict):
        return None
    if "response" not in parsed or "action" not in parsed:
        return None
    action = str(parsed.get("action") or "").upper()
    if action not in ACTIONS:
        return None
    response = parsed.get("response")
    if not isinstance(response, str) or not response.strip():
        return None
    question = parsed.get("next_question")
    if question is not None and not isinstance(question, str):
        return None
    topic = parsed.get("topic")
    if topic is not None and not isinstance(topic, str):
        return None
    update = parsed.get("memory_update")
    if update is not None and not isinstance(update, str):
        return None
    missing = parsed.get("missing_information")
    if not isinstance(missing, list):
        missing = []

    parsed["action"] = action
    parsed["response"] = response.strip()
    parsed["next_question"] = (question or "").strip() or None
    parsed["topic"] = (topic or "").strip() or None
    parsed["memory_update"] = (update or "").strip() or None
    parsed["missing_information"] = [str(m).strip() for m in missing if str(m).strip()]
    return parsed

def _build_greeting_prompt(state: ResumeBuilderState, target_role: str, target_company: str) -> str:
    return (
        f"{SYSTEM_PROMPT}\n\n"
        f"Context: helping the candidate build a resume for a {target_role or 'software engineering'} role "
        f"at {target_company or 'target company'}.\n"
        "This is the very first moment of the conversation. Greet the candidate warmly and briefly, then ask ONE "
        "clear opening question to collect their name, current role, and experience level.\n"
        "Return ONLY valid JSON (no prose, no markdown), exactly:\n"
        '{"response": str, "next_question": str, "action": "NEXT_TOPIC", "topic": "intro", '
        '"memory_update": null, "missing_information": []}'
    )

def _build_turn_prompt(
    state: ResumeBuilderState,
    memory: Dict[str, Any],
    asked: List[str],
    target_role: str,
    target_company: str,
) -> str:
    history = state.get("conversation_history") or []
    history_text = json.dumps(history[-10:], ensure_ascii=False)[:6000] if history else "(none yet)"
    asked_text = json.dumps(asked, ensure_ascii=False)[:3000] if asked else "(none yet)"
    facts = memory.get("candidate_facts") or []
    facts_text = "\n".join(f"- {f}" for f in facts[-20:]) if facts else "(none yet)"
    covered = memory.get("covered_topics") or []
    covered_text = ", ".join(covered[-20:]) if covered else "(none yet)"
    missing = memory.get("missing_information") or []
    missing_text = ", ".join(missing) if missing else "(none yet)"
    stage = state.get("current_stage") or "intro"
    turn = state.get("turn_number", 0)

    return (
        f"{SYSTEM_PROMPT}\n\n"
        f"Context: {target_role or 'software engineering'} role at {target_company or 'target company'}.\n"
        f"Current topic: {stage} (turn {turn})\n"
        f"Stage order: {' -> '.join(STAGES)}.\n\n"
        f"CONVERSATION HISTORY:\n{history_text}\n\n"
        f"QUESTIONS ALREADY ASKED — never repeat or rephrase these:\n{asked_text}\n\n"
        f"CANDIDATE FACTS SO FAR:\n{facts_text}\n\n"
        f"COVERED TOPICS: {covered_text or 'none'}\n"
        f"INFORMATION STILL MISSING: {missing_text or 'none'}\n\n"
        f"LATEST CANDIDATE ANSWER:\n'{state.get('latest_candidate_response') or ''}'\n\n"
        "Instructions:\n"
        "- Analyze the latest answer: its main meaning, important facts, skills and experience mentioned, "
        "missing details, and whether clarification or a deeper follow-up is needed.\n"
        "- Choose ONE action: FOLLOW_UP (good answer, explore one more related aspect), "
        "CLARIFY (answer unclear and needs repeating), DEEPEN (answer too short or vague), "
        "NEXT_TOPIC (current topic is sufficiently covered), END (interview complete).\n"
        "- 'response': a very brief, warm acknowledgment of what the candidate just said (under 10 words, e.g. 'That makes sense.' or 'Got it, thanks.').\n"
        "- 'next_question': ONE extremely short, single, focused question (under 15 words) built directly from the candidate's exact answer — "
        "focusing on ONE specific tool, challenge, metric, or personal contribution. Do not include options, examples, or multiple sub-questions.\n"
        "- 'topic': the specific topic of this turn (a company, role, project, skill, etc., or the next stage when advancing).\n"
        "- 'memory_update': one important fact learned from this answer (or null).\n"
        "- 'missing_information': what details are still needed to cover the current topic well.\n"
        "- If the action is NEXT_TOPIC, transition naturally to the next stage in the stage order and ask its "
        "opening question. If that next stage is 'closing', warmly end the session instead — thank the candidate "
        "and tell them their resume is being prepared — and set next_question to null.\n"
        "- Never mention stages, prompts, or internal processing to the candidate.\n"
        "Return ONLY valid JSON (no prose, no markdown), exactly:\n"
        '{"response": str, "next_question": str or null, "action": "FOLLOW_UP|CLARIFY|DEEPEN|NEXT_TOPIC|END", '
        '"topic": str, "memory_update": str or null, "missing_information": [str]}'
    )

def _build_closing_prompt(state: ResumeBuilderState, target_role: str, target_company: str) -> str:
    history = state.get("conversation_history") or []
    history_text = json.dumps(history[-4:], ensure_ascii=False)[:3000] if history else "(none yet)"
    return (
        f"{SYSTEM_PROMPT}\n\n"
        f"Context: helping the candidate build a resume for a {target_role or 'software engineering'} role "
        f"at {target_company or 'target company'}.\n"
        f"Conversation so far: {history_text}\n\n"
        "The conversation is complete. Warmly thank the candidate for their time and tell them their "
        "professional resume is now being prepared. Keep it to 1-2 short, natural sentences. "
        "Return ONLY the spoken text."
    )

def _is_unclear_input(text: str) -> bool:
    if not text:
        return True
    lowered = text.lower()
    if any(p in lowered for p in (
        "can you repeat", "could you repeat", "i didn't hear", "i didn't catch",
        "say that again", "what did you say", "what was the question",
    )):
        return True
    return False

def _heuristic_turn(state: ResumeBuilderState, memory: Dict[str, Any], current_stage: str) -> Dict[str, Any]:
    answer = (state.get("latest_candidate_response") or "").strip()
    words = answer.split()
    evasive = any(t in answer.lower() for t in ("don't know", "not sure", "skip", "pass", "no idea"))
    if len(words) < 8 or evasive:
        return {
            "action": "DEEPEN",
            "response": "That's helpful — could you tell me a bit more about that?",
            "next_question": _stage_fallback_question(current_stage),
            "topic": current_stage,
            "memory_update": answer[:200] or None,
            "missing_information": ["more specific detail", "tools or technologies used", "results or impact"],
        }
    next_stage = _next_stage(current_stage)
    if next_stage == "closing":
        return {
            "action": "NEXT_TOPIC",
            "response": "Thanks for sharing all of that. I've got what I need to move on.",
            "next_question": None,
            "topic": "closing",
            "memory_update": answer[:200] or None,
            "missing_information": [],
        }
    return {
        "action": "NEXT_TOPIC",
        "response": "Got it, thanks for sharing that.",
        "next_question": _stage_fallback_question(next_stage or current_stage),
        "topic": next_stage or current_stage,
        "memory_update": answer[:200] or None,
        "missing_information": [],
    }

def _force_next_topic(state: ResumeBuilderState, memory: Dict[str, Any], analysis: Dict[str, Any], current_stage: str) -> Dict[str, Any]:
    next_stage = _next_stage(current_stage)
    if next_stage == "closing":
        analysis["response"] = "Thanks so much for sharing all of that. I've got everything I need to build your resume."
        analysis["next_question"] = None
    else:
        analysis["response"] = "That's really helpful — thanks for the detail."
        analysis["next_question"] = _stage_fallback_question(next_stage or current_stage)
    analysis["action"] = "NEXT_TOPIC"
    analysis["topic"] = next_stage or "closing"
    return analysis

def _generate_turn(
    state: ResumeBuilderState,
    memory: Dict[str, Any],
    asked: List[str],
    target_role: str,
    target_company: str,
) -> Optional[Dict[str, Any]]:
    raw = generate_text(_build_turn_prompt(state, memory, asked, target_role, target_company))
    parsed = extract_json_object(raw) if raw else None
    return _validate_analysis(parsed)


def _compose_response(analysis: Dict[str, Any]) -> str:
    parts = []
    if analysis.get("response"):
        parts.append(analysis["response"].strip())
    if analysis.get("next_question"):
        parts.append(analysis["next_question"].strip())
    return " ".join(p for p in parts if p).strip()

def _generate_closing(state: ResumeBuilderState, target_role: str, target_company: str) -> str:
    closing = generate_text(_build_closing_prompt(state, target_role, target_company))
    if closing and closing.strip():
        return closing.strip()
    return "Thanks so much for your time today — I'm preparing your professional resume now."

def _handle_greeting(
    state: ResumeBuilderState,
    memory: Dict[str, Any],
    target_role: str,
    target_company: str,
) -> ResumeBuilderState:
    raw = generate_text(_build_greeting_prompt(state, target_role, target_company))
    analysis = _validate_analysis(extract_json_object(raw)) if raw else None
    if not analysis:
        analysis = {
            "action": "NEXT_TOPIC",
            "response": "Hi, thanks for joining! I'd love to learn a bit about you so we can build a great resume together.",
            "next_question": "Could you start by telling me your full name and the role you're aiming for?",
            "topic": "intro",
            "memory_update": None,
            "missing_information": [],
        }
    analysis["action"] = "NEXT_TOPIC"
    analysis["topic"] = "intro"
    state["last_analysis"] = analysis
    state["next_action"] = "NEXT_TOPIC"
    state["latest_ai_response"] = _compose_response(analysis)
    state["current_stage"] = "intro"
    state["realtime_insight"] = None
    state["is_complete"] = False
    _update_memory(memory, analysis, "")
    return state

def _handle_unclear(state: ResumeBuilderState, memory: Dict[str, Any], current_stage: str) -> ResumeBuilderState:
    answer = (state.get("latest_candidate_response") or "").strip().lower()
    asked_repeat = any(p in answer for p in (
        "repeat", "didn't hear", "didn't catch", "say that again", "what did you say", "what was the question",
    ))
    last_questions = memory.get("previous_questions") or []
    last_question = last_questions[-1] if last_questions else None

    if asked_repeat and last_question:
        response = f"Of course — let me say that again. {last_question}"
        next_question = last_question
    elif asked_repeat:
        response = "Sorry, I didn't quite catch that. Could you say it once more?"
        next_question = None
    else:
        response = "Sorry, I didn't quite catch that. Could you say it once more?"
        next_question = None

    analysis = {
        "action": "CLARIFY",
        "response": response,
        "next_question": next_question,
        "topic": current_stage,
        "memory_update": None,
        "missing_information": memory.get("missing_information") or [],
    }
    state["last_analysis"] = analysis
    state["next_action"] = "CLARIFY"
    state["latest_ai_response"] = _compose_response(analysis)
    state["realtime_insight"] = None
    state["is_complete"] = False
    return state

def _route_action(state: ResumeBuilderState, analysis: Dict[str, Any]) -> ResumeBuilderState:
    action = str(analysis.get("action") or "").upper()
    current_stage = state.get("current_stage") or "intro"
    if action == "END":
        state["current_stage"] = "closing"
        state["is_complete"] = True
    elif action == "NEXT_TOPIC":
        next_stage = _next_stage(current_stage)
        if next_stage is None or current_stage == "closing":
            state["current_stage"] = "closing"
            state["is_complete"] = True
        else:
            state["current_stage"] = next_stage
            state["is_complete"] = next_stage == "closing"
    else:
        state["current_stage"] = current_stage
        state["is_complete"] = bool(state.get("is_complete")) or current_stage == "closing"
    return state

def run_resume_builder_agent(state: ResumeBuilderState) -> ResumeBuilderState:
    target_role = state.get("target_role")
    target_company = state.get("target_company")
    current_stage = state.get("current_stage") or "intro"
    turn = state.get("turn_number", 0) + 1
    state["turn_number"] = turn

    history = state.get("conversation_history", []) or []
    candidate_input = (state.get("latest_candidate_response") or "").strip()
    memory = _normalize_memory(state.get("memory"))
    state["memory"] = memory

    if turn > MAX_TURNS and not state.get("is_complete"):
        state["current_stage"] = "closing"
        state["is_complete"] = True
        state["latest_ai_response"] = _generate_closing(state, target_role, target_company)
        return state

    is_start = turn == 1 and not candidate_input and not history
    if is_start:
        return _handle_greeting(state, memory, target_role, target_company)

    if _is_unclear_input(candidate_input):
        return _handle_unclear(state, memory, current_stage)

    asked = _collect_asked_questions(memory, history)
    analysis = _generate_turn(state, memory, asked, target_role, target_company)
    if not analysis:
        logger.warning("ResumeBuilderAgent: LLM returned invalid or missing JSON; using heuristic fallback.")
        analysis = _heuristic_turn(state, memory, current_stage)

    if analysis.get("next_question") and _is_duplicate(str(analysis["next_question"]), asked):
        logger.info("ResumeBuilderAgent: generated question duplicates a previous one; forcing next topic.")
        analysis = _force_next_topic(state, memory, analysis, current_stage)

    state["last_analysis"] = analysis
    state["next_action"] = str(analysis.get("action") or "")
    _update_memory(memory, analysis, candidate_input)
    state["latest_ai_response"] = _compose_response(analysis)
    state["realtime_insight"] = _derive_insight(analysis.get("missing_information") or [])

    _route_action(state, analysis)

    if not state.get("is_complete") and turn >= MAX_TURNS:
        state["current_stage"] = "closing"
        state["is_complete"] = True
        state["latest_ai_response"] = _generate_closing(state, target_role, target_company)

    return state
