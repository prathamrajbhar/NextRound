import logging
from services.llm_service import generate_text
from agents.decision_types import DecisionState

logger = logging.getLogger("decision_agent")

def threshold_match_node(state: DecisionState) -> DecisionState:
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
    logger.info(f"Emitting final decision for application {state.get('application_id')}: {state.get('decision')}")
    return state

def route_decision_branch(state: DecisionState) -> str:
    dec = state.get("decision")
    if dec == "hire":
        return "draft_offer"
    elif dec == "reject":
        return "draft_rejection"
    else:
        return "draft_hold_notice"
