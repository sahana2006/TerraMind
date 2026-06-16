from tensorflow.keras.models import load_model

model = load_model("models/best_model.keras")

print("Model loaded successfully")
print(model.summary())