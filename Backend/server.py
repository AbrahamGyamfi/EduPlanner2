"""
Main server module for EduMaster application.
This module initializes the Flask application and registers all component routes.
"""

import os
import logging
import sys
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_swagger import swagger
from dotenv import load_dotenv

#############################################
# Logging Configuration (Render friendly)
# Writes to stdout (captured by Render) and optionally to file if ENABLE_FILE_LOGS=true
#############################################
log_level = os.getenv('LOG_LEVEL', 'INFO').upper()

handlers = [logging.StreamHandler(sys.stdout)]
if os.getenv('ENABLE_FILE_LOGS', '').lower() in ('1', 'true', 'yes'):
    # Avoid crashes if filesystem is read-only; wrap in try
    try:
        handlers.append(logging.FileHandler('app.log'))
    except Exception:
        pass

logging.basicConfig(
    level=getattr(logging, log_level, logging.INFO),
    format='%(asctime)s [%(levelname)s] %(name)s - %(message)s',
    handlers=handlers
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
    CORS(app, resources={
        r"/*": {
            "origins": os.getenv('CORS_ORIGINS', 'http://localhost:3000').split(',')
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
            "message": "EduPlanner API is running!",
            "version": "2.0.0"
        })
    
    # Dynamic CORS handling (override static header)
    allowed_origins = [o.strip() for o in os.getenv('CORS_ORIGINS', 'http://localhost:3000').split(',') if o.strip()]

    @app.after_request
    def after_request(response):
        origin = request.headers.get('Origin')
        if origin and (origin in allowed_origins or '*' in allowed_origins):
            response.headers['Access-Control-Allow-Origin'] = origin if origin in allowed_origins else '*'
        else:
            # Fallback for local dev
            if 'http://localhost:3000' in allowed_origins:
                response.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000'
        response.headers['Vary'] = 'Origin'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Access-Control-Max-Age'] = '3600'
        return response
    
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
        
        # Import AI-enhanced analytics routes
        try:
            from ai_analytics import register_ai_analytics_routes
            success = register_ai_analytics_routes(app)
            if success:
                logger.info("AI-enhanced analytics routes registered")
            else:
                logger.warning("AI-enhanced analytics routes registration failed")
        except ImportError as e:
            logger.warning(f"Could not import AI analytics routes: {e}")
            logger.warning("AI-enhanced analytics not available - using standard analytics only")
        except Exception as e:
            logger.error(f"Error registering AI analytics routes: {e}")
        
        # Import in-app notification routes
        try:
            from in_app_notifications import register_in_app_notification_routes
            success = register_in_app_notification_routes(app)
            if success:
                logger.info("In-app notification routes registered")
            else:
                logger.warning("In-app notification routes registration failed")
        except ImportError as e:
            logger.warning(f"Could not import in-app notification routes: {e}")
        except Exception as e:
            logger.error(f"Error registering in-app notification routes: {e}")
        
    except Exception as e:
        logger.error(f"Error registering routes: {str(e)}")
        raise
    
    logger.info("All routes registered successfully")
    return app

# Create the Flask app
app = create_app()

if __name__ == '__main__':
    # Local/dev server only. In production (Render) use gunicorn: gunicorn --bind 0.0.0.0:$PORT server:app
    port = int(os.getenv('PORT', 5000))
    host = os.getenv('HOST', '0.0.0.0')
    app.run(debug=app.config['DEBUG'], port=port, host=host)
