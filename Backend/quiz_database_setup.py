"""
Quiz Database Setup for EduMaster application.
This module sets up the database collections and indexes for quiz results.
"""

import logging
from database import get_database

logger = logging.getLogger(__name__)

def setup_quiz_collections():
    """Set up quiz-related collections and indexes"""
    try:
        db = get_database()
        
        # Create quiz_results collection with indexes
        quiz_results_collection = db.quiz_results
        
        # Create indexes for better performance
        indexes_to_create = [
            # Single field indexes
            [("userId", 1)],
            [("courseId", 1)],
            [("quizType", 1)],
            [("completed_at", -1)],
            [("percentage", -1)],
            
            # Compound indexes for common queries
            [("userId", 1), ("completed_at", -1)],
            [("userId", 1), ("courseId", 1)],
            [("userId", 1), ("quizType", 1)],
            [("courseId", 1), ("completed_at", -1)],
            
            # Text index for searching
            [("quizTitle", "text"), ("courseName", "text"), ("filename", "text")]
        ]
        
        for index_fields in indexes_to_create:
            try:
                if len(index_fields) == 1 and index_fields[0][1] == "text":
                    # Handle text indexes differently
                    quiz_results_collection.create_index(index_fields[0])
                else:
                    quiz_results_collection.create_index(index_fields)
                logger.info(f"Created index: {index_fields}")
            except Exception as e:
                logger.warning(f"Index may already exist: {index_fields}, Error: {e}")
        
        # Create a sample document structure (will be removed in production)
        sample_quiz_result = {
            "userId": "sample_user_id",
            "quizId": "sample_quiz_id", 
            "courseId": "sample_course_id",
            "courseName": "Sample Course",
            "filename": "sample_document.pdf",
            "quizTitle": "Sample Quiz Title",
            "score": 85,
            "percentage": 85.0,
            "totalQuestions": 10,
            "correctAnswers": 8,
            "incorrectAnswers": 2,
            "quizType": "mcq",  # 'mcq', 'theory', 'mixed'
            "difficulty": "medium",  # 'easy', 'medium', 'hard'
            "timeSpent": 300,  # in seconds
            "questions": [],  # Array of question objects
            "userAnswers": [],  # Array of user's answers
            "correctAnswersList": [],  # Array of correct answers
            "tags": ["mathematics", "algebra"],  # Subject tags
            "studySession": {
                "sessionId": "session_123",
                "sessionType": "individual",  # 'individual', 'group'
                "device": "web",  # 'web', 'mobile', 'tablet'
                "location": "home"  # 'home', 'library', etc.
            },
            "performance": {
                "accuracy": 80.0,  # percentage of correct answers
                "speed": 30.0,  # average seconds per question
                "improvement": 5.0  # improvement from previous attempts
            },
            "completed_at": "2024-01-15T10:30:00",
            "created_at": "2024-01-15T10:30:00",
            "updated_at": "2024-01-15T10:30:00"
        }
        
        logger.info("Quiz results collection setup completed successfully")
        logger.info("Sample document structure defined for quiz_results collection")
        
        return True
        
    except Exception as e:
        logger.error(f"Error setting up quiz collections: {str(e)}")
        return False

