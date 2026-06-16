"""Train the TerraMind Disease Detection model with TensorFlow/Keras."""

from __future__ import annotations

import argparse
from pathlib import Path
from typing import Any

import tensorflow as tf

if __package__ is None or __package__ == "":  # pragma: no cover - CLI bootstrap
    import sys

    sys.path.append(str(Path(__file__).resolve().parents[1]))
    from src.config import get_config, ensure_directories, save_class_mapping, save_json, set_seed, setup_logging
    from src.dataset import PlantVillageDataModule
    from src.evaluate import evaluate_model
    from src.model import build_model, compile_model
else:
    from .config import get_config, ensure_directories, save_class_mapping, save_json, set_seed, setup_logging
    from .dataset import PlantVillageDataModule
    from .evaluate import evaluate_model
    from .model import build_model, compile_model


def create_callbacks(best_model_path: Path) -> list[tf.keras.callbacks.Callback]:
    """Create the standard callback stack used during training."""

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
            patience=4,
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


def plot_history(history: dict[str, list[float]], plots_dir: Path) -> None:
    """Plot training and validation accuracy/loss curves."""

    import matplotlib.pyplot as plt

    ensure_directories(plots_dir)
    epochs = range(1, len(history.get("accuracy", [])) + 1)

    plt.figure(figsize=(10, 6))
    plt.plot(epochs, history.get("accuracy", []), label="Training Accuracy")
    plt.plot(epochs, history.get("val_accuracy", []), label="Validation Accuracy")
    plt.title("Accuracy Curve")
    plt.xlabel("Epoch")
    plt.ylabel("Accuracy")
    plt.ylim(0.0, 1.0)
    plt.grid(alpha=0.3)
    plt.legend()
    plt.tight_layout()
    plt.savefig(plots_dir / "accuracy_curve.png", dpi=200)
    plt.close()

    plt.figure(figsize=(10, 6))
    plt.plot(epochs, history.get("loss", []), label="Training Loss")
    plt.plot(epochs, history.get("val_loss", []), label="Validation Loss")
    plt.title("Loss Curve")
    plt.xlabel("Epoch")
    plt.ylabel("Loss")
    plt.grid(alpha=0.3)
    plt.legend()
    plt.tight_layout()
    plt.savefig(plots_dir / "loss_curve.png", dpi=200)
    plt.close()


def train_model(
    dataset_dir: str | Path | None = None,
    batch_size: int | None = None,
    epochs: int | None = None,
    learning_rate: float | None = None,
) -> dict[str, Any]:
    """Run the full training pipeline and return the results."""

    config = get_config()
    if dataset_dir is not None:
        config.dataset_dir = Path(dataset_dir)
    if batch_size is not None:
        config.batch_size = batch_size
    if epochs is not None:
        config.epochs = epochs
    if learning_rate is not None:
        config.learning_rate = learning_rate

    config.validate()
    ensure_directories(config.models_dir, config.outputs_dir, config.plots_dir, config.metrics_dir, config.logs_dir)
    logger = setup_logging(config.outputs_dir / "training.log")
    set_seed(config.random_seed)

    data_module = PlantVillageDataModule(config)
    train_ds, val_ds, _, class_names = data_module.build_datasets()
    save_class_mapping(class_names, config.class_mapping_path)
    save_json(
        {
            "training_split": config.training_split,
            "validation_split": config.validation_split,
            "test_split": config.test_split,
            "image_size": config.image_size,
            "batch_size": config.batch_size,
            "random_seed": config.random_seed,
        },
        config.split_info_path,
    )

    bundle = build_model(num_classes=len(class_names), config=config)
    model = compile_model(bundle.model, learning_rate=config.learning_rate)

    logger.info("Starting training with frozen EfficientNetB0 backbone.")
    history = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=config.epochs,
        callbacks=create_callbacks(config.best_model_path),
        verbose=1,
    )

    model.save(config.last_model_path)
    plot_history(history.history, config.plots_dir)
    save_json(history.history, config.metrics_dir / "training_history.json")
    save_json(
        {
            "epochs": config.epochs,
            "batch_size": config.batch_size,
            "learning_rate": config.learning_rate,
            "image_size": config.image_size,
            "num_classes": len(class_names),
            "classes": class_names,
        },
        config.metrics_dir / "training_summary.json",
    )

    logger.info("Training complete. Running evaluation on the test split.")
    metrics = evaluate_model(
        model_path=config.best_model_path,
        classes_path=config.class_mapping_path,
        dataset_dir=config.dataset_dir,
    )
    save_json(metrics, config.metrics_dir / "final_test_metrics.json")
    return {"history": history.history, "metrics": metrics, "classes": class_names}


def parse_args() -> argparse.Namespace:
    """Parse command-line arguments for training."""

    parser = argparse.ArgumentParser(description="Train the TerraMind disease model.")
    parser.add_argument("--dataset-dir", type=str, default=None, help="Path to the PlantVillage dataset.")
    parser.add_argument("--batch-size", type=int, default=None, help="Batch size.")
    parser.add_argument("--epochs", type=int, default=None, help="Number of training epochs.")
    parser.add_argument("--learning-rate", type=float, default=None, help="Learning rate.")
    return parser.parse_args()


def main() -> None:
    """Program entry point."""

    args = parse_args()
    logger = setup_logging(get_config().outputs_dir / "training.log")
    try:
        train_model(
            dataset_dir=args.dataset_dir,
            batch_size=args.batch_size,
            epochs=args.epochs,
            learning_rate=args.learning_rate,
        )
    except Exception:
        logger.exception("Training failed.")
        raise


if __name__ == "__main__":
    main()
