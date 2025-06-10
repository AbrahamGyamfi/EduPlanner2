import React, { useState, useEffect } from "react";
import Sidebar from "../components/sidebar";
import { GraduationCap, ArrowRight, BookOpen, BarChart3, Clock, FileText, HelpCircle } from 'lucide-react';
import CourseForm from "../components/CourseForm";
import StudentProfileForm from "../components/StudentProfileForm";
import FormInput from "../components/FormInput";
import BehaviorTracker from "../components/BehaviorTracker";
import CWAAnalysis from "../utils/CWAAnalysis";
import AutoDataCollector from "../utils/AutoDataCollector";
import StudyMaterialGenerator from "../components/StudyMaterialGenerator";
import { marked } from 'marked';

const CWAAnalysisPage = () => {
  const [courses, setCourses] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [studentProfile, setStudentProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'courses', 'analysis'
  const [formErrors, setFormErrors] = useState({});
  const [behaviorData, setBehaviorData] = useState(null);
  const [behaviorMetrics, setBehaviorMetrics] = useState({
    studyConsistency: 0,
    assignmentCompletion: 0,
    studyPatterns: [],
    procrastinationLevel: 0
  });
  const [showBehaviorModal, setShowBehaviorModal] = useState(false);
  
  // Add new state for quiz and summary functionality
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [quizData, setQuizData] = useState({});
  const [summaryData, setSummaryData] = useState({});
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [generationTopic, setGenerationTopic] = useState('');

  useEffect(() => {
    // Check if we have saved data in localStorage
    const savedProfile = localStorage.getItem('cwa_student_profile');
    const savedCourses = localStorage.getItem('cwa_courses');
    const savedAnalysis = localStorage.getItem('cwa_analysis');
    const savedBehavior = localStorage.getItem('cwa_behavior_data');
    
    if (savedProfile) {
      setStudentProfile(JSON.parse(savedProfile));
    }
    
    if (savedCourses) {
      setCourses(JSON.parse(savedCourses));
    }
    
    if (savedAnalysis) {
      setAnalysis(JSON.parse(savedAnalysis));
    }

    if (savedBehavior) {
      const parsedBehavior = JSON.parse(savedBehavior);
      setBehaviorData(parsedBehavior);
      calculateBehaviorMetrics(parsedBehavior);
    } else {
      // Initialize default behavior tracking data
      initializeBehaviorTracking();
    }
    
    // Track page visit time for behavior analysis
    const visitTimestamp = new Date().toISOString();
    trackUserAction('page_visit', { timestamp: visitTimestamp });
  }, []);

  // Initialize behavior tracking data
  const initializeBehaviorTracking = () => {
    const defaultBehavior = {
      studySessions: [],
      assignmentSubmissions: [],
      pageVisits: [],
      actions: [],
      lastWeekStudyHours: 0,
      assignmentCompletionRatio: 0
    };
    
    setBehaviorData(defaultBehavior);
    localStorage.setItem('cwa_behavior_data', JSON.stringify(defaultBehavior));
  };

  // Track user actions for behavior analysis
  const trackUserAction = (actionType, actionData) => {
    if (!behaviorData) return;
    
    const timestamp = new Date().toISOString();
    const updatedBehavior = {...behaviorData};
    
    // Track different types of actions
    switch (actionType) {
      case 'page_visit':
        updatedBehavior.pageVisits = [
          ...(updatedBehavior.pageVisits || []),
          { timestamp, ...actionData }
        ];
        break;
      
      case 'assignment_added':
        updatedBehavior.assignmentSubmissions = [
          ...(updatedBehavior.assignmentSubmissions || []),
          { timestamp, status: 'added', ...actionData }
        ];
        break;
      
      case 'study_session':
        updatedBehavior.studySessions = [
          ...(updatedBehavior.studySessions || []),
          { timestamp, ...actionData }
        ];
        break;
        
      default:
        updatedBehavior.actions = [
          ...(updatedBehavior.actions || []),
          { type: actionType, timestamp, ...actionData }
        ];
    }
    
    setBehaviorData(updatedBehavior);
    localStorage.setItem('cwa_behavior_data', JSON.stringify(updatedBehavior));
    calculateBehaviorMetrics(updatedBehavior);
  };

  // Calculate behavior metrics based on tracked data
  const calculateBehaviorMetrics = (data) => {
    if (!data) return;
    
    // Study consistency (regularity of study sessions)
    const studySessions = data.studySessions || [];
    let studyConsistency = 0;
    
    if (studySessions.length > 1) {
      // Calculate average gap between sessions
      const sessionDates = studySessions.map(s => new Date(s.timestamp));
      sessionDates.sort((a, b) => a - b);
      
      let totalGap = 0;
      let regularityScore = 0;
      
      for (let i = 1; i < sessionDates.length; i++) {
        const gap = (sessionDates[i] - sessionDates[i-1]) / (1000 * 60 * 60 * 24); // gap in days
        totalGap += gap;
      }
      
      const avgGap = totalGap / (sessionDates.length - 1);
      regularityScore = avgGap <= 2 ? 100 : // Daily or every other day
                        avgGap <= 3 ? 80 :  // Every 2-3 days
                        avgGap <= 5 ? 60 :  // Twice a week
                        avgGap <= 7 ? 40 :  // Weekly
                        20;                  // Less than weekly
                        
      studyConsistency = regularityScore;
    } else if (studySessions.length === 1) {
      studyConsistency = 30; // Only one session recorded
    }
    
    // Assignment completion ratio
    const assignments = courses.flatMap(c => c.assignments || []);
    const totalAssignments = assignments.length;
    const assignmentSubmissions = data.assignmentSubmissions || [];
    
    const assignmentCompletion = totalAssignments > 0 
      ? Math.min(100, (assignmentSubmissions.length / totalAssignments) * 100)
      : 0;
    
    // Calculate procrastination level
    const now = new Date();
    const recentActions = [...(data.pageVisits || []), ...(data.actions || [])]
      .filter(a => new Date(a.timestamp) > new Date(now - 7 * 24 * 60 * 60 * 1000)); // Last 7 days
      
    // Look at time distribution - are actions clumped right before deadlines?
    const procrastinationScore = assignmentSubmissions.length > 0
      ? assignmentSubmissions
          .filter(a => a.daysBeforeDeadline)
          .reduce((sum, a) => sum + Math.min(5, a.daysBeforeDeadline), 0) / assignmentSubmissions.length
      : 5; // Default middle value
      
    const procrastinationLevel = Math.max(0, 10 - procrastinationScore);
    
    // Identify study patterns (morning/evening/weekend)
    const studyPatterns = [];
    const morningStudy = studySessions.filter(s => {
      const hour = new Date(s.timestamp).getHours();
      return hour >= 5 && hour < 12;
    }).length;
    
    const afternoonStudy = studySessions.filter(s => {
      const hour = new Date(s.timestamp).getHours();
      return hour >= 12 && hour < 18;
    }).length;
    
    const eveningStudy = studySessions.filter(s => {
      const hour = new Date(s.timestamp).getHours();
      return hour >= 18 || hour < 5;
    }).length;
    
    const weekendStudy = studySessions.filter(s => {
      const day = new Date(s.timestamp).getDay();
      return day === 0 || day === 6; // Sunday or Saturday
    }).length;
    
    if (morningStudy > afternoonStudy && morningStudy > eveningStudy) {
      studyPatterns.push('Morning person');
    } else if (eveningStudy > afternoonStudy && eveningStudy > morningStudy) {
      studyPatterns.push('Night owl');
    }
    
    if (weekendStudy > (studySessions.length - weekendStudy)) {
      studyPatterns.push('Weekend warrior');
    } else if (studySessions.length > 0) {
      studyPatterns.push('Weekday studier');
    }
    
    setBehaviorMetrics({
      studyConsistency,
      assignmentCompletion,
      procrastinationLevel,
      studyPatterns
    });
  };

  const handleAddCourse = (course) => {
    const updatedCourses = [...courses, course];
    setCourses(updatedCourses);
    localStorage.setItem('cwa_courses', JSON.stringify(updatedCourses));
    
    // Track behavior
    trackUserAction('course_added', { courseName: course.name, creditHours: course.creditHours });
  };

  const handleProfileSubmit = (profile) => {
    setStudentProfile(profile);
    localStorage.setItem('cwa_student_profile', JSON.stringify(profile));
    setActiveTab('courses');
    
    // Track behavior
    trackUserAction('profile_updated', { studyHours: profile.studyHoursPerWeek });
  };

  const addAssignment = (courseId, assignment) => {
    const course = courses.find(c => c.id === courseId);
    
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
    
    // Track behavior
    trackUserAction('assignment_added', {
      courseName: course?.name,
      assignmentName: assignment.name,
      weight: assignment.weight,
      score: assignment.score
    });
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

  const handleAnalyzePerformance = async () => {
    if (courses.length === 0) {
      setFormErrors({
        general: "Please add at least one course before analyzing"
      });
      return;
    }

    // Clear previous errors
    setFormErrors({});
    setIsAnalyzing(true);
    
    try {
      // Combine student profile and courses data
      const analysisData = {
        studentProfile,
        courses
      };

      // Try to use the API first
      try {
        const response = await fetch('http://localhost:5000/api/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(analysisData),
        });

        if (response.ok) {
          const data = await response.json();
          setAnalysis(data);
          localStorage.setItem('cwa_analysis', JSON.stringify(data));
          setActiveTab('analysis');
          return;
        }
      } catch (apiError) {
        console.warn("Could not connect to CWA API, using fallback analysis:", apiError);
      }

      // Fallback to local analysis if API is unavailable
      const fallbackAnalysis = generateFallbackAnalysis(courses, studentProfile);
      setAnalysis(fallbackAnalysis);
      localStorage.setItem('cwa_analysis', JSON.stringify(fallbackAnalysis));
      setActiveTab('analysis');
    } catch (error) {
      console.error('Error analyzing performance:', error);
      setFormErrors({
        general: "An error occurred while analyzing your data. Please try again."
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Generate a fallback analysis when API is unavailable
  const generateFallbackAnalysis = (courses, profile) => {
    const currentGPA = calculateEstimatedGPA(courses);
    
    // Use behavior metrics to adjust projected GPA
    let projectedGpaAdjustment = 0;
    
    // Study consistency affects projected GPA
    projectedGpaAdjustment += (behaviorMetrics.studyConsistency / 100) * 0.3;
    
    // Assignment completion affects projected GPA
    projectedGpaAdjustment += (behaviorMetrics.assignmentCompletion / 100) * 0.2;
    
    // Procrastination level negatively affects projected GPA
    projectedGpaAdjustment -= (behaviorMetrics.procrastinationLevel / 10) * 0.2;
    
    // Motivation level affects projected GPA
    projectedGpaAdjustment += (profile?.motivationLevel / 10) * 0.2;
    
    const projectedGPA = Math.min(4.0, Math.max(0, currentGPA + projectedGpaAdjustment));
    
    // Generate behavior-based recommendations
    const recommendations = [];
    const behavioralInsights = [];
    
    // Study consistency recommendations
    if (behaviorMetrics.studyConsistency < 40) {
      recommendations.push("Establish a regular study schedule to improve consistency");
      behavioralInsights.push("Your study patterns show irregular sessions which can impact retention");
    }
    
    // Procrastination recommendations
    if (behaviorMetrics.procrastinationLevel > 7) {
      recommendations.push("Work on assignments earlier to reduce last-minute stress and improve quality");
      behavioralInsights.push("You tend to complete work close to deadlines which may affect performance");
    }
    
    // Study pattern recommendations
    if (behaviorMetrics.studyPatterns.includes('Night owl')) {
      recommendations.push("Consider balancing some study sessions during daylight hours for better retention");
    }
    
    // Add study consistency insight
    behavioralInsights.push(`Your study consistency score is ${behaviorMetrics.studyConsistency.toFixed(0)}/100, which ${behaviorMetrics.studyConsistency > 70 ? 'is excellent' : behaviorMetrics.studyConsistency > 40 ? 'could be improved' : 'needs significant improvement'}`);
    
    // Course-specific recommendations
    const weakCourses = courses
      .filter(c => calculateCourseScore(c) < 70)
      .map(c => c.name);
      
    const strongCourses = courses
      .filter(c => calculateCourseScore(c) >= 80)
      .map(c => c.name);
    
    // Generate recommendations based on profile and course performance
    if (profile?.studyHoursPerWeek < 15) {
      recommendations.push("Increase weekly study hours to improve overall performance");
    }
    
    if (profile?.stressLevel > 7) {
      recommendations.push("Consider stress management techniques to improve focus and retention");
    }
    
    if (profile?.timeManagementScore < 60) {
      recommendations.push("Improve time management skills by creating a structured study schedule");
    }
    
    if (weakCourses.length > 0) {
      recommendations.push(`Focus additional effort on challenging courses: ${weakCourses.join(', ')}`);
    }
    
    // Add general recommendations if the list is too short
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
      behavioralInsights
    };
  };

  // Helper function to calculate estimated GPA based on current assignments
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
  
  // Calculate weighted average score for a course
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

  // Record a study session
  const recordStudySession = (courseId, duration) => {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;
    
    trackUserAction('study_session', {
      courseId,
      courseName: course.name,
      durationMinutes: duration
    });
    
    setShowBehaviorModal(false);
  };

  // Assignment form submit handler
  const handleAssignmentSubmit = (e, courseId) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const assignment = {
      name: formData.get('name'),
      weight: parseFloat(formData.get('weight')),
      score: parseFloat(formData.get('score')),
      maxScore: parseFloat(formData.get('maxScore'))
    };
    
    // Validate the assignment inputs
    const errors = {};
    if (assignment.weight < 0 || assignment.weight > 100) {
      errors.weight = "Weight must be between 0 and 100";
    }
    if (assignment.score < 0) {
      errors.score = "Score cannot be negative";
    }
    if (assignment.maxScore <= 0) {
      errors.maxScore = "Max score must be greater than 0";
    }
    if (assignment.score > assignment.maxScore) {
      errors.score = "Score cannot exceed max score";
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    // Calculate days before deadline if this was recently assigned
    const dueDate = formData.get('dueDate');
    if (dueDate) {
      const now = new Date();
      const due = new Date(dueDate);
      const daysBeforeDeadline = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
      assignment.daysBeforeDeadline = daysBeforeDeadline;
    }
    
    addAssignment(courseId, assignment);
    e.target.reset();
    setFormErrors({});
  };

  // Function to generate a quiz for a given course and topic
  const generateQuiz = async (courseId, topic) => {
    if (!courseId || !topic.trim()) {
      setFormErrors({
        general: "Please select a course and enter a topic to generate a quiz"
      });
      return;
    }

    setIsGeneratingQuiz(true);
    setFormErrors({});
    
    try {
      const course = courses.find(c => c.id === courseId);
      
      // Try to use the API if available
      try {
        const response = await fetch('http://localhost:5000/api/generate-quiz', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            courseName: course.name,
            topic: topic
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setQuizData({
            ...quizData,
            [courseId]: {
              topic,
              questions: data.questions,
              timestamp: new Date().toISOString()
            }
          });
          setShowQuizModal(true);
          trackUserAction('quiz_generated', { courseName: course.name, topic });
          return;
        }
      } catch (apiError) {
        console.warn("Could not connect to Quiz generation API, using fallback:", apiError);
      }

      // Fallback to mock quiz if API is unavailable
      const mockQuiz = generateMockQuiz(course.name, topic);
      
      setQuizData({
        ...quizData,
        [courseId]: {
          topic,
          questions: mockQuiz.questions,
          timestamp: new Date().toISOString()
        }
      });
      
      setShowQuizModal(true);
      trackUserAction('quiz_generated', { courseName: course.name, topic });
      
    } catch (error) {
      console.error('Error generating quiz:', error);
      setFormErrors({
        general: "An error occurred while generating the quiz. Please try again."
      });
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  // Function to generate a summary for a given course and topic
  const generateSummary = async (courseId, topic) => {
    if (!courseId || !topic.trim()) {
      setFormErrors({
        general: "Please select a course and enter a topic to generate a summary"
      });
      return;
    }

    setIsGeneratingSummary(true);
    setFormErrors({});
    
    try {
      const course = courses.find(c => c.id === courseId);
      
      // Try to use the API if available
      try {
        const response = await fetch('http://localhost:5000/api/generate-summary', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            courseName: course.name,
            topic: topic
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setSummaryData({
            ...summaryData,
            [courseId]: {
              topic,
              content: data.summary,
              timestamp: new Date().toISOString()
            }
          });
          setShowSummaryModal(true);
          trackUserAction('summary_generated', { courseName: course.name, topic });
          return;
        }
      } catch (apiError) {
        console.warn("Could not connect to Summary generation API, using fallback:", apiError);
      }

      // Fallback to mock summary if API is unavailable
      const mockSummary = generateMockSummary(course.name, topic);
      
      setSummaryData({
        ...summaryData,
        [courseId]: {
          topic,
          content: mockSummary.content,
          timestamp: new Date().toISOString()
        }
      });
      
      setShowSummaryModal(true);
      trackUserAction('summary_generated', { courseName: course.name, topic });
      
    } catch (error) {
      console.error('Error generating summary:', error);
      setFormErrors({
        general: "An error occurred while generating the summary. Please try again."
      });
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // Helper function to generate mock quiz data
  const generateMockQuiz = (courseName, topic) => {
    return {
      questions: [
        {
          id: 1,
          question: `What is the main concept of ${topic} in ${courseName}?`,
          options: [
            "The primary framework for understanding the subject",
            "A secondary concept that supports the main theory",
            "An outdated model no longer in use",
            "A competing theory from a different discipline"
          ],
          correctAnswer: 0
        },
        {
          id: 2,
          question: `Which of the following best describes the relationship between ${topic} and other key concepts in ${courseName}?`,
          options: [
            "They are completely unrelated",
            "They are complementary and build upon each other",
            "They contradict each other",
            "They are the same concept with different names"
          ],
          correctAnswer: 1
        },
        {
          id: 3,
          question: `When was the concept of ${topic} first introduced in the field of ${courseName}?`,
          options: [
            "In ancient times",
            "During the Renaissance period",
            "In the early 20th century",
            "In recent decades"
          ],
          correctAnswer: 2
        },
        {
          id: 4,
          question: `Which of these is NOT a characteristic of ${topic} in ${courseName}?`,
          options: [
            "Theoretical foundation",
            "Practical application",
            "Empirical evidence",
            "Religious significance"
          ],
          correctAnswer: 3
        },
        {
          id: 5,
          question: `How is ${topic} typically evaluated or measured in ${courseName}?`,
          options: [
            "Through qualitative analysis",
            "Through quantitative methods",
            "Through a combination of qualitative and quantitative approaches",
            "It cannot be measured"
          ],
          correctAnswer: 2
        }
      ]
    };
  };

  // Helper function to generate mock summary data
  const generateMockSummary = (courseName, topic) => {
    return {
      content: `
## Summary of ${topic} in ${courseName}

${topic} is a fundamental concept in the field of ${courseName} that encompasses several key principles and applications. This topic is particularly important for understanding the broader theoretical framework of the subject.

### Key Points:

1. **Definition and Origins**: 
   ${topic} refers to the systematic approach to analyzing and understanding specific phenomena within ${courseName}. It originated from early research in the field and has evolved significantly over time.

2. **Core Principles**:
   - Structured methodology for approaching problems
   - Evidence-based analysis and interpretation
   - Application of theoretical frameworks to practical scenarios
   - Integration with other key concepts in ${courseName}

3. **Practical Applications**:
   The principles of ${topic} are widely applied in various contexts, including research, industry practices, and educational settings. These applications demonstrate the versatility and importance of the concept.

4. **Current Developments**:
   Recent research has expanded our understanding of ${topic}, particularly in how it relates to emerging trends in ${courseName}. Scholars continue to refine and develop the concept to address contemporary challenges.

5. **Critical Perspectives**:
   While ${topic} provides a valuable framework, some scholars have critiqued certain aspects of its application, suggesting refinements or alternative approaches.

### Conclusion:
Understanding ${topic} is essential for mastering the key concepts in ${courseName}. It provides both theoretical foundations and practical tools that can be applied across various contexts within the field.
      `
    };
  };

  const renderAnalysisResults = () => {
    if (!analysis) return null;

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Analysis Results</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Current CWA</h3>
              <p className="text-3xl font-bold text-blue-600">{analysis.currentGPA?.toFixed(2) || '0.00'}</p>
              <p className="text-sm text-blue-700 mt-1">Based on completed courses</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-green-900 mb-2">Projected CWA</h3>
              <p className="text-3xl font-bold text-green-600">{analysis.projectedGPA?.toFixed(2) || '0.00'}</p>
              <p className="text-sm text-green-700 mt-1">Expected final CWA</p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-purple-900 mb-2">Performance Trend</h3>
              <p className="text-3xl font-bold text-purple-600">
                {analysis.performanceTrend === 'up' ? '↑' : analysis.performanceTrend === 'down' ? '↓' : '→'}
              </p>
              <p className="text-sm text-purple-700 mt-1">Overall trajectory</p>
            </div>
          </div>
        </div>

        {analysis.behavioralInsights && analysis.behavioralInsights.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Behavioral Insights</h3>
            <ul className="space-y-3">
              {analysis.behavioralInsights.map((insight, index) => (
                <li key={index} className="flex items-start">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 mr-3 mt-0.5 text-xs font-bold">
                    {index + 1}
                  </span>
                  <span className="text-gray-700">{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Recommendations</h3>
          <ul className="space-y-3">
            {analysis.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600 mr-3 mt-0.5 text-xs font-bold">
                  {index + 1}
                </span>
                <span className="text-gray-700">{recommendation}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Strong Areas</h3>
            <ul className="space-y-2">
              {analysis.strongAreas.map((area, index) => (
                <li key={index} className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  {area}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Areas for Improvement</h3>
            <ul className="space-y-2">
              {analysis.weakAreas.map((area, index) => (
                <li key={index} className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 text-yellow-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  {area}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  };

  // Add the missing function
  const handlePdfContentExtracted = (content) => {
    try {
      // Parse the PDF content and extract course information
      const courseData = parsePdfContent(content);
      
      // Add extracted courses to the state
      courseData.forEach(course => {
        handleAddCourse(course);
      });
    } catch (error) {
      console.error('Error processing PDF content:', error);
      setFormErrors({
        general: "Could not process the PDF content. Please make sure it's in the correct format."
      });
    }
  };

  // Helper function to parse PDF content
  const parsePdfContent = (content) => {
    // This is a simple example - adjust based on your PDF format
    const courses = [];
    const lines = content.split('\n');
    
    lines.forEach(line => {
      // Example format: "COURSE_CODE - COURSE_NAME - CREDIT_HOURS - GRADE"
      const parts = line.split('-').map(part => part.trim());
      if (parts.length === 4) {
        courses.push({
          id: crypto.randomUUID(),
          code: parts[0],
          name: parts[1],
          creditHours: parseInt(parts[2], 10),
          grade: parts[3]
        });
      }
    });
    
    return courses;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex justify-center items-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-lg text-gray-600">Loading CWA Analysis...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <header className="flex items-center justify-between gap-2 mb-8">
            <div className="flex items-center">
              <GraduationCap className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-blue-800 ml-2">CWA Analysis System</h1>
            </div>
            
            {/* Record Study Session Button */}
            <button 
              onClick={() => setShowBehaviorModal(true)}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <Clock className="w-4 h-4 mr-1" />
              Record Study Session
            </button>
            
            {/* Progress indicator */}
            <div className="hidden md:flex items-center space-x-2 text-sm">
              <span className={`flex items-center px-3 py-1 rounded-full ${activeTab === 'profile' ? 'bg-blue-100 text-blue-800' : 'text-gray-600'}`}>
                <span className={`w-6 h-6 flex items-center justify-center rounded-full mr-2 ${activeTab === 'profile' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}>1</span>
                Profile
              </span>
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <span className={`flex items-center px-3 py-1 rounded-full ${activeTab === 'courses' ? 'bg-blue-100 text-blue-800' : 'text-gray-600'}`}>
                <span className={`w-6 h-6 flex items-center justify-center rounded-full mr-2 ${activeTab === 'courses' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}>2</span>
                Courses
              </span>
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <span className={`flex items-center px-3 py-1 rounded-full ${activeTab === 'analysis' ? 'bg-blue-100 text-blue-800' : 'text-gray-600'}`}>
                <span className={`w-6 h-6 flex items-center justify-center rounded-full mr-2 ${activeTab === 'analysis' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}>3</span>
                Results
              </span>
            </div>
          </header>

          {/* Tab navigation for mobile */}
          <div className="flex border-b border-gray-200 mb-6 md:hidden">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 px-4 py-2 text-center font-medium text-sm ${
                activeTab === 'profile' 
                  ? 'border-b-2 border-blue-500 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => studentProfile && setActiveTab('courses')}
              disabled={!studentProfile}
              className={`flex-1 px-4 py-2 text-center font-medium text-sm ${
                activeTab === 'courses' 
                  ? 'border-b-2 border-blue-500 text-blue-600' 
                  : studentProfile ? 'text-gray-500 hover:text-gray-700' : 'text-gray-300 cursor-not-allowed'
              }`}
            >
              Courses
            </button>
            <button
              onClick={() => analysis && setActiveTab('analysis')}
              disabled={!analysis}
              className={`flex-1 px-4 py-2 text-center font-medium text-sm ${
                activeTab === 'analysis' 
                  ? 'border-b-2 border-blue-500 text-blue-600' 
                  : analysis ? 'text-gray-500 hover:text-gray-700' : 'text-gray-300 cursor-not-allowed'
              }`}
            >
              Results
            </button>
          </div>

          {/* General error message */}
          {formErrors.general && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{formErrors.general}</p>
                </div>
              </div>
            </div>
          )}

          {/* Tab content */}
          <div className="space-y-6">
            {/* Student Profile Tab */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center mb-4 text-blue-600">
                  <BookOpen className="w-5 h-5 mr-2" />
                  <h2 className="text-xl font-semibold">Student Profile</h2>
                </div>
                <StudentProfileForm onSubmit={handleProfileSubmit} />
              </div>
            )}

            {/* Courses Tab */}
            {activeTab === 'courses' && (
              <>
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                  <CourseForm onSubmit={handleAddCourse} />
                </div>

                {formErrors.general && (
                  <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 mb-6">
                    {formErrors.general}
                  </div>
                )}

                {courses.length > 0 ? (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-semibold flex items-center text-gray-800">
                        <BookOpen className="w-5 h-5 mr-2" />
                        Your Courses ({courses.length})
                      </h2>
                      
                      {/* Quiz and Summary Generation */}
                      <div className="flex space-x-2">
                        <select
                          onChange={(e) => setSelectedCourseId(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                          defaultValue=""
                        >
                          <option value="" disabled>Select a course</option>
                          {courses.map(course => (
                            <option key={course.id} value={course.id}>{course.name}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          placeholder="Enter topic"
                          value={generationTopic}
                          onChange={(e) => setGenerationTopic(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm w-48"
                        />
                        <button
                          onClick={() => generateQuiz(selectedCourseId, generationTopic)}
                          disabled={isGeneratingQuiz || !selectedCourseId}
                          className={`flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed`}
                        >
                          <HelpCircle className="w-4 h-4 mr-1" />
                          {isGeneratingQuiz ? 'Generating...' : 'Generate Quiz'}
                        </button>
                        <button
                          onClick={() => generateSummary(selectedCourseId, generationTopic)}
                          disabled={isGeneratingSummary || !selectedCourseId}
                          className={`flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed`}
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          {isGeneratingSummary ? 'Generating...' : 'Generate Summary'}
                        </button>
                      </div>
                    </div>
                    
                    {courses.map(course => (
                      <div key={course.id} className="bg-white p-6 rounded-lg shadow-md">
                        <div className="flex justify-between items-center border-b pb-3 mb-4">
                          <h3 className="text-lg font-semibold text-gray-800">{course.name}</h3>
                          <div className="flex items-center">
                            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                              {course.creditHours} Credit{course.creditHours !== 1 ? 's' : ''}
                            </span>
                            <button 
                              onClick={() => handleDeleteCourse(course.id)}
                              className="ml-2 text-red-600 hover:text-red-800"
                              title="Delete course"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        
                        {course.assignments && course.assignments.length > 0 && (
                          <div className="mt-2 mb-6">
                            <h4 className="font-medium text-sm text-gray-500 mb-2">Current Score: {calculateCourseScore(course).toFixed(1)}%</h4>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${Math.min(100, calculateCourseScore(course))}%` }}></div>
                            </div>
                          </div>
                        )}
                        
                        <div className="mt-4">
                          <h4 className="font-medium text-gray-700 mb-3">Assignments</h4>
                          <form 
                            onSubmit={(e) => handleAssignmentSubmit(e, course.id)}
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4"
                          >
                            <div>
                              <FormInput
                                label="Assignment Name"
                                id={`name-${course.id}`}
                                name="name"
                                placeholder="Midterm Exam"
                                required={true}
                              />
                            </div>
                            <div>
                              <FormInput
                                label="Weight (%)"
                                type="number"
                                id={`weight-${course.id}`}
                                name="weight"
                                placeholder="30"
                                required={true}
                                error={formErrors.weight}
                              />
                            </div>
                            <div>
                              <FormInput
                                label="Score"
                                type="number"
                                id={`score-${course.id}`}
                                name="score"
                                placeholder="85"
                                required={true}
                                error={formErrors.score}
                              />
                            </div>
                            <div>
                              <FormInput
                                label="Max Score"
                                type="number"
                                id={`maxScore-${course.id}`}
                                name="maxScore"
                                placeholder="100"
                                required={true}
                                error={formErrors.maxScore}
                              />
                            </div>
                            <button 
                              type="submit"
                              className="col-span-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                              Add Assignment
                            </button>
                          </form>

                          {course.assignments && course.assignments.length > 0 ? (
                            <div className="mt-4 border rounded-lg overflow-hidden">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {course.assignments.map(assignment => (
                                    <tr key={assignment.id}>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{assignment.name}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{assignment.weight}%</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {assignment.score}/{assignment.maxScore} ({((assignment.score / assignment.maxScore) * 100).toFixed(1)}%)
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                          onClick={() => handleDeleteAssignment(course.id, assignment.id)}
                                          className="text-red-600 hover:text-red-900"
                                        >
                                          Delete
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 italic mt-2">No assignments added yet.</p>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    <div className="flex justify-center mt-8">
                      <button 
                        onClick={handleAnalyzePerformance}
                        disabled={isAnalyzing}
                        className={`px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center ${isAnalyzing ? 'opacity-70 cursor-not-allowed' : ''}`}
                      >
                        {isAnalyzing ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <BarChart3 className="w-5 h-5 mr-2" />
                            Analyze Performance
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center bg-white p-8 rounded-lg shadow-sm border border-gray-100">
                    <BookOpen className="w-12 h-12 text-blue-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-800 mb-2">No courses added yet</h3>
                    <p className="text-gray-500 mb-4">Add your first course to begin tracking your academic performance.</p>
                  </div>
                )}
              </>
            )}

            {/* Analysis Results Tab */}
            {activeTab === 'analysis' && (
              <div className="space-y-6">
                {renderAnalysisResults()}
                
                {courses.map(course => (
                  <StudyMaterialGenerator 
                    key={course.id}
                    courseContent={`Course: ${course.name}
                      Description: ${course.description || 'No description available'}
                      Topics: ${course.topics || 'No topics available'}
                      Notes: ${course.notes || 'No notes available'}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Study Session Recording Modal */}
      {showBehaviorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Record Study Session</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Select Course</label>
                <select 
                  id="studyCourse" 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>{course.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Duration (minutes)</label>
                <input 
                  type="number" 
                  id="studyDuration" 
                  defaultValue={30}
                  min="5"
                  max="480"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowBehaviorModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const courseId = document.getElementById('studyCourse').value;
                    const duration = parseInt(document.getElementById('studyDuration').value);
                    if (courseId && duration > 0) {
                      recordStudySession(courseId, duration);
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  Save Session
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Quiz Modal */}
      {showQuizModal && selectedCourseId && quizData[selectedCourseId] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Quiz: {quizData[selectedCourseId].topic}
              </h3>
              <button 
                onClick={() => setShowQuizModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-8">
              {quizData[selectedCourseId].questions.map((question, qIndex) => (
                <div key={question.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-3">
                    {qIndex + 1}. {question.question}
                  </h4>
                  <div className="space-y-2">
                    {question.options.map((option, oIndex) => (
                      <div key={oIndex} className="flex items-start">
                        <input
                          type="radio"
                          id={`q${question.id}_o${oIndex}`}
                          name={`question_${question.id}`}
                          className="mt-1 mr-2"
                        />
                        <label htmlFor={`q${question.id}_o${oIndex}`} className="text-gray-700">
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <details className="text-sm">
                      <summary className="font-medium text-blue-600 cursor-pointer">Show Answer</summary>
                      <p className="mt-2 text-gray-700">
                        Correct answer: {question.options[question.correctAnswer]}
                      </p>
                    </details>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowQuizModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Close Quiz
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Summary Modal */}
      {showSummaryModal && selectedCourseId && summaryData[selectedCourseId] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Summary: {summaryData[selectedCourseId].topic}
              </h3>
              <button 
                onClick={() => setShowSummaryModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="prose max-w-none">
              <div dangerouslySetInnerHTML={{ 
                __html: marked.parse(summaryData[selectedCourseId].content) 
              }} />
            </div>
            <div className="mt-6 flex justify-between">
              <button
                onClick={() => {
                  const content = summaryData[selectedCourseId].content;
                  const blob = new Blob([content], {type: 'text/markdown'});
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${summaryData[selectedCourseId].topic.replace(/\s+/g, '-')}-summary.md`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Download as Markdown
              </button>
              <button
                onClick={() => setShowSummaryModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Close Summary
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CWAAnalysisPage;
