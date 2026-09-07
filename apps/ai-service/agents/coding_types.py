from typing import TypedDict, List, Optional

class CodingState(TypedDict, total=False):
    application_id: str
    problem_id: str
    code: str
    language: str
    submission_id: str
    test_cases: List[dict]
    passed_cases: int
    total_cases: int
    pass_rate: float
    execution_time_ms: float
    memory_kb: Optional[int]
    complexity: Optional[str]
    complexity_source: Optional[str]
    passed: bool
    feedback: str
