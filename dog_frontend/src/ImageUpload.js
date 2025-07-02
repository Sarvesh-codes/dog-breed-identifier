import React, { useState, useEffect } from "react";

export default function ImageUpload({ onImageUploadStatus }) {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [prediction, setPrediction] = useState("");
  const [confidence, setConfidence] = useState(null);
  const [analysis, setAnalysis] = useState([]);

  // Modal for top-5 analysis
  const [showPopup, setShowPopup] = useState(false);

  // LIME-related state
  const [limeTaskId, setLimeTaskId] = useState(null);
  const [limeProgress, setLimeProgress] = useState(0);
  const [showLimeProgress, setShowLimeProgress] = useState(false);
  const [limeImageUrl, setLimeImageUrl] = useState("");

  // Poll LIME progress whenever we have a task ID
  useEffect(() => {
    if (!limeTaskId) return;

    setShowLimeProgress(true);
    setLimeProgress(0);

    const eventSource = new EventSource(
      `http://localhost:5000/lime-progress/${limeTaskId}`
    );

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.progress !== undefined) {
        setLimeProgress(data.progress);
      }

      if (data.lime_image) {
        setLimeImageUrl(`http://localhost:5000/uploads/${data.lime_image}`);
        setShowLimeProgress(false);
        eventSource.close(); // Stop listening after completion
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

    const res = await fetch("http://localhost:5000/api/predict", {
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

    const res = await fetch("http://localhost:5000/lime-job", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    const jobId = data.job_id;
    setLimeTaskId(jobId); // triggers useEffect for progress tracking
  };

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
      {preview && (
        <div
          style={{
            backgroundColor: "black", // #1e1e1e → black
            padding: 6,
            borderRadius: 12,
            boxShadow: "0 0 12px rgba(255,255,255,0.1)",
          }}
        >
          <img
            src={preview}
            alt="Preview"
            style={{
              width: "100%",
              maxHeight: 500,
              objectFit: "contain",
              borderRadius: 10,
            }}
          />
        </div>
      )}

      {prediction && (
        <h2 style={{ margin: "1.5rem 0", color: "lightgreen" }}>
          Predicted: <em>{prediction}</em>{" "}
          {confidence != null && (
            <span style={{ fontSize: 14, color: "lightgray" }}>
              ({confidence}% confidence)
            </span>
          )}
        </h2>
      )}

      {analysis.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <button
            onClick={() => setShowPopup(true)}
            style={{
              marginRight: 8,
              padding: "8px 16px",
              backgroundColor: "purple",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            View Top Predictions
          </button>
          <button
            onClick={handleGenerateLIME}
            style={{
              padding: "8px 16px",
              backgroundColor: "purple",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Generate LIME Analysis
          </button>
        </div>
      )}

      {/* LIME Progress Bar */}
      {showLimeProgress && (
        <div style={{ margin: "1rem 0", textAlign: "left" }}>
          <div
            style={{
              backgroundColor: "dimgray", // #444
              height: 12,
              borderRadius: 6,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${limeProgress}%`,
                backgroundColor: "limegreen", // #00e676
                height: "100%",
                transition: "width 0.4s",
              }}
            />
          </div>
          <p style={{ color: "lightgray", margin: "4px 0 0 0", fontSize: 14 }}>
            LIME Progress: {limeProgress}%
          </p>
        </div>
      )}

      {/* Show final LIME image inline */}
      {limeImageUrl && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ color: "lightgreen" }}>
            The regions which contributed most to the model prediction
          </h3>
          <img
            src={limeImageUrl}
            alt="LIME"
            style={{ width: "100%", borderRadius: 8 }}
          />
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{
            marginRight: 8,
            padding: 8,
            backgroundColor: "gray", // #333
            color: "white",
            borderRadius: 6,
            border: "1px solid dimgray", // #555
          }}
        />
        <button
          onClick={handleUpload}
          disabled={!image}
          style={{
            padding: "8px 24px",
            backgroundColor: "green", // #4caf50
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: image ? "pointer" : "not-allowed",
          }}
        >
          Upload & Predict
        </button>
      </div>

      {/* Analysis Popup */}
      {showPopup && (
        <div
          onClick={() => setShowPopup(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "#222", // no valid named equivalent
              padding: 24,
              borderRadius: 12,
              maxWidth: 500,
              width: "90%",
              color: "white",
              textAlign: "left",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <h3 style={{ marginBottom: 16 }}>Top 5 Predictions</h3>
            <ul style={{ listStyle: "none", paddingLeft: 0 }}>
              {analysis.map((item, idx) => (
                <li key={idx} style={{ marginBottom: 8 }}>
                  {idx + 1}. <strong>{item.breed}</strong> — {item.confidence}%
                </li>
              ))}
            </ul>
            <button
              onClick={() => setShowPopup(false)}
              style={{
                marginTop: 24,
                padding: "8px 16px",
                backgroundColor: "red", // #f44336
                color: "white",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}