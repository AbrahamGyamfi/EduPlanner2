/**
 * Advanced Recommendation Engine and Study Scheduling System
 * 
 * This module generates personalized recommendations and study schedules based on:
 * - Current academic performance
 * - Learning patterns and behavioral data
 * - Study time preferences
 * - Course difficulty and priority analysis
 * - Risk factors and improvement opportunities
 */

import { STUDY_TIME_PREFERENCES, PERFORMANCE_LEVELS } from './AdvancedCWAAnalyzer';

/**
 * Recommendation priorities enum
 */
export const RECOMMENDATION_PRIORITIES = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
};

/**
 * Study strategy types enum
 */
export const STUDY_STRATEGIES = {
  ACTIVE_RECALL: 'active_recall',
  SPACED_REPETITION: 'spaced_repetition',
  POMODORO: 'pomodoro',
  MIND_MAPPING: 'mind_mapping',
  PRACTICE_TESTING: 'practice_testing',
  ELABORATIVE_INTERROGATION: 'elaborative_interrogation',
  INTERLEAVING: 'interleaving',
  DISTRIBUTED_PRACTICE: 'distributed_practice'
};

class RecommendationEngine {
  constructor() {
    this.strategiesDatabase = this.initializeStrategiesDatabase();
    this.timeSlots = this.initializeTimeSlots();
  }

  /**
   * Initialize study strategies database with effectiveness ratings
   * @returns {Object} Strategies database
   */
  initializeStrategiesDatabase() {
    return {
      [STUDY_STRATEGIES.ACTIVE_RECALL]: {
        name: 'Active Recall',
        description: 'Test yourself frequently without looking at notes',
        effectiveness: 0.9,
        timeRequired: 'medium',
        difficulty: 'medium',
        bestFor: ['memorization', 'concept_understanding'],
        instructions: [
          'Cover your notes and try to recall key concepts',
          'Write down what you remember without looking',
          'Check your answers and identify gaps',
          'Focus extra attention on missed concepts'
        ]
      },
      [STUDY_STRATEGIES.SPACED_REPETITION]: {
        name: 'Spaced Repetition',
        description: 'Review material at increasing intervals',
        effectiveness: 0.85,
        timeRequired: 'long',
        difficulty: 'easy',
        bestFor: ['memorization', 'long_term_retention'],
        instructions: [
          'Review new material after 1 day',
          'Review again after 3 days',
          'Review after 1 week',
          'Continue with increasing intervals'
        ]
      },
      [STUDY_STRATEGIES.POMODORO]: {
        name: 'Pomodoro Technique',
        description: 'Study in focused 25-minute intervals with breaks',
        effectiveness: 0.75,
        timeRequired: 'flexible',
        difficulty: 'easy',
        bestFor: ['focus_improvement', 'time_management'],
        instructions: [
          'Set timer for 25 minutes of focused study',
          'Take a 5-minute break',
          'Repeat 4 times, then take a longer 15-30 minute break',
          'Track completed pomodoros'
        ]
      },
      [STUDY_STRATEGIES.MIND_MAPPING]: {
        name: 'Mind Mapping',
        description: 'Create visual representations of information',
        effectiveness: 0.7,
        timeRequired: 'medium',
        difficulty: 'easy',
        bestFor: ['visual_learning', 'concept_connections'],
        instructions: [
          'Start with main topic in the center',
          'Branch out with related subtopics',
          'Use colors and symbols for better recall',
          'Review and refine the map regularly'
        ]
      },
      [STUDY_STRATEGIES.PRACTICE_TESTING]: {
        name: 'Practice Testing',
        description: 'Take practice exams and quizzes regularly',
        effectiveness: 0.88,
        timeRequired: 'medium',
        difficulty: 'medium',
        bestFor: ['exam_preparation', 'knowledge_assessment'],
        instructions: [
          'Find or create practice questions',
          'Take tests under timed conditions',
          'Review incorrect answers thoroughly',
          'Identify patterns in mistakes'
        ]
      },
      [STUDY_STRATEGIES.ELABORATIVE_INTERROGATION]: {
        name: 'Elaborative Interrogation',
        description: 'Ask "why" and "how" questions about material',
        effectiveness: 0.65,
        timeRequired: 'medium',
        difficulty: 'medium',
        bestFor: ['deep_understanding', 'critical_thinking'],
        instructions: [
          'Ask "why is this true?" for each concept',
          'Explain concepts in your own words',
          'Connect new information to existing knowledge',
          'Seek deeper explanations for facts'
        ]
      },
      [STUDY_STRATEGIES.INTERLEAVING]: {
        name: 'Interleaving',
        description: 'Mix different topics in study sessions',
        effectiveness: 0.72,
        timeRequired: 'medium',
        difficulty: 'hard',
        bestFor: ['problem_solving', 'discrimination_learning'],
        instructions: [
          'Study different but related topics in one session',
          'Switch between topics every 15-20 minutes',
          'Compare and contrast different concepts',
          'Practice identifying which method to use for problems'
        ]
      },
      [STUDY_STRATEGIES.DISTRIBUTED_PRACTICE]: {
        name: 'Distributed Practice',
        description: 'Spread study sessions over time rather than cramming',
        effectiveness: 0.8,
        timeRequired: 'long',
        difficulty: 'easy',
        bestFor: ['long_term_retention', 'exam_preparation'],
        instructions: [
          'Plan study sessions well in advance',
          'Study for shorter periods more frequently',
          'Review previously learned material regularly',
          'Avoid cramming before exams'
        ]
      }
    };
  }

