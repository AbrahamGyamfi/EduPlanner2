import { v4 as uuidv4 } from 'uuid';

// Assignment management functions
export const getAssignments = () => {
  try {
    const assignments = localStorage.getItem('assignments');
    return assignments ? JSON.parse(assignments) : [];
  } catch (error) {
    console.error('Error getting assignments:', error);
    return [];
  }
};

export const saveAssignments = (assignments) => {
  try {
    localStorage.setItem('assignments', JSON.stringify(assignments));
  } catch (error) {
    console.error('Error saving assignments:', error);
  }
};

export const ensureWeeklyAssignments = (subjects) => {
  const existingAssignments = getAssignments();
  const today = new Date();
  
  // Generate assignments for each subject if none exist
  if (existingAssignments.length === 0) {
    const newAssignments = subjects.flatMap((subject, index) => {
      const dueDate = new Date(today);
      dueDate.setDate(today.getDate() + (index % 7) + 1); // Spread over next 7 days
      
      return {
        id: uuidv4(),
        title: `${subject} Assignment ${index + 1}`,
        description: `Weekly assignment for ${subject}`,
        subject: subject,
        dueDate: dueDate.toISOString(),
        status: 'pending',
        priority: Math.floor(Math.random() * 3) + 1, // 1-3
        estimatedMinutes: Math.floor(Math.random() * 90) + 30, // 30-120 minutes
      };
    });
    
    saveAssignments(newAssignments);
    return newAssignments;
  }
  
  return existingAssignments;
};

export const updateAssignmentStatus = (assignmentId, newStatus) => {
  try {
    const assignments = getAssignments();
    const updatedAssignments = assignments.map(assignment =>
      assignment.id === assignmentId ? { ...assignment, status: newStatus } : assignment
    );
    saveAssignments(updatedAssignments);
    return updatedAssignments;
  } catch (error) {
    console.error('Error updating assignment status:', error);
    return [];
  }
};

export const groupAssignmentsByDate = (assignments) => {
  return assignments.reduce((acc, assignment) => {
    const dateKey = assignment.dueDate.split('T')[0];
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(assignment);
    return acc;
  }, {});
};

export const generateCalendarDates = (year, month) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const dates = [];
  
  // Add days from previous month
  const firstDayOfWeek = firstDay.getDay();
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month, -i);
    dates.push({
      date,
      day: date.getDate(),
      isCurrentMonth: false,
      isToday: isSameDay(date, new Date())
    });
  }
  
  // Add days of current month
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(year, month, day);
    dates.push({
      date,
      day,
      isCurrentMonth: true,
      isToday: isSameDay(date, new Date())
    });
  }
  
  // Add days from next month
  const remainingDays = 42 - dates.length; // 6 weeks * 7 days = 42
  for (let day = 1; day <= remainingDays; day++) {
    const date = new Date(year, month + 1, day);
    dates.push({
      date,
      day: date.getDate(),
      isCurrentMonth: false,
      isToday: isSameDay(date, new Date())
    });
  }
  
  return dates;
};

export const isSameDay = (date1, date2) => {
  return date1.getDate() === date2.getDate() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getFullYear() === date2.getFullYear();
};

export const formatAssignmentDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
};

export const sortAssignments = (assignments, sortBy) => {
  return [...assignments].sort((a, b) => {
    switch (sortBy) {
      case 'dueDate':
        return new Date(a.dueDate) - new Date(b.dueDate);
      case 'priority':
        return b.priority - a.priority;
      case 'subject':
        return a.subject.localeCompare(b.subject);
      default:
        return 0;
    }
  });
};

export const getPriorityInfo = (priority) => {
  switch (priority) {
    case 1:
      return {
        label: 'Low',
        color: '#10B981',
        bgColor: '#D1FAE5'
      };
    case 2:
      return {
        label: 'Medium',
        color: '#F59E0B',
        bgColor: '#FEF3C7'
      };
    case 3:
      return {
        label: 'High',
        color: '#EF4444',
        bgColor: '#FEE2E2'
      };
    case 4:
      return {
        label: 'Due Today',
        color: '#6366F1',
        bgColor: '#E0E7FF'
      };
    default:
      return {
        label: 'Normal',
        color: '#6B7280',
        bgColor: '#F3F4F6'
      };
  }
};

