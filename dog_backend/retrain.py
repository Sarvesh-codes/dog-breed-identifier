import os
import numpy as np
import pandas as pd
import tensorflow as tf
from PIL import Image
import psycopg2

# --- Configuration ---
UPLOAD_FOLDER = "uploads"
MODEL_PATH = "dog_breed_model.h5"
BREEDS_CSV = "breeds.csv"

# --- Load model and class names ---
model = tf.keras.models.load_model(MODEL_PATH)
class_names = sorted(pd.read_csv(BREEDS_CSV)["breed"].unique().tolist())
num_classes = len(class_names)

# --- DB connection ---
def get_db_connection():
    return psycopg2.connect(
        dbname="dogbreed_db",
        user="doguser",
        password="dogpass",
        host="localhost",
        port="5432"
    )

# --- Image preprocessing ---
def preprocess_image(path):
    img = Image.open(path).convert("RGB").resize((224, 224))
    arr = np.array(img) / 255.0
    return arr

# --- Fetch retrainable data ---
conn = get_db_connection()
cur = conn.cursor()
cur.execute("SELECT filename, label FROM retrain_data")
rows = cur.fetchall()
cur.close()
conn.close()

images, labels = [], []
for path, label in rows:
    full_path = os.path.join(UPLOAD_FOLDER, path)
    if os.path.exists(full_path) and label in class_names:
        images.append(preprocess_image(full_path))
        labels.append(class_names.index(label))

if not images:
    print("No new data for retraining.")
    exit()

X = np.array(images)
y = tf.keras.utils.to_categorical(np.array(labels), num_classes=num_classes)

# --- Retrain model ---
model.fit(X, y, epochs=3, batch_size=8, verbose=1)
model.save(MODEL_PATH)
print("✅ Retraining complete. Model saved.")

# --- Cleanup used data ---
conn = get_db_connection()
cur = conn.cursor()
cur.execute("DELETE FROM retrain_data")
conn.commit()
cur.close()
conn.close()
print("🧹 retrain_data table cleared.")
