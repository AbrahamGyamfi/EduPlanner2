import React, { useState, useEffect, useCallback, useMemo } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { 
  Zap, BookOpen, Clock, Brain, X, Loader, FileText, Calendar, Check, 
  Search, List, Grid, Target, Hourglass, Book, Download, Edit2, Trash2, 
  GripVertical, Save, Plus, RotateCcw, Settings, Bell, Share2, TrendingUp,
  CheckCircle, AlertCircle, Info
} from "lucide-react";

// ========================================================================================
// CONSTANTS & CONFIGURATION
// ========================================================================================

const COURSE_COLORS = ['#EF4444', '#3B82F6', '#22C55E', '#F97316', '#A855F7', '#06B6D4'];

const TIME_SLOTS = [
  { id: 'early-morning', label: 'Early Morning', time: '6:00 - 8:00 AM', icon: '🌅' },
  { id: 'morning', label: 'Morning', time: '8:00 - 12:00 PM', icon: '☀️' },
  { id: 'afternoon', label: 'Afternoon', time: '12:00 - 5:00 PM', icon: '🌤️' },
  { id: 'evening', label: 'Evening', time: '5:00 - 8:00 PM', icon: '🌆' },
  { id: 'night', label: 'Night', time: '8:00 - 11:00 PM', icon: '🌙' },
];

const LEARNING_STYLES = [
  { id: 'visual', label: 'Visual', description: 'Learn through diagrams and visual aids', icon: '👁️' },
  { id: 'auditory', label: 'Auditory', description: 'Learn through listening', icon: '🎧' },
  { id: 'kinesthetic', label: 'Hands-on', description: 'Learn through practice', icon: '🖐️' },
  { id: 'reading-writing', label: 'Reading/Writing', description: 'Learn through text', icon: '📖' },
  { id: 'group-study', label: 'Group Study', description: 'Learn with others', icon: '👥' },
  { id: 'problem-solving', label: 'Problem Solving', description: 'Learn through reasoning', icon: '🎯' },
];

const SCHEDULE_VIEWS = {
  DASHBOARD: 'dashboard',
  CALENDAR: 'calendar',
  LIST: 'list',
  GRID: 'grid'
};

const WIZARD_STEPS = {
  WELCOME: 0,
  COURSES: 1,
  PREFERENCES: 2,
  LEARNING_STYLES: 3,
  REVIEW: 4,
  GENERATED: 5
};

// ========================================================================================
// UTILITY FUNCTIONS
// ========================================================================================

const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const formatTime = (timeSlot) => {
  const timeMatch = timeSlot?.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/i);
  return timeMatch ? `${timeMatch[1]}-${timeMatch[2]}` : '09:00-11:00';
};

const getDayName = (date) => {
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return date ? dayNames[date.getDay()] : 'monday';
};

// ========================================================================================
// CHILD COMPONENTS
// ========================================================================================

const LoadingSpinner = ({ message = "Loading..." }) => (
  <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 animate-fade-in">
    <div className="bg-white rounded-lg shadow-xl p-8 max-w-sm w-full text-center">
      <div className="p-4 bg-blue-100 rounded-full inline-flex mb-6">
        <Loader className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-3">Generating Your Schedule</h3>
      <p className="text-gray-700 text-base">{message}</p>
    </div>
  </div>
);

