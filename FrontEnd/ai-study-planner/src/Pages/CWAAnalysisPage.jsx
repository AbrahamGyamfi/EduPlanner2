import React, { useMemo } from "react";
import { useCWAData } from '../hooks/useCWAData';
import { useBehaviorTracking } from '../hooks/useBehaviorTracking';
import EnhancedCWAWithQuizzes from "../components/cwa-analysis/enhanced-cwa-with-quizzes";

const theme = {
  name: "default",
  primary: "#2563eb",
  secondary: "#2563eb",
  accent: "#f59e42",
  background: "#f7fafd",
  surface: "#fff",
  text: "#22223b",
};

const CWAAnalysisPage = () => {
  // Get real data from the system
  const cwaData = useCWAData();
  const behaviorData = useBehaviorTracking(cwaData.courses);
  
  // Transform courses data to match the expected format
  const userCourses = useMemo(() => {
    return cwaData.courses.map(course => ({
      id: course.id,
      name: course.name,
      code: course.code || course.name.substring(0, 3).toUpperCase() + "101",
      credits: course.creditHours || 3,
      color: course.color || `#${Math.floor(Math.random()*16777215).toString(16)}`,
      assignments: course.assignments || []
    }));
  }, [cwaData.courses]);
  
  // Generate quiz results from assignments
  const quizResults = useMemo(() => {
    const results = [];
    userCourses.forEach(course => {
      course.assignments?.forEach(assignment => {
        if (assignment.score && assignment.maxScore) {
          results.push({
            id: assignment.id,
            courseId: course.id,
            courseName: course.name,
            courseCode: course.code,
            quizTitle: assignment.title || assignment.name,
            score: assignment.score,
            maxScore: assignment.maxScore,
            percentage: Math.round((assignment.score / assignment.maxScore) * 100),
            difficulty: assignment.difficulty || "Medium",
            topic: assignment.category || "General",
            dateTaken: assignment.dateSubmitted || new Date().toISOString().split('T')[0],
            timeSpent: assignment.timeSpent || 30,
            attemptsUsed: assignment.attempts || 1,
            maxAttempts: assignment.maxAttempts || 3
          });
        }
      });
    });
    return results;
  }, [userCourses]);
  
  // Generate schedule data from study sessions
  const scheduleData = useMemo(() => {
    return behaviorData.sessions.map(session => ({
      id: session.timestamp,
      courseId: session.courseId,
      courseName: session.courseName,
      courseCode: userCourses.find(c => c.id === session.courseId)?.code || "N/A",
      type: "Study",
      startTime: new Date(session.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      endTime: new Date(new Date(session.timestamp).getTime() + (session.durationMinutes * 60000)).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      day: new Date(session.timestamp).toLocaleDateString('en-US', { weekday: 'long' }),
      duration: session.durationMinutes,
      difficulty: Math.floor(Math.random() * 5) + 1,
      color: userCourses.find(c => c.id === session.courseId)?.color || "#3B82F6"
    }));
  }, [behaviorData.sessions, userCourses]);

  return (
    <EnhancedCWAWithQuizzes
      scheduleData={scheduleData}
      userCourses={userCourses}
      quizResults={quizResults}
      theme={theme}
    />
  );
};

export default CWAAnalysisPage;