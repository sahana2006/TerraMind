from __future__ import annotations

import logging
from functools import lru_cache

from langchain_chroma import Chroma

from .config import get_config
from .errors import AIAdvisorConfigurationError, AIAdvisorVectorStoreError
from .ingest import get_embeddings

logger = logging.getLogger(__name__)


def _has_persisted_artifacts(vector_db_dir) -> bool:
    return vector_db_dir.exists() and any(path.name != ".gitkeep" for path in vector_db_dir.iterdir())


@lru_cache(maxsize=1)
def load_vector_store() -> Chroma:
    config = get_config()
    if not config.gemini_api_key:
        raise AIAdvisorConfigurationError(
            "Missing Gemini API key. Set GEMINI_API_KEY or GOOGLE_API_KEY in the environment."
        )

    if not _has_persisted_artifacts(config.vector_db_dir):
        raise AIAdvisorVectorStoreError(
            f"Vector database not found at {config.vector_db_dir}. Run ingest.py first."
        )

    try:
        return Chroma(
            collection_name=config.collection_name,
            persist_directory=str(config.vector_db_dir),
            embedding_function=get_embeddings(),
        )
    except Exception as exc:
        logger.exception("Unable to load persistent Chroma store")
        raise AIAdvisorVectorStoreError("Unable to load the persistent Chroma vector store.") from exc


@lru_cache(maxsize=1)
def get_retriever():
    config = get_config()
    vector_store = load_vector_store()
    return vector_store.as_retriever(search_type="similarity", search_kwargs={"k": config.retriever_k})