  /**
   * Initialize time slots for scheduling
   * @returns {Object} Time slots configuration
   */
  initializeTimeSlots() {
    return {
      [STUDY_TIME_PREFERENCES.DAWN]: {
        name: 'Dawn',
        timeRange: '5:00 AM - 7:00 AM',
        characteristics: ['high_focus', 'minimal_distractions', 'fresh_mind'],
        energyLevel: 'high',
        bestFor: ['difficult_concepts', 'memorization', 'planning']
      },
      [STUDY_TIME_PREFERENCES.MORNING]: {
        name: 'Morning',
        timeRange: '7:00 AM - 11:00 AM',
        characteristics: ['peak_cognitive_performance', 'good_retention', 'alert'],
        energyLevel: 'very_high',
        bestFor: ['complex_problem_solving', 'new_concepts', 'critical_thinking']
      },
      [STUDY_TIME_PREFERENCES.AFTERNOON]: {
        name: 'Afternoon',
        timeRange: '12:00 PM - 5:00 PM',
        characteristics: ['moderate_focus', 'post_lunch_dip', 'collaborative'],
        energyLevel: 'medium',
        bestFor: ['review', 'group_study', 'practice_problems']
      },
      [STUDY_TIME_PREFERENCES.EVENING]: {
        name: 'Evening',
        timeRange: '6:00 PM - 10:00 PM',
        characteristics: ['relaxed_learning', 'reflection', 'consolidation'],
        energyLevel: 'medium',
        bestFor: ['review', 'light_reading', 'reflection']
      }
    };
  }

  /**
   * Generate comprehensive actionable recommendations
   * @param {Object} currentCWA - Current CWA analysis
   * @param {Object} projectedCWA - Projected CWA analysis
   * @param {Object} performanceTrend - Performance trend analysis
   * @param {Object} systemData - All system data
   * @returns {Object} Actionable recommendations
   */
  generateActionableRecommendations(currentCWA, projectedCWA, performanceTrend, systemData) {
    const recommendations = {
      immediate: [],
      shortTerm: [],
      longTerm: [],
      studyStrategies: [],
      timeManagement: [],
      summary: {
        totalRecommendations: 0,
        criticalActions: 0,
        estimatedImpact: 'medium'
      }
    };

    // Generate immediate actions (next 1-2 weeks)
    recommendations.immediate = this.generateImmediateActions(currentCWA, performanceTrend, systemData);

    // Generate short-term goals (1-2 months)
    recommendations.shortTerm = this.generateShortTermGoals(currentCWA, projectedCWA, performanceTrend, systemData);

    // Generate long-term strategies (semester/year)
    recommendations.longTerm = this.generateLongTermStrategies(currentCWA, projectedCWA, systemData);

    // Generate study strategies
    recommendations.studyStrategies = this.generateStudyStrategies(currentCWA, performanceTrend, systemData);

    // Generate time management recommendations
    recommendations.timeManagement = this.generateTimeManagementRecommendations(systemData, performanceTrend);

    // Calculate summary
    recommendations.summary = this.calculateRecommendationsSummary(recommendations);

    return recommendations;
  }

  /**
   * Generate immediate actions (1-2 weeks)
   * @param {Object} currentCWA - Current CWA analysis
   * @param {Object} performanceTrend - Performance trend analysis
   * @param {Object} systemData - System data
   * @returns {Array} Immediate actions
   */
  generateImmediateActions(currentCWA, performanceTrend, systemData) {
    const actions = [];

    // Critical CWA situations
    if (currentCWA.cwa < 60) {
      actions.push({
        id: 'critical_cwa_intervention',
        priority: RECOMMENDATION_PRIORITIES.CRITICAL,
        title: 'Immediate Academic Intervention Required',
        description: 'Your CWA is below the minimum requirement. Immediate action is needed.',
        actions: [
          'Schedule meeting with academic advisor immediately',
          'Identify courses that can be improved this semester',
          'Consider dropping courses if withdrawal deadline hasn\'t passed',
          'Seek tutoring for struggling courses'
        ],
        timeframe: '1-3 days',
        impact: 'very_high',
        effort: 'high'
      });
    }

    // Overdue assignments
    const overdueAssignments = systemData.assignments?.filter(a => a.status === 'overdue') || [];
    if (overdueAssignments.length > 0) {
      actions.push({
        id: 'overdue_assignments',
        priority: RECOMMENDATION_PRIORITIES.HIGH,
        title: `Complete ${overdueAssignments.length} Overdue Assignment(s)`,
        description: 'You have overdue assignments that need immediate attention.',
        actions: [
          'Contact instructors to explain delays and request extensions',
          'Prioritize assignments by weight and impact on final grade',
          'Complete highest-impact assignments first',
          'Set up daily progress check-ins'
        ],
        timeframe: '1-7 days',
        impact: 'high',
        effort: 'high',
        assignments: overdueAssignments.map(a => a.name)
      });
    }

    // Assignments due soon
    const dueSoonAssignments = systemData.assignments?.filter(a => a.status === 'due_soon') || [];
    if (dueSoonAssignments.length > 0) {
      actions.push({
        id: 'upcoming_assignments',
        priority: RECOMMENDATION_PRIORITIES.HIGH,
        title: `Prioritize ${dueSoonAssignments.length} Upcoming Assignment(s)`,
        description: 'You have assignments due within a week.',
        actions: [
          'Create detailed completion timeline for each assignment',
          'Break down assignments into smaller, manageable tasks',
          'Allocate specific time blocks for each assignment',
          'Set up progress milestones'
        ],
        timeframe: '1-7 days',
        impact: 'high',
        effort: 'medium',
        assignments: dueSoonAssignments.map(a => a.name)
      });
    }

    // Declining courses intervention
    const decliningCourses = currentCWA.courseBreakdown.filter(c => c.trend === 'declining');
    if (decliningCourses.length > 0) {
      actions.push({
        id: 'declining_courses_intervention',
        priority: RECOMMENDATION_PRIORITIES.HIGH,
        title: 'Address Declining Course Performance',
        description: `${decliningCourses.length} course(s) showing declining performance.`,
        actions: [
          'Schedule office hours with instructors',
          'Join study groups for these courses',
          'Increase study time allocation',
          'Seek additional resources (tutoring, online materials)'
        ],
        timeframe: '1-2 weeks',
        impact: 'high',
        effort: 'medium',
        courses: decliningCourses.map(c => c.courseName)
      });
    }

    // Study consistency issues
    const avgConsistency = currentCWA.courseBreakdown.reduce((sum, c) => sum + c.studyConsistency, 0) / currentCWA.courseBreakdown.length;
    if (avgConsistency < 50) {
      actions.push({
        id: 'improve_study_consistency',
        priority: RECOMMENDATION_PRIORITIES.MEDIUM,
        title: 'Establish Consistent Study Routine',
        description: 'Your study patterns are inconsistent, affecting performance.',
        actions: [
          'Set fixed daily study times',
          'Use study tracking apps or calendars',
          'Start with small, achievable study sessions',
          'Gradually increase study time'
        ],
        timeframe: '1-2 weeks',
        impact: 'medium',
        effort: 'low'
      });
    }

    return actions.sort((a, b) => this.getPriorityWeight(a.priority) - this.getPriorityWeight(b.priority));
  }

