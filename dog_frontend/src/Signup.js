import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Signup() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSignup = async () => {
    const res = await fetch("http://localhost:5000/signup", {
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
    <div style={containerStyle}>
      <h1 style={titleStyle}>
        Welcome to <span style={highlight}>Dog Breed Classifier</span>
      </h1>
      <div style={formBox}>
        <h2 style={{ marginBottom: "1.5rem" }}>Sign Up</h2>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />
        <button onClick={handleSignup} style={buttonStyle}>
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

// --- Styles ---
const containerStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "flex-start",
  minHeight: "100vh",
  backgroundColor: "black", // was #121212
  color: "white",
  paddingTop: "5rem",
};

const titleStyle = {
  fontSize: "2.8rem",
  fontWeight: "bold",
  marginBottom: "2.5rem",
  textAlign: "center",
};

const highlight = {
  background: "linear-gradient(to right, lightgreen, green)", 
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
};

const formBox = {
  backgroundColor: "#1f1f1f", 
  padding: "2rem",
  borderRadius: "10px",
  boxShadow: "0 0 15px rgba(0,0,0,0.4)",
  textAlign: "center",
  width: "300px",
};

const inputStyle = {
  margin: "0.5rem 0",
  padding: "0.5rem",
  width: "100%",
  borderRadius: "6px",
  border: "1px solid gray", 
  backgroundColor: "#2c2c2c", 
  color: "white",
};

const buttonStyle = {
  marginTop: "1rem",
  padding: "0.6rem 1.2rem",
  backgroundColor: "green", 
  border: "none",
  borderRadius: "6px",
  color: "white",
  cursor: "pointer",
  width: "100%",
};
