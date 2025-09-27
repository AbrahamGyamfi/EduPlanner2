"""
Clean server module for EduMaster application.
This module initializes the Flask application with only essential routes.
Removed: load functionality and quick assignment buttons.
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
    CORS(app, resources={
        r"/*": {
            "origins": os.getenv('CORS_ORIGINS', 'http://localhost:3000').split(',')
        }
    })
    
    # App configuration from environment variables
    app.config['DEBUG'] = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    app.config['ENV'] = os.getenv('FLASK_ENV', 'development')
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'fallback-secret-key-change-in-production')
    
    # Configure upload folder - simplified without unnecessary features
    upload_folder = os.path.join(os.getcwd(), os.getenv('UPLOAD_FOLDER', 'uploads'))
    if not os.path.exists(upload_folder):
        os.makedirs(upload_folder)
    app.config['UPLOAD_FOLDER'] = upload_folder
    
    # Basic route to check if API is running
    @app.route('/')
    def index():
        return jsonify({
            "status": "success",
            "message": "EduMaster API is running!",
            "version": "2.0.0"
        })
    
    # Add CORS headers to all responses
    @app.after_request
    def after_request(response):
        response.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
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
    
    # Import and register essential module routes only
    try:
        # Import auth module and register routes
        from auth import register_auth_routes
        register_auth_routes(app)
        logger.info("Authentication routes registered")
        
        # Import file management module and register routes
        from file_handler import register_file_routes
        register_file_routes(app)
        logger.info("File management routes registered")
        
        # Import content generation module and register routes (without quick buttons)
        from content_generator import register_content_routes
        register_content_routes(app)
        logger.info("Content generation routes registered")
        
        # Import assignment management module (without quick assignment buttons)
        from assignments import register_assignment_routes
        register_assignment_routes(app)
        logger.info("Assignment management routes registered")
        
        # Import scheduling module and register routes (main focus)
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
        
        # Import AI endpoints if available (without quick features)
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
        
    except Exception as e:
        logger.error(f"Error registering routes: {str(e)}")
        raise
    
    logger.info("All essential routes registered successfully")
    return app

# Create the Flask app
app = create_app()

if __name__ == '__main__':
    # Get port from environment variable or use default
    port = int(os.getenv('PORT', 5000))
    app.run(debug=app.config['DEBUG'], port=port)
