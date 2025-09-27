import React, { useState, useEffect, useMemo } from 'react';
import CWAAnalysisPageComponent from '../components/cwa-analysis/cwa-analysis-page';
import EnhancedCWAWithQuizzes from '../components/cwa-analysis/enhanced-cwa-with-quizzes';
import { Brain, BarChart3, Award, TrendingUp, BookOpen } from 'lucide-react';

const CWAAnalysisPage = () => {
  const [activeView, setActiveView] = useState('overview');
  const [scheduleData, setScheduleData] = useState([]);
  const [userCourses, setUserCourses] = useState([]);
  const [theme, setTheme] = useState({
    name: 'Modern Blue',
    primary: '#3b82f6',
    secondary: '#1e40af',
    accent: '#60a5fa',
    background: '#f8fafc',
    surface: '#ffffff',
    text: '#1f2937'
  });

  // Load saved data from localStorage
  useEffect(() => {
    const savedCourses = localStorage.getItem('courses');
    const savedSchedule = localStorage.getItem('study_schedule');
    
    if (savedCourses) {
      const courses = JSON.parse(savedCourses);
      setUserCourses(courses);
      // Convert courses to schedule format for the analysis components
      const mockSchedule = courses.flatMap(course => 
        course.assignments?.map((assignment, index) => ({
          id: `${course.id}-${assignment.id || index}`,
          courseId: course.id,
          courseName: course.name,
          courseCode: course.code || course.name.substring(0, 6).toUpperCase(),
          type: assignment.type || 'Assignment',
          startTime: '09:00',
          endTime: '11:00',
          day: Math.floor(Math.random() * 7) + 1,
          duration: 120,
          difficulty: assignment.weight || 3,
          color: course.color || '#3b82f6',
          timeSlot: '09:00 - 11:00',
          priority: assignment.weight > 20 ? 'high' : 'normal',
          learningStyle: ['visual', 'auditory', 'kinesthetic', 'reading'][Math.floor(Math.random() * 4)]
        })) || []
      );
      setScheduleData(mockSchedule);
    }
    
    if (savedSchedule) {
      setScheduleData(JSON.parse(savedSchedule));
    }
  }, []);

  // Mock data for demonstration if no saved data
  const mockScheduleData = useMemo(() => {
    if (scheduleData.length === 0) {
      return [
        {
          id: 'demo-1',
          courseId: 1,
          courseName: 'Advanced Mathematics',
          courseCode: 'MATH301',
          type: 'Study Session',
          startTime: '09:00',
          endTime: '11:00',
          day: 1,
          duration: 120,
          difficulty: 4,
          color: '#3b82f6',
          timeSlot: '09:00 - 11:00',
          priority: 'high',
          learningStyle: 'visual'
        },
        {
          id: 'demo-2',
          courseId: 2,
          courseName: 'Computer Science',
          courseCode: 'CS101',
          type: 'Assignment',
          startTime: '14:00',
          endTime: '16:00',
          day: 2,
          duration: 120,
          difficulty: 3,
          color: '#10b981',
          timeSlot: '14:00 - 16:00',
          priority: 'normal',
          learningStyle: 'kinesthetic'
        },
        {
          id: 'demo-3',
          courseId: 3,
          courseName: 'Physics Lab',
          courseCode: 'PHYS201',
          type: 'Review',
          startTime: '19:00',
          endTime: '21:00',
          day: 3,
          duration: 120,
          difficulty: 5,
          color: '#f59e0b',
          timeSlot: '19:00 - 21:00',
          priority: 'high',
          learningStyle: 'auditory'
        }
      ];
    }
    return scheduleData;
  }, [scheduleData]);

  const mockUserCourses = useMemo(() => {
    // If user has registered courses, use them
    if (userCourses.length > 0) {
      return userCourses;
    }
    
    // Otherwise, return empty array so components can handle no courses gracefully
    return [];
  }, [userCourses]);

  const views = [
    { id: 'overview', label: 'Analysis Dashboard', icon: BarChart3, component: CWAAnalysisPageComponent },
    { id: 'enhanced', label: 'Enhanced Analysis', icon: Award, component: EnhancedCWAWithQuizzes }
  ];

  const ActiveComponent = views.find(view => view.id === activeView)?.component || CWAAnalysisPageComponent;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-full mr-4 shadow-lg">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800">
               Analysis Suite
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Advanced Comprehensive Weighted Average Analysis with AI-powered insights, 
            performance predictions, and personalized recommendations for academic success.
          </p>
        </div>

        {/* View Navigation */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Analysis Views</h2>
            <div className="flex items-center text-sm text-gray-500">
              <TrendingUp className="w-4 h-4 mr-1" />
              AI-Powered Analytics
            </div>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto">
            {views.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveView(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap ${
                  activeView === id 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Active Component */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <ActiveComponent 
            scheduleData={mockScheduleData}
            userCourses={mockUserCourses}
            theme={theme}
          />
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
            <div className="flex items-center">
              <BarChart3 className="w-4 h-4 mr-1" />
              Advanced Analytics
            </div>
            <div className="flex items-center">
              <TrendingUp className="w-4 h-4 mr-1" />
              Performance Prediction
            </div>
            <div className="flex items-center">
              <Brain className="w-4 h-4 mr-1" />
              AI-Powered Insights
            </div>
            <div className="flex items-center">
              <BookOpen className="w-4 h-4 mr-1" />
              Study Optimization
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CWAAnalysisPage;
