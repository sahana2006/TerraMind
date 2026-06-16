"""Dataset discovery, split creation, and tf.data pipeline construction."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import os
import shutil
from typing import Iterable

import tensorflow as tf
from sklearn.model_selection import train_test_split

from .config import MLConfig


@dataclass(slots=True)
class DatasetSplitPaths:
    """Directory paths for the generated train/validation/test splits."""

    train_dir: Path
    val_dir: Path
    test_dir: Path


class PlantVillageDataModule:
    """Prepare PlantVillage splits and load them as Keras datasets."""

    def __init__(self, config: MLConfig) -> None:
        """Initialize the data module."""

        self.config = config
        self.config.validate()

    def discover_classes(self) -> list[str]:
        """Discover class names from the dataset directory."""

        dataset_dir = self._validate_dataset_dir()
        class_names = sorted(
            item.name
            for item in dataset_dir.iterdir()
            if item.is_dir()
            and not item.name.startswith("_")
            and self._collect_images(item)
        )
        if not class_names:
            raise ValueError(f"No class folders found in {dataset_dir}")
        return class_names

    def prepare_splits(self) -> tuple[DatasetSplitPaths, list[str]]:
        """Create deterministic train, validation, and test split directories."""

        class_names = self.discover_classes()
        if self.config.split_root_dir.exists():
            shutil.rmtree(self.config.split_root_dir)

        train_dir = self.config.split_root_dir / "train"
        val_dir = self.config.split_root_dir / "val"
        test_dir = self.config.split_root_dir / "test"

        for root in (train_dir, val_dir, test_dir):
            root.mkdir(parents=True, exist_ok=True)
            for class_name in class_names:
                (root / class_name).mkdir(parents=True, exist_ok=True)

        for class_name in class_names:
            class_dir = self.config.dataset_dir / class_name
            image_paths = self._collect_images(class_dir)
            if not image_paths:
                raise ValueError(f"No images found in class folder: {class_dir}")

            train_paths, temp_paths = train_test_split(
                image_paths,
                test_size=self.config.validation_split + self.config.test_split,
                random_state=self.config.random_seed,
                shuffle=True,
            )
            val_paths, test_paths = train_test_split(
                temp_paths,
                test_size=self.config.test_split / (self.config.validation_split + self.config.test_split),
                random_state=self.config.random_seed,
                shuffle=True,
            )

            self._materialize_files(train_paths, train_dir / class_name)
            self._materialize_files(val_paths, val_dir / class_name)
            self._materialize_files(test_paths, test_dir / class_name)

        return DatasetSplitPaths(train_dir, val_dir, test_dir), class_names

    def build_datasets(
        self,
    ) -> tuple[tf.data.Dataset, tf.data.Dataset, tf.data.Dataset, list[str]]:
        """Build tf.data datasets from the generated split directories."""

        split_paths, class_names = self.prepare_splits()
        common_kwargs = {
            "labels": "inferred",
            "label_mode": "categorical",
            "class_names": class_names,
            "image_size": (self.config.image_size, self.config.image_size),
            "batch_size": self.config.batch_size,
            "color_mode": self.config.color_mode,
            "seed": self.config.random_seed,
        }

        train_ds = tf.keras.utils.image_dataset_from_directory(
            split_paths.train_dir,
            shuffle=True,
            **common_kwargs,
        )
        val_ds = tf.keras.utils.image_dataset_from_directory(
            split_paths.val_dir,
            shuffle=False,
            **common_kwargs,
        )
        test_ds = tf.keras.utils.image_dataset_from_directory(
            split_paths.test_dir,
            shuffle=False,
            **common_kwargs,
        )

        autotune = tf.data.AUTOTUNE
        train_ds = train_ds.prefetch(buffer_size=autotune)
        val_ds = val_ds.prefetch(buffer_size=autotune)
        test_ds = test_ds.prefetch(buffer_size=autotune)
        return train_ds, val_ds, test_ds, class_names

    @staticmethod
    def _collect_images(class_dir: Path) -> list[Path]:
        """Collect image files from a class directory."""

        allowed_extensions = {".jpg", ".jpeg", ".png", ".bmp", ".gif", ".webp"}
        return sorted(
            path for path in class_dir.iterdir() if path.is_file() and path.suffix.lower() in allowed_extensions
        )

    @staticmethod
    def _materialize_files(source_paths: Iterable[Path], destination_dir: Path) -> None:
        """Create hard links when possible, otherwise copy the files."""

        for source in source_paths:
            destination = destination_dir / source.name
            if destination.exists():
                continue
            try:
                os.link(source, destination)
            except OSError:
                shutil.copy2(source, destination)

    def _validate_dataset_dir(self) -> Path:
        """Ensure the dataset directory exists."""

        dataset_dir = self.config.dataset_dir
        if not dataset_dir.exists():
            raise FileNotFoundError(
                f"Dataset directory not found: {dataset_dir}. "
                "Place PlantVillage class folders inside dataset/."
            )
        if not dataset_dir.is_dir():
            raise NotADirectoryError(f"Dataset path is not a directory: {dataset_dir}")
        return dataset_dir
