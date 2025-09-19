"""
Study analytics module for EduMaster application.
This module provides basic analytics endpoints for study sessions.
"""

import logging
from datetime import datetime, timedelta
from flask import request, jsonify
from bson import ObjectId

from database import study_sessions_collection

logger = logging.getLogger(__name__)

def register_study_analytics_routes(app):
    """Register study analytics routes with the Flask app"""
    
    @app.route('/slide-reading-analytics/<user_id>', methods=['GET'])
    def get_slide_reading_analytics(user_id):
        """Get detailed reading analytics for slides"""
        try:
            # Convert user_id to appropriate format
            try:
                user_object_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
            except:
                user_object_id = user_id

            course_id = request.args.get('courseId')
            filename = request.args.get('filename')
            days = int(request.args.get('days', 30))
            
            cutoff_date = datetime.now() - timedelta(days=days)
            
            # Build query for reading sessions
            query = {
                'userId': {'$in': [user_id, user_object_id]},
                'sessionType': 'slide_reading',
                'timestamp': {'$gte': cutoff_date}
            }
            
            if course_id:
                query['courseId'] = course_id
            if filename:
                query['filename'] = filename

            sessions = list(study_sessions_collection.find(query).sort('timestamp', -1))

            if not sessions:
                return jsonify({
                    'status': 'success',
                    'analytics': {
                        'total_reading_hours': 0,
                        'average_reading_speed': 0,
                        'average_comprehension_score': 0,
                        'total_slides_read': 0,
                        'average_efficiency': 0,
                        'reading_streak_days': 0,
                        'total_sessions': 0
                    }
                })

            # Calculate basic analytics
            total_active_time = sum(s.get('activeReadingTime', 0) for s in sessions)
            total_reading_hours = round(total_active_time / 3600, 1)
            
            reading_speeds = [s.get('readingSpeed', 0) for s in sessions if s.get('readingSpeed', 0) > 0]
            avg_reading_speed = round(sum(reading_speeds) / len(reading_speeds), 0) if reading_speeds else 0
            
            comprehension_scores = [s.get('comprehensionScore', 0) for s in sessions if s.get('comprehensionScore') is not None]
            avg_comprehension = round(sum(comprehension_scores) / len(comprehension_scores), 1) if comprehension_scores else 0
            
            efficiency_scores = [s.get('efficiency', 0) for s in sessions if s.get('efficiency') is not None]
            avg_efficiency = round(sum(efficiency_scores) / len(efficiency_scores), 1) if efficiency_scores else 0
            
            unique_slides = set((s.get('courseId'), s.get('filename')) for s in sessions)
            total_slides_read = len(unique_slides)
            
            # Calculate reading streak
            session_dates = [s['timestamp'].date() for s in sessions]
            unique_dates = sorted(set(session_dates), reverse=True)
            
            reading_streak = 0
            if unique_dates:
                current_date = datetime.now().date()
                for i, date in enumerate(unique_dates):
                    if date == current_date - timedelta(days=i):
                        reading_streak += 1
                    else:
                        break

            return jsonify({
                'status': 'success',
                'analytics': {
                    'total_reading_hours': total_reading_hours,
                    'average_reading_speed': avg_reading_speed,
                    'average_comprehension_score': avg_comprehension,
                    'total_slides_read': total_slides_read,
                    'average_efficiency': avg_efficiency,
                    'reading_streak_days': reading_streak,
                    'total_sessions': len(sessions),
                    'average_session_length_minutes': round(total_active_time / len(sessions) / 60, 1) if sessions else 0
                }
            })

        except Exception as e:
            logger.error(f"Error retrieving slide reading analytics: {str(e)}")
            return jsonify({'error': 'Error retrieving reading analytics'}), 500

    logger.info("Study analytics routes registered successfully")
