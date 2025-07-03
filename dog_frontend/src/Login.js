import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Login.css";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    const res = await fetch("https://dog-breed-identifier-p98j.onrender.com/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (data.success) {
      localStorage.setItem("user", username);
      navigate("/predict");
    } else {
      alert(data.message || data.error || "Login failed");
    }
  };

  return (
    <div className="login-container">
      <h1 className="login-title">
        Welcome to <span className="login-highlight">Dog Breed Classifier</span>
      </h1>
      <div className="login-form-box">
        <h2 style={{ marginBottom: "1.5rem" }}>Login</h2>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="login-input"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="login-input"
        />
        <button onClick={handleLogin} className="login-button">
          Login
        </button>
        <p style={{ marginTop: "1rem" }}>
          Don't have an account?{" "}
          <Link to="/signup" style={{ color: "lightblue" }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}