  /**
   * Generate short-term goals (1-2 months)
   * @param {Object} currentCWA - Current CWA analysis
   * @param {Object} projectedCWA - Projected CWA analysis
   * @param {Object} performanceTrend - Performance trend analysis
   * @param {Object} systemData - System data
   * @returns {Array} Short-term goals
   */
  generateShortTermGoals(currentCWA, projectedCWA, performanceTrend, systemData) {
    const goals = [];

    // CWA improvement target
    if (projectedCWA.changeDirection === 'improving') {
      const targetImprovement = Math.min(10, projectedCWA.change + 2);
      goals.push({
        id: 'cwa_improvement_target',
        priority: RECOMMENDATION_PRIORITIES.HIGH,
        title: `Improve CWA by ${targetImprovement.toFixed(1)} Points`,
        description: 'Based on current trends, this improvement is achievable.',
        actions: [
          'Focus on courses with highest improvement potential',
          'Implement recommended study strategies consistently',
          'Track progress weekly',
          'Adjust strategies based on results'
        ],
        targetValue: currentCWA.cwa + targetImprovement,
        currentValue: currentCWA.cwa,
        timeframe: '6-8 weeks',
        impact: 'high',
        effort: 'medium'
      });
    }

    // Course-specific improvements
    const improvableCourses = currentCWA.courseBreakdown.filter(c => 
      c.averageScore < 85 && c.trend !== 'declining'
    );

    improvableCourses.slice(0, 3).forEach(course => {
      const targetScore = Math.min(95, course.averageScore + 8);
      goals.push({
        id: `improve_${course.courseId}`,
        priority: RECOMMENDATION_PRIORITIES.MEDIUM,
        title: `Improve ${course.courseName} Grade`,
        description: `Target: ${targetScore}% (current: ${course.averageScore}%)`,
        actions: [
          'Increase weekly study time for this course',
          'Complete all assignments with high quality',
          'Attend office hours regularly',
          'Form study group with classmates'
        ],
        targetValue: targetScore,
        currentValue: course.averageScore,
        timeframe: '4-6 weeks',
        impact: 'medium',
        effort: 'medium',
        course: course.courseName
      });
    });

    // Study habit improvements
    if (systemData.behaviorData) {
      const { procrastinationLevel, studyConsistency } = systemData.behaviorData;
      
      if (procrastinationLevel > 7) {
        goals.push({
          id: 'reduce_procrastination',
          priority: RECOMMENDATION_PRIORITIES.MEDIUM,
          title: 'Reduce Procrastination Level',
          description: 'Lower procrastination to improve productivity and reduce stress.',
          actions: [
            'Use time-blocking technique',
            'Break large tasks into smaller ones',
            'Set personal deadlines earlier than actual deadlines',
            'Implement accountability systems'
          ],
          targetValue: 5,
          currentValue: procrastinationLevel,
          timeframe: '4-6 weeks',
          impact: 'medium',
          effort: 'medium'
        });
      }

      if (studyConsistency < 70) {
        goals.push({
          id: 'improve_consistency',
          priority: RECOMMENDATION_PRIORITIES.MEDIUM,
          title: 'Increase Study Consistency',
          description: 'Develop regular study habits for better learning retention.',
          actions: [
            'Set same study times each day',
            'Use habit tracking apps',
            'Start with 30-minute daily sessions',
            'Gradually increase duration'
          ],
          targetValue: 80,
          currentValue: studyConsistency,
          timeframe: '4-6 weeks',
          impact: 'medium',
          effort: 'low'
        });
      }
    }

    return goals.sort((a, b) => this.getPriorityWeight(a.priority) - this.getPriorityWeight(b.priority));
  }

  /**
   * Generate long-term strategies (semester/year)
   * @param {Object} currentCWA - Current CWA analysis
   * @param {Object} projectedCWA - Projected CWA analysis
   * @param {Object} systemData - System data
   * @returns {Array} Long-term strategies
   */
  generateLongTermStrategies(currentCWA, projectedCWA, systemData) {
    const strategies = [];

    // Academic standing improvement
    const currentStanding = currentCWA.academicStanding.level;
    if (currentStanding !== 'First Class Honours') {
      strategies.push({
        id: 'academic_standing_improvement',
        priority: RECOMMENDATION_PRIORITIES.HIGH,
        title: 'Achieve Higher Academic Standing',
        description: `Work towards improving from ${currentStanding} to next level.`,
        actions: [
          'Maintain consistent high performance across all courses',
          'Seek opportunities for extra credit or advanced coursework',
          'Build strong relationships with faculty',
          'Consider research opportunities or honors programs'
        ],
        timeframe: '1-2 semesters',
        impact: 'very_high',
        effort: 'high'
      });
    }

    // Skill development based on weak areas
    const weakCourses = currentCWA.courseBreakdown.filter(c => c.performanceLevel === PERFORMANCE_LEVELS.AT_RISK || c.performanceLevel === PERFORMANCE_LEVELS.CRITICAL);
    if (weakCourses.length > 0) {
      strategies.push({
        id: 'skill_development',
        priority: RECOMMENDATION_PRIORITIES.MEDIUM,
        title: 'Develop Foundational Skills',
        description: 'Strengthen core competencies in challenging subject areas.',
        actions: [
          'Identify fundamental concepts that need reinforcement',
          'Take supplementary courses or workshops',
          'Work with tutors or mentors long-term',
          'Practice regularly with varied problem sets'
        ],
        timeframe: '1-2 semesters',
        impact: 'high',
        effort: 'high',
        weakAreas: weakCourses.map(c => c.courseName)
      });
    }

    // Study system optimization
    strategies.push({
      id: 'study_system_optimization',
      priority: RECOMMENDATION_PRIORITIES.MEDIUM,
      title: 'Optimize Personal Learning System',
      description: 'Develop and refine personalized study methods and tools.',
      actions: [
        'Experiment with different study techniques',
        'Track what works best for different types of content',
        'Build personal knowledge management system',
        'Regularly evaluate and adjust strategies'
      ],
      timeframe: 'Ongoing',
      impact: 'medium',
      effort: 'medium'
    });

    // Career preparation alignment
    if (currentCWA.cwa > 70) {
      strategies.push({
        id: 'career_preparation',
        priority: RECOMMENDATION_PRIORITIES.LOW,
        title: 'Align Studies with Career Goals',
        description: 'Focus on courses and skills relevant to career objectives.',
        actions: [
          'Research industry requirements and trends',
          'Take electives that align with career goals',
          'Seek internships and practical experience',
          'Build portfolio of relevant projects'
        ],
        timeframe: '2-4 semesters',
        impact: 'high',
        effort: 'medium'
      });
    }

    return strategies.sort((a, b) => this.getPriorityWeight(a.priority) - this.getPriorityWeight(b.priority));
  }

