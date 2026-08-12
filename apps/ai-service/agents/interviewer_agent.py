import logging
import json
from typing import Dict, Any, Optional, TypedDict, List
from pydantic import BaseModel, Field
from services.llm_service import generate_text, extract_json_object

logger = logging.getLogger("interviewer_agent")

from core.langgraph import LANGGRAPH_AVAILABLE, StateGraph, END


# ML_BYPASS: voice streaming pipeline — upgrade to streaming Gemini tokens to Piper/XTTS-v2
class InterviewerState(TypedDict, total=False):
    interview_id: str
    application_id: str
    candidate_id: str
    job_id: str
    job_title: str
    job_rubric: dict
    candidate_resume: str
    conversation_history: List[Dict[str, str]]
    current_stage: str  # 'intro' | 'technical' | 'behavioral' | 'project' | 'closing'
    turn_number: int
    scores_so_far: Dict[str, float]
    is_complete: bool
    follow_up_depth: int
    evasion_flags: List[str]
    latest_candidate_response: str
    latest_ai_response: str
    next_action: str  # 'follow_up' | 'generate_question' | 'advance_stage' | 'close_interview'
    final_scorecard: dict


def load_context_node(state: InterviewerState) -> InterviewerState:
    """Node 1: Initialize context, load resume, job rubric, and conversation state."""
    logger.info(f"InterviewerAgent: Loading context for interview {state.get('interview_id')}")
    if not state.get("conversation_history"):
        state["conversation_history"] = []
    if not state.get("current_stage"):
        state["current_stage"] = "intro"
    if not state.get("turn_number"):
        state["turn_number"] = 0
    if not state.get("scores_so_far"):
        state["scores_so_far"] = {}
    if state.get("follow_up_depth") is None:
        state["follow_up_depth"] = 0
    if not state.get("evasion_flags"):
        state["evasion_flags"] = []
    return state


def evaluate_last_answer_node(state: InterviewerState) -> InterviewerState:
    """Node 2: Evaluate the candidate's last answer against rubric & detect evasion/shallow responses."""
    candidate_ans = state.get("latest_candidate_response", "").strip()
    if not candidate_ans:
        return state

    current_stage = state.get("current_stage", "technical")
    logger.info(f"Evaluating answer for stage {current_stage}: '{candidate_ans[:60]}...'")

    # Simple heuristic + GenAI verification for shallow or evasive answer
    words = candidate_ans.split()
    is_shallow = len(words) < 12
    is_evasive = any(term in candidate_ans.lower() for term in ["don't know", "not sure", "skip", "pass", "no idea"])

    prompt = (
        f"You are an AI interviewer evaluator. Evaluate this candidate response:\n"
        f"Question Context/Stage: {current_stage}\n"
        f"Candidate Answer: {candidate_ans}\n\n"
        f"Return JSON format: {{\"score\": float (0-100), \"shallow\": bool, \"evasive\": bool, \"feedback\": str}}"
    )
    eval_data = extract_json_object(generate_text(prompt, force_provider="groq"))
    if eval_data:
        is_shallow = eval_data.get("shallow", is_shallow)
        is_evasive = eval_data.get("evasive", is_evasive)
        stage_key = "technical" if current_stage in ["intro", "technical", "project"] else "communication"
        state["scores_so_far"][stage_key] = round(float(eval_data.get("score", 0)), 2)

    if is_evasive or is_shallow:
        evasion_flags = state.get("evasion_flags", [])
        evasion_flags.append(f"Stage {current_stage} turn {state.get('turn_number')}: Shallow/Evasive response detected")
        state["evasion_flags"] = evasion_flags

    return state


def decide_next_action_node(state: InterviewerState) -> InterviewerState:
    """Node 3: Decide whether to probe deeper (follow-up), ask next question, advance stage, or close."""
    turn_number = state.get("turn_number", 0)
    current_stage = state.get("current_stage", "intro")
    follow_up_depth = state.get("follow_up_depth", 0)
    candidate_ans = state.get("latest_candidate_response", "").lower()

    # If candidate wants to end (only close early after enough turns to avoid a
    # turn-1 "goodbye" trivially ending a live interview)
    if ("goodbye" in candidate_ans or "thank you" in candidate_ans) and turn_number > 6:
        state["next_action"] = "close_interview"
        return state

    # If answer was evasive/shallow and follow_up_depth < 1, do follow up
    evasion_flags = state.get("evasion_flags", [])
    if evasion_flags and follow_up_depth < 1 and current_stage in ["technical", "project"]:
        state["next_action"] = "follow_up"
        return state

    # Stage transitions based on turn counts
    if current_stage == "intro" and turn_number >= 1:
        state["next_action"] = "advance_stage"
    elif current_stage == "technical" and turn_number >= 4:
        state["next_action"] = "advance_stage"
    elif current_stage == "behavioral" and turn_number >= 6:
        state["next_action"] = "advance_stage"
    elif current_stage == "project" and turn_number >= 8:
        state["next_action"] = "advance_stage"
    elif current_stage == "closing" or turn_number >= 10:
        state["next_action"] = "close_interview"
    else:
        state["next_action"] = "generate_question"

    return state


