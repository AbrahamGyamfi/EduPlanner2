import React from "react";

const CourseHeader = ({ courseTitle }) => (
  <div className="course-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
    <div>
      <span style={{ fontWeight: "bold", fontSize: 20 }}>{courseTitle}</span>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <button style={{ background: "#f5f5f5", border: "none", borderRadius: 16, padding: "4px 12px", fontSize: 14, marginRight: 8 }}>Activity</button>
      <div style={{ background: "#1a2342", color: "#fff", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>KE</div>
    </div>
  </div>
);

export default CourseHeader;
