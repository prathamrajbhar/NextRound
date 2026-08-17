import logging
from typing import Dict, Any, TypedDict, List, Optional
from pydantic import BaseModel, Field

logger = logging.getLogger("evaluator_agent")

from core.langgraph_shim import LANGGRAPH_AVAILABLE, StateGraph, END

class ScoringIsolationError(Exception):
    pass

def _as_optional_float(value):
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None

def _weighted_score(pairs):
    present = [(v, w) for v, w in pairs if v is not None]
    total = sum(w for _, w in present)
    if not present or total <= 0:
        return None
    return round(sum(v * w for v, w in present) / total, 2)

class EvaluatorState(TypedDict, total=False):
    application_id: str
    interview_id: Optional[str]
    stage: str
    screening_score: Optional[float]
    aptitude_score: Optional[float]
    coding_score: Optional[float]
    interview_score: Optional[float]
    composite_score: Optional[float]
    dimension_scores: Dict[str, Optional[float]]
    confidence: float
    isolation_valid: bool
    proctor_flags: List[str]
    proctor_telemetry: Dict[str, Any]
    prompt_payload_used: str
    reasoning: str
    scoring_inputs_used: Dict[str, Any]
    error: Optional[str]

def aggregate_scores_node(state: EvaluatorState) -> EvaluatorState:
    scr = _as_optional_float(state.get("screening_score"))
    apt = _as_optional_float(state.get("aptitude_score"))
    cod = _as_optional_float(state.get("coding_score"))
    inv = _as_optional_float(state.get("interview_score"))

    composite_score = _weighted_score([(scr, 0.20), (apt, 0.20), (cod, 0.30), (inv, 0.30)])

    dimension_scores = {
        "technical_competency": _weighted_score([(cod, 0.6), (inv, 0.4)]),
        "problem_solving": _weighted_score([(apt, 0.5), (cod, 0.5)]),
        "communication": _weighted_score([(inv, 0.8), (scr, 0.2)]),
        "foundational_readiness": _weighted_score([(scr, 0.5), (apt, 0.5)]),
    }

    state["scoring_inputs_used"] = {
        "screening_score": scr,
        "aptitude_score": apt,
        "coding_score": cod,
        "interview_score": inv,
        "weights": {"screening": 0.2, "aptitude": 0.2, "coding": 0.3, "interview": 0.3},
    }
    state["composite_score"] = composite_score
    state["dimension_scores"] = dimension_scores
    logger.info(f"Aggregated composite score: {composite_score} for application {state.get('application_id')}")

    return state

def validate_isolation_node(state: EvaluatorState) -> EvaluatorState:
    scoring_inputs = state.get("scoring_inputs_used", {})
    prompt_payload = state.get("prompt_payload_used", "")

    forbidden_keys = ["proctor_flags", "proctor_telemetry", "gaze_centered", "face_count", "tab_switches", "eye_contact"]

    for key in forbidden_keys:
        if key in scoring_inputs:
            raise ScoringIsolationError(f"Scoring Isolation Violation: '{key}' found in scoring inputs!")

    for key in forbidden_keys:
        if key in prompt_payload.lower():
            raise ScoringIsolationError(f"Scoring Isolation Violation: '{key}' leaked into LLM prompt payload!")

    state["isolation_valid"] = True
    logger.info(f"Scoring isolation assertion PASSED for application {state.get('application_id')}")
    return state

def compute_confidence_node(state: EvaluatorState) -> EvaluatorState:

    dim_scores = [
        x for x in state.get("dimension_scores", {}).values()
        if isinstance(x, (int, float))
    ]

    if dim_scores:
        avg = sum(dim_scores) / len(dim_scores)
        variance = sum((x - avg) ** 2 for x in dim_scores) / len(dim_scores)
        std_dev = variance ** 0.5

        if std_dev < 10.0:
            confidence = 0.95
        elif std_dev < 20.0:
            confidence = 0.82
        else:
            confidence = 0.65
    else:
        confidence = 0.50

    score_label = state.get("composite_score")
    score_label = score_label if score_label is not None else "N/A"
    state["confidence"] = round(confidence, 2)
    state["reasoning"] = (
        f"Evaluation completed with composite score of {score_label}/100 "
        f"and confidence rating of {confidence}."
    )
    return state

def finalize_report_node(state: EvaluatorState) -> EvaluatorState:
    logger.info(f"Finalized evaluation report for application {state.get('application_id')} (Confidence: {state.get('confidence')})")
    return state

def build_evaluator_graph():
    if not LANGGRAPH_AVAILABLE:
        return None

    builder = StateGraph(EvaluatorState)
    builder.add_node("aggregate_scores", aggregate_scores_node)
    builder.add_node("validate_isolation", validate_isolation_node)
    builder.add_node("compute_confidence", compute_confidence_node)
    builder.add_node("finalize_report", finalize_report_node)

    builder.set_entry_point("aggregate_scores")
    builder.add_edge("aggregate_scores", "validate_isolation")
    builder.add_edge("validate_isolation", "compute_confidence")
    builder.add_edge("compute_confidence", "finalize_report")
    builder.add_edge("finalize_report", END)

    return builder.compile()

_evaluator_app = build_evaluator_graph()

async def run_evaluator_agent(
    application_id: str,
    stage: str = "final_evaluation",
    interview_id: Optional[str] = None,
    screening_score: Optional[float] = None,
    aptitude_score: Optional[float] = None,
    coding_score: Optional[float] = None,
    interview_score: Optional[float] = None,
    proctor_flags: Optional[List[str]] = None,
    proctor_telemetry: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    initial_state: EvaluatorState = {
        "application_id": application_id,
        "interview_id": interview_id,
        "stage": stage,
        "screening_score": screening_score,
        "aptitude_score": aptitude_score,
        "coding_score": coding_score,
        "interview_score": interview_score,
        "proctor_flags": proctor_flags or [],
        "proctor_telemetry": proctor_telemetry or {},
    }

    if _evaluator_app:
        try:
            final_state = await _evaluator_app.ainvoke(initial_state)
            return {
                "application_id": application_id,
                "composite_score": final_state.get("composite_score"),
                "confidence": final_state.get("confidence"),
                "dimension_scores": final_state.get("dimension_scores"),
                "reasoning": final_state.get("reasoning"),
                "isolation_valid": final_state.get("isolation_valid"),
            }
        except ScoringIsolationError as sie:
            logger.critical(f"SCORING ISOLATION VIOLATION DETECTED: {sie}")
            raise sie
        except Exception as e:
            logger.error(f"LangGraph evaluator execution failed: {e}")

    s1 = aggregate_scores_node(initial_state)
    s2 = validate_isolation_node(s1)
    s3 = compute_confidence_node(s2)
    s4 = finalize_report_node(s3)

    return {
        "application_id": application_id,
        "composite_score": s4.get("composite_score"),
        "confidence": s4.get("confidence"),
        "dimension_scores": s4.get("dimension_scores"),
        "reasoning": s4.get("reasoning"),
        "isolation_valid": s4.get("isolation_valid"),
    }

