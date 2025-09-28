"""
Slide reading tracking module for EduMaster application.
This module handles real-time slide reading sessions, progress tracking, and reading analytics.
"""

import logging
from datetime import datetime, timedelta
from flask import request, jsonify
from bson import ObjectId

from database import study_sessions_collection, files_collection
from utils import validate_input, log_user_action

logger = logging.getLogger(__name__)

def register_slide_reading_routes(app):
    """Register slide reading tracking routes with the Flask app"""
    
    @app.route('/slide-reading-session', methods=['POST'])
    def start_slide_reading_session():
        """Start or update a slide reading session with real-time tracking"""
        try:
            data = request.json
            if not data:
                return jsonify({'error': 'No data provided'}), 400

            # Validate required fields
            required_fields = ['userId', 'courseId', 'filename']
            validation_errors = validate_input(data, required_fields)

            if validation_errors:
                return jsonify({'error': '; '.join(validation_errors)}), 400

            # Get file information if available
            file_info = None
            filename = data.get('filename')
            course_id = data.get('courseId')
            
            if filename and course_id:
                file_info = files_collection.find_one({
                    'original_filename': filename,
                    'course_id': course_id,
                    'is_active': True
                })

            # Calculate estimated reading time based on word count
            word_count = 0
            estimated_reading_time = 0
            if file_info and file_info.get('extracted_text'):
                text = file_info.get('extracted_text', '')
                word_count = len(text.split()) if text else 0
                estimated_reading_time = round(word_count / 200)  # Assume 200 WPM reading speed

            # Create unified study session record that includes reading-specific data
            session_data = {
                "userId": data.get('userId'),
                "courseId": data.get('courseId'),
                "courseName": data.get('courseName', 'Unknown Course'),
                "sessionType": "slide_reading",
                "trackingMode": "automatic",
                "duration": estimated_reading_time,  # estimated duration in minutes
                "activeTime": 0,  # will be updated as session progresses
                "totalDuration": 0,  # will be updated when session completes
                "efficiency": 100,  # will be calculated based on actual vs estimated time
                "inactiveTime": 0,
                "pauseCount": 0,
                "date": datetime.now().isoformat()[:10],
                "timestamp": datetime.now(),
                "startTime": datetime.now(),
                "status": "active",
                "lastActivity": datetime.now(),
                "sessionMetrics": {
                    "averageActiveStreak": 0,
                    "longestActiveStreak": 0,
                    "distractionCount": 0,
                    "focusScore": 100
                },
                "studyMethods": ["slide_reading"],
                "difficulty": "medium",
                "satisfaction": 5,
                "notes": f"Reading: {filename}",
                "goals_met": True,
                # Reading-specific fields integrated into main record
                "filename": filename,
                "fileId": str(file_info['_id']) if file_info else None,
                "activeReadingTime": 0,  # actual focused reading time in seconds
                "readingProgress": data.get('progress', 0),
                "currentPage": data.get('currentPage', 1),
                "totalPages": data.get('totalPages', 1),
                "wordCount": word_count,
                "estimatedReadingTime": estimated_reading_time,
                "readingSpeed": 0,  # words per minute, calculated later
                "comprehensionScore": 0,
                "comprehensionIndicators": {
                    "timeSpentOnPage": {},  # page -> time mapping
                    "scrollPatterns": [],
                    "returnVisits": {},  # sections revisited
                    "highlightsMade": 0,
                    "notesCreated": 0
                },
                "scrollEvents": 0,
                "interactionEvents": [],
                "created_at": datetime.now()
            }
            
            result = study_sessions_collection.insert_one(session_data)

            if result.inserted_id:
                log_user_action(data.get('userId'), "slide_reading_started", {
                    "filename": filename,
                    "course_id": course_id,
                    "estimated_reading_time": estimated_reading_time
                })
                
                return jsonify({
                    'status': 'success',
                    'message': 'Slide reading session started',
                    'session_id': str(result.inserted_id),
                    'start_time': session_data['startTime'].isoformat(),
                    'word_count': word_count,
                    'estimated_reading_time_minutes': estimated_reading_time
                }), 201
            else:
                return jsonify({'error': 'Failed to start reading session'}), 500

        except Exception as e:
            logger.error(f"Error starting slide reading session: {str(e)}")
            return jsonify({'error': 'Internal server error'}), 500

    @app.route('/slide-reading-session/<session_id>', methods=['PUT'])
    def update_slide_reading_session(session_id):
        """Update slide reading session with progress and interaction data"""
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
                return jsonify({'error': 'Reading session not found'}), 404

            # Calculate time since last update
            now = datetime.now()
            last_activity = session.get('lastActivity', session.get('startTime', now))
            time_since_last = (now - last_activity).total_seconds()

            # Build update data
            update_data = {
                "lastActivity": now,
                "readingProgress": data.get('progress', session.get('readingProgress', 0)),
                "currentPage": data.get('currentPage', session.get('currentPage', 1)),
                "scrollEvents": session.get('scrollEvents', 0) + data.get('newScrollEvents', 0),
                "totalReadingTime": session.get('totalReadingTime', 0) + data.get('timeIncrement', 0)
            }

            # Update active reading time only if user was active (less than 5 minutes since last activity)
            if time_since_last < 300:  # 5 minutes
                current_active_time = session.get('activeReadingTime', 0)
                update_data['activeReadingTime'] = current_active_time + data.get('activeTimeIncrement', 0)

            # Update comprehension indicators
            if 'comprehensionUpdates' in data:
                comprehension = session.get('comprehensionIndicators', {})
                comprehension_updates = data['comprehensionUpdates']
                
                # Merge time spent on pages
                if 'timeSpentOnPage' in comprehension_updates:
                    current_page_times = comprehension.get('timeSpentOnPage', {})
                    for page, time_spent in comprehension_updates['timeSpentOnPage'].items():
                        current_page_times[page] = current_page_times.get(page, 0) + time_spent
                    comprehension['timeSpentOnPage'] = current_page_times

                # Update other indicators
                for key in ['highlightsMade', 'notesCreated']:
                    if key in comprehension_updates:
                        comprehension[key] = comprehension_updates[key]

                update_data['comprehensionIndicators'] = comprehension

            # Add new interaction events
            if 'newInteractions' in data:
                current_interactions = session.get('interactionEvents', [])
                current_interactions.extend(data['newInteractions'])
                update_data['interactionEvents'] = current_interactions[-50:]  # Keep last 50 interactions

            # Calculate reading speed if we have word count and active time
            active_time_minutes = update_data.get('activeReadingTime', 0) / 60
            word_count = session.get('wordCount', 0)
            if active_time_minutes > 0 and word_count > 0:
                progress_decimal = update_data.get('readingProgress', 0) / 100
                words_read = word_count * progress_decimal
                reading_speed = round(words_read / active_time_minutes) if active_time_minutes > 0 else 0
                update_data['readingSpeed'] = reading_speed

            # Update session
            result = study_sessions_collection.update_one(
                {"_id": session_object_id},
                {"$set": update_data}
            )

            if result.modified_count > 0:
                return jsonify({
                    'status': 'success',
                    'message': 'Reading session updated',
                    'active_reading_time_seconds': update_data.get('activeReadingTime', 0),
                    'reading_progress': update_data.get('readingProgress', 0),
                    'reading_speed_wpm': update_data.get('readingSpeed', 0),
                    'current_page': update_data.get('currentPage', 1)
                })
            else:
                return jsonify({'message': 'No changes made to reading session'}), 200

        except Exception as e:
            logger.error(f"Error updating slide reading session: {str(e)}")
            return jsonify({'error': 'Error updating reading session'}), 500

    @app.route('/slide-reading-session/<session_id>/complete', methods=['PUT'])
    def complete_slide_reading_session(session_id):
        """Complete a slide reading session and calculate final metrics"""
        try:
            data = request.json or {}
            
            try:
                session_object_id = ObjectId(session_id)
            except:
                return jsonify({'error': 'Invalid session ID format'}), 400

            # Get current session
            session = study_sessions_collection.find_one({"_id": session_object_id})
            if not session:
                return jsonify({'error': 'Reading session not found'}), 404

            now = datetime.now()
            start_time = session.get('startTime', now)
            total_session_time = (now - start_time).total_seconds()
            
            # Calculate final metrics
            active_reading_time = session.get('activeReadingTime', 0)
            efficiency = (active_reading_time / total_session_time * 100) if total_session_time > 0 else 0
            
            # Calculate comprehension score based on various factors
            comprehension_score = calculate_comprehension_score(session)

            # Update session with completion data
            update_data = {
                "status": "completed",
                "endTime": now,
                "totalSessionTime": total_session_time,
                "efficiency": round(efficiency, 1),
                "comprehensionScore": round(comprehension_score, 1),
                "finalProgress": data.get('finalProgress', session.get('readingProgress', 0)),
                "completionNotes": data.get('notes', ''),
                "satisfactionRating": data.get('satisfaction', 5),
                "difficultyRating": data.get('difficulty', 3),  # 1-5 scale
                "completed_at": now
            }

            result = study_sessions_collection.update_one(
                {"_id": session_object_id},
                {"$set": update_data}
            )

            if result.modified_count > 0:
                # Log completion
                log_user_action(str(session.get('userId')), "slide_reading_completed", {
                    "filename": session.get('filename'),
                    "course_id": session.get('courseId'),
                    "reading_time_minutes": round(active_reading_time / 60, 1),
                    "efficiency": update_data['efficiency'],
                    "comprehension_score": update_data['comprehensionScore']
                })
                
                return jsonify({
                    'status': 'success',
                    'message': 'Reading session completed',
                    'session_summary': {
                        'total_time_minutes': round(total_session_time / 60, 1),
                        'active_reading_minutes': round(active_reading_time / 60, 1),
                        'efficiency': update_data['efficiency'],
                        'comprehension_score': update_data['comprehensionScore'],
                        'final_progress': update_data['finalProgress'],
                        'reading_speed': session.get('readingSpeed', 0)
                    }
                })
            else:
                return jsonify({'error': 'Failed to complete reading session'}), 500

        except Exception as e:
            logger.error(f"Error completing slide reading session: {str(e)}")
            return jsonify({'error': 'Error completing reading session'}), 500

    logger.info("Slide reading tracking routes registered successfully")


