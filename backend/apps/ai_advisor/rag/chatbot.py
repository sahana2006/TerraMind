"""Backward-compatible wrapper around the LangGraph advisor workflow."""

from __future__ import annotations

from typing import Any

from ..graph.workflow import invoke_advisor_workflow
from .errors import AIAdvisorConfigurationError, AIAdvisorRAGError, AIAdvisorVectorStoreError


def generate_answer(message: str, user_id: int | None = None) -> dict[str, Any]:
    """Preserve the public API while delegating execution to LangGraph."""

    return invoke_advisor_workflow(message, user_id=user_id)
