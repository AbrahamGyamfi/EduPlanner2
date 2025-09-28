"""
Quiz Analytics module for EduMaster application.
This module handles quiz performance statistics, trends, and analytics calculations.
"""

import logging
from datetime import datetime, timedelta
from flask import request, jsonify
from bson import ObjectId

from database import quiz_results_collection

logger = logging.getLogger(__name__)

def register_quiz_analytics_routes(app):
    """Register quiz analytics routes with the Flask app"""
    
    @app.route('/quiz-results/analytics/<user_id>', methods=['GET'])
    def get_quiz_analytics(user_id):
        """Get detailed analytics for user quiz performance"""
        try:
            # Convert user_id for MongoDB query
            try:
                user_object_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
            except:
                user_object_id = user_id

            # Get time range from query params
            days = int(request.args.get('days', 30))  # Default to last 30 days
            cutoff_date = datetime.now() - timedelta(days=days)
            
            # Build aggregation pipeline for analytics
            pipeline = [
                {
                    '$match': {
                        'userId': {'$in': [user_id, user_object_id]},
                        'completed_at': {'$gte': cutoff_date}
                    }
                },
                {
                    '$group': {
                        '_id': {
                            'course': '$courseId',
                            'type': '$quizType'
                        },
                        'count': {'$sum': 1},
                        'avg_score': {'$avg': '$percentage'},
                        'max_score': {'$max': '$percentage'},
                        'min_score': {'$min': '$percentage'},
                        'total_questions': {'$sum': '$totalQuestions'},
                        'total_correct': {'$sum': '$correctAnswers'},
                        'avg_time_spent': {'$avg': '$timeSpent'}
                    }
                }
            ]
            
            analytics_result = list(quiz_results_collection.aggregate(pipeline))
            
            # Process analytics data
            course_analytics = {}
            type_analytics = {}
            
            for item in analytics_result:
                course_id = item['_id']['course'] or 'general'
                quiz_type = item['_id']['type']
                
                # Course-based analytics
                if course_id not in course_analytics:
                    course_analytics[course_id] = {
                        'course_id': course_id,
                        'total_quizzes': 0,
                        'avg_score': 0,
                        'max_score': 0,
                        'min_score': 100,
                        'total_time_spent': 0,
                        'quiz_types': {}
                    }
                
                course_analytics[course_id]['total_quizzes'] += item['count']
                course_analytics[course_id]['avg_score'] = max(course_analytics[course_id]['avg_score'], item['avg_score'])
                course_analytics[course_id]['max_score'] = max(course_analytics[course_id]['max_score'], item['max_score'])
                course_analytics[course_id]['min_score'] = min(course_analytics[course_id]['min_score'], item['min_score'])
                course_analytics[course_id]['total_time_spent'] += item['avg_time_spent'] * item['count']
                course_analytics[course_id]['quiz_types'][quiz_type] = item['count']
                
                # Type-based analytics
                if quiz_type not in type_analytics:
                    type_analytics[quiz_type] = {
                        'quiz_type': quiz_type,
                        'count': 0,
                        'avg_score': 0,
                        'accuracy': 0
                    }
                
                type_analytics[quiz_type]['count'] += item['count']
                type_analytics[quiz_type]['avg_score'] = item['avg_score']
                if item['total_questions'] > 0:
                    type_analytics[quiz_type]['accuracy'] = (item['total_correct'] / item['total_questions']) * 100

            # Get performance trends (weekly data for the period)
            trends = get_performance_trends(user_id, days)
            
            return jsonify({
                'status': 'success',
                'analytics': {
                    'course_performance': list(course_analytics.values()),
                    'quiz_type_performance': list(type_analytics.values()),
                    'trends': trends,
                    'summary': calculate_quiz_stats(user_id),
                    'period_days': days
                }
            })
            
        except Exception as e:
            logger.error(f"Error retrieving quiz analytics: {str(e)}")
            return jsonify({'error': 'Error retrieving quiz analytics'}), 500

    @app.route('/quiz-results/stats/<user_id>', methods=['GET'])
    def get_quiz_stats(user_id):
        """Get comprehensive quiz statistics for a user"""
        try:
            stats = calculate_quiz_stats(user_id)
            return jsonify({
                'status': 'success',
                'stats': stats
            })
        except Exception as e:
            logger.error(f"Error getting quiz stats: {str(e)}")
            return jsonify({'error': 'Error retrieving quiz statistics'}), 500

    logger.info("Quiz analytics routes registered successfully")

