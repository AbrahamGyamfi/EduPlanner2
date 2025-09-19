"""
Schedule import module for EduMaster application.
This module handles importing schedules from various formats (JSON, CSV, iCal).
"""

import logging
import json
import csv
from datetime import datetime
from flask import request, jsonify
from bson import ObjectId
from io import StringIO

from database import schedules_collection, users_collection
from utils import validate_input, log_user_action
from schedule_core import _calculate_schedule_statistics

logger = logging.getLogger(__name__)

def _parse_csv_content(csv_content):
    """Parse CSV content and convert to schedule format"""
    try:
        csv_reader = csv.DictReader(StringIO(csv_content))
        schedule_sessions = []
        
        for row in csv_reader:
            session = {
                'id': f"imported_{hash(str(row))}",
                'day': row.get('Day', '').lower(),
                'time': row.get('Time', ''),
                'subject': row.get('Subject', ''),
                'type': row.get('Type', 'study'),
                'location': row.get('Location', ''),
                'notes': row.get('Notes', '')
            }
            
            # Validate required fields
            if session['day'] and session['time'] and session['subject']:
                schedule_sessions.append(session)
        
        return schedule_sessions
        
    except Exception as e:
        logger.error(f"Error parsing CSV content: {str(e)}")
        return None

def _parse_ical_content(ical_content):
    """Parse iCal content and convert to schedule format (basic implementation)"""
    try:
        schedule_sessions = []
        lines = ical_content.strip().split('\n')
        
        current_event = {}
        in_event = False
        
        for line in lines:
            line = line.strip()
            
            if line == 'BEGIN:VEVENT':
                in_event = True
                current_event = {}
            elif line == 'END:VEVENT':
                if in_event and current_event:
                    # Convert to our schedule format
                    session = {
                        'id': f"imported_{hash(str(current_event))}",
                        'day': current_event.get('day', ''),
                        'time': current_event.get('time', ''),
                        'subject': current_event.get('subject', ''),
                        'type': 'study',
                        'location': current_event.get('location', ''),
                        'notes': current_event.get('description', '')
                    }
                    
                    if session['subject']:  # Only add if we have a subject
                        schedule_sessions.append(session)
                
                in_event = False
                current_event = {}
            elif in_event and ':' in line:
                key, value = line.split(':', 1)
                
                if key == 'SUMMARY':
                    current_event['subject'] = value
                elif key == 'DESCRIPTION':
                    current_event['description'] = value
                elif key == 'LOCATION':
                    current_event['location'] = value
                elif key.startswith('DTSTART'):
                    # Basic time parsing - this is simplified
                    try:
                        if 'T' in value:
                            time_part = value.split('T')[1][:4]  # Get HHMM
                            hour = int(time_part[:2])
                            minute = int(time_part[2:])
                            current_event['start_time'] = f"{hour:02d}:{minute:02d}"
                    except:
                        pass
                elif key.startswith('DTEND'):
                    try:
                        if 'T' in value:
                            time_part = value.split('T')[1][:4]  # Get HHMM
                            hour = int(time_part[:2])
                            minute = int(time_part[2:])
                            end_time = f"{hour:02d}:{minute:02d}"
                            
                            if 'start_time' in current_event:
                                current_event['time'] = f"{current_event['start_time']}-{end_time}"
                    except:
                        pass
        
        return schedule_sessions
        
    except Exception as e:
        logger.error(f"Error parsing iCal content: {str(e)}")
        return None

def _validate_imported_schedule(schedule_data):
    """Validate imported schedule data"""
    errors = []
    
    if not isinstance(schedule_data, list):
        errors.append("Schedule must be a list of sessions")
        return errors
    
    required_session_fields = ['day', 'time', 'subject']
    valid_days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    
    for i, session in enumerate(schedule_data):
        if not isinstance(session, dict):
            errors.append(f"Session {i+1} must be an object")
            continue
        
        # Check required fields
        for field in required_session_fields:
            if not session.get(field):
                errors.append(f"Session {i+1}: {field} is required")
        
        # Validate day
        day = session.get('day', '').lower()
        if day and day not in valid_days:
            errors.append(f"Session {i+1}: Invalid day '{day}'. Must be one of: {', '.join(valid_days)}")
        
        # Validate time format
        time_str = session.get('time', '')
        if time_str and '-' in time_str:
            try:
                start_time, end_time = time_str.split('-')
                # Basic time validation
                for time_part in [start_time.strip(), end_time.strip()]:
                    if ':' in time_part:
                        hour, minute = map(int, time_part.split(':'))
                        if not (0 <= hour <= 23 and 0 <= minute <= 59):
                            errors.append(f"Session {i+1}: Invalid time format in '{time_str}'")
                            break
            except (ValueError, IndexError):
                errors.append(f"Session {i+1}: Invalid time format '{time_str}'. Expected format: 'HH:MM-HH:MM'")
    
    return errors

