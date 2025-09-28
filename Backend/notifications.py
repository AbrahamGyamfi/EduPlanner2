"""
Notification system module for EduMaster application.
This module handles email notifications, reminders, and notification preferences.
"""

import os
import smtplib
import threading
import logging
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from flask import request, jsonify
from apscheduler.schedulers.background import BackgroundScheduler
import atexit

from database import (
    users_collection, assignments_collection, scheduled_activities_collection, 
    notifications_collection
)
from utils import validate_input, log_user_action

logger = logging.getLogger(__name__)

class NotificationManager:
    """Manages email notifications and reminders"""
    
    def __init__(self):
        self.scheduler = None
        self._initialize_email_config()
        self._setup_scheduler()
    
    def _initialize_email_config(self):
        """Initialize email configuration from environment variables"""
        self.smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', 587))
        self.smtp_username = os.getenv('SMTP_USERNAME')
        self.smtp_password = os.getenv('SMTP_PASSWORD')
        self.sender_email = os.getenv('SENDER_EMAIL')
        
        # Check if email is properly configured
        self.email_configured = all([
            self.smtp_server, self.smtp_port, self.smtp_username, 
            self.smtp_password, self.sender_email
        ])
        
        if not self.email_configured:
            logger.warning("Email configuration incomplete. Email notifications disabled.")
        else:
            logger.info("Email configuration loaded successfully")
    
    def _setup_scheduler(self):
        """Setup background scheduler for reminder emails"""
        try:
            self.scheduler = BackgroundScheduler()
            self.scheduler.start()
            
            # Schedule reminder emails to run every 10 minutes for better accuracy
            # This ensures 30-minute session reminders are sent at the right time
            self.scheduler.add_job(
                func=self.send_reminder_emails,
                trigger="interval",
                minutes=10,
                id='reminder_emails'
            )
            
            # Shutdown scheduler when application exits
            atexit.register(lambda: self.scheduler.shutdown() if self.scheduler else None)
            
            logger.info("Notification scheduler started successfully (running every 10 minutes)")
            
        except Exception as e:
            logger.error(f"Failed to setup notification scheduler: {e}")
    
    def send_email_async(self, subject, body, recipient_email, attachment=None):
        """Send email asynchronously in a separate thread with optional attachment"""
        if not self.email_configured:
            logger.error("Email configuration incomplete. Cannot send email.")
            return False

        def send():
            try:
                msg = MIMEMultipart()
                msg['From'] = self.sender_email
                msg['To'] = recipient_email
                msg['Subject'] = subject
                msg.attach(MIMEText(body, 'html'))
                
                # Add attachment if provided
                if attachment:
                    attachment_part = MIMEBase('application', 'octet-stream')
                    attachment_part.set_payload(attachment['content'])
                    encoders.encode_base64(attachment_part)
                    attachment_part.add_header(
                        'Content-Disposition',
                        f'attachment; filename= {attachment["filename"]}'
                    )
                    msg.attach(attachment_part)

                with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                    server.starttls()
                    server.login(self.smtp_username, self.smtp_password)
                    server.sendmail(self.sender_email, recipient_email, msg.as_string())
                
                logger.info(f"Email sent successfully to {recipient_email}" + 
                          (f" with attachment {attachment['filename']}" if attachment else ""))
                return True
                
            except Exception as e:
                logger.error(f"Failed to send email to {recipient_email}: {e}")
                return False

        # Run in a separate thread to avoid blocking
        email_thread = threading.Thread(target=send)
        email_thread.start()
        return True
    
    def send_reminder_emails(self):
        """Send reminder emails for upcoming assignments and activities"""
        try:
            logger.info("Checking for upcoming assignments and activities to send reminders...")
            
            current_time = datetime.now()
            
            # Send 2-day deadline reminders for assignments
            self._send_assignment_deadline_reminders_2days(current_time)
            
            # Send 30-minute session reminders
            self._send_session_reminders_30min(current_time)
            
            # Legacy reminder intervals for backward compatibility
            reminder_intervals = [
                (24, "tomorrow"),    # 24 hours
                (6, "in 6 hours"),   # 6 hours
                (1, "in 1 hour")     # 1 hour
            ]
            
            for hours_ahead, time_description in reminder_intervals:
                reminder_time = current_time + timedelta(hours=hours_ahead)
                
                # Send assignment reminders (legacy)
                self._send_assignment_reminders(current_time, reminder_time, hours_ahead, time_description)
                
                # Send activity reminders
                self._send_activity_reminders(current_time, reminder_time, hours_ahead, time_description)
                
        except Exception as e:
            logger.error(f"Error in reminder email function: {e}")
    
    def _send_assignment_reminders(self, current_time, reminder_time, hours_ahead, time_description):
        """Send reminders for upcoming assignments"""
        try:
            # Check assignments due in the specified time window
            upcoming_assignments = assignments_collection.find({
                "dueDate": {"$lte": reminder_time.isoformat(), "$gte": current_time.isoformat()},
                "status": {"$in": ["pending", "in-progress"]}
            })
            
            for assignment in upcoming_assignments:
                try:
                    user = users_collection.find_one({"_id": assignment.get('userId')})
                    if not user or not user.get('email'):
                        continue
                    
                    # Check notification preferences
                    preferences = user.get('notification_preferences', {})
                    if not preferences.get('email_enabled', True) or not preferences.get('assignment_reminders', True):
                        continue
                    
                    # Check if we've already sent a reminder for this assignment at this interval
                    notification_key = f"assignment_{assignment['_id']}_{hours_ahead}h"
                    
                    existing_notification = notifications_collection.find_one({
                        "notification_key": notification_key,
                        "sent_at": {"$gte": (current_time - timedelta(hours=1)).isoformat()}
                    })
                    
                    if existing_notification:
                        continue
                    
                    subject = f"Reminder: Assignment Due {time_description} - {assignment.get('title')}"
                    body = self._create_assignment_reminder_email(user, assignment, time_description)
                    
                    if self.send_email_async(subject, body, user['email']):
                        # Log the notification
                        notifications_collection.insert_one({
                            "notification_key": notification_key,
                            "user_id": user['_id'],
                            "assignment_id": assignment['_id'],
                            "type": "assignment_reminder",
                            "hours_ahead": hours_ahead,
                            "sent_at": current_time.isoformat(),
                            "email": user['email']
                        })
                        
                except Exception as e:
                    logger.error(f"Error sending assignment reminder: {e}")
                    
        except Exception as e:
            logger.error(f"Error in assignment reminders: {e}")
    
    def _send_activity_reminders(self, current_time, reminder_time, hours_ahead, time_description):
        """Send reminders for upcoming activities"""
        try:
            # Check scheduled activities in the specified time window
            upcoming_activities = scheduled_activities_collection.find({
                "activityDate": {"$lte": reminder_time.isoformat(), "$gte": current_time.isoformat()},
                "status": "scheduled"
            })
            
            for activity in upcoming_activities:
                try:
                    user = users_collection.find_one({"_id": activity.get('userId')})
                    if not user or not user.get('email'):
                        continue
                    
                    # Check notification preferences
                    preferences = user.get('notification_preferences', {})
                    if not preferences.get('email_enabled', True) or not preferences.get('activity_reminders', True):
                        continue
                    
                    # Check if we've already sent a reminder for this activity at this interval
                    notification_key = f"activity_{activity['_id']}_{hours_ahead}h"
                    
                    existing_notification = notifications_collection.find_one({
                        "notification_key": notification_key,
                        "sent_at": {"$gte": (current_time - timedelta(hours=1)).isoformat()}
                    })
                    
                    if existing_notification:
                        continue
                    
                    subject = f"Reminder: Activity {time_description} - {activity.get('title')}"
                    body = self._create_activity_reminder_email(user, activity, time_description)
                    
                    if self.send_email_async(subject, body, user['email']):
                        # Log the notification
                        notifications_collection.insert_one({
                            "notification_key": notification_key,
                            "user_id": user['_id'],
                            "activity_id": activity['_id'],
                            "type": "activity_reminder",
                            "hours_ahead": hours_ahead,
                            "sent_at": current_time.isoformat(),
                            "email": user['email']
                        })
                        
                except Exception as e:
                    logger.error(f"Error sending activity reminder: {e}")
                    
        except Exception as e:
            logger.error(f"Error in activity reminders: {e}")
    
    def send_assignment_creation_notification(self, user_id, assignment_data):
        """Send immediate notification when a new assignment is created"""
        try:
            from bson import ObjectId
            
            # Get user data
            try:
                user_object_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
                user = users_collection.find_one({"_id": user_object_id})
            except:
                user = users_collection.find_one({"_id": user_id})
                
            if not user or not user.get('email'):
                logger.warning(f"User not found or no email for assignment creation notification: {user_id}")
                return False
            
            # Check notification preferences
            preferences = user.get('notification_preferences', {})
            if not preferences.get('email_enabled', True) or not preferences.get('assignment_creation_notifications', True):
                logger.info(f"Assignment creation notifications disabled for user: {user_id}")
                return False
            
            # Check if we've already sent a creation notification for this assignment
            notification_key = f"assignment_creation_{assignment_data.get('_id', 'new')}"
            
            existing_notification = notifications_collection.find_one({
                "notification_key": notification_key,
                "sent_at": {"$gte": (datetime.now() - timedelta(minutes=10)).isoformat()}
            })
            
            if existing_notification:
                logger.info(f"Assignment creation notification already sent: {notification_key}")
                return False
            
            subject = f"New Assignment Created - {assignment_data.get('title')}"
            body = self._create_assignment_creation_email(user, assignment_data)
            
            if self.send_email_async(subject, body, user['email']):
                # Log the notification
                notifications_collection.insert_one({
                    "notification_key": notification_key,
                    "user_id": user['_id'],
                    "assignment_id": assignment_data.get('_id'),
                    "type": "assignment_creation",
                    "sent_at": datetime.now().isoformat(),
                    "email": user['email']
                })
                
                logger.info(f"Assignment creation notification sent to {user['email']}")
                return True
            else:
                logger.error(f"Failed to send assignment creation notification to {user['email']}")
                return False
                
        except Exception as e:
            logger.error(f"Error sending assignment creation notification: {e}")
            return False
    
    def _send_assignment_deadline_reminders_2days(self, current_time):
        """Send reminders for assignments due within 2 days or less"""
        try:
            from bson import ObjectId
            from datetime import timezone
            
            # Calculate 2 days from now
            two_days_from_now = current_time + timedelta(days=2)
            
            # Find assignments due within the next 2 days that are not completed
            upcoming_assignments = assignments_collection.find({
                "dueDate": {
                    "$lte": two_days_from_now.isoformat(),
                    "$gte": current_time.isoformat()
                },
                "status": {"$in": ["pending", "in-progress"]}
            })
            
            for assignment in upcoming_assignments:
                try:
                    user = users_collection.find_one({"_id": assignment.get('userId')})
                    if not user or not user.get('email'):
                        continue
                    
                    # Check notification preferences
                    preferences = user.get('notification_preferences', {})
                    if not preferences.get('email_enabled', True) or not preferences.get('assignment_deadline_reminders_2days', True):
                        continue
                    
                    # Calculate hours until due date
                    try:
                        due_date = datetime.fromisoformat(assignment.get('dueDate').replace('Z', '+00:00'))
                        hours_until_due = (due_date - current_time).total_seconds() / 3600
                    except:
                        # If due date parsing fails, skip this assignment
                        logger.warning(f"Could not parse due date for assignment {assignment.get('_id')}: {assignment.get('dueDate')}")
                        continue
                    
                    # Only send if within 48 hours (2 days)
                    if hours_until_due > 48:
                        continue
                    
                    # Determine time description based on hours remaining
                    if hours_until_due <= 1:
                        time_description = "in less than 1 hour"
                        interval_key = "1h"
                    elif hours_until_due <= 6:
                        time_description = f"in about {int(hours_until_due)} hours"
                        interval_key = "6h"
                    elif hours_until_due <= 24:
                        time_description = "within 24 hours"
                        interval_key = "24h"
                    else:
                        time_description = f"in about {int(hours_until_due/24)} days"
                        interval_key = "2days"
                    
                    # Check if we've already sent a 2-day reminder for this assignment
                    notification_key = f"assignment_2day_{assignment['_id']}_{interval_key}"
                    
                    existing_notification = notifications_collection.find_one({
                        "notification_key": notification_key,
                        "sent_at": {"$gte": (current_time - timedelta(hours=12)).isoformat()}
                    })
                    
                    if existing_notification:
                        continue
                    
                    subject = f"⚠️ Assignment Due Soon - {assignment.get('title')}"
                    body = self._create_assignment_deadline_2day_email(user, assignment, time_description, hours_until_due)
                    
                    if self.send_email_async(subject, body, user['email']):
                        # Log the notification
                        notifications_collection.insert_one({
                            "notification_key": notification_key,
                            "user_id": user['_id'],
                            "assignment_id": assignment['_id'],
                            "type": "assignment_deadline_2day",
                            "hours_until_due": hours_until_due,
                            "sent_at": current_time.isoformat(),
                            "email": user['email']
                        })
                        
                        logger.info(f"2-day assignment deadline reminder sent to {user['email']} for assignment {assignment.get('title')}")
                        
                except Exception as e:
                    logger.error(f"Error sending 2-day assignment deadline reminder: {e}")
                    
        except Exception as e:
            logger.error(f"Error in 2-day assignment deadline reminders: {e}")
    
    def _send_session_reminders_30min(self, current_time):
        """Send reminders 30 minutes before scheduled timetable sessions"""
        try:
            from database import schedules_collection
            from bson import ObjectId
            
            # Calculate 30 minutes from now
            thirty_min_from_now = current_time + timedelta(minutes=30)
            
            # Get all active schedules
            active_schedules = schedules_collection.find({"is_active": {"$ne": False}})
            
            for schedule_doc in active_schedules:
                try:
                    user_id = schedule_doc.get('userId')
                    schedule_sessions = schedule_doc.get('schedule', [])
                    
                    # Get user data
                    try:
                        user_object_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
                        user = users_collection.find_one({"_id": user_object_id})
                    except:
                        user = users_collection.find_one({"_id": user_id})
                        
                    if not user or not user.get('email'):
                        continue
                    
                    # Check notification preferences
                    preferences = user.get('notification_preferences', {})
                    if not preferences.get('email_enabled', True) or not preferences.get('session_reminders_30min', True):
                        continue
                    
                    # Check each session in the schedule
                    for session in schedule_sessions:
                        try:
                            # Get session details
                            session_day = session.get('day', '').lower()
                            session_time = session.get('time', '')
                            session_subject = session.get('subject', 'Study Session')
                            
                            if not session_time or not session_day:
                                continue
                            
                            # Parse session time (assuming format like "09:00-11:00" or "09:00")
                            if '-' in session_time:
                                start_time_str = session_time.split('-')[0].strip()
                            else:
                                start_time_str = session_time.strip()
                            
                            # Get today's day name
                            current_day = current_time.strftime('%A').lower()
                            
                            # Only process if the session is today
                            if session_day != current_day:
                                continue
                            
                            # Parse the session start time
                            try:
                                hour, minute = map(int, start_time_str.split(':'))
                                session_datetime = current_time.replace(hour=hour, minute=minute, second=0, microsecond=0)
                            except ValueError:
                                logger.warning(f"Could not parse session time: {start_time_str}")
                                continue
                            
                            # Check if the session starts in approximately 30 minutes (±5 minutes)
                            time_diff_minutes = (session_datetime - current_time).total_seconds() / 60
                            
                            # Send reminder if session starts in 25-35 minutes
                            if not (25 <= time_diff_minutes <= 35):
                                continue
                            
                            # Create unique notification key
                            session_id = session.get('id', f"{session_day}_{start_time_str}_{session_subject}")
                            notification_key = f"session_30min_{user_id}_{session_id}_{current_time.strftime('%Y%m%d')}"
                            
                            # Check if we've already sent a reminder for this session today
                            existing_notification = notifications_collection.find_one({
                                "notification_key": notification_key,
                                "sent_at": {"$gte": (current_time - timedelta(hours=1)).isoformat()}
                            })
                            
                            if existing_notification:
                                continue
                            
                            subject = f"📚 Study Session Starting Soon - {session_subject}"
                            body = self._create_session_reminder_30min_email(user, session, int(time_diff_minutes))
                            
                            if self.send_email_async(subject, body, user['email']):
                                # Log the notification
                                notifications_collection.insert_one({
                                    "notification_key": notification_key,
                                    "user_id": user['_id'],
                                    "session_id": session_id,
                                    "type": "session_reminder_30min",
                                    "minutes_ahead": int(time_diff_minutes),
                                    "sent_at": current_time.isoformat(),
                                    "email": user['email']
                                })
                                
                                logger.info(f"30-minute session reminder sent to {user['email']} for session {session_subject}")
                            
                        except Exception as e:
                            logger.error(f"Error processing session reminder for session {session}: {e}")
                            
                except Exception as e:
                    logger.error(f"Error processing schedule for user {schedule_doc.get('userId')}: {e}")
                    
        except Exception as e:
            logger.error(f"Error in 30-minute session reminders: {e}")
    
    def _create_assignment_creation_email(self, user, assignment):
        """Create HTML email content for assignment creation notifications"""
        return f"""<html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }}
                .content {{ background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }}
                .assignment-card {{ background: white; border-left: 4px solid #28a745; padding: 15px; margin: 15px 0; border-radius: 4px; }}
                .due-date {{ color: #e74c3c; font-weight: bold; }}
                .btn {{ display: inline-block; background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 15px; }}
                .footer {{ margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }}
                .success-badge {{ background: #d4edda; color: #155724; padding: 5px 10px; border-radius: 4px; font-size: 12px; font-weight: bold; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>✅ Assignment Created Successfully</h1>
                </div>
                <div class="content">
                    <p>Hello {user.get('firstname', 'Student')},</p>
                    <p>Great news! You've successfully created a new assignment:</p>
                    
                    <div class="assignment-card">
                        <div class="success-badge">NEW ASSIGNMENT</div>
                        <h3>📝 {assignment.get('title')}</h3>
                        <p><strong>Course:</strong> {assignment.get('courseName', 'General')}</p>
                        <p><strong>Due Date:</strong> <span class="due-date">{assignment.get('dueDate')}</span></p>
                        <p><strong>Status:</strong> {assignment.get('status', 'pending').title()}</p>
                        <p><strong>Priority:</strong> {assignment.get('priority', 'medium').title()}</p>
                        {('<p><strong>Description:</strong> ' + assignment.get('description') + '</p>') if assignment.get('description') else ''}
                        {('<p><strong>Estimated Hours:</strong> ' + str(assignment.get('estimatedHours', 0)) + ' hours</p>') if assignment.get('estimatedHours', 0) > 0 else ''}
                    </div>
                    
                    <p>Your assignment has been added to your dashboard. Don't forget to work on it before the due date! 🎯</p>
                    
                    <p><strong>What's next?</strong></p>
                    <ul>
                        <li>Review your assignment details</li>
                        <li>Break down the work into smaller tasks</li>
                        <li>Set up reminders and study sessions</li>
                        <li>Track your progress as you work</li>
                    </ul>
                    
                    <a href="http://localhost:3000/assignments" class="btn">View Assignment</a>
                    
                    <div class="footer">
                        <p>This is an automated notification from EduMaster. You can manage your notification preferences in your account settings.</p>
                    </div>
                </div>
            </div>
        </body>
        </html>"""
    
    def _create_assignment_reminder_email(self, user, assignment, time_description):
        """Create HTML email content for assignment reminders"""
        return f"""<html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }}
                .content {{ background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }}
                .assignment-card {{ background: white; border-left: 4px solid #667eea; padding: 15px; margin: 15px 0; border-radius: 4px; }}
                .due-date {{ color: #e74c3c; font-weight: bold; }}
                .btn {{ display: inline-block; background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 15px; }}
                .footer {{ margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📚 Assignment Reminder</h1>
                </div>
                <div class="content">
                    <p>Hello {user.get('firstname', 'Student')},</p>
                    <p>This is a friendly reminder that you have an assignment due <strong>{time_description}</strong>:</p>
                    
                    <div class="assignment-card">
                        <h3>📝 {assignment.get('title')}</h3>
                        <p><strong>Course:</strong> {assignment.get('courseName', 'General')}</p>
                        <p><strong>Due Date:</strong> <span class="due-date">{assignment.get('dueDate')}</span></p>
                        <p><strong>Status:</strong> {assignment.get('status', 'pending').title()}</p>
                        {('<p><strong>Description:</strong> ' + assignment.get('description') + '</p>') if assignment.get('description') else ''}
                    </div>
                    
                    <p>Don't forget to submit your work on time! 🎯</p>
                    
                    <a href="http://localhost:3000/assignments" class="btn">View Assignment</a>
                    
                    <div class="footer">
                        <p>This is an automated reminder from EduMaster. You can manage your notification preferences in your account settings.</p>
                    </div>
                </div>
            </div>
        </body>
        </html>"""
    
    def _create_activity_reminder_email(self, user, activity, time_description):
        """Create HTML email content for activity reminders"""
        return f"""<html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }}
                .content {{ background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }}
                .activity-card {{ background: white; border-left: 4px solid #667eea; padding: 15px; margin: 15px 0; border-radius: 4px; }}
                .btn {{ display: inline-block; background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 15px; }}
                .footer {{ margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📅 Activity Reminder</h1>
                </div>
                <div class="content">
                    <p>Hello {user.get('firstname', 'Student')},</p>
                    <p>This is a friendly reminder that you have a scheduled activity {time_description}:</p>
                    
                    <div class="activity-card">
                        <h3>📋 {activity.get('title')}</h3>
                        <p><strong>Date:</strong> {activity.get('activityDate')}</p>
                        {('<p><strong>Time:</strong> ' + activity.get('activityTime') + '</p>') if activity.get('activityTime') else ''}
                        {('<p><strong>Location:</strong> ' + activity.get('location') + '</p>') if activity.get('location') else ''}
                        {('<p><strong>Description:</strong> ' + activity.get('description') + '</p>') if activity.get('description') else ''}
                    </div>
                    
                    <p>Make sure you're prepared! 🎯</p>
                    
                    <a href="http://localhost:3000/schedule" class="btn">View Schedule</a>
                    
                    <div class="footer">
                        <p>This is an automated reminder from EduMaster. You can manage your notification preferences in your account settings.</p>
                    </div>
                </div>
            </div>
        </body>
        </html>"""
    
    def _create_assignment_deadline_2day_email(self, user, assignment, time_description, hours_until_due):
        """Create HTML email content for 2-day assignment deadline reminders"""
        urgency_color = "#e74c3c" if hours_until_due <= 24 else "#f39c12"
        urgency_text = "URGENT" if hours_until_due <= 6 else "ATTENTION" if hours_until_due <= 24 else "REMINDER"
        
        return f"""<html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, {urgency_color} 0%, #c0392b 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }}
                .content {{ background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }}
                .assignment-card {{ background: white; border-left: 4px solid {urgency_color}; padding: 15px; margin: 15px 0; border-radius: 4px; }}
                .due-date {{ color: {urgency_color}; font-weight: bold; font-size: 16px; }}
                .urgency-badge {{ background: {urgency_color}; color: white; padding: 5px 10px; border-radius: 4px; font-size: 12px; font-weight: bold; }}
                .btn {{ display: inline-block; background: {urgency_color}; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 15px; }}
                .footer {{ margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }}
                .progress-tip {{ background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 4px; margin: 10px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>⚠️ Assignment Deadline Alert</h1>
                </div>
                <div class="content">
                    <p>Hello {user.get('firstname', 'Student')},</p>
                    <p>This is an important reminder about an upcoming assignment deadline:</p>
                    
                    <div class="assignment-card">
                        <div class="urgency-badge">{urgency_text}</div>
                        <h3>📝 {assignment.get('title')}</h3>
                        <p><strong>Course:</strong> {assignment.get('courseName', 'General')}</p>
                        <p><strong>Due Date:</strong> <span class="due-date">{assignment.get('dueDate')}</span></p>
                        <p><strong>Time Remaining:</strong> <span class="due-date">{time_description}</span></p>
                        <p><strong>Current Status:</strong> {assignment.get('status', 'pending').title()}</p>
                        <p><strong>Priority:</strong> {assignment.get('priority', 'medium').title()}</p>
                        {('<p><strong>Description:</strong> ' + assignment.get('description') + '</p>') if assignment.get('description') else ''}
                    </div>
                    
                    <div class="progress-tip">
                        <strong>💡 Quick Action Tips:</strong>
                        <ul>
                            <li>Review the assignment requirements immediately</li>
                            <li>Break the work into smaller, manageable tasks</li>
                            <li>Set aside dedicated time to work on this assignment</li>
                            <li>Reach out for help if you're struggling with any part</li>
                        </ul>
                    </div>
                    
                    <p>Don't let this deadline sneak up on you! Take action now to stay on track. 🎯</p>
                    
                    <a href="http://localhost:3000/assignments" class="btn">Work on Assignment Now</a>
                    
                    <div class="footer">
                        <p>This is an automated deadline reminder from EduMaster. You can manage your notification preferences in your account settings.</p>
                    </div>
                </div>
            </div>
        </body>
        </html>"""
    
    def _create_session_reminder_30min_email(self, user, session, minutes_until_session):
        """Create HTML email content for 30-minute session reminders"""
        return f"""<html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #3498db 0%, #2980b9 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }}
                .content {{ background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }}
                .session-card {{ background: white; border-left: 4px solid #3498db; padding: 15px; margin: 15px 0; border-radius: 4px; }}
                .time-badge {{ background: #3498db; color: white; padding: 5px 10px; border-radius: 4px; font-size: 12px; font-weight: bold; }}
                .btn {{ display: inline-block; background: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 15px; }}
                .footer {{ margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }}
                .prep-checklist {{ background: #d5f4e6; border: 1px solid #27ae60; padding: 10px; border-radius: 4px; margin: 10px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📚 Study Session Starting Soon</h1>
                </div>
                <div class="content">
                    <p>Hello {user.get('firstname', 'Student')},</p>
                    <p>Your scheduled study session is starting in approximately <strong>{minutes_until_session} minutes</strong>!</p>
                    
                    <div class="session-card">
                        <div class="time-badge">STARTING IN {minutes_until_session} MINUTES</div>
                        <h3>📖 {session.get('subject', 'Study Session')}</h3>
                        <p><strong>Day:</strong> {session.get('day', '').title()}</p>
                        <p><strong>Time:</strong> {session.get('time', 'Not specified')}</p>
                        {('<p><strong>Type:</strong> ' + session.get('type', 'Study') + '</p>') if session.get('type') else ''}
                        {('<p><strong>Location:</strong> ' + session.get('location') + '</p>') if session.get('location') else ''}
                        {('<p><strong>Notes:</strong> ' + session.get('notes') + '</p>') if session.get('notes') else ''}
                    </div>
                    
                    <div class="prep-checklist">
                        <strong>🎯 Get Ready:</strong>
                        <ul>
                            <li>Gather your study materials and notes</li>
                            <li>Find a quiet, distraction-free environment</li>
                            <li>Have water and healthy snacks ready</li>
                            <li>Turn off notifications on your devices</li>
                            <li>Review your learning objectives</li>
                        </ul>
                    </div>
                    
                    <p>Make the most of your dedicated study time. You've got this! 💪</p>
                    
                    <a href="http://localhost:3000/schedule" class="btn">View Full Schedule</a>
                    
                    <div class="footer">
                        <p>This is an automated session reminder from EduMaster. You can manage your notification preferences in your account settings.</p>
                    </div>
                </div>
            </div>
        </body>
        </html>"""
    
    def send_schedule_pdf_email(self, user_id, schedule_data, pdf_bytes, send_type='saved'):
        """Send schedule PDF as email attachment"""
        try:
            from bson import ObjectId
            
            # Get user data
            try:
                user_object_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
                user = users_collection.find_one({"_id": user_object_id})
            except:
                user = users_collection.find_one({"_id": user_id})
                
            if not user or not user.get('email'):
                logger.warning(f"User not found or no email for schedule PDF: {user_id}")
                return False
            
            # Get user's name for personalization
            user_name = user.get('firstname', 'Student')
            
            # Create filename with timestamp
            from datetime import datetime
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"EduMaster_Schedule_{user_name}_{timestamp}.pdf"
            
            # Create subject based on send type
            if send_type == 'saved':
                subject = "📅 Your Study Schedule Has Been Saved - PDF Attached"
                action_text = "saved and is ready for you to use"
            else:
                subject = "📄 Your Study Schedule Export - PDF Attached"
                action_text = "exported as requested"
            
            # Create email body
            body = self._create_schedule_pdf_email(user, schedule_data, action_text)
            
            # Prepare attachment
            attachment = {
                'content': pdf_bytes,
                'filename': filename
            }
            
            # Send email with PDF attachment
            if self.send_email_async(subject, body, user['email'], attachment=attachment):
                logger.info(f"Schedule PDF email sent to {user['email']}")
                return True
            else:
                logger.error(f"Failed to send schedule PDF email to {user['email']}")
                return False
                
        except Exception as e:
            logger.error(f"Error sending schedule PDF email: {e}")
            return False
    
    def _create_schedule_pdf_email(self, user, schedule_data, action_text):
        """Create HTML email content for schedule PDF notifications"""
        # Extract schedule information for the email
        schedule_stats = schedule_data.get('statistics', {})
        total_sessions = schedule_stats.get('total_sessions', 0)
        total_hours = schedule_stats.get('total_hours', 0)
        subjects = schedule_data.get('subjects', [])
        
        subjects_list = ", ".join(subjects) if subjects else "Various subjects"
        
        return f"""<html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }}
                .content {{ background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }}
                .schedule-card {{ background: white; border-left: 4px solid #6a11cb; padding: 15px; margin: 15px 0; border-radius: 4px; }}
                .stats-row {{ display: flex; justify-content: space-between; margin: 10px 0; }}
                .stat-item {{ background: #e8f4fd; padding: 10px; border-radius: 4px; text-align: center; flex: 1; margin: 0 5px; }}
                .stat-number {{ font-size: 20px; font-weight: bold; color: #2575fc; }}
                .stat-label {{ font-size: 12px; color: #666; }}
                .pdf-badge {{ background: #dc3545; color: white; padding: 5px 10px; border-radius: 4px; font-size: 12px; font-weight: bold; }}
                .btn {{ display: inline-block; background: #6a11cb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 15px; }}
                .footer {{ margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }}
                .features-list {{ background: #e8f5e8; border: 1px solid #27ae60; padding: 15px; border-radius: 4px; margin: 15px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📅 Your Study Schedule is Ready!</h1>
                </div>
                <div class="content">
                    <p>Hello {user.get('firstname', 'Student')},</p>
                    <p>Great news! Your personalized study schedule has been {action_text}. You'll find your beautifully formatted schedule attached as a PDF.</p>
                    
                    <div class="schedule-card">
                        <div class="pdf-badge">📄 PDF ATTACHED</div>
                        <h3>📚 Your Study Schedule Summary</h3>
                        
                        <div class="stats-row">
                            <div class="stat-item">
                                <div class="stat-number">{total_sessions}</div>
                                <div class="stat-label">Study Sessions</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-number">{total_hours}</div>
                                <div class="stat-label">Total Hours</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-number">{len(subjects)}</div>
                                <div class="stat-label">Subjects</div>
                            </div>
                        </div>
                        
                        <p><strong>Subjects Covered:</strong> {subjects_list}</p>
                        <p><strong>Schedule Type:</strong> {schedule_data.get('schedule_type', 'Custom').title()} Schedule</p>
                    </div>
                    
                    <div class="features-list">
                        <strong>📋 What's included in your PDF:</strong>
                        <ul>
                            <li>Complete weekly schedule with all study sessions</li>
                            <li>Detailed session information including subjects and times</li>
                            <li>Schedule statistics and study hours breakdown</li>
                            <li>Your personalized study preferences</li>
                            <li>Helpful study tips and recommendations</li>
                            <li>Professional formatting for printing or digital use</li>
                        </ul>
                    </div>
                    
                    <p><strong>Next steps:</strong></p>
                    <ul>
                        <li>📥 Download and save your schedule PDF</li>
                        <li>🖨️ Print it out for easy reference</li>
                        <li>📱 Set reminders for your study sessions</li>
                        <li>📊 Track your progress as you follow the schedule</li>
                    </ul>
                    
                    <p>Stick to your schedule, and you'll see amazing progress in your studies! 🎯</p>
                    
                    <a href="http://localhost:3000/schedule" class="btn">View Schedule Online</a>
                    
                    <div class="footer">
                        <p>This email was sent because you requested your study schedule. The attached PDF contains your personalized study plan generated by EduMaster.</p>
                        <p>Questions? Contact us or visit your dashboard for more scheduling options.</p>
                    </div>
                </div>
            </div>
        </body>
        </html>"""

