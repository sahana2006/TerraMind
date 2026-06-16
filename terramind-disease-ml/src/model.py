"""EfficientNetB0 transfer learning model for TerraMind Disease Detection."""

from __future__ import annotations

from dataclasses import dataclass

import tensorflow as tf

from .config import MLConfig


@dataclass(slots=True)
class ModelBundle:
    """Container for the compiled model and backbone references."""

    model: tf.keras.Model
    base_model: tf.keras.Model
    augmentation_model: tf.keras.Model


def build_augmentation_layer(config: MLConfig) -> tf.keras.Model:
    """Build the training-only Keras augmentation pipeline."""

    return tf.keras.Sequential(
        [
            tf.keras.layers.RandomFlip("horizontal"),
            tf.keras.layers.RandomRotation(config.rotation_factor),
            tf.keras.layers.RandomZoom(config.zoom_factor),
        ],
        name="augmentation",
    )


def build_model(num_classes: int, config: MLConfig) -> ModelBundle:
    """Build the EfficientNetB0 classification model."""

    if num_classes <= 1:
        raise ValueError("num_classes must be greater than 1.")

    inputs = tf.keras.Input(shape=(config.image_size, config.image_size, 3), name="input")
    augmentation = build_augmentation_layer(config)
    x = augmentation(inputs)

    base_model = tf.keras.applications.EfficientNetB0(
        include_top=False,
        weights="imagenet",
        input_tensor=x,
    )
    base_model.trainable = False

    x = base_model.output
    x = tf.keras.layers.GlobalAveragePooling2D(name="global_average_pooling")(x)
    x = tf.keras.layers.Dropout(config.dropout_rate, name="dropout")(x)
    outputs = tf.keras.layers.Dense(num_classes, activation="softmax", name="predictions")(x)

    model = tf.keras.Model(inputs=inputs, outputs=outputs, name="terramind_disease_efficientnetb0")
    return ModelBundle(model=model, base_model=base_model, augmentation_model=augmentation)


def compile_model(model: tf.keras.Model, learning_rate: float) -> tf.keras.Model:
    """Compile the model with Adam and categorical cross entropy."""

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=learning_rate),
        loss=tf.keras.losses.CategoricalCrossentropy(),
        metrics=[tf.keras.metrics.CategoricalAccuracy(name="accuracy")],
    )
    return model


def get_efficientnet_base_model(model: tf.keras.Model) -> tf.keras.Model:
    """Return the EfficientNetB0 backbone from a loaded TerraMind model."""

    try:
        return model.get_layer("efficientnetb0")
    except ValueError as exc:
        if any(layer.name == "global_average_pooling" for layer in model.layers):
            return model
        raise ValueError(
            "Could not locate the EfficientNetB0 backbone. "
            "The model must be the TerraMind EfficientNetB0 architecture."
        ) from exc


def unfreeze_last_layers(base_model: tf.keras.Model, last_n: int) -> None:
    """Unfreeze only the last N layers of the EfficientNetB0 backbone."""

    if last_n <= 0:
        raise ValueError("last_n must be greater than 0.")

    base_model.trainable = True
    if last_n >= len(base_model.layers):
        for layer in base_model.layers:
            layer.trainable = True
        return

    for layer in base_model.layers[:-last_n]:
        layer.trainable = False
    for layer in base_model.layers[-last_n:]:
        layer.trainable = True


def count_trainable_parameters(model: tf.keras.Model) -> tuple[int, int]:
    """Return the trainable and non-trainable parameter counts for a model."""

    trainable_params = int(sum(tf.keras.backend.count_params(weight) for weight in model.trainable_weights))
    non_trainable_params = int(
        sum(tf.keras.backend.count_params(weight) for weight in model.non_trainable_weights)
    )
    return trainable_params, non_trainable_params


def unfreeze_loaded_model_tail(model: tf.keras.Model, last_n: int = 20) -> None:
    """Unfreeze the last EfficientNetB0 backbone layers in a loaded TerraMind model.

    The saved Keras model may be flattened, so this function treats the
    layers before ``global_average_pooling`` as the backbone and keeps the
    classification head trainable.
    """

    if last_n <= 0:
        raise ValueError("last_n must be greater than 0.")

    try:
        head_start = next(index for index, layer in enumerate(model.layers) if layer.name == "global_average_pooling")
    except StopIteration:
        # Fall back to the last-N overall behavior if the expected head cannot be found.
        for layer in model.layers[:-last_n]:
            layer.trainable = False
        for layer in model.layers[-last_n:]:
            layer.trainable = True
        return

    backbone_layers = model.layers[:head_start]
    head_layers = model.layers[head_start:]

    for layer in backbone_layers:
        layer.trainable = False

    tail_start = max(0, len(backbone_layers) - last_n)
    for layer in backbone_layers[tail_start:]:
        layer.trainable = True

    for layer in head_layers:
        layer.trainable = True
