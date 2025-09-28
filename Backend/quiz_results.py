"""
Quiz Results management module for EduMaster application.
This module handles basic quiz result CRUD operations.
"""

import logging
from datetime import datetime, timedelta
from flask import request, jsonify
from bson import ObjectId

from database import quiz_results_collection, users_collection, study_sessions_collection
from utils import validate_input, log_user_action
from quiz_analytics import calculate_quiz_stats, get_performance_trends

logger = logging.getLogger(__name__)

def register_quiz_results_routes(app):
    """Register quiz results management routes with the Flask app"""
    
    @app.route('/quiz-results', methods=['POST'])
    def save_quiz_result_detailed():
        """Save a completed quiz result"""
        try:
            data = request.json
            if not data:
                return jsonify({'error': 'No data provided'}), 400

            # Validate required fields
            required_fields = ['userId', 'quizId', 'score', 'totalQuestions', 'correctAnswers', 'quizType']
            validation_errors = validate_input(data, required_fields)

            if validation_errors:
                return jsonify({'error': '; '.join(validation_errors)}), 400

            # Create quiz result document
            quiz_result_data = {
                "userId": data.get('userId'),
                "quizId": data.get('quizId'),
                "courseId": data.get('courseId'),
                "courseName": data.get('courseName', 'General'),
                "filename": data.get('filename'),
                "quizTitle": data.get('quizTitle', 'Untitled Quiz'),
                "score": int(data.get('score')),
                "percentage": float(data.get('percentage', data.get('score'))),
                "totalQuestions": int(data.get('totalQuestions')),
                "correctAnswers": int(data.get('correctAnswers')),
                "incorrectAnswers": int(data.get('totalQuestions')) - int(data.get('correctAnswers')),
                "quizType": data.get('quizType'),  # 'mcq', 'theory', 'mixed'
                "difficulty": data.get('difficulty', 'medium'),
                "timeSpent": data.get('timeSpent', 0),
                "questions": data.get('questions', []),
                "userAnswers": data.get('userAnswers', []),
                "correctAnswersList": data.get('correctAnswersList', []),
                "tags": data.get('tags', []),
                "studySession": {
                    "sessionId": data.get('sessionId'),
                    "sessionType": data.get('sessionType', 'individual'),
                    "device": data.get('device', 'web'),
                    "location": data.get('location', 'unknown')
                },
                "performance": calculate_performance_metrics(data),
                "completed_at": datetime.now(),
                "created_at": datetime.now(),
                "updated_at": datetime.now()
            }

            result = quiz_results_collection.insert_one(quiz_result_data)

            if result.inserted_id:
                # Create unified study session entry for quiz activity
                create_quiz_study_session(data, quiz_result_data, str(result.inserted_id))
                
                # Log quiz completion
                log_user_action(data.get('userId'), "quiz_completed", {
                    "quiz_result_id": str(result.inserted_id),
                    "score": quiz_result_data['score'],
                    "percentage": quiz_result_data['percentage'],
                    "quiz_type": quiz_result_data['quizType'],
                    "course_id": quiz_result_data.get('courseId')
                })
                
                logger.info(f"Quiz result saved: User {data.get('userId')}, Score: {quiz_result_data['score']}")
                
                return jsonify({
                    'status': 'success',
                    'message': 'Quiz result saved successfully',
                    'quiz_result_id': str(result.inserted_id),
                    'performance': quiz_result_data['performance']
                }), 201
            else:
                return jsonify({'error': 'Failed to save quiz result'}), 500

        except Exception as e:
            logger.error(f"Error saving quiz result: {str(e)}")
            return jsonify({'error': 'Internal server error'}), 500

    @app.route('/quiz-results/<user_id>', methods=['GET'])
    def get_quiz_results(user_id):
        """Get quiz results for a user with filtering options"""
        try:
            # Convert user_id to appropriate format for MongoDB query
            try:
                user_object_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
            except:
                user_object_id = user_id
            
            # Get query parameters for filtering
            course_id = request.args.get('course_id')
            quiz_type = request.args.get('quiz_type')
            limit = int(request.args.get('limit', 50))
            sort_by = request.args.get('sort_by', 'completed_at')
            sort_order = request.args.get('sort_order', 'desc')
            days_back = int(request.args.get('days_back', 0))
            
            # Build query
            query = {'userId': {'$in': [user_id, user_object_id]}}
            
            if course_id:
                query['courseId'] = course_id
            if quiz_type:
                query['quizType'] = quiz_type
            if days_back > 0:
                cutoff_date = datetime.now() - timedelta(days=days_back)
                query['completed_at'] = {'$gte': cutoff_date}
            
            # Build sort criteria
            sort_direction = 1 if sort_order == 'asc' else -1
            quiz_results = quiz_results_collection.find(query).sort(sort_by, sort_direction).limit(limit)
            
            result_list = []
            for result in quiz_results:
                result_data = {
                    'quiz_result_id': str(result['_id']),
                    'quizId': result.get('quizId'),
                    'courseId': result.get('courseId'),
                    'courseName': result.get('courseName'),
                    'filename': result.get('filename'),
                    'quizTitle': result.get('quizTitle'),
                    'score': result.get('score'),
                    'percentage': result.get('percentage'),
                    'totalQuestions': result.get('totalQuestions'),
                    'correctAnswers': result.get('correctAnswers'),
                    'incorrectAnswers': result.get('incorrectAnswers'),
                    'quizType': result.get('quizType'),
                    'difficulty': result.get('difficulty'),
                    'timeSpent': result.get('timeSpent'),
                    'tags': result.get('tags', []),
                    'performance': result.get('performance', {}),
                    'completed_at': result.get('completed_at').isoformat() if result.get('completed_at') else None
                }
                result_list.append(result_data)
            
            # Get summary statistics
            stats = calculate_quiz_stats(user_id)
            
            return jsonify({
                'status': 'success',
                'quiz_results': result_list,
                'stats': stats,
                'total_results': len(result_list)
            })
            
        except Exception as e:
            logger.error(f"Error retrieving quiz results: {str(e)}")
            return jsonify({'error': 'Error retrieving quiz results'}), 500

    @app.route('/quiz-results/<quiz_result_id>', methods=['GET'])
    def get_quiz_result_details(quiz_result_id):
        """Get detailed information about a specific quiz result"""
        try:
            try:
                quiz_result_object_id = ObjectId(quiz_result_id)
            except:
                return jsonify({'error': 'Invalid quiz result ID format'}), 400

            quiz_result = quiz_results_collection.find_one({"_id": quiz_result_object_id})
            
            if not quiz_result:
                return jsonify({'error': 'Quiz result not found'}), 404

            result_data = {
                'quiz_result_id': str(quiz_result['_id']),
                'quizId': quiz_result.get('quizId'),
                'courseId': quiz_result.get('courseId'),
                'courseName': quiz_result.get('courseName'),
                'filename': quiz_result.get('filename'),
                'quizTitle': quiz_result.get('quizTitle'),
                'score': quiz_result.get('score'),
                'percentage': quiz_result.get('percentage'),
                'totalQuestions': quiz_result.get('totalQuestions'),
                'correctAnswers': quiz_result.get('correctAnswers'),
                'incorrectAnswers': quiz_result.get('incorrectAnswers'),
                'quizType': quiz_result.get('quizType'),
                'difficulty': quiz_result.get('difficulty'),
                'timeSpent': quiz_result.get('timeSpent'),
                'tags': quiz_result.get('tags', []),
                'questions': quiz_result.get('questions', []),
                'userAnswers': quiz_result.get('userAnswers', []),
                'correctAnswersList': quiz_result.get('correctAnswersList', []),
                'studySession': quiz_result.get('studySession', {}),
                'performance': quiz_result.get('performance', {}),
                'completed_at': quiz_result.get('completed_at').isoformat() if quiz_result.get('completed_at') else None
            }

            return jsonify({
                'status': 'success',
                'quiz_result': result_data
            })

        except Exception as e:
            logger.error(f"Error retrieving quiz result details: {str(e)}")
            return jsonify({'error': 'Error retrieving quiz result details'}), 500

    @app.route('/quiz-results/<quiz_result_id>', methods=['DELETE'])
    def delete_quiz_result(quiz_result_id):
        """Delete a quiz result"""
        try:
            try:
                quiz_result_object_id = ObjectId(quiz_result_id)
            except:
                return jsonify({'error': 'Invalid quiz result ID format'}), 400
            
            # Check if quiz result exists and get user info for logging
            quiz_result = quiz_results_collection.find_one({"_id": quiz_result_object_id})
            if not quiz_result:
                return jsonify({'error': 'Quiz result not found'}), 404
            
            # Verify ownership if user_id is provided
            user_id = request.args.get('user_id')
            if user_id and user_id != str(quiz_result.get('userId')):
                return jsonify({'error': 'Unauthorized to delete this quiz result'}), 403
            
            # Delete the quiz result
            result = quiz_results_collection.delete_one({"_id": quiz_result_object_id})
            
            if result.deleted_count > 0:
                log_user_action(str(quiz_result.get('userId')), "quiz_result_delete", {
                    "quiz_result_id": quiz_result_id,
                    "quiz_title": quiz_result.get('quizTitle'),
                    "score": quiz_result.get('score')
                })
                
                logger.info(f"Quiz result deleted successfully: {quiz_result_id}")
                return jsonify({
                    'status': 'success',
                    'message': 'Quiz result deleted successfully'
                }), 200
            else:
                return jsonify({'error': 'Failed to delete quiz result'}), 500
                
        except Exception as e:
            logger.error(f"Error deleting quiz result: {str(e)}")
            return jsonify({'error': 'Internal server error'}), 500

    logger.info("Quiz results management routes registered successfully")