  /**
   * Generate personalized study strategies
   * @param {Object} currentCWA - Current CWA analysis
   * @param {Object} performanceTrend - Performance trend analysis
   * @param {Object} systemData - System data
   * @returns {Array} Study strategies
   */
  generateStudyStrategies(currentCWA, performanceTrend, systemData) {
    const strategies = [];
    const studentProfile = systemData.studentProfile;
    const behaviorData = systemData.behaviorData;

    // Analyze learning patterns and recommend strategies
    const learningProfile = this.analyzeLearningProfile(currentCWA, behaviorData, studentProfile);

    // Select strategies based on learning profile
    const recommendedStrategies = this.selectStrategiesForProfile(learningProfile);

    recommendedStrategies.forEach(strategyKey => {
      const strategy = this.strategiesDatabase[strategyKey];
      const customization = this.customizeStrategyForStudent(strategy, learningProfile, currentCWA);

      strategies.push({
        id: strategyKey,
        name: strategy.name,
        description: strategy.description,
        effectiveness: strategy.effectiveness,
        priority: this.calculateStrategyPriority(strategy, learningProfile),
        instructions: strategy.instructions,
        customInstructions: customization.instructions,
        timeAllocation: customization.timeAllocation,
        bestCourses: customization.bestCourses,
        expectedImpact: customization.expectedImpact,
        implementationTips: customization.implementationTips
      });
    });

    return strategies.sort((a, b) => this.getPriorityWeight(a.priority) - this.getPriorityWeight(b.priority));
  }

  /**
   * Analyze student's learning profile
   * @param {Object} currentCWA - Current CWA analysis
   * @param {Object} behaviorData - Behavior data
   * @param {Object} studentProfile - Student profile
   * @returns {Object} Learning profile
   */
  analyzeLearningProfile(currentCWA, behaviorData, studentProfile) {
    const profile = {
      strengths: [],
      weaknesses: [],
      learningStyle: 'mixed',
      focusLevel: 'medium',
      consistencyLevel: 'medium',
      timeAvailability: 'medium',
      stressLevel: 'medium',
      procrastinationTendency: 'medium'
    };

    // Analyze strengths and weaknesses from course performance
    const excellentCourses = currentCWA.courseBreakdown.filter(c => c.performanceLevel === PERFORMANCE_LEVELS.EXCELLENT);
    const weakCourses = currentCWA.courseBreakdown.filter(c => 
      c.performanceLevel === PERFORMANCE_LEVELS.AT_RISK || c.performanceLevel === PERFORMANCE_LEVELS.CRITICAL
    );

    profile.strengths = excellentCourses.map(c => c.courseName);
    profile.weaknesses = weakCourses.map(c => c.courseName);

    // Analyze behavioral patterns
    if (behaviorData) {
      profile.consistencyLevel = behaviorData.studyConsistency > 70 ? 'high' : 
                                behaviorData.studyConsistency > 40 ? 'medium' : 'low';
      
      profile.procrastinationTendency = behaviorData.procrastinationLevel > 7 ? 'high' :
                                       behaviorData.procrastinationLevel > 4 ? 'medium' : 'low';
    }

    // Analyze from student profile
    if (studentProfile) {
      profile.stressLevel = studentProfile.stressLevel > 7 ? 'high' :
                           studentProfile.stressLevel > 4 ? 'medium' : 'low';
      
      profile.timeAvailability = studentProfile.studyHoursPerWeek > 20 ? 'high' :
                                studentProfile.studyHoursPerWeek > 10 ? 'medium' : 'low';
    }

    return profile;
  }

  /**
   * Select appropriate strategies for learning profile
   * @param {Object} learningProfile - Student's learning profile
   * @returns {Array} Recommended strategy keys
   */
  selectStrategiesForProfile(learningProfile) {
    const strategies = [];

    // Always recommend high-effectiveness strategies
    strategies.push(STUDY_STRATEGIES.ACTIVE_RECALL);
    strategies.push(STUDY_STRATEGIES.PRACTICE_TESTING);

    // Add strategies based on specific needs
    if (learningProfile.procrastinationTendency === 'high') {
      strategies.push(STUDY_STRATEGIES.POMODORO);
    }

    if (learningProfile.consistencyLevel === 'low') {
      strategies.push(STUDY_STRATEGIES.DISTRIBUTED_PRACTICE);
      strategies.push(STUDY_STRATEGIES.SPACED_REPETITION);
    }

    if (learningProfile.weaknesses.length > 2) {
      strategies.push(STUDY_STRATEGIES.INTERLEAVING);
    }

    if (learningProfile.timeAvailability === 'low') {
      strategies.push(STUDY_STRATEGIES.POMODORO);
    }

    // Add visual strategy if it might help
    strategies.push(STUDY_STRATEGIES.MIND_MAPPING);

    return [...new Set(strategies)]; // Remove duplicates
  }

