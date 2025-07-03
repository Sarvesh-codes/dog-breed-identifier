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
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from lime import lime_image
from skimage.segmentation import mark_boundaries
import psycopg2
import tensorflow as tf
from werkzeug.security import generate_password_hash, check_password_hash
from io import BytesIO
from waitress import serve
from flask import send_from_directory

app = Flask(__name__,static_folder='static', static_url_path='')
CORS(app)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
lime_jobs = {}

def get_db_connection():
    #return psycopg2.connect(
    #    dbname="dogbreed_db",
    #    user="doguser",
    #    password="dogpass",
    #    host="localhost",
    #    port="5432"
    #)                             Connecting to local postgresql
    db_url = os.environ.get("DATABASE_URL")   #connecting to render postgresql
    if not db_url:
        raise Exception("DATABASE_URL not set in environment variables")
    return psycopg2.connect(db_url)

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
    cur.execute('''
        CREATE TABLE IF NOT EXISTS uploads (
            id SERIAL PRIMARY KEY,
            filename TEXT,
            image BYTEA,
            uploaded_at TIMESTAMP
        )
    ''')
    conn.commit()
    cur.close()
    conn.close()

init_db()

# ✅ Load fixed model only
model = tf.keras.models.load_model("dog_breed_model.h5")
df = pd.read_csv("breeds.csv")
class_names = sorted(df["breed"].unique().tolist())
print("✅ Model loaded: dog_breed_model.h5")

@app.route("/uploads/<path:filename>")
def serve_uploaded_image(filename):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT image, 'image/jpeg' FROM uploads WHERE filename = %s", (filename,))
    row = cur.fetchone()
    cur.close()
    conn.close()
    if row:
        image_data, content_type = row
        return Response(image_data, mimetype=content_type)
    else:
        return jsonify({"error": "Image not found"}), 404

@app.route("/api/predict", methods=["POST"])
def predict():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400
    file = request.files["file"]
    username = request.form.get("username")
    if not username:
        return jsonify({"error": "Username not provided"}), 400

    filename = f"{uuid.uuid4().hex}.jpg"
    ts = datetime.now()
    image_bytes = file.read()

    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("INSERT INTO uploads (filename, image, uploaded_at) VALUES (%s, %s, %s)",
                (filename, psycopg2.Binary(image_bytes), ts))
    conn.commit()

    img = Image.open(BytesIO(image_bytes)).convert("RGB").resize((224, 224))
    image_tensor = np.expand_dims(np.array(img) / 255.0, axis=0)
    preds = model.predict(image_tensor)[0]
    top_idx = int(np.argmax(preds))
    breed = class_names[top_idx]
    conf = round(float(preds[top_idx]) * 100, 2)

    top5 = preds.argsort()[-5:][::-1]
    analysis = [{"breed": class_names[i], "confidence": round(float(preds[i]) * 100, 2)} for i in top5]

    cur.execute("INSERT INTO history (username, filename, breed, confidence, timestamp) VALUES (%s, %s, %s, %s, %s)",
                (username, filename, breed, conf, ts.strftime("%Y-%m-%d %H:%M:%S")))
    conn.commit()

    cur.close()
    conn.close()

    return jsonify({"breed": breed, "confidence": conf, "analysis": analysis})

@app.route("/api/signup", methods=["POST"])
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

@app.route("/api/login", methods=["POST"])
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

    explanation = explainer.explain_instance(img, batch_predict, top_labels=1, hide_color=0, num_samples=1000)
    temp, mask = explanation.get_image_and_mask(explanation.top_labels[0], positive_only=True, num_features=5, hide_rest=False)

    buffer = BytesIO()
    plt.imsave(buffer, mark_boundaries(temp, mask), format='jpg')
    buffer.seek(0)
    image_bytes = buffer.read()

    filename = path.replace(".jpg", "_lime.jpg").split(os.sep)[-1]
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("INSERT INTO uploads (filename, image, uploaded_at) VALUES (%s, %s, %s)",
                (filename, psycopg2.Binary(image_bytes), datetime.now()))
    conn.commit()
    cur.close()
    conn.close()

    if os.path.exists(path):
        os.remove(path)

    lime_jobs[job_id]["progress"] = 100
    lime_jobs[job_id]["lime_image"] = filename

@app.route("/lime-progress/<job_id>")
def lime_progress(job_id):
    def gen():
        while True:
            state = lime_jobs.get(job_id)
            if not state:
                break
            yield f"data: {json.dumps(state)}\n\n"
            if state["progress"] >= 100 and state.get("lime_image"):
                del lime_jobs[job_id]
                break
            time.sleep(0.5)
    return Response(gen(), mimetype="text/event-stream")

@app.route("/api/history", methods=["POST"])
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
    return jsonify({"history": [
        {"filename": r[0], "breed": r[1], "confidence": r[2], "timestamp": r[3]}
        for r in rows
    ]})

@app.route("/api/clear", methods=["POST"])
def clear_image():
    data = request.get_json()
    username = data.get("username")
    filename = data.get("filename")
    if not (username and filename):
        return jsonify({"error": "Missing data"}), 400
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM history WHERE username = %s AND filename = %s", (username, filename))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"message": "Entry cleared"})

@app.route("/api/clear-all", methods=["POST"])
def clear_all_images():
    data = request.get_json()
    username = data.get("username")
    if not username:
        return jsonify({"error": "Missing username"}), 400
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM history WHERE username = %s", (username,))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"message": "All history cleared"})


@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    # First try to serve static files
    static_file = os.path.join(app.static_folder, path)
    if os.path.exists(static_file) and not path.startswith('api/'):
        return send_from_directory(app.static_folder, path)
    # Then fallback to index.html for React Router
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == "__main__":
    serve(app, host="0.0.0.0", port=5000)
