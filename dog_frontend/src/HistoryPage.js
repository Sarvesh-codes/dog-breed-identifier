import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [modalImage, setModalImage] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      const username = localStorage.getItem("user");
      if (!username) return;

      const res = await fetch("http://localhost:5000/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      const data = await res.json();
      setHistory(data.history || []);
    };

    fetchHistory();
  }, []);

  const openModal = (filename) => {
    setModalImage(`http://localhost:5000/uploads/${filename}`);
  };

  const closeModal = () => {
    setModalImage(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleClear = async (filename) => {
    const username = localStorage.getItem("user");
    if (!username) return;

    await fetch("http://localhost:5000/clear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, filename }),
    });

    setHistory((prev) => prev.filter((item) => item.filename !== filename));
  };

  const handleClearAll = async () => {
    const username = localStorage.getItem("user");
    if (!username) return;

    await fetch("http://localhost:5000/clear-all", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });

    setHistory([]);
  };

  return (
    <div style={{ padding: "2rem", textAlign: "center", position: "relative" }}>
      {/* Back Button */}
      <button
        onClick={() => navigate("/predict")}
        style={{
          position: "absolute",
          top: "1rem",
          left: "1rem",
          padding: "0.5rem 1rem",
          backgroundColor: "#555",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        ⬅ Back
      </button>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        style={{
          position: "absolute",
          top: "1rem",
          right: "1rem",
          padding: "0.5rem 1rem",
          backgroundColor: "#e53935",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        Logout
      </button>

      <h2 style={{ marginBottom: "1.5rem" }}>View History</h2>

      {history.length === 0 ? (
        <p>No history found.</p>
      ) : (
        <div style={gridContainer}>
          {history.map((item, index) => (
            <div key={index} style={cardStyle}>
              <img
                src={`http://localhost:5000/uploads/${item.filename}`}
                alt="Uploaded"
                style={imageStyle}
              />
              <p><strong>Breed:</strong> {item.breed}</p>
              <p><strong>Confidence:</strong> {item.confidence}%</p>
              <p style={{ fontSize: "0.8rem", color: "#ccc" }}>
                <strong>Timestamp:</strong> {item.timestamp}
              </p>
              <button style={viewBtnStyle} onClick={() => openModal(item.filename)}>
                View Image
              </button>
              <button style={clearBtnStyle} onClick={() => handleClear(item.filename)}>
                Clear
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Clear All Button */}
      {history.length > 0 && (
        <button style={clearAllBtnStyle} onClick={handleClearAll}>
          🧹 Clear All
        </button>
      )}

      {/* Modal image */}
      {modalImage && (
        <div style={modalOverlay} onClick={closeModal}>
          <div style={modalWrapper} onClick={(e) => e.stopPropagation()}>
            <img src={modalImage} alt="Full" style={modalImageStyle} />
            <div style={closeButtonWrapper}>
              <button onClick={closeModal} style={closeBtnStyle}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Styles
const gridContainer = {
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "center",
  gap: "1.5rem",
};

const cardStyle = {
  backgroundColor: "#1e1e1e",
  padding: "1rem",
  borderRadius: "10px",
  width: "300px",
  boxShadow: "0 0 10px rgba(255, 255, 255, 0.1)",
  color: "white",
};

const imageStyle = {
  width: "100%",
  height: "250px",
  objectFit: "cover",
  borderRadius: "8px",
  marginBottom: "0.8rem",
};

const viewBtnStyle = {
  marginTop: "0.5rem",
  padding: "0.4rem 0.8rem",
  backgroundColor: "#2196f3",
  color: "white",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
};

const clearBtnStyle = {
  marginTop: "0.5rem",
  padding: "0.4rem 0.8rem",
  backgroundColor: "#d32f2f",
  color: "white",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  marginLeft: "0.5rem",
};

const clearAllBtnStyle = {
  position: "fixed",
  bottom: "1.5rem",
  right: "1.5rem",
  padding: "0.8rem 1.5rem",
  backgroundColor: "#9c27b0",
  color: "white",
  border: "none",
  borderRadius: "8px",
  fontSize: "1rem",
  cursor: "pointer",
};

const modalOverlay = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  backgroundColor: "rgba(0, 0, 0, 0.8)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

const modalWrapper = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  maxWidth: "90%",
  maxHeight: "90%",
};

const modalImageStyle = {
  width: "700px",
  height: "500px",
  objectFit: "contain",
  borderRadius: "8px",
};

const closeButtonWrapper = {
  marginTop: "10px",
  alignSelf: "flex-end",
};

const closeBtnStyle = {
  padding: "6px 14px",
  backgroundColor: "#f44336",
  color: "white",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
};




