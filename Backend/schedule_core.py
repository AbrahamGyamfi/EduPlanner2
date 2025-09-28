"""
Core schedule operations module for EduMaster application.
This module handles basic schedule CRUD operations.
"""

import logging
from datetime import datetime
from flask import request, jsonify
from bson import ObjectId

from database import schedules_collection, users_collection
from utils import validate_input, log_user_action

logger = logging.getLogger(__name__)

def _calculate_schedule_statistics(schedule):
    """Calculate statistics for a schedule"""
    if not schedule:
        return {
            'total_sessions': 0,
            'total_hours': 0,
            'sessions_per_day': {},
            'subjects_covered': 0,
            'avg_session_duration': 0
        }
    
    # Count sessions per day
    sessions_per_day = {}
    total_hours = 0
    total_duration_minutes = 0
    
    for session in schedule:
        day = session.get('day', 'unknown')
        sessions_per_day[day] = sessions_per_day.get(day, 0) + 1
        
        # Calculate session duration
        time_str = session.get('time', '')
        if '-' in time_str:
            try:
                start_time, end_time = time_str.split('-')
                start_hour, start_min = map(int, start_time.strip().split(':'))
                end_hour, end_min = map(int, end_time.strip().split(':'))
                
                start_minutes = start_hour * 60 + start_min
                end_minutes = end_hour * 60 + end_min
                
                duration_minutes = end_minutes - start_minutes
                if duration_minutes > 0:
                    total_duration_minutes += duration_minutes
                    total_hours += duration_minutes / 60
            except (ValueError, IndexError):
                # Default to 2 hours if parsing fails
                total_duration_minutes += 120
                total_hours += 2
        else:
            # Default to 2 hours if no end time specified
            total_duration_minutes += 120
            total_hours += 2
    
    # Count unique subjects
    subjects = set([session.get('subject') for session in schedule if session.get('subject')])
    
    return {
        'total_sessions': len(schedule),
        'total_hours': round(total_hours, 2),
        'sessions_per_day': sessions_per_day,
        'subjects_covered': len(subjects),
        'avg_session_duration': round(total_duration_minutes / len(schedule), 1) if schedule else 0
    }

