"""Second-stage fine-tuning for the TerraMind EfficientNetB0 disease model."""

from __future__ import annotations

import argparse
from pathlib import Path
from typing import Any

import numpy as np
import tensorflow as tf

if __package__ is None or __package__ == "":  # pragma: no cover - CLI bootstrap
    import sys

    sys.path.append(str(Path(__file__).resolve().parents[1]))
    from src.config import get_config, ensure_directories, save_json, set_seed, setup_logging
    from src.dataset import PlantVillageDataModule
    from src.evaluate import evaluate_model
    from src.model import count_trainable_parameters, unfreeze_loaded_model_tail
else:
    from .config import get_config, ensure_directories, save_json, set_seed, setup_logging
    from .dataset import PlantVillageDataModule
    from .evaluate import evaluate_model
    from .model import count_trainable_parameters, unfreeze_loaded_model_tail


def create_callbacks(best_model_path: Path) -> list[tf.keras.callbacks.Callback]:
    """Create callbacks for the fine-tuning stage."""

    return [
        tf.keras.callbacks.ModelCheckpoint(
            filepath=str(best_model_path),
            monitor="val_accuracy",
            mode="max",
            save_best_only=True,
            save_weights_only=False,
            verbose=1,
        ),
        tf.keras.callbacks.EarlyStopping(
            monitor="val_loss",
            patience=3,
            restore_best_weights=True,
            verbose=1,
        ),
        tf.keras.callbacks.ReduceLROnPlateau(
            monitor="val_loss",
            factor=0.2,
            patience=2,
            min_lr=1e-7,
            verbose=1,
        ),
    ]


def plot_finetune_curves(history: dict[str, list[float]], plots_dir: Path) -> None:
    """Plot fine-tuning accuracy and loss curves."""

    import matplotlib.pyplot as plt

    ensure_directories(plots_dir)
    epochs = range(1, len(history.get("accuracy", [])) + 1)

    plt.figure(figsize=(10, 6))
    plt.plot(epochs, history.get("accuracy", []), label="Training Accuracy")
    plt.plot(epochs, history.get("val_accuracy", []), label="Validation Accuracy")
    plt.title("Fine-Tuned Accuracy")
    plt.xlabel("Epoch")
    plt.ylabel("Accuracy")
    plt.ylim(0.0, 1.0)
    plt.grid(alpha=0.3)
    plt.legend()
    plt.tight_layout()
    plt.savefig(plots_dir / "finetuned_accuracy.png", dpi=200)
    plt.close()

    plt.figure(figsize=(10, 6))
    plt.plot(epochs, history.get("loss", []), label="Training Loss")
    plt.plot(epochs, history.get("val_loss", []), label="Validation Loss")
    plt.title("Fine-Tuned Loss")
    plt.xlabel("Epoch")
    plt.ylabel("Loss")
    plt.grid(alpha=0.3)
    plt.legend()
    plt.tight_layout()
    plt.savefig(plots_dir / "finetuned_loss.png", dpi=200)
    plt.close()


def _compute_test_accuracy(
    model: tf.keras.Model,
    test_ds: tf.data.Dataset,
) -> float:
    """Compute test accuracy for a loaded model without saving artifacts."""

    y_true_batches: list[np.ndarray] = []
    y_pred_batches: list[np.ndarray] = []

    for images, labels in test_ds:
        predictions = model.predict(images, verbose=0)
        y_pred_batches.append(np.argmax(predictions, axis=1))
        y_true_batches.append(np.argmax(labels.numpy(), axis=1))

    y_true = np.concatenate(y_true_batches) if y_true_batches else np.array([], dtype=int)
    y_pred = np.concatenate(y_pred_batches) if y_pred_batches else np.array([], dtype=int)
    return float((y_true == y_pred).mean()) if y_true.size else 0.0


