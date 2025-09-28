"""
Schedule activities module for EduMaster application.
This module handles scheduled activities and events management.
"""

import logging
from datetime import datetime
from flask import request, jsonify
from bson import ObjectId

from database import scheduled_activities_collection, users_collection
from utils import validate_input, log_user_action

logger = logging.getLogger(__name__)

def register_schedule_activities_routes(app):
    """Register schedule activities routes with the Flask app"""
    
    @app.route('/schedule-activity', methods=['POST'])
    def schedule_activity():
        """Schedule a new activity"""
        try:
            data = request.json
            if not data:
                return jsonify({'error': 'No data provided'}), 400

            # Validate required fields
            required_fields = ['userId', 'title', 'activityDate']
            validation_errors = validate_input(data, required_fields)

            if validation_errors:
                return jsonify({'error': '; '.join(validation_errors)}), 400

            # Validate user exists
            try:
                user_object_id = ObjectId(data.get('userId')) if isinstance(data.get('userId'), str) else data.get('userId')
                user = users_collection.find_one({"_id": user_object_id})
                if not user:
                    return jsonify({'error': 'User not found'}), 404
            except:
                return jsonify({'error': 'Invalid user ID format'}), 400

            # Create scheduled activity
            activity_data = {
                "userId": data.get('userId'),
                "title": data.get('title'),
                "description": data.get('description', ''),
                "activityDate": data.get('activityDate'),
                "activityTime": data.get('activityTime'),
                "duration": data.get('duration', 60),  # Default 1 hour
                "location": data.get('location', ''),
                "category": data.get('category', 'general'),  # study, meeting, exam, etc.
                "priority": data.get('priority', 'medium'),  # low, medium, high
                "reminder_minutes": data.get('reminder_minutes', [60, 15]),  # Remind 1h and 15m before
                "status": "scheduled",
                "created_at": datetime.now(),
                "updated_at": datetime.now()
            }

            result = scheduled_activities_collection.insert_one(activity_data)

            if result.inserted_id:
                activity_id = str(result.inserted_id)
                
                log_user_action(data.get('userId'), "activity_schedule", {
                    "activity_id": activity_id,
                    "title": data.get('title'),
                    "date": data.get('activityDate')
                })
                
                logger.info(f"Activity scheduled: {data.get('title')} for user {data.get('userId')}")
                
                return jsonify({
                    'status': 'success',
                    'message': 'Activity scheduled successfully',
                    'activity_id': activity_id
                }), 201
            else:
                return jsonify({'error': 'Failed to schedule activity'}), 500

        except Exception as e:
            logger.error(f"Scheduling error: {str(e)}")
            return jsonify({'error': 'Internal server error'}), 500

    @app.route('/activities/<user_id>', methods=['GET'])
    def get_activities(user_id):
        """Get scheduled activities for a user"""
        try:
            # Try to convert user_id to ObjectId if it's a string
            try:
                user_object_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
            except:
                user_object_id = user_id
            
            # Get query parameters
            status = request.args.get('status')  # Filter by status
            category = request.args.get('category')  # Filter by category
            from_date = request.args.get('from_date')  # Filter from date
            to_date = request.args.get('to_date')  # Filter to date
            priority = request.args.get('priority')  # Filter by priority
            limit = int(request.args.get('limit', 50))
            
            # Build query
            query = {'userId': {'$in': [user_id, user_object_id]}}
            
            if status:
                query['status'] = status
            if category:
                query['category'] = category
            if priority:
                query['priority'] = priority
            if from_date:
                if 'activityDate' not in query:
                    query['activityDate'] = {}
                query['activityDate']['$gte'] = from_date
            if to_date:
                if 'activityDate' not in query:
                    query['activityDate'] = {}
                query['activityDate']['$lte'] = to_date
            
            activities = scheduled_activities_collection.find(query).sort('activityDate', 1).limit(limit)
            
            activity_list = []
            for activity in activities:
                activity_data = {
                    'activity_id': str(activity['_id']),
                    'title': activity.get('title'),
                    'description': activity.get('description', ''),
                    'activityDate': activity.get('activityDate'),
                    'activityTime': activity.get('activityTime'),
                    'duration': activity.get('duration', 60),
                    'location': activity.get('location', ''),
                    'category': activity.get('category', 'general'),
                    'priority': activity.get('priority', 'medium'),
                    'reminder_minutes': activity.get('reminder_minutes', []),
                    'status': activity.get('status'),
                    'created_at': activity.get('created_at').isoformat() if activity.get('created_at') else None,
                    'updated_at': activity.get('updated_at').isoformat() if activity.get('updated_at') else None
                }
                activity_list.append(activity_data)
            
            # Get summary stats
            stats = {
                'total_activities': len(activity_list),
                'scheduled': len([a for a in activity_list if a['status'] == 'scheduled']),
                'completed': len([a for a in activity_list if a['status'] == 'completed']),
                'cancelled': len([a for a in activity_list if a['status'] == 'cancelled']),
                'in_progress': len([a for a in activity_list if a['status'] == 'in-progress'])
            }
            
            # Get category breakdown
            category_stats = {}
            for activity in activity_list:
                cat = activity['category']
                category_stats[cat] = category_stats.get(cat, 0) + 1
            
            return jsonify({
                'status': 'success',
                'activities': activity_list,
                'stats': stats,
                'category_breakdown': category_stats,
                'total_activities': len(activity_list)
            })
            
        except Exception as e:
            logger.error(f"Error retrieving activities: {str(e)}")
            return jsonify({'error': 'Error retrieving activities'}), 500

    @app.route('/activities/<activity_id>', methods=['GET'])
    def get_activity(activity_id):
        """Get a specific activity"""
        try:
            try:
                activity_object_id = ObjectId(activity_id)
            except:
                return jsonify({'error': 'Invalid activity ID format'}), 400

            activity = scheduled_activities_collection.find_one({"_id": activity_object_id})
            if not activity:
                return jsonify({'error': 'Activity not found'}), 404

            activity_data = {
                'activity_id': str(activity['_id']),
                'title': activity.get('title'),
                'description': activity.get('description', ''),
                'activityDate': activity.get('activityDate'),
                'activityTime': activity.get('activityTime'),
                'duration': activity.get('duration', 60),
                'location': activity.get('location', ''),
                'category': activity.get('category', 'general'),
                'priority': activity.get('priority', 'medium'),
                'reminder_minutes': activity.get('reminder_minutes', []),
                'status': activity.get('status'),
                'created_at': activity.get('created_at').isoformat() if activity.get('created_at') else None,
                'updated_at': activity.get('updated_at').isoformat() if activity.get('updated_at') else None
            }

            return jsonify({
                'status': 'success',
                'activity': activity_data
            })

        except Exception as e:
            logger.error(f"Error retrieving activity: {str(e)}")
            return jsonify({'error': 'Error retrieving activity'}), 500

    @app.route('/activities/<activity_id>', methods=['PUT'])
    def update_activity(activity_id):
        """Update a scheduled activity"""
        try:
            data = request.json
            if not data:
                return jsonify({'error': 'No data provided'}), 400

            try:
                activity_object_id = ObjectId(activity_id)
            except:
                return jsonify({'error': 'Invalid activity ID format'}), 400

            # Check if activity exists
            activity = scheduled_activities_collection.find_one({"_id": activity_object_id})
            if not activity:
                return jsonify({'error': 'Activity not found'}), 404

            # Build update data
            update_data = {"updated_at": datetime.now()}
            allowed_fields = ['title', 'description', 'activityDate', 'activityTime', 'duration', 
                             'location', 'category', 'priority', 'reminder_minutes', 'status']

            for field in allowed_fields:
                if field in data:
                    update_data[field] = data[field]

            # Update activity
            result = scheduled_activities_collection.update_one(
                {"_id": activity_object_id},
                {"$set": update_data}
            )

            if result.modified_count > 0:
                log_user_action(str(activity.get('userId')), "activity_update", {
                    "activity_id": activity_id,
                    "updated_fields": list(update_data.keys())
                })
                
                return jsonify({
                    'status': 'success',
                    'message': 'Activity updated successfully'
                })
            else:
                return jsonify({'error': 'No changes made to activity'}), 400

        except Exception as e:
            logger.error(f"Error updating activity: {str(e)}")
            return jsonify({'error': 'Error updating activity'}), 500

    @app.route('/activities/<activity_id>', methods=['DELETE'])
    def delete_activity(activity_id):
        """Delete a scheduled activity"""
        try:
            try:
                activity_object_id = ObjectId(activity_id)
            except:
                return jsonify({'error': 'Invalid activity ID format'}), 400

            # Check if activity exists
            activity = scheduled_activities_collection.find_one({"_id": activity_object_id})
            if not activity:
                return jsonify({'error': 'Activity not found'}), 404

            # Verify ownership if user_id is provided
            user_id = request.args.get('user_id')
            if user_id and user_id != str(activity.get('userId')):
                return jsonify({'error': 'Unauthorized to delete this activity'}), 403

            # Delete the activity
            result = scheduled_activities_collection.delete_one({"_id": activity_object_id})

            if result.deleted_count > 0:
                log_user_action(str(activity.get('userId')), "activity_delete", {
                    "activity_id": activity_id,
                    "title": activity.get('title')
                })
                
                return jsonify({
                    'status': 'success',
                    'message': 'Activity deleted successfully'
                })
            else:
                return jsonify({'error': 'Failed to delete activity'}), 500

        except Exception as e:
            logger.error(f"Error deleting activity: {str(e)}")
            return jsonify({'error': 'Error deleting activity'}), 500

    @app.route('/activities/<activity_id>/status', methods=['PUT'])
    def update_activity_status(activity_id):
        """Update activity status (scheduled, completed, cancelled)"""
        try:
            data = request.json
            if not data or 'status' not in data:
                return jsonify({'error': 'Status is required'}), 400

            try:
                activity_object_id = ObjectId(activity_id)
            except:
                return jsonify({'error': 'Invalid activity ID format'}), 400

            valid_statuses = ['scheduled', 'completed', 'cancelled', 'in-progress']
            status = data.get('status')
            
            if status not in valid_statuses:
                return jsonify({'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'}), 400

            update_data = {
                "status": status,
                "updated_at": datetime.now()
            }

            # Add completion timestamp for completed activities
            if status == 'completed':
                update_data['completed_at'] = datetime.now().isoformat()
                update_data['completion_notes'] = data.get('completion_notes', '')

            result = scheduled_activities_collection.update_one(
                {"_id": activity_object_id},
                {"$set": update_data}
            )

            if result.modified_count > 0:
                activity = scheduled_activities_collection.find_one({"_id": activity_object_id})
                if activity:
                    log_user_action(str(activity.get('userId')), "activity_status_change", {
                        "activity_id": activity_id,
                        "status": status,
                        "title": activity.get('title')
                    })
                
                return jsonify({
                    'status': 'success',
                    'message': f'Activity status updated to {status}'
                })
            else:
                return jsonify({'error': 'Activity not found'}), 404

        except Exception as e:
            logger.error(f"Error updating activity status: {str(e)}")
            return jsonify({'error': 'Error updating activity status'}), 500

    @app.route('/activities/<user_id>/bulk-update', methods=['PUT'])
    def bulk_update_activities(user_id):
        """Bulk update multiple activities"""
        try:
            data = request.json
            if not data or 'updates' not in data:
                return jsonify({'error': 'No updates provided'}), 400

            # Validate user exists
            try:
                user_object_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
                user = users_collection.find_one({"_id": user_object_id})
                if not user:
                    return jsonify({'error': 'User not found'}), 404
            except:
                return jsonify({'error': 'Invalid user ID format'}), 400

            updates = data['updates']
            if not isinstance(updates, list):
                return jsonify({'error': 'Updates must be a list'}), 400

            results = []
            successful_updates = 0

            for update in updates:
                try:
                    activity_id = update.get('activity_id')
                    update_fields = update.get('fields', {})

                    if not activity_id or not update_fields:
                        results.append({
                            'activity_id': activity_id,
                            'success': False,
                            'error': 'Activity ID and fields are required'
                        })
                        continue

                    activity_object_id = ObjectId(activity_id)
                    
                    # Verify the activity belongs to the user
                    activity = scheduled_activities_collection.find_one({
                        "_id": activity_object_id,
                        "userId": {'$in': [user_id, user_object_id]}
                    })
                    
                    if not activity:
                        results.append({
                            'activity_id': activity_id,
                            'success': False,
                            'error': 'Activity not found or unauthorized'
                        })
                        continue

                    # Prepare update data
                    update_data = {"updated_at": datetime.now()}
                    allowed_fields = ['title', 'description', 'activityDate', 'activityTime', 'duration', 
                                     'location', 'category', 'priority', 'reminder_minutes', 'status']

                    for field in allowed_fields:
                        if field in update_fields:
                            update_data[field] = update_fields[field]

                    # Add completion timestamp if status is completed
                    if update_fields.get('status') == 'completed':
                        update_data['completed_at'] = datetime.now().isoformat()

                    # Update activity
                    result = scheduled_activities_collection.update_one(
                        {"_id": activity_object_id},
                        {"$set": update_data}
                    )

                    if result.modified_count > 0:
                        successful_updates += 1
                        results.append({
                            'activity_id': activity_id,
                            'success': True,
                            'updated_fields': list(update_data.keys())
                        })
                    else:
                        results.append({
                            'activity_id': activity_id,
                            'success': False,
                            'error': 'No changes made'
                        })

                except Exception as e:
                    results.append({
                        'activity_id': update.get('activity_id'),
                        'success': False,
                        'error': str(e)
                    })

            # Log bulk update
            log_user_action(user_id, "activities_bulk_update", {
                "total_updates": len(updates),
                "successful_updates": successful_updates
            })

            return jsonify({
                'status': 'success',
                'message': f'{successful_updates} out of {len(updates)} activities updated successfully',
                'results': results,
                'successful_updates': successful_updates,
                'total_updates': len(updates)
            })

        except Exception as e:
            logger.error(f"Error in bulk update activities: {str(e)}")
            return jsonify({'error': 'Error in bulk update activities'}), 500

    @app.route('/activities/<user_id>/statistics', methods=['GET'])
    def get_activity_statistics(user_id):
        """Get activity statistics for a user"""
        try:
            # Validate user exists
            try:
                user_object_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
                user = users_collection.find_one({"_id": user_object_id})
                if not user:
                    return jsonify({'error': 'User not found'}), 404
            except:
                return jsonify({'error': 'Invalid user ID format'}), 400

            # Get date range for statistics
            from_date = request.args.get('from_date')
            to_date = request.args.get('to_date')

            # Build query
            query = {'userId': {'$in': [user_id, user_object_id]}}
            
            if from_date or to_date:
                date_query = {}
                if from_date:
                    date_query['$gte'] = from_date
                if to_date:
                    date_query['$lte'] = to_date
                query['activityDate'] = date_query

            # Get all activities
            activities = list(scheduled_activities_collection.find(query))

            # Calculate statistics
            total_activities = len(activities)
            
            status_stats = {
                'scheduled': 0,
                'completed': 0,
                'cancelled': 0,
                'in-progress': 0
            }
            
            category_stats = {}
            priority_stats = {'low': 0, 'medium': 0, 'high': 0}
            total_duration = 0
            completion_rate = 0

            for activity in activities:
                # Status stats
                status = activity.get('status', 'scheduled')
                if status in status_stats:
                    status_stats[status] += 1

                # Category stats
                category = activity.get('category', 'general')
                category_stats[category] = category_stats.get(category, 0) + 1

                # Priority stats
                priority = activity.get('priority', 'medium')
                if priority in priority_stats:
                    priority_stats[priority] += 1

                # Duration stats
                duration = activity.get('duration', 60)
                total_duration += duration

            # Calculate completion rate
            if total_activities > 0:
                completion_rate = (status_stats['completed'] / total_activities) * 100

            # Average duration
            avg_duration = total_duration / total_activities if total_activities > 0 else 0

            statistics = {
                'total_activities': total_activities,
                'status_breakdown': status_stats,
                'category_breakdown': category_stats,
                'priority_breakdown': priority_stats,
                'completion_rate': round(completion_rate, 1),
                'total_duration_hours': round(total_duration / 60, 2),
                'average_duration_minutes': round(avg_duration, 1),
                'date_range': {
                    'from': from_date,
                    'to': to_date
                }
            }

            return jsonify({
                'status': 'success',
                'statistics': statistics
            })

        except Exception as e:
            logger.error(f"Error retrieving activity statistics: {str(e)}")
            return jsonify({'error': 'Error retrieving activity statistics'}), 500

    @app.route('/activities/<user_id>/upcoming', methods=['GET'])
    def get_upcoming_activities(user_id):
        """Get upcoming activities for a user"""
        try:
            # Validate user exists
            try:
                user_object_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
                user = users_collection.find_one({"_id": user_object_id})
                if not user:
                    return jsonify({'error': 'User not found'}), 404
            except:
                return jsonify({'error': 'Invalid user ID format'}), 400

            # Get current date
            today = datetime.now().strftime('%Y-%m-%d')
            days_ahead = int(request.args.get('days_ahead', 7))  # Default to next 7 days
            
            # Calculate end date
            end_date = datetime.now().replace(day=datetime.now().day + days_ahead).strftime('%Y-%m-%d')

            # Build query for upcoming activities
            query = {
                'userId': {'$in': [user_id, user_object_id]},
                'status': {'$in': ['scheduled', 'in-progress']},
                'activityDate': {'$gte': today, '$lte': end_date}
            }

            activities = scheduled_activities_collection.find(query).sort([
                ('activityDate', 1),
                ('activityTime', 1)
            ])

            upcoming_list = []
            for activity in activities:
                activity_data = {
                    'activity_id': str(activity['_id']),
                    'title': activity.get('title'),
                    'description': activity.get('description', ''),
                    'activityDate': activity.get('activityDate'),
                    'activityTime': activity.get('activityTime'),
                    'duration': activity.get('duration', 60),
                    'location': activity.get('location', ''),
                    'category': activity.get('category', 'general'),
                    'priority': activity.get('priority', 'medium'),
                    'status': activity.get('status')
                }
                upcoming_list.append(activity_data)

            # Group by date
            activities_by_date = {}
            for activity in upcoming_list:
                date = activity['activityDate']
                if date not in activities_by_date:
                    activities_by_date[date] = []
                activities_by_date[date].append(activity)

            return jsonify({
                'status': 'success',
                'upcoming_activities': upcoming_list,
                'activities_by_date': activities_by_date,
                'total_upcoming': len(upcoming_list),
                'date_range': {
                    'from': today,
                    'to': end_date,
                    'days_ahead': days_ahead
                }
            })

        except Exception as e:
            logger.error(f"Error retrieving upcoming activities: {str(e)}")
            return jsonify({'error': 'Error retrieving upcoming activities'}), 500

    logger.info("Schedule activities routes registered successfully")