def calculate_comprehension_score(session):
    """Calculate comprehension score based on reading patterns and interactions"""
    comprehension_indicators = session.get('comprehensionIndicators', {})
    time_per_page = comprehension_indicators.get('timeSpentOnPage', {})
    
    comprehension_score = 70  # Base score
    
    # Adjust based on reading patterns
    if time_per_page:
        avg_time_per_page = sum(time_per_page.values()) / len(time_per_page)
        if avg_time_per_page > 30:  # More than 30 seconds per page indicates careful reading
            comprehension_score += 10
        elif avg_time_per_page < 5:  # Less than 5 seconds may indicate skimming
            comprehension_score -= 10
    
    # Adjust based on return visits (indicates review/confusion)
    return_visits = comprehension_indicators.get('returnVisits', {})
    if len(return_visits) > 0:
        comprehension_score += 5  # Reviewing content is good
    
    # Adjust based on highlights and notes
    highlights = comprehension_indicators.get('highlightsMade', 0)
    notes = comprehension_indicators.get('notesCreated', 0)
    comprehension_score += min(highlights * 2 + notes * 5, 20)  # Cap bonus at 20
    
    # Adjust based on reading efficiency
    efficiency = session.get('efficiency', 100)
    if efficiency < 50:  # Low efficiency might indicate distraction
        comprehension_score -= 10
    elif efficiency > 80:  # High efficiency is good
        comprehension_score += 5
    
    return max(0, min(100, comprehension_score))  # Ensure 0-100 range
