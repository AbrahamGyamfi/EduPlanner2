"""
Authentication module for EduMaster application.
This module handles user registration, login, password validation, and rate limiting.
"""

import bcrypt
import logging
import secrets
import smtplib
import os
import random
import string
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify
from collections import defaultdict
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from database import users_collection
from utils import validate_input, validate_password, validate_email, get_client_ip, log_user_action

logger = logging.getLogger(__name__)

# Rate limiting storage
login_attempts = defaultdict(list)
RATE_LIMIT_WINDOW = 300  # 5 minutes in seconds
MAX_ATTEMPTS_PER_WINDOW = 5

# OTP Configuration
OTP_LENGTH = 6
OTP_EXPIRY_MINUTES = 10  # OTP expires in 10 minutes
MAX_OTP_ATTEMPTS = 3

def generate_otp():
    """Generate a random 6-digit OTP"""
    return ''.join(random.choices(string.digits, k=OTP_LENGTH))

def send_otp_email(email, otp, name="User"):
    """Send OTP via email"""
    try:
        smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        smtp_port = int(os.getenv('SMTP_PORT', '587'))
        smtp_username = os.getenv('SMTP_USERNAME')
        smtp_password = os.getenv('SMTP_PASSWORD')
        
        if not smtp_username or not smtp_password:
            logger.error("SMTP credentials not configured")
            return False
        
        # Create email content
        subject = "EduMaster - Your Verification Code"
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">EduMaster</h1>
                <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Your Smart Study Companion</p>
            </div>
            <div style="background: white; padding: 30px; border: 1px solid #e1e5e9; border-radius: 0 0 10px 10px;">
                <h2 style="color: #333; margin-top: 0;">Hi {name}!</h2>
                <p style="color: #555; font-size: 16px; line-height: 1.5;">Your verification code is:</p>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                    <span style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px;">{otp}</span>
                </div>
                <p style="color: #555; font-size: 14px; line-height: 1.5;">This code will expire in {OTP_EXPIRY_MINUTES} minutes. Please don't share this code with anyone.</p>
                <p style="color: #999; font-size: 12px; margin-top: 30px;">If you didn't request this code, please ignore this email.</p>
            </div>
        </body>
        </html>
        """
        
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = smtp_username
        msg['To'] = email
        
        # Add HTML part
        html_part = MIMEText(html_body, 'html')
        msg.attach(html_part)
        
        # Send email
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(smtp_username, smtp_password)
            server.send_message(msg)
        
        logger.info(f"OTP email sent successfully to {email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send OTP email to {email}: {str(e)}")
        return False

def cleanup_user_data(user_id, force_cleanup=False):
    """Clean up all user data to provide fresh start for new users
    
    Args:
        user_id: User ID to clean up data for
        force_cleanup: If True, clean up data regardless of user's last login date
    """
    try:
        from database import (
            files_collection, assignments_collection, notifications_collection,
            scheduled_activities_collection, schedules_collection, quizzes_collection,
            quiz_results_collection, summaries_collection, activities_collection,
            study_sessions_collection
        )
        from bson import ObjectId
        
        user_object_id = ObjectId(user_id)
        
        # Get user info to check if cleanup is needed
        user = users_collection.find_one({"_id": user_object_id})
        if not user:
            logger.warning(f"User {user_id} not found for cleanup")
            return False
        
        # Check if user is new (created within last 24 hours) or force cleanup is enabled
        from datetime import datetime, timedelta
        is_new_user = False
        
        if user.get('created_at'):
            user_age = datetime.now() - user['created_at']
            is_new_user = user_age < timedelta(hours=24)
        
        # Only clean up if user is new, has no previous login, or force cleanup is enabled
        should_cleanup = (force_cleanup or 
                         is_new_user or 
                         not user.get('last_login') or
                         user.get('cleanup_on_next_login', False))
        
        if not should_cleanup:
            logger.info(f"Skipping cleanup for existing user {user_id}")
            return True
        
        # Collections to clean up with detailed tracking
        collections_info = [
            (files_collection, "files"),
            (assignments_collection, "assignments"), 
            (notifications_collection, "notifications"),
            (scheduled_activities_collection, "scheduled_activities"),
            (schedules_collection, "schedules"),
            (quizzes_collection, "quizzes"),
            (quiz_results_collection, "quiz_results"),
            (summaries_collection, "summaries"),
            (activities_collection, "activities"),
            (study_sessions_collection, "study_sessions")
        ]
        
        total_deleted = 0
        cleanup_summary = {}
        
        for collection, name in collections_info:
            if collection:
                # Clean up using string user_id
                result1 = collection.delete_many({"user_id": user_id})
                # Clean up using ObjectId format
                result2 = collection.delete_many({"user_id": user_object_id})
                
                deleted_count = result1.deleted_count + result2.deleted_count
                total_deleted += deleted_count
                
                if deleted_count > 0:
                    cleanup_summary[name] = deleted_count
        
        # Clear any cleanup flag
        users_collection.update_one(
            {"_id": user_object_id},
            {"$unset": {"cleanup_on_next_login": ""}}
        )
        
        if total_deleted > 0:
            logger.info(f"Cleaned up {total_deleted} documents for user {user_id}: {cleanup_summary}")
        else:
            logger.info(f"No data to clean up for user {user_id}")
            
        return True
        
    except Exception as e:
        logger.error(f"Error cleaning up user data for {user_id}: {str(e)}")
        return False

def mark_user_for_cleanup(user_id):
    """Mark user for data cleanup on next login"""
    try:
        from bson import ObjectId
        user_object_id = ObjectId(user_id)
        
        users_collection.update_one(
            {"_id": user_object_id},
            {"$set": {"cleanup_on_next_login": True}}
        )
        logger.info(f"User {user_id} marked for cleanup on next login")
        return True
    except Exception as e:
        logger.error(f"Error marking user {user_id} for cleanup: {str(e)}")
        return False

def rate_limit(max_attempts=MAX_ATTEMPTS_PER_WINDOW, window=RATE_LIMIT_WINDOW):
    """
    Rate limiting decorator for endpoints.
    
    Args:
        max_attempts (int): Maximum number of attempts allowed
        window (int): Time window in seconds
    
    Returns:
        decorator function
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            client_ip = get_client_ip(request)
            current_time = datetime.now()
            
            # Clean old attempts
            login_attempts[client_ip] = [
                attempt_time for attempt_time in login_attempts[client_ip]
                if (current_time - attempt_time).total_seconds() < window
            ]
            
            # Check if rate limit exceeded
            if len(login_attempts[client_ip]) >= max_attempts:
                logger.warning(f"Rate limit exceeded for IP: {client_ip}")
                return jsonify({
                    "status": "error",
                    "message": "Too many login attempts. Please try again later."
                }), 429
            
            # Record this attempt
            login_attempts[client_ip].append(current_time)
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def register_auth_routes(app):
    """Register authentication routes with the Flask app"""
    
    @app.route("/signup", methods=["POST"])
    def signup():
        """User registration endpoint - First step: Send OTP"""
        try:
            data = request.json
            if not data:
                return jsonify({"error": "No data provided"}), 400
            
            # Validate required fields
            required_fields = ["firstname", "lastname", "studentId", "email", "password"]
            validation_errors = validate_input(data, required_fields)
            
            # Handle both 'name' field (from frontend) and separate firstname/lastname
            if 'name' in data and not data.get('firstname'):
                # Split full name into first and last
                name_parts = data['name'].strip().split()
                data['firstname'] = name_parts[0] if name_parts else ''
                data['lastname'] = ' '.join(name_parts[1:]) if len(name_parts) > 1 else ''
            
            if validation_errors:
                return jsonify({"error": "; ".join(validation_errors)}), 400
            
            firstname = data.get("firstname").strip()
            lastname = data.get("lastname").strip()
            studentId = data.get("studentId").strip()
            email = data.get("email").strip().lower()
            password = data.get("password")
            
            # Validate email format
            if not validate_email(email):
                return jsonify({"error": "Invalid email format"}), 400
            
            # Validate password strength
            is_valid, password_message = validate_password(password)
            if not is_valid:
                return jsonify({"error": password_message}), 400
            
            # Check if email already exists
            if users_collection.find_one({"email": email}):
                return jsonify({"error": "Email already exists"}), 400
            
            # Check if student ID already exists
            if users_collection.find_one({"studentId": studentId}):
                return jsonify({"error": "Student ID already exists"}), 400
            
            # Generate OTP
            otp = generate_otp()
            otp_expires = datetime.now() + timedelta(minutes=OTP_EXPIRY_MINUTES)
            
            # Hash password for temporary storage
            hashed_pw = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
            
            # Store pending registration data
            pending_user_data = {
                "firstname": firstname,
                "lastname": lastname,
                "studentId": studentId,
                "email": email,
                "password": hashed_pw,
                "otp": otp,
                "otp_expires": otp_expires,
                "otp_attempts": 0,
                "is_verified": False,
                "registration_pending": True,
                "created_at": datetime.now()
            }
            
            # Store or update pending registration
            users_collection.update_one(
                {"email": email},
                {"$set": pending_user_data},
                upsert=True
            )
            
            # Send OTP email
            if send_otp_email(email, otp, firstname):
                logger.info(f"OTP sent for registration: {email}")
                return jsonify({
                    "status": "success",
                    "message": "Verification code sent to your email",
                    "email": email,
                    "requires_otp": True,
                    "dev_otp": otp if os.getenv('FLASK_ENV') == 'development' else None
                }), 200
            else:
                # If email sending fails, still allow development testing
                logger.warning(f"Email sending failed for {email}, OTP: {otp}")
                return jsonify({
                    "status": "success",
                    "message": "Verification code sent to your email",
                    "email": email,
                    "requires_otp": True,
                    "dev_otp": otp if os.getenv('FLASK_ENV') == 'development' else None
                }), 200
            
        except Exception as e:
            logger.error(f"Signup error: {str(e)}")
            return jsonify({"error": "Internal server error"}), 500
    
    @app.route("/verify-signup-otp", methods=["POST"])
    def verify_signup_otp():
        """Verify OTP and complete user registration"""
        try:
            data = request.json
            if not data:
                return jsonify({"error": "No data provided"}), 400
            
            email = data.get("email", "").strip().lower()
            otp = data.get("otp", "").strip()
            
            if not email or not otp:
                return jsonify({"error": "Email and OTP are required"}), 400
            
            # Find pending registration
            user = users_collection.find_one({
                "email": email,
                "registration_pending": True
            })
            
            if not user:
                return jsonify({"error": "Invalid verification request"}), 400
            
            # Check if OTP has expired
            if datetime.now() > user.get("otp_expires", datetime.now()):
                return jsonify({"error": "Verification code has expired. Please request a new one."}), 400
            
            # Check OTP attempts
            if user.get("otp_attempts", 0) >= MAX_OTP_ATTEMPTS:
                return jsonify({"error": "Too many incorrect attempts. Please request a new verification code."}), 400
            
            # Verify OTP
            if user.get("otp") != otp:
                # Increment attempts
                users_collection.update_one(
                    {"_id": user["_id"]},
                    {"$inc": {"otp_attempts": 1}}
                )
                return jsonify({"error": "Invalid verification code. Please try again."}), 400
            
            # Complete registration
            users_collection.update_one(
                {"_id": user["_id"]},
                {
                    "$set": {
                        "is_verified": True,
                        "is_active": True,
                        "verified_at": datetime.now()
                    },
                    "$unset": {
                        "otp": "",
                        "otp_expires": "",
                        "otp_attempts": "",
                        "registration_pending": ""
                    }
                }
            )
            
            # Clean up any existing data for this user to ensure fresh start
            cleanup_user_data(str(user["_id"]))
            
            # Log successful registration
            log_user_action(str(user["_id"]), "user_registration_completed", {"email": email})
            logger.info(f"User registration completed successfully: {email}")
            
            return jsonify({
                "status": "success",
                "message": "Email verified successfully. You can now log in.",
                "user_id": str(user["_id"])
            }), 200
            
        except Exception as e:
            logger.error(f"OTP verification error: {str(e)}")
            return jsonify({"error": "Internal server error"}), 500
    
    @app.route("/resend-signup-otp", methods=["POST"])
    def resend_signup_otp():
        """Resend OTP for signup verification"""
        try:
            data = request.json
            if not data:
                return jsonify({"error": "No data provided"}), 400
            
            email = data.get("email", "").strip().lower()
            
            if not email:
                return jsonify({"error": "Email is required"}), 400
            
            # Find pending registration
            user = users_collection.find_one({
                "email": email,
                "registration_pending": True
            })
            
            if not user:
                return jsonify({"error": "No pending registration found for this email"}), 400
            
            # Generate new OTP
            otp = generate_otp()
            otp_expires = datetime.now() + timedelta(minutes=OTP_EXPIRY_MINUTES)
            
            # Update user with new OTP
            users_collection.update_one(
                {"_id": user["_id"]},
                {
                    "$set": {
                        "otp": otp,
                        "otp_expires": otp_expires,
                        "otp_attempts": 0
                    }
                }
            )
            
            # Send OTP email
            if send_otp_email(email, otp, user.get("firstname", "User")):
                logger.info(f"OTP resent for registration: {email}")
                return jsonify({
                    "status": "success",
                    "message": "New verification code sent to your email"
                }), 200
            else:
                # If email sending fails, still allow development testing
                logger.warning(f"Email sending failed for {email}, OTP: {otp}")
                return jsonify({
                    "status": "success",
                    "message": "New verification code sent to your email",
                    "dev_otp": otp if os.getenv('FLASK_ENV') == 'development' else None
                }), 200
            
        except Exception as e:
            logger.error(f"OTP resend error: {str(e)}")
            return jsonify({"error": "Internal server error"}), 500

    @app.route("/request-login-otp", methods=["POST"])
    @rate_limit()
    def request_login_otp():
        """Request OTP for login (alternative to password login)"""
        try:
            data = request.get_json()
            if not data:
                return jsonify({"status": "error", "message": "No data provided"}), 400
            
            email = data.get("email", "").strip().lower()
            
            if not email:
                return jsonify({"status": "error", "error": "Email is required"}), 400
            
            # Validate email format
            if not validate_email(email):
                return jsonify({"status": "error", "error": "Please enter a valid email address"}), 400
            
            # Find user
            user = users_collection.find_one({"email": email})
            
            if not user:
                # Don't reveal if user exists or not for security
                return jsonify({
                    "status": "success",
                    "message": "If an account with that email exists, we've sent a login code.",
                    "email": email,
                    "requires_otp": True
                }), 200
            
            # Check if user account is active and verified
            if user.get("registration_pending", False):
                return jsonify({
                    "status": "error",
                    "error": "Please complete your email verification first.",
                    "requires_signup_verification": True,
                    "email": email
                }), 403
            
            if not user.get("is_active", True):
                return jsonify({
                    "status": "error",
                    "error": "Your account has been deactivated. Please contact support."
                }), 403
            
            if not user.get("is_verified", False):
                return jsonify({
                    "status": "error",
                    "error": "Please verify your email address first.",
                    "requires_verification": True,
                    "email": email
                }), 403
            
            # Generate OTP for login
            otp = generate_otp()
            otp_expires = datetime.now() + timedelta(minutes=OTP_EXPIRY_MINUTES)
            
            # Store login OTP
            users_collection.update_one(
                {"_id": user["_id"]},
                {
                    "$set": {
                        "login_otp": otp,
                        "login_otp_expires": otp_expires,
                        "login_otp_attempts": 0
                    }
                }
            )
            
            # Send OTP email
            if send_otp_email(email, otp, user.get("firstname", "User")):
                logger.info(f"Login OTP sent to: {email}")
                return jsonify({
                    "status": "success",
                    "message": "Login code sent to your email",
                    "email": email,
                    "requires_otp": True,
                    "dev_otp": otp if os.getenv('FLASK_ENV') == 'development' else None
                }), 200
            else:
                # If email sending fails, still allow development testing
                logger.warning(f"Email sending failed for {email}, Login OTP: {otp}")
                return jsonify({
                    "status": "success",
                    "message": "Login code sent to your email",
                    "email": email,
                    "requires_otp": True,
                    "dev_otp": otp if os.getenv('FLASK_ENV') == 'development' else None
                }), 200
            
        except Exception as e:
            logger.error(f"Request login OTP error: {str(e)}")
            return jsonify({"status": "error", "message": "Internal server error"}), 500

    @app.route("/verify-login-otp", methods=["POST"])
    def verify_login_otp():
        """Verify OTP and complete login"""
        try:
            data = request.json
            if not data:
                return jsonify({"error": "No data provided"}), 400
            
            email = data.get("email", "").strip().lower()
            otp = data.get("otp", "").strip()
            
            if not email or not otp:
                return jsonify({"error": "Email and OTP are required"}), 400
            
            # Find user
            user = users_collection.find_one({"email": email})
            
            if not user:
                return jsonify({"error": "Invalid login request"}), 400
            
            # Check if login OTP has expired
            if datetime.now() > user.get("login_otp_expires", datetime.now()):
                return jsonify({"error": "Login code has expired. Please request a new one."}), 400
            
            # Check OTP attempts
            if user.get("login_otp_attempts", 0) >= MAX_OTP_ATTEMPTS:
                return jsonify({"error": "Too many incorrect attempts. Please request a new login code."}), 400
            
            # Verify login OTP
            if user.get("login_otp") != otp:
                # Increment attempts
                users_collection.update_one(
                    {"_id": user["_id"]},
                    {"$inc": {"login_otp_attempts": 1}}
                )
                return jsonify({"error": "Invalid login code. Please try again."}), 400
            
            # Clean up user data to ensure fresh session
            cleanup_user_data(str(user["_id"]))
            
            # Complete login - clean up OTP and update last login
            users_collection.update_one(
                {"_id": user["_id"]},
                {
                    "$set": {
                        "last_login": datetime.now()
                    },
                    "$unset": {
                        "login_otp": "",
                        "login_otp_expires": "",
                        "login_otp_attempts": ""
                    }
                }
            )
            
            # Log successful login
            log_user_action(str(user["_id"]), "user_login_otp", {"email": email})
            logger.info(f"Successful OTP login for user: {email}")
            
            return jsonify({
                "status": "success",
                "message": "Logged in successfully",
                "user": {
                    "id": str(user["_id"]),
                    "firstname": user.get("firstname"),
                    "lastname": user.get("lastname"),
                    "email": user.get("email"),
                    "studentId": user.get("studentId")
                }
            }), 200
            
        except Exception as e:
            logger.error(f"Login OTP verification error: {str(e)}")
            return jsonify({"error": "Internal server error"}), 500

    @app.route("/resend-login-otp", methods=["POST"])
    def resend_login_otp():
        """Resend OTP for login"""
        try:
            data = request.json
            if not data:
                return jsonify({"error": "No data provided"}), 400
            
            email = data.get("email", "").strip().lower()
            
            if not email:
                return jsonify({"error": "Email is required"}), 400
            
            # Find user
            user = users_collection.find_one({"email": email})
            
            if not user:
                return jsonify({"error": "Invalid request"}), 400
            
            # Generate new login OTP
            otp = generate_otp()
            otp_expires = datetime.now() + timedelta(minutes=OTP_EXPIRY_MINUTES)
            
            # Update user with new login OTP
            users_collection.update_one(
                {"_id": user["_id"]},
                {
                    "$set": {
                        "login_otp": otp,
                        "login_otp_expires": otp_expires,
                        "login_otp_attempts": 0
                    }
                }
            )
            
            # Send OTP email
            if send_otp_email(email, otp, user.get("firstname", "User")):
                logger.info(f"Login OTP resent to: {email}")
                return jsonify({
                    "status": "success",
                    "message": "New login code sent to your email",
                    "dev_otp": otp if os.getenv('FLASK_ENV') == 'development' else None
                }), 200
            else:
                # If email sending fails, still allow development testing
                logger.warning(f"Email sending failed for {email}, Login OTP: {otp}")
                return jsonify({
                    "status": "success",
                    "message": "New login code sent to your email",
                    "dev_otp": otp if os.getenv('FLASK_ENV') == 'development' else None
                }), 200
            
        except Exception as e:
            logger.error(f"Login OTP resend error: {str(e)}")
            return jsonify({"error": "Internal server error"}), 500

    @app.route("/login", methods=["POST"])
    @rate_limit()
    def login():
        """User login endpoint with rate limiting"""
        try:
            data = request.get_json()
            if not data:
                return jsonify({"status": "error", "message": "No data provided"}), 400
            
            # Validate required fields
            required_fields = ["email", "password"]
            validation_errors = validate_input(data, required_fields)
            
            if validation_errors:
                return jsonify({"status": "error", "message": "; ".join(validation_errors)}), 400
            
            email = data.get("email").strip().lower()
            password = data.get("password")
            
            # Validate email format
            if not validate_email(email):
                return jsonify({"status": "error", "error": "Please enter a valid email address (e.g., user@example.com)"}), 400
            
            # Find user
            user = users_collection.find_one({"email": email})
            
            if user and bcrypt.checkpw(password.encode("utf-8"), user["password"]):
                # Check if user has pending registration
                if user.get("registration_pending", False):
                    return jsonify({
                        "status": "error",
                        "error": "Please verify your email before logging in. Check your email for the verification code.",
                        "requires_verification": True,
                        "email": email
                    }), 403
                
                # Check if user account is active
                if not user.get("is_active", True):
                    return jsonify({
                        "status": "error",
                        "error": "Your account has been deactivated. Please contact support for assistance."
                    }), 403
                
                # Check if user is verified
                if not user.get("is_verified", False):
                    return jsonify({
                        "status": "error",
                        "error": "Please verify your email address to access your account.",
                        "requires_verification": True,
                        "email": email
                    }), 403
                
                # Clean up user data to ensure fresh session
                cleanup_user_data(str(user["_id"]))
                
                # Update last login
                users_collection.update_one(
                    {"_id": user["_id"]},
                    {"$set": {"last_login": datetime.now()}}
                )
                
                # Log successful login
                log_user_action(str(user["_id"]), "user_login", {"email": email})
                logger.info(f"Successful login for user: {email}")
                
                return jsonify({
                    "status": "success",
                    "message": "Logged in successfully",
                    "user": {
                        "id": str(user["_id"]),
                        "firstname": user.get("firstname"),
                        "lastname": user.get("lastname"),
                        "email": user.get("email"),
                        "studentId": user.get("studentId")
                    }
                }), 200
            else:
                logger.warning(f"Failed login attempt for email: {email}")
                return jsonify({
                    "status": "error",
                    "error": "The email or password you entered is incorrect. Please check your credentials and try again."
                }), 401
                
        except Exception as e:
            logger.error(f"Login error: {str(e)}")
            return jsonify({"status": "error", "message": "Internal server error"}), 500

    @app.route("/user-profile/<user_id>", methods=["GET"])
    def get_user_profile(user_id):
        """Get user profile information"""
        try:
            from bson import ObjectId
            
            try:
                user_object_id = ObjectId(user_id)
            except:
                return jsonify({"error": "Invalid user ID format"}), 400
            
            user = users_collection.find_one({"_id": user_object_id})
            
            if not user:
                return jsonify({"error": "User not found"}), 404
            
            # Return user profile (excluding sensitive information)
            profile_data = {
                "id": str(user["_id"]),
                "firstname": user.get("firstname"),
                "lastname": user.get("lastname"),
                "email": user.get("email"),
                "studentId": user.get("studentId"),
                "created_at": user.get("created_at").isoformat() if user.get("created_at") else None,
                "last_login": user.get("last_login").isoformat() if user.get("last_login") else None,
                "is_active": user.get("is_active", True),
                "behavior_metrics": user.get("behavior_metrics", {})
            }
            
            return jsonify({
                "status": "success",
                "profile": profile_data
            }), 200
            
        except Exception as e:
            logger.error(f"Error retrieving user profile: {str(e)}")
            return jsonify({"error": "Internal server error"}), 500

    @app.route("/user-profile/<user_id>", methods=["PUT"])
    def update_user_profile(user_id):
        """Update user profile information"""
        try:
            from bson import ObjectId
            
            data = request.json
            if not data:
                return jsonify({"error": "No data provided"}), 400
            
            try:
                user_object_id = ObjectId(user_id)
            except:
                return jsonify({"error": "Invalid user ID format"}), 400
            
            # Check if user exists
            user = users_collection.find_one({"_id": user_object_id})
            if not user:
                return jsonify({"error": "User not found"}), 404
            
            # Prepare update data (only allow certain fields to be updated)
            update_data = {}
            allowed_fields = ["firstname", "lastname", "email"]
            
            for field in allowed_fields:
                if field in data:
                    if field == "email":
                        email = data[field].strip().lower()
                        if not validate_email(email):
                            return jsonify({"error": "Invalid email format"}), 400
                        # Check if email is already used by another user
                        existing_user = users_collection.find_one({
                            "email": email,
                            "_id": {"$ne": user_object_id}
                        })
                        if existing_user:
                            return jsonify({"error": "Email already exists"}), 400
                        update_data[field] = email
                    else:
                        update_data[field] = data[field].strip()
            
            if not update_data:
                return jsonify({"error": "No valid fields to update"}), 400
            
            # Update user
            update_data["updated_at"] = datetime.now()
            result = users_collection.update_one(
                {"_id": user_object_id},
                {"$set": update_data}
            )
            
            if result.modified_count > 0:
                log_user_action(user_id, "profile_update", update_data)
                return jsonify({
                    "status": "success",
                    "message": "Profile updated successfully"
                }), 200
            else:
                return jsonify({"error": "No changes made"}), 400
                
        except Exception as e:
            logger.error(f"Error updating user profile: {str(e)}")
            return jsonify({"error": "Internal server error"}), 500

    @app.route("/change-password", methods=["POST"])
    def change_password():
        """Change user password"""
        try:
            data = request.json
            if not data:
                return jsonify({"error": "No data provided"}), 400
            
            # Validate required fields
            required_fields = ["user_id", "current_password", "new_password"]
            validation_errors = validate_input(data, required_fields)
            
            if validation_errors:
                return jsonify({"error": "; ".join(validation_errors)}), 400
            
            user_id = data.get("user_id")
            current_password = data.get("current_password")
            new_password = data.get("new_password")
            
            # Validate new password strength
            is_valid, password_message = validate_password(new_password)
            if not is_valid:
                return jsonify({"error": password_message}), 400
            
            # Get user
            from bson import ObjectId
            try:
                user_object_id = ObjectId(user_id)
            except:
                return jsonify({"error": "Invalid user ID format"}), 400
            
            user = users_collection.find_one({"_id": user_object_id})
            if not user:
                return jsonify({"error": "User not found"}), 404
            
            # Verify current password
            if not bcrypt.checkpw(current_password.encode("utf-8"), user["password"]):
                return jsonify({"error": "Current password is incorrect"}), 401
            
            # Hash new password
            hashed_new_password = bcrypt.hashpw(new_password.encode("utf-8"), bcrypt.gensalt())
            
            # Update password
            result = users_collection.update_one(
                {"_id": user_object_id},
                {"$set": {
                    "password": hashed_new_password,
                    "password_changed_at": datetime.now()
                }}
            )
            
            if result.modified_count > 0:
                log_user_action(user_id, "password_change")
                return jsonify({
                    "status": "success",
                    "message": "Password changed successfully"
                }), 200
            else:
                return jsonify({"error": "Failed to change password"}), 500
                
        except Exception as e:
            logger.error(f"Error changing password: {str(e)}")
            return jsonify({"error": "Internal server error"}), 500

    @app.route("/forgot-password", methods=["POST"])
    def forgot_password():
        """Send password reset email"""
        try:
            data = request.json
            if not data:
                return jsonify({"error": "No data provided"}), 400
            
            email = data.get("email", "").strip().lower()
            
            if not email:
                return jsonify({"error": "Please enter your email address"}), 400
            
            if not validate_email(email):
                return jsonify({"error": "Please enter a valid email address (e.g., user@example.com)"}), 400
            
            # Check if user exists
            user = users_collection.find_one({"email": email})
            
            # Always return success message for security (don't reveal if email exists)
            success_message = "If an account with that email exists, we've sent password reset instructions."
            
            if user:
                # Generate reset token
                reset_token = secrets.token_urlsafe(32)
                reset_expires = datetime.now() + timedelta(hours=1)  # Token expires in 1 hour
                
                # Store reset token in database
                users_collection.update_one(
                    {"_id": user["_id"]},
                    {"$set": {
                        "reset_token": reset_token,
                        "reset_token_expires": reset_expires
                    }}
                )
                
                # In a real application, you would send an email here
                # For now, we'll just log the reset link (for development)
                reset_link = f"http://localhost:3000/reset-password?token={reset_token}&email={email}"
                logger.info(f"Password reset link for {email}: {reset_link}")
                
                # TODO: Implement actual email sending
                # send_reset_email(email, reset_token, user.get("firstname", "User"))
                
                log_user_action(str(user["_id"]), "password_reset_requested", {"email": email})
            
            return jsonify({
                "status": "success",
                "message": success_message
            }), 200
            
        except Exception as e:
            logger.error(f"Error in forgot password: {str(e)}")
            return jsonify({"error": "Internal server error"}), 500

    @app.route("/verify-reset-token", methods=["POST"])
    def verify_reset_token():
        """Verify if reset token is valid"""
        try:
            data = request.json
            if not data:
                return jsonify({"error": "No data provided"}), 400
            
            token = data.get("token")
            email = data.get("email", "").strip().lower()
            
            if not token or not email:
                return jsonify({"error": "Invalid reset link. Please request a new password reset."}), 400
            
            # Find user with matching token and email
            user = users_collection.find_one({
                "email": email,
                "reset_token": token,
                "reset_token_expires": {"$gt": datetime.now()}
            })
            
            if user:
                return jsonify({
                    "status": "success",
                    "message": "Token is valid"
                }), 200
            else:
                return jsonify({"error": "Your password reset link has expired or is invalid. Please request a new one."}), 400
                
        except Exception as e:
            logger.error(f"Error verifying reset token: {str(e)}")
            return jsonify({"error": "Internal server error"}), 500

    @app.route("/reset-password", methods=["POST"])
    def reset_password():
        """Reset user password with token"""
        try:
            data = request.json
            if not data:
                return jsonify({"error": "No data provided"}), 400
            
            token = data.get("token")
            email = data.get("email", "").strip().lower()
            new_password = data.get("new_password")
            
            if not token or not email or not new_password:
                return jsonify({"error": "All fields are required to reset your password"}), 400
            
            # Validate new password strength
            is_valid, password_message = validate_password(new_password)
            if not is_valid:
                return jsonify({"error": password_message}), 400
            
            # Find user with valid token
            user = users_collection.find_one({
                "email": email,
                "reset_token": token,
                "reset_token_expires": {"$gt": datetime.now()}
            })
            
            if not user:
                return jsonify({"error": "Your password reset link has expired or is invalid. Please request a new one."}), 400
            
            # Hash new password
            hashed_password = bcrypt.hashpw(new_password.encode("utf-8"), bcrypt.gensalt())
            
            # Update password and clear reset token
            result = users_collection.update_one(
                {"_id": user["_id"]},
                {"$set": {
                    "password": hashed_password,
                    "password_changed_at": datetime.now()
                },
                "$unset": {
                    "reset_token": "",
                    "reset_token_expires": ""
                }}
            )
            
            if result.modified_count > 0:
                log_user_action(str(user["_id"]), "password_reset_completed", {"email": email})
                return jsonify({
                    "status": "success",
                    "message": "Password reset successfully"
                }), 200
            else:
                return jsonify({"error": "Failed to reset password"}), 500
                
        except Exception as e:
            logger.error(f"Error resetting password: {str(e)}")
            return jsonify({"error": "Internal server error"}), 500

    logger.info("Authentication routes registered successfully")
