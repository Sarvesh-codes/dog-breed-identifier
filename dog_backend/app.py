import os
import uuid
import json
import threading
import time
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from datetime import datetime
from PIL import Image
from flask import Flask, request, jsonify, send_from_directory, Response
from flask_cors import CORS
from lime import lime_image
from skimage.segmentation import mark_boundaries
import psycopg2
import tensorflow as tf
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
lime_jobs = {}

# PostgreSQL connection
def get_db_connection():
    return psycopg2.connect(
        dbname="dogbreed_db",
        user="doguser",
        password="dogpass",
        host="localhost",
        port="5432"
    )

# Initialize tables
def init_db():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    ''')
    cur.execute('''
        CREATE TABLE IF NOT EXISTS history (
            id SERIAL PRIMARY KEY,
            username TEXT,
            filename TEXT,
            breed TEXT,
            confidence REAL,
            timestamp TEXT
        )
    ''')
    conn.commit()
    cur.close()
    conn.close()

init_db()

# Load model and labels
model = tf.keras.models.load_model("dog_breed_model.h5")
df = pd.read_csv("breeds.csv")
class_names = sorted(df["breed"].unique().tolist())

def preprocess_image(path):
    img = Image.open(path).convert("RGB").resize((224, 224))
    arr = np.array(img) / 255.0
    return np.expand_dims(arr, axis=0)

@app.route("/uploads/<path:filename>")
def serve_uploaded_image(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

@app.route("/predict", methods=["POST"])
def predict():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400
    file = request.files["file"]
    username = request.form.get("username")
    if not username:
        return jsonify({"error": "Username not provided"}), 400

    filename = f"{uuid.uuid4().hex}.jpg"
    path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(path)

    image_tensor = preprocess_image(path)
    preds = model.predict(image_tensor)[0]
    top_idx = int(np.argmax(preds))
    breed = class_names[top_idx]
    conf = round(float(preds[top_idx]) * 100, 2)

    top5 = preds.argsort()[-5:][::-1]
    analysis = [
        {"breed": class_names[i], "confidence": round(float(preds[i]) * 100, 2)}
        for i in top5
    ]

    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO history (username, filename, breed, confidence, timestamp) VALUES (%s, %s, %s, %s, %s)",
        (username, filename, breed, conf, ts),
    )
    conn.commit()
    cur.close()
    conn.close()

    return jsonify({"breed": breed, "confidence": conf, "analysis": analysis})

@app.route("/signup", methods=["POST"])
def signup():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")
    pw_hash = generate_password_hash(password)
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("INSERT INTO users (username, password) VALUES (%s, %s)", (username, pw_hash))
        conn.commit()
        return jsonify({"message": "User registered successfully"})
    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        return jsonify({"error": "Username already exists"}), 409
    finally:
        cur.close()
        conn.close()

@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT password FROM users WHERE username = %s", (username,))
    row = cur.fetchone()
    cur.close()
    conn.close()
    if row and check_password_hash(row[0], password):
        return jsonify({"success": True, "message": "Login successful"})
    return jsonify({"success": False, "error": "Invalid credentials"}), 401

@app.route("/history", methods=["POST"])
def get_history():
    data = request.get_json()
    username = data.get("username")
    if not username:
        return jsonify({"error": "Username not provided"}), 400
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT filename, breed, confidence, timestamp FROM history WHERE username = %s ORDER BY timestamp DESC", (username,))
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify({
        "history": [
            {"filename": r[0], "breed": r[1], "confidence": r[2], "timestamp": r[3]}
            for r in rows
        ]
    })

@app.route("/lime-job", methods=["POST"])
def start_lime_job():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400
    file = request.files["file"]
    job_id = uuid.uuid4().hex
    filename = f"{job_id}.jpg"
    path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(path)

    lime_jobs[job_id] = {"progress": 0, "lime_image": None}
    threading.Thread(target=run_lime, args=(job_id, path), daemon=True).start()
    return jsonify({"job_id": job_id})

def run_lime(job_id, path):
    img = np.array(Image.open(path).resize((224, 224))) / 255.0
    explainer = lime_image.LimeImageExplainer()

    def batch_predict(images):
        batch_predict.counter += len(images)
        if batch_predict.counter % 10 == 0:
            lime_jobs[job_id]["progress"] = min(100, batch_predict.counter // 10)
        return model.predict(np.array(images))
    batch_predict.counter = 0

    explanation = explainer.explain_instance(
        img, batch_predict, top_labels=1, hide_color=0, num_samples=1000
    )
    temp, mask = explanation.get_image_and_mask(explanation.top_labels[0], positive_only=True, num_features=5, hide_rest=False)
    vis_path = path.replace(".jpg", "_lime.jpg")
    plt.imsave(vis_path, mark_boundaries(temp, mask))
    lime_jobs[job_id]["progress"] = 100
    lime_jobs[job_id]["lime_image"] = os.path.basename(vis_path)

@app.route("/lime-progress/<job_id>")
def lime_progress(job_id):
    def gen():
        while True:
            state = lime_jobs.get(job_id)
            if not state:
                break

            yield f"data: {json.dumps(state)}\n\n"

            # Only delete after image is set and progress is 100
            if state["progress"] >= 100 and state.get("lime_image"):
                del lime_jobs[job_id]
                break

            time.sleep(0.5)
    return Response(gen(), mimetype="text/event-stream")


if __name__ == "__main__":
    app.run(debug=True)
