"""
Enhanced Scheduler for EduMaster notifications.
This module provides more frequent checking for 30-minute reminders and better scheduling.
"""

import logging
from datetime import datetime, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
import atexit

logger = logging.getLogger(__name__)

class EnhancedNotificationScheduler:
    """Enhanced scheduler for more precise notification timing"""
    
    def __init__(self, notification_manager):
        self.notification_manager = notification_manager
        self.scheduler = None
        self._setup_scheduler()
    
    def _setup_scheduler(self):
        """Setup enhanced background scheduler"""
        try:
            self.scheduler = BackgroundScheduler()
            
            # Check for 30-minute reminders every 5 minutes for better accuracy
            self.scheduler.add_job(
                func=self._check_30min_reminders,
                trigger=IntervalTrigger(minutes=5),
                id='session_reminders_5min',
                name='30-minute session and activity reminders',
                max_instances=1,
                misfire_grace_time=60
            )
            
            # Keep the original 10-minute general reminder check
            self.scheduler.add_job(
                func=self.notification_manager.send_reminder_emails,
                trigger=IntervalTrigger(minutes=10),
                id='general_reminders_10min',
                name='General reminder emails',
                max_instances=1,
                misfire_grace_time=120
            )
            
            # Daily cleanup of expired notifications at 2 AM
            self.scheduler.add_job(
                func=self._cleanup_expired_notifications,
                trigger='cron',
                hour=2,
                minute=0,
                id='cleanup_expired',
                name='Cleanup expired notifications',
                misfire_grace_time=3600
            )
            
            # Weekly analytics and notification insights (Sunday at 1 AM)
            self.scheduler.add_job(
                func=self._generate_weekly_insights,
                trigger='cron',
                day_of_week='sun',
                hour=1,
                minute=0,
                id='weekly_insights',
                name='Generate weekly notification insights',
                misfire_grace_time=7200
            )
            
            self.scheduler.start()
            
            # Shutdown scheduler when application exits
            atexit.register(self._shutdown_scheduler)
            
            logger.info("Enhanced notification scheduler started successfully")
            logger.info("- 30-minute reminders: every 5 minutes")
            logger.info("- General reminders: every 10 minutes")
            logger.info("- Cleanup expired: daily at 2 AM")
            logger.info("- Weekly insights: Sunday at 1 AM")
            
        except Exception as e:
            logger.error(f"Failed to setup enhanced notification scheduler: {e}")
    
    def _check_30min_reminders(self):
        """Check and send 30-minute reminders with higher frequency"""
        try:
            current_time = datetime.now()
            logger.debug(f"Checking for 30-minute reminders at {current_time}")
            
            # Send session reminders (both schedule and activities)
            self.notification_manager._send_session_reminders_30min(current_time)
            
            # Also check for any assignments due very soon (within 2 hours)
            self._check_urgent_assignment_reminders(current_time)
            
        except Exception as e:
            logger.error(f"Error in 30-minute reminder check: {e}")
    
    def _check_urgent_assignment_reminders(self, current_time):
        """Check for assignments due very soon and send urgent reminders"""
        try:
            from database import assignments_collection, users_collection
            from bson import ObjectId
            
            # Find assignments due within the next 2 hours
            two_hours_from_now = current_time + timedelta(hours=2)
            
            urgent_assignments = assignments_collection.find({
                "dueDate": {
                    "$lte": two_hours_from_now.isoformat(),
                    "$gte": current_time.isoformat()
                },
                "status": {"$in": ["pending", "in-progress"]}
            })
            
            for assignment in urgent_assignments:
                try:
                    user_id = assignment.get('userId')
                    
                    # Get user data
                    try:
                        user_object_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
                        user = users_collection.find_one({"_id": user_object_id})
                    except:
                        user = users_collection.find_one({"_id": user_id})
                    
                    if not user:
                        continue
                    
                    # Calculate hours until due
                    try:
                        due_date = datetime.fromisoformat(assignment.get('dueDate').replace('Z', ''))
                        hours_until_due = (due_date - current_time).total_seconds() / 3600
                    except:
                        continue
                    
                    # Only send if it's very urgent (within 1 hour) and we haven't sent recently
                    if hours_until_due <= 1:
                        from database import notifications_collection
                        
                        notification_key = f"urgent_assignment_{assignment['_id']}_{current_time.strftime('%Y%m%d%H')}"
                        
                        # Check if we already sent an urgent reminder this hour
                        existing = notifications_collection.find_one({
                            "notification_key": notification_key
                        })
                        
                        if not existing:
                            # Send in-app notification for urgent assignment
                            try:
                                from in_app_notifications import in_app_notification_manager
                                
                                in_app_notification_manager.create_assignment_reminder(
                                    user_id=user_id,
                                    assignment_id=str(assignment['_id']),
                                    assignment_data=assignment,
                                    hours_until_due=hours_until_due
                                )
                                
                                # Log the urgent notification
                                notifications_collection.insert_one({
                                    "notification_key": notification_key,
                                    "user_id": user['_id'],
                                    "assignment_id": assignment['_id'],
                                    "type": "urgent_assignment_reminder",
                                    "hours_until_due": hours_until_due,
                                    "sent_at": current_time.isoformat()
                                })
                                
                                logger.info(f"Urgent assignment reminder sent to user {user_id} for assignment {assignment.get('title')}")
                                
                            except Exception as e:
                                logger.warning(f"Could not send urgent assignment in-app notification: {e}")
                    
                except Exception as e:
                    logger.error(f"Error processing urgent assignment {assignment.get('_id')}: {e}")
                    
        except Exception as e:
            logger.error(f"Error checking urgent assignment reminders: {e}")
    
    def _cleanup_expired_notifications(self):
        """Clean up expired notifications"""
        try:
            from in_app_notifications import in_app_notification_manager
            deleted_count = in_app_notification_manager.cleanup_expired_notifications()
            
            if deleted_count > 0:
                logger.info(f"Daily cleanup: removed {deleted_count} expired notifications")
            
            # Also clean up old email notification logs (older than 30 days)
            from database import notifications_collection
            thirty_days_ago = datetime.now() - timedelta(days=30)
            
            result = notifications_collection.delete_many({
                "sent_at": {"$lt": thirty_days_ago.isoformat()},
                "type": {"$in": ["assignment_reminder", "activity_reminder", "session_reminder_30min"]}
            })
            
            if result.deleted_count > 0:
                logger.info(f"Daily cleanup: removed {result.deleted_count} old notification logs")
                
        except Exception as e:
            logger.error(f"Error in daily cleanup: {e}")
    
    def _generate_weekly_insights(self):
        """Generate weekly notification insights"""
        try:
            from database import notifications_collection
            from datetime import datetime, timedelta
            
            # Get last week's notification stats
            last_week = datetime.now() - timedelta(days=7)
            
            # Count notifications sent last week
            weekly_stats = notifications_collection.aggregate([
                {
                    "$match": {
                        "sent_at": {"$gte": last_week.isoformat()}
                    }
                },
                {
                    "$group": {
                        "_id": "$type",
                        "count": {"$sum": 1},
                        "email_sent": {"$sum": {"$cond": ["$email_sent", 1, 0]}},
                        "in_app_sent": {"$sum": {"$cond": ["$in_app_sent", 1, 0]}}
                    }
                }
            ])
            
            stats = list(weekly_stats)
            if stats:
                total_notifications = sum(stat['count'] for stat in stats)
                logger.info(f"Weekly notification summary: {total_notifications} total notifications sent")
                
                for stat in stats:
                    logger.info(f"  {stat['_id']}: {stat['count']} sent (email: {stat.get('email_sent', 0)}, in-app: {stat.get('in_app_sent', 0)})")
            
        except Exception as e:
            logger.error(f"Error generating weekly insights: {e}")
    
    def send_immediate_reminders(self):
        """Manually trigger immediate reminder check (for testing)"""
        try:
            logger.info("Manually triggering immediate reminder check")
            current_time = datetime.now()
            
            # Check 30-minute reminders
            self._check_30min_reminders()
            
            # Check general reminders
            self.notification_manager.send_reminder_emails()
            
            logger.info("Manual reminder check completed")
            return True
            
        except Exception as e:
            logger.error(f"Error in manual reminder check: {e}")
            return False
    
    def get_scheduler_status(self):
        """Get current scheduler status and job information"""
        try:
            if not self.scheduler:
                return {"status": "not_initialized"}
            
            jobs = []
            for job in self.scheduler.get_jobs():
                next_run = job.next_run_time.isoformat() if job.next_run_time else None
                jobs.append({
                    "id": job.id,
                    "name": job.name,
                    "next_run": next_run,
                    "trigger": str(job.trigger)
                })
            
            return {
                "status": "running" if self.scheduler.running else "stopped",
                "jobs": jobs,
                "state": str(self.scheduler.state)
            }
            
        except Exception as e:
            logger.error(f"Error getting scheduler status: {e}")
            return {"status": "error", "message": str(e)}
    
    def _shutdown_scheduler(self):
        """Shutdown the scheduler gracefully"""
        try:
            if self.scheduler and self.scheduler.running:
                self.scheduler.shutdown()
                logger.info("Enhanced notification scheduler shutdown completed")
        except Exception as e:
            logger.error(f"Error shutting down scheduler: {e}")

# Global enhanced scheduler instance (will be initialized when notification manager is created)
enhanced_scheduler = None

def initialize_enhanced_scheduler(notification_manager):
    """Initialize the enhanced scheduler with the notification manager"""
    global enhanced_scheduler
    try:
        enhanced_scheduler = EnhancedNotificationScheduler(notification_manager)
        logger.info("Enhanced notification scheduler initialized")
        return enhanced_scheduler
    except Exception as e:
        logger.error(f"Failed to initialize enhanced scheduler: {e}")
        return None
