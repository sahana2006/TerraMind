"""TensorFlow/Keras prediction entrypoint for disease detection."""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

import numpy as np
import tensorflow as tf

from .image_utils import ImagePreprocessingError, preprocess_image

logger = logging.getLogger(__name__)

MODEL_INPUT_SIZE: tuple[int, int] = (224, 224)
APP_DIR = Path(__file__).resolve().parent
MODEL_PATH = APP_DIR / "models" / "best_finetuned_model.keras"
CLASS_MAPPING_PATH = APP_DIR / "class_mapping.json"

_MODEL: tf.keras.Model | None = None
_CLASS_NAMES: list[str] | None = None
_MODEL_LOAD_ERROR: Exception | None = None
_CLASS_MAPPING_ERROR: Exception | None = None


class DiseaseModelError(RuntimeError):
    """Raised when the disease model or class mapping is unavailable."""


def _load_model() -> tf.keras.Model:
    """Load the saved TensorFlow/Keras model from disk."""

    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Model not found: {MODEL_PATH}")

    return tf.keras.models.load_model(MODEL_PATH, compile=False)


def _load_class_names() -> list[str]:
    """Load class names from the saved class mapping JSON."""

    if not CLASS_MAPPING_PATH.exists():
        raise FileNotFoundError(f"Class mapping not found: {CLASS_MAPPING_PATH}")

    with CLASS_MAPPING_PATH.open("r", encoding="utf-8") as handle:
        payload = json.load(handle)

    classes = payload.get("classes")
    if isinstance(classes, list) and classes:
        return [str(class_name) for class_name in classes]

    index_to_class = payload.get("index_to_class")
    if isinstance(index_to_class, dict) and index_to_class:
        ordered_indices = sorted(index_to_class.keys(), key=lambda value: int(value))
        return [str(index_to_class[index]) for index in ordered_indices]

    raise ValueError("Class mapping JSON must contain either 'classes' or 'index_to_class'.")


def _initialize_singletons() -> None:
    """Eagerly load model assets once per process."""

    global _MODEL, _CLASS_NAMES, _MODEL_LOAD_ERROR, _CLASS_MAPPING_ERROR

    try:
        _MODEL = _load_model()
        logger.info("Loaded disease detection model from %s", MODEL_PATH)
    except Exception as exc:  # pragma: no cover - startup failure path
        _MODEL_LOAD_ERROR = exc
        logger.exception("Unable to load disease detection model.")

    try:
        _CLASS_NAMES = _load_class_names()
        logger.info("Loaded %d disease classes from %s", len(_CLASS_NAMES), CLASS_MAPPING_PATH)
    except Exception as exc:  # pragma: no cover - startup failure path
        _CLASS_MAPPING_ERROR = exc
        logger.exception("Unable to load disease class mapping.")


def get_model() -> tf.keras.Model:
    """Return the cached disease classification model."""

    if _MODEL is None:
        raise DiseaseModelError("Disease classification model is unavailable.") from _MODEL_LOAD_ERROR
    return _MODEL


def get_class_names() -> list[str]:
    """Return the cached ordered class names."""

    if _CLASS_NAMES is None:
        raise DiseaseModelError("Disease class mapping is unavailable.") from _CLASS_MAPPING_ERROR
    return _CLASS_NAMES


def predict_image(image_path: str) -> dict[str, Any]:
    """Predict the disease class for a single uploaded leaf image."""

    model = get_model()
    class_names = get_class_names()
    image_array = preprocess_image(image_path, target_size=MODEL_INPUT_SIZE)

    predictions = model.predict(image_array, verbose=0)
    scores = np.asarray(predictions)[0] if np.asarray(predictions).ndim > 1 else np.asarray(predictions)

    predicted_index = int(np.argmax(scores))
    if predicted_index < 0 or predicted_index >= len(class_names):
        raise DiseaseModelError("Model returned an invalid prediction index.")

    confidence = round(float(np.max(scores)) * 100.0, 2)
    return {
        "disease": class_names[predicted_index],
        "confidence": confidence,
    }


_initialize_singletons()
