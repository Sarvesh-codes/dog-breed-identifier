import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./HistoryPage.css";

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [modalImage, setModalImage] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      const username = localStorage.getItem("user");
      if (!username) return;

      const res = await fetch("https://dog-breed-identifier-p98j.onrender.com/api/history", {
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
    setModalImage(`https://dog-breed-identifier-p98j.onrender.com/uploads/${filename}`);
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

    await fetch("https://dog-breed-identifier-p98j.onrender.com/api/clear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, filename }),
    });

    setHistory((prev) => prev.filter((item) => item.filename !== filename));
  };

  const handleClearAll = async () => {
    const username = localStorage.getItem("user");
    if (!username) return;

    await fetch("https://dog-breed-identifier-p98j.onrender.com/api/clear-all", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });

    setHistory([]);
  };

  return (
    <div className="history-container">
      <button className="back-button" onClick={() => navigate("/predict")}>⬅ Back</button>
      <button className="logout-button" onClick={handleLogout}>Logout</button>

      <h2>View History</h2>

      {history.length === 0 ? (
        <p>No history found.</p>
      ) : (
        <div className="history-grid">
          {history.map((item, index) => (
            <div key={index} className="history-card">
              <img
                src={`https://dog-breed-identifier-p98j.onrender.com/uploads/${item.filename}`}
                alt="Uploaded"
                className="history-image"
              />
              <p><strong>Breed:</strong> {item.breed}</p>
              <p><strong>Confidence:</strong> {item.confidence}%</p>
              <p className="timestamp"><strong>Timestamp:</strong> {item.timestamp}</p>
              <button className="view-btn" onClick={() => openModal(item.filename)}>View Image</button>
              <button className="clear-btn" onClick={() => handleClear(item.filename)}>Clear</button>
            </div>
          ))}
        </div>
      )}

      {history.length > 0 && (
        <button className="clear-all-btn" onClick={handleClearAll}>🧹 Clear All</button>
      )}

      {modalImage && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-wrapper" onClick={(e) => e.stopPropagation()}>
            <img src={modalImage} alt="Full" className="modal-image" />
            <div className="close-btn-wrapper">
              <button className="close-btn" onClick={closeModal}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


