from __future__ import annotations

import logging
from functools import lru_cache

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate

from .errors import AIAdvisorConfigurationError, AIAdvisorRAGError, AIAdvisorVectorStoreError
from .metadata import describe_source
from .prompts import SYSTEM_PROMPT
from .retriever import get_retriever

logger = logging.getLogger(__name__)


def _get_llm():
    from .config import get_config

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
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", SYSTEM_PROMPT),
            (
                "human",
                "Question: {question}\n\nRetrieved context:\n{context}\n\nAnswer in plain language.",
            ),
        ]
    )
    return prompt | _get_llm() | StrOutputParser()


def _format_context(documents) -> str:
    blocks = []
    for index, document in enumerate(documents, start=1):
        metadata = document.metadata or {}
        source_info = describe_source(metadata)
        page_number = source_info.get("page_number")
        page_label = f"Page {page_number}" if page_number is not None else "Page unknown"
        blocks.append(
            "\n".join(
                [
                    f"Chunk {index}",
                    f"Source: {source_info['source_filename']}",
                    f"Category: {source_info['category']}",
                    page_label,
                    document.page_content.strip(),
                ]
            )
        )
    return "\n\n---\n\n".join(blocks)


def _collect_sources(documents) -> list[dict]:
    sources: list[dict] = []
    seen: set[tuple] = set()
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
    retriever = get_retriever()
    return retriever.invoke(question)


def generate_answer(message: str) -> dict:
    question = (message or "").strip()
    if not question:
        raise AIAdvisorRAGError("The message cannot be empty.")

    try:
        documents = retrieve_documents(question) or []
    except AIAdvisorVectorStoreError:
        raise
    except Exception as exc:
        logger.exception("Retriever invocation failed")
        raise AIAdvisorRAGError("Unable to retrieve supporting documents.") from exc

    if not documents:
        return {
            "answer": "I could not find enough information in the uploaded documents to answer that confidently.",
            "sources": [],
        }

    sources = _collect_sources(documents)
    context = _format_context(documents)

    try:
        answer = get_rag_chain().invoke({"question": question, "context": context})
    except Exception as exc:
        logger.exception("Gemini answer generation failed")
        raise AIAdvisorRAGError("Unable to generate an answer right now.") from exc

    return {
        "answer": answer.strip(),
        "sources": sources,
    }
