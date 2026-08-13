import logging
from typing import Dict, Any, TypedDict, Optional
from pydantic import BaseModel
from services.llm_service import generate_text

logger = logging.getLogger("decision_agent")

from core.langgraph_shim import LANGGRAPH_AVAILABLE, StateGraph, END


class DecisionState(TypedDict, total=False):
    application_id: str
    evaluation_id: Optional[str]
    composite_score: Optional[float]
    confidence: Optional[float]
    decision: str
    auto_offer: bool
    offer_letter_content: str
    rejection_email_content: str
    hold_notice_content: str
    reasoning: str


    job_title: Optional[str]
    salary: Optional[str]
    equity: Optional[str]


def threshold_match_node(state: DecisionState) -> DecisionState:
    """Node 1: Compare composite score and confidence rating against target decision thresholds."""
    score = state.get("composite_score")
    conf = state.get("confidence")









    if score is None:
        decision = "hold_for_review"
        reasoning = "No composite score was produced for this application. Routed to HR Hold Queue for manual review."
    elif conf is None or conf < 0.70:
        decision = "hold_for_review"
        reasoning = f"Confidence rating ({conf if conf is not None else 'N/A'}) is below 0.70 threshold. Application routed to HR Hold Queue."
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
    """Node 2: Draft personalized offer letter from the job payload when decision is HIRE.

    Job title, salary, and equity come from the job payload that reaches the
    agent. When a term is absent it is carried as pending ("To be confirmed")
    rather than inventing a value. The letter body is ALWAYS produced by the
    LLM — a canned template is never substituted for real AI output. If the LLM
    is unavailable the decision fails instead of drafting a fabricated offer.
    """
    if state.get("decision") != "hire":
        return state

    score = state.get("composite_score")
    job_title = state.get("job_title")
    salary = state.get("salary")
    equity = state.get("equity")

    salary_line = f"Base Salary: {salary} / year" if salary else "Base Salary: To be confirmed"
    equity_line = f"Equity: {equity}" if equity else "Equity: To be confirmed"
    position_line = f"Position: {job_title}" if job_title else "Position: To be confirmed"

    offer_text = generate_text(
        f"Draft a formal, welcoming job offer letter body for the role of {job_title or 'the confirmed position'}. "
        f"The candidate scored {score}/100 in technical assessments. Include these terms verbatim:\n"
        f"{position_line}\n{salary_line}\n{equity_line}"
    )
    if not offer_text:
        raise RuntimeError(
            "LLM returned no offer letter draft for a HIRE decision. Refusing to send a canned template."
        )

    state["auto_offer"] = True
    state["offer_letter_content"] = offer_text
    return state


def draft_rejection_node(state: DecisionState) -> DecisionState:
    """Node 3: Draft constructive rejection feedback email when decision is REJECT.

    The rejection body is ALWAYS produced by the LLM — a canned template is
    never substituted for real AI output. If the LLM is unavailable the decision
    fails instead of drafting a fabricated rejection email.
    """
    if state.get("decision") != "reject":
        return state

    score = state.get("composite_score")

    rejection_text = generate_text(
        f"Draft an encouraging, constructive rejection email for a candidate with composite assessment score {score}/100."
    )
    if not rejection_text:
        raise RuntimeError(
            "LLM returned no rejection email draft for a REJECT decision. Refusing to send a canned template."
        )

    state["auto_offer"] = False
    state["rejection_email_content"] = rejection_text
    return state


def draft_hold_notice_node(state: DecisionState) -> DecisionState:
    """Node 4: Draft HR review hold notice when decision is HOLD_FOR_REVIEW."""
    if state.get("decision") != "hold_for_review":
        return state

    score = state.get("composite_score")
    conf = state.get("confidence")

    score_label = score if score is not None else "N/A"
    conf_label = conf if conf is not None else "N/A"
    content = (
        f"APPLICATION FLAGGED FOR HR REVIEW\n"
        f"Composite Score: {score_label}/100 | Evaluation Confidence: {conf_label}\n"
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
    composite_score: Optional[float] = None,
    confidence: Optional[float] = None,
    job_title: Optional[str] = None,
    salary: Optional[str] = None,
    equity: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Execute Decision Agent workflow to produce threshold-gated decision and draft assets.

    ``job_title``/``salary``/``equity`` are the job terms used to draft the offer
    letter; they must come from the job payload, never from constants. Absent
    terms are carried as pending rather than invented.
    """
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