def generate_question_node(state: InterviewerState) -> InterviewerState:
    """Node 4: Generate main stage question using candidate resume & job rubric.

    Every stage question is produced by the LLM — no canned template is ever
    used. If the LLM returns nothing the interview fails instead of asking a
    fabricated question.
    """
    current_stage = state.get("current_stage", "technical")
    job_title = state.get("job_title")
    candidate_resume = state.get("candidate_resume", "")
    history = state.get("conversation_history", [])

    prompt = (
        f"You are a professional AI interviewer for the role of {job_title or 'an open position'}.\n"
        f"Current Interview Stage: {current_stage}\n"
        f"Candidate Resume Context: {candidate_resume[:1500]}\n"
        f"Recent Conversation History: {json.dumps(history[-4:])}\n\n"
        f"Ask ONE concise, engaging spoken interview question appropriate for the {current_stage} stage, referencing candidate's actual experience or projects if available. Keep it under 2 sentences."
    )
    question_text = generate_text(prompt, force_provider="groq")
    if not question_text:
        raise RuntimeError("Interviewer LLM returned no question for this turn.")

    state["latest_ai_response"] = question_text
    state["follow_up_depth"] = 0
    state["turn_number"] = state.get("turn_number", 0) + 1

    history.append({"speaker": "ai", "text": question_text, "stage": current_stage})
    state["conversation_history"] = history
    return state


def generate_follow_up_node(state: InterviewerState) -> InterviewerState:
    """Node 5: Generate dynamic targeted follow-up question when candidate answer lacks depth."""
    candidate_ans = state.get("latest_candidate_response", "")
    current_stage = state.get("current_stage", "technical")
    history = state.get("conversation_history", [])

    prompt = (
        f"You are an AI technical interviewer. The candidate gave a brief or partial answer:\n"
        f"Candidate Answer: '{candidate_ans}'\n\n"
        f"Generate a polite, sharp 1-sentence follow-up probing deeper into technical execution or specific metrics."
    )
    follow_up_text = generate_text(prompt, force_provider="groq")
    if not follow_up_text:
        raise RuntimeError("Interviewer LLM returned no follow-up question.")

    state["latest_ai_response"] = follow_up_text
    state["follow_up_depth"] = state.get("follow_up_depth", 0) + 1
    state["turn_number"] = state.get("turn_number", 0) + 1

    history.append({"speaker": "ai", "text": follow_up_text, "stage": f"{current_stage}_followup"})
    state["conversation_history"] = history
    return state


def advance_stage_node(state: InterviewerState) -> InterviewerState:
    """Node 6: Advance interview to the next logical stage."""
    stages = ["intro", "technical", "behavioral", "project", "closing"]
    current_stage = state.get("current_stage", "intro")
    try:
        idx = stages.index(current_stage)
        next_stage = stages[min(idx + 1, len(stages) - 1)]
    except ValueError:
        next_stage = "closing"

    logger.info(f"Advancing interview stage from {current_stage} to {next_stage}")
    state["current_stage"] = next_stage
    return generate_question_node(state)


def close_interview_node(state: InterviewerState) -> InterviewerState:
    """Node 7: Close interview session with a real LLM concluding remark."""
    current_stage = state.get("current_stage", "closing")
    history = state.get("conversation_history", [])

    prompt = (
        "You are a professional AI interviewer ending a completed interview.\n"
        f"Candidate Context: {json.dumps(history[-4:])}\n\n"
        "Say goodbye to the candidate in 1-2 sentences, thank them for their time, "
        "and tell them their results are being prepared. Do not invent scores."
    )
    closing_text = generate_text(prompt, force_provider="groq")
    if not closing_text:
        raise RuntimeError("Interviewer LLM returned no closing message.")

    state["latest_ai_response"] = closing_text
    state["is_complete"] = True
    history.append({"speaker": "ai", "text": closing_text, "stage": current_stage})
    state["conversation_history"] = history

    return finalize_scores_node(state)


