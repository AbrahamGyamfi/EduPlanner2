import React, { useState, useEffect, useCallback } from 'react';
import { 
  Trophy, 
  Target, 
  Zap, 
  CheckCircle, 
  XCircle, 
  Lightbulb, 
  RotateCcw, 
  Award,
  BookOpen,
  Settings,
  Star,
  Flame,
  Crown,
  Rocket,
  Gamepad2,
  Medal,
  Loader,
  RefreshCw
} from 'lucide-react';
import CourseSelector from './CourseSelector';
import SoundSettings from '../SoundSettings';
import gamingSounds from '../../utils/gamingSounds';

const QuizMode = ({ currentCourse }) => {
  const [selectedCourse, setSelectedCourse] = useState(currentCourse);
  const [showCourseSelector, setShowCourseSelector] = useState(!currentCourse?.id);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    score: 0,
    streak: 0,
    questionsAnswered: 0,
    correctAnswers: 0,
    strugglingTopics: [],
    currentDifficulty: 'Easy',
    level: 1,
    xp: 0,
    achievements: [],
    comboMultiplier: 1,
    perfectStreak: 0,
    hintsUsed: 0,
    startTime: Date.now()
  });
  const [quizHistory, setQuizHistory] = useState([]);
  const [showSessionSummary, setShowSessionSummary] = useState(false);
  const [showStreakBonus, setShowStreakBonus] = useState(false);
  const [animateScore, setAnimateScore] = useState(false);
  // New states for dynamic question generation
  const [courseQuestions, setCourseQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questionGenerationError, setQuestionGenerationError] = useState(null);
  const [usesCourseContent, setUsesCourseContent] = useState(false);
  const [courseFiles, setCourseFiles] = useState([]);

  // Generate course-specific fallback questions based on course title and subject
  const generateCourseFallbackQuestions = useCallback((courseName) => {
    if (!courseName) return [];
    
    const courseNameLower = courseName.toLowerCase();
    
    // Generate basic questions based on course subject area
    const fallbackQuestions = [];
    
    if (courseNameLower.includes('math') || courseNameLower.includes('calculus') || courseNameLower.includes('algebra')) {
      fallbackQuestions.push(
        {
          id: 'fallback_math_1',
          question: `What are the fundamental concepts typically covered in ${courseName}?`,
          options: [
            "A) Basic arithmetic operations",
            "B) Advanced mathematical theories and applications",
            "C) Only memorization of formulas",
            "D) Simple counting methods"
          ],
          correctAnswer: "B",
          topic: courseName,
          difficulty: "Easy",
          hint: "Think about the depth and complexity of mathematical concepts in this course."
        }
      );
    } else if (courseNameLower.includes('history')) {
      fallbackQuestions.push(
        {
          id: 'fallback_history_1',
          question: `What is the primary focus of studying ${courseName}?`,
          options: [
            "A) Memorizing dates only",
            "B) Understanding historical patterns, causes, and effects",
            "C) Learning about current events",
            "D) Studying geography only"
          ],
          correctAnswer: "B",
          topic: courseName,
          difficulty: "Easy",
          hint: "Consider what historians analyze when studying the past."
        }
      );
    } else if (courseNameLower.includes('science') || courseNameLower.includes('physics') || courseNameLower.includes('chemistry') || courseNameLower.includes('biology')) {
      fallbackQuestions.push(
        {
          id: 'fallback_science_1',
          question: `What is the scientific method's role in ${courseName}?`,
          options: [
            "A) It's not important for this subject",
            "B) It provides a systematic approach to understanding natural phenomena",
            "C) It's only used for laboratory experiments",
            "D) It's the same as guessing"
          ],
          correctAnswer: "B",
          topic: courseName,
          difficulty: "Easy",
          hint: "Think about how scientists approach research and discovery."
        }
      );
    } else if (courseNameLower.includes('english') || courseNameLower.includes('literature') || courseNameLower.includes('writing')) {
      fallbackQuestions.push(
        {
          id: 'fallback_english_1',
          question: `What skills are primarily developed in ${courseName}?`,
          options: [
            "A) Mathematical calculations",
            "B) Critical thinking, reading comprehension, and communication",
            "C) Physical fitness",
            "D) Technical programming"
          ],
          correctAnswer: "B",
          topic: courseName,
          difficulty: "Easy",
          hint: "Consider the core competencies that language and literature courses aim to develop."
        }
      );
    }
    
    // Add a generic course-specific question
    fallbackQuestions.push(
      {
        id: 'fallback_generic_1',
        question: `Based on the course materials you've studied in ${courseName}, what would be the most effective way to master this subject?`,
        options: [
          "A) Memorize everything without understanding",
          "B) Actively engage with the material, practice regularly, and connect concepts",
          "C) Only read the textbook once",
          "D) Wait until the exam to start studying"
        ],
        correctAnswer: "B",
        topic: courseName,
        difficulty: "Easy",
        hint: "Think about proven study strategies that work across all academic subjects."
      },
      {
        id: 'fallback_generic_2',
        question: `What type of knowledge and skills should you gain from completing ${courseName}?`,
        options: [
          "A) Only theoretical knowledge with no practical application",
          "B) Both conceptual understanding and practical application skills",
          "C) Just enough to pass the exam",
          "D) Memorized facts without context"
        ],
        correctAnswer: "B",
        topic: courseName,
        difficulty: "Medium",
        hint: "Consider what makes education valuable beyond just completing assignments."
      }
    );
    
    return fallbackQuestions;
  }, []);
  
  // Dynamic question bank based on selected course
  const questionBank = React.useMemo(() => {
    const courseToUse = selectedCourse || currentCourse;
    if (courseToUse?.name) {
      return generateCourseFallbackQuestions(courseToUse.name);
    }
    
    // Ultimate fallback for when no course is selected
    return [
      {
        id: 'default_1',
        question: "What is the most important aspect of effective learning?",
        options: [
          "A) Memorizing information quickly",
          "B) Understanding concepts and making connections",
          "C) Completing assignments at the last minute",
          "D) Avoiding challenging material"
        ],
        correctAnswer: "B",
        topic: "Learning Strategies",
        difficulty: "Easy",
        hint: "Think about what leads to long-term retention and understanding."
      }
    ];
  }, [selectedCourse, currentCourse, generateCourseFallbackQuestions]);

  // Function to fetch course files and generate course-specific questions
  const fetchCourseFiles = useCallback(async (courseId) => {
    if (!courseId) return [];
    
    try {
      const response = await fetch(`http://localhost:5000/course-files/${courseId}`);
      if (response.ok) {
        const data = await response.json();
        return data.files || [];
      }
    } catch (error) {
      console.error('Error fetching course files:', error);
    }
    return [];
  }, []);

  // Function to generate questions from course content using AI
  const generateQuestionsFromCourseContent = useCallback(async (files) => {
    if (!files || files.length === 0) return [];
    
    setLoadingQuestions(true);
    setQuestionGenerationError(null);
    
    try {
      const generatedQuestions = [];
      const courseToUse = selectedCourse || currentCourse;
      
      // Process each file to generate questions
      for (const file of files.slice(0, 3)) { // Limit to 3 files to avoid overwhelming
        try {
          console.log(`Generating questions for file: ${file.original_filename}`);
          
          const response = await fetch('http://localhost:5000/generate-quiz', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              filename: file.filename,
              quiz_type: 'mcq',
              course_name: courseToUse?.name || 'Unknown Course',
              course_context: `Generate EXAMINABLE quiz questions based ONLY on the specific content of this course material.
              
              REQUIREMENTS:
              1. Create questions that would appear on an actual exam for this course
              2. Focus on key concepts, definitions, formulas, processes, and important facts directly from the document
              3. Test comprehension, application, and analysis of the material presented
              4. Include specific details, terminology, and examples mentioned in the content
              5. Avoid generic knowledge - questions must be answerable ONLY by studying this material
              6. Create questions at different cognitive levels: knowledge, comprehension, and application
              
              QUESTION TYPES TO INCLUDE:
              - Definition questions: "What is [specific term from material]?"
              - Conceptual questions: "According to the material, how does [concept] work?"
              - Application questions: "Based on the content, what would happen if...?"
              - Analysis questions: "The material suggests that [concept A] differs from [concept B] because..."
              - Factual recall: "The document states that [specific fact]..."
              
              Make questions challenging but fair - they should test whether someone actually studied and understood this specific course material.`,
              num_questions: 5, // Request 5 questions per file
              difficulty_levels: ['easy', 'medium', 'hard'], // Request varied difficulty
              focus_areas: ['definitions', 'concepts', 'applications', 'analysis'] // Focus areas for exam-style questions
            }),
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('Quiz generation response:', data);
            
            if (data.quiz && data.quiz.questions) {
              // Transform API questions to match our format
              const transformedQuestions = data.quiz.questions.map((q, index) => ({
                id: `course_${file.file_id}_${index}`,
                question: q.question,
                options: Array.isArray(q.options) ? q.options : [
                  q.option_a ? `A) ${q.option_a}` : 'A) Option A',
                  q.option_b ? `B) ${q.option_b}` : 'B) Option B', 
                  q.option_c ? `C) ${q.option_c}` : 'C) Option C',
                  q.option_d ? `D) ${q.option_d}` : 'D) Option D'
                ],
                correctAnswer: q.correct_answer || q.answer || 'A',
                topic: file.original_filename.replace(/\.[^/.]+$/, ''), // Use filename as topic
                difficulty: determineDifficulty(q.question),
                hint: q.explanation || generateHint(q.question),
                source: 'course_content',
                sourceFile: file.original_filename,
                explanation: q.explanation || 'Based on the course material covered.'
              }));
              
              console.log(`Generated ${transformedQuestions.length} questions from ${file.original_filename}`);
              generatedQuestions.push(...transformedQuestions);
            } else {
              console.warn('No questions found in response for file:', file.original_filename);
            }
          } else {
            console.error('Failed to generate quiz for file:', file.original_filename, 'Status:', response.status);
          }
        } catch (fileError) {
          console.error(`Error generating questions for file ${file.filename}:`, fileError);
        }
      }
      
      if (generatedQuestions.length === 0) {
        console.log('No questions were generated from course files');
        setQuestionGenerationError('Unable to generate questions from course materials. The AI service may be unavailable.');
      }
      
      return generatedQuestions;
    } catch (error) {
      console.error('Error generating questions from course content:', error);
      setQuestionGenerationError('Failed to generate questions from course content. Using course-specific fallback questions.');
      return [];
    } finally {
      setLoadingQuestions(false);
    }
  }, [selectedCourse, currentCourse]);

  // Helper function to determine question difficulty based on content
  const determineDifficulty = (question) => {
    const difficultyKeywords = {
      easy: ['what is', 'define', 'identify', 'list', 'name'],
      medium: ['how', 'why', 'compare', 'explain', 'describe'],
      hard: ['analyze', 'evaluate', 'synthesize', 'create', 'design']
    };
    
    const questionLower = question.toLowerCase();
    
    if (difficultyKeywords.hard.some(keyword => questionLower.includes(keyword))) {
      return 'Hard';
    } else if (difficultyKeywords.medium.some(keyword => questionLower.includes(keyword))) {
      return 'Medium';
    } else {
      return 'Easy';
    }
  };

  // Helper function to generate hints for questions
  const generateHint = (question) => {
    // Simple hint generation based on question type
    const questionLower = question.toLowerCase();
    
    if (questionLower.includes('what') && questionLower.includes('definition')) {
      return 'Think about the key characteristics and main purpose.';
    } else if (questionLower.includes('how')) {
      return 'Consider the step-by-step process or method.';
    } else if (questionLower.includes('why')) {
      return 'Focus on the reasoning or cause-and-effect relationship.';
    } else if (questionLower.includes('compare')) {
      return 'Think about the similarities and differences.';
    } else {
      return 'Review the key concepts from your course materials.';
    }
  };

  const generateQuestion = useCallback(() => {
    const { currentDifficulty, strugglingTopics } = sessionStats;
    
    // Determine which question bank to use
    const availableQuestionBanks = [];
    
    // Add course-specific questions if available
    if (courseQuestions.length > 0) {
      availableQuestionBanks.push(courseQuestions);
    }
    
    // Always include default questions as fallback
    availableQuestionBanks.push(questionBank);
    
    // Combine all available questions, prioritizing course content
    let allAvailableQuestions = [];
    if (courseQuestions.length > 0 && Math.random() < 0.7) { // 70% chance to use course questions if available
      allAvailableQuestions = courseQuestions;
    } else {
      allAvailableQuestions = questionBank;
    }
    
    // Filter questions based on current difficulty and struggling topics
    let availableQuestions = allAvailableQuestions.filter(q => {
      // If user has struggling topics, focus on those
      if (strugglingTopics.length > 0 && Math.random() < 0.6) {
        return strugglingTopics.includes(q.topic);
      }
      return q.difficulty === currentDifficulty;
    });
    
    // If no questions available for current criteria, use all questions
    if (availableQuestions.length === 0) {
      availableQuestions = allAvailableQuestions;
    }
    
    // Avoid repeating recent questions
    const recentQuestionIds = quizHistory.slice(-3).map(q => q.id);
    const newQuestions = availableQuestions.filter(q => !recentQuestionIds.includes(q.id));
    const finalQuestions = newQuestions.length > 0 ? newQuestions : availableQuestions;
    
    const randomQuestion = finalQuestions[Math.floor(Math.random() * finalQuestions.length)];
    setCurrentQuestion(randomQuestion);
    setUserAnswer('');
    setShowResult(false);
    setShowHint(false);
  }, [sessionStats, quizHistory, questionBank, courseQuestions]);

  const handleAnswerSubmit = () => {
    if (!userAnswer || !currentQuestion) return;
    
    const correct = userAnswer === currentQuestion.correctAnswer;
    setIsCorrect(correct);
    setShowResult(true);
    
    // Trigger score animation
    setAnimateScore(true);
    setTimeout(() => setAnimateScore(false), 1000);
    
    // Update statistics with gaming mechanics
    const newStats = { ...sessionStats };
    newStats.questionsAnswered += 1;
    
    if (correct) {
      newStats.correctAnswers += 1;
      newStats.streak += 1;
      
      // Play correct answer sound
      gamingSounds.playCorrectAnswer();
      
      // Calculate base points
      const basePoints = getDifficultyPoints(currentQuestion.difficulty);
      newStats.score += basePoints;
      
      // Calculate XP with bonuses
      let xpGained = basePoints * newStats.comboMultiplier;
      
      // Perfect answer bonus (no hints used)
      if (!showHint) {
        xpGained += 10;
        newStats.perfectStreak += 1;
        // Play perfect streak sound for 5+ perfect answers
        if (newStats.perfectStreak >= 5) {
          setTimeout(() => gamingSounds.playPerfectStreak(), 300);
        }
      } else {
        newStats.perfectStreak = 0;
      }
      
      // Streak bonuses
      if (newStats.streak >= 3) {
        const streakBonus = newStats.streak * 5;
        xpGained += streakBonus;
        
        // Play streak sounds
        if (newStats.streak >= 5) {
          setTimeout(() => gamingSounds.playStreakCombo(newStats.streak), 200);
          setShowStreakBonus(true);
          setTimeout(() => setShowStreakBonus(false), 2000);
        } else {
          setTimeout(() => gamingSounds.playStreak(), 200);
        }
      }
      
      // Add XP and check for level up
      const oldLevel = newStats.level;
      newStats.xp += xpGained;
      newStats.level = Math.floor(newStats.xp / 100) + 1;
      
      // Play XP gain sound
      setTimeout(() => gamingSounds.playXPGain(), 100);
      
      // Level up achievement
      if (newStats.level > oldLevel) {
        newStats.achievements.push(`Level ${newStats.level} Reached!`);
        setTimeout(() => gamingSounds.playLevelUpCombo(), 400);
      }
      
      // Update combo multiplier
      if (newStats.streak >= 5) {
        const oldMultiplier = newStats.comboMultiplier;
        newStats.comboMultiplier = Math.min(3, 1 + Math.floor(newStats.streak / 5) * 0.5);
        
        // Play combo sound when multiplier increases
        if (newStats.comboMultiplier > oldMultiplier) {
          setTimeout(() => gamingSounds.playComboMultiplier(), 500);
        }
      }
      
      // Achievement checks
      const achievements = [...newStats.achievements];
      
      // Streak achievements
      if (newStats.streak === 5) {
        achievements.push("Hot Streak!");
        setTimeout(() => gamingSounds.playAchievement(), 600);
      } else if (newStats.streak === 10) {
        achievements.push("Unstoppable!");
        setTimeout(() => gamingSounds.playAchievement(), 600);
      } else if (newStats.streak === 15) {
        achievements.push("Legendary Streak!");
        setTimeout(() => gamingSounds.playAchievement(), 600);
      }
      
      // Perfect answer achievements
      if (newStats.perfectStreak === 5) {
        achievements.push("Perfectionist!");
        setTimeout(() => gamingSounds.playAchievement(), 700);
      } else if (newStats.perfectStreak === 10) {
        achievements.push("Flawless Master!");
        setTimeout(() => gamingSounds.playAchievement(), 700);
      }
      
      // Score achievements
      if (newStats.score >= 100 && !achievements.includes("Century Club")) {
        achievements.push("Century Club");
        setTimeout(() => gamingSounds.playAchievement(), 800);
      } else if (newStats.score >= 500 && !achievements.includes("High Achiever")) {
        achievements.push("High Achiever");
        setTimeout(() => gamingSounds.playAchievement(), 800);
      } else if (newStats.score >= 1000 && !achievements.includes("Grand Master")) {
        achievements.push("Grand Master");
        setTimeout(() => gamingSounds.playAchievement(), 800);
      }
      
      // Accuracy achievements
      const accuracy = (newStats.correctAnswers / newStats.questionsAnswered) * 100;
      if (accuracy >= 90 && newStats.questionsAnswered >= 10 && !achievements.includes("Sharp Shooter")) {
        achievements.push("Sharp Shooter");
        setTimeout(() => gamingSounds.playAchievement(), 900);
      } else if (accuracy === 100 && newStats.questionsAnswered >= 5 && !achievements.includes("Perfect Scholar")) {
        achievements.push("Perfect Scholar");
        setTimeout(() => gamingSounds.playAchievement(), 900);
      }
      
      newStats.achievements = achievements;
      
      // Increase difficulty if streak is good
      if (newStats.streak >= 2 && currentQuestion.difficulty === 'Easy') {
        newStats.currentDifficulty = 'Medium';
      } else if (newStats.streak >= 3 && currentQuestion.difficulty === 'Medium') {
        newStats.currentDifficulty = 'Hard';
      }
    } else {
      // Wrong answer - reset gaming mechanics
      gamingSounds.playWrongAnswer(); // Play wrong answer sound immediately
      
      newStats.streak = 0;
      newStats.comboMultiplier = 1;
      newStats.perfectStreak = 0;
      
      // Add to struggling topics
      if (!newStats.strugglingTopics.includes(currentQuestion.topic)) {
        newStats.strugglingTopics.push(currentQuestion.topic);
      }
      
      // Decrease difficulty
      if (currentQuestion.difficulty === 'Hard') {
        newStats.currentDifficulty = 'Medium';
      } else if (currentQuestion.difficulty === 'Medium') {
        newStats.currentDifficulty = 'Easy';
      }
    }
    
    // Track hint usage
    if (showHint) {
      newStats.hintsUsed += 1;
    }
    
    setSessionStats(newStats);
    
    // Add to history
    setQuizHistory(prev => [...prev, {
      ...currentQuestion,
      userAnswer,
      isCorrect: correct,
      timestamp: Date.now()
    }]);
  };

  const handleOptionClick = (option) => {
    setUserAnswer(option);
    gamingSounds.playButtonClick(); // Play click sound for option selection
  };

  const handleSubmitClick = () => {
    gamingSounds.playButtonClick(); // Play click sound for submit
    handleAnswerSubmit();
  };

  const handleNextQuestion = () => {
    gamingSounds.playButtonClick(); // Play click sound for next question
    nextQuestion();
  };

  const getDifficultyPoints = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return 10;
      case 'Medium': return 20;
      case 'Hard': return 30;
      default: return 10;
    }
  };

  const nextQuestion = () => {
    generateQuestion();
  };

  const showHintHandler = () => {
    if (!showHint) {
      setShowHint(true);
      gamingSounds.playHintUsed(); // Play hint sound
    }
  };

  const resetSession = () => {
    setSessionStats({
      score: 0,
      streak: 0,
      questionsAnswered: 0,
      correctAnswers: 0,
      strugglingTopics: [],
      currentDifficulty: 'Easy',
      level: 1,
      xp: 0,
      achievements: [],
      comboMultiplier: 1,
      perfectStreak: 0,
      hintsUsed: 0,
      startTime: Date.now()
    });
    setQuizHistory([]);
    setShowSessionSummary(false);
    setCurrentQuestion(null); // Clear current question to trigger regeneration
    // Don't call generateQuestion immediately - let useEffect handle it
  };

  const endSession = () => {
    gamingSounds.playSessionComplete(); // Play session completion sound
    setShowSessionSummary(true);
  };

  const handleCourseSelect = (course) => {
    setSelectedCourse(course);
    setShowCourseSelector(false);
    // Reset session when changing course
    resetSession();
  };

  const changeCourse = () => {
    setShowCourseSelector(true);
  };

  useEffect(() => {
    // Update course selector visibility when currentCourse changes
    if (!currentCourse?.id && !selectedCourse?.id) {
      setShowCourseSelector(true);
    }
  }, [currentCourse, selectedCourse]);

  // Function to generate questions from course title when no files are available
  const generateQuestionsFromCourseTitle = useCallback(async (courseName) => {
    if (!courseName) return [];
    
    try {
      console.log(`Generating questions based on course title: ${courseName}`);
      
      const response = await fetch('http://localhost:5000/generate-dynamic-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          course_name: courseName,
          difficulty: 'medium',
          num_questions: 8, // Request more questions since we're generating from title only
          quiz_type: 'mcq',
          focus_areas: ['concepts', 'applications', 'analysis', 'terminology']
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Course title quiz generation response:', data);
        
        if (data.status === 'success' && data.quiz && data.quiz.questions) {
          const transformedQuestions = data.quiz.questions.map((q, index) => ({
            id: `title_${courseName.replace(/\s+/g, '_')}_${index}`,
            question: q.question,
            options: Array.isArray(q.options) ? q.options : [
              q.option_a ? `A) ${q.option_a}` : 'A) Option A',
              q.option_b ? `B) ${q.option_b}` : 'B) Option B', 
              q.option_c ? `C) ${q.option_c}` : 'C) Option C',
              q.option_d ? `D) ${q.option_d}` : 'D) Option D'
            ],
            correctAnswer: q.correct_answer || q.answer || 'A',
            topic: q.topic || courseName,
            difficulty: q.difficulty || determineDifficulty(q.question),
            hint: q.explanation || generateHint(q.question),
            source: 'ai_generated',
            sourceFile: 'Dynamic AI Content',
            explanation: q.explanation || `Generated AI content for ${courseName}.`
          }));
          
          console.log(`Generated ${transformedQuestions.length} questions from course title using enhanced AI`);
          return transformedQuestions;
        }
      }
    } catch (error) {
      console.error('Error generating questions from course title:', error);
    }
    
    return [];
  }, []);
  
  // Effect to load course files and generate questions when course is selected
  useEffect(() => {
    const loadCourseContent = async () => {
      const courseToUse = selectedCourse || currentCourse;
      if (courseToUse?.id) {
        console.log('Loading course content for:', courseToUse.name);
        
        // Fetch course files
        const files = await fetchCourseFiles(courseToUse.id);
        setCourseFiles(files);
        
        if (files.length > 0) {
          console.log(`Found ${files.length} course files, generating questions...`);
          // Generate questions from course content
          const generatedQuestions = await generateQuestionsFromCourseContent(files);
          
          if (generatedQuestions.length > 0) {
            setCourseQuestions(generatedQuestions);
            setUsesCourseContent(true);
            setQuestionGenerationError(null);
            console.log(`Generated ${generatedQuestions.length} course-specific questions`);
          } else {
            console.log('No questions generated from files, trying course title...');
            // Fallback to generating questions from course title
            const titleQuestions = await generateQuestionsFromCourseTitle(courseToUse.name);
            if (titleQuestions.length > 0) {
              setCourseQuestions(titleQuestions);
              setUsesCourseContent(true);
              setQuestionGenerationError(null);
              console.log(`Generated ${titleQuestions.length} questions from course title`);
            } else {
              setCourseQuestions([]);
              setUsesCourseContent(false);
            }
          }
        } else {
          console.log('No course files found, generating questions from course title...');
          // Generate questions from course title when no files are available
          const titleQuestions = await generateQuestionsFromCourseTitle(courseToUse.name);
          if (titleQuestions.length > 0) {
            setCourseQuestions(titleQuestions);
            setUsesCourseContent(true);
            setQuestionGenerationError(null);
            console.log(`Generated ${titleQuestions.length} questions from course title`);
          } else {
            console.log('No questions generated from title either, using fallback questions');
            setCourseQuestions([]);
            setUsesCourseContent(false);
          }
        }
      }
    };
    
    loadCourseContent();
  }, [selectedCourse, currentCourse, fetchCourseFiles, generateQuestionsFromCourseContent, generateQuestionsFromCourseTitle]);

  useEffect(() => {
    if (!currentQuestion && !showCourseSelector && (selectedCourse?.id || currentCourse?.id)) {
      generateQuestion();
    }
  }, [generateQuestion, currentQuestion, showCourseSelector, selectedCourse, currentCourse]);

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-600 bg-green-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'Hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Show course selector if no course is selected
  if (showCourseSelector) {
    return <CourseSelector onCourseSelect={handleCourseSelect} currentCourse={selectedCourse || currentCourse} />;
  }

  if (showSessionSummary) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Quiz Session Complete!</h2>
          <p className="text-gray-600">Great job! Here's how you performed:</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 font-semibold">Total Score</p>
                <p className="text-3xl font-bold text-blue-800">{sessionStats.score}</p>
              </div>
              <Award className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 font-semibold">Accuracy</p>
                <p className="text-3xl font-bold text-green-800">
                  {sessionStats.questionsAnswered > 0 
                    ? Math.round((sessionStats.correctAnswers / sessionStats.questionsAnswered) * 100)
                    : 0}%
                </p>
              </div>
              <Target className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 font-semibold">Questions</p>
                <p className="text-3xl font-bold text-orange-800">{sessionStats.questionsAnswered}</p>
              </div>
              <BookOpen className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>

        {sessionStats.strugglingTopics.length > 0 && (
          <div className="bg-amber-50 rounded-xl p-6 border border-amber-200 mb-6">
            <h3 className="text-lg font-semibold text-amber-800 mb-3">Topics to Review:</h3>
            <div className="flex flex-wrap gap-2">
              {sessionStats.strugglingTopics.map((topic, index) => (
                <span key={index} className="px-3 py-1 bg-amber-200 text-amber-800 rounded-full text-sm">
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-center space-x-4">
          <button
            onClick={resetSession}
            className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Start New Session
          </button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading question...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Gaming Stats Bar */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700 rounded-2xl shadow-xl p-6 text-white relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 left-4 animate-float">⭐</div>
          <div className="absolute top-8 right-8 animate-float" style={{animationDelay: '1s'}}>🎮</div>
          <div className="absolute bottom-4 left-1/4 animate-float" style={{animationDelay: '2s'}}>💎</div>
          <div className="absolute bottom-8 right-1/4 animate-float" style={{animationDelay: '3s'}}>🏆</div>
        </div>

        <div className="relative z-10">
          {/* Course Info Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <BookOpen className="w-5 h-5 text-cyan-300 mr-2" />
              <span className="text-sm font-medium text-cyan-100">
                Course: {selectedCourse?.name || currentCourse?.name || 'No Course Selected'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <SoundSettings />
              <button
                onClick={changeCourse}
                className="flex items-center px-3 py-1 text-cyan-300 hover:text-white hover:bg-white/20 rounded-lg transition-all duration-300 text-sm gaming-button"
              >
                <Settings className="w-4 h-4 mr-1" />
                Change Course
              </button>
            </div>
          </div>
          
          {/* Level & XP Bar */}
          <div className="mb-6 bg-black/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Crown className="w-6 h-6 text-yellow-400 mr-2" />
                <span className="text-lg font-bold text-yellow-300">Level {sessionStats.level}</span>
              </div>
              <div className="flex items-center">
                <Star className="w-5 h-5 text-yellow-400 mr-1" />
                <span className="text-sm font-medium">{sessionStats.xp} XP</span>
              </div>
            </div>
            
            {/* XP Progress Bar */}
            <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all duration-500 animate-glow"
                style={{
                  width: `${Math.min((sessionStats.xp % 100), 100)}%`
                }}
              ></div>
            </div>
            <div className="text-xs text-gray-300 mt-1 text-center">
              {100 - (sessionStats.xp % 100)} XP to next level
            </div>
          </div>

          {/* Gaming Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {/* Score with Animation */}
            <div className="text-center bg-black/20 rounded-xl p-4">
              <div className="flex items-center justify-center mb-1">
                <Medal className="w-5 h-5 text-blue-400 mr-1" />
                <p className="text-sm text-blue-200">Score</p>
              </div>
              <p className={`text-2xl font-bold text-blue-300 ${animateScore ? 'animate-bounce' : ''}`}>
                {sessionStats.score}
              </p>
            </div>

            {/* Streak with Fire Effect */}
            <div className="text-center bg-black/20 rounded-xl p-4">
              <div className="flex items-center justify-center mb-1">
                {sessionStats.streak >= 5 ? (
                  <Flame className="w-5 h-5 text-red-400 mr-1 animate-pulse" />
                ) : (
                  <Zap className="w-5 h-5 text-yellow-400 mr-1" />
                )}
                <p className="text-sm text-orange-200">Streak</p>
              </div>
              <div className="flex items-center justify-center">
                <p className={`text-2xl font-bold ${sessionStats.streak >= 5 ? 'text-red-400 animate-pulse' : 'text-orange-300'}`}>
                  {sessionStats.streak}
                </p>
                {sessionStats.streak >= 10 && (
                  <span className="ml-1 text-xs animate-bounce">🔥</span>
                )}
              </div>
              {sessionStats.perfectStreak > 0 && (
                <div className="text-xs text-yellow-300 mt-1">
                  Perfect: {sessionStats.perfectStreak}
                </div>
              )}
            </div>

            {/* Accuracy */}
            <div className="text-center bg-black/20 rounded-xl p-4">
              <div className="flex items-center justify-center mb-1">
                <Target className="w-5 h-5 text-green-400 mr-1" />
                <p className="text-sm text-green-200">Accuracy</p>
              </div>
              <p className="text-2xl font-bold text-green-300">
                {sessionStats.questionsAnswered > 0 
                  ? Math.round((sessionStats.correctAnswers / sessionStats.questionsAnswered) * 100)
                  : 0}%
              </p>
            </div>

            {/* Combo Multiplier */}
            <div className="text-center bg-black/20 rounded-xl p-4">
              <div className="flex items-center justify-center mb-1">
                <Rocket className="w-5 h-5 text-purple-400 mr-1" />
                <p className="text-sm text-purple-200">Combo</p>
              </div>
              <p className={`text-2xl font-bold text-purple-300 ${sessionStats.comboMultiplier > 1 ? 'animate-pulse' : ''}`}>
                x{sessionStats.comboMultiplier}
              </p>
              {sessionStats.comboMultiplier > 2 && (
                <div className="text-xs text-yellow-300 mt-1 animate-sparkle">
                  ✨ On Fire! ✨
                </div>
              )}
            </div>
          </div>

          {/* Achievements Bar */}
          {sessionStats.achievements.length > 0 && (
            <div className="mb-4 bg-black/20 rounded-xl p-3">
              <div className="flex items-center mb-2">
                <Trophy className="w-5 h-5 text-yellow-400 mr-2" />
                <span className="text-sm font-medium text-yellow-300">Recent Achievements</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {sessionStats.achievements.slice(-3).map((achievement, index) => (
                  <span 
                    key={index} 
                    className="px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-xs font-medium animate-fadeIn"
                  >
                    🏆 {achievement}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Difficulty & Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Gamepad2 className="w-5 h-5 text-indigo-300 mr-2" />
                <span className="text-sm text-indigo-200 mr-2">Difficulty:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getDifficultyColor(sessionStats.currentDifficulty)}`}>
                  {sessionStats.currentDifficulty}
                </span>
              </div>
              
              {sessionStats.hintsUsed > 0 && (
                <div className="flex items-center text-sm text-gray-300">
                  <span>💡 Hints: {sessionStats.hintsUsed}</span>
                </div>
              )}
            </div>
            
            <button
              onClick={endSession}
              className="px-6 py-2 bg-red-500/80 hover:bg-red-500 text-white rounded-lg transition-all duration-300 text-sm font-medium gaming-button"
            >
              🏁 End Session
            </button>
          </div>
        </div>

        {/* Streak Bonus Popup */}
        {showStreakBonus && (
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <div className="bg-yellow-400 text-black px-6 py-4 rounded-xl font-bold text-lg animate-bounce">
              🔥 STREAK BONUS! +{sessionStats.streak * 10} XP! 🔥
            </div>
          </div>
        )}
      </div>

      {/* Question */}
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getDifficultyColor(currentQuestion.difficulty)}`}>
                {currentQuestion.difficulty}
              </span>
              {currentQuestion.source === 'course_content' && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 flex items-center">
                  <BookOpen className="w-3 h-3 mr-1" />
                  Course Content
                </span>
              )}
              {loadingQuestions && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 flex items-center">
                  <Loader className="w-3 h-3 mr-1 animate-spin" />
                  Generating...
                </span>
              )}
            </div>
            <span className="text-sm text-gray-500">{currentQuestion.topic}</span>
          </div>
          
          {/* Course content indicator */}
          {currentQuestion.source === 'course_content' && currentQuestion.sourceFile && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center text-sm text-blue-700">
                <BookOpen className="w-4 h-4 mr-2" />
                <span>Question based on: <strong>{currentQuestion.sourceFile}</strong></span>
              </div>
            </div>
          )}
          
          {/* Error message for question generation */}
          {questionGenerationError && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center text-sm text-amber-700">
                <RefreshCw className="w-4 h-4 mr-2" />
                <span>{questionGenerationError}</span>
              </div>
            </div>
          )}
          
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            {currentQuestion.question}
          </h2>
        </div>

        {!showResult ? (
          <div className="space-y-4">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleOptionClick(option.charAt(0))}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-300 gaming-button ${
                  userAnswer === option.charAt(0)
                    ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg transform scale-105'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50 hover:shadow-md hover:transform hover:scale-102'
                }`}
              >
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 font-bold transition-all duration-300 ${
                    userAnswer === option.charAt(0)
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg animate-pulse'
                      : 'bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600'
                  }`}>
                    {option.charAt(0)}
                  </div>
                  <span className={`transition-colors duration-300 ${
                    userAnswer === option.charAt(0) 
                      ? 'text-blue-800 font-semibold' 
                      : 'text-gray-700 hover:text-gray-900'
                  }`}>
                    {option.substring(3)}
                  </span>
                  {userAnswer === option.charAt(0) && (
                    <div className="ml-auto text-blue-500 animate-bounce">
                      ✨
                    </div>
                  )}
                </div>
              </button>
            ))}
            
            <div className="flex justify-between pt-6">
              <button
                onClick={showHintHandler}
                disabled={showHint}
                className="flex items-center px-6 py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:from-amber-500 hover:to-orange-600 transition-all duration-300 shadow-lg gaming-button transform hover:scale-105"
              >
                <Lightbulb className="w-5 h-5 mr-2" />
                {showHint ? '💡 Hint Used' : '🔍 Need Help?'}
              </button>
              
              <button
                onClick={handleSubmitClick}
                disabled={!userAnswer}
                className="flex items-center px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-xl gaming-button transform hover:scale-105 font-bold"
              >
                <Rocket className="w-5 h-5 mr-2" />
                🚀 Submit Answer
              </button>
            </div>
            
            {showHint && (
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 rounded-xl p-6 mt-6 shadow-lg animate-fadeIn">
                <div className="flex items-start">
                  <div className="bg-amber-400 rounded-full p-2 mr-4">
                    <Lightbulb className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-amber-800 font-bold text-lg mb-2">💡 Helpful Hint</h4>
                    <p className="text-amber-800 text-base leading-relaxed">{currentQuestion.hint}</p>
                    <div className="mt-3 text-sm text-amber-600 bg-amber-100 px-3 py-2 rounded-lg">
                      ⚠️ Using hints affects your perfect streak bonus
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center relative overflow-hidden">
            {/* Background Effects for Correct Answers */}
            {isCorrect && (
              <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-emerald-500/20 animate-pulse"></div>
            )}
            
            {/* Result Icon with Gaming Effects */}
            <div className={`relative w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
              isCorrect ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-red-400 to-red-600'
            } shadow-lg`}>
              {isCorrect ? (
                <CheckCircle className="w-10 h-10 text-white animate-bounce" />
              ) : (
                <XCircle className="w-10 h-10 text-white" />
              )}
              
              {/* Success Sparkles */}
              {isCorrect && (
                <>
                  <div className="absolute -top-2 -left-2 text-yellow-400 animate-ping">✨</div>
                  <div className="absolute -top-2 -right-2 text-yellow-400 animate-ping" style={{animationDelay: '0.5s'}}>⭐</div>
                  <div className="absolute -bottom-2 -left-2 text-yellow-400 animate-ping" style={{animationDelay: '1s'}}>💫</div>
                  <div className="absolute -bottom-2 -right-2 text-yellow-400 animate-ping" style={{animationDelay: '1.5s'}}>🌟</div>
                </>
              )}
            </div>
            
            {/* Result Title with Gaming Flair */}
            <div className="mb-4">
              <h3 className={`text-3xl font-bold mb-2 ${isCorrect ? 'text-green-600' : 'text-red-600'} ${isCorrect ? 'animate-bounce' : ''}`}>
                {isCorrect ? (
                  sessionStats.streak >= 5 ? '🔥 AMAZING! 🔥' : 
                  sessionStats.streak >= 3 ? '⚡ EXCELLENT! ⚡' : 
                  '🎉 CORRECT! 🎉'
                ) : '💔 OOPS! 💔'}
              </h3>
              
              {/* Streak Celebration */}
              {isCorrect && sessionStats.streak >= 3 && (
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-4 py-2 rounded-full text-lg font-bold inline-block animate-pulse">
                  {sessionStats.streak >= 10 ? '🔥🔥 LEGENDARY STREAK! 🔥🔥' :
                   sessionStats.streak >= 7 ? '⚡ INCREDIBLE STREAK! ⚡' :
                   sessionStats.streak >= 5 ? '🌟 HOT STREAK! 🌟' :
                   '💪 GOOD STREAK! 💪'}
                </div>
              )}
            </div>
            
            {/* XP and Points Display */}
            <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl p-4 mb-6">
              {isCorrect ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center space-x-4">
                    <div className="flex items-center">
                      <Trophy className="w-5 h-5 text-yellow-500 mr-2" />
                      <span className="text-lg font-bold text-purple-600">
                        +{getDifficultyPoints(currentQuestion.difficulty)} Points
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Star className="w-5 h-5 text-blue-500 mr-2" />
                      <span className="text-lg font-bold text-blue-600">
                        +{getDifficultyPoints(currentQuestion.difficulty) * sessionStats.comboMultiplier} XP
                      </span>
                    </div>
                  </div>
                  
                  {/* Bonus XP for Streaks */}
                  {sessionStats.streak >= 3 && (
                    <div className="text-yellow-600 font-bold animate-bounce">
                      🎁 Streak Bonus: +{sessionStats.streak * 5} XP
                    </div>
                  )}
                  
                  {/* Perfect Answer Bonus */}
                  {isCorrect && !showHint && (
                    <div className="text-green-600 font-bold">
                      💎 Perfect Answer: +10 XP
                    </div>
                  )}
                  
                  {/* Combo Multiplier Display */}
                  {sessionStats.comboMultiplier > 1 && (
                    <div className="text-purple-600 font-bold animate-pulse">
                      🚀 {sessionStats.comboMultiplier}x Combo Multiplier Active!
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-gray-600 mb-2">
                    The correct answer was <span className="font-bold text-green-600">{currentQuestion.correctAnswer}</span>
                  </p>
                  <div className="text-blue-600">
                    💪 Don't give up! Every mistake is a learning opportunity!
                  </div>
                  {sessionStats.streak > 0 && (
                    <div className="text-red-500 text-sm">
                      Streak broken, but you can start a new one! 🔥
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Achievements Unlocked */}
            {isCorrect && sessionStats.achievements.length > 0 && (
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 mb-6 animate-fadeIn">
                <div className="flex items-center justify-center mb-2">
                  <Medal className="w-6 h-6 text-yellow-600 mr-2" />
                  <span className="text-lg font-bold text-yellow-700">Achievement Unlocked!</span>
                </div>
                <div className="text-yellow-600 font-medium">
                  🏆 {sessionStats.achievements[sessionStats.achievements.length - 1]}
                </div>
              </div>
            )}
            
            {/* Action Button with Gaming Style */}
            <button
              onClick={handleNextQuestion}
              className="flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-xl mx-auto gaming-button transform hover:scale-105"
            >
              <Rocket className="w-5 h-5 mr-2" />
              {isCorrect ? '🚀 Keep Going!' : '💪 Try Again!'}
            </button>
            
            {/* Motivational Messages */}
            <div className="mt-4 text-sm text-gray-500">
              {isCorrect ? (
                sessionStats.accuracy >= 90 ? "🌟 You're on fire! Keep up the excellent work!" :
                sessionStats.accuracy >= 75 ? "⭐ Great job! You're doing really well!" :
                "👍 Nice work! Keep improving!"
              ) : (
                "🎯 Learning is a journey. Every question makes you stronger!"
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizMode;
