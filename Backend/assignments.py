"""
Assignment management module for EduMaster application.
This module handles assignment creation, retrieval, updates, and deletion.
"""

import logging
from datetime import datetime
from flask import request, jsonify
from bson import ObjectId

from database import assignments_collection
from utils import validate_input, log_user_action

logger = logging.getLogger(__name__)

def register_assignment_routes(app):
    """Register assignment management routes with the Flask app"""
    
    @app.route('/assignments', methods=['POST'])
    def create_assignment():
        """Create a new assignment"""
        try:
            data = request.json
            if not data:
                return jsonify({'error': 'No data provided'}), 400

            # Validate required fields
            required_fields = ['title', 'description', 'dueDate', 'userId']
            validation_errors = validate_input(data, required_fields)

            if validation_errors:
                return jsonify({'error': '; '.join(validation_errors)}), 400

            # Create assignment document
            assignment_data = {
                "courseId": data.get('courseId', 'default-course'),
                "title": data.get('title'),
                "description": data.get('description'),
                "dueDate": data.get('dueDate'),
                "userId": data.get('userId'),
                "courseName": data.get('courseName', 'General Assignment'),
                "status": "pending",
                "priority": data.get('priority', 'medium'),  # low, medium, high
                "estimatedHours": data.get('estimatedHours', 0),
                "tags": data.get('tags', []),
                "attachments": data.get('attachments', []),
                "completedAt": None,
                "created_at": datetime.now(),
                "updated_at": datetime.now()
            }

            result = assignments_collection.insert_one(assignment_data)

            if result.inserted_id:
                # Log assignment creation
                log_user_action(data.get('userId'), "assignment_create", {
                    "assignment_id": str(result.inserted_id),
                    "title": data.get('title'),
                    "course_id": data.get('courseId')
                })
                
                logger.info(f"Assignment created successfully: {data.get('title')} by user {data.get('userId')}")
                
                # Send assignment creation notification
                try:
                    from notifications import notification_manager
                    # Add the assignment ID to the assignment data for the notification
                    assignment_with_id = {**assignment_data, '_id': result.inserted_id}
                    notification_manager.send_assignment_creation_notification(
                        data.get('userId'),
                        assignment_with_id
                    )
                    logger.info(f"Assignment creation notification triggered for user {data.get('userId')}")
                except Exception as e:
                    logger.warning(f"Failed to send assignment creation notification: {e}")
                    # Don't fail the assignment creation if notification fails
                
                return jsonify({
                    'status': 'success',
                    'message': 'Assignment created successfully',
                    'assignment_id': str(result.inserted_id)
                }), 201
            else:
                return jsonify({'error': 'Failed to create assignment'}), 500

        except Exception as e:
            logger.error(f"Error creating assignment: {str(e)}")
            return jsonify({'error': 'Internal server error'}), 500

    @app.route('/assignments/<assignment_id>', methods=['PUT'])
    def update_assignment(assignment_id):
        """Update an existing assignment"""
        try:
            data = request.json
            if not data:
                return jsonify({'error': 'No data provided'}), 400

            try:
                assignment_object_id = ObjectId(assignment_id)
            except:
                return jsonify({'error': 'Invalid assignment ID format'}), 400

            # Check if assignment exists
            assignment = assignments_collection.find_one({"_id": assignment_object_id})
            if not assignment:
                return jsonify({'error': 'Assignment not found'}), 404

            # Build update data
            update_data = {"updated_at": datetime.now()}
            allowed_fields = ['title', 'description', 'dueDate', 'courseId', 'courseName', 
                             'priority', 'estimatedHours', 'tags', 'attachments']

            for field in allowed_fields:
                if field in data:
                    update_data[field] = data[field]

            # Update assignment
            result = assignments_collection.update_one(
                {"_id": assignment_object_id},
                {"$set": update_data}
            )

            if result.modified_count > 0:
                log_user_action(assignment.get('userId'), "assignment_update", {
                    "assignment_id": assignment_id,
                    "updated_fields": list(update_data.keys())
                })
                
                return jsonify({
                    'status': 'success',
                    'message': 'Assignment updated successfully'
                })
            else:
                return jsonify({'error': 'No changes made to assignment'}), 400

        except Exception as e:
            logger.error(f"Error updating assignment: {str(e)}")
            return jsonify({'error': 'Internal server error'}), 500

    @app.route('/assignments/<assignment_id>/complete', methods=['PUT'])
    def update_assignment_completion(assignment_id):
        """Update assignment completion status"""
        try:
            data = request.json
            if not data:
                return jsonify({'error': 'No data provided'}), 400

            try:
                assignment_object_id = ObjectId(assignment_id)
            except:
                return jsonify({'error': 'Invalid assignment ID format'}), 400

            is_completed = data.get('completed', False)
            
            update_data = {
                "status": "completed" if is_completed else "pending",
                "completedAt": datetime.now().isoformat() if is_completed else None,
                "updated_at": datetime.now()
            }

            # Add completion notes if provided
            if 'notes' in data:
                update_data['completion_notes'] = data['notes']

            result = assignments_collection.update_one(
                {"_id": assignment_object_id},
                {"$set": update_data}
            )

            if result.modified_count > 0:
                # Get assignment for user ID logging
                assignment = assignments_collection.find_one({"_id": assignment_object_id})
                if assignment:
                    log_user_action(assignment.get('userId'), "assignment_completion", {
                        "assignment_id": assignment_id,
                        "completed": is_completed,
                        "title": assignment.get('title')
                    })
                
                return jsonify({
                    'status': 'success',
                    'message': f'Assignment marked as {"completed" if is_completed else "pending"}'
                })
            else:
                return jsonify({'error': 'Assignment not found or no changes made'}), 404

        except Exception as e:
            logger.error(f"Error updating assignment completion: {str(e)}")
            return jsonify({'error': 'Error updating assignment completion'}), 500

    @app.route('/assignments/<assignment_id>/status', methods=['PUT'])
    def update_assignment_status(assignment_id):
        """Update assignment status (pending, in-progress, completed, cancelled)"""
        try:
            data = request.json
            if not data or 'status' not in data:
                return jsonify({'error': 'Status is required'}), 400

            try:
                assignment_object_id = ObjectId(assignment_id)
            except:
                return jsonify({'error': 'Invalid assignment ID format'}), 400

            valid_statuses = ['pending', 'in-progress', 'completed', 'cancelled']
            status = data.get('status')
            
            if status not in valid_statuses:
                return jsonify({'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'}), 400

            update_data = {
                "status": status,
                "updated_at": datetime.now()
            }

            # Set completion date for completed assignments
            if status == 'completed':
                update_data['completedAt'] = datetime.now().isoformat()
            elif status != 'completed':
                update_data['completedAt'] = None

            result = assignments_collection.update_one(
                {"_id": assignment_object_id},
                {"$set": update_data}
            )

            if result.modified_count > 0:
                assignment = assignments_collection.find_one({"_id": assignment_object_id})
                if assignment:
                    log_user_action(assignment.get('userId'), "assignment_status_change", {
                        "assignment_id": assignment_id,
                        "status": status,
                        "title": assignment.get('title')
                    })
                
                return jsonify({
                    'status': 'success',
                    'message': f'Assignment status updated to {status}'
                })
            else:
                return jsonify({'error': 'Assignment not found'}), 404

        except Exception as e:
            logger.error(f"Error updating assignment status: {str(e)}")
            return jsonify({'error': 'Error updating assignment status'}), 500

    @app.route('/assignments/<assignment_id>', methods=['DELETE'])
    def delete_assignment(assignment_id):
        """Delete an assignment"""
        try:
            try:
                assignment_object_id = ObjectId(assignment_id)
            except:
                return jsonify({'error': 'Invalid assignment ID format'}), 400
            
            # Check if assignment exists and get user info for logging
            assignment = assignments_collection.find_one({"_id": assignment_object_id})
            if not assignment:
                return jsonify({'error': 'Assignment not found'}), 404
            
            # Verify ownership if user_id is provided
            user_id = request.args.get('user_id')
            if user_id and user_id != str(assignment.get('userId')):
                return jsonify({'error': 'Unauthorized to delete this assignment'}), 403
            
            # Delete the assignment (hard delete)
            result = assignments_collection.delete_one({"_id": assignment_object_id})
            
            if result.deleted_count > 0:
                log_user_action(str(assignment.get('userId')), "assignment_delete", {
                    "assignment_id": assignment_id,
                    "title": assignment.get('title')
                })
                
                logger.info(f"Assignment deleted successfully: {assignment_id}")
                return jsonify({
                    'status': 'success',
                    'message': 'Assignment deleted successfully'
                }), 200
            else:
                return jsonify({'error': 'Failed to delete assignment'}), 500
                
        except Exception as e:
            logger.error(f"Error deleting assignment: {str(e)}")
            return jsonify({'error': 'Internal server error'}), 500

    @app.route('/assignments/<user_id>', methods=['GET'])
    def get_assignments(user_id):
        """Get assignments for a user with filtering options"""
        try:
            # Convert user_id to appropriate format for MongoDB query
            try:
                user_object_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
            except:
                user_object_id = user_id
            
            # Get query parameters for filtering
            status = request.args.get('status')  # Filter by status
            course_id = request.args.get('course_id')  # Filter by course
            priority = request.args.get('priority')  # Filter by priority
            limit = int(request.args.get('limit', 50))  # Limit results
            sort_by = request.args.get('sort_by', 'created_at')  # Sort field
            sort_order = request.args.get('sort_order', 'desc')  # asc or desc
            
            # Build query
            query = {'userId': {'$in': [user_id, user_object_id]}}
            
            if status:
                query['status'] = status
            if course_id:
                query['courseId'] = course_id
            if priority:
                query['priority'] = priority
            
            # Build sort criteria
            sort_direction = 1 if sort_order == 'asc' else -1
            sort_criteria = [(sort_by, sort_direction)]
            
            assignments = assignments_collection.find(query).sort(sort_criteria).limit(limit)
            
            assignment_list = []
            for assignment in assignments:
                assignment_data = {
                    'assignment_id': str(assignment['_id']),
                    'title': assignment.get('title'),
                    'description': assignment.get('description', ''),
                    'courseId': assignment.get('courseId'),
                    'courseName': assignment.get('courseName', 'N/A'),
                    'dueDate': assignment.get('dueDate'),
                    'status': assignment.get('status'),
                    'priority': assignment.get('priority', 'medium'),
                    'estimatedHours': assignment.get('estimatedHours', 0),
                    'tags': assignment.get('tags', []),
                    'attachments': assignment.get('attachments', []),
                    'completedAt': assignment.get('completedAt'),
                    'completion_notes': assignment.get('completion_notes'),
                    'created_at': assignment.get('created_at').isoformat() if assignment.get('created_at') else None,
                    'updated_at': assignment.get('updated_at').isoformat() if assignment.get('updated_at') else None
                }
                assignment_list.append(assignment_data)
            
            # Get summary statistics
            stats = {
                'total_assignments': len(assignment_list),
                'completed': len([a for a in assignment_list if a['status'] == 'completed']),
                'pending': len([a for a in assignment_list if a['status'] == 'pending']),
                'in_progress': len([a for a in assignment_list if a['status'] == 'in-progress']),
                'overdue': 0  # You could implement overdue logic here
            }
            
            return jsonify({
                'status': 'success',
                'assignments': assignment_list,
                'stats': stats,
                'total_assignments': len(assignment_list)
            })
            
        except Exception as e:
            logger.error(f"Error retrieving assignments: {str(e)}")
            return jsonify({'error': 'Error retrieving assignments'}), 500

    @app.route('/assignments', methods=['GET'])
    def get_all_assignments():
        """Get all assignments (for admin/testing purposes)"""
        try:
            # Get query parameters
            limit = int(request.args.get('limit', 100))
            status = request.args.get('status')
            
            query = {}
            if status:
                query['status'] = status
            
            assignments = assignments_collection.find(query).sort('created_at', -1).limit(limit)
            
            assignment_list = []
            for assignment in assignments:
                assignment_data = {
                    'assignment_id': str(assignment['_id']),
                    'title': assignment.get('title'),
                    'description': assignment.get('description', ''),
                    'courseId': assignment.get('courseId'),
                    'courseName': assignment.get('courseName', 'N/A'),
                    'userId': str(assignment.get('userId')),
                    'dueDate': assignment.get('dueDate'),
                    'status': assignment.get('status'),
                    'priority': assignment.get('priority', 'medium'),
                    'estimatedHours': assignment.get('estimatedHours', 0),
                    'completedAt': assignment.get('completedAt'),
                    'created_at': assignment.get('created_at').isoformat() if assignment.get('created_at') else None
                }
                assignment_list.append(assignment_data)
            
            return jsonify({
                'status': 'success',
                'assignments': assignment_list,
                'total_assignments': len(assignment_list)
            })
            
        except Exception as e:
            logger.error(f"Error retrieving all assignments: {str(e)}")
            return jsonify({'error': 'Error retrieving assignments'}), 500

    @app.route('/assignments/<assignment_id>', methods=['GET'])
    def get_assignment_details(assignment_id):
        """Get detailed information about a specific assignment"""
        try:
            try:
                assignment_object_id = ObjectId(assignment_id)
            except:
                return jsonify({'error': 'Invalid assignment ID format'}), 400

            assignment = assignments_collection.find_one({"_id": assignment_object_id})
            
            if not assignment:
                return jsonify({'error': 'Assignment not found'}), 404

            assignment_data = {
                'assignment_id': str(assignment['_id']),
                'title': assignment.get('title'),
                'description': assignment.get('description', ''),
                'courseId': assignment.get('courseId'),
                'courseName': assignment.get('courseName', 'N/A'),
                'userId': str(assignment.get('userId')),
                'dueDate': assignment.get('dueDate'),
                'status': assignment.get('status'),
                'priority': assignment.get('priority', 'medium'),
                'estimatedHours': assignment.get('estimatedHours', 0),
                'tags': assignment.get('tags', []),
                'attachments': assignment.get('attachments', []),
                'completedAt': assignment.get('completedAt'),
                'completion_notes': assignment.get('completion_notes'),
                'created_at': assignment.get('created_at').isoformat() if assignment.get('created_at') else None,
                'updated_at': assignment.get('updated_at').isoformat() if assignment.get('updated_at') else None
            }

            return jsonify({
                'status': 'success',
                'assignment': assignment_data
            })

        except Exception as e:
            logger.error(f"Error retrieving assignment details: {str(e)}")
            return jsonify({'error': 'Error retrieving assignment details'}), 500

    @app.route('/assignments/stats/<user_id>', methods=['GET'])
    def get_assignment_stats(user_id):
        """Get assignment statistics for a user"""
        try:
            # Convert user_id for MongoDB query
            try:
                user_object_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
            except:
                user_object_id = user_id

            # Get time range from query params
            days = int(request.args.get('days', 30))  # Default to last 30 days
            
            # Build aggregation pipeline
            pipeline = [
                {'$match': {'userId': {'$in': [user_id, user_object_id]}}},
                {
                    '$group': {
                        '_id': '$status',
                        'count': {'$sum': 1},
                        'avg_estimated_hours': {'$avg': '$estimatedHours'}
                    }
                }
            ]
            
            stats_result = list(assignments_collection.aggregate(pipeline))
            
            # Format stats
            stats = {
                'total': 0,
                'completed': 0,
                'pending': 0,
                'in_progress': 0,
                'cancelled': 0,
                'completion_rate': 0,
                'average_estimated_hours': 0
            }
            
            for stat in stats_result:
                status = stat['_id']
                count = stat['count']
                stats['total'] += count
                
                if status in stats:
                    stats[status] = count
                    
                if status == 'completed':
                    stats['average_estimated_hours'] = stat.get('avg_estimated_hours', 0)
            
            # Calculate completion rate
            if stats['total'] > 0:
                stats['completion_rate'] = round((stats['completed'] / stats['total']) * 100, 1)
            
            return jsonify({
                'status': 'success',
                'stats': stats
            })

        except Exception as e:
            logger.error(f"Error retrieving assignment stats: {str(e)}")
            return jsonify({'error': 'Error retrieving assignment statistics'}), 500

    logger.info("Assignment management routes registered successfully")
