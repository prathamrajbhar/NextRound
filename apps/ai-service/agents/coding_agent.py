import json
import logging
import os
from typing import Dict, Any, TypedDict, List
from services.llm_service import generate_text, extract_json_object

logger = logging.getLogger("coding_agent")

try:
    from langgraph.graph import StateGraph, END
    LANGGRAPH_AVAILABLE = True
except ImportError:
    LANGGRAPH_AVAILABLE = False
    logger.warning("LangGraph not installed. Coding Agent will use linear node execution.")


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
    memory_kb: int
    complexity: str
    passed: bool
    feedback: str


from services.code_executor_service import execute_code_sandbox


def execute_sandbox_node(state: CodingState) -> CodingState:
    """Node 1: Execute candidate code in AST-inspected, resource-capped sandbox across all test cases."""
    code = state.get("code", "")
    language = state.get("language", "python")
    problem_id = state.get("problem_id", "virtualized-list")

    logger.info(f"Executing sandbox evaluation for problem {problem_id}")

    # Load problem definition from seed file
    seed_path = os.path.join(os.path.dirname(__file__), "../../api/src/data/coding-problems.json")
    test_cases = []
    function_name = ""
    if os.path.exists(seed_path):
        try:
            with open(seed_path, "r", encoding="utf-8") as f:
                problems = json.load(f)
                target_p = next((p for p in problems if p["id"] == problem_id), problems[0])
                test_cases = target_p.get("testCases", [])
                function_name = target_p.get("entryFunction", "")
        except Exception as e:
            logger.error(f"Failed to load coding problem seed data: {e}")

    if not test_cases:
        test_cases = [
            {"input": "heights = [50, 50, 50, 50, 50], scroll_y = 100, viewport_height = 100", "expectedOutput": "[2, 3]"}
        ]

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
    state["memory_kb"] = exec_res.get("memory_kb", 42000)

    if not exec_res.get("security_passed", True):
        state["feedback"] = exec_res.get("error", "Security violation detected in submitted code.")

    return state



def analyze_complexity_node(state: CodingState) -> CodingState:
    """Node 2: Analyze time/space complexity using Gemini LLM or static heuristic."""
    code = state.get("code", "")
    pass_rate = state.get("pass_rate", 0.0)

    complexity = "O(N)"
    feedback = ""

    if code:
        prompt = (
            f"Analyze the time and space complexity of this candidate python code:\n\n"
            f"```python\n{code}\n```\n\n"
            f"Return JSON format: {{\"time_complexity\": \"O(N)\", \"space_complexity\": \"O(1)\", \"summary\": \"Brief explanation\"}}"
        )
        parsed = extract_json_object(generate_text(prompt))
        if parsed:
            complexity = parsed.get("time_complexity", "O(N)")
            feedback = parsed.get("summary", "")

    if not feedback:
        if "for " in code and "while " in code:
            complexity = "O(N^2)"
            feedback = "Nested iteration detected. Time complexity is O(N^2). Consider linear scan O(N)."
        elif "for " in code:
            complexity = "O(N)"
            feedback = "Optimal single-pass linear time complexity O(N)."
        else:
            complexity = "O(1)"
            feedback = "Constant time execution O(1)."

    passed = pass_rate >= 0.8
    score = round(pass_rate * 100.0, 1)

    state["complexity"] = complexity
    state["passed"] = passed
    state["feedback"] = f"Passed {state.get('passed_cases')}/{state.get('total_cases')} test cases ({score}%). Complexity: {complexity}. {feedback}"
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
    submission_id: str = ""
) -> Dict[str, Any]:
    """Execute Coding Agent pipeline."""
    initial_state: CodingState = {
        "application_id": application_id,
        "problem_id": problem_id,
        "code": code,
        "language": language,
        "submission_id": submission_id,
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
                "memory_kb": final_state.get("memory_kb", 0),
                "complexity_analysis": {
                    "time_complexity": final_state.get("complexity", "O(N)"),
                },
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
        "memory_kb": s2.get("memory_kb", 0),
        "complexity_analysis": {
            "time_complexity": s2.get("complexity", "O(N)"),
        },
        "passed": s2.get("passed", False),
        "feedback": s2.get("feedback", ""),
    }
