import logging
from typing import Dict, Any, TypedDict, List

logger = logging.getLogger("assessment_agent")

from core.langgraph_shim import LANGGRAPH_AVAILABLE, StateGraph, END


def _to_int(value, default: int = 0) -> int:
    """Coerce a value to int, tolerating Gemini's stringified numbers."""
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


class AssessmentState(TypedDict, total=False):
    application_id: str
    answers: List[dict]
    stored_questions: List[dict]
    total_time_seconds: int
    tab_switch_count: int
    min_score: float
    category_scores: dict
    correct_count: int
    total_questions: int
    score: float
    passed: bool
    feedback: str


def evaluate_answers_node(state: AssessmentState) -> AssessmentState:
    """Node 1: Compare candidate answers against session key and calculate category breakdown."""
    answers = state.get("answers", [])
    stored_q = state.get("stored_questions", [])
    logger.info(f"Evaluating aptitude answers for application {state.get('application_id')}")

    answer_key = {}


    if stored_q and isinstance(stored_q, list):
        for q in stored_q:
            q_id = str(q.get("id") or "")
            if q_id:
                correct_idx = q.get("correctIndex") if q.get("correctIndex") is not None else q.get("correct_index")
                answer_key[q_id] = {
                    "correctIndex": _to_int(correct_idx, -1),
                    "category": q.get("category"),
                }


    if not answer_key:
        raise ValueError("Aptitude evaluation requires stored_questions to be populated. Fallback is disabled.")

    categories = {}

    total_correct = 0
    total_q = len(answers)

    for ans in answers:
        q_id = ans.get("questionId")


        selected = _to_int(ans.get("selectedOption") if ans.get("selectedOption") is not None else ans.get("selectedOptionIndex"), -1)



        cat = ans.get("category") or (answer_key.get(q_id, {}).get("category") if q_id in answer_key else None) or "Uncategorized"

        if cat not in categories:
            categories[cat] = {"correct": 0, "total": 0}

        categories[cat]["total"] += 1
        correct_idx = answer_key.get(q_id, {}).get("correctIndex")

        if correct_idx is not None and correct_idx >= 0 and selected == correct_idx:
            categories[cat]["correct"] += 1
            total_correct += 1


    category_scores = {
        cat_name: round((stats["correct"] / stats["total"]) * 100.0, 1)
        for cat_name, stats in categories.items()
        if stats["total"] > 0
    }

    overall_score = round((total_correct / max(1, total_q)) * 100.0, 1)

    state["category_scores"] = category_scores
    state["correct_count"] = total_correct
    state["total_questions"] = total_q
    state["score"] = overall_score

    return state


def compute_verdict_node(state: AssessmentState) -> AssessmentState:
    """Node 2: Compare composite aptitude score against job passing threshold."""
    score = state.get("score")
    min_score = state.get("min_score")
    if score is None or min_score is None:
        raise ValueError("Aptitude verdict requires real score and min_score values.")
    tab_switches = state.get("tab_switch_count", 0)

    passed = score >= min_score
    reasoning = (
        f"Aptitude score of {score}% ({state.get('correct_count')}/{state.get('total_questions')} correct) "
        f"{'exceeds' if passed else 'does not meet'} passing threshold of {min_score}%."
    )
    if tab_switches > 3:
        reasoning += f" Warning: {tab_switches} tab switches recorded during test session."

    state["passed"] = passed
    state["feedback"] = reasoning
    return state


def build_assessment_graph():
    """Build LangGraph workflow graph for Assessment Agent."""
    if not LANGGRAPH_AVAILABLE:
        return None

    builder = StateGraph(AssessmentState)
    builder.add_node("evaluate_answers", evaluate_answers_node)
    builder.add_node("compute_verdict", compute_verdict_node)

    builder.set_entry_point("evaluate_answers")
    builder.add_edge("evaluate_answers", "compute_verdict")
    builder.add_edge("compute_verdict", END)

    return builder.compile()


_assessment_app = build_assessment_graph()


async def run_assessment_agent(
    application_id: str,
    answers: List[dict],
    stored_questions: List[dict] = None,
    total_time_seconds: int = 0,
    tab_switch_count: int = 0,
    min_score: float = 70.0
) -> Dict[str, Any]:
    """Execute Assessment Agent pipeline."""
    initial_state: AssessmentState = {
        "application_id": application_id,
        "answers": answers,
        "stored_questions": stored_questions or [],
        "total_time_seconds": total_time_seconds,
        "tab_switch_count": tab_switch_count,
        "min_score": min_score,
    }

    if _assessment_app:
        try:
            final_state = await _assessment_app.ainvoke(initial_state)
            return {
                "score": final_state.get("score", 0.0),
                "category_scores": final_state.get("category_scores", {}),
                "total_questions": final_state.get("total_questions", 0),
                "correct_answers": final_state.get("correct_count", 0),
                "passed": final_state.get("passed", False),
                "feedback": final_state.get("feedback", ""),
            }
        except Exception as e:
            logger.error(f"LangGraph execution error in Assessment Agent: {e}")

    s1 = evaluate_answers_node(initial_state)
    s2 = compute_verdict_node(s1)

    return {
        "score": s2.get("score", 0.0),
        "category_scores": s2.get("category_scores", {}),
        "total_questions": s2.get("total_questions", 0),
        "correct_answers": s2.get("correct_count", 0),
        "passed": s2.get("passed", False),
        "feedback": s2.get("feedback", ""),
    }
