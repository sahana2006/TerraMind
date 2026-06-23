from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
import os

from dotenv import load_dotenv
from django.conf import settings as django_settings

ENV_PATH = Path(__file__).resolve().parents[3] / ".env"
load_dotenv(ENV_PATH, override=False)

EMBEDDING_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"


@dataclass(frozen=True)
class AIAdvisorConfig:
    app_dir: Path
    data_dir: Path
    vector_db_dir: Path
    collection_name: str
    chunk_size: int
    chunk_overlap: int
    retriever_k: int
    gemini_api_key: str
    llm_model: str


def _setting(name: str, default):
    if django_settings.configured and hasattr(django_settings, name):
        value = getattr(django_settings, name)
        if value not in (None, ""):
            return value
    return os.getenv(name, default)


@lru_cache(maxsize=1)
def get_config() -> AIAdvisorConfig:
    app_dir = Path(__file__).resolve().parents[1]
    default_data_dir = app_dir / "data"
    default_vector_dir = app_dir / "vector_db"
    gemini_api_key = _setting("GEMINI_API_KEY", "") or _setting("GOOGLE_API_KEY", "")

    return AIAdvisorConfig(
        app_dir=app_dir,
        data_dir=Path(_setting("AI_ADVISOR_DATA_DIR", str(default_data_dir))),
        vector_db_dir=Path(_setting("AI_ADVISOR_VECTOR_DB_DIR", str(default_vector_dir))),
        collection_name=str(_setting("AI_ADVISOR_COLLECTION_NAME", "terramind_ai_advisor")),
        chunk_size=int(_setting("AI_ADVISOR_CHUNK_SIZE", 1000)),
        chunk_overlap=int(_setting("AI_ADVISOR_CHUNK_OVERLAP", 200)),
        retriever_k=int(_setting("AI_ADVISOR_RETRIEVER_K", 5)),
        gemini_api_key=str(gemini_api_key).strip(),
        llm_model=str(_setting("AI_ADVISOR_LLM_MODEL", "gemini-2.5-flash")),
    )