def register_schedule_import_routes(app):
    """Register schedule import routes with the Flask app"""
    
    @app.route('/schedule/<user_id>/import-json', methods=['POST'])
    def import_schedule_json(user_id):
        """Import user schedule from JSON"""
        try:
            # Validate user exists
            try:
                user_object_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
                user = users_collection.find_one({"_id": user_object_id})
                if not user:
                    return jsonify({'error': 'User not found'}), 404
            except:
                return jsonify({'error': 'Invalid user ID format'}), 400
            
            # Get JSON data from request
            data = request.json
            if not data:
                return jsonify({'error': 'No JSON data provided'}), 400
            
            # Handle different JSON structures
            schedule_data = None
            preferences = {}
            schedule_name = 'Imported Schedule'
            
            if 'schedule_data' in data:
                # EduMaster export format
                schedule_info = data['schedule_data']
                schedule_data = schedule_info.get('schedule', [])
                preferences = schedule_info.get('preferences', {})
                schedule_name = schedule_info.get('schedule_name', 'Imported Schedule')
            elif 'schedule' in data:
                # Direct schedule format
                schedule_data = data['schedule']
                preferences = data.get('preferences', {})
                schedule_name = data.get('schedule_name', 'Imported Schedule')
            else:
                return jsonify({'error': 'Invalid JSON format. Expected schedule data.'}), 400
            
            # Validate schedule data
            validation_errors = _validate_imported_schedule(schedule_data)
            if validation_errors:
                return jsonify({
                    'error': 'Invalid schedule data',
                    'details': validation_errors
                }), 400
            
            # Prepare schedule for saving
            import_options = request.json.get('import_options', {})
            merge_with_existing = import_options.get('merge_with_existing', False)
            overwrite_existing = import_options.get('overwrite_existing', True)
            
            # Check if user already has a schedule
            existing_schedule = schedules_collection.find_one({"userId": user_id})
            
            final_schedule = schedule_data
            action = "schedule_import_create"
            
            if existing_schedule and merge_with_existing:
                # Merge with existing schedule
                existing_sessions = existing_schedule.get('schedule', [])
                
                # Add new sessions with unique IDs
                for session in schedule_data:
                    session['id'] = f"imported_{datetime.now().timestamp()}_{hash(str(session))}"
                
                final_schedule = existing_sessions + schedule_data
                action = "schedule_import_merge"
                
            elif existing_schedule and not overwrite_existing:
                return jsonify({
                    'error': 'Schedule already exists. Set overwrite_existing=true or merge_with_existing=true.',
                    'existing_schedule_id': str(existing_schedule['_id'])
                }), 409
            
            # Save the imported schedule
            schedule_doc = {
                "userId": user_id,
                "schedule": final_schedule,
                "preferences": preferences,
                "schedule_name": f"{schedule_name} (Imported)",
                "is_active": True,
                "created_at": datetime.now(),
                "updated_at": datetime.now(),
                "import_info": {
                    "imported_at": datetime.now().isoformat(),
                    "import_source": "json",
                    "original_session_count": len(schedule_data),
                    "merged": merge_with_existing
                }
            }
            
            if existing_schedule:
                # Update existing
                result = schedules_collection.update_one(
                    {"userId": user_id},
                    {"$set": schedule_doc}
                )
                schedule_id = str(existing_schedule['_id'])
            else:
                # Create new
                result = schedules_collection.insert_one(schedule_doc)
                schedule_id = str(result.inserted_id)
            
            if result:
                log_user_action(user_id, action, {
                    "schedule_id": schedule_id,
                    "imported_sessions": len(schedule_data),
                    "final_session_count": len(final_schedule),
                    "merged": merge_with_existing
                })
                
                logger.info(f"Schedule imported successfully from JSON for user {user_id}")
                
                return jsonify({
                    'status': 'success',
                    'message': 'Schedule imported successfully from JSON',
                    'schedule_id': schedule_id,
                    'imported_sessions': len(schedule_data),
                    'final_session_count': len(final_schedule),
                    'merged': merge_with_existing,
                    'statistics': _calculate_schedule_statistics(final_schedule)
                })
            else:
                return jsonify({'error': 'Failed to save imported schedule'}), 500
            
        except Exception as e:
            logger.error(f"Error importing schedule from JSON: {str(e)}")
            return jsonify({'error': 'Error importing schedule from JSON'}), 500

    @app.route('/schedule/<user_id>/import-csv', methods=['POST'])
    def import_schedule_csv(user_id):
        """Import user schedule from CSV"""
        try:
            # Validate user exists
            try:
                user_object_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
                user = users_collection.find_one({"_id": user_object_id})
                if not user:
                    return jsonify({'error': 'User not found'}), 404
            except:
                return jsonify({'error': 'Invalid user ID format'}), 400
            
            # Get CSV content from request
            data = request.json
            if not data or 'csv_content' not in data:
                return jsonify({'error': 'No CSV content provided. Send CSV data in the "csv_content" field.'}), 400
            
            csv_content = data['csv_content']
            
            # Parse CSV content
            schedule_data = _parse_csv_content(csv_content)
            if schedule_data is None:
                return jsonify({'error': 'Failed to parse CSV content'}), 400
            
            if not schedule_data:
                return jsonify({'error': 'No valid sessions found in CSV'}), 400
            
            # Validate parsed schedule
            validation_errors = _validate_imported_schedule(schedule_data)
            if validation_errors:
                return jsonify({
                    'error': 'Invalid schedule data in CSV',
                    'details': validation_errors
                }), 400
            
            # Handle import options
            import_options = data.get('import_options', {})
            merge_with_existing = import_options.get('merge_with_existing', False)
            overwrite_existing = import_options.get('overwrite_existing', True)
            schedule_name = import_options.get('schedule_name', 'CSV Import')
            
            # Check existing schedule
            existing_schedule = schedules_collection.find_one({"userId": user_id})
            
            final_schedule = schedule_data
            action = "schedule_import_create"
            
            if existing_schedule and merge_with_existing:
                existing_sessions = existing_schedule.get('schedule', [])
                final_schedule = existing_sessions + schedule_data
                action = "schedule_import_merge"
            elif existing_schedule and not overwrite_existing:
                return jsonify({
                    'error': 'Schedule already exists. Set overwrite_existing=true or merge_with_existing=true.',
                    'existing_schedule_id': str(existing_schedule['_id'])
                }), 409
            
            # Save the imported schedule
            schedule_doc = {
                "userId": user_id,
                "schedule": final_schedule,
                "preferences": import_options.get('preferences', {}),
                "schedule_name": f"{schedule_name} (CSV Import)",
                "is_active": True,
                "created_at": datetime.now(),
                "updated_at": datetime.now(),
                "import_info": {
                    "imported_at": datetime.now().isoformat(),
                    "import_source": "csv",
                    "original_session_count": len(schedule_data),
                    "merged": merge_with_existing
                }
            }
            
            if existing_schedule:
                result = schedules_collection.update_one(
                    {"userId": user_id},
                    {"$set": schedule_doc}
                )
                schedule_id = str(existing_schedule['_id'])
            else:
                result = schedules_collection.insert_one(schedule_doc)
                schedule_id = str(result.inserted_id)
            
            if result:
                log_user_action(user_id, action, {
                    "schedule_id": schedule_id,
                    "imported_sessions": len(schedule_data),
                    "final_session_count": len(final_schedule)
                })
                
                return jsonify({
                    'status': 'success',
                    'message': 'Schedule imported successfully from CSV',
                    'schedule_id': schedule_id,
                    'imported_sessions': len(schedule_data),
                    'final_session_count': len(final_schedule),
                    'merged': merge_with_existing,
                    'statistics': _calculate_schedule_statistics(final_schedule)
                })
            else:
                return jsonify({'error': 'Failed to save imported schedule'}), 500
            
        except Exception as e:
            logger.error(f"Error importing schedule from CSV: {str(e)}")
            return jsonify({'error': 'Error importing schedule from CSV'}), 500

    @app.route('/schedule/<user_id>/import-ical', methods=['POST'])
    def import_schedule_ical(user_id):
        """Import user schedule from iCal format"""
        try:
            # Validate user exists
            try:
                user_object_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
                user = users_collection.find_one({"_id": user_object_id})
                if not user:
                    return jsonify({'error': 'User not found'}), 404
            except:
                return jsonify({'error': 'Invalid user ID format'}), 400
            
            # Get iCal content from request
            data = request.json
            if not data or 'ical_content' not in data:
                return jsonify({'error': 'No iCal content provided. Send iCal data in the "ical_content" field.'}), 400
            
            ical_content = data['ical_content']
            
            # Parse iCal content
            schedule_data = _parse_ical_content(ical_content)
            if schedule_data is None:
                return jsonify({'error': 'Failed to parse iCal content'}), 400
            
            if not schedule_data:
                return jsonify({'error': 'No valid events found in iCal file'}), 400
            
            # Handle import options
            import_options = data.get('import_options', {})
            merge_with_existing = import_options.get('merge_with_existing', False)
            overwrite_existing = import_options.get('overwrite_existing', True)
            schedule_name = import_options.get('schedule_name', 'iCal Import')
            
            # Check existing schedule
            existing_schedule = schedules_collection.find_one({"userId": user_id})
            
            final_schedule = schedule_data
            action = "schedule_import_create"
            
            if existing_schedule and merge_with_existing:
                existing_sessions = existing_schedule.get('schedule', [])
                final_schedule = existing_sessions + schedule_data
                action = "schedule_import_merge"
            elif existing_schedule and not overwrite_existing:
                return jsonify({
                    'error': 'Schedule already exists. Set overwrite_existing=true or merge_with_existing=true.',
                    'existing_schedule_id': str(existing_schedule['_id'])
                }), 409
            
            # Save the imported schedule
            schedule_doc = {
                "userId": user_id,
                "schedule": final_schedule,
                "preferences": import_options.get('preferences', {}),
                "schedule_name": f"{schedule_name} (iCal Import)",
                "is_active": True,
                "created_at": datetime.now(),
                "updated_at": datetime.now(),
                "import_info": {
                    "imported_at": datetime.now().isoformat(),
                    "import_source": "ical",
                    "original_session_count": len(schedule_data),
                    "merged": merge_with_existing
                }
            }
            
            if existing_schedule:
                result = schedules_collection.update_one(
                    {"userId": user_id},
                    {"$set": schedule_doc}
                )
                schedule_id = str(existing_schedule['_id'])
            else:
                result = schedules_collection.insert_one(schedule_doc)
                schedule_id = str(result.inserted_id)
            
            if result:
                log_user_action(user_id, action, {
                    "schedule_id": schedule_id,
                    "imported_sessions": len(schedule_data),
                    "final_session_count": len(final_schedule)
                })
                
                return jsonify({
                    'status': 'success',
                    'message': 'Schedule imported successfully from iCal',
                    'schedule_id': schedule_id,
                    'imported_sessions': len(schedule_data),
                    'final_session_count': len(final_schedule),
                    'merged': merge_with_existing,
                    'statistics': _calculate_schedule_statistics(final_schedule)
                })
            else:
                return jsonify({'error': 'Failed to save imported schedule'}), 500
            
        except Exception as e:
            logger.error(f"Error importing schedule from iCal: {str(e)}")
            return jsonify({'error': 'Error importing schedule from iCal'}), 500

    @app.route('/schedule/<user_id>/validate-import', methods=['POST'])
    def validate_schedule_import(user_id):
        """Validate schedule data before importing"""
        try:
            data = request.json
            if not data:
                return jsonify({'error': 'No data provided'}), 400
            
            import_format = data.get('format', 'json')  # json, csv, ical
            content = data.get('content')
            
            if not content:
                return jsonify({'error': 'No content provided for validation'}), 400
            
            schedule_data = None
            
            # Parse content based on format
            if import_format == 'json':
                try:
                    if isinstance(content, str):
                        content = json.loads(content)
                    
                    if 'schedule_data' in content:
                        schedule_data = content['schedule_data'].get('schedule', [])
                    elif 'schedule' in content:
                        schedule_data = content['schedule']
                    else:
                        return jsonify({'error': 'No schedule data found in JSON'}), 400
                        
                except json.JSONDecodeError as e:
                    return jsonify({'error': f'Invalid JSON format: {str(e)}'}), 400
                    
            elif import_format == 'csv':
                schedule_data = _parse_csv_content(content)
                if schedule_data is None:
                    return jsonify({'error': 'Failed to parse CSV content'}), 400
                    
            elif import_format == 'ical':
                schedule_data = _parse_ical_content(content)
                if schedule_data is None:
                    return jsonify({'error': 'Failed to parse iCal content'}), 400
            else:
                return jsonify({'error': 'Unsupported format. Use: json, csv, or ical'}), 400
            
            # Validate the parsed schedule
            validation_errors = _validate_imported_schedule(schedule_data)
            
            # Calculate statistics for preview
            statistics = _calculate_schedule_statistics(schedule_data)
            
            # Generate preview data
            preview_data = {
                'valid': len(validation_errors) == 0,
                'session_count': len(schedule_data),
                'validation_errors': validation_errors,
                'statistics': statistics,
                'subjects': list(set([session.get('subject') for session in schedule_data if session.get('subject')])),
                'days_covered': list(set([session.get('day') for session in schedule_data if session.get('day')])),
                'sample_sessions': schedule_data[:3] if len(schedule_data) > 3 else schedule_data  # Show first 3 sessions as preview
            }
            
            return jsonify({
                'status': 'success',
                'message': 'Schedule validation completed',
                'format': import_format,
                'preview': preview_data
            })
            
        except Exception as e:
            logger.error(f"Error validating schedule import: {str(e)}")
            return jsonify({'error': 'Error validating schedule import'}), 500

    logger.info("Schedule import routes registered successfully")
