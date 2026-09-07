from typing import Any, Dict, Optional
from services.llm_service import generate_text, extract_json_object
from agents.interviewer_types import InterviewerState

def collect_transcript_text(history: Any) -> tuple:
    if not isinstance(history, list):
        return "", 0
    candidate_lines = []
    total = 0
    for entry in history:
        if not isinstance(entry, dict):
            continue
        text = entry.get("text") or entry.get("content") or ""
        if not isinstance(text, str):
            continue
        speaker = str(entry.get("speaker") or entry.get("role") or "").lower()
        total += 1
        if speaker in ("candidate", "human", "interviewee", "me", "user"):
            candidate_lines.append(text.strip())
    return "\n".join(line for line in candidate_lines if line), total

def gemini_score_transcript(history: Any, job_title: str) -> Optional[Dict[str, Any]]:
    transcript_text, _ = collect_transcript_text(history)
    if len(transcript_text.strip()) < 40:
        return None
    prompt = (
        f"You are an unbiased technical interviewer evaluating a completed interview for a {job_title} role.\n"
        "Score the candidate's actual answers on three dimensions (0-100): technical_depth, communication, problem_solving.\n"
        "Base every score strictly on the transcript content. Return JSON only.\n\n"
        f"Transcript:\n{transcript_text[:8000]}\n\n"
        'Return JSON: {"technical_depth": float, "communication": float, "problem_solving": float, '
        '"overall_score": float, "summary_feedback": str}'
    )
    return extract_json_object(generate_text(prompt, force_provider="groq"))

def finalize_scores_node(state: InterviewerState) -> InterviewerState:
    scores = state.get("scores_so_far", {})
    history = state.get("conversation_history", [])
    _, turn_count = collect_transcript_text(history)
    turn_number = state.get("turn_number", 0)
    total_turns = max(turn_count, turn_number, 1)

    tech = comm = prob = composite = summary_feedback = None

    llm = gemini_score_transcript(history, state.get("job_title") or "")
    if llm:
        tech = round(float(llm["technical_depth"]), 1) if llm.get("technical_depth") is not None else None
        comm = round(float(llm["communication"]), 1) if llm.get("communication") is not None else None
        prob = round(float(llm["problem_solving"]), 1) if llm.get("problem_solving") is not None else None
        if llm.get("overall_score") is not None:
            composite = round(float(llm["overall_score"]), 1)
        summary_feedback = llm.get("summary_feedback")

    if tech is None and scores.get("technical") is not None:
        tech = round(float(scores["technical"]), 1)
    if comm is None and scores.get("communication") is not None:
        comm = round(float(scores["communication"]), 1)
    if prob is None and scores.get("problemSolving") is not None:
        prob = round(float(scores["problemSolving"]), 1)

    if tech is not None or comm is not None or prob is not None:
        if composite is None:
            dims = [d for d in (tech, comm, prob) if d is not None]
            if dims:
                composite = round(sum(dims) / len(dims), 1)
    else:
        raise RuntimeError("No real interview scores were produced; refusing to emit a fabricated scorecard.")

    state["final_scorecard"] = {
        "overall_score": composite,
        "technical_score": tech,
        "communication_score": comm,
        "problem_solving_score": prob,
        "evasion_flags_count": len(state.get("evasion_flags", [])),
        "total_turns": total_turns,
        "summary_feedback": summary_feedback,
        "evaluated_skills": state.get("evaluated_skills") or [],
        "skills_to_evaluate": state.get("skills_to_evaluate") or [],
    }
    return state
