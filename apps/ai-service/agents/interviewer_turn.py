from agents.interviewer_types import InterviewerState

def persist_turn(state: InterviewerState) -> InterviewerState:
    analysis = state.get("last_analysis") or {}
    spoken = str(analysis.get("spoken_response") or "").strip()
    question = str(analysis.get("next_question") or "").strip()
    combined = " ".join(p for p in (spoken, question) if p).strip()

    state["latest_ai_response"] = combined
    state["turn_number"] = state.get("turn_number", 0) + 1

    history = state.get("conversation_history") or []
    previous_question = ""
    for entry in reversed(history):
        if isinstance(entry, dict) and str(entry.get("speaker") or entry.get("role") or "").lower() in ("ai", "interviewer"):
            previous_question = str(entry.get("text") or entry.get("content") or "")
            break
    history.append({"speaker": "ai", "text": combined, "stage": state.get("current_stage")})
    state["conversation_history"] = history

    if question:
        asked = state.get("asked_questions") or []
        asked.append(question)
        state["asked_questions"] = asked

    turn_records = state.get("turn_records") or []
    turn_records.append({
        "turn": state["turn_number"],
        "question": previous_question,
        "answer": state.get("latest_candidate_response") or "",
        "answer_summary": analysis.get("answer_summary"),
        "action": analysis.get("action"),
        "target_skill": analysis.get("target_skill"),
        "evaluated_skills": list(state.get("evaluated_skills") or []),
        "remaining_skills": list(state.get("skills_to_evaluate") or []),
        "evidence_used": analysis.get("evidence_used") or [],
        "stage": state.get("current_stage"),
    })
    state["turn_records"] = turn_records
    return state
