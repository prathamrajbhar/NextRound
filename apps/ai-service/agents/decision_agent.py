import logging
from typing import Dict, Any, Optional
from core.langgraph_shim import LANGGRAPH_AVAILABLE, StateGraph, END
from agents.decision_types import DecisionState
from agents.decision_nodes import (
    threshold_match_node,
    draft_offer_node,
    draft_rejection_node,
    draft_hold_notice_node,
    emit_decision_node,
    route_decision_branch,
)

logger = logging.getLogger("decision_agent")

def build_decision_graph():
    if not LANGGRAPH_AVAILABLE:
        return None

    builder = StateGraph(DecisionState)
    builder.add_node("threshold_match", threshold_match_node)
    builder.add_node("draft_offer", draft_offer_node)
    builder.add_node("draft_rejection", draft_rejection_node)
    builder.add_node("draft_hold_notice", draft_hold_notice_node)
    builder.add_node("emit_decision", emit_decision_node)

    builder.set_entry_point("threshold_match")
    builder.add_conditional_edges(
        "threshold_match",
        route_decision_branch,
        {
            "draft_offer": "draft_offer",
            "draft_rejection": "draft_rejection",
            "draft_hold_notice": "draft_hold_notice",
        }
    )
    builder.add_edge("draft_offer", "emit_decision")
    builder.add_edge("draft_rejection", "emit_decision")
    builder.add_edge("draft_hold_notice", "emit_decision")
    builder.add_edge("emit_decision", END)

    return builder.compile()

_decision_app = build_decision_graph()

async def run_decision_agent(
    application_id: str,
    evaluation_id: Optional[str] = None,
    composite_score: Optional[float] = None,
    confidence: Optional[float] = None,
    job_title: Optional[str] = None,
    salary: Optional[str] = None,
    equity: Optional[str] = None,
) -> Dict[str, Any]:
    initial_state: DecisionState = {
        "application_id": application_id,
        "evaluation_id": evaluation_id,
        "composite_score": composite_score,
        "confidence": confidence,
        "job_title": job_title,
        "salary": salary,
        "equity": equity,
    }

    if _decision_app:
        try:
            final_state = await _decision_app.ainvoke(initial_state)
            return {
                "application_id": application_id,
                "evaluation_id": evaluation_id,
                "decision": final_state.get("decision"),
                "auto_offer": final_state.get("auto_offer", False),
                "offer_letter_content": final_state.get("offer_letter_content"),
                "rejection_email_content": final_state.get("rejection_email_content"),
                "hold_notice_content": final_state.get("hold_notice_content"),
                "reasoning": final_state.get("reasoning"),
            }
        except Exception as e:
            logger.error(f"LangGraph decision execution failed: {e}")

    s1 = threshold_match_node(initial_state)
    branch = route_decision_branch(s1)
    if branch == "draft_offer":
        s2 = draft_offer_node(s1)
    elif branch == "draft_rejection":
        s2 = draft_rejection_node(s1)
    else:
        s2 = draft_hold_notice_node(s1)
    s3 = emit_decision_node(s2)

    return {
        "application_id": application_id,
        "evaluation_id": evaluation_id,
        "decision": s3.get("decision"),
        "auto_offer": s3.get("auto_offer", False),
        "offer_letter_content": s3.get("offer_letter_content"),
        "rejection_email_content": s3.get("rejection_email_content"),
        "hold_notice_content": s3.get("hold_notice_content"),
        "reasoning": s3.get("reasoning"),
    }