def _collect_transcript_text(history: Any) -> tuple:
    """Extract candidate/ai transcript text and count turns from conversation history."""
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
        speaker = str(entry.get("speaker", "")).lower()
        total += 1
        if speaker in ("candidate", "human", "interviewee", "me", "user"):
            candidate_lines.append(text.strip())
    return "\n".join(line for line in candidate_lines if line), total


def _gemini_score_transcript(history: Any, job_title: str) -> Optional[Dict[str, Any]]:
    """Score the full interview transcript with Gemini against the role rubric.

    Returns a dict with technical/communication/problem_solving scores or None
    when Gemini is unavailable, the transcript is too thin, or parsing fails.
    """
    transcript_text, _ = _collect_transcript_text(history)
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
    """Node 8: Aggregate turn scores into a final evaluation scorecard.

    Every score is either a Gemini score of the full transcript or a real
    per-turn LLM score recorded during the interview. No length-based baseline
    or default-0 score is ever used. If no real score exists the interview
    evaluation fails instead of reporting fabricated numbers.
    """
    scores = state.get("scores_so_far", {})
    history = state.get("conversation_history", [])
    _, turn_count = _collect_transcript_text(history)
    turn_number = state.get("turn_number", 0)
    total_turns = max(turn_count, turn_number, 1)

    tech = comm = prob = composite = summary_feedback = None

    llm = _gemini_score_transcript(history, state.get("job_title") or "")
    if llm:
        # Only accept scores the model actually returned — never default 0.0.
        tech = round(float(llm["technical_depth"]), 1) if llm.get("technical_depth") is not None else None
        comm = round(float(llm["communication"]), 1) if llm.get("communication") is not None else None
        prob = round(float(llm["problem_solving"]), 1) if llm.get("problem_solving") is not None else None
        if llm.get("overall_score") is not None:
            composite = round(float(llm["overall_score"]), 1)
        summary_feedback = llm.get("summary_feedback")

    # Fall back to real per-turn scores when the transcript-level score is
    # missing, but only for dimensions the model actually returned.
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
    }
    return state


# Build LangGraph StateGraph if available
if LANGGRAPH_AVAILABLE:
    graph_builder = StateGraph(InterviewerState)

    graph_builder.add_node("load_context", load_context_node)
    graph_builder.add_node("evaluate_last_answer", evaluate_last_answer_node)
    graph_builder.add_node("decide_next_action", decide_next_action_node)
    graph_builder.add_node("generate_question", generate_question_node)
    graph_builder.add_node("generate_follow_up", generate_follow_up_node)
    graph_builder.add_node("advance_stage", advance_stage_node)
    graph_builder.add_node("close_interview", close_interview_node)
    graph_builder.add_node("finalize_scores", finalize_scores_node)

    graph_builder.set_entry_point("load_context")
    graph_builder.add_edge("load_context", "evaluate_last_answer")
    graph_builder.add_edge("evaluate_last_answer", "decide_next_action")

    def route_action(state: InterviewerState) -> str:
        return state.get("next_action", "generate_question")

    graph_builder.add_conditional_edges(
        "decide_next_action",
        route_action,
        {
            "follow_up": "generate_follow_up",
            "generate_question": "generate_question",
            "advance_stage": "advance_stage",
            "close_interview": "close_interview",
        }
    )

    graph_builder.add_edge("generate_question", END)
    graph_builder.add_edge("generate_follow_up", END)
    graph_builder.add_edge("advance_stage", END)
    graph_builder.add_edge("close_interview", "finalize_scores")
    graph_builder.add_edge("finalize_scores", END)

    interviewer_graph = graph_builder.compile()
else:
    interviewer_graph = None


def run_interviewer_agent(state: InterviewerState) -> InterviewerState:
    """Entry point function to execute one turn of the interviewer agent."""
    if interviewer_graph:
        try:
            return interviewer_graph.invoke(state)
        except Exception as e:
            logger.error(f"LangGraph execution error: {e}. Falling back to linear execution.")

    # Linear Fallback Execution
    state = load_context_node(state)
    if state.get("latest_candidate_response"):
        state = evaluate_last_answer_node(state)
    state = decide_next_action_node(state)
    action = state.get("next_action", "generate_question")

    if action == "follow_up":
        state = generate_follow_up_node(state)
    elif action == "advance_stage":
        state = advance_stage_node(state)
    elif action == "close_interview":
        state = close_interview_node(state)
    else:
        state = generate_question_node(state)

    return state
