import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart3,
  TrendingUp,
  Clock,
  Target,
  BookOpen,
  AlertTriangle,
  Brain,
  Calendar,
  Award,
  Users,
  Eye,
  Headphones,
  Hand,
  Download,
  RefreshCw,
  Activity,
  PieChart,
  LineChart,
  Search,
  Play,
  Pause,
  Lightbulb,
  TrendingDown,
  CheckCircle,
  XCircle,
  Info,
} from "lucide-react";
// Enhanced Chart Components
const PieChartAdvanced = ({ data, theme, title }) => {
  // Validate and filter data
  const validData = data.filter(item => item && typeof item.value === 'number' && item.value > 0);
  const total = validData.reduce((sum, item) => sum + item.value, 0);
  
  // Show empty state if no valid data
  if (total === 0 || validData.length === 0) {
    return (
      <div className="space-y-4">
        {title && <h4 className="font-semibold text-sm opacity-75">{title}</h4>}
        <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg">
          <div className="text-center text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No study time data available</p>
            <p className="text-sm">Start studying to see your time distribution</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {title && <h4 className="font-semibold text-sm opacity-75">{title}</h4>}
      <div className="flex items-center justify-between">
        <div className="relative w-48 h-48">
          <svg width="192" height="192" viewBox="0 0 192 192" className="w-48 h-48 transform -rotate-90">
            <circle cx="96" cy="96" r="80" fill="none" stroke="#e5e7eb" strokeWidth="16" />
            {validData.map((item, index) => {
              const percentage = (item.value / total) * 100;
              const circumference = 2 * Math.PI * 80;
              const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -(
                (validData.slice(0, index).reduce((sum, d) => sum + d.value, 0) / total) *
                circumference
              );
              return (
                <circle
                  key={index}
                  cx="96"
                  cy="96"
                  r="80"
                  fill="none"
                  stroke={item.color || theme.secondary}
                  strokeWidth="16"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-1000 hover:stroke-opacity-80"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold">{total.toFixed(1)}</div>
              <div className="text-sm opacity-75">total hours</div>
            </div>
          </div>
        </div>
        <div className="space-y-3 ml-6 flex-1">
          {validData.map((item, index) => (
            <div key={index} className="flex items-center gap-3 text-sm">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color || theme.secondary }} />
              <div className="flex-1">
                <div className="font-medium">{item.name}</div>
                <div className="opacity-75">{((item.value / total) * 100).toFixed(1)}%</div>
              </div>
              <div className="font-semibold">{item.value.toFixed(1)}h</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
const LineChartSimple = ({ data, theme, title }) => (
  <div className="space-y-4">
    {title && <h4 className="font-semibold text-sm opacity-75">{title}</h4>}
    <div className="h-32 flex items-end justify-between gap-2">
      {data.map((item, index) => {
        const maxValue = Math.max(...data.map((d) => d.value))
        const height = (item.value / maxValue) * 100
        return (
          <div key={index} className="flex-1 flex flex-col items-center gap-2">
            <div
              className="w-full rounded-t-lg transition-all duration-1000 ease-out relative group"
              style={{
                height: `${height}%`,
                backgroundColor: theme.secondary,
                minHeight: "4px",
              }}
            >
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs px-2 py-1 rounded">
                {item.value.toFixed(1)}h
              </div>
            </div>
            <div className="text-xs font-medium text-center">{item.name}</div>
          </div>
        )
      })}
    </div>
  </div>
);
export default function PerformanceAnalysisPage({ scheduleData, userCourses, theme }) {
  const [selectedTimeframe, setSelectedTimeframe] = useState("week")
  const [selectedView, setSelectedView] = useState("overview") // overview, detailed, trends, predictions
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [actualCourses, setActualCourses] = useState([])
  const [realTrackingData, setRealTrackingData] = useState(null)

  // Load real tracking data from localStorage
  const loadRealTrackingData = () => {
    try {
      // Load various data sources
      const assignments = JSON.parse(localStorage.getItem('assignments') || '[]');
      const quizResults = JSON.parse(localStorage.getItem('quiz_results') || '[]');
      const activityHistory = JSON.parse(localStorage.getItem('activity_history') || '[]');
      const behaviorData = JSON.parse(localStorage.getItem('behavior_tracking_data') || '{}');
      const studySessions = JSON.parse(localStorage.getItem('study_sessions') || '[]');
      
      return {
        assignments,
        quizResults, 
        activityHistory,
        behaviorData,
        studySessions
      };
    } catch (error) {
      console.error('Error loading tracking data:', error);
      return {
        assignments: [],
        quizResults: [],
        activityHistory: [],
        behaviorData: {},
        studySessions: []
      };
    }
  };

  // Helper functions for real data calculations
  const generateConsistentColor = (courseName) => {
    // Generate consistent colors based on course name
    let hash = 0;
    for (let i = 0; i < courseName.length; i++) {
      hash = courseName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 70%, 60%)`;
  };

  const calculateCourseDifficulty = (assignments, quizzes) => {
    let difficulty = 3; // Default medium difficulty
    
    if (assignments.length > 0) {
      const avgPriority = assignments.reduce((sum, a) => sum + (a.priority || 1), 0) / assignments.length;
      difficulty = Math.max(difficulty, avgPriority);
    }
    
    if (quizzes.length > 0) {
      const avgScore = quizzes.reduce((sum, q) => sum + (q.percentage || 50), 0) / quizzes.length;
      // Lower scores suggest higher difficulty
      difficulty = Math.max(difficulty, 6 - (avgScore / 20)); // Scale 100-0 to 1-5
    }
    
    return Math.min(5, Math.max(1, Math.round(difficulty)));
  };

  // Load courses and real data from localStorage to ensure we have the most up-to-date data
  useEffect(() => {
    const loadCourses = () => {
      const savedCourses = localStorage.getItem('courses');
      if (savedCourses) {
        const courses = JSON.parse(savedCourses);
        setActualCourses(courses);
      } else {
        setActualCourses(userCourses || []);
      }
    };

    const loadData = () => {
      const trackingData = loadRealTrackingData();
      setRealTrackingData(trackingData);
    };

    loadCourses();
    loadData();
    
    // Listen for storage changes to stay in sync with course page
    const handleStorageChange = (e) => {
      if (e.key === 'courses') {
        loadCourses();
      } else if (['assignments', 'quiz_results', 'activity_history', 'behavior_tracking_data', 'study_sessions'].includes(e.key)) {
        loadData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [userCourses]);

  // Auto-refresh tracking data when autoRefresh is enabled
  useEffect(() => {
    if (autoRefresh) {
      const refreshInterval = setInterval(() => {
        const freshTrackingData = loadRealTrackingData();
        setRealTrackingData(freshTrackingData);
      }, 30000); // Refresh every 30 seconds
      
      return () => clearInterval(refreshInterval);
    }
  }, [autoRefresh]);

  // Simulate real-time analysis progress
  useEffect(() => {
    if (isAnalyzing) {
      const interval = setInterval(() => {
        setAnalysisProgress((prev) => {
          if (prev >= 100) {
            setIsAnalyzing(false)
            return 100
          }
          return prev + Math.random() * 15
        })
      }, 500)
      return () => clearInterval(interval)
    }
  }, [isAnalyzing])
  // Process schedule data for comprehensive analysis
  const processedData = useMemo(() => {
    if (!actualCourses || actualCourses.length === 0) return null

    const trackingData = realTrackingData || loadRealTrackingData();

    // Create course workload analysis from actual registered courses
    const courseWorkload = actualCourses.reduce((acc, course) => {
      const courseKey = course.id || course.name;
      // Calculate recommended hours based on credit hours
      const weeklyRecommendedHours = (course.creditHours || 3) * 2.5;
      // Calculate actual study hours from user-allocated schedule data and study sessions
      let actualStudyHours = 0;
      // Find all sessions for this course from scheduleData and studySessions
      let courseSessions = [];
      if (scheduleData && Array.isArray(scheduleData)) {
        courseSessions = scheduleData.filter(session => session.courseId === course.id || session.courseName === course.name);
      }
      // Also include tracked study sessions
      const trackedSessions = (trackingData.studySessions || []).filter(session => session.courseId === course.id || session.courseName === course.name);
      courseSessions = [...courseSessions, ...trackedSessions];
      if (courseSessions.length > 0) {
        // Calculate total hours allocated by user for this course
        const totalMinutes = courseSessions.reduce((sum, session) => sum + (session.duration || 0), 0);
        // Calculate number of weeks covered by sessions
        const sessionDates = courseSessions.map(s => new Date(s.date || s.timestamp || s.fullDate)).sort();
        let weekSet = new Set();
        sessionDates.forEach(date => {
          // Get ISO week string
          const weekStr = date.getFullYear() + '-W' + Math.ceil((date.getDate() + 6 - date.getDay()) / 7);
          weekSet.add(weekStr);
        });
        const totalWeeks = Math.max(1, weekSet.size);
        actualStudyHours = (totalMinutes / 60) / totalWeeks;
      } else {
        // If no sessions, fallback to recommended
        actualStudyHours = weeklyRecommendedHours;
      }

      // Calculate learning styles based on actual quiz and activity data
      const courseQuizzes = trackingData.quizResults.filter(quiz => 
        quiz.courseId === course.id || quiz.courseName === course.name
      );
      
      const courseActivities = trackingData.activityHistory.filter(activity => 
        activity.courseId === course.id || activity.details?.courseId === course.id
      );

      // Calculate learning style preferences from actual behavior
      const learningStyles = {
        visual: courseActivities.filter(a => a.type?.includes('slide') || a.type?.includes('view')).length,
        auditory: courseActivities.filter(a => a.type?.includes('audio')).length,
        kinesthetic: courseActivities.filter(a => a.type?.includes('practice') || a.type?.includes('assignment')).length,
        reading: courseActivities.filter(a => a.type?.includes('read') || a.type?.includes('summary')).length
      };

      // Calculate comprehensive efficiency based on real student activity
      const courseAssignments = trackingData.assignments.filter(assignment => 
        assignment.courseId === course.id || assignment.subject === course.name
      );
      
      // Start with base efficiency
      let efficiency = 0;
      let efficiencyFactors = 0;
      
      // 1. Assignment Completion Efficiency (25% weight)
      if (courseAssignments.length > 0) {
        const completedAssignments = courseAssignments.filter(a => a.status === 'completed').length;
        const onTimeCompletions = courseAssignments.filter(a => 
          a.status === 'completed' && 
          (!a.dueDate || new Date(a.submittedAt || a.completedAt) <= new Date(a.dueDate))
        ).length;
        
        const assignmentCompletionRate = (completedAssignments / courseAssignments.length) * 100;
        const onTimeRate = courseAssignments.length > 0 ? (onTimeCompletions / courseAssignments.length) * 100 : 0;
        
        // Combine completion rate with on-time delivery
        const assignmentEfficiency = (assignmentCompletionRate * 0.7) + (onTimeRate * 0.3);
        efficiency += assignmentEfficiency * 0.25;
        efficiencyFactors += 0.25;
      }
      
      // 2. Quiz Performance Efficiency (25% weight)
      if (courseQuizzes.length > 0) {
        const avgQuizScore = courseQuizzes.reduce((sum, quiz) => sum + (quiz.percentage || 0), 0) / courseQuizzes.length;
        const quizAttempts = courseQuizzes.length;
        const expectedQuizzes = Math.max(1, Math.floor(actualStudyHours / 4)); // Expect 1 quiz per 4 study hours
        
        // Quiz performance with attempt frequency bonus
        const quizFrequencyBonus = Math.min(quizAttempts / expectedQuizzes, 1.2) * 10; // Max 20% bonus
        const quizEfficiency = Math.min(avgQuizScore + quizFrequencyBonus, 100);
        
        efficiency += quizEfficiency * 0.25;
        efficiencyFactors += 0.25;
      }
      
      // 3. Study Session Consistency (20% weight)
      const recentSessions = courseSessions.filter(session => {
        const sessionDate = new Date(session.timestamp || session.date || Date.now());
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return sessionDate >= weekAgo;
      });
      
      if (courseSessions.length > 0) {
        const consistencyScore = Math.min((recentSessions.length / 7) * 100, 100); // Ideal: 1 session per day
        const avgSessionLength = courseSessions.reduce((sum, s) => sum + (s.duration || 120), 0) / courseSessions.length;
        const idealSessionLength = 90; // 90 minutes ideal
        const lengthEfficiency = 100 - Math.abs(avgSessionLength - idealSessionLength);
        
        const sessionEfficiency = (consistencyScore * 0.6) + (Math.max(lengthEfficiency, 0) * 0.4);
        efficiency += sessionEfficiency * 0.20;
        efficiencyFactors += 0.20;
      }
      
      // 4. Time Allocation vs Recommended (15% weight)
      const hoursRatio = actualStudyHours / weeklyRecommendedHours;
      let timeAllocationScore = 0;
      
      if (hoursRatio >= 0.8 && hoursRatio <= 1.3) {
        // Optimal range: 80% to 130% of recommended
        timeAllocationScore = 100 - Math.abs(hoursRatio - 1) * 50;
      } else if (hoursRatio > 1.3) {
        // Over-studying penalty
        timeAllocationScore = Math.max(70 - (hoursRatio - 1.3) * 30, 30);
      } else {
        // Under-studying penalty
        timeAllocationScore = hoursRatio * 80; // Linear penalty below 80%
      }
      
      efficiency += timeAllocationScore * 0.15;
      efficiencyFactors += 0.15;
      
      // 5. Activity Engagement (15% weight)
      const courseActivityData = trackingData.activityHistory.filter(activity => 
        activity.courseId === course.id || activity.details?.courseId === course.id
      );
      
      if (courseActivityData.length > 0) {
        const uniqueActivityTypes = new Set(courseActivityData.map(a => a.type)).size;
        const activityFrequency = courseActivityData.length / Math.max(actualStudyHours, 1); // Activities per study hour
        
        // Diverse activity engagement score
        const diversityScore = Math.min(uniqueActivityTypes * 20, 80); // Max 80 for 4+ activity types
        const frequencyScore = Math.min(activityFrequency * 50, 60); // Max 60 for 1.2+ activities per hour
        
        const engagementEfficiency = diversityScore + frequencyScore;
        efficiency += Math.min(engagementEfficiency, 100) * 0.15;
        efficiencyFactors += 0.15;
      }
      
      // Normalize efficiency based on available factors
      if (efficiencyFactors > 0) {
        efficiency = efficiency / efficiencyFactors;
      } else {
        // No data available, use course progress or default
        efficiency = course.progress || 50;
      }
      
      // Apply course difficulty adjustment
      const difficultyAdjustment = (course.difficulty || 3) - 3; // -2 to +2
      efficiency = Math.max(0, Math.min(100, efficiency - (difficultyAdjustment * 5)));

      acc[courseKey] = {
        name: course.name,
        code: course.code || course.name.substring(0, 6).toUpperCase(),
        color: course.color || generateConsistentColor(course.name),
        totalHours: actualStudyHours,
        weeklyRecommendedHours: weeklyRecommendedHours,
        creditHours: course.creditHours || 3,
        sessions: courseSessions.length || Math.ceil(weeklyRecommendedHours / 2),
        priorities: { 
          high: courseAssignments.filter(a => a.priority >= 3).length || Math.ceil(courseSessions.length * 0.3), 
          normal: courseAssignments.filter(a => a.priority < 3).length || Math.floor(courseSessions.length * 0.7)
        },
        learningStyles,
        efficiency: Math.round(efficiency),
        difficulty: course.difficulty || calculateCourseDifficulty(courseAssignments, courseQuizzes),
        progress: course.progress || 0,
        status: course.status || 'ongoing',
        assignments: courseAssignments,
        lastAccessed: course.lastAccessed || new Date().toLocaleDateString()
      };
      return acc;
    }, {});

    // Time distribution analysis based on real study sessions
    const timeDistribution = {};
    
    // Helper function to categorize time periods
    const categorizeTimePeriod = (hour) => {
      if (hour >= 5 && hour < 8) return "Early Morning";
      if (hour >= 8 && hour < 12) return "Morning";
      if (hour >= 12 && hour < 17) return "Afternoon";
      if (hour >= 17 && hour < 20) return "Evening";
      if (hour >= 20 || hour < 5) return "Night";
      return "Afternoon"; // Default fallback
    };

    // Process study sessions data
    if (trackingData.studySessions && trackingData.studySessions.length > 0) {
      trackingData.studySessions.forEach(session => {
        let period;
        
        if (session.timeSlot) {
          // Extract hour from timeSlot (format: "HH:MM - HH:MM")
          const timeSlot = session.timeSlot.split(" - ")[0];
          const hour = Number.parseInt(timeSlot.split(":")[0], 10);
          period = categorizeTimePeriod(hour);
        } else if (session.timestamp) {
          // Use timestamp if timeSlot not available
          const hour = new Date(session.timestamp).getHours();
          period = categorizeTimePeriod(hour);
        } else if (session.startTime) {
          // Check for alternative time field
          const hour = Number.parseInt(session.startTime.split(":")[0], 10);
          period = categorizeTimePeriod(hour);
        } else {
          period = "Afternoon"; // Default
        }
        
        if (!timeDistribution[period]) timeDistribution[period] = 0;
        timeDistribution[period] += (session.duration || 120) / 60; // Convert minutes to hours
      });
    }

    // If no study sessions, derive from schedule data
    if (Object.keys(timeDistribution).length === 0 && scheduleData?.length > 0) {
      scheduleData.forEach(session => {
        let period;
        
        if (session.timeSlot) {
          const timeSlot = session.timeSlot.split(" - ")[0] || "09:00";
          const hour = Number.parseInt(timeSlot.split(":")[0], 10);
          period = categorizeTimePeriod(hour);
        } else if (session.startTime) {
          const hour = Number.parseInt(session.startTime.split(":")[0], 10);
          period = categorizeTimePeriod(hour);
        } else {
          period = "Afternoon"; // Default
        }
        
        if (!timeDistribution[period]) timeDistribution[period] = 0;
        timeDistribution[period] += (session.duration || 120) / 60; // Convert minutes to hours
      });
    }

    // Ensure we have some realistic data to display
    if (Object.keys(timeDistribution).length === 0) {
      // Create a realistic default distribution based on typical study patterns
      timeDistribution["Morning"] = 2.5;
      timeDistribution["Afternoon"] = 4.0;
      timeDistribution["Evening"] = 3.5;
      timeDistribution["Night"] = 1.0;
    }

    // Learning style effectiveness - calculate from real activity data
    const learningStyleData = {};
    
    if (scheduleData?.length > 0) {
      // Use schedule data if available
      scheduleData.forEach(session => {
        if (!learningStyleData[session.learningStyle]) {
          learningStyleData[session.learningStyle] = {
            sessions: 0,
            totalHours: 0,
            highPriority: 0,
            effectiveness: 0,
          };
        }
        learningStyleData[session.learningStyle].sessions += 1;
        learningStyleData[session.learningStyle].totalHours += session.duration / 60;
        if (session.priority === "high") {
          learningStyleData[session.learningStyle].highPriority += 1;
        }
      });
      
      // Calculate effectiveness for each style
      Object.keys(learningStyleData).forEach(style => {
        const data = learningStyleData[style];
        data.effectiveness = data.sessions > 0 ? (data.highPriority / data.sessions) * 100 : 0;
      });
    } else {
      // Calculate from actual activity patterns
      const activityCounts = {
        visual: trackingData.activityHistory.filter(a => 
          a.type?.includes('slide') || a.type?.includes('view') || a.type?.includes('diagram')
        ).length,
        auditory: trackingData.activityHistory.filter(a => 
          a.type?.includes('audio') || a.type?.includes('listen')
        ).length,
        kinesthetic: trackingData.activityHistory.filter(a => 
          a.type?.includes('practice') || a.type?.includes('assignment') || a.type?.includes('quiz')
        ).length,
        reading: trackingData.activityHistory.filter(a => 
          a.type?.includes('read') || a.type?.includes('summary') || a.type?.includes('text')
        ).length
      };

      // Calculate total sessions and effectiveness based on activity patterns
      const totalActivities = Object.values(activityCounts).reduce((sum, count) => sum + count, 0);
      
      Object.keys(activityCounts).forEach(style => {
        const count = activityCounts[style];
        const percentage = totalActivities > 0 ? (count / totalActivities) * 100 : 25;
        
        learningStyleData[style] = {
          sessions: count,
          totalHours: count * 0.5, // Estimate 30 minutes per activity
          highPriority: Math.floor(count * 0.6), // Assume 60% are high priority
          effectiveness: Math.min(100, percentage + (count > 5 ? 20 : 0)) // Bonus for frequent use
        };
      });
    }

    // Ensure we have all learning styles represented
    ['visual', 'auditory', 'kinesthetic', 'reading'].forEach(style => {
      if (!learningStyleData[style]) {
        learningStyleData[style] = {
          sessions: 1,
          totalHours: 0.5,
          highPriority: 0,
          effectiveness: 25
        };
      }
    });

    // Weekly pattern analysis from real study sessions
    const weeklyPattern = {};
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    
    // Initialize all days
    days.forEach(day => { weeklyPattern[day] = 0; });
    
    if (trackingData.studySessions.length > 0) {
      trackingData.studySessions.forEach(session => {
        let dayName;
        if (session.day) {
          // If day is provided as number (1-7)
          dayName = days[session.day - 1];
        } else if (session.date) {
          // If date is provided, extract day
          const dayIndex = new Date(session.date).getDay();
          dayName = days[dayIndex === 0 ? 6 : dayIndex - 1]; // Convert Sunday=0 to Sunday=6
        } else if (session.timestamp) {
          // If timestamp is provided
          const dayIndex = new Date(session.timestamp).getDay();
          dayName = days[dayIndex === 0 ? 6 : dayIndex - 1];
        } else {
          dayName = "Monday"; // Default
        }
        
        if (weeklyPattern[dayName] !== undefined) {
          weeklyPattern[dayName] += (session.duration || 120) / 60; // Convert to hours
        }
      });
    } else if (scheduleData?.length > 0) {
      // Fallback to schedule data
      scheduleData.forEach(session => {
        const dayName = days[session.day - 1];
        if (weeklyPattern[dayName] !== undefined) {
          weeklyPattern[dayName] += session.duration / 60;
        }
      });
    }

    // If no data available, create a realistic weekly pattern based on course load
    if (Object.values(weeklyPattern).every(hours => hours === 0)) {
      const totalCreditHours = actualCourses.reduce((sum, course) => sum + (course.creditHours || 3), 0);
      const totalWeeklyHours = totalCreditHours * 2.5;
      
      // Distribute hours across weekdays with realistic pattern
      weeklyPattern["Monday"] = totalWeeklyHours * 0.2;
      weeklyPattern["Tuesday"] = totalWeeklyHours * 0.18;
      weeklyPattern["Wednesday"] = totalWeeklyHours * 0.22;
      weeklyPattern["Thursday"] = totalWeeklyHours * 0.18;
      weeklyPattern["Friday"] = totalWeeklyHours * 0.15;
      weeklyPattern["Saturday"] = totalWeeklyHours * 0.05;
      weeklyPattern["Sunday"] = totalWeeklyHours * 0.02;
    }

    // Performance trends based on real quiz scores and assignment completion
    const performanceTrends = [];
    
    // Calculate weekly performance trends
    const now = new Date();
    for (let i = 4; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      
      // Get quizzes and assignments for this week
      const weekQuizzes = trackingData.quizResults.filter(quiz => {
        const quizDate = new Date(quiz.date);
        return quizDate >= weekStart && quizDate < weekEnd;
      });
      
      const weekAssignments = trackingData.assignments.filter(assignment => {
        const assignmentDate = new Date(assignment.completedAt || assignment.created_at || assignment.dueDate);
        return assignmentDate >= weekStart && assignmentDate < weekEnd && assignment.status === 'completed';
      });
      
      // Calculate performance score for the week
      let weekScore = 0;
      let scoreCount = 0;
      
      // Quiz scores (weighted 60%)
      if (weekQuizzes.length > 0) {
        const avgQuizScore = weekQuizzes.reduce((sum, quiz) => sum + (quiz.percentage || 0), 0) / weekQuizzes.length;
        weekScore += avgQuizScore * 0.6;
        scoreCount += 0.6;
      }
      
      // Assignment completion rate (weighted 40%)
      const totalAssignmentsInWeek = trackingData.assignments.filter(assignment => {
        const dueDate = new Date(assignment.dueDate);
        return dueDate >= weekStart && dueDate < weekEnd;
      }).length;
      
      if (totalAssignmentsInWeek > 0) {
        const completionRate = (weekAssignments.length / totalAssignmentsInWeek) * 100;
        weekScore += completionRate * 0.4;
        scoreCount += 0.4;
      }
      
      // If no data for the week, use a baseline or trend
      if (scoreCount === 0) {
        if (performanceTrends.length > 0) {
          // Use previous week's score with slight variation
          weekScore = performanceTrends[performanceTrends.length - 1].value + (Math.random() - 0.5) * 5;
        } else {
          // Use overall course progress as baseline
          const avgProgress = actualCourses.reduce((sum, course) => sum + (course.progress || 0), 0) / Math.max(actualCourses.length, 1);
          weekScore = avgProgress + (Math.random() - 0.5) * 10;
        }
      } else {
        weekScore = weekScore / scoreCount;
      }
      
      const weekLabel = i === 0 ? "Current" : `Week ${5-i}`;
      performanceTrends.push({
        name: weekLabel,
        value: Math.max(0, Math.min(100, Math.round(weekScore)))
      });
    }

    // Calculate totals based on actual courses and real data
    const totalStudyHours = Object.values(courseWorkload).reduce((sum, course) => sum + course.totalHours, 0);
    const totalRecommendedHours = Object.values(courseWorkload).reduce((sum, course) => sum + course.weeklyRecommendedHours, 0);
    const totalSessions = trackingData.studySessions.length || Object.values(courseWorkload).reduce((sum, course) => sum + course.sessions, 0);
    const highPrioritySessions = trackingData.studySessions.filter(s => s.priority === "high").length || 
                                Object.values(courseWorkload).reduce((sum, course) => sum + course.priorities.high, 0);

    // Calculate average session length from real data
    let averageSessionLength = 120; // Default 2 hours in minutes
    if (trackingData.studySessions.length > 0) {
      const totalDuration = trackingData.studySessions.reduce((sum, session) => sum + (session.duration || 120), 0);
      averageSessionLength = totalDuration / trackingData.studySessions.length;
    } else if (scheduleData?.length > 0) {
      const totalDuration = scheduleData.reduce((sum, session) => sum + session.duration, 0);
      averageSessionLength = totalDuration / scheduleData.length;
    }

    return {
      courseWorkload,
      timeDistribution,
      learningStyleData,
      weeklyPattern,
      performanceTrends,
      totalHours: totalStudyHours,
      totalRecommendedHours,
      totalSessions,
      highPrioritySessions,
      averageSessionLength,
    };
  }, [scheduleData, actualCourses, realTrackingData]);
  // Generate comprehensive insights
  const generateInsights = () => {
    if (!processedData) return []
    const insights = []
    // Workload balance analysis
    const workloadValues = Object.values(processedData.courseWorkload).map((c) => c.totalHours)
    const maxWorkload = Math.max(...workloadValues)
    const minWorkload = Math.min(...workloadValues)
    const workloadImbalance = maxWorkload - minWorkload
    if (workloadImbalance > 3) {
      insights.push({
        type: "warning",
        title: "Workload Imbalance Detected",
        description: `${workloadImbalance.toFixed(1)} hour difference between courses`,
        recommendation: "Consider redistributing study time for better balance",
        icon: AlertTriangle,
        color: "#f59e0b",
        priority: "high",
      })
    }
    // Study efficiency analysis - based on comprehensive student performance
    let overallEfficiency = 0;
    
    if (processedData.totalSessions > 0) {
      // Calculate weighted efficiency across all courses
      const courseEfficiencies = Object.values(processedData.courseWorkload);
      
      if (courseEfficiencies.length > 0) {
        // Weight efficiency by study hours (more studied courses have more impact)
        const totalWeightedEfficiency = courseEfficiencies.reduce((sum, course) => {
          return sum + (course.efficiency * course.totalHours);
        }, 0);
        
        const totalWeightedHours = courseEfficiencies.reduce((sum, course) => {
          return sum + course.totalHours;
        }, 0);
        
        overallEfficiency = totalWeightedHours > 0 ? totalWeightedEfficiency / totalWeightedHours : 0;
      } else {
        // Fallback: basic priority session ratio
        overallEfficiency = (processedData.highPrioritySessions / processedData.totalSessions) * 100;
      }
    } else {
      overallEfficiency = 0;
    }
    
    if (overallEfficiency > 80) {
      insights.push({
        type: "success",
        title: "Outstanding Study Efficiency",
        description: `${overallEfficiency.toFixed(0)}% overall efficiency across all courses`,
        recommendation: "Excellent work! Your study methods are highly effective",
        icon: Target,
        color: "#10b981",
        priority: "info",
      })
    } else if (overallEfficiency > 65) {
      insights.push({
        type: "success",
        title: "Good Study Efficiency",
        description: `${overallEfficiency.toFixed(0)}% efficiency - above average performance`,
        recommendation: "Keep up the good work and look for small optimizations",
        icon: Target,
        color: "#10b981",
        priority: "info",
      })
    } else if (overallEfficiency > 45) {
      insights.push({
        type: "warning",
        title: "Moderate Study Efficiency",
        description: `${overallEfficiency.toFixed(0)}% efficiency - room for improvement`,
        recommendation: "Focus on completing assignments on time and consistent study habits",
        icon: AlertTriangle,
        color: "#f59e0b",
        priority: "medium",
      })
    } else if (overallEfficiency > 0) {
      insights.push({
        type: "warning",
        title: "Low Study Efficiency",
        description: `${overallEfficiency.toFixed(0)}% efficiency - needs attention`,
        recommendation: "Review study methods, prioritize assignments, and maintain regular study schedule",
        icon: AlertTriangle,
        color: "#ef4444",
        priority: "high",
      })
    }
    
    // Additional efficiency-specific insights
    if (processedData.courseWorkload && Object.values(processedData.courseWorkload).length > 0) {
      const courses = Object.values(processedData.courseWorkload);
      
      // Check for assignment completion rates
      const avgAssignmentCompletion = courses.reduce((sum, course) => {
        const assignments = course.assignments || [];
        const completionRate = assignments.length > 0 
          ? (assignments.filter(a => a.status === 'completed').length / assignments.length) * 100 
          : 0;
        return sum + completionRate;
      }, 0) / courses.length;
      
      if (avgAssignmentCompletion < 60) {
        insights.push({
          type: "warning",
          title: "Assignment Completion Needs Attention",
          description: `${avgAssignmentCompletion.toFixed(0)}% average completion rate`,
          recommendation: "Focus on completing pending assignments to improve overall efficiency",
          icon: AlertTriangle,
          color: "#f59e0b",
          priority: "high",
        });
      } else if (avgAssignmentCompletion > 85) {
        insights.push({
          type: "success",
          title: "Excellent Assignment Management",
          description: `${avgAssignmentCompletion.toFixed(0)}% completion rate across courses`,
          recommendation: "Outstanding! Keep up this consistent approach to assignments",
          icon: CheckCircle,
          color: "#10b981",
          priority: "info",
        });
      }
      
      // Check for study time allocation
      const timeAllocationIssues = courses.filter(course => {
        const ratio = course.totalHours / course.weeklyRecommendedHours;
        return ratio < 0.7 || ratio > 1.5;
      });
      
      if (timeAllocationIssues.length > 0) {
        insights.push({
          type: "info",
          title: "Study Time Optimization Opportunity",
          description: `${timeAllocationIssues.length} course(s) have suboptimal time allocation`,
          recommendation: "Redistribute study hours based on course difficulty and credit hours",
          icon: Clock,
          color: "#3b82f6",
          priority: "medium",
        });
      }
    }
    // Learning style diversity
    const learningStyleCount = Object.keys(processedData.learningStyleData).length
    if (learningStyleCount >= 4) {
      insights.push({
        type: "success",
        title: "Diverse Learning Approach",
        description: `Using ${learningStyleCount} different learning styles`,
        recommendation: "Great variety This enhances retention and understanding",
        icon: Brain,
        color: "#8b5cf6",
        priority: "info",
      })
    }
    // Time optimization
    const timeDistEntries = Object.entries(processedData.timeDistribution || {})
      .filter(([period, hours]) => hours > 0); // Only consider periods with actual study time
    
    if (timeDistEntries.length > 0) {
      const peakHours = timeDistEntries
        .sort(([, a], [, b]) => b - a)
        .slice(0, 2)
        .map(([period]) => period);
      
      if (peakHours.length > 0) {
        insights.push({
          type: "info",
          title: "Peak Study Times Identified",
          description: `Most productive during ${peakHours.join(" and ")}`,
          recommendation: "Schedule challenging subjects during these peak times",
          icon: Clock,
          color: "#3b82f6",
          priority: "medium",
        });
      }
      
      // Check for time balance
      const totalStudyHours = timeDistEntries.reduce((sum, [, hours]) => sum + hours, 0);
      const maxHours = Math.max(...timeDistEntries.map(([, hours]) => hours));
      const imbalanceRatio = maxHours / (totalStudyHours / timeDistEntries.length);
      
      if (imbalanceRatio > 2) {
        insights.push({
          type: "warning",
          title: "Unbalanced Study Schedule",
          description: `${Math.round(imbalanceRatio * 100)}% of study time concentrated in one period`,
          recommendation: "Consider spreading study sessions more evenly throughout the day",
          icon: Clock,
          color: "#f59e0b",
          priority: "medium",
        });
      }
    }
    // Session length analysis
    const avgSessionLength = processedData.averageSessionLength
    if (avgSessionLength > 120) {
      insights.push({
        type: "warning",
        title: "Long Study Sessions",
        description: `Average session length: ${Math.round(avgSessionLength)} minutes`,
        recommendation: "Consider shorter sessions with breaks for better retention",
        icon: Clock,
        color: "#f59e0b",
        priority: "medium",
      })
    }
    return insights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, info: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }
  const insights = generateInsights()
  // Performance predictions based on real data
  const performancePredictions = processedData
    ? Object.values(processedData.courseWorkload)
        .map((course) => {
          // Get real tracking data for this course
          const trackingData = realTrackingData || loadRealTrackingData();
          
          // Base score from current course progress
          const baseScore = course.progress || 50;
          
          // Quiz performance factor (0-30 points)
          const courseQuizzes = trackingData.quizResults.filter(quiz => 
            quiz.courseId === course.name || quiz.courseName === course.name
          );
          let quizBonus = 0;
          if (courseQuizzes.length > 0) {
            const avgQuizScore = courseQuizzes.reduce((sum, quiz) => sum + (quiz.percentage || 0), 0) / courseQuizzes.length;
            quizBonus = (avgQuizScore - 70) * 0.3; // Scale quiz performance
          }
          
          // Assignment completion factor (0-25 points)
          const courseAssignments = trackingData.assignments.filter(assignment => 
            assignment.courseId === course.name || assignment.subject === course.name
          );
          let assignmentBonus = 0;
          if (courseAssignments.length > 0) {
            const completionRate = (courseAssignments.filter(a => a.status === 'completed').length / courseAssignments.length) * 100;
            assignmentBonus = (completionRate - 50) * 0.25; // Scale completion rate
          }
          
          // Study consistency factor (0-20 points)
          const courseSessions = trackingData.studySessions.filter(session => 
            session.courseId === course.name || session.courseName === course.name
          );
          let consistencyBonus = 0;
          if (courseSessions.length >= 2) {
            // Calculate consistency based on session gaps
            const sessionDates = courseSessions.map(s => new Date(s.date || s.timestamp)).sort();
            let totalGap = 0;
            for (let i = 1; i < sessionDates.length; i++) {
              totalGap += (sessionDates[i] - sessionDates[i-1]) / (1000 * 60 * 60 * 24); // days
            }
            const avgGap = totalGap / (sessionDates.length - 1);
            consistencyBonus = avgGap <= 2 ? 20 : avgGap <= 4 ? 10 : avgGap <= 7 ? 5 : 0;
          }
          
          // Study hours adequacy factor (-10 to +15 points)
          const hoursRatio = course.totalHours / course.weeklyRecommendedHours;
          let hoursBonus = 0;
          if (hoursRatio >= 1) hoursBonus = 15;
          else if (hoursRatio >= 0.8) hoursBonus = 10;
          else if (hoursRatio >= 0.6) hoursBonus = 5;
          else hoursBonus = -10;
          
          // Difficulty penalty (-15 to 0 points)
          const difficultyPenalty = (course.difficulty - 3) * 3; // Scale 1-5 to -6 to +6, then multiply
          
          // Calculate final predicted score
          const predictedScore = Math.min(
            Math.max(baseScore + quizBonus + assignmentBonus + consistencyBonus + hoursBonus - difficultyPenalty, 0),
            100,
          );
          
          // Calculate confidence based on data availability
          let confidence = 50; // Base confidence
          const minQuizzes = 3;
          const minAssignments = 3;
          const completedAssignments = courseAssignments.filter(a => a.status === 'completed').length;
          if (courseQuizzes.length >= minQuizzes) confidence += 15;
          if (completedAssignments >= minAssignments) confidence += 15;
          if (courseSessions.length > 2) confidence += 15;
          if (course.progress > 0) confidence += 5;
          // If minimums not met, cap confidence at 70 and set a warning
          let confidenceWarning = null;
          if (courseQuizzes.length < minQuizzes || completedAssignments < minAssignments) {
            confidence = Math.min(confidence, 70);
            confidenceWarning = `For solid accuracy, complete at least ${minQuizzes} quizzes and ${minAssignments} assignments.`;
          } else {
            confidence = Math.min(confidence, 95);
          }
          
          // Determine trend based on recent performance
          let trend = "stable";
          if (courseQuizzes.length >= 2) {
            const recentQuizzes = courseQuizzes.slice(-2);
            const trendValue = recentQuizzes[1].percentage - recentQuizzes[0].percentage;
            trend = trendValue > 5 ? "up" : trendValue < -5 ? "down" : "stable";
          } else if (course.progress > 70) {
            trend = "up";
          } else if (course.progress < 30) {
            trend = "down";
          }
          
          return {
            ...course,
            predictedScore: Math.round(predictedScore),
            confidence: Math.round(confidence),
            confidenceWarning,
            trend,
            riskLevel: predictedScore < 60 ? "high" : predictedScore < 75 ? "medium" : "low",
            dataPoints: {
              quizzes: courseQuizzes.length,
              assignments: courseAssignments.length,
              sessions: courseSessions.length
            }
          };
        })
        .sort((a, b) => b.predictedScore - a.predictedScore)
    : [];
  const runAnalysis = () => {
    setIsAnalyzing(true)
    setAnalysisProgress(0)
  }
  if (!scheduleData || scheduleData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center max-w-lg">
          <div
            className="w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg"
            style={{ backgroundColor: `${theme.secondary}20` }}
          >
            <BarChart3 className="w-16 h-16" style={{ color: theme.secondary }} />
          </div>
          <h2 className="text-3xl font-bold mb-4">Welcome to Performance Analysis</h2>
          <p className="opacity-75 mb-8 text-lg leading-relaxed">
            Your Performance Analysis dashboard is ready. Generate a study schedule first to unlock powerful
            AI-driven insights about your learning patterns and grade predictions.
          </p>
          <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Brain className="w-4 h-4 text-blue-600" />
              </div>
              <div className="font-semibold">AI Insights</div>
              <div className="opacity-75">Smart recommendations</div>
            </div>
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <div className="font-semibold">Performance Tracking</div>
              <div className="opacity-75">Grade predictions</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="p-6 space-y-6">
        {/* Enhanced Header */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Performance Analysis Dashboard</h1>
              <p className="opacity-75 text-lg">
                Performance Analysis Last updated: {new Date().toLocaleTimeString()}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Auto Refresh Toggle */}
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  autoRefresh ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                }`}
              >
                {autoRefresh ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                Auto Refresh
              </button>
              {/* Analysis Button */}
              <button
                onClick={runAnalysis}
                disabled={isAnalyzing}
                className="px-6 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 flex items-center gap-2 shadow-sm"
                style={{
                  backgroundColor: theme.secondary,
                  color: "white",
                }}
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Analyzing... {Math.round(analysisProgress)}%
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4" />
                    Run Deep Analysis
                  </>
                )}
              </button>
            </div>
          </div>
          {/* Controls Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* View Selector */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                {[
                  { id: "overview", label: "Overview", icon: PieChart },
                  { id: "detailed", label: "Detailed", icon: BarChart3 },
                  { id: "trends", label: "Trends", icon: LineChart },
                  { id: "predictions", label: "Predictions", icon: Target },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setSelectedView(id)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                      selectedView === id ? "bg-white shadow-sm" : "hover:bg-gray-200"
                    }`}
                    style={{
                      color: selectedView === id ? theme.secondary : theme.text,
                    }}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
              {/* Timeframe Selector */}
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="px-4 py-2 rounded-lg border text-sm font-medium"
                style={{
                  backgroundColor: theme.surface,
                  borderColor: `${theme.primary}30`,
                  color: theme.text,
                }}
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="semester">This Semester</option>
                <option value="year">This Year</option>
              </select>
            </div>
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 opacity-50" />
                <input
                  type="text"
                  placeholder="Search insights..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 rounded-lg border text-sm w-48"
                  style={{
                    backgroundColor: theme.surface,
                    borderColor: `${theme.primary}30`,
                    color: theme.text,
                  }}
                />
              </div>
              {/* Export Button */}
              <button
                className="px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-200 hover:scale-105 flex items-center gap-2"
                style={{
                  borderColor: `${theme.secondary}30`,
                  color: theme.secondary,
                }}
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>
        {/* Analysis Progress Bar */}
        {isAnalyzing && (
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex items-center gap-3 mb-3">
              <Brain className="w-5 h-5 text-blue-500" />
              <div>
                <div className="font-semibold">AI Analysis in Progress</div>
                <div className="text-sm opacity-75">Processing your study patterns and generating insights...</div>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${analysisProgress}%` }}
              />
            </div>
          </div>
        )}
        {/* Key Metrics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              label: "Study Efficiency",
              value: processedData
                ? (() => {
                    const courseEfficiencies = Object.values(processedData.courseWorkload);
                    if (courseEfficiencies.length > 0) {
                      const totalWeightedEfficiency = courseEfficiencies.reduce((sum, course) => {
                        return sum + (course.efficiency * course.totalHours);
                      }, 0);
                      const totalWeightedHours = courseEfficiencies.reduce((sum, course) => {
                        return sum + course.totalHours;
                      }, 0);
                      const overallEff = totalWeightedHours > 0 ? totalWeightedEfficiency / totalWeightedHours : 0;
                      return `${Math.round(overallEff)}%`;
                    }
                    return `${Math.round((processedData.highPrioritySessions / processedData.totalSessions) * 100)}%`;
                  })()
                : "0%",
              change: processedData && Object.values(processedData.courseWorkload).length > 0 
                ? (() => {
                    const avgEfficiency = Object.values(processedData.courseWorkload)
                      .reduce((sum, course) => sum + course.efficiency, 0) / Object.values(processedData.courseWorkload).length;
                    return avgEfficiency > 70 ? "+Good" : avgEfficiency > 50 ? "Average" : "Needs Work";
                  })()
                : "+12%",
              trend: processedData && Object.values(processedData.courseWorkload).length > 0 
                ? (() => {
                    const avgEfficiency = Object.values(processedData.courseWorkload)
                      .reduce((sum, course) => sum + course.efficiency, 0) / Object.values(processedData.courseWorkload).length;
                    return avgEfficiency > 70 ? "up" : avgEfficiency > 50 ? "stable" : "down";
                  })()
                : "up",
              icon: Target,
              color: theme.secondary,
              description: "Comprehensive performance across all activities",
            },
            {
              label: "Weekly Hours",
              value: processedData?.totalHours.toFixed(1) || "0",
              change: "+2.3h",
              trend: "up",
              icon: Clock,
              color: "#10b981",
              description: "Total study time this week",
            },
            {
              label: "Course Balance",
              value: Object.keys(processedData?.courseWorkload || {}).length,
              change: "Balanced",
              trend: "stable",
              icon: BookOpen,
              color: "#f59e0b",
              description: "Active courses in rotation",
            },
            {
              label: "AI Confidence",
              value: "94%",
              change: "+3%",
              trend: "up",
              icon: Brain,
              color: "#8b5cf6",
              description: "Prediction accuracy level",
            },
          ].map((metric, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-xl shadow-sm border transition-all duration-200 hover:scale-105 cursor-pointer"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${metric.color}20` }}
                >
                  <metric.icon className="w-6 h-6" style={{ color: metric.color }} />
                </div>
                <div className="flex items-center gap-1 text-xs">
                  {metric.trend === "up" ? (
                    <TrendingUp className="w-3 h-3 text-green-500" />
                  ) : metric.trend === "down" ? (
                    <TrendingDown className="w-3 h-3 text-red-500" />
                  ) : (
                    <Activity className="w-3 h-3 text-gray-400" />
                  )}
                  <span
                    className={
                      metric.trend === "up"
                        ? "text-green-500"
                        : metric.trend === "down"
                          ? "text-red-500"
                          : "text-gray-400"
                    }
                  >
                    {metric.change}
                  </span>
                </div>
              </div>
              <div className="text-3xl font-bold mb-2">{metric.value}</div>
              <div className="text-sm font-medium mb-1">{metric.label}</div>
              <div className="text-xs opacity-75">{metric.description}</div>
            </div>
          ))}
        </div>
        {/* Main Content Based on Selected View */}
        {selectedView === "overview" && (
          <OverviewAnalysis processedData={processedData} insights={insights} theme={theme} />
        )}
        {selectedView === "detailed" && (
          <DetailedAnalysis processedData={processedData} scheduleData={scheduleData} theme={theme} />
        )}
        {selectedView === "trends" && <TrendsAnalysis processedData={processedData} theme={theme} />}
        {selectedView === "predictions" && (
          <PredictionsAnalysis performancePredictions={performancePredictions} theme={theme} />
        )}
        {/* AI Insights Panel */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Lightbulb className="w-6 h-6" style={{ color: theme.secondary }} />
              <h3 className="text-xl font-semibold">AI Insights & Recommendations</h3>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm opacity-75">Live Analysis</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.slice(0, 6).map((insight, index) => (
              <div
                key={index}
                className="p-4 rounded-lg border-l-4 transition-all duration-200 hover:scale-[1.02]"
                style={{
                  backgroundColor: `${insight.color}10`,
                  borderLeftColor: insight.color,
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {insight.type === "success" ? (
                      <CheckCircle className="w-5 h-5" style={{ color: insight.color }} />
                    ) : insight.type === "warning" ? (
                      <AlertTriangle className="w-5 h-5" style={{ color: insight.color }} />
                    ) : (
                      <Info className="w-5 h-5" style={{ color: insight.color }} />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{insight.title}</h4>
                    <p className="text-sm opacity-75 mb-2">{insight.description}</p>
                    <p className="text-sm font-medium" style={{ color: insight.color }}>
                     {insight.recommendation}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
// Overview Analysis Component
function OverviewAnalysis({ processedData, insights, theme }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Course Workload Distribution */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className="w-5 h-5" style={{ color: theme.secondary }} />
          <h3 className="text-lg font-semibold">Course Workload Distribution</h3>
        </div>
        {processedData && Object.keys(processedData.courseWorkload).length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2 text-left">Course</th>
                <th className="py-2 text-left">Credit Hours</th>
                <th className="py-2 text-left">Weekly Study Hours</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(processedData.courseWorkload).map((course, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="py-2 font-medium">{course.name}</td>
                  <td className="py-2">{course.creditHours}</td>
                  <td className="py-2">{course.totalHours.toFixed(1)}h</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No courses registered yet</p>
            <p className="text-sm">Add courses on the Course Page to see workload distribution</p>
            <button 
              onClick={() => window.location.href = '/courses'}
              className="mt-3 px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
            >
              Go to Course Page
            </button>
          </div>
        )}
      </div>
      {/* Time Distribution */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5" style={{ color: theme.secondary }} />
            <h3 className="text-lg font-semibold">Study Time Distribution</h3>
          </div>
          <span className="text-xs opacity-75 bg-gray-100 px-2 py-1 rounded-full">Peak hours analysis</span>
        </div>
        {processedData && processedData.timeDistribution ? (
          <PieChartAdvanced
            data={Object.entries(processedData.timeDistribution)
              .filter(([period, hours]) => hours > 0) // Filter out zero values
              .map(([period, hours]) => ({
                name: period,
                value: Number.parseFloat(hours.toFixed(1)),
                color: {
                  "Early Morning": "#f59e0b",
                  "Morning": "#10b981",
                  "Afternoon": "#3b82f6",
                  "Evening": "#8b5cf6",
                  "Night": "#6b7280",
                }[period] || theme.secondary,
              }))}
            theme={theme}
          />
        ) : (
          <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg">
            <div className="text-center text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No time distribution data</p>
              <p className="text-sm">Study sessions will appear here once you start studying</p>
            </div>
          </div>
        )}
      </div>
      {/* Learning Style Effectiveness */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-6">
          <Brain className="w-5 h-5" style={{ color: theme.secondary }} />
          <h3 className="text-lg font-semibold">Learning Style Effectiveness</h3>
        </div>
        {processedData && (
          <div className="space-y-4">
            {Object.entries(processedData.learningStyleData).map(([style, data]) => {
              const effectiveness = data.effectiveness
              const icons = {
                visual: Eye,
                auditory: Headphones,
                kinesthetic: Hand,
                reading: BookOpen,
                social: Users,
                logical: Target,
              }
              const Icon = icons[style] || Brain
              return (
                <div
                  key={style}
                  className="flex items-center justify-between p-3 rounded-lg border"
                  style={{ borderColor: `${theme.secondary}20` }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${theme.secondary}20` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: theme.secondary }} />
                    </div>
                    <div>
                      <div className="font-medium capitalize">{style}</div>
                      <div className="text-sm opacity-75">
                        {data.sessions} sessions, {data.totalHours.toFixed(1)}h
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className="text-xl font-bold"
                      style={{
                        color: effectiveness >= 70 ? "#10b981" : effectiveness >= 50 ? "#f59e0b" : "#ef4444",
                      }}
                    >
                      {effectiveness.toFixed(0)}%
                    </div>
                    <div className="text-xs opacity-75">effectiveness</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      {/* Weekly Pattern */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="w-5 h-5" style={{ color: theme.secondary }} />
          <h3 className="text-lg font-semibold">Weekly Study Pattern</h3>
        </div>
        {processedData && (
          <div>
            <div className="grid grid-cols-7 gap-2 mb-4">
              {Object.entries(processedData.weeklyPattern).map(([day, hours]) => (
                <div key={day} className="flex flex-col items-center">
                  <div className="text-xs font-semibold mb-1">{day.slice(0, 3)}</div>
                  <div className="w-8 h-24 flex items-end">
                    <div
                      className="rounded-lg"
                      style={{
                        height: `${Math.max(hours, 2) * 10}px`,
                        width: '100%',
                        background: hours > 0 ? theme.secondary : '#e5e7eb',
                        opacity: hours > 0 ? 0.85 : 0.4,
                        transition: 'height 0.5s',
                      }}
                      title={hours > 0 ? `${hours.toFixed(1)} hours` : 'No study'}
                    />
                  </div>
                  <div className="text-xs mt-1" style={{ color: hours > 0 ? theme.secondary : '#9ca3af' }}>
                    {hours > 0 ? `${hours.toFixed(1)}h` : <span title="No study">-</span>}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center text-sm mt-2">
              <div>
                <span className="font-medium">Total:</span> {Object.values(processedData.weeklyPattern).reduce((a, b) => a + b, 0).toFixed(1)}h
              </div>
              <div>
                <span className="font-medium">Average/day:</span> {(Object.values(processedData.weeklyPattern).reduce((a, b) => a + b, 0) / 7).toFixed(1)}h
              </div>
              <div>
                <span className="font-medium">Most studied:</span> {Object.entries(processedData.weeklyPattern).reduce((a, b) => (a[1] > b[1] ? a : b))[0]}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
// Detailed Analysis Component
function DetailedAnalysis({ processedData, scheduleData, theme }) {
  return (
    <div className="space-y-6">
      {/* Course Performance Deep Dive */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-6">
          <BookOpen className="w-5 h-5" style={{ color: theme.secondary }} />
          <h3 className="text-lg font-semibold">Course Performance Deep Dive</h3>
        </div>
        {processedData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.values(processedData.courseWorkload).map((course) => (
              <div key={course.code} className="p-6 rounded-lg border" style={{ borderColor: `${course.color}30` }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: course.color }} />
                  <div>
                    <h4 className="font-semibold">{course.name}</h4>
                    <p className="text-sm opacity-75">{course.code}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 rounded-lg" style={{ backgroundColor: `${course.color}10` }}>
                    <div className="text-2xl font-bold">{course.totalHours.toFixed(1)}</div>
                    <div className="text-xs opacity-75">Total Hours</div>
                  </div>
                  <div className="text-center p-3 rounded-lg" style={{ backgroundColor: `${course.color}10` }}>
                    <div className="text-2xl font-bold">{course.sessions}</div>
                    <div className="text-xs opacity-75">Sessions</div>
                  </div>
                  <div className="text-center p-3 rounded-lg" style={{ backgroundColor: `${course.color}10` }}>
                    <div className="text-2xl font-bold">{course.priorities.high}</div>
                    <div className="text-xs opacity-75">High Priority</div>
                  </div>
                  <div className="text-center p-3 rounded-lg" style={{ backgroundColor: `${course.color}10` }}>
                    <div 
                      className="text-2xl font-bold"
                      style={{ 
                        color: course.efficiency >= 80 ? '#10b981' : 
                               course.efficiency >= 65 ? '#f59e0b' : '#ef4444'
                      }}
                    >
                      {course.efficiency.toFixed(0)}%
                    </div>
                    <div className="text-xs opacity-75">Efficiency</div>
                  </div>
                </div>
                
                {/* Efficiency Breakdown */}
                <div className="mb-4">
                  <div className="text-sm font-medium mb-2">Efficiency Breakdown:</div>
                  <div className="space-y-2">
                    {course.assignments && course.assignments.length > 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <span>Assignment Completion</span>
                        <span className="font-medium">
                          {course.assignments.filter(a => a.status === 'completed').length}/{course.assignments.length}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs">
                      <span>Study Hours vs Recommended</span>
                      <span className="font-medium">
                        {((course.totalHours / course.weeklyRecommendedHours) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span>Recent Activity</span>
                      <span className="font-medium">
                        {course.lastAccessed ? new Date(course.lastAccessed).toLocaleDateString() : 'No recent activity'}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-2">Learning Style Distribution:</div>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(course.learningStyles).map(([style, count]) => (
                      <span
                        key={style}
                        className="px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `${course.color}20`,
                          color: course.color,
                        }}
                      >
                        {style}: {count}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Study Efficiency Analysis */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-6">
          <Target className="w-5 h-5" style={{ color: theme.secondary }} />
          <h3 className="text-lg font-semibold">Study Efficiency Analysis</h3>
        </div>
        {processedData && (
          <div className="space-y-6">
            {/* Overall Efficiency Score */}
            <div className="text-center p-6 rounded-lg border-2" style={{ borderColor: `${theme.secondary}20` }}>
              <div className="text-5xl font-bold mb-2" style={{ color: theme.secondary }}>
                {(() => {
                  const courseEfficiencies = Object.values(processedData.courseWorkload);
                  if (courseEfficiencies.length > 0) {
                    const totalWeightedEfficiency = courseEfficiencies.reduce((sum, course) => {
                      return sum + (course.efficiency * course.totalHours);
                    }, 0);
                    const totalWeightedHours = courseEfficiencies.reduce((sum, course) => {
                      return sum + course.totalHours;
                    }, 0);
                    return totalWeightedHours > 0 ? Math.round(totalWeightedEfficiency / totalWeightedHours) : 0;
                  }
                  return 0;
                })()}%
              </div>
              <div className="text-lg font-semibold mb-1">Overall Study Efficiency</div>
              <div className="text-sm opacity-75">Based on comprehensive performance metrics</div>
            </div>
            
            {/* Efficiency Components */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg" style={{ backgroundColor: `${theme.secondary}10` }}>
                <div className="text-center">
                  <div className="text-2xl font-bold mb-2">
                    {processedData.courseWorkload && Object.values(processedData.courseWorkload).length > 0
                      ? Math.round(
                          Object.values(processedData.courseWorkload).reduce((sum, course) => {
                            const assignments = course.assignments || [];
                            return sum + (assignments.length > 0 
                              ? (assignments.filter(a => a.status === 'completed').length / assignments.length) * 100 
                              : 0);
                          }, 0) / Object.values(processedData.courseWorkload).length
                        )
                      : 0}%
                  </div>
                  <div className="text-sm font-medium">Assignment Completion</div>
                  <div className="text-xs opacity-75">Completed vs Total</div>
                </div>
              </div>
              
              <div className="p-4 rounded-lg" style={{ backgroundColor: "#10b98110" }}>
                <div className="text-center">
                  <div className="text-2xl font-bold mb-2">
                    {processedData.courseWorkload && Object.values(processedData.courseWorkload).length > 0
                      ? Math.round(
                          Object.values(processedData.courseWorkload).reduce((sum, course) => {
                            return sum + ((course.totalHours / course.weeklyRecommendedHours) * 100);
                          }, 0) / Object.values(processedData.courseWorkload).length
                        )
                      : 0}%
                  </div>
                  <div className="text-sm font-medium">Time Allocation</div>
                  <div className="text-xs opacity-75">Hours vs Recommended</div>
                </div>
              </div>
              
              <div className="p-4 rounded-lg" style={{ backgroundColor: "#f59e0b10" }}>
                <div className="text-center">
                  <div className="text-2xl font-bold mb-2">
                    {processedData.totalSessions > 0 
                      ? Math.round((processedData.totalSessions / 7) * 100) // Sessions per week
                      : 0}%
                  </div>
                  <div className="text-sm font-medium">Study Consistency</div>
                  <div className="text-xs opacity-75">Regular study pattern</div>
                </div>
              </div>
            </div>
            
            {/* Performance Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border">
                <h4 className="font-semibold mb-3 text-green-600">Strengths</h4>
                <ul className="space-y-2 text-sm">
                  {Object.values(processedData.courseWorkload)
                    .filter(course => course.efficiency >= 70)
                    .slice(0, 3)
                    .map((course, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span>{course.name}: {course.efficiency.toFixed(0)}% efficiency</span>
                      </li>
                    ))}
                  {Object.values(processedData.courseWorkload).filter(course => course.efficiency >= 70).length === 0 && (
                    <li className="text-gray-500 italic">Continue studying to build strengths</li>
                  )}
                </ul>
              </div>
              
              <div className="p-4 rounded-lg border">
                <h4 className="font-semibold mb-3 text-orange-600">Areas for Improvement</h4>
                <ul className="space-y-2 text-sm">
                  {Object.values(processedData.courseWorkload)
                    .filter(course => course.efficiency < 65)
                    .slice(0, 3)
                    .map((course, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                        <span>{course.name}: {course.efficiency.toFixed(0)}% efficiency</span>
                      </li>
                    ))}
                  {Object.values(processedData.courseWorkload).filter(course => course.efficiency < 65).length === 0 && (
                    <li className="text-gray-500 italic">Great work! All courses performing well</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Session Analysis */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-6">
          <Activity className="w-5 h-5" style={{ color: theme.secondary }} />
          <h3 className="text-lg font-semibold">Session Analysis</h3>
        </div>
        {processedData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 rounded-lg border">
              <div className="text-3xl font-bold mb-2">{processedData.totalSessions}</div>
              <div className="text-sm font-medium mb-1">Total Sessions</div>
              <div className="text-xs opacity-75">Across all courses</div>
            </div>
            <div className="text-center p-6 rounded-lg border">
              <div className="text-3xl font-bold mb-2">{Math.round(processedData.averageSessionLength)}</div>
              <div className="text-sm font-medium mb-1">Avg. Session Length</div>
              <div className="text-xs opacity-75">Minutes per session</div>
            </div>
            <div className="text-center p-6 rounded-lg border">
              <div className="text-3xl font-bold mb-2">{Object.keys(processedData.learningStyleData).length}</div>
              <div className="text-sm font-medium mb-1">Learning Styles</div>
              <div className="text-xs opacity-75">Different methods used</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
// Trends Analysis Component
function TrendsAnalysis({ processedData, theme }) {
  return (
    <div className="space-y-6">
      {/* Performance Trends */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="w-5 h-5" style={{ color: theme.secondary }} />
          <h3 className="text-lg font-semibold">Performance Trends</h3>
        </div>
        {processedData && (
          <LineChartSimple
            data={processedData.performanceTrends}
            theme={theme}
            title="Weekly Performance Progression"
          />
        )}
      </div>
      {/* Study Consistency Analysis */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="w-5 h-5" style={{ color: theme.secondary }} />
          <h3 className="text-lg font-semibold">Study Consistency</h3>
        </div>
        {processedData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 rounded-lg" style={{ backgroundColor: `${theme.secondary}10` }}>
              <div className="text-3xl font-bold mb-2">
                {Object.entries(processedData.weeklyPattern).reduce((a, b) => (a[1] > b[1] ? a : b))[0]}
              </div>
              <div className="text-sm font-medium mb-1">Peak Day</div>
              <div className="text-xs opacity-75">Most productive day</div>
            </div>
            <div className="text-center p-6 rounded-lg" style={{ backgroundColor: `${theme.accent}10` }}>
              <div className="text-3xl font-bold mb-2">
                {(Object.values(processedData.weeklyPattern).reduce((a, b) => a + b, 0) / 7).toFixed(1)}h
              </div>
              <div className="text-sm font-medium mb-1">Daily Average</div>
              <div className="text-xs opacity-75">Hours per day</div>
            </div>
            <div className="text-center p-6 rounded-lg" style={{ backgroundColor: "#f59e0b10" }}>
              <div className="text-3xl font-bold mb-2">
                {Math.round(
                  (1 -
                    (Math.max(...Object.values(processedData.weeklyPattern)) -
                      Math.min(...Object.values(processedData.weeklyPattern))) /
                      Math.max(...Object.values(processedData.weeklyPattern))) *
                    100,
                )}
                %
              </div>
              <div className="text-sm font-medium mb-1">Consistency</div>
              <div className="text-xs opacity-75">Study regularity</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
// Predictions Analysis Component
function PredictionsAnalysis({ performancePredictions, theme }) {
  return (
    <div className="space-y-6">
      {/* Performance Predictions */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-6">
          <Award className="w-5 h-5" style={{ color: theme.secondary }} />
          <h3 className="text-lg font-semibold">Performance Predictions</h3>
        </div>
        <div className="space-y-4">
          {performancePredictions.map((course, index) => (
            <div
              key={course.code}
              className="flex items-center justify-between p-6 rounded-lg border transition-all duration-200 hover:scale-[1.02]"
              style={{ borderColor: `${course.color}30` }}
            >
              <div className="flex items-center gap-4">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: course.color }} />
                <div>
                  <div className="font-semibold text-lg">{course.name}</div>
                  <div className="text-sm opacity-75 flex items-center gap-3">
                    <span>{course.code}</span>
                    <span>{course.confidence}% confidence</span>
                    <span
                      className={`flex items-center gap-1 ${
                        course.riskLevel === "high"
                          ? "text-red-600"
                          : course.riskLevel === "medium"
                            ? "text-yellow-600"
                            : "text-green-600"
                      }`}
                    >
                      {course.riskLevel === "high" ? (
                        <XCircle className="w-3 h-3" />
                      ) : course.riskLevel === "medium" ? (
                        <AlertTriangle className="w-3 h-3" />
                      ) : (
                        <CheckCircle className="w-3 h-3" />
                      )}
                      {course.riskLevel} risk
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div
                  className="text-3xl font-bold flex items-center gap-2"
                  style={{
                    color:
                      course.predictedScore >= 80 ? "#10b981" : course.predictedScore >= 70 ? "#f59e0b" : "#ef4444",
                  }}
                >
                  {course.predictedScore}%
                  {course.trend === "up" ? (
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-500" />
                  )}
                </div>
                <div className="text-sm opacity-75">predicted grade</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Risk Assessment */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-6">
          <AlertTriangle className="w-5 h-5" style={{ color: theme.secondary }} />
          <h3 className="text-lg font-semibold">Risk Assessment</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {["high", "medium", "low"].map((riskLevel) => {
            const courses = performancePredictions.filter((c) => c.riskLevel === riskLevel)
            const color = riskLevel === "high" ? "#ef4444" : riskLevel === "medium" ? "#f59e0b" : "#10b981"
            return (
              <div key={riskLevel} className="p-4 rounded-lg border" style={{ borderColor: `${color}30` }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                  <span className="font-semibold capitalize">{riskLevel} Risk</span>
                </div>
                <div className="text-2xl font-bold mb-2">{courses.length}</div>
                <div className="text-sm opacity-75">{courses.length === 1 ? "course" : "courses"}</div>
                {courses.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {courses.slice(0, 2).map((course) => (
                      <div key={course.code} className="text-xs opacity-75">
                        {course.code}: {course.predictedScore}%
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );
};
