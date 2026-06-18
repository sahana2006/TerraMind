from __future__ import annotations

from functools import lru_cache
from pathlib import Path

import joblib
import pandas as pd
import shap


BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "model" / "crop_xgb_model.joblib"
EXPECTED_FEATURES = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]


class CropModelError(RuntimeError):
    pass


@lru_cache(maxsize=1)
def load_bundle() -> dict:
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Crop model not found at {MODEL_PATH}.")

    bundle = joblib.load(MODEL_PATH)
    for key in ("model", "label_encoder", "feature_columns"):
        if key not in bundle:
            raise CropModelError(f"Invalid crop model bundle: missing '{key}'.")
    return bundle


@lru_cache(maxsize=1)
def load_explainer():
    bundle = load_bundle()
    return shap.TreeExplainer(bundle["model"])


def _extract_class_shap_values(raw_values, class_index: int):
    if isinstance(raw_values, list):
        return raw_values[class_index]

    if getattr(raw_values, "ndim", None) == 3:
        return raw_values[0, :, class_index]

    if getattr(raw_values, "ndim", None) == 2:
        return raw_values[0]

    raise CropModelError("Unsupported SHAP output shape for crop model.")


def predict_crop(sample: dict[str, float]) -> dict[str, object]:
    bundle = load_bundle()
    model = bundle["model"]
    label_encoder = bundle["label_encoder"]
    feature_columns = bundle.get("feature_columns") or EXPECTED_FEATURES
    explainer = load_explainer()

    missing = [field for field in feature_columns if field not in sample]
    if missing:
        raise ValueError(f"Missing crop inputs: {missing}")

    frame = pd.DataFrame([[sample[column] for column in feature_columns]], columns=feature_columns)
    predicted_class = model.predict(frame)[0]
    probabilities = model.predict_proba(frame)[0]
    crop_name = label_encoder.inverse_transform([predicted_class])[0]
    class_index = int(predicted_class)

    raw_shap_values = explainer.shap_values(frame)
    class_shap_values = _extract_class_shap_values(raw_shap_values, class_index)
    feature_contributions = []

    for feature_name, shap_value in zip(feature_columns, class_shap_values):
        shap_float = float(shap_value)
        feature_contributions.append(
            {
                "feature": feature_name,
                "value": float(sample[feature_name]),
                "shap_value": shap_float,
                "direction": "positive" if shap_float >= 0 else "negative",
            }
        )

    top_contributions = sorted(
        feature_contributions,
        key=lambda item: abs(item["shap_value"]),
        reverse=True,
    )[:5]

    ranked = sorted(
        (
            {"crop": label, "probability": float(probability)}
            for label, probability in zip(label_encoder.classes_, probabilities)
        ),
        key=lambda item: item["probability"],
        reverse=True,
    )

    return {
        "recommended_crop": crop_name,
        "confidence": float(max(probabilities)),
        "top_predictions": ranked[:3],
        "feature_contributions": feature_contributions,
        "top_contributions": top_contributions,
    }