  /**
   * Customize strategy for specific student
   * @param {Object} strategy - Base strategy
   * @param {Object} learningProfile - Student's learning profile
   * @param {Object} currentCWA - Current CWA analysis
   * @returns {Object} Customized strategy
   */
  customizeStrategyForStudent(strategy, learningProfile, currentCWA) {
    const customization = {
      instructions: [...strategy.instructions],
      timeAllocation: 'medium',
      bestCourses: [],
      expectedImpact: 'medium',
      implementationTips: []
    };

    // Customize based on time availability
    if (learningProfile.timeAvailability === 'low') {
      customization.timeAllocation = 'short';
      customization.implementationTips.push('Start with 15-20 minute sessions');
    } else if (learningProfile.timeAvailability === 'high') {
      customization.timeAllocation = 'extended';
      customization.implementationTips.push('Can dedicate longer sessions for better results');
    }

    // Customize for specific courses
    if (learningProfile.weaknesses.length > 0) {
      customization.bestCourses = learningProfile.weaknesses;
      customization.expectedImpact = 'high';
      customization.implementationTips.push(`Focus on challenging courses: ${learningProfile.weaknesses.join(', ')}`);
    }

    // Add stress-specific tips
    if (learningProfile.stressLevel === 'high') {
      customization.implementationTips.push('Take frequent breaks to manage stress levels');
      customization.implementationTips.push('Consider meditation or breathing exercises between study sessions');
    }

    // Add procrastination-specific tips
    if (learningProfile.procrastinationTendency === 'high') {
      customization.implementationTips.push('Set up accountability measures');
      customization.implementationTips.push('Use apps or tools to block distractions');
    }

    return customization;
  }

  /**
   * Calculate priority for a strategy
   * @param {Object} strategy - Strategy object
   * @param {Object} learningProfile - Learning profile
   * @returns {string} Priority level
   */
  calculateStrategyPriority(strategy, learningProfile) {
    let score = strategy.effectiveness;

    // Boost priority for strategies that address specific weaknesses
    if (learningProfile.procrastinationTendency === 'high' && strategy.bestFor.includes('time_management')) {
      score += 0.2;
    }

    if (learningProfile.consistencyLevel === 'low' && strategy.bestFor.includes('long_term_retention')) {
      score += 0.2;
    }

    if (learningProfile.weaknesses.length > 2 && strategy.bestFor.includes('concept_understanding')) {
      score += 0.15;
    }

    if (score > 0.85) return RECOMMENDATION_PRIORITIES.HIGH;
    if (score > 0.7) return RECOMMENDATION_PRIORITIES.MEDIUM;
    return RECOMMENDATION_PRIORITIES.LOW;
  }

  /**
   * Generate time management recommendations
   * @param {Object} systemData - System data
   * @param {Object} performanceTrend - Performance trend analysis
   * @returns {Array} Time management recommendations
   */
  generateTimeManagementRecommendations(systemData, performanceTrend) {
    const recommendations = [];
    const studentProfile = systemData.studentProfile;
    const behaviorData = systemData.behaviorData;

    // Study time optimization
    if (studentProfile) {
      const currentHours = studentProfile.studyHoursPerWeek || 0;
      const totalCreditHours = systemData.courses.reduce((sum, course) => sum + course.creditHours, 0);
      const recommendedHours = totalCreditHours * 2;

      if (currentHours < recommendedHours * 0.8) {
        recommendations.push({
          id: 'increase_study_time',
          priority: RECOMMENDATION_PRIORITIES.HIGH,
          title: 'Increase Weekly Study Hours',
          description: `Current: ${currentHours}h/week, Recommended: ${recommendedHours}h/week`,
          actions: [
            'Gradually increase study time by 2-3 hours per week',
            'Identify and eliminate time-wasting activities',
            'Use time-blocking to schedule study sessions',
            'Track actual time spent studying'
          ],
          impact: 'high',
          effort: 'medium'
        });
      }
    }

    // Procrastination management
    if (behaviorData && behaviorData.procrastinationLevel > 6) {
      recommendations.push({
        id: 'procrastination_management',
        priority: RECOMMENDATION_PRIORITIES.HIGH,
        title: 'Implement Anti-Procrastination Strategies',
        description: 'High procrastination level is affecting your productivity.',
        actions: [
          'Use the "2-minute rule" for small tasks',
          'Break large assignments into smaller, manageable chunks',
          'Set artificial deadlines 2-3 days before real deadlines',
          'Use apps to block distracting websites during study time'
        ],
        impact: 'high',
        effort: 'medium'
      });
    }

    // Priority management
    const courses = systemData.courses || [];
    if (courses.length > 4) {
      recommendations.push({
        id: 'priority_management',
        priority: RECOMMENDATION_PRIORITIES.MEDIUM,
        title: 'Implement Course Priority System',
        description: 'With multiple courses, prioritization is crucial.',
        actions: [
          'Rank courses by difficulty and importance',
          'Allocate study time based on course credit hours and performance',
          'Focus extra time on courses where improvement is most needed',
          'Use matrix system (urgent/important) for assignments'
        ],
        impact: 'medium',
        effort: 'low'
      });
    }

    // Schedule optimization
    recommendations.push({
      id: 'schedule_optimization',
      priority: RECOMMENDATION_PRIORITIES.MEDIUM,
      title: 'Optimize Study Schedule',
      description: 'Create an efficient and sustainable study routine.',
      actions: [
        'Identify your peak productivity hours',
        'Schedule most challenging subjects during peak hours',
        'Include regular breaks and buffer time',
        'Plan weekly and daily study goals'
      ],
      impact: 'medium',
      effort: 'medium'
    });

    return recommendations.sort((a, b) => this.getPriorityWeight(a.priority) - this.getPriorityWeight(b.priority));
  }