# Global notification manager instance
notification_manager = NotificationManager()

def register_notification_routes(app):
    """Register notification routes with the Flask app"""
    
    @app.route('/notifications/preferences/<user_id>', methods=['GET'])
    def get_notification_preferences(user_id):
        """Get user's notification preferences"""
        try:
            from bson import ObjectId
            
            try:
                user_object_id = ObjectId(user_id)
            except:
                return jsonify({'error': 'Invalid user ID format'}), 400
            
            user = users_collection.find_one({"_id": user_object_id})
            if not user:
                return jsonify({'error': 'User not found'}), 404
                
            # Get user's notification preferences (default to enabled if not set)
            preferences = user.get('notification_preferences', {
                'email_enabled': True,
                'assignment_reminders': True,
                'activity_reminders': True,
                'assignment_creation_notifications': True,
                'assignment_deadline_reminders_2days': True,
                'session_reminders_30min': True,
                'reminder_intervals': [24, 6, 1],  # hours before due date (legacy)
                'daily_digest': False
            })
            
            return jsonify({
                'status': 'success',
                'preferences': preferences
            })
            
        except Exception as e:
            logger.error(f"Error getting notification preferences: {str(e)}")
            return jsonify({'error': 'Error retrieving notification preferences'}), 500

    @app.route('/notifications/preferences/<user_id>', methods=['PUT'])
    def update_notification_preferences(user_id):
        """Update user's notification preferences"""
        try:
            from bson import ObjectId
            
            data = request.json
            if not data:
                return jsonify({'error': 'No data provided'}), 400
            
            try:
                user_object_id = ObjectId(user_id)
            except:
                return jsonify({'error': 'Invalid user ID format'}), 400
                
            # Update user's notification preferences
            update_data = {
                'notification_preferences': {
                    'email_enabled': data.get('email_enabled', True),
                    'assignment_reminders': data.get('assignment_reminders', True),
                    'activity_reminders': data.get('activity_reminders', True),
                    'assignment_creation_notifications': data.get('assignment_creation_notifications', True),
                    'assignment_deadline_reminders_2days': data.get('assignment_deadline_reminders_2days', True),
                    'session_reminders_30min': data.get('session_reminders_30min', True),
                    'reminder_intervals': data.get('reminder_intervals', [24, 6, 1]),
                    'daily_digest': data.get('daily_digest', False)
                }
            }
            
            result = users_collection.update_one(
                {"_id": user_object_id},
                {"$set": update_data}
            )
            
            if result.modified_count > 0:
                log_user_action(user_id, "notification_preferences_update", update_data['notification_preferences'])
                return jsonify({
                    'status': 'success',
                    'message': 'Notification preferences updated successfully'
                })
            else:
                return jsonify({'error': 'User not found or no changes made'}), 404
                
        except Exception as e:
            logger.error(f"Error updating notification preferences: {str(e)}")
            return jsonify({'error': 'Error updating notification preferences'}), 500

    @app.route('/notifications/test/<user_id>', methods=['POST'])
    def send_test_notification(user_id):
        """Send immediate test notification"""
        try:
            from bson import ObjectId
            
            try:
                user_object_id = ObjectId(user_id)
            except:
                return jsonify({'error': 'Invalid user ID format'}), 400
            
            user = users_collection.find_one({"_id": user_object_id})
            if not user or not user.get('email'):
                return jsonify({'error': 'User not found or no email address'}), 404
                
            subject = "Test Notification - EduMaster"
            body = f"""<html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }}
                    .content {{ background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }}
                    .test-card {{ background: white; border-left: 4px solid #28a745; padding: 15px; margin: 15px 0; border-radius: 4px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🧪 Test Notification</h1>
                    </div>
                    <div class="content">
                        <p>Hello {user.get('firstname', 'Student')},</p>
                        <p>This is a test notification to verify that your email notifications are working correctly.</p>
                        
                        <div class="test-card">
                            <h3>✅ Notification System Test</h3>
                            <p><strong>Time:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
                            <p><strong>Status:</strong> Working correctly</p>
                        </div>
                        
                        <p>If you received this email, your notification system is properly configured! 🎉</p>
                        
                        <p>You will now receive reminders for your upcoming assignments and activities.</p>
                    </div>
                </div>
            </body>
            </html>"""
            
            if notification_manager.send_email_async(subject, body, user['email']):
                return jsonify({
                    'status': 'success',
                    'message': 'Test notification sent successfully'
                })
            else:
                return jsonify({'error': 'Failed to send test notification'}), 500
            
        except Exception as e:
            logger.error(f"Error sending test notification: {str(e)}")
            return jsonify({'error': 'Error sending test notification'}), 500

    @app.route('/notifications/history/<user_id>', methods=['GET'])
    def get_notification_history(user_id):
        """Get notification history for a user"""
        try:
            from bson import ObjectId
            
            try:
                user_object_id = ObjectId(user_id)
            except:
                user_object_id = user_id
            
            # Get recent notifications for the user
            limit = int(request.args.get('limit', 50))
            notifications = notifications_collection.find({
                "user_id": {"$in": [user_id, user_object_id]}
            }).sort("sent_at", -1).limit(limit)
            
            notification_list = []
            for notification in notifications:
                notification_data = {
                    'id': str(notification['_id']),
                    'type': notification.get('type'),
                    'sent_at': notification.get('sent_at'),
                    'hours_ahead': notification.get('hours_ahead'),
                    'email': notification.get('email'),
                    'assignment_id': str(notification['assignment_id']) if notification.get('assignment_id') else None,
                    'activity_id': str(notification['activity_id']) if notification.get('activity_id') else None
                }
                notification_list.append(notification_data)
            
            return jsonify({
                'status': 'success',
                'notifications': notification_list,
                'total': len(notification_list)
            })
            
        except Exception as e:
            logger.error(f"Error getting notification history: {str(e)}")
            return jsonify({'error': 'Error retrieving notification history'}), 500

    @app.route('/notifications/send-reminders', methods=['POST'])
    def manual_send_reminders():
        """Manual trigger for sending reminders (for testing)"""
        try:
            # This endpoint allows manual triggering of the reminder system
            notification_manager.send_reminder_emails()
            return jsonify({
                'status': 'success',
                'message': 'Reminder emails sent successfully'
            })
        except Exception as e:
            logger.error(f"Error in manual reminder sending: {str(e)}")
            return jsonify({'error': 'Error sending reminders'}), 500

    @app.route('/notifications/welcome', methods=['POST'])
    def send_welcome_notification():
        """Send welcome email to new user"""
        try:
            data = request.json
            if not data or 'user_id' not in data:
                return jsonify({'error': 'User ID required'}), 400
            
            from bson import ObjectId
            
            try:
                user_object_id = ObjectId(data['user_id'])
            except:
                return jsonify({'error': 'Invalid user ID format'}), 400
            
            user = users_collection.find_one({"_id": user_object_id})
            if not user or not user.get('email'):
                return jsonify({'error': 'User not found or no email address'}), 404
            
            subject = "Welcome to EduMaster - Your Learning Journey Begins!"
            body = f"""<html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }}
                    .content {{ background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }}
                    .welcome-card {{ background: white; border-left: 4px solid #28a745; padding: 15px; margin: 15px 0; border-radius: 4px; }}
                    .btn {{ display: inline-block; background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 15px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎓 Welcome to EduMaster!</h1>
                    </div>
                    <div class="content">
                        <p>Hello {user.get('firstname', 'Student')},</p>
                        <p>Welcome to EduMaster! We're excited to help you on your learning journey.</p>
                        
                        <div class="welcome-card">
                            <h3>🚀 Getting Started</h3>
                            <ul>
                                <li>Upload your study materials and generate summaries</li>
                                <li>Create personalized quizzes to test your knowledge</li>
                                <li>Schedule study sessions and track your progress</li>
                                <li>Manage assignments and get timely reminders</li>
                            </ul>
                        </div>
                        
                        <p>Start exploring EduMaster and make the most of your study time!</p>
                        
                        <a href="http://localhost:3000/dashboard" class="btn">Go to Dashboard</a>
                    </div>
                </div>
            </body>
            </html>"""
            
            if notification_manager.send_email_async(subject, body, user['email']):
                log_user_action(data['user_id'], "welcome_email_sent", {"email": user['email']})
                return jsonify({
                    'status': 'success',
                    'message': 'Welcome notification sent successfully'
                })
            else:
                return jsonify({'error': 'Failed to send welcome notification'}), 500
            
        except Exception as e:
            logger.error(f"Error sending welcome notification: {str(e)}")
            return jsonify({'error': 'Error sending welcome notification'}), 500

    @app.route('/notifications/test/assignment-creation/<user_id>', methods=['POST'])
    def test_assignment_creation_notification(user_id):
        """Test assignment creation notification"""
        try:
            from bson import ObjectId
            
            # Create a mock assignment for testing
            test_assignment = {
                '_id': ObjectId(),
                'title': 'Test Assignment - Created Now',
                'courseName': 'Test Course',
                'dueDate': (datetime.now() + timedelta(days=7)).isoformat(),
                'status': 'pending',
                'priority': 'high',
                'description': 'This is a test assignment created for notification testing.',
                'estimatedHours': 5
            }
            
            success = notification_manager.send_assignment_creation_notification(user_id, test_assignment)
            
            if success:
                return jsonify({
                    'status': 'success',
                    'message': 'Assignment creation test notification sent successfully',
                    'test_assignment_id': str(test_assignment['_id'])
                })
            else:
                return jsonify({'error': 'Failed to send assignment creation test notification'}), 500
                
        except Exception as e:
            logger.error(f"Error sending assignment creation test notification: {str(e)}")
            return jsonify({'error': 'Error sending assignment creation test notification'}), 500
    
    @app.route('/notifications/test/deadline-reminder/<user_id>', methods=['POST'])
    def test_deadline_reminder_notification(user_id):
        """Test 2-day deadline reminder notification"""
        try:
            from bson import ObjectId
            
            # Get user
            try:
                user_object_id = ObjectId(user_id)
                user = users_collection.find_one({"_id": user_object_id})
            except:
                user = users_collection.find_one({"_id": user_id})
            
            if not user or not user.get('email'):
                return jsonify({'error': 'User not found or no email address'}), 404
            
            # Create a mock assignment due soon for testing
            test_assignment = {
                '_id': ObjectId(),
                'title': 'Urgent Test Assignment - Due Soon',
                'courseName': 'Critical Test Course',
                'dueDate': (datetime.now() + timedelta(hours=18)).isoformat(),
                'status': 'pending',
                'priority': 'high',
                'description': 'This is a test assignment with an approaching deadline.'
            }
            
            # Send deadline reminder directly
            subject = f"⚠️ Assignment Due Soon - {test_assignment.get('title')}"
            body = notification_manager._create_assignment_deadline_2day_email(
                user, test_assignment, "in about 18 hours", 18
            )
            
            if notification_manager.send_email_async(subject, body, user['email']):
                return jsonify({
                    'status': 'success',
                    'message': 'Deadline reminder test notification sent successfully',
                    'test_assignment_id': str(test_assignment['_id'])
                })
            else:
                return jsonify({'error': 'Failed to send deadline reminder test notification'}), 500
                
        except Exception as e:
            logger.error(f"Error sending deadline reminder test notification: {str(e)}")
            return jsonify({'error': 'Error sending deadline reminder test notification'}), 500
    
    @app.route('/notifications/test/session-reminder/<user_id>', methods=['POST'])
    def test_session_reminder_notification(user_id):
        """Test 30-minute session reminder notification"""
        try:
            from bson import ObjectId
            
            # Get user
            try:
                user_object_id = ObjectId(user_id)
                user = users_collection.find_one({"_id": user_object_id})
            except:
                user = users_collection.find_one({"_id": user_id})
            
            if not user or not user.get('email'):
                return jsonify({'error': 'User not found or no email address'}), 404
            
            # Create a mock session starting soon for testing
            test_session = {
                'subject': 'Test Study Session - Mathematics',
                'day': datetime.now().strftime('%A').lower(),
                'time': (datetime.now() + timedelta(minutes=30)).strftime('%H:%M') + '-' + (datetime.now() + timedelta(minutes=90)).strftime('%H:%M'),
                'type': 'Study',
                'location': 'Study Room A',
                'notes': 'Focus on calculus and differential equations'
            }
            
            # Send session reminder directly
            subject = f"📚 Study Session Starting Soon - {test_session.get('subject')}"
            body = notification_manager._create_session_reminder_30min_email(
                user, test_session, 30
            )
            
            if notification_manager.send_email_async(subject, body, user['email']):
                return jsonify({
                    'status': 'success',
                    'message': 'Session reminder test notification sent successfully',
                    'test_session': test_session
                })
            else:
                return jsonify({'error': 'Failed to send session reminder test notification'}), 500
                
        except Exception as e:
            logger.error(f"Error sending session reminder test notification: {str(e)}")
            return jsonify({'error': 'Error sending session reminder test notification'}), 500
    
    @app.route('/notifications/test/all-types/<user_id>', methods=['POST'])
    def test_all_notification_types(user_id):
        """Test all notification types at once"""
        try:
            results = []
            
            # Test assignment creation
            try:
                from bson import ObjectId
                test_assignment = {
                    '_id': ObjectId(),
                    'title': 'Complete Test Assignment Battery',
                    'courseName': 'Notification Testing 101',
                    'dueDate': (datetime.now() + timedelta(days=5)).isoformat(),
                    'status': 'pending',
                    'priority': 'medium',
                    'description': 'Testing all notification types in EduMaster.',
                    'estimatedHours': 3
                }
                
                success = notification_manager.send_assignment_creation_notification(user_id, test_assignment)
                results.append({
                    'type': 'assignment_creation',
                    'success': success,
                    'message': 'Assignment creation notification sent' if success else 'Failed to send assignment creation notification'
                })
                
                # Small delay between notifications
                import time
                time.sleep(2)
            except Exception as e:
                results.append({
                    'type': 'assignment_creation',
                    'success': False,
                    'message': f'Error: {str(e)}'
                })
            
            # Test deadline reminder
            try:
                user_object_id = ObjectId(user_id)
                user = users_collection.find_one({"_id": user_object_id})
                
                if user and user.get('email'):
                    test_assignment = {
                        '_id': ObjectId(),
                        'title': 'Critical Deadline Test Assignment',
                        'courseName': 'Urgency Management',
                        'dueDate': (datetime.now() + timedelta(hours=12)).isoformat(),
                        'status': 'in-progress',
                        'priority': 'high',
                        'description': 'This assignment has a critical deadline approaching.'
                    }
                    
                    subject = f"⚠️ Assignment Due Soon - {test_assignment.get('title')}"
                    body = notification_manager._create_assignment_deadline_2day_email(
                        user, test_assignment, "in about 12 hours", 12
                    )
                    
                    success = notification_manager.send_email_async(subject, body, user['email'])
                    results.append({
                        'type': 'deadline_reminder',
                        'success': success,
                        'message': 'Deadline reminder notification sent' if success else 'Failed to send deadline reminder notification'
                    })
                    
                    time.sleep(2)
                else:
                    results.append({
                        'type': 'deadline_reminder',
                        'success': False,
                        'message': 'User not found or no email address'
                    })
            except Exception as e:
                results.append({
                    'type': 'deadline_reminder',
                    'success': False,
                    'message': f'Error: {str(e)}'
                })
            
            # Test session reminder
            try:
                if user and user.get('email'):
                    test_session = {
                        'subject': 'Comprehensive Review Session',
                        'day': datetime.now().strftime('%A').lower(),
                        'time': (datetime.now() + timedelta(minutes=30)).strftime('%H:%M') + '-' + (datetime.now() + timedelta(minutes=120)).strftime('%H:%M'),
                        'type': 'Intensive Study',
                        'location': 'Virtual Study Room',
                        'notes': 'Final review before major exam'
                    }
                    
                    subject = f"📚 Study Session Starting Soon - {test_session.get('subject')}"
                    body = notification_manager._create_session_reminder_30min_email(
                        user, test_session, 30
                    )
                    
                    success = notification_manager.send_email_async(subject, body, user['email'])
                    results.append({
                        'type': 'session_reminder',
                        'success': success,
                        'message': 'Session reminder notification sent' if success else 'Failed to send session reminder notification'
                    })
                else:
                    results.append({
                        'type': 'session_reminder',
                        'success': False,
                        'message': 'User not found or no email address'
                    })
            except Exception as e:
                results.append({
                    'type': 'session_reminder',
                    'success': False,
                    'message': f'Error: {str(e)}'
                })
            
            overall_success = all(result['success'] for result in results)
            
            return jsonify({
                'status': 'success' if overall_success else 'partial_success',
                'message': 'All notification tests completed',
                'results': results,
                'total_tests': len(results),
                'successful_tests': sum(1 for result in results if result['success'])
            })
            
        except Exception as e:
            logger.error(f"Error in comprehensive notification testing: {str(e)}")
            return jsonify({'error': 'Error in comprehensive notification testing'}), 500
    
    logger.info("Notification routes registered successfully")
