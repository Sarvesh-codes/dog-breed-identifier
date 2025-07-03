import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Signup.css";

export default function Signup() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSignup = async () => {
    const res = await fetch("https://dog-breed-identifier-p98j.onrender.com/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (res.ok) {
      alert("Signup successful! Please log in.");
      navigate("/login");
    } else {
      alert(data.message || data.error || "Signup failed");
    }
  };

  return (
    <div className="signup-container">
      <h1 className="signup-title">
        Welcome to <span className="signup-highlight">Dog Breed Classifier</span>
      </h1>
      <div className="signup-form-box">
        <h2 style={{ marginBottom: "1.5rem" }}>Sign Up</h2>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="signup-input"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="signup-input"
        />
        <button onClick={handleSignup} className="signup-button">
          Sign Up
        </button>
        <p style={{ marginTop: "1rem" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "lightblue" }}>
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}