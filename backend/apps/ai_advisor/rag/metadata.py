from __future__ import annotations

from pathlib import Path


CATEGORY_KEYWORDS = {
    "crop": ("crop", "crops", "cultivation", "agronomy", "yield", "harvest", "seed", "sowing"),
    "disease": ("disease", "diseases", "pest", "pests", "fungus", "fungal", "blight", "virus", "infection"),
    "fertilizer": ("fertilizer", "fertilis", "nutrient", "nutrients", "manure", "compost", "npk", "soil"),
    "irrigation": ("irrigation", "water", "drip", "sprinkler", "watering", "moisture", "hydro"),
}


def infer_category(file_path: Path) -> str:
    """Map a PDF to one of the advisory categories using path and filename hints."""

    haystack = " ".join([part.lower() for part in file_path.parts] + [file_path.stem.lower()])
    for category in ("crop", "disease", "fertilizer", "irrigation"):
        if any(keyword in haystack for keyword in CATEGORY_KEYWORDS[category]):
            return category
    return "crop"


def build_document_metadata(file_path: Path, source_root: Path, page_number: int | None = None) -> dict:
    relative_path = file_path.relative_to(source_root) if file_path.is_relative_to(source_root) else file_path.name
    metadata = {
        "source_filename": file_path.name,
        "source_path": str(relative_path).replace("\\", "/"),
        "category": infer_category(file_path),
    }
    if page_number is not None:
        metadata["page_number"] = page_number
    return metadata


def describe_source(metadata: dict) -> dict:
    page_number = metadata.get("page_number")
    return {
        "source_filename": metadata.get("source_filename", "unknown"),
        "source_path": metadata.get("source_path", metadata.get("source_filename", "unknown")),
        "category": metadata.get("category", "crop"),
        "page_number": page_number,
    }
