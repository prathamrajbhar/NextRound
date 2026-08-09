import logging
from typing import Dict, Any, TypedDict, Optional
from pydantic import BaseModel
from services.llm_service import generate_text

logger = logging.getLogger("decision_agent")

try:
    from langgraph.graph import StateGraph, END
    LANGGRAPH_AVAILABLE = True
except ImportError:
    LANGGRAPH_AVAILABLE = False
    logger.warning("LangGraph not installed. Decision Agent will run linear node pipeline.")


class DecisionState(TypedDict, total=False):
    application_id: str
    evaluation_id: Optional[str]
    composite_score: float
    confidence: float
    decision: str  # 'hire' | 'reject' | 'hold_for_review'
    auto_offer: bool
    offer_letter_content: str
    rejection_email_content: str
    hold_notice_content: str
    reasoning: str


def threshold_match_node(state: DecisionState) -> DecisionState:
    """Node 1: Compare composite score and confidence rating against target decision thresholds."""
    score = state.get("composite_score", 0.0)
    conf = state.get("confidence", 1.0)

    # Decision Threshold Contract:
    # Score >= 80.0 AND Confidence >= 0.70 -> HIRE (Auto Offer)
    # Score < 65.0 AND Confidence >= 0.70 -> REJECT (Constructive Rejection)
    # Confidence < 0.70 OR Score 65..79 -> HOLD (HR Manual Review Queue)

    if conf < 0.70:
        decision = "hold_for_review"
        reasoning = f"Confidence rating ({conf}) is below 0.70 threshold. Application routed to HR Hold Queue."
    elif score >= 80.0:
        decision = "hire"
        reasoning = f"Composite score of {score}/100 exceeds 80.0 offer threshold with high confidence ({conf}). Recommended decision: HIRE."
    elif score < 65.0:
        decision = "reject"
        reasoning = f"Composite score of {score}/100 falls below 65.0 threshold with confidence ({conf}). Recommended decision: REJECT."
    else:
        decision = "hold_for_review"
        reasoning = f"Composite score of {score}/100 falls in intermediate band (65-79). Routed to HR Hold Queue for review."

    state["decision"] = decision
    state["reasoning"] = reasoning
    logger.info(f"Threshold match result for application {state.get('application_id')}: Decision = {decision} (Score: {score}, Conf: {conf})")
    return state


def draft_offer_node(state: DecisionState) -> DecisionState:
    """Node 2: Draft personalized offer letter document when decision is HIRE."""
    if state.get("decision") != "hire":
        return state

    app_id = state.get("application_id")
    score = state.get("composite_score")

    content = (
        f"OFFER OF EMPLOYMENT\n\n"
        f"We are pleased to offer you a position at NextRound / HireOS partner organization.\n"
        f"Based on your outstanding overall candidate evaluation score of {score}/100 across our autonomous screening, "
        f"aptitude, coding, and voice interview assessments, we believe you will be an invaluable addition to our engineering team.\n\n"
        f"Position: Software Engineer\n"
        f"Base Salary: $150,000 / year\n"
        f"Equity: 0.15% ESOPs\n"
        f"Validity: 14 Days from issuance\n\n"
        f"Please review the formal details and sign digitally to confirm your acceptance."
    )

    offer_text = generate_text(
        f"Draft a formal, welcoming job offer letter body for a Software Engineer who scored {score}/100 in technical assessments."
    )
    if offer_text:
        content = offer_text

    state["auto_offer"] = True
    state["offer_letter_content"] = content
    return state


def draft_rejection_node(state: DecisionState) -> DecisionState:
    """Node 3: Draft constructive rejection feedback email when decision is REJECT."""
    if state.get("decision") != "reject":
        return state

    score = state.get("composite_score")
    content = (
        f"Thank you for taking the time to complete our comprehensive technical assessment.\n"
        f"While your profile displayed commendable effort, your composite score of {score}/100 did not meet the minimum requirement for this specific position.\n"
        f"We have generated structured feedback highlighting key growth areas in system architecture and algorithmic optimization. "
        f"We encourage you to practice on the NextRound Candidate Prep platform to sharpen your skills for future opportunities."
    )

    rejection_text = generate_text(
        f"Draft an encouraging, constructive rejection email for a candidate with composite assessment score {score}/100."
    )
    if rejection_text:
        content = rejection_text

    state["auto_offer"] = False
    state["rejection_email_content"] = content
    return state


def draft_hold_notice_node(state: DecisionState) -> DecisionState:
    """Node 4: Draft HR review hold notice when decision is HOLD_FOR_REVIEW."""
    if state.get("decision") != "hold_for_review":
        return state

    score = state.get("composite_score")
    conf = state.get("confidence")

    content = (
        f"APPLICATION FLAGGED FOR HR REVIEW\n"
        f"Composite Score: {score}/100 | Evaluation Confidence: {conf}\n"
        f"This application requires human HR review and manual override to finalize the hiring decision."
    )

    state["auto_offer"] = False
    state["hold_notice_content"] = content
    return state


def emit_decision_node(state: DecisionState) -> DecisionState:
    """Node 5: Emit decision summary."""
    logger.info(f"Emitting final decision for application {state.get('application_id')}: {state.get('decision')}")
    return state


def route_decision_branch(state: DecisionState) -> str:
    """Routing function for conditional graph edges."""
    dec = state.get("decision")
    if dec == "hire":
        return "draft_offer"
    elif dec == "reject":
        return "draft_rejection"
    else:
        return "draft_hold_notice"


def build_decision_graph():
    """Build LangGraph workflow for Decision Agent."""
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
    composite_score: float = 0.0,
    confidence: float = 1.0,
) -> Dict[str, Any]:
    """
    Execute Decision Agent workflow to produce threshold-gated decision and draft assets.
    """
    initial_state: DecisionState = {
        "application_id": application_id,
        "evaluation_id": evaluation_id,
        "composite_score": composite_score,
        "confidence": confidence,
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

    # Fallback linear node execution
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
