import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

export function useCWAData() {
  const [courses, setCourses] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [studentProfile, setStudentProfile] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    // Load saved data from localStorage
    const savedProfile = localStorage.getItem('cwa_student_profile');
    const savedCourses = localStorage.getItem('cwa_courses');
    const savedAnalysis = localStorage.getItem('cwa_analysis');
    
    if (savedProfile) {
      setStudentProfile(JSON.parse(savedProfile));
    }
    
    if (savedCourses) {
      setCourses(JSON.parse(savedCourses));
    }
    
    if (savedAnalysis) {
      setAnalysis(JSON.parse(savedAnalysis));
    }
  }, []);

  const handleAddCourse = (course) => {
    const updatedCourses = [...courses, course];
    setCourses(updatedCourses);
    localStorage.setItem('cwa_courses', JSON.stringify(updatedCourses));
  };

  const handleProfileSubmit = (profile) => {
    setStudentProfile(profile);
    localStorage.setItem('cwa_student_profile', JSON.stringify(profile));
  };

  const addAssignment = (courseId, assignment) => {
    const updatedCourses = courses.map(course => {
      if (course.id === courseId) {
        return {
          ...course,
          assignments: [...course.assignments, { ...assignment, id: crypto.randomUUID() }]
        };
      }
      return course;
    });
    
    setCourses(updatedCourses);
    localStorage.setItem('cwa_courses', JSON.stringify(updatedCourses));
  };

  const handleDeleteAssignment = (courseId, assignmentId) => {
    const updatedCourses = courses.map(course => {
      if (course.id === courseId) {
        return {
          ...course,
          assignments: course.assignments.filter(a => a.id !== assignmentId)
        };
      }
      return course;
    });
    
    setCourses(updatedCourses);
    localStorage.setItem('cwa_courses', JSON.stringify(updatedCourses));
  };

  const handleDeleteCourse = (courseId) => {
    const updatedCourses = courses.filter(c => c.id !== courseId);
    setCourses(updatedCourses);
    localStorage.setItem('cwa_courses', JSON.stringify(updatedCourses));
  };

  // Calculate course score (percentage)
  const calculateCourseScore = (course) => {
    if (!course.assignments || course.assignments.length === 0) return 0;
    
    let totalWeightedScore = 0;
    let totalWeight = 0;
    
    course.assignments.forEach(assignment => {
      const percentScore = (assignment.score / assignment.maxScore) * 100;
      totalWeightedScore += percentScore * assignment.weight;
      totalWeight += assignment.weight;
    });
    
    return totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
  };
  
  // Convert percentage score to GPA (4.0 scale)
  const scoreToGradePoint = (score) => {
    if (score >= 90) return 4.0;
    if (score >= 80) return 3.0;
    if (score >= 70) return 2.0;
    if (score >= 60) return 1.0;
    return 0.0;
  };

  // Calculate GPA from courses
  const calculateEstimatedGPA = (coursesList) => {
    if (!coursesList || coursesList.length === 0) return 0;
    
    let totalQualityPoints = 0;
    let totalCreditHours = 0;
    
    coursesList.forEach(course => {
      const score = calculateCourseScore(course);
      const gradePoint = scoreToGradePoint(score);
      totalQualityPoints += gradePoint * course.creditHours;
      totalCreditHours += course.creditHours;
    });
    
    return totalCreditHours > 0 ? totalQualityPoints / totalCreditHours : 0;
  };

  // Generate analysis based on courses and profile
  const generateAnalysis = (courses, profile, behaviorMetrics) => {
    const currentGPA = calculateEstimatedGPA(courses);
    
    // Calculate projected GPA based on profile and behavior
    let projectedGpaAdjustment = 0.2; // Base improvement
    
    // Add behavior-based adjustment if available
    if (behaviorMetrics) {
      projectedGpaAdjustment += (behaviorMetrics.studyConsistency / 100) * 0.2;
      projectedGpaAdjustment -= (behaviorMetrics.procrastinationLevel / 10) * 0.1;
    }
    
    // Add profile-based adjustment if available
    if (profile) {
      projectedGpaAdjustment += (profile.motivationLevel / 10) * 0.1;
      projectedGpaAdjustment -= ((profile.stressLevel - 5) / 10) * 0.1; // High stress reduces projected GPA
    }
    
    const projectedGPA = Math.min(4.0, Math.max(0, currentGPA + projectedGpaAdjustment));
    
    // Generate recommendations
    const recommendations = [];
    
    // Course-specific recommendations
    const weakCourses = courses
      .filter(c => calculateCourseScore(c) < 70)
      .map(c => c.name);
      
    const strongCourses = courses
      .filter(c => calculateCourseScore(c) >= 80)
      .map(c => c.name);
    
    // Add recommendations based on profile and courses
    if (profile?.studyHoursPerWeek < 15) {
      recommendations.push("Increase weekly study hours to improve overall performance");
    }
    
    if (profile?.stressLevel > 7) {
      recommendations.push("Consider stress management techniques to improve focus and retention");
    }
    
    if (weakCourses.length > 0) {
      recommendations.push(`Focus additional effort on challenging courses: ${weakCourses.join(', ')}`);
    }
    
    // Add general recommendations if needed
    if (recommendations.length < 3) {
      recommendations.push("Review material regularly rather than cramming before exams");
      recommendations.push("Consider joining study groups for collaborative learning");
    }
    
    return {
      currentGPA,
      projectedGPA,
      recommendations,
      strongAreas: strongCourses.length > 0 ? strongCourses : ["No strong areas identified yet"],
      weakAreas: weakCourses.length > 0 ? weakCourses : ["No significant weak areas identified"],
    };
  };

  const handleAnalyzePerformance = async (behaviorMetrics) => {
    if (courses.length === 0) {
      setFormErrors({
        general: "Please add at least one course before analyzing"
      });
      return;
    }

    setFormErrors({});
    setIsAnalyzing(true);
    
    try {
      // Try with API first
      try {
        const response = await fetch(`${API_BASE_URL}/api/analyze`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            studentProfile, 
            courses,
            behaviorMetrics
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setAnalysis(data);
          localStorage.setItem('cwa_analysis', JSON.stringify(data));
          return;
        }
      } catch (apiError) {
        console.warn("API unavailable, using local analysis");
      }

      // Fallback to local analysis
      const localAnalysis = generateAnalysis(courses, studentProfile, behaviorMetrics);
      setAnalysis(localAnalysis);
      localStorage.setItem('cwa_analysis', JSON.stringify(localAnalysis));
      
    } catch (error) {
      console.error('Analysis error:', error);
      setFormErrors({
        general: "An error occurred during analysis. Please try again."
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    courses,
    studentProfile,
    analysis,
    isAnalyzing,
    formErrors,
    handleAddCourse,
    handleProfileSubmit,
    addAssignment,
    handleDeleteCourse,
    handleDeleteAssignment,
    handleAnalyzePerformance,
    calculateCourseScore,
  };
}
