import React, { useEffect, useState } from "react";
import {BrowserRouter as Router,Routes,Route,Navigate,useNavigate,useLocation,} from "react-router-dom";
import ImageUpload from "./ImageUpload";
import Login from "./Login";
import Signup from "./Signup";
import HistoryPage from "./HistoryPage";
import "./App.css"; 

function LogoutButton({ navigate }) {
  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <button onClick={handleLogout} className="logout-button">
      Logout
    </button>
  );
}

function App() {
  const isLoggedIn = !!localStorage.getItem("user");
  const [imageUploaded, setImageUploaded] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname === "/predict") {
      setImageUploaded(false);
    }
  }, [location.pathname]);

  return (
    <div className="app-container">
      <Routes>
        <Route
          path="/"
          element={<Navigate to={isLoggedIn ? "/predict" : "/login"} />}
        />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/predict"
          element={
            isLoggedIn ? (
              <>
                <LogoutButton navigate={navigate} />
                <div
                  className={`predict-content ${
                    imageUploaded ? "image-uploaded" : "image-not-uploaded"
                  }`}
                >
                  <h1 className="title">🐶 Dog Breed Identifier</h1>
                  <ImageUpload onImageUploadStatus={setImageUploaded} />
                  <button
                    onClick={() => navigate("/history")}
                    className="history-button"
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
                <LogoutButton navigate={navigate} />
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