  /**
   * Generate personalized study schedule
   * @param {Object} currentCWA - Current CWA analysis
   * @param {Object} systemData - System data
   * @param {Object} recommendations - Generated recommendations
   * @returns {Object} Personalized study schedule
   */
  generatePersonalizedStudySchedule(currentCWA, systemData, recommendations) {
    const schedule = {
      weeklySchedule: [],
      dailyRecommendations: [],
      preferredTimes: [],
      focusAreas: [],
      summary: {
        totalWeeklyHours: 0,
        coursePriorities: [],
        timeDistribution: {}
      }
    };

    // Determine preferred study times
    schedule.preferredTimes = this.determinePreferredStudyTimes(systemData);

    // Calculate time allocation for each course
    const timeAllocation = this.calculateCourseTimeAllocation(currentCWA, systemData);

    // Generate weekly schedule
    schedule.weeklySchedule = this.generateWeeklySchedule(timeAllocation, schedule.preferredTimes, systemData);

    // Generate daily recommendations
    schedule.dailyRecommendations = this.generateDailyRecommendations(currentCWA, timeAllocation);

    // Identify focus areas
    schedule.focusAreas = this.identifyScheduleFocusAreas(currentCWA, recommendations);

    // Calculate summary
    schedule.summary = this.calculateScheduleSummary(schedule, timeAllocation);

    return schedule;
  }

  /**
   * Determine preferred study times based on profile and behavior
   * @param {Object} systemData - System data
   * @returns {Array} Preferred time slots
   */
  determinePreferredStudyTimes(systemData) {
    const preferences = [];
    const studentProfile = systemData.studentProfile;

    // If user has specified preferences, use those
    if (studentProfile && studentProfile.preferredStudyTimes) {
      return studentProfile.preferredStudyTimes.map(time => ({
        slot: time,
        ...this.timeSlots[time],
        reason: 'user_preference'
      }));
    }

    // Otherwise, infer from behavior patterns or use defaults
    const studySessions = systemData.studySessions || [];
    if (studySessions.length > 5) {
      // Analyze when user actually studies
      const timeAnalysis = this.analyzeStudyTimePatterns(studySessions);
      return timeAnalysis.preferredTimes;
    }

    // Default recommendations based on research
    preferences.push({
      slot: STUDY_TIME_PREFERENCES.MORNING,
      ...this.timeSlots[STUDY_TIME_PREFERENCES.MORNING],
      reason: 'optimal_cognitive_performance'
    });

    preferences.push({
      slot: STUDY_TIME_PREFERENCES.EVENING,
      ...this.timeSlots[STUDY_TIME_PREFERENCES.EVENING],
      reason: 'review_and_consolidation'
    });

    return preferences;
  }

  /**
   * Analyze study time patterns from historical data
   * @param {Array} studySessions - Historical study sessions
   * @returns {Object} Time analysis results
   */
  analyzeStudyTimePatterns(studySessions) {
    const timeSlotCounts = {
      [STUDY_TIME_PREFERENCES.DAWN]: 0,
      [STUDY_TIME_PREFERENCES.MORNING]: 0,
      [STUDY_TIME_PREFERENCES.AFTERNOON]: 0,
      [STUDY_TIME_PREFERENCES.EVENING]: 0
    };

    studySessions.forEach(session => {
      const hour = new Date(session.timestamp).getHours();
      let timeSlot;

      if (hour >= 5 && hour < 7) timeSlot = STUDY_TIME_PREFERENCES.DAWN;
      else if (hour >= 7 && hour < 12) timeSlot = STUDY_TIME_PREFERENCES.MORNING;
      else if (hour >= 12 && hour < 17) timeSlot = STUDY_TIME_PREFERENCES.AFTERNOON;
      else timeSlot = STUDY_TIME_PREFERENCES.EVENING;

      timeSlotCounts[timeSlot]++;
    });

    // Sort by frequency and return top preferences
    const sortedTimes = Object.entries(timeSlotCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2)
      .map(([timeSlot]) => ({
        slot: timeSlot,
        ...this.timeSlots[timeSlot],
        reason: 'historical_pattern'
      }));

    return { preferredTimes: sortedTimes };
  }

  /**
   * Calculate time allocation for each course
   * @param {Object} currentCWA - Current CWA analysis
   * @param {Object} systemData - System data
   * @returns {Object} Time allocation per course
   */
  calculateCourseTimeAllocation(currentCWA, systemData) {
    const allocation = {};
    const studentProfile = systemData.studentProfile;
    const totalAvailableHours = studentProfile?.studyHoursPerWeek || 
      (currentCWA.totalCreditHours * 2); // Default: 2 hours per credit hour

    let totalWeightedPriority = 0;

    // Calculate priority weights for each course
    const coursePriorities = currentCWA.courseBreakdown.map(course => {
      let priority = course.creditHours; // Base on credit hours

      // Adjust based on performance level
      if (course.performanceLevel === PERFORMANCE_LEVELS.CRITICAL) priority *= 2.5;
      else if (course.performanceLevel === PERFORMANCE_LEVELS.AT_RISK) priority *= 2.0;
      else if (course.performanceLevel === PERFORMANCE_LEVELS.SATISFACTORY) priority *= 1.5;
      else if (course.performanceLevel === PERFORMANCE_LEVELS.GOOD) priority *= 1.2;

      // Adjust based on trend
      if (course.trend === 'declining') priority *= 1.5;
      else if (course.trend === 'improving') priority *= 0.9;

      totalWeightedPriority += priority;

      return { ...course, priority };
    });

    // Allocate time based on weighted priorities
    coursePriorities.forEach(course => {
      const timePercentage = course.priority / totalWeightedPriority;
      const allocatedHours = Math.round(totalAvailableHours * timePercentage * 100) / 100;

      allocation[course.courseId] = {
        courseName: course.courseName,
        weeklyHours: Math.max(1, allocatedHours), // Minimum 1 hour per course
        priority: course.priority,
        reason: this.generateAllocationReason(course),
        sessions: Math.ceil(allocatedHours / 2), // Assume 2-hour sessions
        focusAreas: this.identifyCourseFocusAreas(course)
      };
    });

    return allocation;
  }

  /**
   * Generate reason for time allocation
   * @param {Object} course - Course data
   * @returns {string} Allocation reason
   */
  generateAllocationReason(course) {
    const reasons = [];

    if (course.performanceLevel === PERFORMANCE_LEVELS.CRITICAL) {
      reasons.push('critical performance level');
    } else if (course.performanceLevel === PERFORMANCE_LEVELS.AT_RISK) {
      reasons.push('at-risk performance');
    }

    if (course.trend === 'declining') {
      reasons.push('declining trend');
    }

    if (course.creditHours > 3) {
      reasons.push('high credit hours');
    }

    if (reasons.length === 0) {
      reasons.push('standard allocation');
    }

    return reasons.join(', ');
  }

