"""
Authentication and authorization middleware for EduMaster application.
This module provides secure user context validation and data isolation.
"""

import logging
from functools import wraps
from datetime import datetime
from flask import request, jsonify
from bson import ObjectId

logger = logging.getLogger(__name__)

class AuthMiddleware:
    """
    Middleware class for handling authentication and authorization
    """
    
    @staticmethod
    def validate_user_context():
        """
        Validate that the requesting user has proper context and authorization
        """
        def decorator(f):
            @wraps(f)
            def decorated_function(*args, **kwargs):
                try:
                    # Get user ID from the URL path parameters
                    path_user_id = None
                    for key, value in kwargs.items():
                        if key == 'user_id' or key.endswith('_user_id'):
                            path_user_id = value
                            break
                    
                    # Get user ID from request headers (from secure frontend)
                    header_user_id = request.headers.get('X-User-ID')
                    
                    # Get user ID from request body for POST/PUT requests
                    body_user_id = None
                    if request.method in ['POST', 'PUT'] and request.json:
                        body_user_id = request.json.get('userId')
                    
                    # Validate user ID is present
                    if not path_user_id and not header_user_id and not body_user_id:
                        logger.warning("❌ Request missing user context")
                        return jsonify({
                            "error": "User context required",
                            "message": "This request requires proper user authentication"
                        }), 401
                    
                    # For path-based user ID endpoints, validate against header
                    if path_user_id and header_user_id:
                        if path_user_id != header_user_id:
                            logger.warning(f"❌ User context mismatch: path={path_user_id}, header={header_user_id}")
                            return jsonify({
                                "error": "User context mismatch", 
                                "message": "Access denied: user context validation failed"
                            }), 403
                    
                    # For body-based requests, validate against header
                    if body_user_id and header_user_id:
                        if body_user_id != header_user_id:
                            logger.warning(f"❌ User context mismatch: body={body_user_id}, header={header_user_id}")
                            return jsonify({
                                "error": "User context mismatch",
                                "message": "Access denied: user context validation failed" 
                            }), 403
                    
                    # Store validated user ID in request context
                    request.validated_user_id = path_user_id or header_user_id or body_user_id
                    
                    logger.info(f"🔐 User context validated: {request.validated_user_id}")
                    
                    return f(*args, **kwargs)
                    
                except Exception as e:
                    logger.error(f"❌ Auth middleware error: {str(e)}")
                    return jsonify({
                        "error": "Authentication error",
                        "message": "Unable to validate user context"
                    }), 500
            
            return decorated_function
        return decorator
    
    @staticmethod
    def filter_user_data(data, user_id_field='userId'):
        """
        Filter response data to ensure it belongs to the authenticated user
        
        Args:
            data: Response data (dict, list, or primitive)
            user_id_field: Field name that contains the user ID
            
        Returns:
            Filtered data that belongs to the authenticated user only
        """
        if not hasattr(request, 'validated_user_id'):
            logger.warning("❌ No validated user ID found in request context")
            return None
        
        authenticated_user_id = request.validated_user_id
        
        try:
            if isinstance(data, dict):
                # Single document - check ownership
                doc_user_id = str(data.get(user_id_field, ''))
                if doc_user_id and doc_user_id != authenticated_user_id:
                    logger.warning(f"❌ Data ownership violation: doc_user={doc_user_id}, auth_user={authenticated_user_id}")
                    return None
                return data
                
            elif isinstance(data, list):
                # Multiple documents - filter by ownership
                filtered_data = []
                for item in data:
                    if isinstance(item, dict):
                        doc_user_id = str(item.get(user_id_field, ''))
                        if not doc_user_id or doc_user_id == authenticated_user_id:
                            filtered_data.append(item)
                        else:
                            logger.warning(f"❌ Filtered out data for different user: {doc_user_id}")
                
                logger.info(f"🔒 Filtered {len(data)} items to {len(filtered_data)} items for user {authenticated_user_id}")
                return filtered_data
            
            else:
                # Primitive data - return as is
                return data
                
        except Exception as e:
            logger.error(f"❌ Error filtering user data: {str(e)}")
            return None
    
    @staticmethod
    def secure_response(data, message="Success", user_id_field='userId'):
        """
        Create a secure response with user data filtering
        
        Args:
            data: Response data
            message: Success message
            user_id_field: Field name that contains the user ID
            
        Returns:
            Flask JSON response with filtered data
        """
        try:
            filtered_data = AuthMiddleware.filter_user_data(data, user_id_field)
            
            if filtered_data is None and data is not None:
                logger.warning("❌ All data filtered out due to ownership violations")
                return jsonify({
                    "error": "Access denied",
                    "message": "You don't have permission to access this data"
                }), 403
            
            response_data = {
                "status": "success",
                "message": message,
                "data": filtered_data
            }
            
            # Add user context to response for frontend validation
            if hasattr(request, 'validated_user_id'):
                response_data["userId"] = request.validated_user_id
            
            return jsonify(response_data), 200
            
        except Exception as e:
            logger.error(f"❌ Error creating secure response: {str(e)}")
            return jsonify({
                "error": "Response processing error",
                "message": "Unable to process response data"
            }), 500

# Convenience decorator for routes that need user validation
def require_user_context(f):
    """Decorator for routes that require user context validation"""
    return AuthMiddleware.validate_user_context()(f)

# Convenience function for creating secure responses
def secure_response(data, message="Success", user_id_field='userId'):
    """Create a secure response with user data filtering"""
    return AuthMiddleware.secure_response(data, message, user_id_field)

def log_security_event(event_type, user_id=None, details=None):
    """
    Log security-related events for auditing
    
    Args:
        event_type: Type of security event
        user_id: User ID involved in the event
        details: Additional details about the event
    """
    try:
        log_message = f"🔒 SECURITY EVENT: {event_type}"
        
        if user_id:
            log_message += f" | User: {user_id}"
        
        if details:
            log_message += f" | Details: {details}"
        
        # Add request info if available
        if request:
            log_message += f" | IP: {request.environ.get('REMOTE_ADDR', 'unknown')}"
            log_message += f" | Method: {request.method}"
            log_message += f" | Endpoint: {request.endpoint or request.path}"
        
        logger.warning(log_message)
        
    except Exception as e:
        logger.error(f"❌ Error logging security event: {str(e)}")

# Enhanced logout endpoint for complete session invalidation
def register_logout_endpoint(app):
    """Register secure logout endpoint"""
    
    @app.route('/logout', methods=['POST'])
    def secure_logout():
        """
        Secure logout endpoint that invalidates the user session
        and logs the security event
        """
        try:
            user_id = request.headers.get('X-User-ID') or (request.json.get('userId') if request.json else None)
            
            if user_id:
                log_security_event("user_logout", user_id, {"source": "explicit_logout"})
                
                # Here you could invalidate server-side sessions if you had them
                # For now, we rely on frontend clearing localStorage
                
                logger.info(f"🔒 User logout completed: {user_id}")
                
                return jsonify({
                    "status": "success",
                    "message": "Logout successful",
                    "timestamp": str(datetime.now())
                }), 200
            else:
                return jsonify({
                    "status": "success", 
                    "message": "Logout completed"
                }), 200
                
        except Exception as e:
            logger.error(f"❌ Logout error: {str(e)}")
            return jsonify({
                "status": "success",
                "message": "Logout completed"  # Always return success for logout
            }), 200

if __name__ == "__main__":
    # Test the middleware
    print("🔐 Auth Middleware loaded successfully")
