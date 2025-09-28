"""
Study session tracking module for EduMaster application.
This module handles study session recording, analytics, and behavior metrics.
"""

import logging
from datetime import datetime, timedelta
from flask import request, jsonify
from bson import ObjectId

from database import study_sessions_collection, users_collection, files_collection
from utils import validate_input, log_user_action

logger = logging.getLogger(__name__)

def update_user_behavior_metrics(user_id, session_data):
    """Update user behavior metrics based on study sessions"""
    try:
        # Get recent sessions to calculate updated metrics
        cutoff_date = datetime.now() - timedelta(days=30)
        recent_sessions = list(study_sessions_collection.find({
            'userId': user_id,
            'timestamp': {'$gte': cutoff_date}
        }))

        if not recent_sessions:
            return

        # Calculate behavior metrics
        total_active_time = sum(s.get('activeTime', 0) for s in recent_sessions)
        average_efficiency = sum(s.get('efficiency', 100) for s in recent_sessions) / len(recent_sessions)
        
        # Calculate consistency score based on frequency and regularity
        session_dates = [s['timestamp'].date() for s in recent_sessions]
        unique_dates = set(session_dates)
        consistency_score = len(unique_dates) * 3.33  # Up to 100% for 30 days
        
        # Update user behavior metrics
        behavior_metrics = {
            'total_study_time': total_active_time,
            'average_efficiency': round(average_efficiency, 1),
            'consistency_score': min(consistency_score, 100),
            'total_sessions': len(recent_sessions),
            'last_updated': datetime.now()
        }

        users_collection.update_one(
            {"_id": ObjectId(user_id) if isinstance(user_id, str) else user_id},
            {"$set": {"behavior_metrics": behavior_metrics}}
        )

    except Exception as e:
        logger.error(f"Error updating user behavior metrics: {str(e)}")

