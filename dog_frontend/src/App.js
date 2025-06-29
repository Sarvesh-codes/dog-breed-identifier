import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import ImageUpload from "./ImageUpload";
import Login from "./Login";
import Signup from "./Signup";
import HistoryPage from "./HistoryPage";

function App() {
  const isLoggedIn = !!localStorage.getItem("user");
  const [imageUploaded, setImageUploaded] = useState(false);

  const location = useLocation();

  //  Reset imageUploaded when route changes to /predict
  useEffect(() => {
    if (location.pathname === "/predict") {
      setImageUploaded(false);
    }
  }, [location.pathname]);

  const LogoutButton = () => {
    const navigate = useNavigate();
    const handleLogout = () => {
      localStorage.removeItem("user");
      navigate("/login");
    };
    return (
      <button
        onClick={handleLogout}
        style={{
          position: "absolute",
          top: "1rem",
          right: "1rem",
          backgroundColor: "#ff4d4d",
          color: "white",
          border: "none",
          padding: "0.5rem 1rem",
          borderRadius: "6px",
          cursor: "pointer"
        }}
      >
        Logout
      </button>
    );
  };

  return (
    <div style={{ backgroundColor: "#121212", minHeight: "100vh", color: "white", position: "relative" }}>
      <Routes>
        <Route path="/" element={<Navigate to={isLoggedIn ? "/predict" : "/login"} />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/predict"
          element={
            isLoggedIn ? (
              <>
                <LogoutButton />
                <div
                  style={{
                    textAlign: "center",
                    paddingTop: imageUploaded ? "2rem" : "18rem",
                    transition: "padding-top 0.3s ease"
                  }}
                >
                  <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem", color: "white" }}>
                    🐶 Dog Breed Identifier
                  </h1>
                  <ImageUpload onImageUploadStatus={setImageUploaded} />
                  <button
                    onClick={() => window.location.href = "/history"}
                    style={{
                      marginTop: "1rem",
                      backgroundColor: "#2196f3",
                      color: "white",
                      border: "none",
                      padding: "0.5rem 1rem",
                      borderRadius: "6px",
                      cursor: "pointer"
                    }}
                  >
                    View History
                  </button>
                </div>
              </>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/history"
          element={
            isLoggedIn ? (
              <>
                <LogoutButton />
                <HistoryPage />
              </>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </div>
  );
}

export default function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}

