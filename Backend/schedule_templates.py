"""
Schedule templates module for EduMaster application.
This module handles predefined and custom schedule templates.
"""

import logging
from datetime import datetime
from flask import request, jsonify
from bson import ObjectId

from database import schedules_collection, users_collection
from utils import validate_input, log_user_action
from schedule_core import _calculate_schedule_statistics

logger = logging.getLogger(__name__)

# Predefined schedule templates
PREDEFINED_TEMPLATES = [
    {
        'id': 'morning_person',
        'name': 'Early Bird Schedule',
        'description': 'Optimized for morning productivity',
        'category': 'time_preference',
        'tags': ['morning', 'early', 'productivity'],
        'schedule': [
            {'day': 'monday', 'time': '06:00-08:00', 'subject': 'Math', 'type': 'study', 'location': 'Study Room'},
            {'day': 'monday', 'time': '08:30-10:30', 'subject': 'Science', 'type': 'study', 'location': 'Study Room'},
            {'day': 'tuesday', 'time': '06:00-08:00', 'subject': 'English', 'type': 'study', 'location': 'Study Room'},
            {'day': 'tuesday', 'time': '08:30-10:30', 'subject': 'History', 'type': 'study', 'location': 'Study Room'},
            {'day': 'wednesday', 'time': '06:00-08:00', 'subject': 'Math', 'type': 'study', 'location': 'Study Room'},
            {'day': 'wednesday', 'time': '08:30-10:30', 'subject': 'Science', 'type': 'study', 'location': 'Study Room'},
            {'day': 'thursday', 'time': '06:00-08:00', 'subject': 'English', 'type': 'study', 'location': 'Study Room'},
            {'day': 'friday', 'time': '06:00-08:00', 'subject': 'Review', 'type': 'review', 'location': 'Study Room'}
        ],
        'preferences': {
            'schedule_type': 'Early Bird',
            'focus_duration': 120,
            'break_duration': 30,
            'preferred_study_time': 'morning'
        }
    },
    {
        'id': 'night_owl',
        'name': 'Night Owl Schedule',
        'description': 'Designed for evening productivity',
        'category': 'time_preference',
        'tags': ['evening', 'night', 'late'],
        'schedule': [
            {'day': 'monday', 'time': '19:00-21:00', 'subject': 'Math', 'type': 'study', 'location': 'Study Room'},
            {'day': 'monday', 'time': '21:30-23:30', 'subject': 'Science', 'type': 'study', 'location': 'Study Room'},
            {'day': 'tuesday', 'time': '19:00-21:00', 'subject': 'English', 'type': 'study', 'location': 'Study Room'},
            {'day': 'tuesday', 'time': '21:30-23:30', 'subject': 'History', 'type': 'study', 'location': 'Study Room'},
            {'day': 'wednesday', 'time': '19:00-21:00', 'subject': 'Math', 'type': 'study', 'location': 'Study Room'},
            {'day': 'thursday', 'time': '19:00-21:00', 'subject': 'Science', 'type': 'study', 'location': 'Study Room'},
            {'day': 'friday', 'time': '19:00-21:00', 'subject': 'English', 'type': 'study', 'location': 'Study Room'},
            {'day': 'saturday', 'time': '20:00-22:00', 'subject': 'Review', 'type': 'review', 'location': 'Study Room'}
        ],
        'preferences': {
            'schedule_type': 'Night Owl',
            'focus_duration': 120,
            'break_duration': 30,
            'preferred_study_time': 'evening'
        }
    },
    {
        'id': 'balanced',
        'name': 'Balanced Schedule',
        'description': 'Mix of morning and evening sessions',
        'category': 'balanced',
        'tags': ['balanced', 'flexible', 'mixed'],
        'schedule': [
            {'day': 'monday', 'time': '09:00-11:00', 'subject': 'Math', 'type': 'study', 'location': 'Study Room'},
            {'day': 'monday', 'time': '15:00-17:00', 'subject': 'Science', 'type': 'study', 'location': 'Library'},
            {'day': 'tuesday', 'time': '10:00-12:00', 'subject': 'English', 'type': 'study', 'location': 'Study Room'},
            {'day': 'tuesday', 'time': '16:00-18:00', 'subject': 'History', 'type': 'study', 'location': 'Library'},
            {'day': 'wednesday', 'time': '09:00-11:00', 'subject': 'Math', 'type': 'study', 'location': 'Study Room'},
            {'day': 'wednesday', 'time': '15:00-17:00', 'subject': 'Science', 'type': 'study', 'location': 'Lab'},
            {'day': 'thursday', 'time': '10:00-12:00', 'subject': 'English', 'type': 'study', 'location': 'Study Room'},
            {'day': 'friday', 'time': '14:00-16:00', 'subject': 'Review', 'type': 'review', 'location': 'Study Room'}
        ],
        'preferences': {
            'schedule_type': 'Balanced',
            'focus_duration': 120,
            'break_duration': 15,
            'preferred_study_time': 'mixed'
        }
    },
    {
        'id': 'intensive',
        'name': 'Intensive Study Schedule',
        'description': 'High-intensity schedule for exam preparation',
        'category': 'intensity',
        'tags': ['intensive', 'exam', 'focused'],
        'schedule': [
            {'day': 'monday', 'time': '08:00-10:00', 'subject': 'Math', 'type': 'study', 'location': 'Study Room'},
            {'day': 'monday', 'time': '10:30-12:30', 'subject': 'Science', 'type': 'study', 'location': 'Study Room'},
            {'day': 'monday', 'time': '14:00-16:00', 'subject': 'English', 'type': 'study', 'location': 'Library'},
            {'day': 'monday', 'time': '16:30-18:30', 'subject': 'History', 'type': 'study', 'location': 'Library'},
            {'day': 'tuesday', 'time': '08:00-10:00', 'subject': 'Math', 'type': 'practice', 'location': 'Study Room'},
            {'day': 'tuesday', 'time': '10:30-12:30', 'subject': 'Science', 'type': 'practice', 'location': 'Lab'},
            {'day': 'tuesday', 'time': '14:00-16:00', 'subject': 'English', 'type': 'practice', 'location': 'Study Room'},
            {'day': 'wednesday', 'time': '08:00-10:00', 'subject': 'Review', 'type': 'review', 'location': 'Study Room'},
            {'day': 'wednesday', 'time': '10:30-12:30', 'subject': 'Mock Test', 'type': 'test', 'location': 'Exam Room'},
            {'day': 'thursday', 'time': '08:00-10:00', 'subject': 'Math', 'type': 'study', 'location': 'Study Room'},
            {'day': 'thursday', 'time': '10:30-12:30', 'subject': 'Science', 'type': 'study', 'location': 'Study Room'},
            {'day': 'friday', 'time': '08:00-10:00', 'subject': 'Final Review', 'type': 'review', 'location': 'Study Room'},
            {'day': 'saturday', 'time': '09:00-11:00', 'subject': 'Practice Test', 'type': 'test', 'location': 'Exam Room'}
        ],
        'preferences': {
            'schedule_type': 'Intensive',
            'focus_duration': 120,
            'break_duration': 30,
            'preferred_study_time': 'mixed'
        }
    },
    {
        'id': 'weekend_warrior',
        'name': 'Weekend Warrior Schedule',
        'description': 'Concentrated weekend study sessions for busy weekdays',
        'category': 'lifestyle',
        'tags': ['weekend', 'concentrated', 'flexible'],
        'schedule': [
            {'day': 'saturday', 'time': '09:00-12:00', 'subject': 'Math', 'type': 'study', 'location': 'Study Room'},
            {'day': 'saturday', 'time': '13:00-16:00', 'subject': 'Science', 'type': 'study', 'location': 'Study Room'},
            {'day': 'saturday', 'time': '17:00-19:00', 'subject': 'English', 'type': 'study', 'location': 'Library'},
            {'day': 'sunday', 'time': '09:00-12:00', 'subject': 'History', 'type': 'study', 'location': 'Study Room'},
            {'day': 'sunday', 'time': '13:00-16:00', 'subject': 'Review', 'type': 'review', 'location': 'Study Room'},
            {'day': 'sunday', 'time': '17:00-19:00', 'subject': 'Practice', 'type': 'practice', 'location': 'Study Room'}
        ],
        'preferences': {
            'schedule_type': 'Weekend Focused',
            'focus_duration': 180,
            'break_duration': 60,
            'preferred_study_time': 'weekend'
        }
    }
]

