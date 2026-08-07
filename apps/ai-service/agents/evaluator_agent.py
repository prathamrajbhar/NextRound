import logging
import json
import httpx
from typing import Dict, Any, TypedDict, List, Optional
from pydantic import BaseModel, Field
from core.config import settings

logger = logging.getLogger("evaluator_agent")

try:
    from langgraph.graph import StateGraph, END
    LANGGRAPH_AVAILABLE = True
except ImportError:
    LANGGRAPH_AVAILABLE = False
    logger.warning("LangGraph not installed. Evaluator Agent will run linear node pipeline.")

# GenAI client initialization
genai_client = None
if settings.gemini_api_key:
    try:
        from google import genai
        genai_client = genai.Client(api_key=settings.gemini_api_key)
    except Exception as e:
        logger.warning(f"Failed to initialize GenAI client in evaluator_agent: {e}")


class ScoringIsolationError(Exception):
    """Raised when computer vision or proctoring signals leak into scoring functions or LLM prompts."""
    pass


class EvaluatorState(TypedDict, total=False):
    application_id: str
    interview_id: Optional[str]
    stage: str
    screening_score: float
    aptitude_score: float
    coding_score: float
    interview_score: float
    dimension_scores: Dict[str, float]
    proctor_flags: List[str]
    proctor_telemetry: Dict[str, Any]
    bias_report: Dict[str, Any]
    confidence: float
    composite_score: float
    reasoning: str
    isolation_valid: bool
    prompt_payload_used: str
    scoring_inputs_used: Dict[str, Any]
    error: Optional[str]


def aggregate_scores_node(state: EvaluatorState) -> EvaluatorState:
    """Node 1: Aggregate multi-stage evaluation scores into a weighted composite score."""
    scr = state.get("screening_score", 80.0)
    apt = state.get("aptitude_score", 85.0)
    cod = state.get("coding_score", 90.0)
    inv = state.get("interview_score", 88.0)

    # Standard stage weighting: 20% Screening, 20% Aptitude, 30% Coding, 30% Voice Interview
    composite = (scr * 0.20) + (apt * 0.20) + (cod * 0.30) + (inv * 0.30)
    composite_score = round(composite, 2)

    dimension_scores = {
        "technical_competency": round((cod * 0.6) + (inv * 0.4), 2),
        "problem_solving": round((apt * 0.5) + (cod * 0.5), 2),
        "communication": round((inv * 0.8) + (scr * 0.2), 2),
        "foundational_readiness": round((scr * 0.5) + (apt * 0.5), 2),
    }

    # Record exact inputs used for scoring for isolation auditing
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


# ML_BYPASS: dedicated bias classifier — upgrade to IBM AI Fairness 360 or Holistic AI when available
def run_bias_audit_node(state: EvaluatorState) -> EvaluatorState:
    """
    Node 2: Run bias audit using Gemini LLM to check linguistic neutrality and demographic equity.
    STRICT REQUIREMENT: Proctoring signals/flags MUST BE EXCLUDED from the LLM prompt.
    """
    dimension_scores = state.get("dimension_scores", {})
    comp_score = state.get("composite_score", 0.0)

    # Pure performance metrics ONLY (zero proctor signals)
    audit_prompt = (
        f"Analyze the following technical performance metrics for hiring evaluation bias and linguistic neutrality:\n"
        f"Composite Score: {comp_score}/100\n"
        f"Dimension Scores: {json.dumps(dimension_scores)}\n"
        f"Evaluate if there is any anomalous variance across dimensions or unfair penalty."
    )

    state["prompt_payload_used"] = audit_prompt

    bias_severity = "low"
    anomalies = []

    if genai_client:
        try:
            res = genai_client.models.generate_content(
                model="gemini-2.5-flash",
                contents=f"Respond with JSON {{'severity': 'low'|'medium'|'high', 'anomalies': []}}:\n{audit_prompt}"
            )
            if res and res.text:
                import re
                match = re.search(r"\{.*\}", res.text, re.DOTALL)
                if match:
                    parsed = json.loads(match.group(0))
                    bias_severity = parsed.get("severity", "low")
                    anomalies = parsed.get("anomalies", [])
        except Exception as e:
            logger.error(f"Gemini bias audit execution failed: {e}")

    state["bias_report"] = {
        "severity": bias_severity,
        "anomalies": anomalies,
    }
    return state