def calculate_quiz_stats(user_id):
    """Calculate comprehensive quiz statistics for a user"""
    try:
        # Convert user_id for MongoDB query
        try:
            user_object_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
        except:
            user_object_id = user_id

        # Build aggregation pipeline
        pipeline = [
            {'$match': {'userId': {'$in': [user_id, user_object_id]}}},
            {
                '$group': {
                    '_id': None,
                    'total_quizzes': {'$sum': 1},
                    'total_questions': {'$sum': '$totalQuestions'},
                    'total_correct': {'$sum': '$correctAnswers'},
                    'avg_score': {'$avg': '$percentage'},
                    'max_score': {'$max': '$percentage'},
                    'min_score': {'$min': '$percentage'},
                    'total_time_spent': {'$sum': '$timeSpent'},
                    'mcq_count': {
                        '$sum': {'$cond': [{'$eq': ['$quizType', 'mcq']}, 1, 0]}
                    },
                    'theory_count': {
                        '$sum': {'$cond': [{'$eq': ['$quizType', 'theory']}, 1, 0]}
                    }
                }
            }
        ]
        
        result = list(quiz_results_collection.aggregate(pipeline))
        
        if result:
            stats = result[0]
            # Calculate derived metrics
            total_accuracy = (stats['total_correct'] / stats['total_questions'] * 100) if stats['total_questions'] > 0 else 0
            avg_time_per_question = stats['total_time_spent'] / stats['total_questions'] if stats['total_questions'] > 0 else 0
            
            return {
                'total_quizzes': stats['total_quizzes'],
                'total_questions': stats['total_questions'],
                'total_correct': stats['total_correct'],
                'total_incorrect': stats['total_questions'] - stats['total_correct'],
                'overall_accuracy': round(total_accuracy, 1),
                'average_score': round(stats['avg_score'], 1),
                'highest_score': stats['max_score'],
                'lowest_score': stats['min_score'],
                'total_time_spent': stats['total_time_spent'],  # in seconds
                'total_time_spent_hours': round(stats['total_time_spent'] / 3600, 1),
                'avg_time_per_question': round(avg_time_per_question, 1),
                'quiz_type_breakdown': {
                    'mcq': stats['mcq_count'],
                    'theory': stats['theory_count']
                },
                'performance_level': get_performance_level(stats['avg_score'])
            }
        else:
            # Return default stats if no quizzes taken yet
            return {
                'total_quizzes': 0,
                'total_questions': 0,
                'total_correct': 0,
                'total_incorrect': 0,
                'overall_accuracy': 0,
                'average_score': 0,
                'highest_score': 0,
                'lowest_score': 0,
                'total_time_spent': 0,
                'total_time_spent_hours': 0,
                'avg_time_per_question': 0,
                'quiz_type_breakdown': {
                    'mcq': 0,
                    'theory': 0
                },
                'performance_level': 'No data'
            }
            
    except Exception as e:
        logger.error(f"Error calculating quiz stats: {str(e)}")
        return {}

def get_performance_trends(user_id, days_back):
    """Get performance trends over time"""
    try:
        # Convert user_id for MongoDB query
        try:
            user_object_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
        except:
            user_object_id = user_id

        cutoff_date = datetime.now() - timedelta(days=days_back)
        
        # Get quiz results grouped by week
        pipeline = [
            {
                '$match': {
                    'userId': {'$in': [user_id, user_object_id]},
                    'completed_at': {'$gte': cutoff_date}
                }
            },
            {
                '$group': {
                    '_id': {
                        'week': {'$week': '$completed_at'},
                        'year': {'$year': '$completed_at'}
                    },
                    'avg_score': {'$avg': '$percentage'},
                    'quiz_count': {'$sum': 1},
                    'total_time': {'$sum': '$timeSpent'},
                    'week_start': {'$min': '$completed_at'}
                }
            },
            {'$sort': {'week_start': 1}}
        ]
        
        trends_result = list(quiz_results_collection.aggregate(pipeline))
        
        trends = []
        for trend in trends_result:
            trends.append({
                'week': f"{trend['_id']['year']}-W{trend['_id']['week']}",
                'avg_score': round(trend['avg_score'], 1),
                'quiz_count': trend['quiz_count'],
                'total_time_hours': round(trend['total_time'] / 3600, 1),
                'week_start': trend['week_start'].isoformat()
            })
        
        return trends
        
    except Exception as e:
        logger.error(f"Error getting performance trends: {str(e)}")
        return []

def get_performance_level(avg_score):
    """Determine performance level based on average score"""
    if avg_score >= 90:
        return "Excellent"
    elif avg_score >= 80:
        return "Very Good"
    elif avg_score >= 70:
        return "Good"
    elif avg_score >= 60:
        return "Fair"
    elif avg_score > 0:
        return "Needs Improvement"
    else:
        return "No data"

def get_subject_performance(user_id, days_back=30):
    """Get performance breakdown by subject/tags"""
    try:
        user_object_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
        cutoff_date = datetime.now() - timedelta(days=days_back)
        
        pipeline = [
            {
                '$match': {
                    'userId': {'$in': [user_id, user_object_id]},
                    'completed_at': {'$gte': cutoff_date}
                }
            },
            {
                '$unwind': {
                    'path': '$tags',
                    'preserveNullAndEmptyArrays': True
                }
            },
            {
                '$group': {
                    '_id': '$tags',
                    'quiz_count': {'$sum': 1},
                    'avg_score': {'$avg': '$percentage'},
                    'total_questions': {'$sum': '$totalQuestions'},
                    'total_correct': {'$sum': '$correctAnswers'}
                }
            }
        ]
        
        subject_results = list(quiz_results_collection.aggregate(pipeline))
        
        subjects = []
        for result in subject_results:
            subject_name = result['_id'] or 'General'
            accuracy = (result['total_correct'] / result['total_questions'] * 100) if result['total_questions'] > 0 else 0
            
            subjects.append({
                'subject': subject_name,
                'quiz_count': result['quiz_count'],
                'avg_score': round(result['avg_score'], 1),
                'accuracy': round(accuracy, 1),
                'strength_level': get_performance_level(result['avg_score'])
            })
        
        return sorted(subjects, key=lambda x: x['avg_score'], reverse=True)
        
    except Exception as e:
        logger.error(f"Error getting subject performance: {str(e)}")
        return []
