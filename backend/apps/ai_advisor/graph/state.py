"""Shared LangGraph state for the TerraMind AI Advisor."""

from __future__ import annotations

from typing import Any, NotRequired, TypedDict

from langchain_core.documents import Document


class AIAdvisorResponse(TypedDict):
    """Final response payload returned by the AI Advisor workflow."""

    answer: str
    sources: list[dict[str, Any]]


class AIAdvisorState(TypedDict):
    """Mutable shared state passed between LangGraph nodes."""

    user_query: str
    request_user_id: NotRequired[int | None]
    next_node: NotRequired[str]
    farm_context: NotRequired[dict[str, Any]]
    farm_context_text: NotRequired[str]
    weather_context: NotRequired[dict[str, Any]]
    weather_context_text: NotRequired[str]
    retrieved_documents: NotRequired[list[Document]]
    context: NotRequired[str]
    sources: NotRequired[list[dict[str, Any]]]
    final_response: NotRequired[AIAdvisorResponse]