export const filterAssignments = (assignments, filters) => {
  return assignments.filter(assignment => {
    // Status filter
    if (filters.status !== 'all' && assignment.status !== filters.status) {
      return false;
    }
    
    // Subject filter
    if (filters.subject !== 'all' && assignment.subject !== filters.subject) {
      return false;
    }
    
    // Add progress filter
    if (filters.progressRange) {
      const progress = calculateAssignmentProgress(assignment);
      if (progress < filters.progressRange[0] || progress > filters.progressRange[1]) {
        return false;
      }
    }

    // Add learning outcome filter
    if (filters.learningOutcome && !assignment.learningOutcomes?.includes(filters.learningOutcome)) {
      return false;
    }
    
    // Search term
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      return (
        assignment.title.toLowerCase().includes(searchLower) ||
        assignment.description.toLowerCase().includes(searchLower) ||
        assignment.subject.toLowerCase().includes(searchLower) ||
        assignment.learningOutcomes?.some(outcome => 
          outcome.toLowerCase().includes(searchLower)
        )
      );
    }
    
    return true;
  });
};

export const generateLearningOutcomes = (subject) => {
  const outcomesBySubject = {
    'Mathematics': ['Problem Solving', 'Analytical Thinking', 'Mathematical Reasoning', 'Numerical Computation'],
    'Physics': ['Scientific Method', 'Data Analysis', 'Experimental Design', 'Physical Principles'],
    'Chemistry': ['Chemical Principles', 'Lab Techniques', 'Molecular Understanding', 'Scientific Writing'],
    'Programming': ['Code Writing', 'Problem Solving', 'Algorithm Design', 'Debugging Skills'],
    'History': ['Historical Analysis', 'Critical Thinking', 'Research Skills', 'Document Analysis']
  };
  
  return outcomesBySubject[subject] || ['Knowledge Application', 'Critical Thinking', 'Subject Mastery'];
};

export const calculateAssignmentProgress = (assignment) => {
  if (!assignment) return 0;
  
  const { milestones = [], status, submittedWork = [] } = assignment;
  
  if (status === 'completed') return 100;
  if (status === 'pending' && !milestones.length) return 0;
  
  // Calculate progress based on milestones if they exist
  if (milestones.length > 0) {
    const completedMilestones = milestones.filter(m => m.completed).length;
    return Math.round((completedMilestones / milestones.length) * 100);
  }
  
  // Calculate progress based on submitted work
  if (submittedWork.length > 0) {
    return Math.round((submittedWork.length / (assignment.expectedSubmissions || 1)) * 100);
  }
  
  // Default progress for in-progress assignments
  return status === 'in-progress' ? 25 : 0;
};

// Add validation helper
const validateAssignment = (assignment) => {
  const requiredFields = [
    'id',
    'title',
    'description',
    'subject',
    'dueDate',
    'status',
    'priority',
    'estimatedMinutes',
    'learningOutcomes',
    'milestones',
    'resources'
  ];

  const missingFields = requiredFields.filter(field => !assignment[field]);
  if (missingFields.length > 0) {
    console.warn(`Assignment missing required fields: ${missingFields.join(', ')}`);
    return false;
  }
  return true;
};