def register_study_session_routes(app):
    """Register study session routes with the Flask app"""
    
    @app.route('/study-sessions', methods=['POST'])
    def record_study_session():
        """Record enhanced study session"""
        try:
            data = request.json
            if not data:
                return jsonify({'error': 'No data provided'}), 400

            # Validate required fields
            required_fields = ['userId', 'courseId', 'courseName']
            validation_errors = validate_input(data, required_fields)

            if validation_errors:
                return jsonify({'error': '; '.join(validation_errors)}), 400

            # Create enhanced study session record
            session_data = {
                "userId": data.get('userId'),
                "courseId": data.get('courseId'),
                "courseName": data.get('courseName'),
                "sessionType": data.get('sessionType', 'general_study'),  # 'general_study', 'slide_reading', 'quiz_taking', etc.
                "trackingMode": data.get('trackingMode', 'manual'),  # 'manual' or 'automatic'
                "duration": data.get('duration', 0),  # Total intended duration (manual mode)
                "activeTime": data.get('activeTime', data.get('duration', 0)),  # Actual active time
                "totalDuration": data.get('totalDuration', data.get('duration', 0)),  # Total session time
                "efficiency": data.get('efficiency', 100),  # Percentage of active time
                "inactiveTime": data.get('inactiveTime', 0),  # Time spent inactive
                "pauseCount": data.get('pauseCount', 0),  # Number of times paused
                "date": data.get('date', datetime.now().isoformat()[:10]),
                "timestamp": datetime.now(),
                "sessionMetrics": {
                    "averageActiveStreak": data.get('averageActiveStreak', 0),  # Average continuous active time
                    "longestActiveStreak": data.get('longestActiveStreak', 0),  # Longest active period
                    "distractionCount": data.get('distractionCount', 0),  # Number of times became inactive
                    "focusScore": data.get('focusScore', 100)  # Overall focus quality score
                },
                "studyMethods": data.get('studyMethods', []),  # Methods used (reading, quiz, notes, etc.)
                "difficulty": data.get('difficulty', 'medium'),  # perceived difficulty
                "satisfaction": data.get('satisfaction', 5),  # satisfaction rating 1-5
                "notes": data.get('notes', ''),  # session notes
                "goals_met": data.get('goals_met', True),  # whether session goals were met
                "status": data.get('status', 'completed'),  # 'active', 'paused', 'completed'
                "lastActivity": datetime.now(),  # Track last activity for real-time monitoring
                # Reading-specific fields (for reading sessions)
                "readingMetrics": data.get('readingMetrics', {}),  # Reading-specific data
                "activeReadingTime": data.get('activeReadingTime', 0),  # Time actively reading (in seconds)
                "readingProgress": data.get('readingProgress', 0),  # Percentage of content read
                "comprehensionScore": data.get('comprehensionScore', 0),  # Comprehension assessment
                "readingSpeed": data.get('readingSpeed', 0),  # Words per minute
                "filename": data.get('filename', None),  # File being read (for reading sessions)
                "currentPage": data.get('currentPage', 0),  # Current page number
                "totalPages": data.get('totalPages', 0),  # Total pages in document
                "created_at": datetime.now()
            }

            result = study_sessions_collection.insert_one(session_data)

            if result.inserted_id:
                # Update user behavior metrics
                try:
                    update_user_behavior_metrics(data.get('userId'), session_data)
                except Exception as e:
                    logger.warning(f"Failed to update behavior metrics: {e}")
                
                # Log user action
                log_user_action(data.get('userId'), "study_session_recorded", {
                    "course_id": data.get('courseId'),
                    "active_time": session_data['activeTime'],
                    "efficiency": session_data['efficiency']
                })
                
                logger.info(f"Study session recorded: {data.get('courseName')} - {data.get('activeTime')} minutes active")
                
                return jsonify({
                    'status': 'success',
                    'message': 'Study session recorded successfully',
                    'session_id': str(result.inserted_id),
                    'efficiency': session_data['efficiency'],
                    'activeTime': session_data['activeTime'],
                    'focusScore': session_data['sessionMetrics']['focusScore']
                }), 201
            else:
                return jsonify({'error': 'Failed to record study session'}), 500

        except Exception as e:
            logger.error(f"Error recording study session: {str(e)}")
            return jsonify({'error': 'Internal server error'}), 500

    @app.route('/study-sessions/<user_id>', methods=['GET'])
    def get_study_sessions(user_id):
        """Get enhanced study sessions for a user"""
        try:
            # Convert user_id to appropriate format
            try:
                user_object_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
            except:
                user_object_id = user_id

            # Get query parameters for filtering
            days = int(request.args.get('days', 30))  # Default to last 30 days
            course_id = request.args.get('courseId')
            limit = int(request.args.get('limit', 50))
            
            # Build query
            query = {'userId': {'$in': [user_id, user_object_id]}}
            
            if days > 0:
                cutoff_date = datetime.now() - timedelta(days=days)
                query['timestamp'] = {'$gte': cutoff_date}
                
            if course_id:
                query['courseId'] = course_id

            sessions = study_sessions_collection.find(query).sort('timestamp', -1).limit(limit)
            
            session_list = []
            total_active_time = 0
            total_session_time = 0
            efficiency_sum = 0
            session_count = 0
            
            for session in sessions:
                session_data = {
                    'session_id': str(session['_id']),
                    'courseId': session.get('courseId'),
                    'courseName': session.get('courseName'),
                    'trackingMode': session.get('trackingMode', 'manual'),
                    'duration': session.get('duration', 0),
                    'activeTime': session.get('activeTime', 0),
                    'totalDuration': session.get('totalDuration', 0),
                    'efficiency': session.get('efficiency', 100),
                    'inactiveTime': session.get('inactiveTime', 0),
                    'date': session.get('date'),
                    'timestamp': session.get('timestamp').isoformat() if session.get('timestamp') else None,
                    'sessionMetrics': session.get('sessionMetrics', {}),
                    'studyMethods': session.get('studyMethods', []),
                    'difficulty': session.get('difficulty', 'medium'),
                    'satisfaction': session.get('satisfaction', 5),
                    'goals_met': session.get('goals_met', True),
                    'notes': session.get('notes', '')
                }
                session_list.append(session_data)
                
                # Calculate summary statistics
                total_active_time += session.get('activeTime', 0)
                total_session_time += session.get('totalDuration', session.get('duration', 0))
                efficiency_sum += session.get('efficiency', 100)
                session_count += 1

            # Calculate overall statistics
            overall_efficiency = efficiency_sum / session_count if session_count > 0 else 0
            average_satisfaction = sum(s.get('satisfaction', 5) for s in session_list) / len(session_list) if session_list else 0
            
            return jsonify({
                'status': 'success',
                'sessions': session_list,
                'total_sessions': len(session_list),
                'summary': {
                    'totalActiveTime': total_active_time,  # in minutes
                    'totalSessionTime': total_session_time,  # in minutes
                    'averageEfficiency': round(overall_efficiency, 1),
                    'averageSatisfaction': round(average_satisfaction, 1),
                    'totalSessions': session_count,
                    'averageSessionLength': round(total_active_time / session_count, 1) if session_count > 0 else 0,
                    'goalsMetPercentage': round(sum(1 for s in session_list if s.get('goals_met', True)) / len(session_list) * 100, 1) if session_list else 0
                }
            })
            
        except Exception as e:
            logger.error(f"Error retrieving study sessions: {str(e)}")
            return jsonify({'error': 'Error retrieving study sessions'}), 500

    @app.route('/study-analytics/<user_id>', methods=['GET'])
    def get_study_analytics(user_id):
        """Get comprehensive study analytics for a user"""
        try:
            # Convert user_id to appropriate format
            try:
                user_object_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
            except:
                user_object_id = user_id

            # Get sessions from specified time range
            days = int(request.args.get('days', 30))
            cutoff_date = datetime.now() - timedelta(days=days)
            
            sessions = list(study_sessions_collection.find({
                'userId': {'$in': [user_id, user_object_id]},
                'timestamp': {'$gte': cutoff_date}
            }).sort('timestamp', -1))

            if not sessions:
                return jsonify({
                    'status': 'success',
                    'analytics': {
                        'totalActiveHours': 0,
                        'averageEfficiency': 0,
                        'studyStreak': 0,
                        'bestFocusTime': 'N/A',
                        'improvementTrend': 0,
                        'weeklyGoalProgress': 0,
                        'mostProductiveCourse': 'N/A',
                        'averageSatisfaction': 0,
                        'consistencyScore': 0
                    },
                    'message': 'No study sessions found for the specified period'
                })

            # Basic calculations
            total_active_minutes = sum(s.get('activeTime', 0) for s in sessions)
            total_active_hours = round(total_active_minutes / 60, 1)
            
            efficiency_scores = [s.get('efficiency', 100) for s in sessions]
            average_efficiency = round(sum(efficiency_scores) / len(efficiency_scores), 1)
            
            satisfaction_scores = [s.get('satisfaction', 5) for s in sessions]
            average_satisfaction = round(sum(satisfaction_scores) / len(satisfaction_scores), 1)

            # Calculate study streak (consecutive days with study sessions)
            session_dates = [s['timestamp'].date() for s in sessions]
            unique_dates = sorted(set(session_dates), reverse=True)
            
            study_streak = 0
            if unique_dates:
                current_date = datetime.now().date()
                for i, date in enumerate(unique_dates):
                    if date == current_date - timedelta(days=i):
                        study_streak += 1
                    else:
                        break

            # Find best focus time (hour of day with highest efficiency)
            hourly_efficiency = {}
            for session in sessions:
                if session.get('timestamp'):
                    hour = session['timestamp'].hour
                    if hour not in hourly_efficiency:
                        hourly_efficiency[hour] = []
                    hourly_efficiency[hour].append(session.get('efficiency', 100))
            
            best_focus_hour = 'N/A'
            if hourly_efficiency:
                avg_hourly_efficiency = {
                    hour: sum(efficiencies) / len(efficiencies)
                    for hour, efficiencies in hourly_efficiency.items()
                }
                best_hour = max(avg_hourly_efficiency, key=avg_hourly_efficiency.get)
                best_focus_hour = f"{best_hour:02d}:00"

            # Calculate improvement trend (last 7 days vs previous 7 days)
            last_7_days = datetime.now() - timedelta(days=7)
            previous_7_days = datetime.now() - timedelta(days=14)
            
            recent_sessions = [s for s in sessions if s['timestamp'] >= last_7_days]
            previous_sessions = [s for s in sessions if previous_7_days <= s['timestamp'] < last_7_days]
            
            recent_avg_efficiency = sum(s.get('efficiency', 100) for s in recent_sessions) / len(recent_sessions) if recent_sessions else 0
            previous_avg_efficiency = sum(s.get('efficiency', 100) for s in previous_sessions) / len(previous_sessions) if previous_sessions else 0
            
            improvement_trend = round(recent_avg_efficiency - previous_avg_efficiency, 1)

            # Most productive course
            course_productivity = {}
            for session in sessions:
                course = session.get('courseName', 'Unknown')
                if course not in course_productivity:
                    course_productivity[course] = {'time': 0, 'efficiency': []}
                course_productivity[course]['time'] += session.get('activeTime', 0)
                course_productivity[course]['efficiency'].append(session.get('efficiency', 100))
            
            most_productive_course = 'N/A'
            if course_productivity:
                # Find course with highest total efficiency * time score
                best_score = 0
                for course, data in course_productivity.items():
                    avg_efficiency = sum(data['efficiency']) / len(data['efficiency'])
                    score = avg_efficiency * (data['time'] / 60)  # efficiency * hours
                    if score > best_score:
                        best_score = score
                        most_productive_course = course

            # Weekly goal progress (assuming 10 hours/week target)
            weekly_target_hours = 10
            last_week_minutes = sum(s.get('activeTime', 0) for s in recent_sessions)
            weekly_goal_progress = round((last_week_minutes / 60) / weekly_target_hours * 100, 1)

            # Consistency score based on regularity
            consistency_score = min((len(unique_dates) / days) * 100, 100) if days > 0 else 0

            return jsonify({
                'status': 'success',
                'analytics': {
                    'totalActiveHours': total_active_hours,
                    'averageEfficiency': average_efficiency,
                    'studyStreak': study_streak,
                    'bestFocusTime': best_focus_hour,
                    'improvementTrend': improvement_trend,
                    'weeklyGoalProgress': min(weekly_goal_progress, 100),
                    'totalSessions': len(sessions),
                    'averageSessionLength': round(total_active_minutes / len(sessions), 1) if sessions else 0,
                    'mostProductiveCourse': most_productive_course,
                    'averageSatisfaction': average_satisfaction,
                    'consistencyScore': round(consistency_score, 1),
                    'uniqueStudyDays': len(unique_dates)
                }
            })

        except Exception as e:
            logger.error(f"Error calculating study analytics: {str(e)}")
            return jsonify({'error': 'Error calculating study analytics'}), 500

    @app.route('/study-sessions/<session_id>', methods=['PUT'])
    def update_study_session(session_id):
        """Update a study session"""
        try:
            data = request.json
            if not data:
                return jsonify({'error': 'No data provided'}), 400

            try:
                session_object_id = ObjectId(session_id)
            except:
                return jsonify({'error': 'Invalid session ID format'}), 400

            # Check if session exists
            session = study_sessions_collection.find_one({"_id": session_object_id})
            if not session:
                return jsonify({'error': 'Study session not found'}), 404

            # Build update data
            update_data = {"updated_at": datetime.now()}
            allowed_fields = ['satisfaction', 'difficulty', 'notes', 'goals_met', 'studyMethods']

            for field in allowed_fields:
                if field in data:
                    update_data[field] = data[field]

            # Update session
            result = study_sessions_collection.update_one(
                {"_id": session_object_id},
                {"$set": update_data}
            )

            if result.modified_count > 0:
                log_user_action(str(session.get('userId')), "study_session_update", {
                    "session_id": session_id,
                    "updated_fields": list(update_data.keys())
                })
                
                return jsonify({
                    'status': 'success',
                    'message': 'Study session updated successfully'
                })
            else:
                return jsonify({'error': 'No changes made to study session'}), 400

        except Exception as e:
            logger.error(f"Error updating study session: {str(e)}")
            return jsonify({'error': 'Error updating study session'}), 500

    @app.route('/study-sessions/<session_id>', methods=['DELETE'])
    def delete_study_session(session_id):
        """Delete a study session"""
        try:
            try:
                session_object_id = ObjectId(session_id)
            except:
                return jsonify({'error': 'Invalid session ID format'}), 400

            # Check if session exists
            session = study_sessions_collection.find_one({"_id": session_object_id})
            if not session:
                return jsonify({'error': 'Study session not found'}), 404

            # Verify ownership if user_id is provided
            user_id = request.args.get('user_id')
            if user_id and user_id != str(session.get('userId')):
                return jsonify({'error': 'Unauthorized to delete this session'}), 403

            # Delete the session
            result = study_sessions_collection.delete_one({"_id": session_object_id})

            if result.deleted_count > 0:
                log_user_action(str(session.get('userId')), "study_session_delete", {
                    "session_id": session_id,
                    "course_name": session.get('courseName')
                })
                
                # Update user behavior metrics after deletion
                try:
                    update_user_behavior_metrics(str(session.get('userId')), {})
                except Exception as e:
                    logger.warning(f"Failed to update behavior metrics after deletion: {e}")
                
                return jsonify({
                    'status': 'success',
                    'message': 'Study session deleted successfully'
                })
            else:
                return jsonify({'error': 'Failed to delete study session'}), 500

        except Exception as e:
            logger.error(f"Error deleting study session: {str(e)}")
            return jsonify({'error': 'Error deleting study session'}), 500

    @app.route('/study-progress/<user_id>', methods=['GET'])
    def get_study_progress(user_id):
        """Get study progress over time for charts/visualization"""
        try:
            # Convert user_id to appropriate format
            try:
                user_object_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
            except:
                user_object_id = user_id

            days = int(request.args.get('days', 30))
            cutoff_date = datetime.now() - timedelta(days=days)
            
            # Get sessions grouped by date
            pipeline = [
                {
                    '$match': {
                        'userId': {'$in': [user_id, user_object_id]},
                        'timestamp': {'$gte': cutoff_date}
                    }
                },
                {
                    '$group': {
                        '_id': {
                            '$dateToString': {
                                'format': '%Y-%m-%d',
                                'date': '$timestamp'
                            }
                        },
                        'total_active_time': {'$sum': '$activeTime'},
                        'avg_efficiency': {'$avg': '$efficiency'},
                        'session_count': {'$sum': 1},
                        'avg_satisfaction': {'$avg': '$satisfaction'}
                    }
                },
                {
                    '$sort': {'_id': 1}
                }
            ]
            
            progress_data = list(study_sessions_collection.aggregate(pipeline))
            
            return jsonify({
                'status': 'success',
                'progress': progress_data,
                'total_days': len(progress_data)
            })

        except Exception as e:
            logger.error(f"Error retrieving study progress: {str(e)}")
            return jsonify({'error': 'Error retrieving study progress'}), 500

    logger.info("Study session tracking routes registered successfully")