def fine_tune_model(
    model_path: str | Path | None = None,
    dataset_dir: str | Path | None = None,
    classes_path: str | Path | None = None,
    best_finetuned_model_path: str | Path | None = None,
    epochs: int = 5,
    learning_rate: float = 1e-5,
) -> dict[str, Any]:
    """Load an existing model and run a second-stage fine-tuning pass."""

    config = get_config()
    if model_path is None:
        model_path = config.best_model_path
    if dataset_dir is not None:
        config.dataset_dir = Path(dataset_dir)
    if classes_path is None:
        classes_path = config.class_mapping_path
    if best_finetuned_model_path is None:
        best_finetuned_model_path = config.models_dir / "best_finetuned_model.keras"

    ensure_directories(config.models_dir, config.outputs_dir, config.plots_dir, config.metrics_dir, config.logs_dir)
    logger = setup_logging(config.outputs_dir / "training.log")
    set_seed(config.random_seed)

    logger.info("Loading pretrained model from %s", model_path)
    model = tf.keras.models.load_model(model_path)
    unfreeze_loaded_model_tail(model, 20)

    trainable_params, non_trainable_params = count_trainable_parameters(model)
    print(f"Trainable Parameters: {trainable_params}")
    print(f"Non-Trainable Parameters: {non_trainable_params}")
    logger.info("Trainable Parameters: %s", trainable_params)
    logger.info("Non-Trainable Parameters: %s", non_trainable_params)

    data_module = PlantVillageDataModule(config)
    train_ds, val_ds, test_ds, class_names = data_module.build_datasets()

    try:
        import json

        with Path(classes_path).open("r", encoding="utf-8") as handle:
            payload = json.load(handle)
        saved_classes = payload.get("classes", [])
        if saved_classes and saved_classes != class_names:
            logger.warning("Saved class mapping differs from discovered class order. Using discovered classes.")
    except FileNotFoundError as exc:
        raise FileNotFoundError(f"Class mapping not found: {classes_path}") from exc

    initial_accuracy = _compute_test_accuracy(model, test_ds)

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=learning_rate),
        loss=tf.keras.losses.CategoricalCrossentropy(),
        metrics=[tf.keras.metrics.CategoricalAccuracy(name="accuracy")],
    )

    history = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=epochs,
        callbacks=create_callbacks(Path(best_finetuned_model_path)),
        verbose=1,
    )

    plot_finetune_curves(history.history, config.plots_dir)
    save_json(history.history, config.metrics_dir / "finetune_history.json")

    metrics = evaluate_model(
        model_path=best_finetuned_model_path,
        classes_path=classes_path,
        dataset_dir=config.dataset_dir,
    )
    final_accuracy = float(metrics.get("test_accuracy", 0.0))
    improvement = ((final_accuracy - initial_accuracy) / initial_accuracy * 100.0) if initial_accuracy > 0 else 0.0

    logger.info("Initial Accuracy: %.4f", initial_accuracy)
    logger.info("Final Accuracy: %.4f", final_accuracy)
    logger.info("Improvement Percentage: %.2f%%", improvement)

    save_json(metrics, config.metrics_dir / "finetuned_metrics.json")
    save_json(
        {
            "initial_accuracy": round(initial_accuracy, 6),
            "final_accuracy": round(final_accuracy, 6),
            "improvement_percentage": round(improvement, 2),
            "trainable_parameters": trainable_params,
            "non_trainable_parameters": non_trainable_params,
            "epochs": epochs,
            "learning_rate": learning_rate,
            "classes": class_names,
        },
        config.metrics_dir / "finetune_summary.json",
    )

    return {
        "history": history.history,
        "metrics": metrics,
        "initial_accuracy": initial_accuracy,
        "final_accuracy": final_accuracy,
        "improvement_percentage": improvement,
        "trainable_parameters": trainable_params,
        "non_trainable_parameters": non_trainable_params,
    }


def parse_args() -> argparse.Namespace:
    """Parse CLI arguments for fine-tuning."""

    parser = argparse.ArgumentParser(description="Fine-tune the existing TerraMind disease model.")
    parser.add_argument("--model-path", type=str, default=None, help="Path to models/best_model.keras")
    parser.add_argument("--dataset-dir", type=str, default=None, help="Path to the PlantVillage dataset.")
    parser.add_argument("--classes-path", type=str, default=None, help="Path to class_mapping.json")
    parser.add_argument(
        "--best-finetuned-model-path",
        type=str,
        default=None,
        help="Path to save models/best_finetuned_model.keras",
    )
    parser.add_argument("--epochs", type=int, default=5, help="Number of fine-tuning epochs.")
    parser.add_argument("--learning-rate", type=float, default=1e-5, help="Fine-tuning learning rate.")
    return parser.parse_args()


def main() -> None:
    """Program entry point."""

    args = parse_args()
    logger = setup_logging(get_config().outputs_dir / "training.log")
    try:
        fine_tune_model(
            model_path=args.model_path,
            dataset_dir=args.dataset_dir,
            classes_path=args.classes_path,
            best_finetuned_model_path=args.best_finetuned_model_path,
            epochs=args.epochs,
            learning_rate=args.learning_rate,
        )
    except Exception:
        logger.exception("Fine-tuning failed.")
        raise


if __name__ == "__main__":
    main()
