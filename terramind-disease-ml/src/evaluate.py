"""Evaluation utilities for TerraMind Disease Detection."""
# python src/evaluate.py --model-path models/best_model.keras
from __future__ import annotations

import argparse
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
import tensorflow as tf
from sklearn.metrics import classification_report, f1_score, precision_score, recall_score

if __package__ is None or __package__ == "":  # pragma: no cover - CLI bootstrap
    import sys

    sys.path.append(str(Path(__file__).resolve().parents[1]))
    from src.config import get_config, ensure_directories, save_json, setup_logging
    from src.dataset import PlantVillageDataModule
else:
    from .config import get_config, ensure_directories, save_json, setup_logging
    from .dataset import PlantVillageDataModule


def _load_class_names(classes_path: str | Path) -> list[str]:
    """Load class names from the saved JSON mapping."""

    import json

    with Path(classes_path).open("r", encoding="utf-8") as handle:
        payload = json.load(handle)
    classes = payload.get("classes")
    if not classes:
        raise ValueError("Class mapping JSON does not contain a 'classes' list.")
    return list(classes)


def _plot_confusion_matrix(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    class_names: list[str],
    output_path: Path,
) -> np.ndarray:
    """Plot and save a confusion matrix heatmap."""

    import matplotlib.pyplot as plt
    import seaborn as sns
    from sklearn.metrics import confusion_matrix

    labels = list(range(len(class_names)))
    cm = confusion_matrix(y_true, y_pred, labels=labels)
    plt.figure(figsize=(max(10, len(class_names) * 0.4), max(8, len(class_names) * 0.4)))
    sns.heatmap(cm, cmap="Blues", xticklabels=class_names, yticklabels=class_names, cbar=True)
    plt.title("Confusion Matrix")
    plt.ylabel("True Label")
    plt.xlabel("Predicted Label")
    plt.tight_layout()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(output_path, dpi=200)
    plt.close()
    np.save(output_path.with_suffix(".npy"), cm)
    return cm


def evaluate_model(
    model_path: str | Path | None = None,
    classes_path: str | Path | None = None,
    dataset_dir: str | Path | None = None,
) -> dict[str, Any]:
    """Evaluate a trained model on the test split and save metrics."""

    config = get_config()
    if model_path is None:
        model_path = config.best_model_path
    if classes_path is None:
        classes_path = config.class_mapping_path
    if dataset_dir is not None:
        config.dataset_dir = Path(dataset_dir)

    ensure_directories(config.outputs_dir, config.metrics_dir, config.plots_dir)
    logger = setup_logging(config.outputs_dir / "training.log")
    logger.info("Loading model from %s", model_path)

    if not Path(model_path).exists():
        raise FileNotFoundError(f"Model not found: {model_path}")
    if not Path(classes_path).exists():
        raise FileNotFoundError(f"Class mapping not found: {classes_path}")

    model = tf.keras.models.load_model(model_path)
    class_names = _load_class_names(classes_path)
    data_module = PlantVillageDataModule(config)
    _, _, test_ds, discovered_classes = data_module.build_datasets()

    if class_names != discovered_classes:
        logger.warning("Class mapping order differs from discovery order. Using saved mapping.")

    y_true_batches: list[np.ndarray] = []
    y_pred_batches: list[np.ndarray] = []

    for images, labels in test_ds:
        predictions = model.predict(images, verbose=0)
        y_pred_batches.append(np.argmax(predictions, axis=1))
        y_true_batches.append(np.argmax(labels.numpy(), axis=1))

    y_true = np.concatenate(y_true_batches) if y_true_batches else np.array([], dtype=int)
    y_pred = np.concatenate(y_pred_batches) if y_pred_batches else np.array([], dtype=int)

    test_accuracy = float((y_true == y_pred).mean()) if y_true.size else 0.0
    precision = precision_score(y_true, y_pred, average="weighted", zero_division=0)
    recall = recall_score(y_true, y_pred, average="weighted", zero_division=0)
    f1 = f1_score(y_true, y_pred, average="weighted", zero_division=0)

    report = classification_report(
        y_true,
        y_pred,
        labels=list(range(len(class_names))),
        target_names=class_names,
        output_dict=True,
        zero_division=0,
    )

    metrics = {
        "test_accuracy": round(test_accuracy, 6),
        "precision": round(float(precision), 6),
        "recall": round(float(recall), 6),
        "f1_score": round(float(f1), 6),
        "num_test_samples": int(y_true.shape[0]),
        "num_classes": len(class_names),
    }

    save_json(metrics, config.metrics_dir / "test_metrics.json")
    save_json(report, config.metrics_dir / "classification_report.json")
    pd.DataFrame(report).transpose().to_csv(config.metrics_dir / "classification_report.csv")
    _plot_confusion_matrix(y_true, y_pred, class_names, config.metrics_dir / "confusion_matrix.png")

    logger.info(
        "Test results -> accuracy: %.4f | precision: %.4f | recall: %.4f | f1: %.4f",
        test_accuracy,
        precision,
        recall,
        f1,
    )
    return metrics


def parse_args() -> argparse.Namespace:
    """Parse CLI arguments for evaluation."""

    parser = argparse.ArgumentParser(description="Evaluate the TerraMind disease model.")
    parser.add_argument("--model-path", type=str, default=None, help="Path to best_model.keras")
    parser.add_argument("--classes-path", type=str, default=None, help="Path to class_mapping.json")
    parser.add_argument("--dataset-dir", type=str, default=None, help="Path to the PlantVillage dataset.")
    return parser.parse_args()


def main() -> None:
    """Program entry point."""

    args = parse_args()
    logger = setup_logging(get_config().outputs_dir / "training.log")
    try:
        evaluate_model(model_path=args.model_path, classes_path=args.classes_path, dataset_dir=args.dataset_dir)
    except Exception:
        logger.exception("Evaluation failed.")
        raise


if __name__ == "__main__":
    main()
