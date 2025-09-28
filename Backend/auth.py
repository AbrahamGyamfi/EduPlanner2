"""
Authentication module for EduMaster application.
This module handles user registration, login, password validation, and rate limiting.
"""

import bcrypt
import logging
import secrets
import smtplib
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
    
    @app.route("/signup", methods=["POST", "OPTIONS"])
    def signup():
        """User registration endpoint"""
        if request.method == "OPTIONS":
            # Handle preflight request
            return jsonify({"status": "ok"}), 200
            
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
            
            # Hash password
            hashed_pw = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
            
            # Create user
            user_data = {
                "firstname": firstname,
                "lastname": lastname,
                "studentId": studentId,
                "email": email,
                "password": hashed_pw,
                "created_at": datetime.now(),
                "is_active": True
            }
            
            result = users_collection.insert_one(user_data)
            
            # Log successful registration
            log_user_action(str(result.inserted_id), "user_registration", {"email": email})
            logger.info(f"User created successfully: {email}")
            
            return jsonify({
                "status": "success",
                "message": "User created successfully",
                "user_id": str(result.inserted_id)
            }), 201
            
        except Exception as e:
            logger.error(f"Signup error: {str(e)}")
            return jsonify({"error": "Internal server error"}), 500

    @app.route("/login", methods=["POST", "OPTIONS"])
    @rate_limit()
    def login():
        """User login endpoint with rate limiting"""
        if request.method == "OPTIONS":
            # Handle preflight request
            return jsonify({"status": "ok"}), 200
            
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
                # Check if user account is active
                if not user.get("is_active", True):
                    return jsonify({
                        "status": "error",
                        "error": "Your account has been deactivated. Please contact support for assistance."
                    }), 403
                
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