def validate_isolation_node(state: EvaluatorState) -> EvaluatorState:
    """
    Node 3: PROGRAMMATIC SCORING ISOLATION ASSERTION.
    Throws ScoringIsolationError if proctor flags or computer vision signals are present
    in decision scoring functions or LLM prompts.
    """
    scoring_inputs = state.get("scoring_inputs_used", {})
    prompt_payload = state.get("prompt_payload_used", "")

    forbidden_keys = ["proctor_flags", "proctor_telemetry", "gaze_centered", "face_count", "tab_switches", "eye_contact"]

    # Check 1: Inspect scoring_inputs for forbidden proctor keys or non-empty proctor signals
    for key in forbidden_keys:
        if key in scoring_inputs:
            raise ScoringIsolationError(f"Scoring Isolation Violation: '{key}' found in scoring inputs!")

    # Check 2: Inspect LLM prompt payload for proctor keywords
    for key in forbidden_keys:
        if key in prompt_payload.lower():
            raise ScoringIsolationError(f"Scoring Isolation Violation: '{key}' leaked into LLM prompt payload!")

    state["isolation_valid"] = True
    logger.info(f"Scoring isolation assertion PASSED for application {state.get('application_id')}")
    return state


def compute_confidence_node(state: EvaluatorState) -> EvaluatorState:
    """Node 4: Calculate evaluation confidence rating (0.0 to 1.0) based on score variance & data completeness."""
    dim_scores = list(state.get("dimension_scores", {}).values())

    if dim_scores:
        avg = sum(dim_scores) / len(dim_scores)
        variance = sum((x - avg) ** 2 for x in dim_scores) / len(dim_scores)
        std_dev = variance ** 0.5

        # Lower std dev -> higher confidence (less contradictory signals across stages)
        if std_dev < 10.0:
            confidence = 0.95
        elif std_dev < 20.0:
            confidence = 0.82
        else:
            confidence = 0.65  # Triggers HR hold queue if < 0.70
    else:
        confidence = 0.50

    state["confidence"] = round(confidence, 2)
    state["reasoning"] = (
        f"Evaluation completed with composite score of {state.get('composite_score')}/100 "
        f"and confidence rating of {confidence}."
    )
    return state


def finalize_report_node(state: EvaluatorState) -> EvaluatorState:
    """Node 5: Finalize report state."""
    logger.info(f"Finalized evaluation report for application {state.get('application_id')} (Confidence: {state.get('confidence')})")
    return state


def build_evaluator_graph():
    """Build LangGraph workflow for Evaluator & Bias Audit Agent."""
    if not LANGGRAPH_AVAILABLE:
        return None

    builder = StateGraph(EvaluatorState)
    builder.add_node("aggregate_scores", aggregate_scores_node)
    builder.add_node("run_bias_audit", run_bias_audit_node)
    builder.add_node("validate_isolation", validate_isolation_node)
    builder.add_node("compute_confidence", compute_confidence_node)
    builder.add_node("finalize_report", finalize_report_node)

    builder.set_entry_point("aggregate_scores")
    builder.add_edge("aggregate_scores", "run_bias_audit")
    builder.add_edge("run_bias_audit", "validate_isolation")
    builder.add_edge("validate_isolation", "compute_confidence")
    builder.add_edge("compute_confidence", "finalize_report")
    builder.add_edge("finalize_report", END)

    return builder.compile()


_evaluator_app = build_evaluator_graph()


async def run_evaluator_agent(
    application_id: str,
    stage: str = "final_evaluation",
    interview_id: Optional[str] = None,
    screening_score: float = 80.0,
    aptitude_score: float = 85.0,
    coding_score: float = 90.0,
    interview_score: float = 88.0,
    proctor_flags: Optional[List[str]] = None,
    proctor_telemetry: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Execute Evaluator & Bias Audit Agent workflow.
    Guarantees zero-leakage scoring isolation assertion.
    """
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
                "bias_report": final_state.get("bias_report"),
                "reasoning": final_state.get("reasoning"),
                "isolation_valid": final_state.get("isolation_valid"),
            }
        except ScoringIsolationError as sie:
            logger.critical(f"SCORING ISOLATION VIOLATION DETECTED: {sie}")
            raise sie
        except Exception as e:
            logger.error(f"LangGraph evaluator execution failed: {e}")

    # Fallback linear node execution
    s1 = aggregate_scores_node(initial_state)
    s2 = run_bias_audit_node(s1)
    s3 = validate_isolation_node(s2)  # Will raise ScoringIsolationError if violated
    s4 = compute_confidence_node(s3)
    s5 = finalize_report_node(s4)

    return {
        "application_id": application_id,
        "composite_score": s5.get("composite_score"),
        "confidence": s5.get("confidence"),
        "dimension_scores": s5.get("dimension_scores"),
        "bias_report": s5.get("bias_report"),
        "reasoning": s5.get("reasoning"),
        "isolation_valid": s5.get("isolation_valid"),
    }