def setup_quiz_analytics_views():
    """Set up database views for common analytics queries"""
    try:
        db = get_database()
        
        # Create a view for user performance summary
        user_performance_pipeline = [
            {
                "$group": {
                    "_id": "$userId",
                    "total_quizzes": {"$sum": 1},
                    "avg_score": {"$avg": "$percentage"},
                    "total_questions": {"$sum": "$totalQuestions"},
                    "total_correct": {"$sum": "$correctAnswers"},
                    "total_time_spent": {"$sum": "$timeSpent"},
                    "quiz_types": {"$addToSet": "$quizType"},
                    "courses": {"$addToSet": "$courseId"},
                    "last_quiz_date": {"$max": "$completed_at"},
                    "first_quiz_date": {"$min": "$completed_at"}
                }
            },
            {
                "$addFields": {
                    "overall_accuracy": {
                        "$cond": [
                            {"$gt": ["$total_questions", 0]},
                            {"$multiply": [{"$divide": ["$total_correct", "$total_questions"]}, 100]},
                            0
                        ]
                    },
                    "avg_time_per_question": {
                        "$cond": [
                            {"$gt": ["$total_questions", 0]},
                            {"$divide": ["$total_time_spent", "$total_questions"]},
                            0
                        ]
                    }
                }
            }
        ]
        
        try:
            db.create_collection("user_quiz_performance", viewOn="quiz_results", pipeline=user_performance_pipeline)
            logger.info("Created user_quiz_performance view")
        except Exception as e:
            logger.warning(f"View may already exist: user_quiz_performance, Error: {e}")
        
        # Create a view for course performance summary
        course_performance_pipeline = [
            {
                "$group": {
                    "_id": "$courseId",
                    "course_name": {"$first": "$courseName"},
                    "total_attempts": {"$sum": 1},
                    "unique_users": {"$addToSet": "$userId"},
                    "avg_score": {"$avg": "$percentage"},
                    "avg_time_spent": {"$avg": "$timeSpent"},
                    "quiz_types": {"$addToSet": "$quizType"},
                    "difficulty_levels": {"$addToSet": "$difficulty"}
                }
            },
            {
                "$addFields": {
                    "unique_user_count": {"$size": "$unique_users"}
                }
            },
            {
                "$project": {
                    "unique_users": 0  # Remove the array, keep only the count
                }
            }
        ]
        
        try:
            db.create_collection("course_quiz_performance", viewOn="quiz_results", pipeline=course_performance_pipeline)
            logger.info("Created course_quiz_performance view")
        except Exception as e:
            logger.warning(f"View may already exist: course_quiz_performance, Error: {e}")
            
        return True
        
    except Exception as e:
        logger.error(f"Error setting up quiz analytics views: {str(e)}")
        return False

def validate_quiz_result_data(quiz_data):
    """Validate quiz result data before insertion"""
    required_fields = [
        'userId', 'quizId', 'score', 'totalQuestions', 
        'correctAnswers', 'quizType'
    ]
    
    validation_errors = []
    
    # Check required fields
    for field in required_fields:
        if field not in quiz_data or quiz_data[field] is None:
            validation_errors.append(f"Missing required field: {field}")
    
    # Validate data types and ranges
    if 'score' in quiz_data:
        try:
            score = int(quiz_data['score'])
            if score < 0 or score > 100:
                validation_errors.append("Score must be between 0 and 100")
        except (ValueError, TypeError):
            validation_errors.append("Score must be a valid integer")
    
    if 'totalQuestions' in quiz_data:
        try:
            total_questions = int(quiz_data['totalQuestions'])
            if total_questions <= 0:
                validation_errors.append("Total questions must be greater than 0")
        except (ValueError, TypeError):
            validation_errors.append("Total questions must be a valid positive integer")
    
    if 'correctAnswers' in quiz_data:
        try:
            correct_answers = int(quiz_data['correctAnswers'])
            total_questions = int(quiz_data.get('totalQuestions', 0))
            if correct_answers < 0 or correct_answers > total_questions:
                validation_errors.append("Correct answers must be between 0 and total questions")
        except (ValueError, TypeError):
            validation_errors.append("Correct answers must be a valid integer")
    
    if 'quizType' in quiz_data:
        valid_quiz_types = ['mcq', 'theory', 'mixed']
        if quiz_data['quizType'] not in valid_quiz_types:
            validation_errors.append(f"Quiz type must be one of: {', '.join(valid_quiz_types)}")
    
    if 'difficulty' in quiz_data:
        valid_difficulties = ['easy', 'medium', 'hard']
        if quiz_data['difficulty'] not in valid_difficulties:
            validation_errors.append(f"Difficulty must be one of: {', '.join(valid_difficulties)}")
    
    return validation_errors

if __name__ == "__main__":
    # Run setup when this file is executed directly
    print("Setting up quiz database collections and indexes...")
    
    success = setup_quiz_collections()
    if success:
        print("✅ Quiz collections setup completed successfully")
    else:
        print("❌ Failed to setup quiz collections")
    
    success = setup_quiz_analytics_views()
    if success:
        print("✅ Quiz analytics views setup completed successfully")
    else:
        print("❌ Failed to setup quiz analytics views")
    
    print("Quiz database setup completed!")
