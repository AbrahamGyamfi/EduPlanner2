import React from "react";
import { useNavigate } from "react-router-dom";
import "./CardList.css";

// Define a fixed set of icons
const courseIcons = ["📘", "🖥️", "📊", "📡", "🔬", "🎨", "📝", "💡"];

// Function to get an icon based on the course index
const getCourseIcon = (index) => {
  return courseIcons[index % courseIcons.length]; // Cycle through icons
};

const CourseList = ({ courses, addCourse }) => {
  const navigate = useNavigate();

  const handleCourseClick = (course) => {
    navigate("/courses", { state: { course } });
  };

  return (
    <div className="dashboard">
      <h1>Registered Courses</h1>
      <div className="courses-grid">
        {/* "Add Course" card always comes first */}
        <div className="course-card add-course-card" onClick={addCourse}>
          <div className="add-course-content">
            <h1 className="Add-btn">+</h1>
          </div>
        </div>

        {/* Render Courses AFTER the Add Course Card */}
        {courses.length > 0 ? (
          courses.map((course, index) => (
            <div
              key={index}
              className="course-card"
              onClick={() => handleCourseClick(course)}
            >
              {/* Display Fixed Icon Instead of Image */}
              <div className="course-icon">{getCourseIcon(index)}</div>
              <div className="course-info">
                <h2 className="course-name">{course.name}</h2>
                <p className="course-slides">{course.slides} Slides</p>
                <p
                  className={`course-status ${
                    course.completed ? "completed" : "in-progress"
                  }`}
                >
                  {course.completed ? "✔ Completed" : "⏳ In Progress"}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="no-courses-card">
            <p className="no-courses">No courses registered</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseList;
