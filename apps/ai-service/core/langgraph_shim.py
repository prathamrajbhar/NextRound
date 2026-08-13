











import logging

logger = logging.getLogger("langgraph")

try:
    from langgraph.graph import StateGraph, END
    LANGGRAPH_AVAILABLE = True
except ImportError:
    StateGraph = None
    END = None
    LANGGRAPH_AVAILABLE = False
    logger.warning("LangGraph not installed. Agents will run linear node pipelines.")
