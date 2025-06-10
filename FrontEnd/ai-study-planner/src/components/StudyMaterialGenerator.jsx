import React, { useState } from 'react';
import { generateSummary, generateQuiz, generateStudyGuide } from '../services/gemini';

const StudyMaterialGenerator = ({ courseContent }) => {
  const [summary, setSummary] = useState('');
  const [quiz, setQuiz] = useState([]);
  const [studyGuide, setStudyGuide] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [topic, setTopic] = useState('');

  const handleGenerateSummary = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic first');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const generatedSummary = await generateSummary(topic, courseContent);
      setSummary(generatedSummary);
    } catch (err) {
      setError('Failed to generate summary. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic first');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const generatedQuiz = await generateQuiz(topic, courseContent);
      // Parse the quiz text into structured format
      const parsedQuiz = parseQuizResponse(generatedQuiz);
      setQuiz(parsedQuiz);
    } catch (err) {
      setError('Failed to generate quiz. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateStudyGuide = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic first');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const generatedGuide = await generateStudyGuide(topic, courseContent);
      setStudyGuide(generatedGuide);
    } catch (err) {
      setError('Failed to generate study guide. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to parse quiz response text into structured format
  const parseQuizResponse = (quizText) => {
    try {
      // Split the text into questions
      const questions = quizText.split(/\d+\.\s+/).filter(q => q.trim());
      
      return questions.map(questionText => {
        const lines = questionText.split('\n').filter(line => line.trim());
        const question = lines[0].trim();
        const options = lines.slice(1, -1)
          .filter(line => line.match(/^[A-D]\./))
          .map(line => line.replace(/^[A-D]\.\s*/, '').trim());
        const correctAnswer = lines[lines.length - 1].match(/Correct answer: ([A-D])/)?.[1];
        
        return {
          question,
          options,
          correctAnswer,
          explanation: lines.find(line => line.includes('Explanation:'))?.replace('Explanation:', '').trim() || ''
        };
      });
    } catch (error) {
      console.error('Error parsing quiz response:', error);
      return [];
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Study Materials</h2>
      
      <div className="space-y-6">
        {/* Topic Input */}
        <div className="mb-4">
          <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-1">
            Topic
          </label>
          <input
            type="text"
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter the topic (e.g., 'Introduction to Calculus')"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <button
            onClick={handleGenerateSummary}
            disabled={isLoading}
            className={`w-full py-2 px-4 rounded-lg text-white font-medium
              ${isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {isLoading ? 'Generating...' : 'Generate Summary'}
          </button>
          
          {summary && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Summary</h3>
              <div className="prose max-w-none whitespace-pre-wrap">
                {summary}
              </div>
            </div>
          )}
        </div>

        <div>
          <button
            onClick={handleGenerateQuiz}
            disabled={isLoading}
            className={`w-full py-2 px-4 rounded-lg text-white font-medium
              ${isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {isLoading ? 'Generating...' : 'Generate Quiz'}
          </button>
          
          {quiz.length > 0 && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Quiz</h3>
              <div className="space-y-4">
                {quiz.map((question, index) => (
                  <div key={index} className="border-b border-gray-200 pb-4">
                    <p className="font-medium mb-2">{index + 1}. {question.question}</p>
                    <ul className="space-y-2">
                      {question.options.map((option, optIndex) => (
                        <li key={optIndex} className="flex items-center">
                          <input
                            type="radio"
                            name={`question-${index}`}
                            id={`question-${index}-option-${optIndex}`}
                            className="mr-2"
                          />
                          <label htmlFor={`question-${index}-option-${optIndex}`}>
                            {String.fromCharCode(65 + optIndex)}. {option}
                          </label>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-2 text-sm">
                      <p className="text-blue-600">Correct Answer: {question.correctAnswer}</p>
                      {question.explanation && (
                        <p className="text-gray-600 mt-1">
                          <strong>Explanation:</strong> {question.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <button
            onClick={handleGenerateStudyGuide}
            disabled={isLoading}
            className={`w-full py-2 px-4 rounded-lg text-white font-medium
              ${isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {isLoading ? 'Generating...' : 'Generate Study Guide'}
          </button>
          
          {studyGuide && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Study Guide</h3>
              <div className="prose max-w-none whitespace-pre-wrap">
                {studyGuide}
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyMaterialGenerator; 