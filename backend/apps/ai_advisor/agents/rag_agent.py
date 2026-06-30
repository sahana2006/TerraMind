"""RAG agent node for the TerraMind AI Advisor LangGraph workflow."""

from __future__ import annotations

import logging
from functools import lru_cache
from typing import Any

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate

from ..graph.state import AIAdvisorResponse, AIAdvisorState
from ..rag.errors import AIAdvisorConfigurationError, AIAdvisorRAGError, AIAdvisorVectorStoreError
from ..rag.metadata import describe_source
from ..rag.prompts import SYSTEM_PROMPT
from ..rag.retriever import get_retriever

logger = logging.getLogger(__name__)

MAX_DOCUMENT_CHARS = 3000
MAX_CONTEXT_CHARS = 12000


def _get_llm():
    """Instantiate the Gemini chat model using the existing advisor configuration."""

    from ..rag.config import get_config

    config = get_config()
    if not config.gemini_api_key:
        raise AIAdvisorConfigurationError(
            "Missing Gemini API key. Set GEMINI_API_KEY or GOOGLE_API_KEY in the environment."
        )

    try:
        from langchain_google_genai import ChatGoogleGenerativeAI
    except ImportError as exc:
        raise AIAdvisorConfigurationError(
            "Missing dependency langchain-google-genai. Add it to requirements and install dependencies."
        ) from exc

    return ChatGoogleGenerativeAI(
        model=config.llm_model,
        google_api_key=config.gemini_api_key,
        temperature=0.2,
    )


@lru_cache(maxsize=1)
def get_rag_chain():
    """Build the cached LangChain prompt + Gemini + parser pipeline."""

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", SYSTEM_PROMPT),
            (
                "human",
                "{farm_context_section}{weather_context_section}Question: {question}\n\nRetrieved context:\n{context}\n\nAnswer in plain language.",
            ),
        ]
    )
    return prompt | _get_llm() | StrOutputParser()


def _format_context(documents) -> str:
    """Convert retrieved documents into a compact context string."""

    blocks: list[str] = []
    for index, document in enumerate(documents, start=1):
        metadata = document.metadata or {}
        source_info = describe_source(metadata)
        page_number = source_info.get("page_number")
        page_label = f"Page {page_number}" if page_number is not None else "Page unknown"
        page_content = document.page_content.strip()
        if len(page_content) > MAX_DOCUMENT_CHARS:
            page_content = page_content[:MAX_DOCUMENT_CHARS].rstrip() + "\n[truncated]"
        blocks.append(
            "\n".join(
                [
                    f"Chunk {index}",
                    f"Source: {source_info['source_filename']}",
                    f"Category: {source_info['category']}",
                    page_label,
                    page_content,
                ]
            )
        )
    context = "\n\n---\n\n".join(blocks)
    if len(context) > MAX_CONTEXT_CHARS:
        context = context[:MAX_CONTEXT_CHARS].rstrip() + "\n\n[context truncated]"
    return context


def _collect_sources(documents) -> list[dict[str, Any]]:
    """Deduplicate source metadata so the frontend can render reference cards."""

    sources: list[dict[str, Any]] = []
    seen: set[tuple[Any, ...]] = set()
    for document in documents:
        metadata = document.metadata or {}
        source_info = describe_source(metadata)
        page_number = source_info.get("page_number")
        key = (
            source_info.get("source_filename"),
            source_info.get("source_path"),
            source_info.get("category"),
            page_number,
        )
        if key in seen:
            continue
        seen.add(key)
        sources.append(source_info)
    return sources


def retrieve_documents(question: str):
    """Retrieve supporting documents from the persisted Chroma vector store."""

    retriever = get_retriever()
    return retriever.invoke(question)


def _build_context_section(title: str, text: str | None) -> str:
    """Prepare an optional prompt section."""

    if not text:
        return ""
    return f"{title}:\n{text}\n\n"


def _fallback_response(sources: list[dict[str, Any]]) -> AIAdvisorResponse:
    return {
        "answer": (
            "I found relevant source material, but I couldn't generate a full answer right now. "
            "Please try again in a moment or review the sources below."
        ),
        "sources": sources,
    }


def _build_response(
    question: str,
    farm_context_text: str | None = None,
    weather_context_text: str | None = None,
) -> tuple[list[Any], str, AIAdvisorResponse]:
    """Execute the existing RAG flow and return documents, context, and response."""

    normalized_question = (question or "").strip()
    if not normalized_question:
        raise AIAdvisorRAGError("The message cannot be empty.")

    try:
        documents = retrieve_documents(normalized_question) or []
    except AIAdvisorVectorStoreError:
        raise
    except Exception as exc:
        logger.exception("Retriever invocation failed")
        raise AIAdvisorRAGError("Unable to retrieve supporting documents.") from exc

    if not documents:
        response: AIAdvisorResponse = {
            "answer": "I could not find enough information in the uploaded documents to answer that confidently.",
            "sources": [],
        }
        return documents, "", response

    sources = _collect_sources(documents)
    context = _format_context(documents)
    farm_context_section = _build_context_section("Farm context", farm_context_text)
    weather_context_section = _build_context_section("Weather context", weather_context_text)

    try:
        answer = get_rag_chain().invoke(
            {
                "question": normalized_question,
                "context": context,
                "farm_context_section": farm_context_section,
                "weather_context_section": weather_context_section,
            }
        )
    except AIAdvisorConfigurationError:
        raise
    except Exception:
        logger.exception("Gemini answer generation failed")
        return documents, context, _fallback_response(sources)

    answer_text = str(answer).strip()
    if not answer_text:
        return documents, context, _fallback_response(sources)

    response = {"answer": answer_text, "sources": sources}
    return documents, context, response


def generate_answer(message: str) -> dict[str, Any]:
    """Backward-compatible helper that returns the final RAG response."""

    _, _, response = _build_response(message)
    return response


def rag_agent_node(state: AIAdvisorState) -> dict[str, Any]:
    """LangGraph node that stores the RAG execution artifacts in shared state."""

    question = (state.get("user_query") or "").strip()
    farm_context_text = state.get("farm_context_text") or ""
    weather_context_text = state.get("weather_context_text") or ""
    logger.debug("RAG agent received advisor request")
    documents, context, final_response = _build_response(
        question,
        farm_context_text=farm_context_text,
        weather_context_text=weather_context_text,
    )

    return {
        "retrieved_documents": documents,
        "context": context,
        "sources": final_response["sources"],
        "final_response": final_response,
    }
