import React, { useState, useEffect } from "react";
import "./ImageUpload.css";

export default function ImageUpload({ onImageUploadStatus }) {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [prediction, setPrediction] = useState("");
  const [confidence, setConfidence] = useState(null);
  const [analysis, setAnalysis] = useState([]);

  const [showPopup, setShowPopup] = useState(false);

  const [limeTaskId, setLimeTaskId] = useState(null);
  const [limeProgress, setLimeProgress] = useState(0);
  const [showLimeProgress, setShowLimeProgress] = useState(false);
  const [limeImageUrl, setLimeImageUrl] = useState("");

  useEffect(() => {
    if (!limeTaskId) return;

    setShowLimeProgress(true);
    setLimeProgress(0);

    const eventSource = new EventSource(
      `/lime-progress/${limeTaskId}`
    );

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.progress !== undefined) {
        setLimeProgress(data.progress);
      }

      if (data.lime_image) {
        setLimeImageUrl(`https://dog-breed-identifier-p98j.onrender.com/uploads/${data.lime_image}`);
        setShowLimeProgress(false);
        eventSource.close();
      }

      if (data.error) {
        alert("LIME failed: " + data.error);
        setShowLimeProgress(false);
        eventSource.close();
      }
    };

    eventSource.onerror = (err) => {
      console.error("SSE connection error:", err);
      eventSource.close();
    };

    return () => eventSource.close();
  }, [limeTaskId]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    setPrediction("");
    setConfidence(null);
    setAnalysis([]);
    setPreview(null);
    setShowPopup(false);
    setLimeTaskId(null);
    setLimeProgress(0);
    setShowLimeProgress(false);
    setLimeImageUrl("");

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
      onImageUploadStatus?.(true);
    } else {
      onImageUploadStatus?.(false);
    }
  };

  const handleUpload = async () => {
    if (!image) return;
    const formData = new FormData();
    formData.append("file", image);
    formData.append("username", localStorage.getItem("user"));

    const res = await fetch("https://dog-breed-identifier-p98j.onrender.com/api/predict", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (data.error) return alert(data.error);

    setPrediction(data.breed);
    setConfidence(data.confidence);
    setAnalysis(data.analysis || []);
  };

  const handleGenerateLIME = async () => {
    if (!image) return;

    setLimeImageUrl("");
    setShowLimeProgress(true);
    setLimeProgress(0);

    const formData = new FormData();
    formData.append("file", image);

    const res = await fetch("https://dog-breed-identifier-p98j.onrender.com/lime-job", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    const jobId = data.job_id;
    setLimeTaskId(jobId);
  };

  return (
    <div className="image-upload-container">
      {preview && (
        <div className="image-preview">
          <img src={preview} alt="Preview" />
        </div>
      )}

      {prediction && (
        <h2 className="prediction-title">
          Predicted: <em>{prediction}</em>{" "}
          {confidence != null && (
            <span className="prediction-confidence">({confidence}% confidence)</span>
          )}
        </h2>
      )}

      {analysis.length > 0 && (
        <div>
          <button className="action-button" onClick={() => setShowPopup(true)}>
            View Top Predictions
          </button>
          <button className="action-button" onClick={handleGenerateLIME}>
            Generate LIME Analysis
          </button>
        </div>
      )}

      {showLimeProgress && (
        <div className="lime-progress-bar">
          <div className="lime-progress-track">
            <div
              className="lime-progress-fill"
              style={{ width: `${limeProgress}%` }}
            />
          </div>
          <p className="lime-progress-label">LIME Progress: {limeProgress}%</p>
        </div>
      )}

      {limeImageUrl && (
        <div className="lime-image-section">
          <h3>The regions which contributed most to the model prediction</h3>
          <img src={limeImageUrl} alt="LIME" />
        </div>
      )}

      <div className="upload-section">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="upload-input"
        />
        <button
          onClick={handleUpload}
          disabled={!image}
          className="upload-button"
        >
          Upload & Predict
        </button>
      </div>

      {showPopup && (
        <div className="popup-overlay" onClick={() => setShowPopup(false)}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <h3>Top 5 Predictions</h3>
            <ul>
              {analysis.map((item, idx) => (
                <li key={idx}>
                  {idx + 1}. <strong>{item.breed}</strong> — {item.confidence}%
                </li>
              ))}
            </ul>
            <button
              className="popup-close-button"
              onClick={() => setShowPopup(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}