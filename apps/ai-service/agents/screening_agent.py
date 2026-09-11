import logging
from typing import Dict, Any
from core.langgraph_shim import LANGGRAPH_AVAILABLE, StateGraph, END
from agents.screening_types import GapAnalysis, ScreeningOutput, ScreeningState
from agents.screening_nodes import (
    parse_resume_node,
    score_against_rubric_node,
    compute_gaps_node,
    make_decision_node,
    generate_feedback_node,
)

logger = logging.getLogger("screening_agent")

def build_screening_graph():
    if not LANGGRAPH_AVAILABLE:
        return None

    builder = StateGraph(ScreeningState)
    builder.add_node("parse_resume", parse_resume_node)
    builder.add_node("score_against_rubric", score_against_rubric_node)
    builder.add_node("compute_gaps", compute_gaps_node)
    builder.add_node("make_decision", make_decision_node)
    builder.add_node("generate_feedback", generate_feedback_node)

    builder.set_entry_point("parse_resume")
    builder.add_edge("parse_resume", "score_against_rubric")
    builder.add_edge("score_against_rubric", "compute_gaps")
    builder.add_edge("compute_gaps", "make_decision")
    builder.add_edge("make_decision", "generate_feedback")
    builder.add_edge("generate_feedback", END)

    return builder.compile()

_screening_app = build_screening_graph()

async def run_screening_agent(
    application_id: str,
    candidate_id: str,
    job_id: str,
    resume_text: str,
    job_description: str,
    rubric: dict,
    min_score: float = 70.0
) -> Dict[str, Any]:
    initial_state: ScreeningState = {
        "application_id": application_id,
        "candidate_id": candidate_id,
        "job_id": job_id,
        "resume_text": resume_text,
        "job_description": job_description,
        "rubric": rubric,
        "min_score": min_score,
    }

    if _screening_app:
        try:
            final_state = await _screening_app.ainvoke(initial_state)
            return {
                "status": final_state.get("decision"),
                "resume_score": final_state.get("resume_score"),
                "composite_score": final_state.get("composite_score"),
                "semantic_match_score": final_state.get("semantic_match_score"),
                "gap_analysis": final_state.get("gap_analysis"),
                "reasoning": final_state.get("reasoning"),
                "rejection_feedback": final_state.get("rejection_feedback"),
            }
        except Exception as e:
            logger.error(f"LangGraph execution error in Screening Agent: {e}")

    s1 = parse_resume_node(initial_state)
    s2 = score_against_rubric_node(s1)
    s3 = compute_gaps_node(s2)
    s4 = make_decision_node(s3)
    s5 = generate_feedback_node(s4)

    return {
        "status": s5.get("decision"),
        "resume_score": s5.get("resume_score"),
        "composite_score": s5.get("composite_score"),
        "semantic_match_score": s5.get("semantic_match_score"),
        "gap_analysis": s5.get("gap_analysis"),
        "reasoning": s5.get("reasoning"),
        "rejection_feedback": s5.get("rejection_feedback"),
    }