// Update the assignment generation
export const generateAssignmentWithGemini = async (subject, topics) => {
  try {
    const learningOutcomes = generateLearningOutcomes(subject);
    const selectedOutcomes = learningOutcomes.slice(0, 2);

    const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const milestones = [
      {
        id: uuidv4(),
        title: 'Research and Planning',
        completed: false,
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: uuidv4(),
        title: 'Initial Draft/Implementation',
        completed: false,
        dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: uuidv4(),
        title: 'Review and Refinement',
        completed: false,
        dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    const newAssignment = {
      id: uuidv4(),
      title: `New ${subject} Assignment`,
      description: `Auto-generated assignment for ${subject} covering ${topics}`,
      subject,
      dueDate: dueDate.toISOString(),
      status: 'pending',
      priority: Math.floor(Math.random() * 3) + 1,
      estimatedMinutes: Math.floor(Math.random() * 90) + 30,
      learningOutcomes: selectedOutcomes,
      milestones,
      expectedSubmissions: 3,
      submittedWork: [],
      resources: [
        {
          id: uuidv4(),
          title: `${subject} Reference Material`,
          type: 'reading',
          url: '#'
        },
        {
          id: uuidv4(),
          title: 'Practice Problems',
          type: 'practice',
          url: '#'
        }
      ],
      feedback: [],
      progress: 0
    };

    if (!validateAssignment(newAssignment)) {
      throw new Error('Invalid assignment generated');
    }

    return newAssignment;
  } catch (error) {
    console.error('Error generating assignment:', error);
    throw error;
  }
};

// Update analytics generation with error handling
export const generateAssignmentAnalytics = (assignments) => {
  if (!Array.isArray(assignments)) {
    throw new Error('Invalid assignments data');
  }

  try {
    const analytics = {
      totalAssignments: assignments.length,
      completedAssignments: 0,
      averageProgress: 0,
      learningOutcomeProgress: {},
      subjectProgress: {},
      upcomingDeadlines: [],
      timeSpentBySubject: {}
    };

    assignments.forEach(assignment => {
      const progress = calculateAssignmentProgress(assignment);
      
      if (assignment.status === 'completed') {
        analytics.completedAssignments++;
      }
      
      assignment.learningOutcomes?.forEach(outcome => {
        if (!analytics.learningOutcomeProgress[outcome]) {
          analytics.learningOutcomeProgress[outcome] = [];
        }
        analytics.learningOutcomeProgress[outcome].push(progress);
      });
      
      if (!analytics.subjectProgress[assignment.subject]) {
        analytics.subjectProgress[assignment.subject] = [];
      }
      analytics.subjectProgress[assignment.subject].push(progress);
      
      if (assignment.status !== 'completed') {
        analytics.upcomingDeadlines.push({
          title: assignment.title,
          dueDate: assignment.dueDate,
          progress
        });
      }
      
      if (!analytics.timeSpentBySubject[assignment.subject]) {
        analytics.timeSpentBySubject[assignment.subject] = 0;
      }
      analytics.timeSpentBySubject[assignment.subject] += assignment.estimatedMinutes || 0;
    });

    // Calculate averages
    analytics.averageProgress = assignments.length > 0
      ? assignments.reduce((sum, a) => sum + calculateAssignmentProgress(a), 0) / assignments.length
      : 0;
      
    // Average out learning outcome progress
    Object.keys(analytics.learningOutcomeProgress).forEach(outcome => {
      const scores = analytics.learningOutcomeProgress[outcome];
      analytics.learningOutcomeProgress[outcome] = 
        scores.reduce((sum, score) => sum + score, 0) / scores.length;
    });
    
    // Average out subject progress
    Object.keys(analytics.subjectProgress).forEach(subject => {
      const scores = analytics.subjectProgress[subject];
      analytics.subjectProgress[subject] = 
        scores.reduce((sum, score) => sum + score, 0) / scores.length;
    });
    
    // Sort upcoming deadlines
    analytics.upcomingDeadlines.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    
    return analytics;
  } catch (error) {
    console.error('Error generating analytics:', error);
    throw error;
  }
};

export const createAssignment = (assignmentData) => {
  try {
    const assignments = getAssignments();
    const newAssignment = {
      id: Date.now().toString(),
      title: assignmentData.title || 'New Assignment',
      description: assignmentData.description || 'Assignment description',
      status: 'pending',
      dueDate: assignmentData.dueDate || new Date().toISOString(),
      subject: assignmentData.subject || 'General'
    };
    
    const updatedAssignments = [...assignments, newAssignment];
    saveAssignments(updatedAssignments);
    return updatedAssignments;
  } catch (error) {
    console.error('Error creating assignment:', error);
    return [];
  }
}; 