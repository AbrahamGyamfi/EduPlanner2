import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/sidebar';
import Navbar from '../components/PageHead';
import { 
  BarChart2, 
  BookOpen, 
  CheckCircle, 
  Clock, 
  Calendar,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

function Dashboard() {
  // Enhanced stats tracking with more detailed metrics
  const [stats, setStats] = useState(() => {
    const courses = JSON.parse(localStorage.getItem('courses')) || [];
    const assignments = JSON.parse(localStorage.getItem('assignments')) || [];
    const activeStudents = JSON.parse(localStorage.getItem('activeStudents')) || [];
    
    // Calculate course stats
    const activeCourses = courses.filter(course => course.status !== 'completed').length;
    const totalCourses = courses.length;
    const completionRate = totalCourses > 0 
      ? Math.round((courses.reduce((acc, curr) => acc + (curr.progress || 0), 0) / (totalCourses * 100)) * 100)
      : 0;

    // Calculate assignment stats
    const completedAssignments = assignments.filter(a => a.status === 'completed').length;
    const totalAssignments = assignments.length;
    const assignmentCompletionRate = totalAssignments > 0 
      ? Math.round((completedAssignments / totalAssignments) * 100)
      : 0;

    // Calculate upcoming deadlines
    const upcomingDeadlines = assignments
      .filter(a => a.status !== 'completed')
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 5);

    // Calculate study time
    const totalStudyMinutes = courses.reduce((acc, curr) => acc + (curr.timeSpent || 0), 0);
    const averageStudyMinutes = totalCourses > 0 ? Math.round(totalStudyMinutes / totalCourses) : 0;

    return {
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
  });

  // Courses state with enhanced tracking
  const [courses] = useState(() => {
    const savedCourses = localStorage.getItem('courses');
    return savedCourses ? JSON.parse(savedCourses) : [];
  });

  // Format minutes into hours and minutes
  const formatStudyTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Format date for deadlines
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex min-h-screen bg-[#f7f9fc]">
      {/* <Sidebar activePage="dashboard" /> */}
      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <Navbar pageTitle="Dashboard Overview" />
        </div>

        {/* Main Content */}
        <div className="space-y-6 max-w-7xl mx-auto">
          {/* Primary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Overall Progress */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-700 font-medium">Overall Progress</h3>
                <BarChart2 className="w-5 h-5 text-blue-500" />
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold text-gray-900">{stats.completionRate}%</p>
                  <p className="text-sm text-gray-500 mt-1">Course Completion</p>
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
                {stats.upcomingDeadlines.map((assignment, index) => (
                  <div 
                    key={assignment.id} 
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`mt-1 w-2 h-2 rounded-full ${
                        new Date(assignment.dueDate) < new Date() 
                          ? 'bg-red-500' 
                          : 'bg-green-500'
                      }`} />
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          {assignment.title}
                        </h3>
                        <p className="text-xs text-gray-500">
                          Due {formatDate(assignment.dueDate)}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      assignment.priority === 'high' 
                        ? 'bg-red-100 text-red-800'
                        : assignment.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {assignment.priority}
                    </span>
                  </div>
                ))}
                {stats.upcomingDeadlines.length === 0 && (
                  <div className="text-center py-6 text-gray-500">
                    No upcoming deadlines
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
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