def register_schedule_core_routes(app):
    """Register core schedule routes with the Flask app"""
    
    @app.route('/schedule', methods=['POST'])
    def save_schedule():
        """Save user schedule"""
        try:
            data = request.json
            if not data:
                return jsonify({'error': 'No data provided'}), 400

            # Validate required fields manually since schedule is an array
            validation_errors = []
            
            if 'userId' not in data or not data['userId']:
                validation_errors.append('userId is required')
            
            if 'schedule' not in data:
                validation_errors.append('schedule is required')
            elif not isinstance(data['schedule'], list):
                validation_errors.append('schedule must be an array')
            
            if validation_errors:
                return jsonify({'error': '; '.join(validation_errors)}), 400

            userId = data.get('userId')
            schedule = data.get('schedule', [])
            preferences = data.get('preferences', {})
            schedule_name = data.get('schedule_name', 'Default Schedule')
            
            # Handle special case for default user or validate user exists
            if userId == 'default-user':
                # Allow default user for demo/testing purposes
                pass
            else:
                try:
                    # Try to validate as ObjectId
                    user_object_id = ObjectId(userId) if isinstance(userId, str) else userId
                    user = users_collection.find_one({"_id": user_object_id})
                    if not user:
                        return jsonify({'error': 'User not found'}), 404
                except Exception as e:
                    logger.warning(f"User validation failed for userId {userId}: {e}")
                    # Allow non-ObjectId userIds for compatibility
                    pass

            # Save schedule to database
            schedule_data = {
                "userId": userId,
                "schedule": schedule,
                "preferences": preferences,
                "schedule_name": schedule_name,
                "is_active": data.get('is_active', True),
                "created_at": datetime.now(),
                "updated_at": datetime.now()
            }

            # Check if schedule already exists for this user
            existing_schedule = schedules_collection.find_one({"userId": userId})
            
            if existing_schedule:
                # Update existing schedule
                result = schedules_collection.update_one(
                    {"userId": userId},
                    {
                        "$set": {
                            "schedule": schedule,
                            "preferences": preferences,
                            "schedule_name": schedule_name,
                            "is_active": data.get('is_active', True),
                            "updated_at": datetime.now()
                        }
                    }
                )
                schedule_id = str(existing_schedule['_id'])
                action = "schedule_update"
            else:
                # Create new schedule
                result = schedules_collection.insert_one(schedule_data)
                schedule_id = str(result.inserted_id)
                action = "schedule_create"

            if result:
                log_user_action(userId, action, {
                    "schedule_id": schedule_id,
                    "session_count": len(schedule)
                })
                
                logger.info(f"Schedule {'updated' if existing_schedule else 'created'} for user {userId}")
                
                response_data = {
                    'status': 'success',
                    'message': f'Schedule {"updated" if existing_schedule else "saved"} successfully',
                    'schedule_id': schedule_id
                }
                
                return jsonify(response_data), 201 if not existing_schedule else 200
            else:
                return jsonify({'error': 'Failed to save schedule'}), 500

        except Exception as e:
            logger.error(f"Error saving schedule: {str(e)}")
            return jsonify({'error': 'Internal server error'}), 500

    @app.route('/schedule/<user_id>', methods=['GET'])
    def get_schedule(user_id):
        """Get user schedule"""
        try:
            # Try to convert user_id to ObjectId if it's a string
            try:
                user_object_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
            except:
                user_object_id = user_id

            # Get query parameters
            include_inactive = request.args.get('include_inactive', 'false').lower() == 'true'
            
            query = {'userId': {'$in': [user_id, user_object_id]}}
            
            if not include_inactive:
                query['is_active'] = True

            schedule = schedules_collection.find_one(query)
            
            if schedule:
                return jsonify({
                    'status': 'success',
                    'schedule': {
                        'schedule_id': str(schedule['_id']),
                        'schedule': schedule.get('schedule', []),
                        'preferences': schedule.get('preferences', {}),
                        'schedule_name': schedule.get('schedule_name', 'Default Schedule'),
                        'is_active': schedule.get('is_active', True),
                        'created_at': schedule.get('created_at').isoformat() if schedule.get('created_at') else None,
                        'updated_at': schedule.get('updated_at').isoformat() if schedule.get('updated_at') else None
                    }
                })
            else:
                return jsonify({
                    'status': 'success',
                    'schedule': {
                        'schedule_id': None,
                        'schedule': [],
                        'preferences': {},
                        'schedule_name': 'Default Schedule',
                        'is_active': True,
                        'message': 'No schedule found for this user'
                    }
                })

        except Exception as e:
            logger.error(f"Error retrieving schedule: {str(e)}")
            return jsonify({'error': 'Error retrieving schedule'}), 500

    @app.route('/schedule/<user_id>/session/<session_id>', methods=['PUT'])
    def update_session(user_id, session_id):
        """Update specific session in schedule"""
        try:
            data = request.json
            if not data:
                return jsonify({'error': 'No data provided'}), 400

            # Try to convert user_id
            try:
                user_object_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
            except:
                user_object_id = user_id

            # Find the user's schedule
            schedule = schedules_collection.find_one({'userId': {'$in': [user_id, user_object_id]}})
            if not schedule:
                return jsonify({'error': 'Schedule not found'}), 404

            # Update the specific session
            updated_schedule = schedule.get('schedule', [])
            session_updated = False
            
            for i, session in enumerate(updated_schedule):
                if session.get('id') == session_id:
                    # Update session with new data
                    updated_schedule[i] = {**session, **data, 'updated_at': datetime.now().isoformat()}
                    session_updated = True
                    break

            if not session_updated:
                return jsonify({'error': 'Session not found'}), 404

            # Update the schedule in database
            result = schedules_collection.update_one(
                {'userId': {'$in': [user_id, user_object_id]}},
                {
                    '$set': {
                        'schedule': updated_schedule,
                        'updated_at': datetime.now()
                    }
                }
            )

            if result.modified_count > 0:
                log_user_action(user_id, "schedule_session_update", {
                    "session_id": session_id,
                    "updated_fields": list(data.keys())
                })
                
                return jsonify({
                    'status': 'success',
                    'message': 'Session updated successfully'
                })
            else:
                return jsonify({'error': 'Failed to update session'}), 500

        except Exception as e:
            logger.error(f"Error updating session: {str(e)}")
            return jsonify({'error': 'Error updating session'}), 500

    @app.route('/schedule/<user_id>/session/<session_id>', methods=['DELETE'])
    def delete_session(user_id, session_id):
        """Delete specific session from schedule"""
        try:
            # Try to convert user_id
            try:
                user_object_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
            except:
                user_object_id = user_id

            # Find the user's schedule
            schedule = schedules_collection.find_one({'userId': {'$in': [user_id, user_object_id]}})
            if not schedule:
                return jsonify({'error': 'Schedule not found'}), 404

            # Remove the specific session
            original_schedule = schedule.get('schedule', [])
            updated_schedule = [session for session in original_schedule if session.get('id') != session_id]

            # Check if session was found and removed
            if len(updated_schedule) == len(original_schedule):
                return jsonify({'error': 'Session not found'}), 404

            # Update the schedule in database
            result = schedules_collection.update_one(
                {'userId': {'$in': [user_id, user_object_id]}},
                {
                    '$set': {
                        'schedule': updated_schedule,
                        'updated_at': datetime.now()
                    }
                }
            )

            if result.modified_count > 0:
                log_user_action(user_id, "schedule_session_delete", {
                    "session_id": session_id
                })
                
                return jsonify({
                    'status': 'success',
                    'message': 'Session deleted successfully'
                })
            else:
                return jsonify({'error': 'Failed to delete session'}), 500

        except Exception as e:
            logger.error(f"Error deleting session: {str(e)}")
            return jsonify({'error': 'Error deleting session'}), 500

    logger.info("Schedule core routes registered successfully")