def create_quiz_study_session(data, quiz_result_data, quiz_result_id):
    """Create a unified study session entry for quiz activity"""
    try:
        user_id = data.get('userId')
        time_spent = data.get('timeSpent', 0)
        completed_at = quiz_result_data.get('completed_at')
        
        # Calculate start time based on completion time and duration
        start_time = completed_at - timedelta(seconds=time_spent) if completed_at and time_spent > 0 else completed_at
        
        # Create unified study session document
        study_session = {
            "userId": user_id,
            "sessionType": "quiz",
            "activityType": "quiz",
            "courseId": quiz_result_data.get('courseId'),
            "courseName": quiz_result_data.get('courseName', 'General'),
            "filename": quiz_result_data.get('filename'),
            "title": quiz_result_data.get('quizTitle', 'Untitled Quiz'),
            "content": f"Quiz: {quiz_result_data.get('quizTitle', 'Untitled Quiz')}",
            "duration": time_spent,
            "totalTime": time_spent,
            "activeTime": time_spent,
            "startTime": start_time,
            "endTime": completed_at,
            "status": "completed",
            "progress": 100,  # Quiz is fully completed
            "device": data.get('device', 'web'),
            "location": data.get('location', 'unknown'),
            
            # Quiz-specific fields
            "quizData": {
                "quizId": quiz_result_data.get('quizId'),
                "quizResultId": quiz_result_id,
                "score": quiz_result_data.get('score'),
                "percentage": quiz_result_data.get('percentage'),
                "totalQuestions": quiz_result_data.get('totalQuestions'),
                "correctAnswers": quiz_result_data.get('correctAnswers'),
                "incorrectAnswers": quiz_result_data.get('incorrectAnswers'),
                "quizType": quiz_result_data.get('quizType'),
                "difficulty": quiz_result_data.get('difficulty'),
                "performance": quiz_result_data.get('performance', {})
            },
            
            # Performance metrics
            "efficiency": calculate_quiz_efficiency(quiz_result_data, time_spent),
            "productivityScore": calculate_quiz_productivity_score(quiz_result_data),
            
            # Timestamps
            "timestamp": completed_at,  # Main timestamp used by analytics
            "createdAt": datetime.now(),
            "updatedAt": datetime.now(),
            "syncedAt": datetime.now()
        }
        
        # Insert into study sessions collection
        result = study_sessions_collection.insert_one(study_session)
        
        if result.inserted_id:
            logger.info(f"Quiz study session created: {str(result.inserted_id)} for user {user_id}")
            return str(result.inserted_id)
        else:
            logger.warning(f"Failed to create quiz study session for user {user_id}")
            return None
            
    except Exception as e:
        logger.error(f"Error creating quiz study session: {str(e)}")
        return None

