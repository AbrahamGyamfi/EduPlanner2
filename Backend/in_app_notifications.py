"""
In-App Notification System for EduMaster application.
This module handles in-app notifications that users can view, click, and interact with directly in the UI.
"""

import logging
from datetime import datetime, timedelta
from flask import request, jsonify
from bson import ObjectId

from database import (
    users_collection, 
    assignments_collection, 
    scheduled_activities_collection,
    notifications_collection
)
from utils import validate_input, log_user_action

logger = logging.getLogger(__name__)

class InAppNotificationManager:
    """Manages in-app notifications for the EduMaster application"""
    
    def __init__(self):
        self.notification_types = {
            'assignment_reminder': {
                'icon': '📝',
                'color': 'blue',
                'priority': 'medium'
            },
            'assignment_due_soon': {
                'icon': '⚠️',
                'color': 'red',
                'priority': 'high'
            },
            'assignment_overdue': {
                'icon': '🚨',
                'color': 'red',
                'priority': 'urgent'
            },
            'session_reminder': {
                'icon': '📚',
                'color': 'green',
                'priority': 'medium'
            },
            'quiz_available': {
                'icon': '🧠',
                'color': 'purple',
                'priority': 'low'
            },
            'achievement': {
                'icon': '🏆',
                'color': 'gold',
                'priority': 'low'
            },
            'system_update': {
                'icon': '🔄',
                'color': 'blue',
                'priority': 'low'
            },
            'welcome': {
                'icon': '👋',
                'color': 'green',
                'priority': 'medium'
            },
            'ai_insight': {
                'icon': '🤖',
                'color': 'purple',
                'priority': 'medium'
            },
            'quiz_reminder': {
                'icon': '🧠',
                'color': 'blue',
                'priority': 'medium'
            },
            'study_streak': {
                'icon': '🔥',
                'color': 'orange',
                'priority': 'low'
            },
            'deadline_warning': {
                'icon': '⏰',
                'color': 'red',
                'priority': 'high'
            }
        }
    
    def create_notification(self, user_id, notification_type, title, message, 
                          action_url=None, related_id=None, expires_at=None,
                          metadata=None):
        """Create a new in-app notification"""
        try:
            # Convert user_id to ObjectId if needed
            try:
                user_object_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
            except:
                user_object_id = user_id
            
            # Get notification type configuration
            type_config = self.notification_types.get(notification_type, {
                'icon': '📢',
                'color': 'blue',
                'priority': 'medium'
            })
            
            # Create notification document
            notification = {
                'user_id': user_object_id,
                'type': notification_type,
                'title': title,
                'message': message,
                'icon': type_config['icon'],
                'color': type_config['color'],
                'priority': type_config['priority'],
                'action_url': action_url,
                'related_id': related_id,
                'metadata': metadata or {},
                'read': False,
                'clicked': False,
                'created_at': datetime.now().isoformat(),
                'expires_at': expires_at.isoformat() if expires_at else None
            }
            
            # Insert notification into database
            result = notifications_collection.insert_one(notification)
            notification['_id'] = result.inserted_id
            
            logger.info(f"Created in-app notification for user {user_id}: {title}")
            return str(result.inserted_id)
            
        except Exception as e:
            logger.error(f"Error creating in-app notification: {str(e)}")
            return None
    
    def create_assignment_reminder(self, user_id, assignment_id, assignment_data, hours_until_due):
        """Create assignment reminder notification"""
        try:
            assignment_title = assignment_data.get('title', 'Assignment')
            course_name = assignment_data.get('courseName', 'Course')
            
            if hours_until_due <= 2:
                notification_type = 'assignment_due_soon'
                title = f"🚨 {assignment_title[:30]}{'...' if len(assignment_title) > 30 else ''} - Due Soon!"
                urgency = "Due in less than 2 hours!"
            elif hours_until_due <= 24:
                notification_type = 'assignment_due_soon'  
                title = f"⚠️ {assignment_title[:35]}{'...' if len(assignment_title) > 35 else ''} - Due Today"
                urgency = f"Due in {int(hours_until_due)} hours"
            else:
                notification_type = 'assignment_reminder'
                days = int(hours_until_due / 24)
                title = f"📝 {assignment_title[:40]}{'...' if len(assignment_title) > 40 else ''} - {days} Day{'s' if days > 1 else ''} Left"
                urgency = f"Due in {days} day{'s' if days > 1 else ''}"
            
            message = f"{course_name}: {urgency}"
            action_url = f"/assignments/{assignment_id}"
            
            expires_at = datetime.fromisoformat(assignment_data.get('dueDate').replace('Z', '')) + timedelta(hours=24)
            
            return self.create_notification(
                user_id=user_id,
                notification_type=notification_type,
                title=title,
                message=message,
                action_url=action_url,
                related_id=assignment_id,
                expires_at=expires_at,
                metadata={
                    'assignment_title': assignment_data.get('title'),
                    'course_name': assignment_data.get('courseName'),
                    'due_date': assignment_data.get('dueDate'),
                    'hours_until_due': hours_until_due
                }
            )
            
        except Exception as e:
            logger.error(f"Error creating assignment reminder notification: {str(e)}")
            return None
    
    def create_session_reminder(self, user_id, session_data, minutes_until_session):
        """Create study session reminder notification"""
        try:
            subject = session_data.get('subject', 'Study Session')
            session_type = session_data.get('type', 'Study')
            
            # Create meaningful title based on timing
            if minutes_until_session <= 5:
                title = f"🔔 {subject} - Starting Now!"
                time_desc = "starting now"
            elif minutes_until_session <= 15:
                title = f"⏰ {subject} - Starts in {minutes_until_session} Min"
                time_desc = f"in {minutes_until_session} minutes"
            else:
                title = f"📅 {subject} - Upcoming Session"
                time_desc = f"in {minutes_until_session} minutes"
            
            message = f"{session_type} session {time_desc}. Get your materials ready!"
            action_url = "/schedule"
            
            expires_at = datetime.now() + timedelta(minutes=minutes_until_session + 30)
            
            return self.create_notification(
                user_id=user_id,
                notification_type='session_reminder',
                title=title,
                message=message,
                action_url=action_url,
                expires_at=expires_at,
                metadata={
                    'session_subject': session_data.get('subject'),
                    'session_time': session_data.get('time'),
                    'session_day': session_data.get('day'),
                    'minutes_until': minutes_until_session
                }
            )
            
        except Exception as e:
            logger.error(f"Error creating session reminder notification: {str(e)}")
            return None
    
    def create_achievement_notification(self, user_id, achievement_type, achievement_data):
        """Create achievement notification"""
        try:
            achievements = {
                'quiz_streak': {
                    'title': '🔥 Quiz Streak!',
                    'message': f"Amazing! You've completed {achievement_data.get('count', 0)} quizzes in a row!"
                },
                'study_milestone': {
                    'title': '📊 Study Milestone!',
                    'message': f"Congratulations! You've studied for {achievement_data.get('hours', 0)} hours this week!"
                },
                'perfect_score': {
                    'title': '💯 Perfect Score!',
                    'message': f"Excellent work on '{achievement_data.get('quiz_title', 'your quiz')}'!"
                },
                'consistency_badge': {
                    'title': '⭐ Consistency Badge!',
                    'message': f"You've maintained your study schedule for {achievement_data.get('days', 0)} days!"
                }
            }
            
            achievement_info = achievements.get(achievement_type, {
                'title': '🏆 Achievement Unlocked!',
                'message': 'Great job on your progress!'
            })
            
            return self.create_notification(
                user_id=user_id,
                notification_type='achievement',
                title=achievement_info['title'],
                message=achievement_info['message'],
                action_url='/dashboard',
                metadata=achievement_data
            )
            
        except Exception as e:
            logger.error(f"Error creating achievement notification: {str(e)}")
            return None
    
    def create_ai_insight_notification(self, user_id, insight_data):
        """Create AI insight notification"""
        try:
            insight_type = insight_data.get('type', 'general')
            confidence = insight_data.get('confidence', 'medium')
            
            # Create contextual titles based on insight type
            if insight_type == 'study_pattern':
                title = f"📊 Study Pattern Insights Ready"
                message = "Your study habits analysis reveals optimization opportunities!"
            elif insight_type == 'performance_trend':
                title = f"📈 Performance Trends Analysis"
                message = "See how your academic performance is trending this week."
            elif insight_type == 'schedule_optimization':
                title = f"🎯 Schedule Optimization Tips"
                message = "AI has found ways to improve your study schedule efficiency."
            elif insight_type == 'learning_recommendation':
                title = f"🎓 Personalized Learning Tips"
                message = "New learning strategies tailored to your progress!"
            else:
                title = f"🤖 AI Study Coach Update"
                insights = insight_data.get('top_insights', [])
                if insights:
                    message = f"Your learning analysis is ready: {insights[0][:80]}{'...' if len(insights[0]) > 80 else ''}"
                else:
                    message = "We've analyzed your study patterns and have personalized recommendations for you!"
            
            return self.create_notification(
                user_id=user_id,
                notification_type='ai_insight',
                title=title,
                message=message,
                action_url=f'/analytics/ai-insights',
                metadata=insight_data
            )
            
        except Exception as e:
            logger.error(f"Error creating AI insight notification: {str(e)}")
            return None
    
    def create_welcome_notification(self, user_id, user_data):
        """Create welcome notification for new users"""
        try:
            title = f"Welcome to EduMaster, {user_data.get('firstname', 'Student')}!"
            message = "Start your learning journey by uploading materials, creating quizzes, and scheduling study sessions."
            
            return self.create_notification(
                user_id=user_id,
                notification_type='welcome',
                title=title,
                message=message,
                action_url='/dashboard',
                expires_at=datetime.now() + timedelta(days=7),
                metadata={'is_new_user': True}
            )
            
        except Exception as e:
            logger.error(f"Error creating welcome notification: {str(e)}")
            return None
    
    def get_user_notifications(self, user_id, limit=50, unread_only=False, include_expired=False):
        """Get notifications for a user"""
        try:
            # Convert user_id to ObjectId if needed
            try:
                user_object_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
            except:
                user_object_id = user_id
            
            # Build query
            query = {'user_id': {'$in': [user_id, user_object_id]}}
            
            if unread_only:
                query['read'] = False
            
            if not include_expired:
                query['$or'] = [
                    {'expires_at': None},
                    {'expires_at': {'$gt': datetime.now().isoformat()}}
                ]
            
            # Get notifications
            notifications = notifications_collection.find(query).sort('created_at', -1).limit(limit)
            
            notification_list = []
            for notification in notifications:
                notification_data = {
                    'id': str(notification['_id']),
                    'type': notification.get('type'),
                    'title': notification.get('title'),
                    'message': notification.get('message'),
                    'icon': notification.get('icon'),
                    'color': notification.get('color'),
                    'priority': notification.get('priority'),
                    'action_url': notification.get('action_url'),
                    'read': notification.get('read', False),
                    'clicked': notification.get('clicked', False),
                    'created_at': notification.get('created_at'),
                    'expires_at': notification.get('expires_at'),
                    'metadata': notification.get('metadata', {})
                }
                notification_list.append(notification_data)
            
            return notification_list
            
        except Exception as e:
            logger.error(f"Error getting user notifications: {str(e)}")
            return []
    
    def mark_as_read(self, notification_ids, user_id=None):
        """Mark notifications as read"""
        try:
            # Convert string IDs to ObjectIds
            object_ids = []
            for nid in notification_ids:
                try:
                    object_ids.append(ObjectId(nid))
                except:
                    continue
            
            if not object_ids:
                return False
            
            # Build query
            query = {'_id': {'$in': object_ids}}
            if user_id:
                try:
                    user_object_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
                    query['user_id'] = {'$in': [user_id, user_object_id]}
                except:
                    pass
            
            # Update notifications
            result = notifications_collection.update_many(
                query,
                {'$set': {'read': True, 'read_at': datetime.now().isoformat()}}
            )
            
            logger.info(f"Marked {result.modified_count} notifications as read")
            return result.modified_count > 0
            
        except Exception as e:
            logger.error(f"Error marking notifications as read: {str(e)}")
            return False
    
    def mark_as_clicked(self, notification_id, user_id=None):
        """Mark notification as clicked"""
        try:
            # Convert string ID to ObjectId
            try:
                object_id = ObjectId(notification_id)
            except:
                return False
            
            # Build query
            query = {'_id': object_id}
            if user_id:
                try:
                    user_object_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
                    query['user_id'] = {'$in': [user_id, user_object_id]}
                except:
                    pass
            
            # Update notification
            result = notifications_collection.update_one(
                query,
                {'$set': {
                    'clicked': True, 
                    'clicked_at': datetime.now().isoformat(),
                    'read': True,  # Also mark as read when clicked
                    'read_at': datetime.now().isoformat()
                }}
            )
            
            logger.info(f"Marked notification {notification_id} as clicked")
            return result.modified_count > 0
            
        except Exception as e:
            logger.error(f"Error marking notification as clicked: {str(e)}")
            return False
    
    def delete_notification(self, notification_id, user_id=None):
        """Delete a notification"""
        try:
            # Convert string ID to ObjectId
            try:
                object_id = ObjectId(notification_id)
            except:
                return False
            
            # Build query
            query = {'_id': object_id}
            if user_id:
                try:
                    user_object_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
                    query['user_id'] = {'$in': [user_id, user_object_id]}
                except:
                    pass
            
            # Delete notification
            result = notifications_collection.delete_one(query)
            
            logger.info(f"Deleted notification {notification_id}")
            return result.deleted_count > 0
            
        except Exception as e:
            logger.error(f"Error deleting notification: {str(e)}")
            return False
    
    def cleanup_expired_notifications(self):
        """Remove expired notifications"""
        try:
            current_time = datetime.now().isoformat()
            
            result = notifications_collection.delete_many({
                'expires_at': {'$lt': current_time}
            })
            
            if result.deleted_count > 0:
                logger.info(f"Cleaned up {result.deleted_count} expired notifications")
            
            return result.deleted_count
            
        except Exception as e:
            logger.error(f"Error cleaning up expired notifications: {str(e)}")
            return 0

