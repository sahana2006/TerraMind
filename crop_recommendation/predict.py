from __future__ import annotations

import argparse
import json
from pathlib import Path

import joblib
import pandas as pd


BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "models" / "crop_xgb_model.joblib"


def load_bundle(model_path: Path = MODEL_PATH) -> dict:
    if not model_path.exists():
        raise FileNotFoundError(
            f"Model file not found at {model_path}. Run crop_recommendation/train.py first."
        )
    return joblib.load(model_path)


def predict_crop(sample: dict[str, float], model_path: Path = MODEL_PATH) -> dict[str, object]:
    bundle = load_bundle(model_path)
    model = bundle["model"]
    label_encoder = bundle["label_encoder"]
    feature_columns = bundle["feature_columns"]

    missing = [column for column in feature_columns if column not in sample]
    if missing:
        raise ValueError(f"Missing required features: {missing}")

    frame = pd.DataFrame([[sample[column] for column in feature_columns]], columns=feature_columns)
    predicted_class = model.predict(frame)[0]
    probabilities = model.predict_proba(frame)[0]
    crop_name = label_encoder.inverse_transform([predicted_class])[0]

    ranked = sorted(
        (
            {"crop": label, "probability": float(prob)}
            for label, prob in zip(label_encoder.classes_, probabilities)
        ),
        key=lambda item: item["probability"],
        reverse=True,
    )

    return {
        "recommended_crop": crop_name,
        "confidence": float(max(probabilities)),
        "top_predictions": ranked[:3],
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Predict crop recommendation with the trained XGBoost model.")
    parser.add_argument(
        "--input",
        required=True,
        help="JSON string or path to a JSON file with N, P, K, temperature, humidity, ph, rainfall.",
    )
    parser.add_argument(
        "--model",
        default=str(MODEL_PATH),
        help="Path to the trained model bundle.",
    )
    return parser.parse_args()


def load_input(raw_input: str) -> dict[str, float]:
    path = Path(raw_input)
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    return json.loads(raw_input)


def main() -> None:
    args = parse_args()
    sample = load_input(args.input)
    result = predict_crop(sample, Path(args.model))
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
