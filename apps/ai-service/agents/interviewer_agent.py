import logging
from core.langgraph_shim import LANGGRAPH_AVAILABLE, StateGraph, END
from agents.interviewer_types import ACTIONS, MAX_TURNS, InterviewerState
from agents.interviewer_nodes import (
    load_context_node,
    evaluate_last_answer_node,
    decide_next_action_node,
    generate_question_node,
    generate_follow_up_node,
    advance_skill_node,
    close_interview_node,
)
from agents.interviewer_scoring import finalize_scores_node

export_actions = ACTIONS
export_max_turns = MAX_TURNS

logger = logging.getLogger("interviewer_agent")

def route_action(state: InterviewerState) -> str:
    return state.get("next_action", "generate_question")

def build_interviewer_graph():
    if not LANGGRAPH_AVAILABLE:
        return None

    graph_builder = StateGraph(InterviewerState)

    graph_builder.add_node("load_context", load_context_node)
    graph_builder.add_node("evaluate_last_answer", evaluate_last_answer_node)
    graph_builder.add_node("decide_next_action", decide_next_action_node)
    graph_builder.add_node("generate_question", generate_question_node)
    graph_builder.add_node("generate_follow_up", generate_follow_up_node)
    graph_builder.add_node("advance_skill", advance_skill_node)
    graph_builder.add_node("close_interview", close_interview_node)
    graph_builder.add_node("finalize_scores", finalize_scores_node)

    graph_builder.set_entry_point("load_context")
    graph_builder.add_edge("load_context", "evaluate_last_answer")
    graph_builder.add_edge("evaluate_last_answer", "decide_next_action")

    graph_builder.add_conditional_edges(
        "decide_next_action",
        route_action,
        {
            "generate_follow_up": "generate_follow_up",
            "generate_question": "generate_question",
            "advance_skill": "advance_skill",
            "close_interview": "close_interview",
        }
    )

    graph_builder.add_edge("generate_question", END)
    graph_builder.add_edge("generate_follow_up", END)
    graph_builder.add_edge("advance_skill", END)
    graph_builder.add_edge("close_interview", "finalize_scores")
    graph_builder.add_edge("finalize_scores", END)

    return graph_builder.compile()

interviewer_graph = build_interviewer_graph()

def run_interviewer_agent(state: InterviewerState) -> InterviewerState:
    if interviewer_graph:
        try:
            return interviewer_graph.invoke(state)
        except Exception as e:
            logger.error(f"LangGraph execution error: {e}. Falling back to linear execution.")

    state = load_context_node(state)
    state = evaluate_last_answer_node(state)
    state = decide_next_action_node(state)
    action = state.get("next_action", "generate_question")

    if action == "generate_follow_up":
        state = generate_follow_up_node(state)
    elif action == "advance_skill":
        state = advance_skill_node(state)
    elif action == "close_interview":
        state = close_interview_node(state)
    else:
        state = generate_question_node(state)

    return state
