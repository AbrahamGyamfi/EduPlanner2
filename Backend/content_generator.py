"""
Content generation module for EduMaster application.
This module handles AI-powered quiz and summary generation from uploaded content.
"""

import os
import json
import logging
from datetime import datetime
from flask import request, jsonify
import google.generativeai as genai

from database import files_collection, quizzes_collection, summaries_collection, activities_collection
from utils import validate_input, clean_json_response, log_user_action
from file_handler import FileProcessor

logger = logging.getLogger(__name__)

class ContentGenerator:
    """Handles AI-powered content generation"""
    
    def __init__(self):
        self.model = None
        self._initialize_ai()
    
    def _initialize_ai(self):
        """Initialize the Gemini AI model"""
        try:
            gemini_api_key = os.getenv('GEMINI_API_KEY')
            if not gemini_api_key:
                logger.error("GEMINI_API_KEY not found in environment variables!")
                raise ValueError("GEMINI_API_KEY environment variable is required")
            
            genai.configure(api_key=gemini_api_key)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
            logger.info("Gemini AI model initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize AI model: {e}")
            self.model = None
    
    def generate_summary(self, text, course_name="General"):
        """Generate AI-powered summary from text content"""
        if not self.model:
            return "AI model not available for summary generation"
        
        try:
            prompt = f"""
            Please provide a comprehensive summary of the following content from slides/presentation for the course "{course_name}":
            
            {text}

            The summary should be:
            1. Very detailed for exam preparation
            2. Well-organized with clear headings and bullet points
            3. Include all key concepts, definitions, and important points
            4. Structured for easy studying and review
            5. Include any formulas, procedures, or step-by-step processes mentioned
            
            Format the summary with markdown for better readability.
            """
            
            response = self.model.generate_content(prompt)
            return response.text
            
        except Exception as e:
            logger.error(f"Error generating summary: {e}")
            return "Error generating summary. Please try again."
    
    def generate_quiz(self, text, quiz_type='mcq', difficulty='medium', num_questions=5, course_name="General"):
        """Generate AI-powered quiz from text content"""
        if not self.model:
            return {
                "questions": [{
                    "question": "AI model not available for quiz generation.",
                    "options": ["A) Please configure AI", "B) Check settings", "C) Contact admin", "D) Try again"],
                    "correct_answer": "A",
                    "explanation": "The AI model is not properly configured."
                }]
            }
        
        try:
            if quiz_type == 'theory':
                prompt = f"""
                Based on the following content from slides/presentation for "{course_name}", create a quiz with {num_questions} open-ended theory questions:
                
                {text}
                
                Please format the response as JSON with the following structure:
                {{
                    "questions": [
                        {{
                            "question": "Question text here?",
                            "type": "theory",
                            "difficulty": "{difficulty}",
                            "answer_guidelines": "Key points that should be included in a good answer",
                            "topic": "Specific topic from the content"
                        }}
                    ]
                }}
                
                Focus on 'why', 'how', 'explain', 'compare', 'analyze' type questions that test deep understanding.
                """
            else:  # Default to MCQ
                prompt = f"""
                Based on the following content from slides/presentation for "{course_name}", create a quiz with {num_questions} multiple-choice questions:
                
                {text}
                
                Please format the response as JSON with the following structure:
                {{
                    "questions": [
                        {{
                            "question": "Question text here?",
                            "type": "mcq",
                            "difficulty": "{difficulty}",
                            "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
                            "correct_answer": "A",
                            "explanation": "Detailed explanation of why this answer is correct and others are wrong",
                            "topic": "Specific topic from the content"
                        }}
                    ]
                }}
                
                Make sure:
                1. Questions test understanding of key concepts from the content
                2. All options are plausible but only one is correct
                3. Explanations are educational and help learning
                4. Difficulty level is appropriate: easy (basic recall), medium (application), hard (analysis/synthesis)
                """
            
            response = self.model.generate_content(prompt)
            response_text = clean_json_response(response.text)
            
            try:
                quiz_data = json.loads(response_text)
                
                # Validate and enhance quiz structure
                if 'questions' not in quiz_data:
                    raise ValueError("Invalid quiz structure - no questions found")
                
                for i, question in enumerate(quiz_data['questions']):
                    # Ensure required fields
                    if 'question' not in question:
                        question['question'] = f"Question {i+1} - Please regenerate quiz"
                    
                    question['difficulty'] = question.get('difficulty', difficulty)
                    question['topic'] = question.get('topic', course_name)
                    question['type'] = question.get('type', quiz_type)
                    
                    if quiz_type == 'mcq':
                        # Ensure MCQ has proper structure
                        if 'options' not in question or len(question['options']) < 4:
                            question['options'] = ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"]
                        
                        if 'correct_answer' not in question:
                            question['correct_answer'] = "A"
                        
                        if 'explanation' not in question:
                            question['explanation'] = "Based on course material."
                
                return quiz_data
                
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse quiz JSON: {e}")
                return self._create_fallback_quiz(quiz_type, course_name)
            
        except Exception as e:
            logger.error(f"Error generating quiz: {e}")
            return self._create_fallback_quiz(quiz_type, course_name)
    
    def _create_fallback_quiz(self, quiz_type='mcq', course_name="General"):
        """Create a fallback quiz when AI generation fails"""
        if quiz_type == 'theory':
            return {
                "questions": [{
                    "question": f"What are the main topics covered in this {course_name} material?",
                    "type": "theory",
                    "difficulty": "medium",
                    "answer_guidelines": "List and briefly explain the key concepts, definitions, and topics covered in the uploaded material.",
                    "topic": course_name
                }]
            }
        else:
            return {
                "questions": [{
                    "question": f"Error generating quiz questions for {course_name}. Please try uploading the file again.",
                    "type": "mcq",
                    "difficulty": "medium",
                    "options": ["A) Try again", "B) Check file content", "C) Contact support", "D) Upload different file"],
                    "correct_answer": "A",
                    "explanation": "There was an error processing your content. Please try again.",
                    "topic": course_name
                }]
            }
    
    def generate_learning_checkpoints(self, text, course_name="General"):
        """Generate learning checkpoints from content"""
        if not self.model:
            return {"checkpoints": []}
        
        try:
            prompt = f"""
            Based on the following educational content from "{course_name}", create 3-5 learning checkpoints that will help verify student understanding:
            
            {text}
            
            Please format the response as JSON with the following structure:
            {{
                "checkpoints": [
                    {{
                        "id": 1,
                        "title": "Understanding Key Concept",
                        "description": "Explain the main concept discussed in the material",
                        "type": "reflection",
                        "difficulty": "easy",
                        "estimated_time": "5 minutes"
                    }}
                ]
            }}
            
            Types can be: "reflection", "application", "analysis", "synthesis"
            Difficulty can be: "easy", "medium", "hard"
            Create checkpoints that progressively test deeper understanding.
            """
            
            response = self.model.generate_content(prompt)
            response_text = clean_json_response(response.text)
            
            try:
                checkpoints_data = json.loads(response_text)
                return checkpoints_data
            except json.JSONDecodeError:
                return {"checkpoints": []}
                
        except Exception as e:
            logger.error(f"Error generating learning checkpoints: {e}")
            return {"checkpoints": []}

