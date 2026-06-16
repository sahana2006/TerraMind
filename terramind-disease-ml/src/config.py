"""Configuration and shared helpers for TerraMind Disease ML."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import json
import logging
import os
import random
from typing import Any

import numpy as np
import tensorflow as tf


PROJECT_ROOT = Path(__file__).resolve().parents[1]


@dataclass(slots=True)
class MLConfig:
    """Central configuration for the TerraMind disease detection project."""

    project_root: Path = PROJECT_ROOT
    dataset_dir: Path = PROJECT_ROOT / "dataset"
    splits_dir: Path = PROJECT_ROOT / "generated_splits"
    src_dir: Path = PROJECT_ROOT / "src"
    models_dir: Path = PROJECT_ROOT / "models"
    outputs_dir: Path = PROJECT_ROOT / "outputs"
    plots_dir: Path = PROJECT_ROOT / "outputs" / "plots"
    metrics_dir: Path = PROJECT_ROOT / "outputs" / "metrics"
    logs_dir: Path = PROJECT_ROOT / "logs"
    split_root_dir: Path = PROJECT_ROOT / "generated_splits"
    best_model_path: Path = PROJECT_ROOT / "models" / "best_model.keras"
    last_model_path: Path = PROJECT_ROOT / "models" / "last_model.keras"
    class_mapping_path: Path = PROJECT_ROOT / "outputs" / "metrics" / "class_mapping.json"
    split_info_path: Path = PROJECT_ROOT / "outputs" / "metrics" / "split_info.json"
    image_size: int = 224
    batch_size: int = 32
    epochs: int = 10
    learning_rate: float = 1e-4
    random_seed: int = 42
    training_split: float = 0.8
    validation_split: float = 0.1
    test_split: float = 0.1
    dropout_rate: float = 0.3
    rotation_factor: float = 0.1
    zoom_factor: float = 0.1
    use_mixed_precision: bool = False
    color_mode: str = "rgb"

    def validate(self) -> None:
        """Validate the split configuration."""

        split_total = round(self.training_split + self.validation_split + self.test_split, 8)
        if split_total != 1.0:
            raise ValueError(
                "training_split, validation_split, and test_split must sum to 1.0. "
                f"Received {split_total}."
            )


def get_config() -> MLConfig:
    """Return the default ML configuration."""

    return MLConfig()


def ensure_directories(*paths: Path) -> None:
    """Create directories if they do not already exist."""

    for path in paths:
        path.mkdir(parents=True, exist_ok=True)


def setup_logging(log_file: Path | None = None) -> logging.Logger:
    """Configure console and optional file logging."""

    logger = logging.getLogger("terramind_disease_ml")
    logger.setLevel(logging.INFO)
    logger.propagate = False

    if logger.handlers:
        return logger

    formatter = logging.Formatter("%(asctime)s | %(levelname)s | %(message)s")

    stream_handler = logging.StreamHandler()
    stream_handler.setFormatter(formatter)
    logger.addHandler(stream_handler)

    if log_file is not None:
        log_file.parent.mkdir(parents=True, exist_ok=True)
        file_handler = logging.FileHandler(log_file, encoding="utf-8")
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)

    return logger


def save_json(data: dict[str, Any], path: Path) -> None:
    """Persist JSON data to disk."""

    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(data, handle, indent=2, sort_keys=True)


def set_seed(seed: int) -> None:
    """Set global random seeds for reproducibility."""

    random.seed(seed)
    np.random.seed(seed)
    tf.keras.utils.set_random_seed(seed)
    os.environ["PYTHONHASHSEED"] = str(seed)


def save_class_mapping(class_names: list[str], path: Path) -> dict[str, int]:
    """Save dynamic class mappings as JSON."""

    class_to_index = {name: index for index, name in enumerate(class_names)}
    payload = {
        "classes": class_names,
        "class_to_index": class_to_index,
        "index_to_class": {str(index): name for name, index in class_to_index.items()},
    }
    save_json(payload, path)
    return class_to_index
