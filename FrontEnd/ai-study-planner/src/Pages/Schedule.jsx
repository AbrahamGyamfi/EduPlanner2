import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
// Remove date-fns import and replace with native JavaScript date formatting
// import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import Sidebar from '../components/sidebar';
// import PageHeader from '../components/PageHeader';
import Navbar from '../components/PageHead';
import { 
  Calendar,
  Clock,
  Brain,
  Settings,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Plus,
  Battery,
  Sun,
  Sunset,
  Moon,
  Undo,
  BookOpen,
  Coffee
} from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';

// Predefined preference templates
const PREFERENCE_TEMPLATES = {
  balanced: {
    name: 'Balanced',
    icon: <BookOpen className="w-4 h-4" />,
    preferences: {
      preferredStudyTime: 'morning',
      maxDailyHours: 6,
      studySessionLength: 45,
      breakDuration: 15,
      weekendStudy: true,
      energyLevels: {
        morning: 8,
        afternoon: 7,
        evening: 6
      }
    }
  },
  intensive: {
    name: 'Intensive',
    icon: <Brain className="w-4 h-4" />,
    preferences: {
      preferredStudyTime: 'morning',
      maxDailyHours: 8,
      studySessionLength: 60,
      breakDuration: 10,
      weekendStudy: true,
      energyLevels: {
        morning: 9,
        afternoon: 8,
        evening: 7
      }
    }
  },
  relaxed: {
    name: 'Relaxed',
    icon: <Coffee className="w-4 h-4" />,
    preferences: {
      preferredStudyTime: 'afternoon',
      maxDailyHours: 4,
      studySessionLength: 30,
      breakDuration: 20,
      weekendStudy: false,
      energyLevels: {
        morning: 6,
        afternoon: 8,
        evening: 5
      }
    }
  }
};

