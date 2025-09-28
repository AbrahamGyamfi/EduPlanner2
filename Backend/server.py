"""
Main server module for EduMaster application.
This module initializes the Flask application and registers all component routes.
"""

import os
import logging
import sys
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from flask_swagger import swagger
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

# Suppress pymongo debug messages
logging.getLogger('pymongo').setLevel(logging.WARNING)

# Create logger instance
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

def create_app():
    """Create and configure the Flask application"""
    # Initialize Flask app
    app = Flask(__name__)
    
    # Configure CORS
    cors_origins = os.getenv('CORS_ORIGINS', 'http://localhost:3000')
    if cors_origins == '*':
        # Allow all origins in development/testing
        CORS(app, resources={
            r"/*": {
                "origins": "*",
                "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                "allow_headers": ["Content-Type", "Authorization", "Accept"],
                "supports_credentials": False,
                "expose_headers": ["Content-Type"]
            }
        })
    else:
        # Use specific origins
        CORS(app, resources={
            r"/*": {
                "origins": cors_origins.split(','),
                "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                "allow_headers": ["Content-Type", "Authorization", "Accept"],
                "supports_credentials": True,
                "expose_headers": ["Content-Type"]
            }
        })
    
    # App configuration from environment variables
    app.config['DEBUG'] = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    app.config['ENV'] = os.getenv('FLASK_ENV', 'development')
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'fallback-secret-key-change-in-production')
    
    # Configure upload folder - use uploaded_slides if it exists, otherwise create uploads
    uploaded_slides_folder = os.path.join(os.getcwd(), 'uploaded_slides')
    default_upload_folder = os.path.join(os.getcwd(), os.getenv('UPLOAD_FOLDER', 'uploads'))
    
    if os.path.exists(uploaded_slides_folder):
        upload_folder = uploaded_slides_folder
    else:
        upload_folder = default_upload_folder
        if not os.path.exists(upload_folder):
            os.makedirs(upload_folder)
    
    app.config['UPLOAD_FOLDER'] = upload_folder
    
    # Basic route to check if API is running
    @app.route('/')
    def index():
        return jsonify({
            "status": "success",
            "message": "EduMaster API is running!",
            "version": "2.0.0",
            "environment": app.config['ENV']
        })
    
    # Health check endpoint for monitoring
    @app.route('/health')
    def health_check():
        try:
            # You can add database connectivity checks here
            return jsonify({
                "status": "healthy",
                "timestamp": os.getenv("RENDER_SERVICE_NAME", "local"),
                "environment": app.config['ENV']
            }), 200
        except Exception as e:
            logger.error(f"Health check failed: {str(e)}")
            return jsonify({
                "status": "unhealthy",
                "error": str(e)
            }), 500
    
    # Add CORS headers to all responses
    @app.after_request
    def after_request(response):
        cors_origins = os.getenv('CORS_ORIGINS', 'http://localhost:3000')
        if cors_origins == '*':
            response.headers['Access-Control-Allow-Origin'] = '*'
        else:
            # Use the first origin as default
            response.headers['Access-Control-Allow-Origin'] = cors_origins.split(',')[0]
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Accept'
        response.headers['Access-Control-Max-Age'] = '3600'
        response.headers['Content-Type'] = 'application/json'
        return response
    
    # Global error handlers for production
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            "status": "error",
            "message": "Resource not found",
            "code": 404
        }), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        logger.error(f"Internal server error: {str(error)}")
        return jsonify({
            "status": "error",
            "message": "Internal server error",
            "code": 500
        }), 500
    
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({
            "status": "error",
            "message": "Bad request",
            "code": 400
        }), 400
    
    # Handle OPTIONS preflight requests
    @app.route('/slides/<filename>', methods=['OPTIONS'])
    def handle_preflight(filename):
        response = jsonify({'message': 'OK'})
        return response, 200
    
    # API documentation route using Swagger
    @app.route('/api/docs')
    def get_api_docs():
        swag = swagger(app)
        swag['info']['title'] = 'EduMaster API'
        swag['info']['version'] = '2.0.0'
        swag['info']['description'] = 'EduMaster Backend API Documentation'
        return jsonify(swag)
    
    # Import and register all module routes
    try:
        # Import auth module and register routes
        from auth import register_auth_routes
        register_auth_routes(app)
        logger.info("Authentication routes registered")
        
        # Import file management module and register routes
        from file_handler import register_file_routes
        register_file_routes(app)
        logger.info("File management routes registered")
        
        # Import content generation module and register routes
        from content_generator import register_content_routes
        register_content_routes(app)
        logger.info("Content generation routes registered")
        
        # Import assignment management module and register routes
        from assignments import register_assignment_routes
        register_assignment_routes(app)
        logger.info("Assignment management routes registered")
        
        # Import scheduling module and register routes
        from scheduling import register_scheduling_routes
        register_scheduling_routes(app)
        logger.info("Scheduling routes registered")
        
        # Import study session module and register routes
        from study_sessions import register_study_session_routes
        register_study_session_routes(app)
        logger.info("Study session routes registered")
        
        # Import notification module and register routes
        from notifications import register_notification_routes
        register_notification_routes(app)
        logger.info("Notification routes registered")
        
        # Import AI endpoints if available
        try:
            from ai_endpoints import register_ai_endpoints
            register_ai_endpoints(app)
            logger.info("AI endpoints registered successfully")
        except ImportError as e:
            logger.warning(f"Could not import AI endpoints: {e}")
            logger.warning("AI endpoints not available - some features may be limited")
        
        # Import quiz results routes
        try:
            from quiz_results import register_quiz_results_routes
            register_quiz_results_routes(app)
            logger.info("Quiz results routes registered")
        except ImportError as e:
            logger.error(f"Could not import quiz results routes: {e}")
        
        # Import quiz analytics routes
        try:
            from quiz_analytics import register_quiz_analytics_routes
            register_quiz_analytics_routes(app)
            logger.info("Quiz analytics routes registered")
        except ImportError as e:
            logger.error(f"Could not import quiz analytics routes: {e}")
        
        # Import behavioral analytics routes
        try:
            from behavioral_analytics import register_behavioral_analytics_routes
            register_behavioral_analytics_routes(app)
            logger.info("Behavioral analytics routes registered")
        except ImportError as e:
            logger.error(f"Could not import behavioral analytics routes: {e}")
        
        # Import slide reading tracker routes
        try:
            from slide_reading_tracker import register_slide_reading_routes
            register_slide_reading_routes(app)
            logger.info("Slide reading tracker routes registered")
        except ImportError as e:
            logger.error(f"Could not import slide reading tracker routes: {e}")
        
        # Import study analytics routes
        try:
            from study_analytics import register_study_analytics_routes
            register_study_analytics_routes(app)
            logger.info("Study analytics routes registered")
        except ImportError as e:
            logger.error(f"Could not import study analytics routes: {e}")
        
        # Import backward compatibility routes
        try:
            from compatibility import register_compatibility_routes
            register_compatibility_routes(app)
            logger.info("Backward compatibility routes registered")
        except ImportError as e:
            logger.error(f"Could not import compatibility routes: {e}")
        
        # Import integrated time tracking routes
        try:
            from integrated_time_tracking import register_integrated_time_tracking_routes
            register_integrated_time_tracking_routes(app)
            logger.info("Integrated time tracking routes registered")
        except ImportError as e:
            logger.error(f"Could not import integrated time tracking routes: {e}")
        
        # Import unified analytics service routes
        try:
            from unified_analytics_service import register_unified_analytics_routes
            register_unified_analytics_routes(app)
            logger.info("Unified analytics service routes registered")
        except ImportError as e:
            logger.error(f"Could not import unified analytics service routes: {e}")
        
    except Exception as e:
        logger.error(f"Error registering routes: {str(e)}")
        raise
    
    logger.info("All routes registered successfully")
    return app

# Create the Flask app
app = create_app()

if __name__ == '__main__':
    # Get port from environment variable or use default
    port = int(os.getenv('PORT', 5000))
    host = '0.0.0.0'  # Bind to all interfaces for production
    debug = app.config['DEBUG']
    
    logger.info(f"Starting server on {host}:{port} (debug={debug})")
    app.run(debug=debug, host=host, port=port)
