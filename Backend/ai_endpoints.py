"""
AI-powered endpoints for EduMaster application.
This module provides enhanced AI features using the Gemini API.
"""

from flask import request, jsonify
import logging
import json
import google.generativeai as genai
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get the logger
logger = logging.getLogger(__name__)

# Initialize Gemini API - will be done in register_ai_endpoints
GEMINI_API_KEY = None
model = None

def initialize_gemini():
    """Initialize the Gemini API with proper error handling."""
    global GEMINI_API_KEY, model
    
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
    if not GEMINI_API_KEY:
        logger.error("GEMINI_API_KEY not found in environment variables!")
        raise ValueError("GEMINI_API_KEY environment variable is required")
    
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-1.5-flash')
    logger.info("Gemini API initialized successfully")

def register_ai_endpoints(app):
    """Register all AI-powered endpoints with the Flask app."""
    
    # Initialize Gemini when registering endpoints
    try:
        initialize_gemini()
    except Exception as e:
        logger.error(f"Failed to initialize Gemini API: {e}")
        return False
    
    @app.route('/ai-chat', methods=['POST'])
    def ai_chat():
        """
        AI chat endpoint for ClarifyMode.
        Uses the Gemini API to generate contextual responses to user questions.
        """
        try:
            data = request.get_json()
            
            if not data or 'message' not in data:
                return jsonify({'error': 'Message is required'}), 400
            
            user_message = data.get('message', '').strip()
            course_name = data.get('course_name', 'General Studies')
            context = data.get('context', [])
            
            if not user_message:
                return jsonify({'error': 'Message cannot be empty'}), 400
            
            # Build context from conversation history
            conversation_context = ""
            if context:
                conversation_context = "\n\nConversation history:\n"
                for msg in context[-5:]:  # Only use last 5 messages for context
                    role = "Student" if msg.get('type') == 'user' else "AI Tutor"
                    conversation_context += f"{role}: {msg.get('content', '')}\n"
            
            # Create a comprehensive prompt for the AI tutor
            tutor_prompt = f"""
            You are an expert AI tutor specializing in "{course_name}". Your role is to provide helpful, accurate, and engaging educational responses to student questions.
            
            CONTEXT:
            - Course: {course_name}
            - Student Question: {user_message}
            {conversation_context}
            
            INSTRUCTIONS:
            1. **Be a knowledgeable tutor**: Provide accurate, detailed explanations appropriate for the course level
            2. **Use clear examples**: Include relevant examples, analogies, or step-by-step explanations
            3. **Be encouraging**: Maintain a positive, supportive tone that motivates learning
            4. **Structure your response**: Use clear headings, bullet points, and formatting when helpful
            5. **Connect concepts**: Help students understand how topics relate to broader course themes
            6. **Encourage questions**: End with invitations for follow-up questions when appropriate
            7. **Stay course-focused**: Keep responses relevant to the course subject matter
            8. **Be concise but thorough**: Provide comprehensive answers without being overwhelming
            
            RESPONSE FORMAT:
            - Use markdown formatting for better readability
            - Include **bold** for key terms and concepts
            - Use bullet points for lists and steps
            - Include code blocks (```code```) for any programming examples
            - Use \n for line breaks
            
            SPECIAL FEATURES:
            - If the question is about a definition, provide both a simple explanation and detailed breakdown
            - If the question involves problem-solving, show the step-by-step approach
            - If the question is conceptual, use real-world examples and analogies
            - If the student seems confused, break down complex topics into simpler parts
            - If the question is off-topic, politely redirect to course-relevant material
            
            Now, provide a helpful response to the student's question:
            """
            
            # Generate response using Gemini API
            response = model.generate_content(tutor_prompt)
            ai_response = response.text
            
            # Clean up the response
            if ai_response:
                # Remove any unwanted markdown artifacts
                ai_response = ai_response.strip()
                
                return jsonify({
                    'status': 'success',
                    'response': ai_response,
                    'course_name': course_name
                })
            else:
                return jsonify({
                    'error': 'Failed to generate response from AI'
                }), 500
                
        except Exception as e:
            logger.error(f"Error in AI chat: {str(e)}")
            return jsonify({
                'error': 'Failed to process AI chat request',
                'details': str(e) if app.config.get('DEBUG', False) else 'Internal server error'
            }), 500

    @app.route('/generate-dynamic-quiz', methods=['POST'])
    def generate_dynamic_quiz():
        """
        Enhanced quiz generation endpoint with better course integration.
        Uses the Gemini API to generate course-specific quiz questions.
        """
        try:
            data = request.get_json()
            
            if not data:
                return jsonify({'error': 'No data provided'}), 400
            
            course_name = data.get('course_name', 'General Studies')
            difficulty = data.get('difficulty', 'medium').lower()
            num_questions = min(data.get('num_questions', 5), 10)  # Limit to 10 questions max
            quiz_type = data.get('quiz_type', 'mcq')
            focus_areas = data.get('focus_areas', [])
            user_id = data.get('user_id')
            
            # Enhanced prompt for better quiz generation
            quiz_prompt = f"""
            You are an expert examination creator for "{course_name}". Create a comprehensive quiz that tests student understanding of key course concepts.
            
            QUIZ REQUIREMENTS:
            - Course: {course_name}
            - Difficulty: {difficulty}
            - Number of questions: {num_questions}
            - Question type: {quiz_type}
            - Focus areas: {', '.join(focus_areas) if focus_areas else 'comprehensive coverage'}
            
            QUESTION DESIGN PRINCIPLES:
            1. **Course-Specific Content**: Questions must be directly relevant to {course_name} curriculum
            2. **Appropriate Difficulty**: Match {difficulty} level - avoid too easy or impossibly hard questions
            3. **Clear and Unambiguous**: Each question should have one clearly correct answer
            4. **Educational Value**: Questions should test understanding, not just memorization
            5. **Realistic Scenarios**: Include practical applications when relevant
            
            DIFFICULTY GUIDELINES:
            - **Easy**: Basic definitions, fundamental concepts, simple recall
            - **Medium**: Application of concepts, comparison/contrast, cause-and-effect
            - **Hard**: Analysis, synthesis, evaluation, complex problem-solving
            
            FORMAT REQUIREMENTS:
            Please format your response as a JSON object with this exact structure:
            {{
                "questions": [
                    {{
                        "question": "Clear, specific question about {course_name}?",
                        "type": "{quiz_type}",
                        "options": ["A) First option", "B) Second option", "C) Third option", "D) Fourth option"],
                        "correct_answer": "A",
                        "explanation": "Detailed explanation of why this answer is correct and others are wrong",
                        "difficulty": "{difficulty}",
                        "topic": "Specific topic within {course_name}"
                    }}
                ]
            }}
            
            CONTENT FOCUS:
            Create questions that a student would encounter in a real {course_name} examination. Make sure each question:
            - Tests specific knowledge from {course_name}
            - Has realistic, plausible distractors (wrong answers)
            - Includes proper academic terminology
            - Reflects current understanding in the field
            
            Generate the quiz now:
            """
            
            response = model.generate_content(quiz_prompt)
            response_text = response.text.strip()
            
            # Clean and parse JSON response
            if response_text.startswith('```json'):
                response_text = response_text[7:-3]
            elif response_text.startswith('```'):
                response_text = response_text[3:-3]
            
            try:
                quiz_data = json.loads(response_text)
                
                # Validate quiz structure
                if 'questions' not in quiz_data or not isinstance(quiz_data['questions'], list):
                    raise ValueError("Invalid quiz structure")
                
                # Validate each question
                for i, question in enumerate(quiz_data['questions']):
                    if not all(key in question for key in ['question', 'options', 'correct_answer']):
                        raise ValueError(f"Invalid question structure at index {i}")
                    
                    # Ensure we have 4 options
                    if len(question['options']) != 4:
                        # Pad with generic options if needed
                        while len(question['options']) < 4:
                            option_letter = chr(65 + len(question['options']))  # A, B, C, D
                            question['options'].append(f"{option_letter}) Additional option")
                    
                    # Ensure question has required fields
                    question['type'] = question.get('type', quiz_type)
                    question['difficulty'] = question.get('difficulty', difficulty)
                    question['topic'] = question.get('topic', course_name)
                    question['explanation'] = question.get('explanation', 'Based on course material.')
                
                return jsonify({
                    'status': 'success',
                    'quiz': quiz_data,
                    'course_name': course_name,
                    'metadata': {
                        'difficulty': difficulty,
                        'question_count': len(quiz_data['questions']),
                        'quiz_type': quiz_type
                    }
                })
                
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse quiz JSON: {e}")
                return jsonify({
                    'error': 'Failed to generate properly formatted quiz',
                    'raw_response': response_text[:500]  # First 500 chars for debugging
                }), 500
                
            except ValueError as e:
                logger.error(f"Invalid quiz structure: {e}")
                return jsonify({
                    'error': 'Generated quiz has invalid structure',
                    'details': str(e)
                }), 500
                
        except Exception as e:
            logger.error(f"Error generating dynamic quiz: {str(e)}")
            return jsonify({
                'error': 'Failed to generate quiz',
                'details': str(e) if app.config.get('DEBUG', False) else 'Internal server error'
            }), 500
    
    logger.info("AI endpoints registered successfully")
    return True
