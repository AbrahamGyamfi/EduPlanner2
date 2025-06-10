import React from "react";

const WelcomeBanner = ({ courseTitle = "Your Course" }) => (
  <div style={{
    background: "linear-gradient(135deg,rgb(22, 25, 41) 60%,rgb(16, 8, 99) 100%)",
    color: "rgba(255, 255, 255, 0.9)",
    borderRadius: 24,
    padding: "40px 32px",
    margin: "32px 0",
    textAlign: "left",
    maxWidth: 900
  }}>
    <h2 style={{ fontWeight: "bold", fontSize: 32, margin: 0, color: "rgba(255, 255, 255, 0.95)" }}>Welcome to {courseTitle}</h2>
    <p style={{ fontSize: 18, marginTop: 12, color: "rgba(255, 255, 255, 0.8)" }}>Select a learning mode to begin your personalized education journey</p>
  </div>
);

export default WelcomeBanner;
