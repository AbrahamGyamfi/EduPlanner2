"""
System-Only Data Middleware
Ensures that the backend only accepts data from system sources, not user input
"""

from flask import request, jsonify
from functools import wraps
import base64
import os
import logging

logger = logging.getLogger(__name__)

class SystemOnlyMiddleware:
    def __init__(self, app=None):
        self.app = app
        self.system_secret = os.getenv('SYSTEM_SECRET', 'default-system-secret')
        self.allowed_sources = ['system', 'automated', 'internal']
        
    def init_app(self, app):
        self.app = app
        
    def validate_system_request(self, f):
        """Decorator to validate that requests come from system sources only"""
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Check for system authentication header
            system_auth = request.headers.get('X-System-Auth')
            data_source = request.headers.get('X-Data-Source')
            
            if not system_auth:
                logger.warning(f"Request blocked - Missing system auth header from {request.remote_addr}")
                return jsonify({
                    'error': 'System authentication required',
                    'message': 'This endpoint only accepts system-generated requests'
                }), 401
                
            if data_source != 'system-only':
                logger.warning(f"Request blocked - Invalid data source: {data_source}")
                return jsonify({
                    'error': 'Invalid data source',
                    'message': 'Only system-generated data is accepted'
                }), 403
                
            # Validate system signature
            try:
                decoded_auth = base64.b64decode(system_auth).decode('utf-8')
                if self.system_secret not in decoded_auth:
                    logger.warning(f"Request blocked - Invalid system signature")
                    return jsonify({
                        'error': 'Invalid system signature',
                        'message': 'System authentication failed'
                    }), 401
            except Exception as e:
                logger.warning(f"Request blocked - Error validating signature: {e}")
                return jsonify({
                    'error': 'Authentication error',
                    'message': 'Failed to validate system signature'
                }), 401
                
            # Validate request data
            if request.is_json:
                data = request.get_json()
                if not self._validate_system_data(data):
                    logger.warning(f"Request blocked - Invalid system data structure")
                    return jsonify({
                        'error': 'Invalid data format',
                        'message': 'Data does not conform to system standards'
                    }), 400
                    
            return f(*args, **kwargs)
        return decorated_function
        
    def _validate_system_data(self, data):
        """Validate that data comes from system sources"""
        if not isinstance(data, dict):
            return False
            
        # Check for required system fields
        required_fields = ['systemSignature', 'source', 'timestamp']
        for field in required_fields:
            if field not in data:
                logger.warning(f"Missing required system field: {field}")
                return False
                
        # Validate source
        if data.get('source') not in self.allowed_sources:
            logger.warning(f"Invalid data source: {data.get('source')}")
            return False
            
        # Validate system signature in data
        if not data.get('systemSignature'):
            logger.warning("Missing system signature in data")
            return False
            
        return True
        
    def block_user_input_endpoints(self):
        """Block endpoints that typically accept user input"""
        blocked_endpoints = [
            '/signup',
            '/login', 
            '/upload',
            '/generate-summary',
            '/generate-quiz'
        ]
        
        def block_user_endpoint(endpoint):
            @self.app.route(endpoint, methods=['POST', 'PUT', 'PATCH'])
            def blocked_endpoint():
                logger.warning(f"Blocked user input attempt to {endpoint}")
                return jsonify({
                    'error': 'User input disabled',
                    'message': 'This system operates in automated mode only. User input is not accepted.',
                    'recommendation': 'Use system-generated data collection methods'
                }), 403
                
        # Apply blocking to user input endpoints
        for endpoint in blocked_endpoints:
            block_user_endpoint(endpoint)
            
    def sanitize_system_data(self, data):
        """Sanitize system data to remove any potential user input"""
        if not isinstance(data, dict):
            return data
            
        # Allowed system fields only
        allowed_fields = [
            'studentId', 'courseId', 'assignmentId', 'sessionId',
            'timestamp', 'systemMetrics', 'behaviorData', 'analyticsData',
            'systemSignature', 'source', 'dataType', 'systemId',
            'automated', 'browserMetrics', 'sessionMetrics'
        ]
        
        sanitized = {}
        for key, value in data.items():
            if key in allowed_fields:
                if isinstance(value, dict):
                    sanitized[key] = self.sanitize_system_data(value)
                elif isinstance(value, str):
                    # Remove potential injection attempts
                    sanitized[key] = self._sanitize_string(value)
                else:
                    sanitized[key] = value
                    
        return sanitized
        
    def _sanitize_string(self, value):
        """Sanitize string values"""
        if not isinstance(value, str):
            return value
            
        # Remove script tags and javascript
        import re
        value = re.sub(r'<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>', '', value, flags=re.IGNORECASE)
        value = re.sub(r'javascript:', '', value, flags=re.IGNORECASE)
        value = re.sub(r'on\w+\s*=', '', value, flags=re.IGNORECASE)
        
        return value

# Usage example for Flask app
def create_system_only_app(app):
    """Configure Flask app for system-only operation"""
    middleware = SystemOnlyMiddleware(app)
    
    # Block user input endpoints
    middleware.block_user_input_endpoints()
    
    # Add system validation to data endpoints
    @app.route('/api/sync-data', methods=['POST'])
    @middleware.validate_system_request
    def sync_system_data():
        data = request.get_json()
        sanitized_data = middleware.sanitize_system_data(data)
        
        # Process system data only
        logger.info(f"Processing system data: {len(sanitized_data.get('data', []))} items")
        
        # Store in database with system validation
        # ... database operations here ...
        
        return jsonify({
            'status': 'success',
            'message': 'System data synchronized',
            'processed_items': len(sanitized_data.get('data', []))
        })
        
    @app.route('/api/analyze', methods=['POST'])
    @middleware.validate_system_request
    def analyze_system_data():
        data = request.get_json()
        sanitized_data = middleware.sanitize_system_data(data)
        
        # Perform analysis on system data only
        logger.info("Performing system-only analysis")
        
        # ... analysis logic here ...
        
        return jsonify({
            'status': 'success',
            'message': 'Analysis completed using system data only'
        })
    
    return app
