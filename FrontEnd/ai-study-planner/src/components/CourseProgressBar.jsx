import React from "react";

const CourseProgressBar = ({ progress }) => (
  <div style={{ margin: "24px 0", padding: 16, borderRadius: 16, border: "2px solid #e0e0e0", maxWidth: 700 }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
      <span style={{ fontWeight: "bold" }}>Course Progress</span>
      <span style={{ color: "#4a3aff", fontWeight: "bold" }}>{progress}%</span>
    </div>
    <div style={{ background: "#f0f0f0", borderRadius: 8, height: 10, width: "100%" }}>
      <div style={{
        width: `${progress}%`,
        background: "#4a3aff",
        height: "100%",
        borderRadius: 8,
        transition: "width 0.3s"
      }} />
    </div>
  </div>
);

export default CourseProgressBar;