# Global content generator instance
content_generator = ContentGenerator()

def register_content_routes(app):
    """Register content generation routes with the Flask app"""
    
    @app.route('/generate-summary', methods=['POST'])
    def generate_summary_endpoint():
        """Generate summary from uploaded file"""
        try:
            data = request.get_json()
            
            if not data or 'filename' not in data:
                return jsonify({'error': 'Filename required'}), 400
            
            filename = data['filename']
            course_name = data.get('course_name', 'General')
            
            # Try multiple possible upload locations
            upload_folders = [
                app.config.get('UPLOAD_FOLDER', 'uploads'),
                'uploaded_slides',
                os.path.join(os.getcwd(), 'uploaded_slides'),
                os.path.join(os.getcwd(), 'uploads')
            ]
            
            file_path = None
            for folder in upload_folders:
                potential_path = os.path.join(folder, filename)
                if os.path.exists(potential_path):
                    file_path = potential_path
                    break
            
            if not file_path or not os.path.exists(file_path):
                return jsonify({'error': 'File not found'}), 404
            
            # Extract text based on file type
            file_extension = filename.rsplit('.', 1)[1].lower()
            extracted_text = FileProcessor.extract_text_by_extension(file_path, file_extension)
            
            if not extracted_text.strip():
                return jsonify({'error': 'No text could be extracted from the file'}), 400
            
            summary = content_generator.generate_summary(extracted_text, course_name)
            
            return jsonify({
                'status': 'success',
                'summary': summary,
                'filename': filename,
                'course_name': course_name
            })
            
        except Exception as e:
            logger.error(f"Error in summary generation endpoint: {str(e)}")
            return jsonify({'error': 'Error generating summary'}), 500

    @app.route('/generate-quiz', methods=['POST'])
    def generate_quiz_endpoint():
        """Generate quiz from uploaded file"""
        try:
            data = request.get_json()
            
            if not data or 'filename' not in data:
                return jsonify({'error': 'Filename required'}), 400
            
            filename = data['filename']
            quiz_type = data.get('quiz_type', 'mcq')
            difficulty = data.get('difficulty', 'medium')
            num_questions = min(data.get('num_questions', 5), 10)  # Limit to 10
            course_name = data.get('course_name', 'General')
            
            # Try multiple possible upload locations
            upload_folders = [
                app.config.get('UPLOAD_FOLDER', 'uploads'),
                'uploaded_slides',
                os.path.join(os.getcwd(), 'uploaded_slides'),
                os.path.join(os.getcwd(), 'uploads')
            ]
            
            file_path = None
            for folder in upload_folders:
                potential_path = os.path.join(folder, filename)
                if os.path.exists(potential_path):
                    file_path = potential_path
                    break
            
            if not file_path or not os.path.exists(file_path):
                return jsonify({'error': 'File not found'}), 404
            
            # Extract text based on file type
            file_extension = filename.rsplit('.', 1)[1].lower()
            extracted_text = FileProcessor.extract_text_by_extension(file_path, file_extension)
            
            if not extracted_text.strip():
                return jsonify({'error': 'No text could be extracted from the file'}), 400
            
            quiz_data = content_generator.generate_quiz(
                extracted_text, quiz_type, difficulty, num_questions, course_name
            )
            
            return jsonify({
                'status': 'success',
                'quiz': quiz_data,
                'filename': filename,
                'quiz_type': quiz_type,
                'difficulty': difficulty,
                'course_name': course_name
            })
            
        except Exception as e:
            logger.error(f"Error in quiz generation endpoint: {str(e)}")
            return jsonify({'error': 'Error generating quiz'}), 500

    @app.route('/generate-checkpoints', methods=['POST'])
    def generate_checkpoints():
        """Generate learning checkpoints for a file"""
        try:
            data = request.get_json()
            if not data or 'file_id' not in data:
                return jsonify({'error': 'File ID required'}), 400
            
            file_id = data['file_id']
            course_name = data.get('course_name', 'General')
            
            from bson import ObjectId
            file_data = files_collection.find_one({'_id': ObjectId(file_id)})
            
            if not file_data:
                return jsonify({'error': 'File not found'}), 404
            
            extracted_text = file_data['extracted_text']
            checkpoints_data = content_generator.generate_learning_checkpoints(extracted_text, course_name)
            
            return jsonify({
                'status': 'success',
                'checkpoints': checkpoints_data.get('checkpoints', []),
                'file_id': file_id,
                'filename': file_data['filename'],
                'course_name': course_name
            })
            
        except Exception as e:
            logger.error(f"Error generating checkpoints: {str(e)}")
            return jsonify({'error': 'Error generating learning checkpoints'}), 500

    @app.route('/save-quiz-result', methods=['POST'])
    def save_quiz_result():
        """Save quiz result and log activity"""
        try:
            data = request.get_json()
            required_fields = ['user_id', 'quiz', 'score', 'course_id']
            
            validation_errors = validate_input(data, required_fields)
            if validation_errors:
                return jsonify({'error': '; '.join(validation_errors)}), 400
            
            quiz_doc = {
                'user_id': data['user_id'],
                'quiz': data['quiz'],
                'score': data['score'],
                'course_id': data['course_id'],
                'course_name': data.get('course_name', 'General'),
                'quiz_type': data.get('quiz_type', 'mcq'),
                'difficulty': data.get('difficulty', 'medium'),
                'timestamp': datetime.utcnow().isoformat()
            }
            
            result = quizzes_collection.insert_one(quiz_doc)
            quiz_id = str(result.inserted_id)
            
            # Log activity
            activity_doc = {
                'user_id': data['user_id'],
                'type': 'quiz_complete',
                'description': f"Completed {data.get('quiz_type', 'MCQ')} quiz for {data.get('course_name', 'course')} with score {data['score']}%",
                'metadata': {
                    'quiz_id': quiz_id,
                    'score': data['score'],
                    'course_id': data['course_id'],
                    'quiz_type': data.get('quiz_type', 'mcq'),
                    'difficulty': data.get('difficulty', 'medium')
                },
                'timestamp': quiz_doc['timestamp']
            }
            activities_collection.insert_one(activity_doc)
            
            # Log user action
            log_user_action(data['user_id'], "quiz_completion", {
                "course_id": data['course_id'],
                "score": data['score'],
                "quiz_type": data.get('quiz_type', 'mcq')
            })
            
            return jsonify({
                'status': 'success',
                'message': 'Quiz result saved successfully',
                'quiz_id': quiz_id
            })
            
        except Exception as e:
            logger.error(f"Error saving quiz result: {str(e)}")
            return jsonify({'error': 'Error saving quiz result'}), 500

    @app.route('/save-summary', methods=['POST'])
    def save_summary():
        """Save summary and log activity"""
        try:
            data = request.get_json()
            required_fields = ['user_id', 'summary', 'course_id']
            
            validation_errors = validate_input(data, required_fields)
            if validation_errors:
                return jsonify({'error': '; '.join(validation_errors)}), 400
            
            summary_doc = {
                'user_id': data['user_id'],
                'summary': data['summary'],
                'course_id': data['course_id'],
                'course_name': data.get('course_name', 'General'),
                'file_id': data.get('file_id'),
                'timestamp': datetime.utcnow().isoformat()
            }
            
            result = summaries_collection.insert_one(summary_doc)
            summary_id = str(result.inserted_id)
            
            # Log activity
            activity_doc = {
                'user_id': data['user_id'],
                'type': 'summary_generate',
                'description': f"Generated summary for {data.get('course_name', 'course')}",
                'metadata': {
                    'summary_id': summary_id,
                    'course_id': data['course_id'],
                    'file_id': data.get('file_id')
                },
                'timestamp': summary_doc['timestamp']
            }
            activities_collection.insert_one(activity_doc)
            
            # Log user action
            log_user_action(data['user_id'], "summary_generation", {
                "course_id": data['course_id'],
                "file_id": data.get('file_id')
            })
            
            return jsonify({
                'status': 'success',
                'message': 'Summary saved successfully',
                'summary_id': summary_id
            })
            
        except Exception as e:
            logger.error(f"Error saving summary: {str(e)}")
            return jsonify({'error': 'Error saving summary'}), 500

    @app.route('/user-quizzes/<user_id>', methods=['GET'])
    def get_user_quizzes(user_id):
        """Get quiz history for a user"""
        try:
            course_id = request.args.get('course_id')
            limit = int(request.args.get('limit', 20))
            
            query = {'user_id': user_id}
            if course_id:
                query['course_id'] = course_id
            
            quizzes = quizzes_collection.find(query).sort('timestamp', -1).limit(limit)
            
            quiz_list = []
            for quiz in quizzes:
                quiz_data = {
                    'quiz_id': str(quiz['_id']),
                    'score': quiz.get('score'),
                    'course_id': quiz.get('course_id'),
                    'course_name': quiz.get('course_name', 'General'),
                    'quiz_type': quiz.get('quiz_type', 'mcq'),
                    'difficulty': quiz.get('difficulty', 'medium'),
                    'timestamp': quiz.get('timestamp'),
                    'question_count': len(quiz.get('quiz', {}).get('questions', []))
                }
                quiz_list.append(quiz_data)
            
            return jsonify({
                'status': 'success',
                'quizzes': quiz_list,
                'total_quizzes': len(quiz_list)
            })
            
        except Exception as e:
            logger.error(f"Error retrieving user quizzes: {str(e)}")
            return jsonify({'error': 'Error retrieving quiz history'}), 500

    @app.route('/user-summaries/<user_id>', methods=['GET'])
    def get_user_summaries(user_id):
        """Get summary history for a user"""
        try:
            course_id = request.args.get('course_id')
            limit = int(request.args.get('limit', 20))
            
            query = {'user_id': user_id}
            if course_id:
                query['course_id'] = course_id
            
            summaries = summaries_collection.find(query).sort('timestamp', -1).limit(limit)
            
            summary_list = []
            for summary in summaries:
                summary_data = {
                    'summary_id': str(summary['_id']),
                    'course_id': summary.get('course_id'),
                    'course_name': summary.get('course_name', 'General'),
                    'file_id': summary.get('file_id'),
                    'timestamp': summary.get('timestamp'),
                    'summary_preview': summary.get('summary', '')[:200] + "..." if len(summary.get('summary', '')) > 200 else summary.get('summary', '')
                }
                summary_list.append(summary_data)
            
            return jsonify({
                'status': 'success',
                'summaries': summary_list,
                'total_summaries': len(summary_list)
            })
            
        except Exception as e:
            logger.error(f"Error retrieving user summaries: {str(e)}")
            return jsonify({'error': 'Error retrieving summary history'}), 500

    logger.info("Content generation routes registered successfully")
