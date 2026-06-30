"""Supervisor node for the TerraMind AI Advisor LangGraph workflow."""

from __future__ import annotations

import logging

from .state import AIAdvisorState
from ..rag.errors import AIAdvisorRAGError

logger = logging.getLogger(__name__)

SUPERVISOR_ROUTE = "farm_agent"


def supervisor_node(state: AIAdvisorState) -> dict[str, str]:
    """Route every request through the farm agent before the RAG agent.

    The supervisor remains intentionally simple for now so the workflow skeleton
    is easy to extend later with weather and disease specialists.
    """

    question = (state.get("user_query") or "").strip()
    if not question:
        raise AIAdvisorRAGError("The message cannot be empty.")

    logger.debug("Supervisor routing advisor request to %s", SUPERVISOR_ROUTE)
    return {"next_node": SUPERVISOR_ROUTE}


def route_supervisor(state: AIAdvisorState) -> str:
    """Return the next node name selected by the supervisor."""

    return state.get("next_node") or SUPERVISOR_ROUTE
