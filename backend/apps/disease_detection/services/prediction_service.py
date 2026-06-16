"""Application service for disease prediction requests."""

from __future__ import annotations

from pathlib import Path
from typing import Any

from apps.disease_detection.ml.predictor import predict_image


def predict_leaf_disease(image_path: str | Path) -> dict[str, Any]:
    """Run the disease classifier on a saved leaf image."""

    return predict_image(str(image_path))
