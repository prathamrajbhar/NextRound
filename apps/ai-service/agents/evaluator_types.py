from typing import Dict, Any, TypedDict, List, Optional

class ScoringIsolationError(Exception):
    pass

def _as_optional_float(value: Any) -> Optional[float]:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None

def _weighted_score(pairs: List[tuple]) -> Optional[float]:
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