# Global notification manager instance
in_app_notification_manager = InAppNotificationManager()

def register_in_app_notification_routes(app):
    """Register in-app notification routes with the Flask app"""
    
    @app.route('/notifications/in-app/<user_id>', methods=['GET'])
    def get_in_app_notifications(user_id):
        """Get in-app notifications for a user"""
        try:
            limit = int(request.args.get('limit', 50))
            unread_only = request.args.get('unread_only', 'false').lower() == 'true'
            include_expired = request.args.get('include_expired', 'false').lower() == 'true'
            
            notifications = in_app_notification_manager.get_user_notifications(
                user_id=user_id,
                limit=limit,
                unread_only=unread_only,
                include_expired=include_expired
            )
            
            # Get counts
            all_notifications = in_app_notification_manager.get_user_notifications(user_id, limit=1000)
            unread_count = len([n for n in all_notifications if not n['read']])
            total_count = len(all_notifications)
            
            return jsonify({
                'status': 'success',
                'notifications': notifications,
                'counts': {
                    'unread': unread_count,
                    'total': total_count
                },
                'pagination': {
                    'limit': limit,
                    'returned': len(notifications)
                }
            })
            
        except Exception as e:
            logger.error(f"Error getting in-app notifications: {str(e)}")
            return jsonify({'error': 'Error retrieving notifications'}), 500
    
    @app.route('/notifications/in-app/<user_id>/mark-read', methods=['POST'])
    def mark_notifications_read(user_id):
        """Mark notifications as read"""
        try:
            data = request.json
            if not data or 'notification_ids' not in data:
                return jsonify({'error': 'notification_ids are required'}), 400
            
            notification_ids = data['notification_ids']
            if not isinstance(notification_ids, list):
                notification_ids = [notification_ids]
            
            success = in_app_notification_manager.mark_as_read(notification_ids, user_id)
            
            if success:
                return jsonify({
                    'status': 'success',
                    'message': 'Notifications marked as read'
                })
            else:
                return jsonify({'error': 'Failed to mark notifications as read'}), 400
                
        except Exception as e:
            logger.error(f"Error marking notifications as read: {str(e)}")
            return jsonify({'error': 'Error marking notifications as read'}), 500
    
    @app.route('/notifications/in-app/<user_id>/mark-all-read', methods=['POST'])
    def mark_all_notifications_read(user_id):
        """Mark all notifications as read for a user"""
        try:
            # Get all unread notification IDs
            unread_notifications = in_app_notification_manager.get_user_notifications(
                user_id=user_id, 
                unread_only=True, 
                limit=1000
            )
            
            notification_ids = [n['id'] for n in unread_notifications]
            
            if notification_ids:
                success = in_app_notification_manager.mark_as_read(notification_ids, user_id)
                
                if success:
                    return jsonify({
                        'status': 'success',
                        'message': f'Marked {len(notification_ids)} notifications as read'
                    })
                else:
                    return jsonify({'error': 'Failed to mark notifications as read'}), 400
            else:
                return jsonify({
                    'status': 'success',
                    'message': 'No unread notifications to mark'
                })
                
        except Exception as e:
            logger.error(f"Error marking all notifications as read: {str(e)}")
            return jsonify({'error': 'Error marking all notifications as read'}), 500
    
    @app.route('/notifications/in-app/<user_id>/click/<notification_id>', methods=['POST'])
    def click_notification(user_id, notification_id):
        """Mark notification as clicked and return action URL"""
        try:
            success = in_app_notification_manager.mark_as_clicked(notification_id, user_id)
            
            if success:
                # Get the notification to return action URL
                try:
                    object_id = ObjectId(notification_id)
                    notification = notifications_collection.find_one({'_id': object_id})
                    
                    return jsonify({
                        'status': 'success',
                        'message': 'Notification clicked',
                        'action_url': notification.get('action_url') if notification else None
                    })
                except:
                    return jsonify({
                        'status': 'success',
                        'message': 'Notification clicked'
                    })
            else:
                return jsonify({'error': 'Failed to mark notification as clicked'}), 400
                
        except Exception as e:
            logger.error(f"Error clicking notification: {str(e)}")
            return jsonify({'error': 'Error clicking notification'}), 500
    
    @app.route('/notifications/in-app/<user_id>/delete/<notification_id>', methods=['DELETE'])
    def delete_notification(user_id, notification_id):
        """Delete a notification"""
        try:
            success = in_app_notification_manager.delete_notification(notification_id, user_id)
            
            if success:
                return jsonify({
                    'status': 'success',
                    'message': 'Notification deleted'
                })
            else:
                return jsonify({'error': 'Failed to delete notification'}), 400
                
        except Exception as e:
            logger.error(f"Error deleting notification: {str(e)}")
            return jsonify({'error': 'Error deleting notification'}), 500
    
    @app.route('/notifications/in-app/<user_id>/create', methods=['POST'])
    def create_notification(user_id):
        """Create a new notification (for testing or admin use)"""
        try:
            data = request.json
            if not data:
                return jsonify({'error': 'Notification data required'}), 400
            
            required_fields = ['type', 'title', 'message']
            if not all(field in data for field in required_fields):
                return jsonify({'error': f'Required fields: {", ".join(required_fields)}'}), 400
            
            expires_at = None
            if data.get('expires_in_hours'):
                expires_at = datetime.now() + timedelta(hours=data['expires_in_hours'])
            
            notification_id = in_app_notification_manager.create_notification(
                user_id=user_id,
                notification_type=data['type'],
                title=data['title'],
                message=data['message'],
                action_url=data.get('action_url'),
                related_id=data.get('related_id'),
                expires_at=expires_at,
                metadata=data.get('metadata')
            )
            
            if notification_id:
                return jsonify({
                    'status': 'success',
                    'message': 'Notification created',
                    'notification_id': notification_id
                })
            else:
                return jsonify({'error': 'Failed to create notification'}), 500
                
        except Exception as e:
            logger.error(f"Error creating notification: {str(e)}")
            return jsonify({'error': 'Error creating notification'}), 500
    
    @app.route('/notifications/in-app/<user_id>/test-all', methods=['POST'])
    def create_test_notifications(user_id):
        """Create test notifications of all types"""
        try:
            test_notifications = []
            
            # Assignment reminder - Realistic assignment
            assignment_id = in_app_notification_manager.create_notification(
                user_id=user_id,
                notification_type='assignment_reminder',
                title='📝 Calculus Problem Set 4 - 3 Days Left',
                message='Mathematics: Due in 3 days. Complete derivatives and integration exercises.',
                action_url='/assignments/calc-ps4',
                metadata={'assignment_title': 'Calculus Problem Set 4', 'course_name': 'Mathematics', 'due_date': '2024-01-15'}
            )
            test_notifications.append({'type': 'assignment_reminder', 'id': assignment_id})
            
            # Session reminder - Realistic study session
            session_id = in_app_notification_manager.create_notification(
                user_id=user_id,
                notification_type='session_reminder',
                title='⏰ Physics Lab - Starts in 30 Min',
                message='Laboratory session starting now. Get your materials ready!',
                action_url='/schedule',
                metadata={'session_subject': 'Physics Lab', 'session_time': '14:00', 'type': 'Laboratory'}
            )
            test_notifications.append({'type': 'session_reminder', 'id': session_id})
            
            # Achievement - Study milestone
            achievement_id = in_app_notification_manager.create_achievement_notification(
                user_id=user_id,
                achievement_type='study_milestone',
                achievement_data={'hours': 25, 'week': 'this week'}
            )
            test_notifications.append({'type': 'achievement', 'id': achievement_id})
            
            # AI Insight - Study pattern analysis
            ai_id = in_app_notification_manager.create_ai_insight_notification(
                user_id=user_id,
                insight_data={
                    'type': 'study_pattern',
                    'confidence': 'high',
                    'insights_count': 4,
                    'top_insights': ['Your most productive study time is between 9-11 AM']
                }
            )
            test_notifications.append({'type': 'ai_insight', 'id': ai_id})
            
            # Due soon - Urgent assignment
            due_soon_id = in_app_notification_manager.create_notification(
                user_id=user_id,
                notification_type='assignment_due_soon',
                title='🚨 History Research Paper - Due Soon!',
                message='World History: Due in less than 2 hours! Submit before midnight.',
                action_url='/assignments/history-paper',
                metadata={'assignment_title': 'History Research Paper', 'course_name': 'World History', 'hours_until_due': 1.5}
            )
            
            # Quiz streak achievement
            quiz_streak_id = in_app_notification_manager.create_achievement_notification(
                user_id=user_id,
                achievement_type='quiz_streak',
                achievement_data={'count': 7}
            )
            test_notifications.append({'type': 'quiz_streak', 'id': quiz_streak_id})
            
            # Perfect score achievement
            perfect_score_id = in_app_notification_manager.create_achievement_notification(
                user_id=user_id,
                achievement_type='perfect_score',
                achievement_data={'quiz_title': 'Chemistry Bonds Quiz'}
            )
            test_notifications.append({'type': 'perfect_score', 'id': perfect_score_id})
            
            # Schedule optimization insight
            schedule_ai_id = in_app_notification_manager.create_ai_insight_notification(
                user_id=user_id,
                insight_data={
                    'type': 'schedule_optimization',
                    'confidence': 'medium',
                    'optimization_tips': ['Consider shorter study sessions for better retention']
                }
            )
            test_notifications.append({'type': 'schedule_ai', 'id': schedule_ai_id})
            
            # Quiz reminder
            quiz_id = in_app_notification_manager.create_notification(
                user_id=user_id,
                notification_type='quiz_reminder',
                title='🧠 Biology Quiz Available - Chapter 6',
                message='Test your knowledge on cellular respiration and photosynthesis.',
                action_url='/quiz/biology-ch6',
                metadata={'quiz_title': 'Biology Chapter 6 Quiz', 'subject': 'Biology', 'chapter': '6'}
            )
            test_notifications.append({'type': 'quiz_reminder', 'id': quiz_id})
            
            # Study streak notification
            streak_id = in_app_notification_manager.create_notification(
                user_id=user_id,
                notification_type='study_streak',
                title='🔥 5-Day Study Streak!',
                message='Keep it up! You\'ve studied consistently for 5 days straight.',
                action_url='/dashboard',
                metadata={'streak_days': 5, 'subject': 'All subjects'}
            )
            test_notifications.append({'type': 'study_streak', 'id': streak_id})
            
            # Welcome message for new users
            welcome_id = in_app_notification_manager.create_welcome_notification(
                user_id=user_id,
                user_data={'firstname': 'Student'}
            )
            test_notifications.append({'type': 'welcome', 'id': welcome_id})
            
            test_notifications.append({'type': 'assignment_due_soon', 'id': due_soon_id})
            test_notifications.append({'type': 'assignment_due_soon', 'id': due_soon_id})
            
            return jsonify({
                'status': 'success',
                'message': f'Created {len(test_notifications)} test notifications',
                'notifications': test_notifications
            })
            
        except Exception as e:
            logger.error(f"Error creating test notifications: {str(e)}")
            return jsonify({'error': 'Error creating test notifications'}), 500
    
    @app.route('/notifications/in-app/cleanup-expired', methods=['POST'])
    def cleanup_expired():
        """Clean up expired notifications"""
        try:
            deleted_count = in_app_notification_manager.cleanup_expired_notifications()
            
            return jsonify({
                'status': 'success',
                'message': f'Cleaned up {deleted_count} expired notifications',
                'deleted_count': deleted_count
            })
            
        except Exception as e:
            logger.error(f"Error cleaning up notifications: {str(e)}")
            return jsonify({'error': 'Error cleaning up notifications'}), 500
    
    logger.info("In-app notification routes registered successfully")
    return True
