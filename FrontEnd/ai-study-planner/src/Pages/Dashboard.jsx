import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/PageHead';
import ActivityTimeBreakdown from '../components/ActivityTimeBreakdown';
import useRealTimeTracking from '../hooks/useRealTimeTracking';
import { 
  BarChart2, 
  BookOpen, 
  CheckCircle, 
  Clock, 
  Calendar,
  TrendingUp,
  AlertTriangle,
  Activity,
  Target,
  Zap
} from 'lucide-react';
import '../styles/themes.css';

function Dashboard() {
  // Enhanced stats tracking with more detailed metrics
  const [stats, setStats] = useState({
    activeStudents: 0,
    activeCourses: 0,
    totalCourses: 0,
    completionRate: 0,
    assignmentCompletionRate: 0,
    upcomingDeadlines: [],
    totalStudyMinutes: 0,
    averageStudyMinutes: 0,
    completedAssignments: 0,
    totalAssignments: 0,
    recentActivity: []
  });

  // Courses state with enhanced tracking
  const [courses, setCourses] = useState([]);
  
  // Get user ID from localStorage or default
  const [userId, setUserId] = useState(() => {
    return localStorage.getItem('currentUserId') || 'demo-user-001';
  });
  
  // Real-time tracking hook
  const {
    realTimeData,
    activeSession,
    todaysStats,
    isConnected,
    hasActiveSession,
    formatDuration,
    fetchDashboardData
  } = useRealTimeTracking(userId, {
    pollingInterval: 30000, // 30 seconds
    timeRange: 7,
    enablePolling: true,
    onStatusChange: (statusData) => {
      console.log('📡 Real-time status update:', statusData);
    }
  });
  
  // Enhanced stats state
  const [unifiedStats, setUnifiedStats] = useState(null);

  // Function to calculate and update stats
  const updateStats = () => {
    const coursesData = JSON.parse(localStorage.getItem('courses')) || [];
    const assignments = JSON.parse(localStorage.getItem('assignments')) || [];
    const activeStudents = JSON.parse(localStorage.getItem('activeStudents')) || [];
    
    console.log('📊 Dashboard: Updating stats');
    console.log('📚 Courses:', coursesData.length);
    console.log('📝 Assignments:', assignments.length);
    console.log('📅 Raw assignments:', assignments);
    
    // Calculate course stats
    const activeCourses = coursesData.filter(course => course.status !== 'completed').length;
    const totalCourses = coursesData.length;
    const completionRate = totalCourses > 0 
      ? Math.round((coursesData.reduce((acc, curr) => acc + (curr.progress || 0), 0) / (totalCourses * 100)) * 100)
      : 0;

    // Calculate assignment stats
    const completedAssignments = assignments.filter(a => a.status === 'completed').length;
    const totalAssignments = assignments.length;
    const assignmentCompletionRate = totalAssignments > 0 
      ? Math.round((completedAssignments / totalAssignments) * 100)
      : 0;

    // Calculate upcoming deadlines
    const upcomingDeadlines = assignments
      .filter(a => {
        const isNotCompleted = a.status !== 'completed';
        const hasValidDueDate = a.dueDate && a.dueDate !== '';
        console.log(`📅 Assignment "${a.title}": status=${a.status}, dueDate=${a.dueDate}, include=${isNotCompleted && hasValidDueDate}`);
        return isNotCompleted && hasValidDueDate;
      })
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 5);

    console.log('📅 Upcoming deadlines:', upcomingDeadlines);

    // Calculate study time with improved unit handling
    let totalStudyMinutes = 0;
    
    console.log('📊 Dashboard: Calculating study time from courses...');
    
    coursesData.forEach((course, index) => {
      const rawTimeSpent = course.timeSpent || 0;
      console.log(`Course ${index + 1} "${course.name}": ${rawTimeSpent} (raw value)`);
      
      // Handle different time units that might be stored
      let timeInMinutes = 0;
      
      if (rawTimeSpent > 0) {
        // If the value is very large (>10000), it's likely in milliseconds
        if (rawTimeSpent > 10000) {
          timeInMinutes = Math.round(rawTimeSpent / (1000 * 60)); // Convert ms to minutes
          console.log(`  → Converted from milliseconds: ${timeInMinutes} minutes`);
        }
        // If it's a reasonable number (<1000), assume it's already in minutes
        else {
          timeInMinutes = rawTimeSpent;
          console.log(`  → Using as minutes: ${timeInMinutes} minutes`);
        }
      }
      
      totalStudyMinutes += timeInMinutes;
    });
    
    console.log(`📊 Dashboard: Total study time calculated: ${totalStudyMinutes} minutes`);
    
    // Also check for study session data from enhanced tracking
    try {
      const behaviorData = JSON.parse(localStorage.getItem('cwa_behavior_data') || '{}');
      if (behaviorData.studySessions && behaviorData.studySessions.length > 0) {
        const sessionTime = behaviorData.studySessions.reduce((acc, session) => {
          const duration = session.duration || 0;
          // Session duration is likely in milliseconds, convert to minutes
          return acc + Math.round(duration / (1000 * 60));
        }, 0);
        
        console.log(`📊 Dashboard: Found ${sessionTime} minutes from study sessions`);
        
        // Use the higher of the two values (course time or session time)
        if (sessionTime > totalStudyMinutes) {
          totalStudyMinutes = sessionTime;
          console.log(`📊 Dashboard: Using session time as it's higher`);
        }
      }
    } catch (error) {
      console.warn('📊 Dashboard: Could not load behavior data:', error);
    }
    
    const averageStudyMinutes = totalCourses > 0 ? Math.round(totalStudyMinutes / totalCourses) : 0;
    
    console.log(`📊 Dashboard: Final totals - Total: ${totalStudyMinutes}m, Average: ${averageStudyMinutes}m`);

    const newStats = {
      activeStudents: activeStudents.length,
      activeCourses,
      totalCourses,
      completionRate,
      assignmentCompletionRate,
      upcomingDeadlines,
      totalStudyMinutes,
      averageStudyMinutes,
      completedAssignments,
      totalAssignments,
      recentActivity: []
    };

    setStats(newStats);
    setCourses(coursesData);
  };

  // Update stats on component mount and when localStorage changes
  useEffect(() => {
    updateStats();

    // Listen for storage changes
    const handleStorageChange = (e) => {
      if (e.key === 'assignments' || e.key === 'courses' || e.key === 'activeStudents') {
        console.log('📊 Dashboard: Storage changed, updating stats');
        updateStats();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Also listen for custom events (for same-page updates)
    const handleCustomUpdate = () => {
      updateStats();
    };

    window.addEventListener('assignmentsUpdated', handleCustomUpdate);
    window.addEventListener('coursesUpdated', handleCustomUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('assignmentsUpdated', handleCustomUpdate);
      window.removeEventListener('coursesUpdated', handleCustomUpdate);
    };
  }, []);

  // Format minutes into hours and minutes
  const formatStudyTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Format date for deadlines
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return 'Invalid Date';
    }
  };

  return (
    <div className="flex min-h-screen theme-bg-secondary">
      {/* <Sidebar activePage="dashboard" /> */}
      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <Navbar pageTitle="Dashboard Overview" />
        </div>

        {/* Main Content */}
        <div className="space-y-6 max-w-7xl mx-auto">
          {/* Real-time Study Status */}
          {hasActiveSession && activeSession && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                    <div className="absolute -top-1 -left-1 w-6 h-6 bg-green-200 rounded-full animate-ping opacity-75"></div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center">
                      <Zap className="w-5 h-5 mr-2 text-green-500" />
                      Currently Studying
                    </h3>
                    <p className="text-sm text-gray-600">
                      {activeSession.course_name} • {activeSession.session_type === 'slide_reading' ? 'Reading' : 'Study Session'}
                    </p>
                    {activeSession.filename && (
                      <p className="text-xs text-blue-600 mt-1">
                        📖 {activeSession.filename}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">
                    {formatDuration(activeSession.current_duration_minutes || 0)}
                  </p>
                  <p className="text-sm text-gray-600">Session Time</p>
                  {activeSession.reading_progress > 0 && (
                    <div className="mt-2">
                      <div className="text-xs text-gray-500 mb-1">Progress: {activeSession.reading_progress}%</div>
                      <div className="w-24 bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${activeSession.reading_progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm">
                <div className="flex space-x-6">
                  <div>
                    <span className="text-gray-600">Today's Total: </span>
                    <span className="font-medium text-gray-900">
                      {formatDuration(todaysStats?.total_minutes || 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Efficiency: </span>
                    <span className={`font-medium ${
                      activeSession.current_efficiency >= 80 ? 'text-green-600' :
                      activeSession.current_efficiency >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {activeSession.current_efficiency}%
                    </span>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs ${
                  isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {isConnected ? '🟢 Live' : '🔴 Offline'}
                </div>
              </div>
            </div>
          )}

          {/* Primary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Overall Progress */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="theme-text-secondary font-medium">Overall Progress</h3>
                <BarChart2 className="w-5 h-5 text-blue-500" />
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold theme-text-primary">{stats.completionRate}%</p>
                  <p className="text-sm theme-text-muted mt-1">Course Completion</p>
                </div>
                <div className="h-16 w-24">
                  <div className="w-full h-full bg-blue-50 rounded-lg relative overflow-hidden">
                    <div 
                      className="absolute bottom-0 left-0 right-0 bg-blue-500 transition-all duration-500"
                      style={{ height: `${stats.completionRate}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Assignment Progress */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-700 font-medium">Assignments</h3>
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold text-gray-900">{stats.assignmentCompletionRate}%</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {stats.completedAssignments}/{stats.totalAssignments} Completed
                  </p>
                </div>
                <div className="flex items-end space-x-1">
                  <div className="w-3 bg-green-100 rounded-t-sm" style={{ height: '30%' }} />
                  <div className="w-3 bg-green-200 rounded-t-sm" style={{ height: '50%' }} />
                  <div className="w-3 bg-green-300 rounded-t-sm" style={{ height: '70%' }} />
                  <div className="w-3 bg-green-400 rounded-t-sm" style={{ height: '90%' }} />
                  <div className="w-3 bg-green-500 rounded-t-sm" style={{ height: '100%' }} />
                </div>
              </div>
            </div>

            {/* Study Time */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-700 font-medium">Study Time</h3>
                <Clock className="w-5 h-5 text-purple-500" />
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatStudyTime(stats.totalStudyMinutes)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Total Study Time</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-purple-600">
                    {formatStudyTime(stats.averageStudyMinutes)}
                  </p>
                  <p className="text-xs text-gray-500">Avg. per Course</p>
                </div>
              </div>
            </div>

            {/* Active Courses */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-700 font-medium">Active Courses</h3>
                <BookOpen className="w-5 h-5 text-indigo-500" />
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold text-gray-900">{stats.activeCourses}</p>
                  <p className="text-sm text-gray-500 mt-1">of {stats.totalCourses} Total</p>
                </div>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, stats.totalCourses) }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 rounded-full ${
                        i < stats.activeCourses ? 'bg-indigo-500' : 'bg-gray-200'
                      }`}
                      style={{ height: `${16 + i * 4}px` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Secondary Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upcoming Deadlines */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-medium text-gray-900 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-orange-500" />
                  Upcoming Deadlines
                </h2>
                <Link 
                  to="/assignments" 
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  View All
                </Link>
              </div>
              <div className="space-y-4">
                {stats.upcomingDeadlines.length > 0 ? (
                  stats.upcomingDeadlines.map((assignment, index) => (
                    <div 
                      key={assignment.id || index} 
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-gray-100"
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`mt-1 w-2 h-2 rounded-full ${
                          new Date(assignment.dueDate) < new Date() 
                            ? 'bg-red-500' 
                            : 'bg-green-500'
                        }`} />
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">
                            {assignment.title || 'Untitled Assignment'}
                          </h3>
                          <p className="text-xs text-gray-500">
                            Due {formatDate(assignment.dueDate)}
                          </p>
                          {assignment.subject && (
                            <p className="text-xs text-blue-600 mt-1">
                              {assignment.subject}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          assignment.priority === 'high' || assignment.priority === 3
                            ? 'bg-red-100 text-red-800'
                            : assignment.priority === 'medium' || assignment.priority === 2
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {assignment.priority === 1 || assignment.priority === 'low' ? 'Low' :
                           assignment.priority === 2 || assignment.priority === 'medium' ? 'Medium' :
                           assignment.priority === 3 || assignment.priority === 'high' ? 'High' : 
                           assignment.priority || 'Normal'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {assignment.status || 'pending'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-2">
                      <Calendar className="w-8 h-8 mx-auto" />
                    </div>
                    <p className="text-gray-500 text-sm">No upcoming deadlines</p>
                    <p className="text-gray-400 text-xs mt-1">
                      Create assignments to see them here
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Course Progress */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-medium text-gray-900 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
                  Course Progress
                </h2>
                <Link 
                  to="/courses" 
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  View All
                </Link>
              </div>
              <div className="space-y-4">
                {courses.map((course) => (
                  <div key={course.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          {course.name}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {course.creditHours} Credit Hours
                        </p>
                      </div>
                      <span className="text-sm text-gray-600">
                        {course.progress || 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${course.progress || 0}%` }}
                      />
                    </div>
                  </div>
                ))}
                {courses.length === 0 && (
                  <div className="text-center py-6 text-gray-500">
                    No courses added yet
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Risk Analysis */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-yellow-500" />
                Performance Insights
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-100">
                <h3 className="text-sm font-medium text-yellow-800 mb-2">
                  Upcoming Deadlines
                </h3>
                <p className="text-2xl font-bold text-yellow-900">
                  {stats.upcomingDeadlines.length}
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Tasks requiring attention
                </p>
              </div>
              <div className="p-4 rounded-lg bg-green-50 border border-green-100">
                <h3 className="text-sm font-medium text-green-800 mb-2">
                  On Track
                </h3>
                <p className="text-2xl font-bold text-green-900">
                  {courses.filter(c => c.progress >= 70).length}
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Courses above 70%
                </p>
              </div>
              <div className="p-4 rounded-lg bg-red-50 border border-red-100">
                <h3 className="text-sm font-medium text-red-800 mb-2">
                  Needs Attention
                </h3>
                <p className="text-2xl font-bold text-red-900">
                  {courses.filter(c => c.progress < 40).length}
                </p>
                <p className="text-xs text-red-700 mt-1">
                  Courses below 40%
                </p>
              </div>
            </div>
          </div>

          {/* Activity Time Breakdown */}
          <ActivityTimeBreakdown 
            userId={userId}
            timeRange={7}
            showDetails={true}
          />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
