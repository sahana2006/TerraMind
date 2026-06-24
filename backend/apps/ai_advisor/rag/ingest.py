from __future__ import annotations

import logging
import shutil
from pathlib import Path
from typing import Iterable

from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pypdf import PdfReader

from .config import EMBEDDING_MODEL_NAME, get_config
from .errors import AIAdvisorDataError
from .metadata import build_document_metadata

logger = logging.getLogger(__name__)


_embeddings = None


def get_embeddings() -> HuggingFaceEmbeddings:
    """Create the local HuggingFace embedding model once per process."""

    global _embeddings
    if _embeddings is None:
        _embeddings = HuggingFaceEmbeddings(
            model_name=EMBEDDING_MODEL_NAME,
            model_kwargs={"local_files_only": True},
        )
    return _embeddings


def discover_pdf_files(data_dir: Path) -> list[Path]:
    return sorted(path for path in data_dir.rglob("*.pdf") if path.is_file())


def load_documents_from_pdfs(pdf_files: Iterable[Path], source_root: Path):
    documents = []
    for pdf_path in pdf_files:
        reader = PdfReader(str(pdf_path))
        for page_number, page in enumerate(reader.pages, start=1):
            text = page.extract_text() or ""
            if not text.strip():
                continue
            documents.append(
                Document(
                    page_content=text,
                    metadata=build_document_metadata(pdf_path, source_root, page_number=page_number),
                )
            )
    return documents


def split_documents(documents):
    config = get_config()
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=config.chunk_size,
        chunk_overlap=config.chunk_overlap,
    )
    return splitter.split_documents(documents)


def _reset_vector_db(vector_db_dir: Path) -> None:
    if vector_db_dir.exists():
        shutil.rmtree(vector_db_dir)
    vector_db_dir.mkdir(parents=True, exist_ok=True)


def build_vector_store() -> dict:
    """Rebuild the persistent Chroma store from the PDF corpus.

    We always delete and recreate the index so the Chroma collection matches the
    current embedding dimension and never mixes old vectors with the new model.
    """

    config = get_config()
    config.data_dir.mkdir(parents=True, exist_ok=True)
    config.vector_db_dir.mkdir(parents=True, exist_ok=True)

    pdf_files = discover_pdf_files(config.data_dir)
    if not pdf_files:
        raise AIAdvisorDataError(f"No PDF files found under {config.data_dir}")

    logger.info("Found %s PDF files for ingestion", len(pdf_files))
    source_documents = load_documents_from_pdfs(pdf_files, config.data_dir)
    if not source_documents:
        raise AIAdvisorDataError("No document pages could be loaded from the PDF corpus.")

    chunks = split_documents(source_documents)
    if not chunks:
        raise AIAdvisorDataError("Document splitting produced no chunks.")

    embeddings = get_embeddings()
    _reset_vector_db(config.vector_db_dir)

    vector_store = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        collection_name=config.collection_name,
        persist_directory=str(config.vector_db_dir),
    )

    if hasattr(vector_store, "persist"):
        vector_store.persist()

    logger.info(
        "Vector store built successfully: %s chunks stored in %s",
        len(chunks),
        config.vector_db_dir,
    )

    return {
        "pdf_files": len(pdf_files),
        "pages_loaded": len(source_documents),
        "chunks_created": len(chunks),
        "collection_name": config.collection_name,
        "vector_db_dir": str(config.vector_db_dir),
    }


def main() -> None:
    try:
        summary = build_vector_store()
    except Exception:
        logger.exception("AI Advisor ingestion failed")
        raise

    print(summary)


if __name__ == "__main__":
    import os
    import sys

    import django

    sys.path.insert(0, str(Path(__file__).resolve().parents[3]))
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "terramind.settings")
    django.setup()
    main()