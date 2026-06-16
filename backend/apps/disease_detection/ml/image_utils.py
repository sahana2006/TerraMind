"""Reusable image preprocessing helpers for disease inference."""

from __future__ import annotations

import logging
from pathlib import Path

import numpy as np
from PIL import Image, UnidentifiedImageError

logger = logging.getLogger(__name__)

IMAGE_SIZE: tuple[int, int] = (224, 224)


class ImagePreprocessingError(ValueError):
    """Raised when an uploaded file cannot be decoded as an image."""


def preprocess_image(image_path: str | Path, target_size: tuple[int, int] = IMAGE_SIZE) -> np.ndarray:
    """Load an image from disk and prepare it for model inference.

    The trained TerraMind checkpoint already contains EfficientNetB0's
    built-in preprocessing layers, so this helper keeps the external steps
    limited to decoding, RGB conversion, resizing, and batch expansion.
    """

    path = Path(image_path)

    try:
        with Image.open(path) as image:
            rgb_image = image.convert("RGB")
            resized_image = rgb_image.resize(target_size, Image.Resampling.BILINEAR)
            image_array = np.asarray(resized_image, dtype=np.float32)
    except (FileNotFoundError, UnidentifiedImageError, OSError) as exc:
        logger.debug("Failed to preprocess image %s: %s", path, exc)
        raise ImagePreprocessingError("Invalid image file.") from exc

    if image_array.ndim != 3 or image_array.shape[-1] != 3:
        raise ImagePreprocessingError("Invalid image file.")

    return np.expand_dims(image_array, axis=0)
