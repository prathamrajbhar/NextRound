import logging
import json
import re
from typing import Dict, Any, TypedDict, List
from pydantic import BaseModel, Field
from core.config import settings

logger = logging.getLogger("interviewer_agent")

try:
    from langgraph.graph import StateGraph, END
    LANGGRAPH_AVAILABLE = True
except ImportError:
    LANGGRAPH_AVAILABLE = False
    logger.warning("LangGraph not installed in interviewer_agent. Falling back to linear graph runner.")

# Gemini API Client
genai_client = None
if settings.gemini_api_key:
    try:
        from google import genai
        genai_client = genai.Client(api_key=settings.gemini_api_key)
    except Exception as e:
        logger.warning(f"Failed to initialize GenAI client in interviewer_agent: {e}")


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

    if genai_client:
        try:
            prompt = (
                f"You are an AI interviewer evaluator. Evaluate this candidate response:\n"
                f"Question Context/Stage: {current_stage}\n"
                f"Candidate Answer: {candidate_ans}\n\n"
                f"Return JSON format: {{\"score\": float (0-100), \"shallow\": bool, \"evasive\": bool, \"feedback\": str}}"
            )
            res = genai_client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )
            if res and res.text:
                match = re.search(r"\{.*\}", res.text, re.DOTALL)
                if match:
                    eval_data = json.loads(match.group(0))
                    is_shallow = eval_data.get("shallow", is_shallow)
                    is_evasive = eval_data.get("evasive", is_evasive)
                    stage_key = "technical" if current_stage in ["intro", "technical", "project"] else "communication"
                    state["scores_so_far"][stage_key] = round(float(eval_data.get("score", 0)), 2)
        except Exception as e:
            logger.warning(f"GenAI answer evaluation warning: {e}")

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

    # If candidate wants to end
    if "goodbye" in candidate_ans or "thank you" in candidate_ans and turn_number > 6:
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
    """Node 4: Generate main stage question using candidate resume & job rubric."""
    current_stage = state.get("current_stage", "technical")
    job_title = state.get("job_title", "Software Engineer")
    candidate_resume = state.get("candidate_resume", "")
    history = state.get("conversation_history", [])

    question_text = f"Could you walk me through your recent experience with system design and technical architecture relevant to {job_title}?"

    if current_stage == "intro":
        question_text = f"Welcome to your AI Voice Interview for the {job_title} role at NextRound! To start, please introduce yourself and highlight your core technical background."
    elif current_stage == "behavioral":
        question_text = "Tell me about a challenging technical trade-off or conflict you faced in a project team, and how you resolved it."
    elif current_stage == "project":
        question_text = "What is the most complex engineering project you have built recently? What were the key architecture choices and bottlenecks?"
    elif genai_client:
        try:
            prompt = (
                f"You are a professional AI interviewer for a {job_title} role.\n"
                f"Current Interview Stage: {current_stage}\n"
                f"Candidate Resume Context: {candidate_resume[:300]}\n"
                f"Recent Conversation History: {json.dumps(history[-4:])}\n\n"
                f"Ask ONE concise, engaging spoken interview question appropriate for the {current_stage} stage. Keep it under 2 sentences."
            )
            res = genai_client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )
            if res and res.text:
                question_text = res.text.strip()
        except Exception as e:
            logger.warning(f"GenAI question generation warning: {e}")

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

    follow_up_text = "That's an interesting point. Could you elaborate specifically on how you measured performance and handled edge cases in that scenario?"

    if genai_client and candidate_ans:
        try:
            prompt = (
                f"You are an AI technical interviewer. The candidate gave a brief or partial answer:\n"
                f"Candidate Answer: '{candidate_ans}'\n\n"
                f"Generate a polite, sharp 1-sentence follow-up probing deeper into technical execution or specific metrics."
            )
            res = genai_client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )
            if res and res.text:
                follow_up_text = res.text.strip()
        except Exception as e:
            logger.warning(f"GenAI follow up warning: {e}")

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
    """Node 7: Close interview session with polite concluding remark."""
    state["latest_ai_response"] = ""
    state["is_complete"] = True

    history = state.get("conversation_history", [])
    state["conversation_history"] = history

    return finalize_scores_node(state)


def finalize_scores_node(state: InterviewerState) -> InterviewerState:
    """Node 8: Aggregate turn scores into final evaluation scorecard."""
    scores = state.get("scores_so_far", {})
    tech = scores.get("technical", 0.0)
    comm = scores.get("communication", 0.0)
    prob = scores.get("problemSolving", 0.0)

    composite = round((tech * 0.4) + (comm * 0.3) + (prob * 0.3), 1)

    state["final_scorecard"] = {
        "overall_score": composite,
        "technical_score": tech,
        "communication_score": comm,
        "problem_solving_score": prob,
        "evasion_flags_count": len(state.get("evasion_flags", [])),
        "total_turns": state.get("turn_number", 0),
        "summary_feedback": f"Candidate completed the interview with {state.get('turn_number', 0)} turn(s) recorded. No fabricated score is applied when no evaluation data exists.",
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
