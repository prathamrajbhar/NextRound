import json
from typing import Dict, Any, List, Optional
from agents.resume_builder_types import STAGES, ACTIONS, SYSTEM_PROMPT, ResumeBuilderState
from agents.resume_builder_memory import _next_stage, _stage_fallback_question

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
