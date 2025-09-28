import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Zap, BookOpen, Clock, Brain, X, Loader, FileText, Calendar, Check, Search, List, Grid, Settings, TrendingUp, Target, Hourglass, Book, MoreHorizontal, Download, Edit2, Trash2, GripVertical, Save } from "lucide-react";
import { API_BASE_URL } from '../config/api';

const Schedule = () => {
  const [currentStep, setCurrentStep] = useState(0); // 0: overview, 1: courses, 2: times, 3: styles, 4: generated
  const [preferences, setPreferences] = useState({
    selectedCourses: [],
    studyDuration: 60,
    studyDaysPerWeek: 5,
    learningTimes: [],
    learningStyles: [],
  });
  const [availableCourses, setAvailableCourses] = useState([]);
  const [generatedSchedule, setGeneratedSchedule] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('all'); // New state for filters
  const [viewMode, setViewMode] = useState('list'); // Changed default view mode to 'list'
  const [currentDate, setCurrentDate] = useState(new Date()); // State for current date for calendar navigation
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState('json');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [selectedSessions, setSelectedSessions] = useState(new Set());
  const [isBulkEditMode, setIsBulkEditMode] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [assignmentScheduleMode, setAssignmentScheduleMode] = useState(false);
  const [selectedAssignments, setSelectedAssignments] = useState([]);
  const [showQuickAssignmentModal, setShowQuickAssignmentModal] = useState(false);
  const [quickAssignmentData, setQuickAssignmentData] = useState({
    title: '',
    description: '',
    dueDate: '',
    courseId: ''
  });

  // Define colors for course cards
  const courseColors = ['#EF4444', '#3B82F6', '#22C55E', '#F97316', '#A855F7', '#06B6D4'];

  // Define timeSlots and learningStyles here so they are accessible for mapping
  const timeSlots = [
    { id: 'early-morning', label: 'Early Morning', time: '6:00 - 8:00 AM', icon: '🌅' },
    { id: 'morning', label: 'Morning', time: '8:00 - 12:00 PM', icon: '☀️' },
    { id: 'afternoon', label: 'Afternoon', time: '12:00 - 5:00 PM', icon: '🌤️' },
    { id: 'evening', label: 'Evening', time: '5:00 - 8:00 PM', icon: '🌆' },
    { id: 'night', label: 'Night', time: '8:00 - 11:00 PM', icon: '🌙' },
  ];

  const learningStyles = [
    { id: 'visual', label: 'Visual', description: 'Learn through diagrams and visual aids', icon: '👁️' },
    { id: 'auditory', label: 'Auditory', description: 'Learn through listening', icon: '🎧' },
    { id: 'kinesthetic', label: 'Hands-on', description: 'Learn through practice', icon: '🖐️' },
    { id: 'reading-writing', label: 'Reading/Writing', description: 'Learn through text', icon: '📖' },
    { id: 'group-study', label: 'Group Study', description: 'Learn with others', icon: '👥' },
    { id: 'problem-solving', label: 'Problem Solving', description: 'Learn through reasoning', icon: '🎯' },
  ];

  // Load saved schedule and preferences on component mount
  useEffect(() => {
    loadSavedSchedule();
    loadSavedPreferences();
  }, []);

    // Load available courses from localStorage
  useEffect(() => {
    const savedCourses = localStorage.getItem('courses');
    if (savedCourses) {
      try {
        setAvailableCourses(JSON.parse(savedCourses));
      } catch (e) {
        console.error("Failed to parse courses from localStorage", e);
        setAvailableCourses([]);
      }
    }
  }, []);

  // Load assignments from backend
  useEffect(() => {
    const loadAssignments = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/assignments`);
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

    loadAssignments();
  }, []);

  // Save schedule to localStorage whenever it changes
  useEffect(() => {
    if (generatedSchedule.length > 0) {
      localStorage.setItem('study_schedule', JSON.stringify(generatedSchedule));
    }
  }, [generatedSchedule]);

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('schedule_preferences', JSON.stringify(preferences));
  }, [preferences]);

  const loadSavedSchedule = () => {
    try {
      const savedSchedule = localStorage.getItem('study_schedule');
      if (savedSchedule) {
        const parsedSchedule = JSON.parse(savedSchedule);
        // Convert date strings back to Date objects and ensure all sessions have IDs
        const scheduleWithDates = parsedSchedule.map(session => ({
          ...session,
          fullDate: new Date(session.fullDate),
          id: session.id || generateSessionId() // Ensure each session has an ID
        }));
        setGeneratedSchedule(scheduleWithDates);
        if (scheduleWithDates.length > 0) {
          setCurrentStep(4); // Show the generated schedule
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

  const saveScheduleToBackend = async () => {
    setIsSaving(true);
    setSaveMessage('');
    
    try {
      const userId = localStorage.getItem('userId') || 'default-user';
      
      // Convert frontend schedule format to backend format
      const backendSchedule = generatedSchedule.map(session => {
        // Map day number to day name
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayName = session.fullDate ? dayNames[session.fullDate.getDay()] : 'monday';
        
        // Extract time from timeSlot (e.g., "9:00 - 11:00 AM" -> "09:00-11:00")
        let timeString = '09:00-11:00'; // default
        if (session.timeSlot) {
          const timeMatch = session.timeSlot.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/i);
          if (timeMatch) {
            timeString = `${timeMatch[1]}-${timeMatch[2]}`;
          }
        }
        
        return {
          id: session.id,
          day: dayName,
          time: timeString,
          subject: session.courseName || 'Study Session',
          type: session.learningStyle || 'study',
          location: 'Study Area',
          notes: session.activity || 'Study session'
        };
      });

      const response = await fetch('http://localhost:5000/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          schedule: backendSchedule,
          preferences: preferences,
          schedule_name: 'My Study Schedule',
          is_active: true
        })
      });

      if (response.ok) {
        const result = await response.json();
        setSaveMessage('✅ Schedule saved successfully to database!');
        
        // Auto-reload the schedule from server to ensure data consistency
        setTimeout(async () => {
          try {
            const reloadResponse = await fetch(`http://localhost:5000/schedule/${userId}`);
            if (reloadResponse.ok) {
              const reloadData = await reloadResponse.json();
              if (reloadData.schedule && reloadData.schedule.schedule.length > 0) {
                const scheduleWithDates = reloadData.schedule.schedule.map(session => ({
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
        }, 1000);
        
        setTimeout(() => setSaveMessage(''), 4000);
      } else {
        const errorData = await response.json();
        setSaveMessage(`❌ Error: ${errorData.error || 'Failed to save schedule'}`);
        setTimeout(() => setSaveMessage(''), 4000);
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
      setSaveMessage('❌ Network error - please try again');
      setTimeout(() => setSaveMessage(''), 4000);
    } finally {
      setIsSaving(false);
    }
  };


  // Generate unique ID for sessions
  const generateSessionId = () => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleGenerateSchedule = () => {
    if (preferences.selectedCourses.length === 0) {
      setError("Please select at least one course to generate a schedule.");
      return;
    }
    if (preferences.learningTimes.length === 0) {
      setError("Please select at least one preferred study time.");
      return;
    }
    if (preferences.learningStyles.length === 0) {
      setError("Please select at least one learning style.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedSchedule([]);

    setTimeout(() => {
      const newSchedule = [];
      const selectedCourseObjects = availableCourses.filter(course =>
        preferences.selectedCourses.includes(course.id)
      );

      if (selectedCourseObjects.length === 0) {
        setError("No valid courses selected. Please ensure your selected courses exist.");
        setIsLoading(false);
        return;
      }

      // Assignment-driven scheduling
      if (assignmentScheduleMode && assignments.length > 0) {
        const pendingAssignments = assignments.filter(assignment => 
          assignment.status !== 'completed' && 
          selectedCourseObjects.some(course => course.id === assignment.courseId)
        );

        if (pendingAssignments.length > 0) {
          // Sort assignments by due date (earliest first)
          pendingAssignments.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
          
          pendingAssignments.forEach(assignment => {
            const course = selectedCourseObjects.find(c => c.id === assignment.courseId);
            if (!course) return;

            const dueDate = new Date(assignment.dueDate);
            const today = new Date();
            const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
            
            // Create study sessions leading up to the due date
            const sessionsNeeded = Math.max(1, Math.min(3, Math.ceil(daysUntilDue / 2)));
            
            for (let i = 0; i < sessionsNeeded; i++) {
              const sessionDate = new Date(dueDate);
              sessionDate.setDate(dueDate.getDate() - (sessionsNeeded - i));
              
              // Skip if session date is in the past
              if (sessionDate < today) continue;
              
              const randomTimeSlot = preferences.learningTimes[Math.floor(Math.random() * preferences.learningTimes.length)];
              const randomLearningStyle = preferences.learningStyles[Math.floor(Math.random() * preferences.learningStyles.length)];
              
              const activityMapping = {
                visual: ["Review materials for {assignmentTitle}", "Create diagrams for {assignmentTitle}", "Study visual aids for {assignmentTitle}"],
                auditory: ["Listen to lectures for {assignmentTitle}", "Discuss {assignmentTitle} concepts", "Review notes for {assignmentTitle}"],
                kinesthetic: ["Practice problems for {assignmentTitle}", "Work on {assignmentTitle} exercises", "Build project for {assignmentTitle}"],
                "reading-writing": ["Read materials for {assignmentTitle}", "Write draft for {assignmentTitle}", "Research for {assignmentTitle}"],
                "group-study": ["Group study for {assignmentTitle}", "Peer review for {assignmentTitle}", "Collaborate on {assignmentTitle}"],
                "problem-solving": ["Solve problems for {assignmentTitle}", "Analyze {assignmentTitle} requirements", "Apply concepts to {assignmentTitle}"],
              };

              const possibleActivities = activityMapping[randomLearningStyle] || [];
              const activityTemplate = possibleActivities[Math.floor(Math.random() * possibleActivities.length)] || "Work on {assignmentTitle}";
              const activity = activityTemplate.replace(/{assignmentTitle}/g, assignment.title);

              const priority = daysUntilDue <= 3 ? 'high' : 'normal';
              const duration = Math.min(preferences.studyDuration, Math.max(45, 60 + (daysUntilDue <= 2 ? 30 : 0)));

              newSchedule.push({
                fullDate: sessionDate,
                day: sessionDate.getDay() === 0 ? 7 : sessionDate.getDay(),
                courseId: course.id,
                courseName: course.name || course.title || 'Unnamed Course',
                courseCode: course.code,
                courseColor: courseColors[availableCourses.findIndex(c => c.id === course.id) % courseColors.length],
                timeSlot: timeSlots.find(slot => slot.id === randomTimeSlot)?.time || 'Anytime',
                duration: duration,
                learningStyle: randomLearningStyle,
                activity: activity,
                priority: priority,
                creditHours: course.creditHours || 3,
                id: generateSessionId(),
                assignmentId: assignment.id,
                assignmentTitle: assignment.title,
                dueDate: assignment.dueDate,
                isAssignmentSession: true
              });
            }
          });
        }
      }

      // Regular schedule generation (existing logic)
      const activityMapping = {
        visual: ["Watch video lectures for {courseName}", "Create mind maps for {courseName}", "Review diagrams for {courseName}"],
        auditory: ["Listen to recordings for {courseName}", "Attend lectures for {courseName}", "Discuss concepts from {courseName}"],
        kinesthetic: ["Practice problems for {courseName}", "Lab work for {courseName}", "Build projects for {courseName}"],
        "reading-writing": ["Read textbooks for {courseName}", "Review notes for {courseName}", "Write summaries for {courseName}"],
        "group-study": ["Group study for {courseName}", "Peer teaching for {courseName}", "Study groups for {courseName}"],
        "problem-solving": ["Solve problems from {courseName}", "Analyze cases for {courseName}", "Apply concepts from {courseName}"],
      };

      // Calculate total credit hours and study time distribution
      const totalCreditHours = selectedCourseObjects.reduce((sum, course) => sum + (course.creditHours || 3), 0);
      const totalStudyHoursPerWeek = Math.max(15, totalCreditHours * 2); // 2 hours per credit hour minimum
      const totalStudyMinutesPerWeek = totalStudyHoursPerWeek * 60;
      
      // Distribute study time based on credit hours
      const courseStudyTime = {};
      selectedCourseObjects.forEach(course => {
        const creditHours = course.creditHours || 3;
        const proportion = creditHours / totalCreditHours;
        courseStudyTime[course.id] = Math.round(totalStudyMinutesPerWeek * proportion);
      });

      // Determine the start and end dates for generation based on the current calendar month
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      startOfMonth.setHours(0, 0, 0, 0); // Normalize to start of day

      const courseDistributionTracker = new Map(); // Map<courseId, Set<dateString>>
      const courseTimeTracker = new Map(); // Map<courseId, number> - track minutes used

      // Initialize time trackers
      selectedCourseObjects.forEach(course => {
        courseTimeTracker.set(course.id, 0);
      });

      const numWeeksToGenerate = 4; // Generate schedule for 4 weeks to ensure coverage
      for (let week = 0; week < numWeeksToGenerate; week++) {
          const startOfWeek = new Date(startOfMonth);
          startOfWeek.setDate(startOfMonth.getDate() + (week * 7)); // Move to the start of the current week

          const daysInThisWeek = [];
          for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
              const day = new Date(startOfWeek);
              day.setDate(startOfWeek.getDate() + dayOffset);
              // Only consider days within the current month for generation to avoid spillover
              if (day.getMonth() === currentDate.getMonth() && day.getFullYear() === currentDate.getFullYear()) {
                  daysInThisWeek.push(day);
              }
          }

          // Shuffle days of the week to pick `preferences.studyDaysPerWeek` randomly
          const shuffledDaysInWeek = [...daysInThisWeek].sort(() => 0.5 - Math.random());
          const daysToScheduleThisWeek = shuffledDaysInWeek.slice(0, preferences.studyDaysPerWeek);

          for (const studyDate of daysToScheduleThisWeek) {
              // Find courses that need more study time
              const coursesNeedingTime = selectedCourseObjects.filter(course => {
                const timeUsed = courseTimeTracker.get(course.id) || 0;
                const timeAllocated = courseStudyTime[course.id] || 0;
                return timeUsed < timeAllocated;
              });

              if (coursesNeedingTime.length === 0) continue;

              // Prioritize courses with less time used
              coursesNeedingTime.sort((a, b) => {
                const timeUsedA = courseTimeTracker.get(a.id) || 0;
                const timeUsedB = courseTimeTracker.get(b.id) || 0;
                return timeUsedA - timeUsedB;
              });

              const course = coursesNeedingTime[0];
              if (!course) continue;

              // Prevent duplicates of the same course on the same date
              if (!courseDistributionTracker.has(course.id)) {
                  courseDistributionTracker.set(course.id, new Set());
              }
              if (courseDistributionTracker.get(course.id).has(studyDate.toDateString())) {
                  continue;
              }

              const randomTimeSlot = preferences.learningTimes[Math.floor(Math.random() * preferences.learningTimes.length)];
              const randomLearningStyle = preferences.learningStyles[Math.floor(Math.random() * preferences.learningStyles.length)];

              const possibleActivities = activityMapping[randomLearningStyle] || [];
              const activityTemplate = possibleActivities[Math.floor(Math.random() * possibleActivities.length)] || "Study for {courseName}";
              const courseName = course.name || course.title || 'Unnamed Course';
              const activity = activityTemplate.replace(/{courseName}/g, courseName);

              // Calculate session duration based on remaining time needed
              const timeUsed = courseTimeTracker.get(course.id) || 0;
              const timeAllocated = courseStudyTime[course.id] || 0;
              const remainingTime = timeAllocated - timeUsed;
              const sessionDuration = Math.min(preferences.studyDuration, Math.max(30, remainingTime));

              const priority = course.creditHours >= 4 ? 'high' : 'normal';

              newSchedule.push({
                  fullDate: studyDate,
                  day: studyDate.getDay() === 0 ? 7 : studyDate.getDay(), // Normalized day of week (1-7)
                  courseId: course.id,
                  courseName: courseName,
                  courseCode: course.code,
                  courseColor: courseColors[availableCourses.findIndex(c => c.id === course.id) % courseColors.length],
                  timeSlot: timeSlots.find(slot => slot.id === randomTimeSlot)?.time || 'Anytime',
                  duration: sessionDuration,
                  learningStyle: randomLearningStyle,
                  activity: activity,
                  priority: priority,
                  creditHours: course.creditHours || 3,
                  id: generateSessionId(), // Assign a unique ID
              });

              // Update time tracker
              courseTimeTracker.set(course.id, (courseTimeTracker.get(course.id) || 0) + sessionDuration);
              courseDistributionTracker.get(course.id).add(studyDate.toDateString());
          }
      }

      setGeneratedSchedule(newSchedule);
      setIsLoading(false);
      setCurrentStep(4); // Move to generated schedule display
      setViewMode('calendar'); // Immediately show the calendar view after schedule generation
    }, 2000);
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
    
    // Auto-save after updating
    setTimeout(() => {
      saveScheduleToBackend();
    }, 500);
  };

  const handleSessionCompletion = async (sessionId, isCompleted) => {
    const session = generatedSchedule.find(s => s.id === sessionId);
    if (!session) return;

    // Update session completion status
    const updatedSession = { ...session, completed: isCompleted, completedAt: isCompleted ? new Date().toISOString() : null };
    
    setGeneratedSchedule(prev => 
      prev.map(s => s.id === sessionId ? updatedSession : s)
    );

    // If this is an assignment session, update the assignment status
    if (session.assignmentId && isCompleted) {
      try {
        const response = await fetch(`http://localhost:5000/assignments/${session.assignmentId}/complete`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ completed: true })
        });

        if (response.ok) {
          // Update local assignments state
          setAssignments(prev => 
            prev.map(assignment => 
              assignment.id === session.assignmentId 
                ? { ...assignment, status: 'completed', completedAt: new Date().toISOString() }
                : assignment
            )
          );
        }
      } catch (error) {
        console.error('Error updating assignment completion:', error);
      }
    }

    // Auto-save after completion
    setTimeout(() => {
      saveScheduleToBackend();
    }, 500);
  };

  const handleCreateQuickAssignment = async () => {
    try {
      const userId = localStorage.getItem('userId') || 'default-user';
      
      const response = await fetch('http://localhost:5000/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: quickAssignmentData.courseId,
          title: quickAssignmentData.title,
          description: quickAssignmentData.description,
          dueDate: quickAssignmentData.dueDate,
          userId: userId,
          courseName: availableCourses.find(c => c.id === quickAssignmentData.courseId)?.name || 'General Assignment'
        })
      });
      
      if (response.ok) {
        // Reload assignments
        const assignmentsResponse = await fetch('http://localhost:5000/assignments');
        if (assignmentsResponse.ok) {
          const data = await assignmentsResponse.json();
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

        // Reset form
        setQuickAssignmentData({
          title: '',
          description: '',
          dueDate: '',
          courseId: ''
        });
        setShowQuickAssignmentModal(false);

        // Optionally regenerate schedule to include new assignment
        if (assignmentScheduleMode) {
          setTimeout(() => {
            handleGenerateSchedule();
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Error creating assignment:', error);
    }
  };

  const handleDeleteSession = (sessionId) => {
    setGeneratedSchedule(prev => prev.filter(session => session.id !== sessionId));
    
    // Auto-save after deleting
    setTimeout(() => {
      saveScheduleToBackend();
    }, 500);
  };

  const handleExportSchedule = () => {
    setIsExportModalOpen(true);
  };

  const exportSchedule = () => {
    const data = generatedSchedule.map(session => ({
      ...session,
      fullDate: session.fullDate.toISOString(),
    }));

    let content;
    let mimeType;
    let fileExtension;

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
        // Basic iCal format
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

        content = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//StudyPlanner//Schedule
${icalEvents}
END:VCALENDAR`;
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
  };

  const handleGenerateClick = () => {
    setCurrentStep(1); // Move to Step 1: Course Selection
  };

  const handleCloseWizard = () => {
    setCurrentStep(0); // Go back to overview
    setPreferences({
      selectedCourses: [],
      studyDuration: 60,
      studyDaysPerWeek: 5,
      learningTimes: [],
      learningStyles: [],
    });
    setGeneratedSchedule([]);
    setError(null);
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (preferences.selectedCourses.length === 0) {
        setError("Please select at least one course.");
        return;
      }
    } else if (currentStep === 2) {
      if (preferences.learningTimes.length === 0) {
        setError("Please select at least one preferred study time.");
        return;
      }
    } else if (currentStep === 3) {
      if (preferences.learningStyles.length === 0) {
        setError("Please select at least one learning style.");
        return;
      }
    }
    setError(null);
    setCurrentStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setError(null);
    setCurrentStep(prev => prev - 1);
  };

  const handleCourseToggle = (courseId) => {
    setPreferences(prev => ({
      ...prev,
      selectedCourses: prev.selectedCourses.includes(courseId)
        ? prev.selectedCourses.filter(id => id !== courseId)
        : [...prev.selectedCourses, courseId]
    }));
  };

  const handleStudyDurationChange = (e) => {
    const value = parseInt(e.target.value);
    setPreferences(prev => ({
      ...prev,
      studyDuration: isNaN(value) ? 60 : value,
    }));
  };

  const handleStudyDaysPerWeekChange = (e) => {
    const value = parseInt(e.target.value);
    setPreferences(prev => ({
      ...prev,
      studyDaysPerWeek: isNaN(value) ? 5 : Math.max(1, Math.min(7, value)),
    }));
  };

  const getProgressPercentage = () => {
    if (currentStep === 0) return 0;
    if (currentStep === 4) return 100;
    return Math.floor(((currentStep - 1) / 3) * 100);
  };

  const getFilteredSchedule = () => {
    // Original filter logic remains, but now applies to sessions with fullDate
    let filtered = generatedSchedule;
    if (selectedFilter === 'high') return filtered.filter(session => session.priority === 'high');
    if (selectedFilter === 'normal') return filtered.filter(session => session.priority === 'normal');
    return filtered; // 'all' or other unknown filters return all
  };

  const getMonthAndYear = (date) => {
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Adjust so Monday is 0, Sunday is 6
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(prevDate.getMonth() + direction);
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination } = result;
    const sourceDate = source.droppableId;
    const destDate = destination.droppableId;

    // Create a copy of the schedule
    const newSchedule = [...generatedSchedule];

    // Find the session being dragged
    const [movedSession] = newSchedule.splice(source.index, 1);

    // Update the date if moving to a different day
    if (sourceDate !== destDate) {
      const newDate = new Date(destDate);
      movedSession.fullDate = newDate;
    }

    // Insert the session at the new position
    newSchedule.splice(destination.index, 0, movedSession);

    // Update the schedule
    setGeneratedSchedule(newSchedule);
  };

  const handleQuickEdit = (session, field, value) => {
    const updatedSession = { ...session, [field]: value };
    setGeneratedSchedule(prev => 
      prev.map(s => s.id === session.id ? updatedSession : s)
    );
    
    // Auto-save after quick edit
    setTimeout(() => {
      saveScheduleToBackend();
    }, 500);
  };

  const handleQuickEditSession = (session) => {
    setEditingSession(session);
    setIsEditMode(true);
  };

  const handleBulkEdit = (field, value) => {
    setGeneratedSchedule(prev => 
      prev.map(session => 
        selectedSessions.has(session.id) 
          ? { ...session, [field]: value }
          : session
      )
    );
    
    // Auto-save after bulk edit
    setTimeout(() => {
      saveScheduleToBackend();
    }, 500);
  };

  const toggleSessionSelection = (sessionId) => {
    const newSelected = new Set(selectedSessions);
    if (newSelected.has(sessionId)) {
      newSelected.delete(sessionId);
    } else {
      newSelected.add(sessionId);
    }
    setSelectedSessions(newSelected);
  };

  const clearSelection = () => {
    setSelectedSessions(new Set());
    setIsBulkEditMode(false);
  };

  const renderContent = () => {
    const progress = getProgressPercentage();
    const filteredSchedule = getFilteredSchedule();

    // Calendar specific calculations
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayIndex = getFirstDayOfMonth(year, month); // 0 for Monday

    const calendarDays = [];
    // Add empty slots for days before the 1st of the month
    for (let i = 0; i < firstDayIndex; i++) {
      calendarDays.push(null);
    }
    // Add days of the current month
    for (let i = 1; i <= daysInMonth; i++) {
      calendarDays.push(new Date(year, month, i));
    }

    const sessionsByDay = filteredSchedule.reduce((acc, session) => {
      // Ensure session.fullDate is a Date object; if it's a string, convert it
      const sessionDate = session.fullDate instanceof Date ? session.fullDate : new Date(session.fullDate);
      
      // Filter for sessions that fall within the current month displayed by the calendar
      if (sessionDate.getFullYear() === year && sessionDate.getMonth() === month) {
        const dayKey = sessionDate.toDateString(); // Keep toDateString for consistent key, but ensure filtering by year/month
        if (!acc[dayKey]) {
          acc[dayKey] = [];
        }
        acc[dayKey].push(session);
      }
      return acc;
    }, {});

    // Get unique sorted days from generated schedule for list view
    const uniqueDays = Array.from(new Set(filteredSchedule.map(session => session.fullDate.toDateString())))
      .map(dateString => new Date(dateString))
      .sort((a, b) => a.getTime() - b.getTime());
      
    const daysOfWeekNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    switch (currentStep) {
      case 0:
        return (
          <div className="flex flex-col items-center justify-center text-center py-20">
            <div className="p-6 bg-blue-100 rounded-full mb-8 transform hover:scale-105 transition-transform duration-300">
              <Calendar className="w-16 h-16 text-blue-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4 animate-fade-in">Ready to Get Organized?</h2>
            <p className="text-gray-700 max-w-2xl mx-auto mb-10 animate-fade-in-delay">
              Create your personalized study schedule with our AI-powered generator. Choose your courses, learning
              preferences, and optimal study times.
            </p>
            <button
              onClick={handleGenerateClick}
              className="px-10 py-4 bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-700 hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 flex items-center space-x-2 group"
            >
              <Zap className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
              <span>Generate My Schedule</span>
            </button>
          </div>
        );
      case 1:
        return (
          <div className="min-h-[400px] flex flex-col animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Generate Study Schedule - Step 1 of 3</h2>
              <button 
                onClick={handleCloseWizard} 
                className="text-gray-500 hover:text-gray-700 focus:outline-none transform hover:rotate-90 transition-transform duration-300"
              >
                <X className="w-7 h-7" />
              </button>
            </div>

            <div className="flex flex-col items-center text-center mb-8">
              <div className="p-4 bg-blue-100 rounded-full mb-4 transform hover:scale-105 transition-transform duration-300">
                <BookOpen className="w-9 h-9 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Select Your Courses</h3>
              <p className="text-gray-700">Choose from your registered courses</p>
            </div>

            {error && (
              <div className="animate-shake">
                <p className="text-red-500 text-center mb-6 text-base font-medium">{error}</p>
              </div>
            )}

            {availableCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                {availableCourses.map((course, index) => {
                  const isSelected = preferences.selectedCourses.includes(course.id);
                  const colorIndex = index % courseColors.length;
                  const courseColor = courseColors[colorIndex];

                  return (
                    <div
                      key={course.id}
                      className={`relative p-5 border rounded-xl cursor-pointer transition-all duration-300 transform hover:-translate-y-1
                        ${isSelected 
                          ? 'border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-200' 
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 hover:shadow-md'}`}
                      onClick={() => handleCourseToggle(course.id)}
                    >
                      <div className="flex items-center justify-between space-x-3 mb-2">
                        <div className="flex items-center space-x-3">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: courseColor }}></span>
                          <h4 className="text-lg font-semibold text-gray-800">{course.name || course.title || 'Unnamed Course'}</h4>
                        </div>
                        {isSelected && (
                          <div className="transform scale-0 group-hover:scale-100 transition-transform duration-300">
                            <Check className="w-6 h-6 text-blue-600" />
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-700">{course.code} &bull; {course.creditHours} credits</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-gray-600 mb-8">No courses available. Please add courses to your profile first.</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label htmlFor="studySession" className="block text-base font-medium text-gray-700 mb-2">Study Session (minutes)</label>
                <input
                  type="number"
                  id="studySession"
                  className="mt-1 block w-full border border-gray-400 rounded-md shadow-sm py-2.5 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none sm:text-base transition-all duration-200"
                  value={preferences.studyDuration}
                  onChange={handleStudyDurationChange}
                  min="1"
                />
              </div>
              <div>
                <label htmlFor="studyDays" className="block text-base font-medium text-gray-700 mb-2">Study Days per Week</label>
                <input
                  type="number"
                  id="studyDays"
                  className="mt-1 block w-full border border-gray-400 rounded-md shadow-sm py-2.5 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none sm:text-base transition-all duration-200"
                  value={preferences.studyDaysPerWeek}
                  onChange={handleStudyDaysPerWeekChange}
                  min="1"
                  max="7"
                />
              </div>
            </div>

            {/* Assignment Integration */}
            {assignments.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Assignment Integration</h3>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="assignmentScheduleMode"
                      checked={assignmentScheduleMode}
                      onChange={(e) => setAssignmentScheduleMode(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="assignmentScheduleMode" className="text-sm font-medium text-gray-700">
                      Generate schedule based on assignments
                    </label>
                  </div>
                </div>
                
                {assignmentScheduleMode && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">Assignment-Driven Scheduling</h4>
                    <p className="text-sm text-blue-700 mb-3">
                      This will create study sessions specifically for your pending assignments, prioritizing by due date.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-blue-800">Pending Assignments:</span>
                        <span className="text-sm text-blue-700 ml-2">
                          {assignments.filter(a => a.status !== 'completed').length}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-blue-800">Overdue Assignments:</span>
                        <span className="text-sm text-blue-700 ml-2">
                          {assignments.filter(a => new Date(a.dueDate) < new Date() && a.status !== 'completed').length}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Progress and Navigation */}
            <div className="mt-auto pt-6 border-t border-gray-200">
              <div className="flex justify-between items-center text-sm text-gray-700 mb-2">
                <span>Step 1 of 3</span>
                <span>{progress}% Complete</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-700 h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="flex justify-between">
                <button
                  onClick={handlePrevStep}
                  disabled={currentStep === 1}
                  className="px-7 py-2.5 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium transform hover:-translate-x-1"
                >
                  Previous
                </button>
                <button
                  onClick={handleNextStep}
                  className="px-7 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg transition-all duration-300 transform hover:translate-x-1"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="min-h-[400px] flex flex-col animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Generate Study Schedule - Step 2 of 3</h2>
              <button 
                onClick={handleCloseWizard} 
                className="text-gray-500 hover:text-gray-700 focus:outline-none transform hover:rotate-90 transition-transform duration-300"
              >
                <X className="w-7 h-7" />
              </button>
            </div>

            <div className="flex flex-col items-center text-center mb-8">
              <div className="p-4 bg-blue-100 rounded-full mb-4 transform hover:scale-105 transition-transform duration-300">
                <Clock className="w-9 h-9 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">When do you study best?</h3>
              <p className="text-gray-700">Select your preferred study times</p>
            </div>

            {error && (
              <div className="animate-shake">
                <p className="text-red-500 text-center mb-6 text-base font-medium">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
              {timeSlots.map(slot => {
                const isSelected = preferences.learningTimes.includes(slot.id);
                return (
                  <div
                    key={slot.id}
                    className={`relative p-5 border rounded-xl cursor-pointer transition-all duration-300 transform hover:-translate-y-1
                      ${isSelected 
                        ? 'border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-200' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 hover:shadow-md'}`}
                    onClick={() => setPreferences(prev => ({
                      ...prev,
                      learningTimes: isSelected
                        ? prev.learningTimes.filter(id => id !== slot.id)
                        : [...prev.learningTimes, slot.id]
                    }))}
                  >
                    <div className="flex items-center justify-between space-x-3 mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl transform hover:scale-110 transition-transform duration-300">{slot.icon}</span>
                        <h4 className="text-lg font-semibold text-gray-800">{slot.label}</h4>
                      </div>
                      {isSelected && (
                        <div className="transform scale-0 group-hover:scale-100 transition-transform duration-300">
                          <Check className="w-6 h-6 text-blue-600" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-700">{slot.time}</p>
                  </div>
                );
              })}
            </div>

            {/* Progress and Navigation */}
            <div className="mt-auto pt-6 border-t border-gray-200">
              <div className="flex justify-between items-center text-sm text-gray-700 mb-2">
                <span>Step 2 of 3</span>
                <span>{progress}% Complete</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-700 h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="flex justify-between">
                <button
                  onClick={handlePrevStep}
                  className="px-7 py-2.5 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-all duration-300 font-medium transform hover:-translate-x-1"
                >
                  Previous
                </button>
                <button
                  onClick={handleNextStep}
                  className="px-7 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg transition-all duration-300 transform hover:translate-x-1"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="min-h-[400px] flex flex-col animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Generate Study Schedule - Step 3 of 3</h2>
              <button 
                onClick={handleCloseWizard} 
                className="text-gray-500 hover:text-gray-700 focus:outline-none transform hover:rotate-90 transition-transform duration-300"
              >
                <X className="w-7 h-7" />
              </button>
            </div>

            <div className="flex flex-col items-center text-center mb-8">
              <div className="p-4 bg-blue-100 rounded-full mb-4 transform hover:scale-105 transition-transform duration-300">
                <Brain className="w-9 h-9 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">How do you learn best?</h3>
              <p className="text-gray-700">Select your learning preferences</p>
            </div>

            {error && (
              <div className="animate-shake">
                <p className="text-red-500 text-center mb-6 text-base font-medium">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
              {learningStyles.map(style => {
                const isSelected = preferences.learningStyles.includes(style.id);
  return (
                  <div
                    key={style.id}
                    className={`relative p-5 border rounded-xl cursor-pointer transition-all duration-300 transform hover:-translate-y-1
                      ${isSelected 
                        ? 'border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-200' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 hover:shadow-md'}`}
                    onClick={() => setPreferences(prev => ({
                      ...prev,
                      learningStyles: isSelected
                        ? prev.learningStyles.filter(id => id !== style.id)
                        : [...prev.learningStyles, style.id]
                    }))}
                  >
                    <div className="flex items-center justify-between space-x-3 mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl transform hover:scale-110 transition-transform duration-300">{style.icon}</span>
                        <h4 className="text-lg font-semibold text-gray-800">{style.label}</h4>
                      </div>
                      {isSelected && (
                        <div className="transform scale-0 group-hover:scale-100 transition-transform duration-300">
                          <Check className="w-6 h-6 text-blue-600" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-700">{style.description}</p>
                  </div>
                );
              })}
            </div>

            {/* Progress and Navigation */}
            <div className="mt-auto pt-6 border-t border-gray-200">
              <div className="flex justify-between items-center text-sm text-gray-700 mb-2">
                <span>Step 3 of 3</span>
                <span>{progress}% Complete</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-700 h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="flex justify-between">
                <button
                  onClick={handlePrevStep}
                  className="px-7 py-2.5 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-all duration-300 font-medium transform hover:-translate-x-1"
                >
                  Previous
                </button>
                <button
                  onClick={handleGenerateSchedule}
                  className="px-7 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg transition-all duration-300 transform hover:translate-x-1"
                >
                  Generate Schedule
                </button>
        </div>
      </div>
    </div>
  );
      case 4:
        return (
          <div className="min-h-[400px] flex flex-col animate-fade-in">
            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => setSelectedFilter('all')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200
                  ${selectedFilter === 'all' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedFilter('high')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200
                  ${selectedFilter === 'high' ? 'bg-red-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                High Priority
              </button>
              <button
                onClick={() => setSelectedFilter('normal')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200
                  ${selectedFilter === 'normal' ? 'bg-green-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                Normal Priority
              </button>
              
              {/* Bulk Edit Controls */}
              {generatedSchedule.length > 0 && (
                <>
                  <button
                    onClick={() => setIsBulkEditMode(!isBulkEditMode)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200
                      ${isBulkEditMode ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                    {isBulkEditMode ? 'Exit Bulk Edit' : 'Bulk Edit'}
                  </button>
                  
                  {isBulkEditMode && selectedSessions.size > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">{selectedSessions.size} selected</span>
                      <select
                        onChange={(e) => handleBulkEdit('priority', e.target.value)}
                        className="text-xs border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="">Set Priority</option>
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                      </select>
                      <select
                        onChange={(e) => handleBulkEdit('duration', parseInt(e.target.value))}
                        className="text-xs border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="">Set Duration</option>
                        <option value={30}>30m</option>
                        <option value={45}>45m</option>
                        <option value={60}>1h</option>
                        <option value={90}>1.5h</option>
                        <option value={120}>2h</option>
                      </select>
                      <button
                        onClick={clearSelection}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Clear
              </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Dashboard Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-md p-6 flex items-center space-x-4 border border-gray-200">
                <div className="p-3 bg-blue-100 rounded-full">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Sessions</p>
                  <h3 className="text-2xl font-bold text-gray-900">{generatedSchedule.length}</h3>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6 flex items-center space-x-4 border border-gray-200">
                <div className="p-3 bg-red-100 rounded-full">
                  <Target className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">High Priority</p>
                  <h3 className="text-2xl font-bold text-gray-900">{generatedSchedule.filter(s => s.priority === 'high').length}</h3>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6 flex items-center space-x-4 border border-gray-200">
                <div className="p-3 bg-green-100 rounded-full">
                  <Hourglass className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Study Hours</p>
                  <h3 className="text-2xl font-bold text-gray-900">{Math.floor((generatedSchedule.length * preferences.studyDuration) / 60)}</h3>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6 flex items-center space-x-4 border border-gray-200">
                <div className="p-3 bg-purple-100 rounded-full">
                  <Book className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Courses</p>
                  <h3 className="text-2xl font-bold text-gray-900">{new Set(generatedSchedule.map(s => s.courseId)).size}</h3>
                </div>
              </div>
            </div>

            {/* Credit Hours Summary */}
            {generatedSchedule.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Credit Hours Distribution</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from(new Set(generatedSchedule.map(s => s.courseId))).map(courseId => {
                    const course = availableCourses.find(c => c.id === courseId);
                    const courseSessions = generatedSchedule.filter(s => s.courseId === courseId);
                    const totalMinutes = courseSessions.reduce((sum, s) => sum + s.duration, 0);
                    const creditHours = course?.creditHours || 3;
                    const recommendedHours = creditHours * 2;
                    const actualHours = totalMinutes / 60;
                    
                    return (
                      <div key={courseId} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-900">{course?.name || course?.title || 'Unnamed Course'}</h4>
                          <span className="text-sm text-gray-500">{creditHours} credits</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Sessions:</span>
                            <span className="font-medium">{courseSessions.length}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Study Time:</span>
                            <span className="font-medium">{actualHours.toFixed(1)}h</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Recommended:</span>
                            <span className="font-medium">{recommendedHours}h/week</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                actualHours >= recommendedHours ? 'bg-green-500' : 
                                actualHours >= recommendedHours * 0.7 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(100, (actualHours / recommendedHours) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Assignment Progress Dashboard */}
            {assignments.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Assignment Progress</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{assignments.length}</div>
                    <div className="text-sm text-gray-600">Total Assignments</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {assignments.filter(a => a.status === 'completed').length}
                    </div>
                    <div className="text-sm text-gray-600">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {assignments.filter(a => a.status === 'in-progress').length}
                    </div>
                    <div className="text-sm text-gray-600">In Progress</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {assignments.filter(a => new Date(a.dueDate) < new Date() && a.status !== 'completed').length}
                    </div>
                    <div className="text-sm text-gray-600">Overdue</div>
                  </div>
                </div>
                
                {/* Assignment-Schedule Integration Stats */}
                {generatedSchedule.length > 0 && (
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Schedule Integration</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="text-sm font-medium text-blue-800">Assignment Sessions</div>
                        <div className="text-lg font-bold text-blue-600">
                          {generatedSchedule.filter(s => s.isAssignmentSession).length}
                        </div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3">
                        <div className="text-sm font-medium text-green-800">Completed Sessions</div>
                        <div className="text-lg font-bold text-green-600">
                          {generatedSchedule.filter(s => s.completed).length}
                        </div>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-3">
                        <div className="text-sm font-medium text-orange-800">Pending Sessions</div>
                        <div className="text-lg font-bold text-orange-600">
                          {generatedSchedule.filter(s => !s.completed).length}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Weekly View Header */}
            {viewMode === 'calendar' && (
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Weekly View <span className="font-normal text-gray-600 ml-2">{getMonthAndYear(currentDate)}</span></h2>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => setViewMode('calendar')}
                    className={`p-2 rounded-md ${viewMode === 'calendar' ? 'bg-blue-500 text-white shadow-sm' : 'hover:bg-gray-100 text-gray-600 hover:text-blue-600'} transition-colors duration-200`}
                  >
                    <Calendar className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-blue-500 text-white shadow-sm' : 'hover:bg-gray-100 text-gray-600 hover:text-blue-600'} transition-colors duration-200`}
                  >
                    <List className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-blue-500 text-white shadow-sm' : 'hover:bg-gray-100 text-gray-600 hover:text-blue-600'} transition-colors duration-200`}
                  >
                    <Grid className="w-5 h-5" />
                  </button>
                  <button onClick={goToToday} className="px-3 py-1 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors border border-gray-300">Today</button>
                  <button onClick={() => navigateMonth(-1)} className="p-2 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"><span className="font-bold text-xl leading-none">&lt;</span></button>
                  <button onClick={() => navigateMonth(1)} className="p-2 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"><span className="font-bold text-xl leading-none">&gt;</span></button>
                </div>
              </div>
            )}

            {/* Calendar Grid */}
            {isLoading ? (
              <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 animate-fade-in">
                <div className="bg-white rounded-lg shadow-xl p-8 max-w-sm w-full text-center relative">
                  <button 
                    onClick={handleCloseWizard} 
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none transform hover:rotate-90 transition-transform duration-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="p-4 bg-blue-100 rounded-full inline-flex mb-6">
                    <Loader className="w-12 h-12 text-blue-600 animate-spin-slow" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Generating Your Schedule</h3>
                  <p className="text-gray-700 text-base">AI is creating the perfect study plan for you...</p>
                </div>
              </div>
            ) : error ? (
              <div className="text-center text-red-500 py-16 animate-fade-in">
                <p className="text-red-600 text-lg font-medium">{error}</p>
                <button
                  onClick={() => setCurrentStep(1)}
                  className="mt-4 px-7 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-all duration-300 transform hover:-translate-y-1"
                >
                  Try Again
                </button>
              </div>
            ) : filteredSchedule.length > 0 ? (
              <>
                {viewMode === 'calendar' && (
                  <div className="grid grid-cols-7 gap-4">
                    {/* Days of the week header */}
                    {[ 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun' ].map(dayName => (
                      <div key={dayName} className="text-center text-sm font-medium text-gray-500">
                        {dayName}
                      </div>
                    ))}

                    {/* Calendar Days */}
                    {calendarDays.map((date, index) => {
                      // Get sessions for this specific calendar date
                      const sessionsForThisDate = date ? sessionsByDay[date.toDateString()] || [] : [];

                      return (
                        <div 
                          key={index} 
                          className={`rounded-lg p-2 min-h-[120px] border relative
                            ${date ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'}
                            ${date && date.toDateString() === new Date().toDateString() ? 'border-blue-500 ring-1 ring-blue-200' : ''}
                          `}
                        >
                          {date && (
                            <p className={`text-right font-semibold mb-2 ${date.toDateString() === new Date().toDateString() ? 'text-blue-600' : 'text-gray-800'}`}>
                              {date.getDate()}
                            </p>
                          )}
                          {sessionsForThisDate.map((session, sessionIndex) => {
                            const course = availableCourses.find(c => c.id === session.courseId) || {};
                            const sessionColor = session.courseColor;

                            return (
                              <div 
                                key={sessionIndex} 
                                className="bg-white rounded-lg p-2 mb-1 shadow-sm border-l-4 relative overflow-hidden"
                                style={{ borderColor: sessionColor }}
                              >
                                {session.priority === 'high' && (
                                  <span className="absolute top-1 right-1 bg-red-100 text-red-700 text-xs font-medium px-1.5 py-0.5 rounded-full">
                                    High Priority
                                  </span>
                                )}
                                <h5 className="text-xs font-semibold text-gray-800 leading-tight">{course.name || course.title || 'Unnamed Course'}</h5>
                                <p className="text-xs text-gray-600 leading-tight">{session.timeSlot}</p>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                )}

                {viewMode === 'list' && (
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <div className="space-y-6 px-4 py-2">
                      {uniqueDays.map(dateObj => {
                        const sessionsOnDay = filteredSchedule.filter(session => session.fullDate.toDateString() === dateObj.toDateString());
                        const dayName = daysOfWeekNames[dateObj.getDay()];
                        
                        return (
                          <div key={dateObj.toDateString()}>
                            <h3 className="text-2xl font-bold text-gray-900 mb-1">{dayName}</h3>
                            <p className="text-gray-600 mb-6">{sessionsOnDay.length} sessions scheduled</p>
                            <Droppable droppableId={dateObj.toDateString()}>
                              {(provided, snapshot) => (
                                <div
                                  {...provided.droppableProps}
                                  ref={provided.innerRef}
                                  className={`space-y-4 p-2 rounded-lg transition-colors duration-200
                                    ${snapshot.isDraggingOver ? 'bg-blue-50' : ''}`}
                                >
                                  {sessionsOnDay.map((session, sessionIndex) => {
                                    const course = availableCourses.find(c => c.id === session.courseId) || {};
                                    const sessionColor = session.courseColor;
                                    const learningStyleText = session.learningStyle === 'visual' ? 'Visual Learning' :
                                                            session.learningStyle === 'auditory' ? 'Auditory Learning' :
                                                            session.learningStyle === 'kinesthetic' ? 'Hands-on Learning' :
                                                            session.learningStyle === 'reading-writing' ? 'Reading/Writing' :
                                                            session.learningStyle === 'group-study' ? 'Group Study' :
                                                            session.learningStyle === 'problem-solving' ? 'Problem Solving' :
                                                            session.learningStyle;

                                    return (
                                      <Draggable
                                        key={session.id || sessionIndex}
                                        draggableId={session.id || `session-${sessionIndex}`}
                                        index={sessionIndex}
                                      >
                                        {(provided, snapshot) => (
                                          <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            className={`bg-white rounded-xl shadow-sm p-5 flex items-start space-x-4 border-l-4 border-t border-b border-r border-gray-200 group hover:shadow-md transition-all duration-200
                                              ${snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-200 rotate-1 scale-105' : ''}
                                              ${snapshot.isDragging ? 'cursor-grabbing' : 'cursor-grab'}
                                              ${isBulkEditMode && selectedSessions.has(session.id) ? 'ring-2 ring-purple-200 bg-purple-50' : ''}`}
                                            style={{
                                              ...provided.draggableProps.style,
                                              borderColor: sessionColor,
                                              transform: snapshot.isDragging ? provided.draggableProps.style?.transform : 'none'
                                            }}
                                          >
                                            {/* Bulk Edit Checkbox */}
                                            {isBulkEditMode && (
                                              <input
                                                type="checkbox"
                                                checked={selectedSessions.has(session.id)}
                                                onChange={() => toggleSessionSelection(session.id)}
                                                className="mt-2 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                                              />
                                            )}
                                            
                                            <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                                              <GripVertical className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                                            </div>
                                            <span className="w-3 h-3 rounded-full flex-shrink-0 mt-2" style={{ backgroundColor: sessionColor }}></span>
                                            <div className="flex-1">
                                              <div className="flex justify-between items-center mb-1">
                                                <h4 className="text-lg font-semibold text-gray-800">
                                                  {course.name || course.title || 'Unnamed Course'} 
                                                  <span className="text-base text-gray-500 font-normal ml-2">{course.code}</span>
                                                  {session.isAssignmentSession && (
                                                    <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                                      Assignment
                                                    </span>
                                                  )}
                                                </h4>
                                                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                  {/* Assignment Completion Checkbox */}
                                                  {session.isAssignmentSession && (
                                                    <input
                                                      type="checkbox"
                                                      checked={session.completed || false}
                                                      onChange={(e) => handleSessionCompletion(session.id, e.target.checked)}
                                                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                                      title="Mark assignment session as complete"
                                                    />
                                                  )}
                                                  
                                                  {/* Quick Edit Duration */}
                                                  <select
                                                    value={session.duration}
                                                    onChange={(e) => handleQuickEdit(session, 'duration', parseInt(e.target.value))}
                                                    className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                                                  >
                                                    <option value={30}>30m</option>
                                                    <option value={45}>45m</option>
                                                    <option value={60}>1h</option>
                                                    <option value={90}>1.5h</option>
                                                    <option value={120}>2h</option>
                                                  </select>
                                                  
                                                  {/* Quick Edit Priority */}
                                                  <select
                                                    value={session.priority}
                                                    onChange={(e) => handleQuickEdit(session, 'priority', e.target.value)}
                                                    className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                                                  >
                                                    <option value="normal">Normal</option>
                                                    <option value="high">High</option>
                                                  </select>
                                                  
                                                  <button 
                                                    onClick={() => handleQuickEditSession(session)}
                                                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors duration-200"
                                                  >
                                                    <Edit2 className="w-4 h-4" />
                                                  </button>
                                                  <button 
                                                    onClick={() => handleDeleteSession(session.id)}
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
                                                <span>{learningStyleText}</span>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </Draggable>
                                    );
                                  })}
                                  {provided.placeholder}
                                </div>
                              )}
                            </Droppable>
                          </div>
                        );
                      })}
                    </div>
                  </DragDropContext>
                )}

                {viewMode === 'grid' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-4 py-2">
                    {filteredSchedule.map((session, sessionIndex) => {
                      const course = availableCourses.find(c => c.id === session.courseId) || {};
                      const sessionColor = session.courseColor;
                      const learningStyleText = session.learningStyle === 'visual' ? 'Visual Learning' :
                                                session.learningStyle === 'auditory' ? 'Auditory Learning' :
                                                session.learningStyle === 'kinesthetic' ? 'Hands-on Learning' :
                                                session.learningStyle === 'reading-writing' ? 'Reading/Writing' :
                                                session.learningStyle === 'group-study' ? 'Group Study' :
                                                session.learningStyle === 'problem-solving' ? 'Problem Solving' :
                                                session.learningStyle;

                              const daysOfWeekNamesLong = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

                              return (
                                <div 
                                  key={sessionIndex} 
                                  className="bg-white rounded-xl shadow-sm p-5 flex flex-col space-y-3 border-l-4 border-t border-b border-r border-gray-200"
                                  style={{ borderColor: sessionColor }}
                                >
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center space-x-2">
                                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: sessionColor }}></span>
                                      <h4 className="text-lg font-semibold text-gray-800">{course.name || course.title || 'Unnamed Course'} <span className="text-base text-gray-500 font-normal ml-1">{course.code}</span></h4>
                                    </div>
                                    <button className="text-gray-400 hover:text-gray-700"><MoreHorizontal className="w-5 h-5" /></button>
                                  </div>
                                  <p className="text-gray-700">{session.activity}</p>
                                  <div className="flex flex-col text-sm text-gray-600">
                                    <span>{daysOfWeekNamesLong[session.fullDate.getDay()]} - {session.timeSlot}</span>
                                    <span>{session.duration} minutes</span>
                                    <span>{learningStyleText}</span>
                                  </div>
                                  {session.priority === 'high' && (
                                    <span className="self-end bg-red-100 text-red-700 text-xs font-medium px-2 py-0.5 rounded-full">High Priority</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center text-gray-600 py-16">
                        <p>No schedule generated yet. Please select your preferences.</p>
                      </div>
                    )}
                  </div>
                );
              default:
                return null;
            }
          };

          return (
            <div className="flex h-screen bg-gray-50 overflow-hidden">
              {/* Main Content */}
              <div className="flex-1 transition-all duration-300">
                {/* Top Bar */}
                <div className="bg-white shadow-sm py-4 px-6 flex items-center justify-between sticky top-0 z-10 border-b border-gray-200">
                  <div className="flex items-center space-x-4">
                    <h1 className="text-2xl font-bold text-gray-900">My Schedule</h1>
                    <span className="flex items-center text-sm text-gray-600">
                      <span className="w-2.5 h-2.5 bg-green-500 rounded-full mr-2"></span>
                      {generatedSchedule.length} active sessions
                    </span>
                    {saveMessage && (
                      <span className={`text-sm px-3 py-1 rounded-full ${
                        saveMessage.includes('Error') 
                          ? 'bg-red-100 text-red-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {saveMessage}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-4">
                    {generatedSchedule.length > 0 && (
                      <>
                        <button
                          onClick={saveScheduleToBackend}
                          disabled={isSaving}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                          <Save className="w-4 h-4" />
                          <span>{isSaving ? 'Saving...' : 'Save Schedule'}</span>
                        </button>
                        
                        {/* Quick Actions - shown after save */}
                        {saveMessage.includes('successfully') && (
                          <div className="flex items-center space-x-2 animate-fade-in">
                            <button
                              onClick={handleExportSchedule}
                              className="flex items-center space-x-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 text-sm"
                            >
                              <Download className="w-4 h-4" />
                              <span>Export</span>
                            </button>
                            <button
                              onClick={() => setViewMode('calendar')}
                              className="flex items-center space-x-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 text-sm"
                            >
                              <Calendar className="w-4 h-4" />
                              <span>View Calendar</span>
                            </button>
                          </div>
                        )}
                        
                        <button
                          onClick={() => setCurrentStep(1)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200"
                        >
                          Regenerate Schedule
                        </button>
                      </>
                    )}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input 
                        type="text" 
                        placeholder="Search sessions..." 
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm w-48"
                      />
                    </div>
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="h-[calc(100vh-4rem)] overflow-y-auto">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="bg-white rounded-lg shadow-sm p-8">
                      {currentStep !== 0 && (
                        <div className="mb-8">
                          <h1 className="text-3xl font-bold text-gray-900">Schedule Generator</h1>
                          <p className="text-gray-700">Create personalized study schedules with AI-powered auto-generation</p>
                        </div>
                      )}

                      {renderContent()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Keep only the necessary modals */}
              {isEditMode && editingSession && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 animate-fade-in">
                  <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-gray-900">Edit Study Session</h3>
                      <button 
                        onClick={() => setIsEditMode(false)}
                        className="text-gray-500 hover:text-gray-700 focus:outline-none"
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
                              courseColor: courseColors[availableCourses.findIndex(c => c.id === e.target.value) % courseColors.length]
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
                          {timeSlots.map(slot => (
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

                      {/* Learning Style */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Learning Style</label>
                        <select 
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={editingSession.learningStyle}
                          onChange={(e) => setEditingSession(prev => ({ ...prev, learningStyle: e.target.value }))}
                        >
                          {learningStyles.map(style => (
                            <option key={style.id} value={style.id}>
                              {style.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Priority */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                        <select 
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={editingSession.priority}
                          onChange={(e) => setEditingSession(prev => ({ ...prev, priority: e.target.value }))}
                        >
                          <option value="normal">Normal</option>
                          <option value="high">High</option>
                        </select>
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

                      {/* Credit Hours Info */}
                      <div className="md:col-span-2">
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                          <h4 className="text-sm font-medium text-blue-800 mb-2">Course Information</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-blue-600 font-medium">Credit Hours:</span> {editingSession.creditHours || 3}
                            </div>
                            <div>
                              <span className="text-blue-600 font-medium">Recommended Study Time:</span> {(editingSession.creditHours || 3) * 2} hours/week
                            </div>
                          </div>
                        </div>
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

              {isExportModalOpen && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 animate-fade-in">
                  <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-gray-900">Export Schedule</h3>
                      <button 
                        onClick={() => setIsExportModalOpen(false)}
                        className="text-gray-500 hover:text-gray-700 focus:outline-none"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
                        <div className="grid grid-cols-3 gap-3">
                          <button
                            onClick={() => setExportFormat('json')}
                            className={`p-3 border rounded-lg flex flex-col items-center space-y-2 transition-all duration-200
                              ${exportFormat === 'json' 
                                ? 'border-blue-500 bg-blue-50 text-blue-700' 
                                : 'border-gray-200 hover:border-gray-300'}`}
                          >
                            <FileText className="w-6 h-6" />
                            <span className="text-sm font-medium">JSON</span>
                          </button>
                          <button
                            onClick={() => setExportFormat('csv')}
                            className={`p-3 border rounded-lg flex flex-col items-center space-y-2 transition-all duration-200
                              ${exportFormat === 'csv' 
                                ? 'border-blue-500 bg-blue-50 text-blue-700' 
                                : 'border-gray-200 hover:border-gray-300'}`}
                          >
                            <FileText className="w-6 h-6" />
                            <span className="text-sm font-medium">CSV</span>
                          </button>
                          <button
                            onClick={() => setExportFormat('ical')}
                            className={`p-3 border rounded-lg flex flex-col items-center space-y-2 transition-all duration-200
                              ${exportFormat === 'ical' 
                                ? 'border-blue-500 bg-blue-50 text-blue-700' 
                                : 'border-gray-200 hover:border-gray-300'}`}
                          >
                            <Calendar className="w-6 h-6" />
                            <span className="text-sm font-medium">iCal</span>
                          </button>
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

              {/* Quick Assignment Modal */}
              {showQuickAssignmentModal && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 animate-fade-in">
                  <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-gray-900">Quick Assignment</h3>
                      <button 
                        onClick={() => setShowQuickAssignmentModal(false)}
                        className="text-gray-500 hover:text-gray-700 focus:outline-none"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Assignment Title</label>
                        <input
                          type="text"
                          value={quickAssignmentData.title}
                          onChange={(e) => setQuickAssignmentData(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter assignment title"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <textarea
                          value={quickAssignmentData.description}
                          onChange={(e) => setQuickAssignmentData(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows="3"
                          placeholder="Enter assignment description"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
                        <select
                          value={quickAssignmentData.courseId}
                          onChange={(e) => setQuickAssignmentData(prev => ({ ...prev, courseId: e.target.value }))}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select a course</option>
                          {availableCourses.map(course => (
                            <option key={course.id} value={course.id}>
                              {course.name || course.title} ({course.creditHours || 3} credits)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                        <input
                          type="date"
                          value={quickAssignmentData.dueDate}
                          onChange={(e) => setQuickAssignmentData(prev => ({ ...prev, dueDate: e.target.value }))}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                      <button
                        onClick={() => setShowQuickAssignmentModal(false)}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCreateQuickAssignment}
                        disabled={!quickAssignmentData.title || !quickAssignmentData.courseId || !quickAssignmentData.dueDate}
                        className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Create Assignment
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        };

        export default Schedule; 