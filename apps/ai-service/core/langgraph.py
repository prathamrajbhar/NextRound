"""Shared LangGraph availability flag and imports.

Every agent used to copy-paste the same try/except to detect whether LangGraph
is installed (8 copies, each with a slightly different warning). That decision
now lives here once; agents import `StateGraph`/`END` from this module and
branch on `LANGGRAPH_AVAILABLE` exactly as they always did.

When LangGraph is missing, `StateGraph` and `END` are bound to `None` so the
import never raises — the agents only reference them under
`if LANGGRAPH_AVAILABLE:` / `if not LANGGRAPH_AVAILABLE: return None`.
"""

import logging

logger = logging.getLogger("langgraph")

try:
    from langgraph.graph import StateGraph, END
    LANGGRAPH_AVAILABLE = True
except ImportError:
    StateGraph = None  # type: ignore[assignment]
    END = None  # type: ignore[assignment]
    LANGGRAPH_AVAILABLE = False
    logger.warning("LangGraph not installed. Agents will run linear node pipelines.")