const Schedule = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  
  // Get courses from localStorage with better validation
  const [courses, setCourses] = useState(() => {
    try {
      setIsLoading(true);
      const savedCourses = localStorage.getItem('courses');
      if (!savedCourses) {
        toast.error('No courses found. Please add courses in the Courses page.');
        return [];
      }
      const parsedCourses = JSON.parse(savedCourses);
      if (!Array.isArray(parsedCourses)) {
        console.error('Invalid courses data format');
        toast.error('Error loading courses. Please try refreshing the page.');
        return [];
      }
      
      // Filter only valid, ongoing courses
      const validCourses = parsedCourses.filter(course => 
        course &&
        course.id &&
        course.name &&
        typeof course.creditHours === 'number' &&
        course.status === 'ongoing'
      );
      
      if (validCourses.length === 0) {
        if (parsedCourses.length > 0) {
          toast.error('No ongoing courses found. Please mark at least one course as ongoing in the Courses page.');
        } else {
          toast.error('No courses found. Please add courses in the Courses page.');
        }
      } else {
        toast.success(`Found ${validCourses.length} ongoing courses`);
      }
      
      return validCourses;
    } catch (error) {
      console.error('Error loading courses:', error);
      toast.error('Error loading courses. Please try refreshing the page.');
      return [];
    } finally {
      setIsLoading(false);
    }
  });

  // Watch for changes in courses from other components
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'courses') {
        try {
          setIsLoading(true);
          const updatedCourses = JSON.parse(e.newValue);
          if (Array.isArray(updatedCourses)) {
            // Filter only valid, ongoing courses when updating
            const validCourses = updatedCourses.filter(course => 
              course &&
              course.id &&
              course.name &&
              typeof course.creditHours === 'number' &&
              course.status === 'ongoing'
            );
            setCourses(validCourses);
            
            if (validCourses.length === 0) {
              if (updatedCourses.length > 0) {
                toast.error('No ongoing courses found. Please mark at least one course as ongoing in the Courses page.');
              } else {
                toast.error('No courses found. Please add courses in the Courses page.');
              }
            } else {
              toast.success(`Found ${validCourses.length} ongoing courses`);
            }
          }
        } catch (error) {
          console.error('Error parsing updated courses:', error);
          toast.error('Error updating courses. Please try refreshing the page.');
        } finally {
          setIsLoading(false);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // State variables for task management
  const [tasks, setTasks] = useState(() => {
    const savedTasks = localStorage.getItem('scheduledTasks');
    return savedTasks ? JSON.parse(savedTasks) : [];
  });
  const [newTask, setNewTask] = useState({
    id: Date.now(),
    title: '',
    course: '',
    description: '',
    scheduledDate: new Date().toISOString(),
    duration: 60, // minutes
    priority: 'medium'
  });
  const [showForm, setShowForm] = useState(false);
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [viewMode, setViewMode] = useState('week'); // 'day', 'week', or 'month'
  
  // Calculate the current week's days for the calendar view
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const start = getStartOfWeek(new Date());
    const day = new Date(start);
    day.setDate(day.getDate() + i);
    return day;
  });

  // Native JS implementation of date-fns functions
  function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay(); // 0 is Sunday, 1 is Monday
    // Set to Monday of the current week
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d;
  }

  function isSameDay(date1, date2) {
    return date1.getDate() === date2.getDate() && 
           date1.getMonth() === date2.getMonth() && 
           date1.getFullYear() === date2.getFullYear();
  }

  function formatDate(date, format) {
    const d = new Date(date);
    
    // Format month names
    if (format.includes('MMMM')) {
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", 
                         "August", "September", "October", "November", "December"];
      format = format.replace('MMMM', monthNames[d.getMonth()]);
    }
    
    // Format day of week
    if (format.includes('EEEE')) {
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      format = format.replace('EEEE', dayNames[d.getDay()]);
    }
    
    // Format short day of week
    if (format.includes('EEE')) {
      const shortDayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      format = format.replace('EEE', shortDayNames[d.getDay()]);
    }
    
    // Format year
    if (format.includes('yyyy')) {
      format = format.replace('yyyy', d.getFullYear());
    }
    
    // Format day of month
    if (format.includes('d')) {
      format = format.replace('d', d.getDate());
    }
    
    return format;
  }

  // Format time from date string
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    return `${hours}:${minutes} ${ampm}`;
  };
  
  // Calculate task statistics with more robust error checking
  const getTaskStats = () => {
    try {
      if (!Array.isArray(tasks)) {
        return { total: 0, completed: 0, high: 0, completionRate: 0 };
      }
      
      const total = tasks.length;
      // Handle missing 'completed' property safely
      const completed = tasks.filter(task => task && task.completed === true).length;
      // Handle missing 'priority' property safely
      const high = tasks.filter(task => task && task.priority === 'high').length;
      
      return {
        total,
        completed,
        high,
        completionRate: total ? Math.round((completed / total) * 100) : 0
      };
    } catch (error) {
      console.error("Error calculating task stats:", error);
      return { total: 0, completed: 0, high: 0, completionRate: 0 };
    }
  };

  // Save tasks to localStorage when they change
  useEffect(() => {
    // Add try-catch to handle potential localStorage errors
    try {
      localStorage.setItem('scheduledTasks', JSON.stringify(tasks));
    } catch (error) {
      console.error("Error saving tasks to localStorage:", error);
    }
  }, [tasks]);

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTask(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Create a notification when task is added
  const createTaskNotification = (task) => {
    try {
      // Get existing activities
      const savedActivities = localStorage.getItem('userActivities');
      const activities = savedActivities ? JSON.parse(savedActivities) : [];
      
      // Create new notification
      const newActivity = {
        id: Date.now(),
        type: "task_created",
        message: `New task scheduled: ${task.title}`,
        timestamp: new Date().toISOString(),
        read: false
      };
      
      // Add to activities
      const updatedActivities = [newActivity, ...activities];
      localStorage.setItem('userActivities', JSON.stringify(updatedActivities));
    } catch (error) {
      console.error("Error creating notification:", error);
    }
  };

  // Handle task creation with improved Dashboard sync
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Create the new task
    const taskToAdd = {
      ...newTask,
      // Ensure we have all required properties that Dashboard expects
      id: Date.now(),
      // If course field is empty, set it to "General" for better display
      course: newTask.course || "General" 
    };
    
    // Add to tasks state
    setTasks(prevTasks => {
      const updatedTasks = [...prevTasks, taskToAdd];
      
      // Save to localStorage for Dashboard to access
      localStorage.setItem('scheduledTasks', JSON.stringify(updatedTasks));
      
      // Create notification about new task
      createTaskNotification(taskToAdd);
      
      return updatedTasks;
    });
    
    // Reset form
    setNewTask({
      id: Date.now() + 1, // Ensure unique ID
      title: '',
      course: '',
      description: '',
      scheduledDate: new Date().toISOString(),
      duration: 60,
      priority: 'medium'
    });
    setShowForm(false);
  };
  
  // Get tasks for selected day
  const getTasksForDay = (day) => {
    return tasks.filter(task => {
      const taskDate = new Date(task.scheduledDate);
      return isSameDay(taskDate, day);
    });
  };

  // Delete a task with Dashboard sync
  const handleDeleteTask = (taskId) => {
    setTasks(prevTasks => {
      const updatedTasks = prevTasks.filter(task => task.id !== taskId);
      
      // Update localStorage to reflect deletion for Dashboard
      localStorage.setItem('scheduledTasks', JSON.stringify(updatedTasks));
      
      return updatedTasks;
    });
  };

  // Helper function to group tasks by hour for day view
  const getTasksByHour = () => {
    try {
      const tasksForDay = getTasksForDay(selectedDay);
      const groupedTasks = {};
      
      // Initialize hours (8 AM to 9 PM)
      for (let i = 8; i <= 21; i++) {
        groupedTasks[i] = [];
      }
      
      // Safely group tasks by start hour
      if (Array.isArray(tasksForDay)) {
        tasksForDay.forEach(task => {
          try {
            if (task && task.scheduledDate) {
              const taskDate = new Date(task.scheduledDate);
              const hour = taskDate.getHours();
              
              // Only add to hours we're displaying
              if (hour >= 8 && hour <= 21) {
                groupedTasks[hour].push(task);
              }
            }
          } catch (err) {
            console.error("Error processing task in getTasksByHour:", err);
          }
        });
      }
      
      return groupedTasks;
    } catch (error) {
      console.error("Error in getTasksByHour:", error);
      // Return empty default object
      const emptyGroups = {};
      for (let i = 8; i <= 21; i++) {
        emptyGroups[i] = [];
      }
      return emptyGroups;
    }
  };

  // State for user preferences with validation
  const [preferences, setPreferences] = useState(() => {
    try {
      const savedPrefs = localStorage.getItem('studyPreferences');
      return savedPrefs ? JSON.parse(savedPrefs) : {
        preferredStudyTime: 'morning',
        maxDailyHours: 4,
        studySessionLength: 45,
        breakDuration: 15,
        weekendStudy: true,
        energyLevels: {
          morning: 8,
          afternoon: 6,
          evening: 4
        }
      };
    } catch (error) {
      console.error('Error loading preferences:', error);
      return {
        preferredStudyTime: 'morning',
        maxDailyHours: 4,
        studySessionLength: 45,
        breakDuration: 15,
        weekendStudy: true,
        energyLevels: {
          morning: 8,
          afternoon: 6,
          evening: 4
        }
      };
    }
  });

  // Generated schedule state
  const [schedule, setSchedule] = useState(() => {
    try {
      const saved = localStorage.getItem('generatedSchedule');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading schedule:', error);
      return [];
    }
  });

  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [error, setError] = useState(null);

  // Add new state for preferences history and unsaved changes
  const [preferencesHistory, setPreferencesHistory] = useState([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [activeSection, setActiveSection] = useState('time');

  // Enhanced error handling for preference changes
  const handlePreferenceChange = useCallback((key, value) => {
    try {
      setHasUnsavedChanges(true);
      if (key.includes('.')) {
        const [parent, child] = key.split('.');
        setPreferences(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value
          }
        }));
      } else {
        setPreferences(prev => ({
          ...prev,
          [key]: value
        }));
      }
    } catch (error) {
      console.error('Error updating preference:', error);
      toast.error('Failed to update preference');
    }
  }, []);

  // Safe template application
  const applyTemplate = useCallback((template) => {
    try {
      if (!PREFERENCE_TEMPLATES[template]) {
        throw new Error('Invalid template selected');
      }

      if (hasUnsavedChanges) {
        if (!window.confirm('You have unsaved changes. Apply template anyway?')) {
          return;
        }
      }

      setPreferences(PREFERENCE_TEMPLATES[template].preferences);
      setHasUnsavedChanges(true);
      toast.success(`Applied ${PREFERENCE_TEMPLATES[template].name} template`);
    } catch (error) {
      console.error('Error applying template:', error);
      toast.error(error.message || 'Failed to apply template');
    }
  }, [hasUnsavedChanges]);

  // Save preferences with validation and history
  const savePreferences = useCallback(() => {
    try {
      // Validate preferences before saving
      if (preferences.maxDailyHours < 1 || preferences.maxDailyHours > 12) {
        throw new Error('Daily study hours must be between 1 and 12');
      }
      if (preferences.studySessionLength < 15 || preferences.studySessionLength > 120) {
        throw new Error('Study session length must be between 15 and 120 minutes');
      }

      // Save current preferences to history
      setPreferencesHistory(prev => [preferences, ...prev.slice(0, 9)]);
      
      // Save to localStorage
      localStorage.setItem('studyPreferences', JSON.stringify(preferences));
      
      setHasUnsavedChanges(false);
      toast.success('Preferences saved successfully');
      setShowPreferences(false);
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error(error.message || 'Failed to save preferences');
    }
  }, [preferences]);

  // Undo last preference change
  const undoPreferenceChange = useCallback(() => {
    try {
      if (preferencesHistory.length > 0) {
        const [lastPreferences, ...remainingHistory] = preferencesHistory;
        setPreferences(lastPreferences);
        setPreferencesHistory(remainingHistory);
        toast.success('Last change undone');
      }
    } catch (error) {
      console.error('Error undoing change:', error);
      toast.error('Failed to undo last change');
    }
  }, [preferencesHistory]);

  // Save schedule with error handling
  const saveSchedule = useCallback((newSchedule) => {
    try {
      if (!Array.isArray(newSchedule)) {
        throw new Error('Invalid schedule format');
      }
      
      localStorage.setItem('generatedSchedule', JSON.stringify(newSchedule));
      setSchedule(newSchedule);
      setError(null);
      toast.success('Schedule saved successfully');
    } catch (error) {
      console.error('Error saving schedule:', error);
      setError('Failed to save schedule. Please try again.');
      toast.error('Failed to save schedule');
    }
  }, []);

  // Enhanced schedule generation with better validation
  const generateOptimalSchedule = useCallback(() => {
    try {
      setIsGenerating(true);
      setError(null);

      // Get courses from localStorage with detailed validation
      const savedCourses = localStorage.getItem('courses');
      if (!savedCourses) {
        throw new Error('No courses found. Please add some courses in the Courses page.');
      }

      let parsedCourses;
      try {
        parsedCourses = JSON.parse(savedCourses);
      } catch (e) {
        throw new Error('Error reading courses data. Please try refreshing the page.');
      }

      if (!Array.isArray(parsedCourses)) {
        throw new Error('Invalid courses data format. Please try refreshing the page.');
      }

      if (parsedCourses.length === 0) {
        throw new Error('No courses found. Please add some courses in the Courses page.');
      }

      // Get ongoing courses with detailed validation
      const ongoingCourses = parsedCourses.filter(course => {
        const isValid = course && 
          course.id && 
          course.name && 
          typeof course.creditHours === 'number' &&
          course.status === 'ongoing';

        if (!isValid && course) {
          console.log('Invalid course:', course);
        }
        return isValid;
      });

      if (ongoingCourses.length === 0) {
        // Check if there are any courses but none are ongoing
        const hasCompletedCourses = parsedCourses.some(course => course.status === 'completed');
        if (hasCompletedCourses) {
          throw new Error('All courses are marked as completed. Please set at least one course as ongoing in the Courses page.');
        } else {
          throw new Error('No ongoing courses found. Please ensure your courses are marked as "ongoing" in the Courses page.');
        }
      }

      // Log successful course loading
      console.log(`Found ${ongoingCourses.length} ongoing courses for scheduling.`);

      // Continue with schedule generation...
      const prioritizedCourses = [...ongoingCourses].sort((a, b) => {
        const getPriorityScore = (course) => {
          const creditWeight = course.creditHours || 3;
          const progressWeight = 1 - ((course.progress || 0) / 100);
          const statusBoost = 1.5;
          return creditWeight * progressWeight * statusBoost;
        };
        return getPriorityScore(b) - getPriorityScore(a);
      });

      // Generate schedule for next 7 days
      const startDate = new Date();
      const newSchedule = [];

      for (let day = 0; day < 7; day++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + day);
        
        // Skip if weekend and weekendStudy is false
        const isWeekend = [0, 6].includes(currentDate.getDay());
        if (isWeekend && !preferences.weekendStudy) continue;

        // Get energy level for different times of day
        const energyLevels = [
          { time: 'morning', start: 9, energy: preferences.energyLevels.morning },
          { time: 'afternoon', start: 13, energy: preferences.energyLevels.afternoon },
          { time: 'evening', start: 17, energy: preferences.energyLevels.evening }
        ].sort((a, b) => b.energy - a.energy); // Sort by energy level

        let remainingHours = preferences.maxDailyHours;
        const daySchedule = [];

        // Distribute courses based on energy levels
        for (const slot of energyLevels) {
          if (remainingHours <= 0) break;

          // Filter out courses already scheduled for this day
          const availableCourses = prioritizedCourses.filter(course => 
            !daySchedule.find(s => s.courseId === course.id)
          );

          if (availableCourses.length === 0) break;

          const sessionHours = Math.min(
            remainingHours,
            preferences.studySessionLength / 60
          );

          const courseForSlot = availableCourses[0];

          if (courseForSlot) {
            daySchedule.push({
              id: `${courseForSlot.id}-${Date.now()}-${Math.random()}`,
              courseId: courseForSlot.id,
              courseName: courseForSlot.name,
              creditHours: courseForSlot.creditHours,
              category: courseForSlot.category,
              progress: courseForSlot.progress || 0,
              startTime: slot.start,
              duration: Math.round(sessionHours * 60),
              date: currentDate.toISOString(),
              energyLevel: slot.energy,
              completed: false
            });

            remainingHours -= sessionHours;

            // Add break if not the last session and there's time
            if (remainingHours > 0 && preferences.breakDuration > 0) {
              remainingHours -= preferences.breakDuration / 60;
            }
          }
        }

        newSchedule.push(...daySchedule);
      }

      if (newSchedule.length === 0) {
        throw new Error('Could not generate a schedule. Please check your preferences and try again.');
      }

      saveSchedule(newSchedule);
      toast.success('Schedule generated successfully!');
    } catch (error) {
      console.error('Error generating schedule:', error);
      setError(error.message);
      toast.error(error.message);
    } finally {
      setIsGenerating(false);
    }
  }, [preferences, saveSchedule]);

  // Format time for display
  const formatTimeForDisplay = (hours) => {
    const hour = Math.floor(hours);
    const minute = Math.round((hours - hour) * 60);
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  // Format date for display
  const formatDateForDisplay = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
  };

  // Mark study session as completed
  const markSessionCompleted = (sessionId) => {
    try {
      const newSchedule = schedule.map(session => 
        session.id === sessionId 
          ? { ...session, completed: !session.completed }
          : session
      );
      saveSchedule(newSchedule);
    } catch (error) {
      console.error('Error marking session as completed:', error);
      setError('Failed to update session status. Please try again.');
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f7f9fc]">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#363636',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          },
          success: {
            iconTheme: {
              primary: '#22C55E',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <Sidebar activePage="schedule" />
      <div className="flex-1 p-8">
        <div className="mb-8">
          <Navbar pageTitle="Study Schedule" />
        </div>

        <div className="max-w-7xl mx-auto space-y-6">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                {error.includes('No ongoing courses') && (
                  <button
                    onClick={() => navigate('/courses')}
                    className="mt-2 text-sm font-medium text-red-600 hover:text-red-800 flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Go to Courses Page
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => setShowPreferences(!showPreferences)}
                  className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Preferences
                </button>
                <button 
                  onClick={generateOptimalSchedule}
                  disabled={isGenerating || isLoading}
                  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : isLoading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Brain className="w-4 h-4 mr-2" />
                  )}
                  {isGenerating ? 'Generating...' : isLoading ? 'Loading Courses...' : 'Generate Schedule'}
                </button>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>Last updated: {new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
          
          {/* Loading State */}
          {isLoading && (
            <div className="bg-white rounded-xl p-8 mt-4 text-center">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Loading Courses</h3>
              <p className="text-gray-500 mt-2">Please wait while we load your courses...</p>
            </div>
          )}

          {/* No Courses State */}
          {!isLoading && courses.length === 0 && (
            <div className="bg-white rounded-xl p-8 mt-4 text-center">
              <AlertCircle className="w-8 h-8 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No Ongoing Courses</h3>
              <p className="text-gray-500 mt-2">
                {localStorage.getItem('courses') ? 
                  'You have courses, but none are marked as ongoing. Please mark at least one course as ongoing in the Courses page.' :
                  'You haven\'t added any courses yet. Add some courses to generate a schedule.'}
              </p>
              <button
                onClick={() => navigate('/courses')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Go to Courses Page
              </button>
            </div>
          )}

          {/* Preferences Panel */}
          {showPreferences && (
            <div className="mt-6 border-t pt-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Settings className="w-5 h-5 mr-2 text-gray-600" />
                  Study Preferences
                </h3>
                <div className="flex items-center space-x-4">
                  {/* Templates Dropdown */}
                  <div className="relative">
                    <select
                      onChange={(e) => applyTemplate(e.target.value)}
                      className="appearance-none bg-white border rounded-lg px-4 py-2 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      defaultValue=""
                    >
                      <option value="" disabled>Apply Template</option>
                      {Object.entries(PREFERENCE_TEMPLATES).map(([key, template]) => (
                        <option key={key} value={key}>{template.name}</option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Undo Button */}
                  <button 
                    onClick={() => {
                      if (hasUnsavedChanges) {
                        if (window.confirm('Discard unsaved changes?')) {
                          setShowPreferences(false);
                        }
                      } else {
                        setShowPreferences(false);
                      }
                    }}
                    className={`p-2 rounded-lg transition-colors ${
                      hasUnsavedChanges
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    title="Undo last change"
                  >
                    <Undo className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Section Navigation */}
              <div className="flex space-x-2 mb-6">
                {[
                  { id: 'time', icon: <Clock className="w-4 h-4" />, label: 'Time' },
                  { id: 'load', icon: <Brain className="w-4 h-4" />, label: 'Study Load' },
                  { id: 'energy', icon: <Battery className="w-4 h-4" />, label: 'Energy' }
                ].map(section => (
                  <button 
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      activeSection === section.id
                        ? 'bg-blue-600 text-white shadow-md transform scale-105'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <span className="mr-2">{section.icon}</span>
                    {section.label}
                  </button>
                ))}
              </div>
              
              <div className="space-y-8">
                {/* Time Preferences Section */}
                <div className={`transition-opacity duration-300 ${activeSection === 'time' ? 'opacity-100' : 'opacity-0 hidden'}`}>
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-blue-600" />
                      Time Preferences
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Preferred Study Time */}
                      <div className="relative group">
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                          Preferred Study Time
                          <div className="ml-2 relative">
                            <div className="group-hover:opacity-100 opacity-0 transition-opacity absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                              Choose your most productive time of day
                            </div>
                          </div>
                        </label>
                        <div className="flex space-x-2">
                          {[
                            { time: 'morning', icon: <Sun className="w-4 h-4" /> },
                            { time: 'afternoon', icon: <Sunset className="w-4 h-4" /> },
                            { time: 'evening', icon: <Moon className="w-4 h-4" /> }
                          ].map(({ time, icon }) => (
                            <button 
                              key={time}
                              onClick={() => handlePreferenceChange('preferredStudyTime', time)}
                              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                                preferences.preferredStudyTime === time
                                  ? 'bg-blue-600 text-white shadow-md transform scale-105'
                                  : 'bg-white text-gray-600 hover:bg-gray-100'
                              }`}
                            >
                              {icon}
                              <span>{time.charAt(0).toUpperCase() + time.slice(1)}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Study Session Length */}
                      <div className="relative group">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Study Session Length
                          <span className="ml-1 text-sm text-gray-500">
                            ({preferences.studySessionLength} min)
                          </span>
                        </label>
                        <div 
                          className="relative"
                          onMouseDown={() => setIsDragging(true)}
                          onMouseUp={() => setIsDragging(false)}
                          onMouseLeave={() => setIsDragging(false)}
                        >
                          <input
                            type="range"
                            min="15"
                            max="120"
                            step="15"
                            value={preferences.studySessionLength}
                            onChange={(e) => handlePreferenceChange('studySessionLength', parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          />
                          <div 
                            className={`absolute left-0 top-0 h-2 bg-blue-600 rounded-l-lg transition-all duration-200 ${
                              isDragging ? 'opacity-50' : 'opacity-100'
                            }`}
                            style={{ width: `${(preferences.studySessionLength - 15) / (120 - 15) * 100}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>15m</span>
                          <span>1h</span>
                          <span>2h</span>
                        </div>
                      </div>
                      
                      {/* Break Duration */}
                      <div className="relative group">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Break Duration
                          <span className="ml-1 text-sm text-gray-500">
                            ({preferences.breakDuration} min)
                          </span>
                        </label>
                        <div className="relative">
                          <input
                            type="range"
                            min="5"
                            max="30"
                            step="5"
                            value={preferences.breakDuration}
                            onChange={(e) => handlePreferenceChange('breakDuration', parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          />
                          <div 
                            className="absolute left-0 top-0 h-2 bg-blue-600 rounded-l-lg transition-all duration-200"
                            style={{ width: `${(preferences.breakDuration - 5) / (30 - 5) * 100}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>5m</span>
                          <span>15m</span>
                          <span>30m</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Study Load Section */}
                <div className={`transition-opacity duration-300 ${activeSection === 'load' ? 'opacity-100' : 'opacity-0 hidden'}`}>
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                      <Brain className="w-4 h-4 mr-2 text-purple-600" />
                      Study Load
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Max Daily Hours */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Max Daily Study Hours
                          <span className="ml-1 text-sm text-gray-500">
                            ({preferences.maxDailyHours} hours)
                          </span>
                        </label>
                        <div className="flex items-center space-x-4">
                          <div className="relative flex-1">
                            <input
                              type="range"
                              min="1"
                              max="12"
                              value={preferences.maxDailyHours}
                              onChange={(e) => handlePreferenceChange('maxDailyHours', parseInt(e.target.value))}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                            />
                            <div 
                              className="absolute left-0 top-0 h-2 bg-purple-600 rounded-l-lg transition-all duration-200"
                              style={{ width: `${(preferences.maxDailyHours - 1) / (12 - 1) * 100}%` }}
                            />
                          </div>
                          <div className="w-16 px-3 py-1 bg-white border rounded-lg text-center text-sm">
                            {preferences.maxDailyHours}h
                          </div>
                        </div>
                      </div>
                      
                      {/* Weekend Study Toggle */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Weekend Study
                        </label>
                        <button
                          onClick={() => handlePreferenceChange('weekendStudy', !preferences.weekendStudy)}
                          className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                            preferences.weekendStudy
                              ? 'bg-purple-600 text-white transform scale-105'
                              : 'bg-white text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {preferences.weekendStudy ? '✓ Enabled' : '✗ Disabled'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Energy Levels Section */}
                <div className={`transition-opacity duration-300 ${activeSection === 'energy' ? 'opacity-100' : 'opacity-0 hidden'}`}>
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                      <Battery className="w-4 h-4 mr-2 text-green-600" />
                      Energy Levels
                    </h4>
                    <div className="space-y-6">
                      {Object.entries(preferences.energyLevels).map(([time, level]) => (
                        <div key={time} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <label className="text-sm font-medium text-gray-700 capitalize flex items-center">
                              {time === 'morning' && <Sun className="w-4 h-4 mr-2" />}
                              {time === 'afternoon' && <Sunset className="w-4 h-4 mr-2" />}
                              {time === 'evening' && <Moon className="w-4 h-4 mr-2" />}
                              {time}
                            </label>
                            <span className="text-sm text-gray-500">
                              Level: {level}/10
                            </span>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="relative flex-1">
                              <input
                                type="range"
                                min="1"
                                max="10"
                                value={level}
                                onChange={(e) => handlePreferenceChange(
                                  `energyLevels.${time}`,
                                  parseInt(e.target.value)
                                )}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                              />
                              <div 
                                className="absolute left-0 top-0 h-2 rounded-l-lg transition-all duration-200"
                                style={{
                                  width: `${(level - 1) / 9 * 100}%`,
                                  background: `linear-gradient(to right, #22C55E ${level * 10}%, #E5E7EB ${level * 10}%)`
                                }}
                              />
                            </div>
                            <div 
                              className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200"
                              style={{
                                backgroundColor: `rgba(34, 197, 94, ${level / 10})`,
                                color: level > 5 ? 'white' : 'black',
                                transform: `scale(${0.9 + (level / 20)})`
                              }}
                            >
                              {level}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Save/Cancel Buttons */}
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    {hasUnsavedChanges && (
                      <span className="flex items-center text-yellow-600">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        You have unsaved changes
                      </span>
                    )}
                  </div>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => {
                        if (hasUnsavedChanges) {
                          if (window.confirm('Discard unsaved changes?')) {
                            setShowPreferences(false);
                          }
                        } else {
                          setShowPreferences(false);
                        }
                      }}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={savePreferences}
                      disabled={!hasUnsavedChanges}
                      className={`px-6 py-2 rounded-lg text-white flex items-center transition-all duration-200 ${
                        hasUnsavedChanges
                          ? 'bg-blue-600 hover:bg-blue-700 transform hover:scale-105'
                          : 'bg-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Schedule Display */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-lg font-medium text-gray-900">Generated Schedule</h2>
          </div>
          <div className="divide-y">
            {schedule.length > 0 ? (
              schedule.map((session) => (
                <div 
                  key={session.id}
                  className={`p-6 transition-colors ${
                    session.completed ? 'bg-green-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <Calendar className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          {session.courseName}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {formatDateForDisplay(session.date)} at {formatTimeForDisplay(session.startTime)}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Duration: {session.duration} minutes • Energy Level: {session.energyLevel}/10
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => markSessionCompleted(session.id)}
                      className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        session.completed
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      {session.completed ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Completed
                        </>
                      ) : (
                        'Mark Complete'
                      )}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Schedule Generated
                </h3>
                <p className="text-gray-500">
                  {courses.length === 0 
                    ? "Add some courses first, then generate your study schedule."
                    : "Click the 'Generate Schedule' button to create your personalized study plan."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Schedule;