  /**
   * Identify focus areas for a course
   * @param {Object} course - Course data
   * @returns {Array} Focus areas
   */
  identifyCourseFocusAreas(course) {
    const focusAreas = [];

    if (course.assignmentsCompleted < course.totalAssignments) {
      focusAreas.push('Complete pending assignments');
    }

    if (course.performanceLevel === PERFORMANCE_LEVELS.CRITICAL || course.performanceLevel === PERFORMANCE_LEVELS.AT_RISK) {
      focusAreas.push('Review fundamental concepts');
      focusAreas.push('Seek additional help');
    }

    if (course.studyConsistency < 50) {
      focusAreas.push('Establish regular study routine');
    }

    if (course.trend === 'declining') {
      focusAreas.push('Identify and address knowledge gaps');
    }

    if (focusAreas.length === 0) {
      focusAreas.push('Maintain current performance');
      focusAreas.push('Prepare for upcoming assessments');
    }

    return focusAreas;
  }

  /**
   * Generate weekly study schedule
   * @param {Object} timeAllocation - Time allocation per course
   * @param {Array} preferredTimes - Preferred study times
   * @param {Object} systemData - System data
   * @returns {Array} Weekly schedule
   */
  generateWeeklySchedule(timeAllocation, preferredTimes, systemData) {
    const schedule = [];
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    // Get courses sorted by priority
    const courses = Object.values(timeAllocation).sort((a, b) => b.priority - a.priority);
    
    daysOfWeek.forEach(day => {
      const daySchedule = {
        day: day,
        sessions: [],
        totalHours: 0
      };

      // Distribute courses across days, prioritizing high-priority courses
      let sessionIndex = 0;
      preferredTimes.forEach(timeSlot => {
        const coursesForSlot = courses.filter(course => course.weeklyHours > 0);
        
        if (coursesForSlot.length > sessionIndex) {
          const course = coursesForSlot[sessionIndex];
          const sessionDuration = Math.min(2, course.weeklyHours); // Max 2 hours per session

          daySchedule.sessions.push({
            timeSlot: timeSlot.slot,
            timeRange: timeSlot.timeRange,
            course: course.courseName,
            duration: sessionDuration,
            focusArea: course.focusAreas[0] || 'General study',
            energy: timeSlot.energyLevel,
            activities: this.generateSessionActivities(course, timeSlot, sessionDuration)
          });

          daySchedule.totalHours += sessionDuration;
          course.weeklyHours -= sessionDuration; // Reduce remaining hours
          sessionIndex++;
        }
      });

      schedule.push(daySchedule);
    });

    return schedule;
  }

  /**
   * Generate activities for a study session
   * @param {Object} course - Course allocation data
   * @param {Object} timeSlot - Time slot information
   * @param {number} duration - Session duration in hours
   * @returns {Array} Session activities
   */
  generateSessionActivities(course, timeSlot, duration) {
    const activities = [];

    // Warm-up activity (5-10 minutes)
    activities.push({
      activity: 'Review previous session notes',
      duration: '5-10 minutes',
      purpose: 'Warm-up and context setting'
    });

    // Main activities based on time slot characteristics
    const mainDuration = Math.max(30, (duration * 60) - 20); // Main activity duration in minutes

    if (timeSlot.energyLevel === 'very_high' || timeSlot.energyLevel === 'high') {
      activities.push({
        activity: 'Tackle new concepts or difficult problems',
        duration: `${Math.floor(mainDuration * 0.7)} minutes`,
        purpose: 'Learning new material during peak energy'
      });
      
      activities.push({
        activity: 'Practice problems or active recall',
        duration: `${Math.floor(mainDuration * 0.3)} minutes`,
        purpose: 'Reinforce understanding'
      });
    } else {
      activities.push({
        activity: 'Review and consolidate previous learning',
        duration: `${Math.floor(mainDuration * 0.6)} minutes`,
        purpose: 'Strengthen existing knowledge'
      });
      
      activities.push({
        activity: 'Light reading or organize notes',
        duration: `${Math.floor(mainDuration * 0.4)} minutes`,
        purpose: 'Less demanding consolidation'
      });
    }

    // Wrap-up activity (5-10 minutes)
    activities.push({
      activity: 'Summarize key points and plan next session',
      duration: '5-10 minutes',
      purpose: 'Consolidation and planning'
    });

    return activities;
  }

  /**
   * Generate daily recommendations
   * @param {Object} currentCWA - Current CWA analysis
   * @param {Object} timeAllocation - Time allocation data
   * @returns {Array} Daily recommendations
   */
  generateDailyRecommendations(currentCWA, timeAllocation) {
    const recommendations = [];
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    daysOfWeek.forEach(day => {
      const dayRecommendations = {
        day: day,
        focus: this.getDailyFocus(day),
        tips: this.getDailyTips(day, currentCWA),
        preparationTasks: this.getDailyPreparationTasks(day, timeAllocation)
      };

      recommendations.push(dayRecommendations);
    });

    return recommendations;
  }

  /**
   * Get daily focus theme
   * @param {string} day - Day of week
   * @returns {string} Daily focus
   */
  getDailyFocus(day) {
    const focusMap = {
      'Monday': 'Week Planning and Goal Setting',
      'Tuesday': 'Deep Work on Challenging Subjects',
      'Wednesday': 'Review and Practice',
      'Thursday': 'Assignment Completion',
      'Friday': 'Week Review and Assessment',
      'Saturday': 'Extended Study Sessions',
      'Sunday': 'Light Review and Next Week Planning'
    };

    return focusMap[day] || 'General Study';
  }

  /**
   * Get daily tips
   * @param {string} day - Day of week
   * @param {Object} currentCWA - Current CWA analysis
   * @returns {Array} Daily tips
   */
  getDailyTips(day, currentCWA) {
    const tips = [];

    switch (day) {
      case 'Monday':
        tips.push('Set weekly study goals and review your schedule');
        tips.push('Prepare materials for the week ahead');
        break;
      case 'Tuesday':
      case 'Wednesday':
        tips.push('Focus on your most challenging subjects first');
        tips.push('Take regular breaks to maintain focus');
        break;
      case 'Thursday':
        tips.push('Complete any pending assignments');
        tips.push('Prepare for upcoming deadlines');
        break;
      case 'Friday':
        tips.push('Review what you learned this week');
        tips.push('Assess progress toward your goals');
        break;
      case 'Saturday':
        tips.push('Use longer time blocks for deep learning');
        tips.push('Catch up on any missed study sessions');
        break;
      case 'Sunday':
        tips.push('Light review and organization');
        tips.push('Plan and prepare for the upcoming week');
        break;
    }

    return tips;
  }

