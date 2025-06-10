import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = 'AIzaSyAPiLPuXreD8XedE-6V-CZwSRvkl_eyDbE';
const genAI = new GoogleGenerativeAI(API_KEY);

export const generateSummary = async (topic, content = '') => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `Generate a comprehensive summary about "${topic}".
    ${content ? `Consider this additional context:\n${content}\n\n` : ''}
    
    Please structure the summary with:
    1. Introduction to ${topic}
    2. Key concepts and main ideas
    3. Important details and examples
    4. Practical applications
    5. Summary and key takeaways
    
    Format the response in clear sections with bullet points where appropriate.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating summary:', error);
    throw error;
  }
};

export const generateQuiz = async (topic, content = '') => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `Create a quiz about "${topic}" with 5 multiple-choice questions.
    ${content ? `Base the questions on this content:\n${content}\n\n` : ''}
    
    Format each question exactly like this example:
    1. What is the capital of France?
    A. London
    B. Paris
    C. Berlin
    D. Madrid
    Correct answer: B
    Explanation: Paris is the capital and largest city of France.

    Please create 5 questions following this exact format.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating quiz:', error);
    throw error;
  }
};

export const generateStudyGuide = async (topic, content = '') => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `Create a comprehensive study guide for "${topic}".
    ${content ? `Consider this additional context:\n${content}\n\n` : ''}
    
    Please include:
    1. Topic Overview
    2. Key Concepts and Definitions
    3. Important Formulas or Principles
    4. Example Problems or Applications
    5. Common Misconceptions
    6. Study Tips and Strategies
    7. Practice Questions
    8. Additional Resources
    
    Format the guide with clear headers and bullet points for easy reading.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating study guide:', error);
    throw error;
  }
};

export const analyzeCWA = async (studentData) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `Analyze this student's academic performance and provide insights:
    ${JSON.stringify(studentData, null, 2)}
    
    Please provide:
    1. Current performance analysis
    2. Trends and patterns
    3. Areas of strength
    4. Areas needing improvement
    5. Specific recommendations for improvement
    6. Projected CWA range based on current performance`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error analyzing CWA:', error);
    throw error;
  }
};

export const generateBehaviorInsights = async (behaviorData) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `Analyze this student's behavior patterns and provide insights:
    ${JSON.stringify(behaviorData, null, 2)}
    
    Please provide:
    1. Study consistency analysis
    2. Time management patterns
    3. Engagement level assessment
    4. Specific recommendations for improvement
    5. Potential impact on academic performance`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating behavior insights:', error);
    throw error;
  }
}; 