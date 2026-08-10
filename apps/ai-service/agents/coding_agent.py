import json
import logging
from typing import Dict, Any, TypedDict, List, Optional
from services.llm_service import generate_text, extract_json_object

logger = logging.getLogger("coding_agent")

from core.langgraph import LANGGRAPH_AVAILABLE, StateGraph, END


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
    # "llm" when complexity was determined by Gemini, "heuristic" when the
    # static keyword-scan fallback was used, None when code was empty.
    complexity_source: Optional[str]
    passed: bool
    feedback: str


from services.code_executor_service import execute_code_sandbox


def execute_sandbox_node(state: CodingState) -> CodingState:
    """Node 1: Execute candidate code in AST-inspected, resource-capped sandbox across all test cases."""
    code = state.get("code", "")
    language = state.get("language", "python")
    problem_id = state.get("problem_id", "virtualized-list")

    logger.info(f"Executing sandbox evaluation for problem {problem_id}")

    test_cases = state.get("test_cases")
    function_name = state.get("entry_function", "solution")

    if not test_cases:
        raise RuntimeError(
            f"No test cases provided for problem evaluation '{problem_id}'. "
            "Static fallback is disabled."
        )

    exec_res = execute_code_sandbox(
        code=code,
        language=language,
        test_cases=test_cases,
        entry_function=function_name
    )

    state["test_cases"] = test_cases
    state["passed_cases"] = exec_res.get("passed_cases", 0)
    state["total_cases"] = exec_res.get("total_cases", len(test_cases))
    state["pass_rate"] = exec_res.get("pass_rate", 0.0)
    state["execution_time_ms"] = exec_res.get("execution_time_ms", 0.0)
    # Real peak memory reported by the sandbox child (None when not measurable,
    # e.g. a timeout or process-level error). Never substitute a fabricated KB.
    state["memory_kb"] = exec_res.get("memory_kb")

    if not exec_res.get("security_passed", True):
        state["feedback"] = exec_res.get("error", "Security violation detected in submitted code.")

    return state



def analyze_complexity_node(state: CodingState) -> CodingState:
    """Node 2: Analyze time/space complexity using Gemini LLM or static heuristic."""
    from services.complexity_cache_service import get_cached_complexity, set_cached_complexity
    
    code = state.get("code", "")
    pass_rate = state.get("pass_rate", 0.0)

    complexity = None
    complexity_source: Optional[str] = None
    feedback = ""

    if code:
        # Try cache first
        cached = get_cached_complexity(code)
        if cached:
            complexity, complexity_source = cached
        else:
            # Not cached, run analysis
            prompt = (
                f"Analyze the time and space complexity of this candidate python code:\n\n"
                f"```python\n{code}\n```\n\n"
                f"Return JSON format: {{\"time_complexity\": \"O(N)\", \"space_complexity\": \"O(1)\", \"summary\": \"Brief explanation\"}}"
            )
            parsed = extract_json_object(generate_text(prompt))
            if parsed:
                complexity = parsed.get("time_complexity")
                feedback = parsed.get("summary", "")
                if complexity:
                    complexity_source = "llm"
                    # Cache the result
                    set_cached_complexity(code, complexity, complexity_source)

    # Static heuristic fallback when the LLM returned nothing usable.
    # Values are explicitly labelled "estimated (heuristic)" so callers can
    # distinguish them from exact LLM analysis rather than treating them as
    # authoritative measurements.
    if complexity is None and code:
        complexity_source = "heuristic"
        if "for " in code and "while " in code:
            complexity = "O(N^2) estimated (heuristic)"
            feedback = "Nested iteration detected. Estimated O(N^2) — heuristic only. Consider linear scan O(N)."
        elif "for " in code:
            complexity = "O(N) estimated (heuristic)"
            feedback = "Single-pass iteration detected. Estimated O(N) — heuristic only."
        else:
            complexity = "O(1) estimated (heuristic)"
            feedback = "No iteration detected. Estimated O(1) — heuristic only."
        
        # Cache the heuristic result too
        set_cached_complexity(code, complexity, complexity_source)

    passed = pass_rate >= 0.8
    score = round(pass_rate * 100.0, 1)

    state["complexity"] = complexity
    state["complexity_source"] = complexity_source
    state["passed"] = passed
    complexity_label = complexity if complexity is not None else "not available"
    state["feedback"] = f"Passed {state.get('passed_cases')}/{state.get('total_cases')} test cases ({score}%). Complexity: {complexity_label}. {feedback}"
    return state


def build_coding_graph():
    """Build LangGraph workflow graph for Coding Agent."""
    if not LANGGRAPH_AVAILABLE:
        return None

    builder = StateGraph(CodingState)
    builder.add_node("execute_sandbox", execute_sandbox_node)
    builder.add_node("analyze_complexity", analyze_complexity_node)

    builder.set_entry_point("execute_sandbox")
    builder.add_edge("execute_sandbox", "analyze_complexity")
    builder.add_edge("analyze_complexity", END)

    return builder.compile()


_coding_app = build_coding_graph()


async def run_coding_agent(
    application_id: str,
    problem_id: str,
    code: str,
    language: str = "python",
    submission_id: str = "",
    test_cases: List[dict] = None,
    entry_function: str = ""
) -> Dict[str, Any]:
    """Execute Coding Agent pipeline."""
    initial_state: CodingState = {
        "application_id": application_id,
        "problem_id": problem_id,
        "code": code,
        "language": language,
        "submission_id": submission_id,
        "test_cases": test_cases,
        "entry_function": entry_function,
    }

    if _coding_app:
        try:
            final_state = await _coding_app.ainvoke(initial_state)
            return {
                "score": round(final_state.get("pass_rate", 0.0) * 100.0, 1),
                "pass_rate": final_state.get("pass_rate", 0.0),
                "passed_cases": final_state.get("passed_cases", 0),
                "total_cases": final_state.get("total_cases", 0),
                "execution_time_ms": final_state.get("execution_time_ms", 0.0),
                "memory_kb": final_state.get("memory_kb"),
                "complexity_analysis": (
                    {
                        "time_complexity": final_state["complexity"],
                        "source": final_state.get("complexity_source"),
                    }
                    if final_state.get("complexity")
                    else None
                ),
                "passed": final_state.get("passed", False),
                "feedback": final_state.get("feedback", ""),
            }
        except Exception as e:
            logger.error(f"LangGraph execution error in Coding Agent: {e}")

    s1 = execute_sandbox_node(initial_state)
    s2 = analyze_complexity_node(s1)

    return {
        "score": round(s2.get("pass_rate", 0.0) * 100.0, 1),
        "pass_rate": s2.get("pass_rate", 0.0),
        "passed_cases": s2.get("passed_cases", 0),
        "total_cases": s2.get("total_cases", 0),
        "execution_time_ms": s2.get("execution_time_ms", 0.0),
        "memory_kb": s2.get("memory_kb"),
        "complexity_analysis": (
            {
                "time_complexity": s2["complexity"],
                "source": s2.get("complexity_source"),
            }
            if s2.get("complexity")
            else None
        ),
        "passed": s2.get("passed", False),
        "feedback": s2.get("feedback", ""),
    }