def calculate_quiz_efficiency(quiz_result_data, time_spent):
    """Calculate efficiency score for quiz session"""
    try:
        total_questions = quiz_result_data.get('totalQuestions', 0)
        correct_answers = quiz_result_data.get('correctAnswers', 0)
        
        if total_questions == 0 or time_spent == 0:
            return 0
        
        # Base efficiency: correct answers per minute
        base_efficiency = (correct_answers / (time_spent / 60)) if time_spent > 0 else 0
        
        # Accuracy multiplier
        accuracy = (correct_answers / total_questions) if total_questions > 0 else 0
        
        # Efficiency score (0-100)
        efficiency = min(100, base_efficiency * accuracy * 10)
        
        return round(efficiency, 2)
        
    except Exception as e:
        logger.warning(f"Error calculating quiz efficiency: {e}")
        return 0

def calculate_quiz_productivity_score(quiz_result_data):
    """Calculate productivity score for quiz session"""
    try:
        percentage = quiz_result_data.get('percentage', 0)
        difficulty_multiplier = {
            'easy': 0.8,
            'medium': 1.0,
            'hard': 1.2
        }.get(quiz_result_data.get('difficulty', 'medium'), 1.0)
        
        # Base score from percentage with difficulty adjustment
        productivity_score = percentage * difficulty_multiplier
        
        # Cap at 100
        productivity_score = min(100, productivity_score)
        
        return round(productivity_score, 2)
        
    except Exception as e:
        logger.warning(f"Error calculating quiz productivity score: {e}")
        return 0

def calculate_performance_metrics(data):
    """Calculate performance metrics for a quiz attempt"""
    try:
        total_questions = int(data.get('totalQuestions', 0))
        correct_answers = int(data.get('correctAnswers', 0))
        time_spent = data.get('timeSpent', 0)
        
        accuracy = (correct_answers / total_questions * 100) if total_questions > 0 else 0
        speed = time_spent / total_questions if total_questions > 0 else 0
        
        # Calculate improvement (will be enhanced with previous attempts data)
        improvement = 0
        
        return {
            "accuracy": round(accuracy, 2),
            "speed": round(speed, 2),
            "improvement": improvement
        }
    except Exception as e:
        logger.warning(f"Error calculating performance metrics: {e}")
        return {"accuracy": 0, "speed": 0, "improvement": 0}
