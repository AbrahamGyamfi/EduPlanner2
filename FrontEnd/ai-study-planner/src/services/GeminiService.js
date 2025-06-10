/**
 * Service for interacting with Google's Gemini API
 */
const API_KEY = "AIzaSyAPiLPuXreD8XedE-6V-CZwSRvkl_eyDbE";
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const MODEL_NAME = "gemini-pro";

class GeminiService {
  async generateQuiz(courseName, topic) {
    try {
      const prompt = `Generate a quiz on "${topic}" for a ${courseName} course with 5 multiple-choice questions. 
      For each question, provide 4 options and indicate the correct answer. 
      Format the response as a JSON object with this structure:
      {
        "questions": [
          {
            "id": 1,
            "question": "Question text here?",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": 0 // Index of correct option (0-3)
          }
          // more questions...
        ]
      }`;

      const response = await fetch(
        `${API_URL}/${MODEL_NAME}:generateContent?key=${API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();
      
      // Extract the text response from Gemini
      const responseText = data.candidates[0]?.content?.parts[0]?.text;
      
      // Find the JSON part of the response (in case there's any wrapper text)
      const jsonMatch = responseText.match(/(\{[\s\S]*\})/);
      const jsonStr = jsonMatch ? jsonMatch[0] : responseText;
      
      // Parse the JSON response
      const quizData = JSON.parse(jsonStr);
      
      return quizData;
    } catch (error) {
      console.error("Error generating quiz with Gemini:", error);
      throw error;
    }
  }

  async generateSummary(courseName, topic) {
    try {
      const prompt = `Generate a comprehensive summary about "${topic}" for a ${courseName} course. 
      The summary should include:
      1. An introduction to the topic
      2. Key concepts and principles
      3. Practical applications
      4. Important theories or frameworks
      5. A conclusion
      
      Format the response in Markdown with clear headers, bullet points, and emphasis where appropriate.`;

      const response = await fetch(
        `${API_URL}/${MODEL_NAME}:generateContent?key=${API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();
      const summaryText = data.candidates[0]?.content?.parts[0]?.text;

      return {
        summary: summaryText
      };
    } catch (error) {
      console.error("Error generating summary with Gemini:", error);
      throw error;
    }
  }
}

export default new GeminiService();
