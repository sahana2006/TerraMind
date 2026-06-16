"""Prediction helpers for TerraMind Disease Detection."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

import numpy as np
import tensorflow as tf

if __package__ is None or __package__ == "":  # pragma: no cover - CLI bootstrap
    import sys

    sys.path.append(str(Path(__file__).resolve().parents[1]))
    from src.config import get_config, setup_logging
else:
    from .config import get_config, setup_logging


def _load_classes(classes_path: str | Path) -> list[str]:
    """Load the saved class list from JSON."""

    with Path(classes_path).open("r", encoding="utf-8") as handle:
        payload = json.load(handle)
    classes = payload.get("classes")
    if not classes:
        raise ValueError("Class mapping JSON does not contain a 'classes' list.")
    return list(classes)


def predict_image(
    image_path: str | Path,
    model_path: str | Path | None = None,
    classes_path: str | Path | None = None,
) -> dict[str, Any]:
    """Predict the disease class for a single image."""

    config = get_config()
    model_file = Path(model_path) if model_path is not None else config.best_model_path
    classes_file = Path(classes_path) if classes_path is not None else config.class_mapping_path

    if not model_file.exists():
        raise FileNotFoundError(f"Model not found: {model_file}")
    if not classes_file.exists():
        raise FileNotFoundError(f"Class mapping not found: {classes_file}")

    image_file = Path(image_path)
    if not image_file.exists():
        raise FileNotFoundError(f"Image not found: {image_file}")

    model = tf.keras.models.load_model(model_file)
    class_names = _load_classes(classes_file)

    image = tf.keras.utils.load_img(image_file, target_size=(config.image_size, config.image_size))
    image_array = tf.keras.utils.img_to_array(image)
    image_array = tf.expand_dims(image_array, axis=0)

    predictions = model.predict(image_array, verbose=0)[0]
    predicted_index = int(np.argmax(predictions))
    confidence = float(np.max(predictions)) * 100.0
    return {
        "predicted_class": class_names[predicted_index],
        "confidence": round(confidence, 2),
    }


def parse_args() -> argparse.Namespace:
    """Parse command-line arguments for single-image prediction."""

    parser = argparse.ArgumentParser(description="Predict a plant disease class from one image.")
    parser.add_argument("image_path", type=str, help="Path to the leaf image.")
    parser.add_argument("--model-path", type=str, default=None, help="Path to best_model.keras")
    parser.add_argument("--classes-path", type=str, default=None, help="Path to class_mapping.json")
    return parser.parse_args()


def main() -> None:
    """Program entry point."""

    args = parse_args()
    logger = setup_logging()
    try:
        result = predict_image(args.image_path, model_path=args.model_path, classes_path=args.classes_path)
        logger.info("Prediction result: %s", result)
        print(result)
    except Exception:
        logger.exception("Prediction failed.")
        raise


if __name__ == "__main__":
    main()