def register_schedule_templates_routes(app):
    """Register schedule template routes with the Flask app"""
    
    @app.route('/schedule-templates', methods=['GET'])
    def get_schedule_templates():
        """Get predefined schedule templates"""
        try:
            # Get query parameters for filtering
            category = request.args.get('category')
            tags = request.args.get('tags', '').split(',') if request.args.get('tags') else []
            
            filtered_templates = PREDEFINED_TEMPLATES
            
            # Filter by category
            if category:
                filtered_templates = [t for t in filtered_templates if t.get('category') == category]
            
            # Filter by tags
            if tags:
                filtered_templates = [
                    t for t in filtered_templates 
                    if any(tag.strip().lower() in [template_tag.lower() for template_tag in t.get('tags', [])] for tag in tags)
                ]
            
            # Add statistics to each template
            templates_with_stats = []
            for template in filtered_templates:
                template_copy = template.copy()
                template_copy['statistics'] = _calculate_schedule_statistics(template['schedule'])
                templates_with_stats.append(template_copy)
            
            return jsonify({
                'status': 'success',
                'templates': templates_with_stats,
                'total_templates': len(templates_with_stats),
                'available_categories': list(set([t['category'] for t in PREDEFINED_TEMPLATES])),
                'available_tags': list(set([tag for t in PREDEFINED_TEMPLATES for tag in t.get('tags', [])]))
            })
            
        except Exception as e:
            logger.error(f"Error retrieving schedule templates: {str(e)}")
            return jsonify({'error': 'Error retrieving schedule templates'}), 500

    @app.route('/schedule-templates/<template_id>', methods=['GET'])
    def get_schedule_template(template_id):
        """Get a specific schedule template"""
        try:
            # Find template by ID
            template = next((t for t in PREDEFINED_TEMPLATES if t['id'] == template_id), None)
            
            if not template:
                return jsonify({'error': 'Template not found'}), 404
            
            # Add statistics
            template_copy = template.copy()
            template_copy['statistics'] = _calculate_schedule_statistics(template['schedule'])
            
            return jsonify({
                'status': 'success',
                'template': template_copy
            })
            
        except Exception as e:
            logger.error(f"Error retrieving schedule template: {str(e)}")
            return jsonify({'error': 'Error retrieving schedule template'}), 500

    @app.route('/schedule/<user_id>/apply-template/<template_id>', methods=['POST'])
    def apply_schedule_template(user_id, template_id):
        """Apply a template to user's schedule"""
        try:
            # Validate user exists
            try:
                user_object_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
                user = users_collection.find_one({"_id": user_object_id})
                if not user:
                    return jsonify({'error': 'User not found'}), 404
            except:
                return jsonify({'error': 'Invalid user ID format'}), 400
            
            # Find template
            template = next((t for t in PREDEFINED_TEMPLATES if t['id'] == template_id), None)
            if not template:
                return jsonify({'error': 'Template not found'}), 404
            
            # Get customization options from request
            data = request.json or {}
            customizations = data.get('customizations', {})
            merge_with_existing = data.get('merge_with_existing', False)
            custom_subjects = customizations.get('subjects', {})  # mapping of template subjects to custom subjects
            
            # Apply customizations to template
            customized_schedule = []
            for session in template['schedule']:
                customized_session = session.copy()
                
                # Apply subject customizations
                original_subject = session['subject']
                if original_subject in custom_subjects:
                    customized_session['subject'] = custom_subjects[original_subject]
                
                # Apply other customizations
                if 'location' in customizations:
                    customized_session['location'] = customizations['location']
                
                # Generate unique ID for each session
                customized_session['id'] = f"template_{template_id}_{hash(str(customized_session))}"
                
                customized_schedule.append(customized_session)
            
            # Get existing schedule if merging
            existing_schedule = schedules_collection.find_one({"userId": user_id})
            final_schedule = customized_schedule
            action = "template_apply"
            
            if existing_schedule and merge_with_existing:
                existing_sessions = existing_schedule.get('schedule', [])
                final_schedule = existing_sessions + customized_schedule
                action = "template_apply_merge"
            
            # Prepare schedule data
            schedule_name = customizations.get('schedule_name', template['name'])
            preferences = template.get('preferences', {})
            
            # Override preferences with customizations
            if 'preferences' in customizations:
                preferences.update(customizations['preferences'])
            
            schedule_doc = {
                "userId": user_id,
                "schedule": final_schedule,
                "preferences": preferences,
                "schedule_name": schedule_name,
                "is_active": True,
                "created_at": datetime.now(),
                "updated_at": datetime.now(),
                "template_info": {
                    "applied_template_id": template_id,
                    "applied_at": datetime.now().isoformat(),
                    "customizations_applied": bool(customizations),
                    "merged_with_existing": merge_with_existing
                }
            }
            
            # Save or update schedule
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
                    "template_id": template_id,
                    "template_name": template['name'],
                    "session_count": len(final_schedule),
                    "merged": merge_with_existing
                })
                
                logger.info(f"Template '{template['name']}' applied to user {user_id}")
                
                return jsonify({
                    'status': 'success',
                    'message': f'Template "{template["name"]}" applied successfully',
                    'schedule_id': schedule_id,
                    'template_applied': template['name'],
                    'session_count': len(final_schedule),
                    'merged': merge_with_existing,
                    'statistics': _calculate_schedule_statistics(final_schedule)
                })
            else:
                return jsonify({'error': 'Failed to apply template'}), 500
            
        except Exception as e:
            logger.error(f"Error applying schedule template: {str(e)}")
            return jsonify({'error': 'Error applying schedule template'}), 500

    @app.route('/schedule/<user_id>/save-as-template', methods=['POST'])
    def save_schedule_as_template(user_id):
        """Save user's current schedule as a custom template"""
        try:
            # Validate user exists
            try:
                user_object_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
                user = users_collection.find_one({"_id": user_object_id})
                if not user:
                    return jsonify({'error': 'User not found'}), 404
            except:
                return jsonify({'error': 'Invalid user ID format'}), 400
            
            # Get template info from request
            data = request.json
            if not data:
                return jsonify({'error': 'No template data provided'}), 400
            
            required_fields = ['template_name', 'description']
            validation_errors = validate_input(data, required_fields)
            if validation_errors:
                return jsonify({'error': '; '.join(validation_errors)}), 400
            
            # Get user's current schedule
            query = {'userId': {'$in': [user_id, user_object_id]}, 'is_active': True}
            schedule_doc = schedules_collection.find_one(query)
            
            if not schedule_doc:
                return jsonify({'error': 'No active schedule found to save as template'}), 404
            
            schedule_sessions = schedule_doc.get('schedule', [])
            if not schedule_sessions:
                return jsonify({'error': 'Schedule is empty. Cannot save as template.'}), 400
            
            # Create custom template
            template_data = {
                'template_name': data['template_name'],
                'description': data['description'],
                'category': data.get('category', 'custom'),
                'tags': data.get('tags', ['custom']),
                'is_public': data.get('is_public', False),  # Whether other users can see this template
                'creator_id': user_id,
                'created_at': datetime.now(),
                'schedule': schedule_sessions,
                'preferences': schedule_doc.get('preferences', {}),
                'statistics': _calculate_schedule_statistics(schedule_sessions)
            }
            
            # Save template to a custom templates collection (we'll use a field in user's document for now)
            # Update user document to include custom templates
            user_update = {
                "$push": {
                    "custom_templates": template_data
                }
            }
            
            # Initialize custom_templates array if it doesn't exist
            if 'custom_templates' not in user:
                user_update = {
                    "$set": {
                        "custom_templates": [template_data]
                    }
                }
            
            result = users_collection.update_one(
                {"_id": user_object_id},
                user_update
            )
            
            if result.modified_count > 0:
                log_user_action(user_id, "template_save", {
                    "template_name": data['template_name'],
                    "session_count": len(schedule_sessions),
                    "is_public": data.get('is_public', False)
                })
                
                logger.info(f"Custom template '{data['template_name']}' saved for user {user_id}")
                
                return jsonify({
                    'status': 'success',
                    'message': f'Schedule saved as template "{data["template_name"]}" successfully',
                    'template_name': data['template_name'],
                    'session_count': len(schedule_sessions),
                    'statistics': template_data['statistics']
                })
            else:
                return jsonify({'error': 'Failed to save template'}), 500
            
        except Exception as e:
            logger.error(f"Error saving schedule as template: {str(e)}")
            return jsonify({'error': 'Error saving schedule as template'}), 500

    @app.route('/schedule/<user_id>/templates', methods=['GET'])
    def get_user_templates(user_id):
        """Get user's custom templates"""
        try:
            # Validate user exists
            try:
                user_object_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
                user = users_collection.find_one({"_id": user_object_id})
                if not user:
                    return jsonify({'error': 'User not found'}), 404
            except:
                return jsonify({'error': 'Invalid user ID format'}), 400
            
            # Get user's custom templates
            custom_templates = user.get('custom_templates', [])
            
            # Also get public templates from other users
            include_public = request.args.get('include_public', 'true').lower() == 'true'
            public_templates = []
            
            if include_public:
                # Find all users with public templates
                public_users = users_collection.find(
                    {"custom_templates.is_public": True},
                    {"custom_templates": 1, "firstname": 1, "lastname": 1}
                )
                
                for pub_user in public_users:
                    if str(pub_user['_id']) != user_id:  # Don't include own templates again
                        user_public_templates = [
                            {**template, 'creator_name': f"{pub_user.get('firstname', '')} {pub_user.get('lastname', '')}".strip()}
                            for template in pub_user.get('custom_templates', [])
                            if template.get('is_public', False)
                        ]
                        public_templates.extend(user_public_templates)
            
            return jsonify({
                'status': 'success',
                'custom_templates': custom_templates,
                'public_templates': public_templates,
                'predefined_templates': PREDEFINED_TEMPLATES,
                'total_custom': len(custom_templates),
                'total_public': len(public_templates),
                'total_predefined': len(PREDEFINED_TEMPLATES)
            })
            
        except Exception as e:
            logger.error(f"Error retrieving user templates: {str(e)}")
            return jsonify({'error': 'Error retrieving user templates'}), 500

    @app.route('/schedule/<user_id>/templates/<template_name>', methods=['DELETE'])
    def delete_user_template(user_id, template_name):
        """Delete a user's custom template"""
        try:
            # Validate user exists
            try:
                user_object_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
                user = users_collection.find_one({"_id": user_object_id})
                if not user:
                    return jsonify({'error': 'User not found'}), 404
            except:
                return jsonify({'error': 'Invalid user ID format'}), 400
            
            # Remove the template from user's custom templates
            result = users_collection.update_one(
                {"_id": user_object_id},
                {"$pull": {"custom_templates": {"template_name": template_name}}}
            )
            
            if result.modified_count > 0:
                log_user_action(user_id, "template_delete", {
                    "template_name": template_name
                })
                
                logger.info(f"Custom template '{template_name}' deleted for user {user_id}")
                
                return jsonify({
                    'status': 'success',
                    'message': f'Template "{template_name}" deleted successfully'
                })
            else:
                return jsonify({'error': 'Template not found or already deleted'}), 404
            
        except Exception as e:
            logger.error(f"Error deleting user template: {str(e)}")
            return jsonify({'error': 'Error deleting user template'}), 500

    @app.route('/schedule-templates/search', methods=['GET'])
    def search_schedule_templates():
        """Search schedule templates by various criteria"""
        try:
            # Get search parameters
            query = request.args.get('q', '').lower()
            category = request.args.get('category')
            tags = request.args.get('tags', '').split(',') if request.args.get('tags') else []
            min_sessions = int(request.args.get('min_sessions', 0))
            max_sessions = int(request.args.get('max_sessions', 100))
            
            results = []
            
            # Search predefined templates
            for template in PREDEFINED_TEMPLATES:
                matches = True
                
                # Text search in name and description
                if query:
                    text_to_search = f"{template['name']} {template['description']}".lower()
                    if query not in text_to_search:
                        matches = False
                
                # Category filter
                if category and template.get('category') != category:
                    matches = False
                
                # Tags filter
                if tags:
                    template_tags = [tag.lower() for tag in template.get('tags', [])]
                    if not any(tag.strip().lower() in template_tags for tag in tags):
                        matches = False
                
                # Session count filter
                session_count = len(template['schedule'])
                if not (min_sessions <= session_count <= max_sessions):
                    matches = False
                
                if matches:
                    template_copy = template.copy()
                    template_copy['statistics'] = _calculate_schedule_statistics(template['schedule'])
                    template_copy['source'] = 'predefined'
                    results.append(template_copy)
            
            return jsonify({
                'status': 'success',
                'results': results,
                'total_results': len(results),
                'search_criteria': {
                    'query': query,
                    'category': category,
                    'tags': tags,
                    'session_range': [min_sessions, max_sessions]
                }
            })
            
        except Exception as e:
            logger.error(f"Error searching schedule templates: {str(e)}")
            return jsonify({'error': 'Error searching schedule templates'}), 500

    logger.info("Schedule templates routes registered successfully")