const NotificationBar = ({ message, type = 'success', onClose }) => {
  const bgColor = type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700';
  const icon = type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />;
  
  return (
    <div className={`flex items-center space-x-2 text-sm px-3 py-2 rounded-full ${bgColor} animate-fade-in`}>
      {icon}
      <span>{message}</span>
      {onClose && (
        <button onClick={onClose} className="ml-2 hover:opacity-70">
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

const StatsCard = ({ icon: Icon, title, value, color = 'blue' }) => (
  <div className="bg-white rounded-xl shadow-md p-6 flex items-center space-x-4 border border-gray-200">
    <div className={`p-3 bg-${color}-100 rounded-full`}>
      <Icon className={`w-6 h-6 text-${color}-600`} />
    </div>
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
    </div>
  </div>
);

const CourseCard = ({ course, isSelected, onToggle, colorIndex }) => {
  const courseColor = COURSE_COLORS[colorIndex % COURSE_COLORS.length];
  
  return (
    <div
      className={`relative p-5 border rounded-xl cursor-pointer transition-all duration-300 transform hover:-translate-y-1
        ${isSelected 
          ? 'border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-200' 
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 hover:shadow-md'}`}
      onClick={() => onToggle(course.id)}
    >
      <div className="flex items-center justify-between space-x-3 mb-2">
        <div className="flex items-center space-x-3">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: courseColor }}></span>
          <h4 className="text-lg font-semibold text-gray-800">
            {course.name || course.title || 'Unnamed Course'}
          </h4>
        </div>
        {isSelected && (
          <Check className="w-6 h-6 text-blue-600" />
        )}
      </div>
      <p className="text-sm text-gray-700">{course.code} • {course.creditHours || 3} credits</p>
    </div>
  );
};

const SessionCard = ({ session, course, onEdit, onDelete, onComplete, isBulkMode, isSelected, onSelect }) => {
  const sessionColor = session.courseColor;
  
  return (
    <div 
      className={`bg-white rounded-xl shadow-sm p-5 border-l-4 border-t border-b border-r border-gray-200 group hover:shadow-md transition-all duration-200
        ${isBulkMode && isSelected ? 'ring-2 ring-purple-200 bg-purple-50' : ''}`}
      style={{ borderColor: sessionColor }}
    >
      <div className="flex items-start space-x-4">
        {isBulkMode && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(session.id)}
            className="mt-2 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
          />
        )}
        
        <span className="w-3 h-3 rounded-full flex-shrink-0 mt-2" style={{ backgroundColor: sessionColor }}></span>
        
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1">
            <h4 className="text-lg font-semibold text-gray-800">
              {course?.name || course?.title || 'Unnamed Course'} 
              <span className="text-base text-gray-500 font-normal ml-2">{course?.code}</span>
              {session.isAssignmentSession && (
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  Assignment
                </span>
              )}
            </h4>
            
            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {session.isAssignmentSession && (
                <input
                  type="checkbox"
                  checked={session.completed || false}
                  onChange={(e) => onComplete(session.id, e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  title="Mark as complete"
                />
              )}
              
              <button 
                onClick={() => onEdit(session)}
                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors duration-200"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => onDelete(session.id)}
                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors duration-200"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <p className="text-gray-700 mb-2">{session.activity}</p>
          
          {session.isAssignmentSession && (
            <div className="mb-2 p-2 bg-orange-50 border border-orange-200 rounded-md">
              <p className="text-sm text-orange-800">
                <span className="font-medium">Assignment:</span> {session.assignmentTitle}
              </p>
              <p className="text-xs text-orange-600">
                Due: {new Date(session.dueDate).toLocaleDateString()}
              </p>
            </div>
          )}
          
          <div className="flex text-sm text-gray-600 space-x-4">
            <span>{session.timeSlot}</span>
            <span>{session.duration} minutes</span>
            <span className={`px-2 py-1 rounded-full text-xs ${
              session.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {session.priority} priority
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ========================================================================================
// MAIN COMPONENT
// ========================================================================================

const Schedule = () => {
  // ==================== STATE MANAGEMENT ====================
  
  // Core application state
  const [currentView, setCurrentView] = useState(SCHEDULE_VIEWS.DASHBOARD);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(WIZARD_STEPS.WELCOME);
  
  // Data state
  const [availableCourses, setAvailableCourses] = useState([]);
  const [generatedSchedule, setGeneratedSchedule] = useState([]);
  const [assignments, setAssignments] = useState([]);
  
  // Preferences state
  const [preferences, setPreferences] = useState({
    selectedCourses: [],
    studyDuration: 60,
    studyDaysPerWeek: 5,
    learningTimes: [],
    learningStyles: [],
  });
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedSessions, setSelectedSessions] = useState(new Set());
  const [isBulkEditMode, setIsBulkEditMode] = useState(false);
  
  // Modal state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState('json');
  
  // Save state
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState(null);

  // ==================== COMPUTED VALUES ====================
  
  const scheduleStats = useMemo(() => {
    const totalSessions = generatedSchedule.length;
    const highPriority = generatedSchedule.filter(s => s.priority === 'high').length;
    const totalHours = Math.floor((totalSessions * preferences.studyDuration) / 60);
    const uniqueCourses = new Set(generatedSchedule.map(s => s.courseId)).size;
    const completedSessions = generatedSchedule.filter(s => s.completed).length;
    const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;
    
    return { totalSessions, highPriority, totalHours, uniqueCourses, completedSessions, completionRate };
  }, [generatedSchedule, preferences.studyDuration]);

  const filteredSchedule = useMemo(() => {
    let filtered = generatedSchedule;
    if (selectedFilter === 'high') return filtered.filter(s => s.priority === 'high');
    if (selectedFilter === 'normal') return filtered.filter(s => s.priority === 'normal');
    if (selectedFilter === 'completed') return filtered.filter(s => s.completed);
    if (selectedFilter === 'pending') return filtered.filter(s => !s.completed);
    return filtered;
  }, [generatedSchedule, selectedFilter]);

  // ==================== DATA LOADING ====================
  
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    await Promise.all([
      loadCourses(),
      loadAssignments(),
      loadSavedSchedule(),
      loadSavedPreferences()
    ]);
  };

  const loadCourses = () => {
    try {
      const savedCourses = localStorage.getItem('courses');
      if (savedCourses) {
        setAvailableCourses(JSON.parse(savedCourses));
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      showNotification('Error loading courses', 'error');
    }
  };

  const loadAssignments = async () => {
    try {
      const response = await fetch('http://localhost:5000/assignments');
      if (response.ok) {
        const data = await response.json();
        const mappedAssignments = data.assignments.map(assignment => ({
          id: assignment.assignment_id,
          title: assignment.title,
          description: assignment.description,
          dueDate: assignment.dueDate,
          status: assignment.status,
          subject: assignment.courseName || 'General',
          courseId: assignment.courseId,
          userId: assignment.userId,
          created_at: assignment.created_at,
          completedAt: assignment.completedAt || null
        }));
        setAssignments(mappedAssignments);
      }
    } catch (error) {
      console.error('Error loading assignments:', error);
    }
  };

  const loadSavedSchedule = () => {
    try {
      const savedSchedule = localStorage.getItem('study_schedule');
      if (savedSchedule) {
        const parsedSchedule = JSON.parse(savedSchedule);
        const scheduleWithDates = parsedSchedule.map(session => ({
          ...session,
          fullDate: new Date(session.fullDate),
          id: session.id || generateSessionId()
        }));
        setGeneratedSchedule(scheduleWithDates);
        if (scheduleWithDates.length > 0) {
          setCurrentView(SCHEDULE_VIEWS.CALENDAR);
        }
      }
    } catch (error) {
      console.error('Error loading saved schedule:', error);
    }
  };

  const loadSavedPreferences = () => {
    try {
      const savedPreferences = localStorage.getItem('schedule_preferences');
      if (savedPreferences) {
        setPreferences(JSON.parse(savedPreferences));
      }
    } catch (error) {
      console.error('Error loading saved preferences:', error);
    }
  };

  // ==================== SAVE FUNCTIONALITY ====================
  
  const saveScheduleToBackend = useCallback(async () => {
    if (generatedSchedule.length === 0) {
      showNotification('No schedule to save', 'error');
      return;
    }

    setIsSaving(true);
    
    try {
      const userId = localStorage.getItem('userId') || 'default-user';
      
      const backendSchedule = generatedSchedule.map(session => ({
        id: session.id,
        day: getDayName(session.fullDate),
        time: formatTime(session.timeSlot),
        subject: session.courseName || 'Study Session',
        type: session.learningStyle || 'study',
        location: 'Study Area',
        notes: session.activity || 'Study session'
      }));

      const response = await fetch('http://localhost:5000/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          schedule: backendSchedule,
          preferences,
          schedule_name: 'My Study Schedule',
          is_active: true
        })
      });

      if (response.ok) {
        setLastSaveTime(new Date());
        showNotification('Schedule saved successfully!', 'success');
        
        // Auto-save to localStorage
        localStorage.setItem('study_schedule', JSON.stringify(generatedSchedule));
        
        // Auto-reload after save for consistency
        setTimeout(() => reloadScheduleFromServer(), 1000);
      } else {
        const errorData = await response.json();
        showNotification(`Save failed: ${errorData.error || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
      showNotification('Network error - please try again', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [generatedSchedule, preferences]);

  const reloadScheduleFromServer = async () => {
    try {
      const userId = localStorage.getItem('userId') || 'default-user';
      const response = await fetch(`http://localhost:5000/schedule/${userId}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.schedule?.schedule?.length > 0) {
          const scheduleWithDates = data.schedule.schedule.map(session => ({
            ...session,
            fullDate: new Date(session.fullDate || new Date()),
            id: session.id || generateSessionId()
          }));
          setGeneratedSchedule(scheduleWithDates);
        }
      }
    } catch (error) {
      console.error('Error reloading schedule:', error);
    }
  };

  // ==================== NOTIFICATION SYSTEM ====================
  
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // ==================== SCHEDULE GENERATION ====================
  
  const generateSchedule = useCallback(() => {
    if (!validatePreferences()) return;

    setIsLoading(true);
    setError(null);

    setTimeout(() => {
      try {
        const newSchedule = createScheduleSessions();
        setGeneratedSchedule(newSchedule);
        setCurrentView(SCHEDULE_VIEWS.CALENDAR);
        setIsWizardOpen(false);
        showNotification(`Generated ${newSchedule.length} study sessions!`, 'success');
      } catch (error) {
        setError('Failed to generate schedule. Please try again.');
        console.error('Schedule generation error:', error);
      } finally {
        setIsLoading(false);
      }
    }, 2000);
  }, [preferences, availableCourses, assignments]);

  const validatePreferences = () => {
    if (preferences.selectedCourses.length === 0) {
      setError("Please select at least one course.");
      return false;
    }
    if (preferences.learningTimes.length === 0) {
      setError("Please select at least one preferred study time.");
      return false;
    }
    if (preferences.learningStyles.length === 0) {
      setError("Please select at least one learning style.");
      return false;
    }
    return true;
  };

  const createScheduleSessions = () => {
    const selectedCourseObjects = availableCourses.filter(course =>
      preferences.selectedCourses.includes(course.id)
    );

    if (selectedCourseObjects.length === 0) {
      throw new Error("No valid courses selected");
    }

    const newSchedule = [];
    const today = new Date();
    const endDate = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days from now

    // Generate sessions for each selected course
    selectedCourseObjects.forEach(course => {
      const sessionsPerWeek = Math.max(1, Math.floor(preferences.studyDaysPerWeek / selectedCourseObjects.length));
      
      for (let week = 0; week < 4; week++) {
        for (let session = 0; session < sessionsPerWeek; session++) {
          const sessionDate = new Date(today);
          sessionDate.setDate(today.getDate() + (week * 7) + session);
          
          if (sessionDate > endDate) continue;

          const randomTimeSlot = preferences.learningTimes[Math.floor(Math.random() * preferences.learningTimes.length)];
          const randomLearningStyle = preferences.learningStyles[Math.floor(Math.random() * preferences.learningStyles.length)];
          
          const timeSlotObj = TIME_SLOTS.find(slot => slot.id === randomTimeSlot);
          const learningStyleObj = LEARNING_STYLES.find(style => style.id === randomLearningStyle);
          
          newSchedule.push({
            id: generateSessionId(),
            fullDate: sessionDate,
            day: sessionDate.getDay() === 0 ? 7 : sessionDate.getDay(),
            courseId: course.id,
            courseName: course.name || course.title || 'Unnamed Course',
            courseCode: course.code,
            courseColor: COURSE_COLORS[availableCourses.findIndex(c => c.id === course.id) % COURSE_COLORS.length],
            timeSlot: timeSlotObj?.time || 'Anytime',
            duration: preferences.studyDuration,
            learningStyle: randomLearningStyle,
            activity: `Study ${course.name || course.title}`,
            priority: course.creditHours >= 4 ? 'high' : 'normal',
            creditHours: course.creditHours || 3,
            completed: false
          });
        }
      }
    });

    return newSchedule.sort((a, b) => a.fullDate - b.fullDate);
  };

  // ==================== EVENT HANDLERS ====================
  
  const handleCourseToggle = (courseId) => {
    setPreferences(prev => ({
      ...prev,
      selectedCourses: prev.selectedCourses.includes(courseId)
        ? prev.selectedCourses.filter(id => id !== courseId)
        : [...prev.selectedCourses, courseId]
    }));
  };

  const handleTimeSlotToggle = (timeSlotId) => {
    setPreferences(prev => ({
      ...prev,
      learningTimes: prev.learningTimes.includes(timeSlotId)
        ? prev.learningTimes.filter(id => id !== timeSlotId)
        : [...prev.learningTimes, timeSlotId]
    }));
  };

  const handleLearningStyleToggle = (styleId) => {
    setPreferences(prev => ({
      ...prev,
      learningStyles: prev.learningStyles.includes(styleId)
        ? prev.learningStyles.filter(id => id !== styleId)
        : [...prev.learningStyles, styleId]
    }));
  };

  const handleEditSession = (session) => {
    setEditingSession(session);
    setIsEditMode(true);
  };

  const handleUpdateSession = (updatedSession) => {
    setGeneratedSchedule(prev => 
      prev.map(session => 
        session.id === updatedSession.id ? updatedSession : session
      )
    );
    setIsEditMode(false);
    setEditingSession(null);
    showNotification('Session updated successfully!', 'success');
    
    // Auto-save after update
    setTimeout(() => saveScheduleToBackend(), 500);
  };

  const handleDeleteSession = (sessionId) => {
    setGeneratedSchedule(prev => prev.filter(session => session.id !== sessionId));
    showNotification('Session deleted', 'success');
    setTimeout(() => saveScheduleToBackend(), 500);
  };

  const handleSessionCompletion = async (sessionId, isCompleted) => {
    const session = generatedSchedule.find(s => s.id === sessionId);
    if (!session) return;

    const updatedSession = { 
      ...session, 
      completed: isCompleted, 
      completedAt: isCompleted ? new Date().toISOString() : null 
    };
    
    setGeneratedSchedule(prev => 
      prev.map(s => s.id === sessionId ? updatedSession : s)
    );

    // Update assignment status if applicable
    if (session.assignmentId && isCompleted) {
      try {
        await fetch(`http://localhost:5000/assignments/${session.assignmentId}/complete`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ completed: true })
        });
        
        setAssignments(prev => 
          prev.map(assignment => 
            assignment.id === session.assignmentId 
              ? { ...assignment, status: 'completed', completedAt: new Date().toISOString() }
              : assignment
          )
        );
      } catch (error) {
        console.error('Error updating assignment:', error);
      }
    }

    setTimeout(() => saveScheduleToBackend(), 500);
  };

  // ==================== EXPORT FUNCTIONALITY ====================
  
  const exportSchedule = () => {
    const data = generatedSchedule.map(session => ({
      ...session,
      fullDate: session.fullDate.toISOString(),
    }));

    let content, mimeType, fileExtension;

    switch (exportFormat) {
      case 'json':
        content = JSON.stringify(data, null, 2);
        mimeType = 'application/json';
        fileExtension = 'json';
        break;
      case 'csv':
        const headers = ['Date', 'Course', 'Time', 'Duration', 'Activity', 'Priority'];
        const csvRows = [
          headers,
          ...data.map(session => [
            new Date(session.fullDate).toLocaleDateString(),
            session.courseName,
            session.timeSlot,
            `${session.duration} minutes`,
            session.activity,
            session.priority
          ])
        ];
        content = csvRows.map(row => row.join(',')).join('\n');
        mimeType = 'text/csv';
        fileExtension = 'csv';
        break;
      case 'ical':
        const icalEvents = data.map(session => {
          const startDate = new Date(session.fullDate);
          const endDate = new Date(startDate.getTime() + session.duration * 60000);
          
          return `BEGIN:VEVENT
DTSTART:${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTEND:${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
SUMMARY:${session.courseName} - ${session.activity}
DESCRIPTION:${session.learningStyle} - ${session.timeSlot}
PRIORITY:${session.priority}
END:VEVENT`;
        }).join('\n');

        content = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//StudyPlanner//Schedule\n${icalEvents}\nEND:VCALENDAR`;
        mimeType = 'text/calendar';
        fileExtension = 'ics';
        break;
      default:
        return;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `study_schedule.${fileExtension}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    setIsExportModalOpen(false);
    showNotification(`Schedule exported as ${fileExtension.toUpperCase()}!`, 'success');
  };

  // ==================== RENDER FUNCTIONS ====================
  
  const renderDashboard = () => (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="text-center py-12">
        <div className="p-6 bg-blue-100 rounded-full inline-flex mb-6">
          <Calendar className="w-16 h-16 text-blue-600" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Smart Study Scheduler</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          Create AI-powered study schedules that adapt to your learning style and assignment deadlines
        </p>
        
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => setIsWizardOpen(true)}
            className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-700 hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 flex items-center space-x-2"
          >
            <Zap className="w-5 h-5" />
            <span>Create New Schedule</span>
          </button>
          
          {generatedSchedule.length > 0 && (
            <button
              onClick={() => setCurrentView(SCHEDULE_VIEWS.CALENDAR)}
              className="px-8 py-4 border-2 border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-all duration-300 flex items-center space-x-2"
            >
              <Calendar className="w-5 h-5" />
              <span>View Schedule</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      {generatedSchedule.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard icon={BookOpen} title="Total Sessions" value={scheduleStats.totalSessions} color="blue" />
          <StatsCard icon={Target} title="High Priority" value={scheduleStats.highPriority} color="red" />
          <StatsCard icon={Hourglass} title="Study Hours" value={scheduleStats.totalHours} color="green" />
          <StatsCard icon={TrendingUp} title="Completion Rate" value={`${scheduleStats.completionRate}%`} color="purple" />
        </div>
      )}

      {/* Recent Activity */}
      {generatedSchedule.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Sessions</h3>
            <button
              onClick={() => setCurrentView(SCHEDULE_VIEWS.LIST)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View All
            </button>
          </div>
          
          <div className="space-y-3">
            {generatedSchedule
              .filter(session => session.fullDate >= new Date())
              .slice(0, 3)
              .map(session => {
                const course = availableCourses.find(c => c.id === session.courseId);
                return (
                  <div key={session.id} className="flex items-center space-x-3 p-3 border border-gray-100 rounded-lg">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: session.courseColor }}></span>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800">{session.courseName}</h4>
                      <p className="text-sm text-gray-600">
                        {session.fullDate.toLocaleDateString()} • {session.timeSlot} • {session.duration}min
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      session.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {session.priority}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );

  const renderScheduleWizard = () => {
    if (!isWizardOpen) return null;

    return (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Wizard Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Schedule Wizard</h2>
              <p className="text-gray-600">Step {wizardStep + 1} of {Object.keys(WIZARD_STEPS).length - 1}</p>
            </div>
            <button 
              onClick={() => setIsWizardOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(wizardStep / (Object.keys(WIZARD_STEPS).length - 2)) * 100}%` }}
              />
            </div>
          </div>

          {/* Wizard Content */}
          <div className="p-6">
            {wizardStep === WIZARD_STEPS.WELCOME && (
              <div className="text-center py-8">
                <Brain className="w-16 h-16 text-blue-600 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Let's Create Your Perfect Study Schedule</h3>
                <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                  Our AI will help you create a personalized study schedule based on your courses, 
                  learning preferences, and available time slots.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="text-center">
                    <BookOpen className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <h4 className="font-semibold text-gray-800">Select Courses</h4>
                    <p className="text-sm text-gray-600">Choose your subjects</p>
                  </div>
                  <div className="text-center">
                    <Clock className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <h4 className="font-semibold text-gray-800">Set Preferences</h4>
                    <p className="text-sm text-gray-600">Define your schedule</p>
                  </div>
                  <div className="text-center">
                    <Zap className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <h4 className="font-semibold text-gray-800">Generate & Save</h4>
                    <p className="text-sm text-gray-600">Get your schedule</p>
                  </div>
                </div>
                <button
                  onClick={() => setWizardStep(WIZARD_STEPS.COURSES)}
                  className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all duration-300"
                >
                  Get Started
                </button>
              </div>
            )}

            {wizardStep === WIZARD_STEPS.COURSES && (
              <div>
                <div className="text-center mb-8">
                  <BookOpen className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Select Your Courses</h3>
                  <p className="text-gray-600">Choose the courses you want to include in your study schedule</p>
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <p className="text-red-800">{error}</p>
                    </div>
                  </div>
                )}

                {availableCourses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {availableCourses.map((course, index) => (
                      <CourseCard
                        key={course.id}
                        course={course}
                        isSelected={preferences.selectedCourses.includes(course.id)}
                        onToggle={handleCourseToggle}
                        colorIndex={index}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Book className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No courses available. Please add courses to your profile first.</p>
                  </div>
                )}

                {/* Study Preferences */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Study Session Duration (minutes)</label>
                    <input
                      type="number"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={preferences.studyDuration}
                      onChange={(e) => setPreferences(prev => ({ ...prev, studyDuration: parseInt(e.target.value) || 60 }))}
                      min="15"
                      step="15"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Study Days per Week</label>
                    <input
                      type="number"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={preferences.studyDaysPerWeek}
                      onChange={(e) => setPreferences(prev => ({ ...prev, studyDaysPerWeek: Math.max(1, Math.min(7, parseInt(e.target.value) || 5)) }))}
                      min="1"
                      max="7"
                    />
                  </div>
                </div>
              </div>
            )}

            {wizardStep === WIZARD_STEPS.PREFERENCES && (
              <div>
                <div className="text-center mb-8">
                  <Clock className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">When Do You Study Best?</h3>
                  <p className="text-gray-600">Select your preferred study times</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {TIME_SLOTS.map(slot => (
                    <div
                      key={slot.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all duration-300 transform hover:-translate-y-1
                        ${preferences.learningTimes.includes(slot.id)
                          ? 'border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                      onClick={() => handleTimeSlotToggle(slot.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{slot.icon}</span>
                        <div>
                          <h4 className="font-semibold text-gray-800">{slot.label}</h4>
                          <p className="text-sm text-gray-600">{slot.time}</p>
                        </div>
                        {preferences.learningTimes.includes(slot.id) && (
                          <Check className="w-5 h-5 text-blue-600 ml-auto" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {wizardStep === WIZARD_STEPS.LEARNING_STYLES && (
              <div>
                <div className="text-center mb-8">
                  <Brain className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">How Do You Learn Best?</h3>
                  <p className="text-gray-600">Select your learning preferences</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {LEARNING_STYLES.map(style => (
                    <div
                      key={style.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all duration-300 transform hover:-translate-y-1
                        ${preferences.learningStyles.includes(style.id)
                          ? 'border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                      onClick={() => handleLearningStyleToggle(style.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{style.icon}</span>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800">{style.label}</h4>
                          <p className="text-sm text-gray-600">{style.description}</p>
                        </div>
                        {preferences.learningStyles.includes(style.id) && (
                          <Check className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {wizardStep === WIZARD_STEPS.REVIEW && (
              <div>
                <div className="text-center mb-8">
                  <Settings className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Review Your Preferences</h3>
                  <p className="text-gray-600">Make sure everything looks good before generating your schedule</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Selected Courses */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">Selected Courses ({preferences.selectedCourses.length})</h4>
                    <div className="space-y-2">
                      {preferences.selectedCourses.map(courseId => {
                        const course = availableCourses.find(c => c.id === courseId);
                        return (
                          <div key={courseId} className="flex items-center space-x-2">
                            <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                            <span className="text-sm text-gray-700">{course?.name || 'Unknown Course'}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Preferences Summary */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">Study Preferences</h4>
                    <div className="space-y-2 text-sm text-gray-700">
                      <div>Duration: {preferences.studyDuration} minutes per session</div>
                      <div>Frequency: {preferences.studyDaysPerWeek} days per week</div>
                      <div>Time Slots: {preferences.learningTimes.length} selected</div>
                      <div>Learning Styles: {preferences.learningStyles.length} selected</div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-800">Ready to Generate</h4>
                      <p className="text-sm text-blue-700">
                        We'll create approximately {preferences.selectedCourses.length * Math.ceil(preferences.studyDaysPerWeek / preferences.selectedCourses.length)} 
                        study sessions based on your preferences.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Wizard Navigation */}
          <div className="flex justify-between items-center p-6 border-t border-gray-200">
            <button
              onClick={() => setWizardStep(prev => Math.max(WIZARD_STEPS.WELCOME, prev - 1))}
              disabled={wizardStep === WIZARD_STEPS.WELCOME}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <div className="flex space-x-2">
              {Object.values(WIZARD_STEPS).slice(0, -1).map((step, index) => (
                <div
                  key={step}
                  className={`w-2 h-2 rounded-full ${
                    index <= wizardStep ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            {wizardStep < WIZARD_STEPS.REVIEW ? (
              <button
                onClick={() => {
                  setError(null);
                  setWizardStep(prev => prev + 1);
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Next
              </button>
            ) : (
              <button
                onClick={generateSchedule}
                className="px-8 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
              >
                <Zap className="w-4 h-4" />
                <span>Generate Schedule</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderScheduleView = () => {
    if (generatedSchedule.length === 0) {
      return (
        <div className="text-center py-16">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Schedule Created Yet</h3>
          <p className="text-gray-600 mb-6">Create your first study schedule to get started</p>
          <button
            onClick={() => setIsWizardOpen(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create Schedule
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Schedule Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">My Study Schedule</h2>
            <p className="text-gray-600">
              {scheduleStats.totalSessions} sessions • {scheduleStats.completionRate}% complete
              {lastSaveTime && (
                <span className="ml-2 text-sm">
                  • Last saved {lastSaveTime.toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Save Button */}
            <button
              onClick={saveScheduleToBackend}
              disabled={isSaving}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save'}</span>
            </button>

            {/* Quick Actions */}
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>

            <button
              onClick={() => setIsWizardOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Regenerate</span>
            </button>
          </div>
        </div>

        {/* View Controls */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            {['all', 'high', 'normal', 'completed', 'pending'].map(filter => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${
                  selectedFilter === filter 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            {[
              { mode: SCHEDULE_VIEWS.LIST, icon: List, label: 'List' },
              { mode: SCHEDULE_VIEWS.CALENDAR, icon: Calendar, label: 'Calendar' },
              { mode: SCHEDULE_VIEWS.GRID, icon: Grid, label: 'Grid' }
            ].map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                onClick={() => setCurrentView(mode)}
                className={`p-2 rounded-md ${
                  currentView === mode 
                    ? 'bg-blue-500 text-white shadow-sm' 
                    : 'hover:bg-gray-100 text-gray-600 hover:text-blue-600'
                } transition-colors duration-200`}
                title={label}
              >
                <Icon className="w-5 h-5" />
              </button>
            ))}
          </div>
        </div>

        {/* Schedule Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {currentView === SCHEDULE_VIEWS.LIST && (
            <div className="p-6">
              <div className="space-y-4">
                {filteredSchedule.map(session => {
                  const course = availableCourses.find(c => c.id === session.courseId);
                  return (
                    <SessionCard
                      key={session.id}
                      session={session}
                      course={course}
                      onEdit={handleEditSession}
                      onDelete={handleDeleteSession}
                      onComplete={handleSessionCompletion}
                      isBulkMode={isBulkEditMode}
                      isSelected={selectedSessions.has(session.id)}
                      onSelect={(id) => {
                        const newSelected = new Set(selectedSessions);
                        if (newSelected.has(id)) {
                          newSelected.delete(id);
                        } else {
                          newSelected.add(id);
                        }
                        setSelectedSessions(newSelected);
                      }}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {currentView === SCHEDULE_VIEWS.CALENDAR && (
            <div className="p-6">
              <div className="text-center py-8 text-gray-600">
                <Calendar className="w-12 h-12 mx-auto mb-4" />
                <p>Calendar view will be implemented here</p>
              </div>
            </div>
          )}

          {currentView === SCHEDULE_VIEWS.GRID && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSchedule.map(session => {
                  const course = availableCourses.find(c => c.id === session.courseId);
                  return (
                    <div 
                      key={session.id}
                      className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200"
                      style={{ borderLeftColor: session.courseColor, borderLeftWidth: '4px' }}
                    >
                      <h4 className="font-semibold text-gray-800 mb-2">{session.courseName}</h4>
                      <p className="text-sm text-gray-600 mb-3">{session.activity}</p>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{session.timeSlot}</span>
                        <span>{session.duration}min</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ==================== MAIN RENDER ====================
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Study Scheduler</h1>
              {generatedSchedule.length > 0 && (
                <span className="flex items-center text-sm text-gray-600">
                  <span className="w-2.5 h-2.5 bg-green-500 rounded-full mr-2"></span>
                  {scheduleStats.totalSessions} active sessions
                </span>
              )}
              {notification && (
                <NotificationBar 
                  message={notification.message}
                  type={notification.type}
                  onClose={() => setNotification(null)}
                />
              )}
            </div>

            <div className="flex items-center space-x-4">
              {/* Navigation Pills */}
              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setCurrentView(SCHEDULE_VIEWS.DASHBOARD)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    currentView === SCHEDULE_VIEWS.DASHBOARD
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Dashboard
                </button>
                {generatedSchedule.length > 0 && (
                  <button
                    onClick={() => setCurrentView(SCHEDULE_VIEWS.CALENDAR)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      currentView !== SCHEDULE_VIEWS.DASHBOARD
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Schedule
                  </button>
                )}
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search sessions..." 
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-48"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === SCHEDULE_VIEWS.DASHBOARD ? renderDashboard() : renderScheduleView()}
      </div>

      {/* Loading Overlay */}
      {isLoading && <LoadingSpinner message="AI is creating your perfect study schedule..." />}

      {/* Wizard Modal */}
      {renderScheduleWizard()}

      {/* Edit Session Modal */}
      {isEditMode && editingSession && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Edit Study Session</h3>
              <button 
                onClick={() => setIsEditMode(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Course Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
                <select 
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editingSession.courseId}
                  onChange={(e) => {
                    const selectedCourse = availableCourses.find(c => c.id === e.target.value);
                    setEditingSession(prev => ({ 
                      ...prev, 
                      courseId: e.target.value,
                      courseName: selectedCourse?.name || selectedCourse?.title || 'Unnamed Course',
                      courseCode: selectedCourse?.code || '',
                      creditHours: selectedCourse?.creditHours || 3,
                      courseColor: COURSE_COLORS[availableCourses.findIndex(c => c.id === e.target.value) % COURSE_COLORS.length]
                    }));
                  }}
                >
                  {availableCourses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.name || course.title} ({course.creditHours || 3} credits)
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input 
                  type="date"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editingSession.fullDate.toISOString().split('T')[0]}
                  onChange={(e) => setEditingSession(prev => ({ 
                    ...prev, 
                    fullDate: new Date(e.target.value),
                    day: new Date(e.target.value).getDay() === 0 ? 7 : new Date(e.target.value).getDay()
                  }))}
                />
              </div>

              {/* Time Slot */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time Slot</label>
                <select 
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editingSession.timeSlot}
                  onChange={(e) => setEditingSession(prev => ({ ...prev, timeSlot: e.target.value }))}
                >
                  {TIME_SLOTS.map(slot => (
                    <option key={slot.id} value={slot.time}>
                      {slot.label} ({slot.time})
                    </option>
                  ))}
                </select>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
                <input 
                  type="number"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editingSession.duration}
                  onChange={(e) => setEditingSession(prev => ({ 
                    ...prev, 
                    duration: parseInt(e.target.value) || 60
                  }))}
                  min="15"
                  step="15"
                />
              </div>

              {/* Activity Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Activity Description</label>
                <textarea
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editingSession.activity}
                  onChange={(e) => setEditingSession(prev => ({ ...prev, activity: e.target.value }))}
                  rows="3"
                  placeholder="Describe what you'll be doing in this study session..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => setIsEditMode(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateSession(editingSession)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Export Schedule</h3>
              <button 
                onClick={() => setIsExportModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { format: 'json', icon: FileText, label: 'JSON' },
                    { format: 'csv', icon: FileText, label: 'CSV' },
                    { format: 'ical', icon: Calendar, label: 'iCal' }
                  ].map(({ format, icon: Icon, label }) => (
                    <button
                      key={format}
                      onClick={() => setExportFormat(format)}
                      className={`p-3 border rounded-lg flex flex-col items-center space-y-2 transition-all duration-200 ${
                        exportFormat === format 
                          ? 'border-blue-500 bg-blue-50 text-blue-700' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                      <span className="text-sm font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setIsExportModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={exportSchedule}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedule;