  /**
   * Get daily preparation tasks
   * @param {string} day - Day of week  
   * @param {Object} timeAllocation - Time allocation data
   * @returns {Array} Preparation tasks
   */
  getDailyPreparationTasks(day, timeAllocation) {
    const tasks = [];

    tasks.push('Gather all materials for scheduled study sessions');
    tasks.push('Review agenda and priorities for the day');
    tasks.push('Ensure study environment is prepared and distraction-free');

    // Add course-specific tasks
    const courses = Object.values(timeAllocation);
    if (courses.length > 0) {
      const todaysCourse = courses[new Date().getDay() % courses.length];
      tasks.push(`Prepare materials for ${todaysCourse.courseName} session`);
    }

    return tasks;
  }

  /**
   * Identify schedule focus areas
   * @param {Object} currentCWA - Current CWA analysis
   * @param {Object} recommendations - Generated recommendations
   * @returns {Array} Focus areas
   */
  identifyScheduleFocusAreas(currentCWA, recommendations) {
    const focusAreas = [];

    // Critical courses
    const criticalCourses = currentCWA.courseBreakdown.filter(c => 
      c.performanceLevel === PERFORMANCE_LEVELS.CRITICAL
    );
    
    if (criticalCourses.length > 0) {
      focusAreas.push({
        area: 'Critical Course Recovery',
        courses: criticalCourses.map(c => c.courseName),
        priority: RECOMMENDATION_PRIORITIES.CRITICAL,
        timeAllocation: '40% of study time'
      });
    }

    // Declining courses
    const decliningCourses = currentCWA.courseBreakdown.filter(c => 
      c.trend === 'declining'
    );
    
    if (decliningCourses.length > 0) {
      focusAreas.push({
        area: 'Trend Reversal',
        courses: decliningCourses.map(c => c.courseName),
        priority: RECOMMENDATION_PRIORITIES.HIGH,
        timeAllocation: '30% of study time'
      });
    }

    // Improvement opportunities
    const improvableCourses = currentCWA.courseBreakdown.filter(c => 
      c.averageScore < 85 && c.trend !== 'declining'
    );
    
    if (improvableCourses.length > 0) {
      focusAreas.push({
        area: 'Grade Improvement',
        courses: improvableCourses.slice(0, 2).map(c => c.courseName),
        priority: RECOMMENDATION_PRIORITIES.MEDIUM,
        timeAllocation: '20% of study time'
      });
    }

    // Maintenance for good courses
    const goodCourses = currentCWA.courseBreakdown.filter(c => 
      c.performanceLevel === PERFORMANCE_LEVELS.GOOD || c.performanceLevel === PERFORMANCE_LEVELS.EXCELLENT
    );
    
    if (goodCourses.length > 0) {
      focusAreas.push({
        area: 'Performance Maintenance',
        courses: goodCourses.map(c => c.courseName),
        priority: RECOMMENDATION_PRIORITIES.LOW,
        timeAllocation: '10% of study time'
      });
    }

    return focusAreas;
  }

  /**
   * Calculate schedule summary
   * @param {Object} schedule - Generated schedule
   * @param {Object} timeAllocation - Time allocation data
   * @returns {Object} Schedule summary
   */
  calculateScheduleSummary(schedule, timeAllocation) {
    const totalWeeklyHours = Object.values(timeAllocation)
      .reduce((sum, course) => sum + course.weeklyHours, 0);

    const coursePriorities = Object.values(timeAllocation)
      .sort((a, b) => b.priority - a.priority)
      .map(course => ({
        course: course.courseName,
        hours: course.weeklyHours,
        priority: course.priority
      }));

    const timeDistribution = {};
    Object.values(timeAllocation).forEach(course => {
      timeDistribution[course.courseName] = {
        hours: course.weeklyHours,
        percentage: Math.round((course.weeklyHours / totalWeeklyHours) * 100)
      };
    });

    return {
      totalWeeklyHours: Math.round(totalWeeklyHours * 100) / 100,
      coursePriorities,
      timeDistribution
    };
  }

  /**
   * Calculate summary for recommendations
   * @param {Object} recommendations - All recommendations
   * @returns {Object} Summary
   */
  calculateRecommendationsSummary(recommendations) {
    const allRecommendations = [
      ...recommendations.immediate,
      ...recommendations.shortTerm,
      ...recommendations.longTerm,
      ...recommendations.studyStrategies,
      ...recommendations.timeManagement
    ];

    const criticalActions = allRecommendations.filter(r => 
      r.priority === RECOMMENDATION_PRIORITIES.CRITICAL
    ).length;

    const highPriorityActions = allRecommendations.filter(r => 
      r.priority === RECOMMENDATION_PRIORITIES.HIGH
    ).length;

    let estimatedImpact = 'low';
    if (criticalActions > 0 || highPriorityActions > 3) {
      estimatedImpact = 'high';
    } else if (highPriorityActions > 0) {
      estimatedImpact = 'medium';
    }

    return {
      totalRecommendations: allRecommendations.length,
      criticalActions,
      highPriorityActions,
      estimatedImpact
    };
  }

  /**
   * Get priority weight for sorting
   * @param {string} priority - Priority level
   * @returns {number} Weight
   */
  getPriorityWeight(priority) {
    const weights = {
      [RECOMMENDATION_PRIORITIES.CRITICAL]: 1,
      [RECOMMENDATION_PRIORITIES.HIGH]: 2,
      [RECOMMENDATION_PRIORITIES.MEDIUM]: 3,
      [RECOMMENDATION_PRIORITIES.LOW]: 4
    };
    return weights[priority] || 5;
  }
}

export default RecommendationEngine;
