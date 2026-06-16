# TerraMind Disease ML

Standalone TensorFlow/Keras project for plant disease classification with EfficientNetB0 transfer learning on the PlantVillage dataset.

This project is independent from the Django backend and is designed to export a Keras model that can be loaded later inside TerraMind APIs.

## Project Overview

Pipeline:

1. Automatically discover PlantVillage classes from `dataset/`
2. Split the data into train, validation, and test sets
3. Train an EfficientNetB0 classifier with Keras augmentation
4. Save the best model as `models/best_model.keras`
5. Evaluate the model on the test split
6. Export metrics, plots, and class mappings for deployment

## Folder Structure

```text
terramind-disease-ml/
├── dataset/
├── src/
│   ├── config.py
│   ├── dataset.py
│   ├── model.py
│   ├── train.py
│   ├── evaluate.py
│   └── predict.py
├── models/
├── outputs/
├── requirements.txt
└── README.md
```

## Dataset Setup

Download the PlantVillage dataset and place the class folders directly inside `dataset/`.

Expected structure:

```text
dataset/
├── Apple___Black_rot/
├── Apple___healthy/
├── Corn___Common_rust/
├── Corn___healthy/
└── ...
```

Classes are discovered dynamically from the folder names. No labels are hardcoded.

## Installation

Create a virtual environment, then install dependencies:

```bash
pip install -r requirements.txt
```

## Training

Run training from the project root:

```bash
python src/train.py
```

Optional overrides:

```bash
python src/train.py --dataset-dir dataset --batch-size 32 --epochs 10 --learning-rate 1e-4
```

## Fine-Tuning

To run the second-stage fine-tuning pass on the already trained model:

```bash
python src/fine_tune.py --model-path models/best_model.keras --epochs 5 --learning-rate 1e-5
```

This loads the existing model, unfreezes the last 20 EfficientNetB0 layers, and saves the improved checkpoint to `models/best_finetuned_model.keras`.

### Default Configuration

- Image size: `224 x 224`
- Batch size: `32`
- Epochs: `10`
- Learning rate: `1e-4`

### Model

- `tf.keras.applications.EfficientNetB0`
- `include_top=False`
- ImageNet pretrained weights
- GlobalAveragePooling2D
- Dropout
- Dense softmax output layer

### Augmentation

Applied only during training:

- RandomFlip
- RandomRotation
- RandomZoom

## Evaluation

Evaluation runs automatically after training, and you can also run it separately:

```bash
python src/evaluate.py --model-path models/best_model.keras
```

Saved outputs:

- `outputs/metrics/test_metrics.json`
- `outputs/metrics/classification_report.json`
- `outputs/metrics/classification_report.csv`
- `outputs/metrics/confusion_matrix.npy`
- `outputs/metrics/confusion_matrix.png`

## Prediction

Use the reusable helper:

```python
from src.predict import predict_image

result = predict_image("path/to/leaf.jpg")
print(result)
```

Example output:

```python
{
    "predicted_class": "Tomato___Early_blight",
    "confidence": 97.5
}
```

## Model Export

The trained model is saved as:

```text
models/best_model.keras
```

Future Django integration can load it directly with:

```python
model = tf.keras.models.load_model("models/best_model.keras")
```

## Future TerraMind Integration

This project is intentionally backend-independent. The exported model and class mapping JSON are ready to be consumed by a future REST API inside TerraMind’s Disease Intelligence Module.

## Expected Outputs

After training, you should see:

- `models/best_model.keras`
- `models/last_model.keras`
- `outputs/plots/accuracy_curve.png`
- `outputs/plots/loss_curve.png`
- `outputs/plots/confusion_matrix.png`
- `outputs/metrics/*`
