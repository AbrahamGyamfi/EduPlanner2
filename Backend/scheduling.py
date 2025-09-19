"""
Scheduling module for EduMaster application.
This module coordinates all scheduling functionality by importing and registering
routes from specialized sub-modules.
"""

import logging

logger = logging.getLogger(__name__)

def register_scheduling_routes(app):
    """Register all scheduling routes with the Flask app"""
    try:
        # Import and register core schedule operations
        from schedule_core import register_schedule_core_routes
        register_schedule_core_routes(app)
        logger.info("Schedule core routes registered successfully")
        
        # Import and register export functionality
        from schedule_export import register_schedule_export_routes
        register_schedule_export_routes(app)
        logger.info("Schedule export routes registered successfully")
        
        # Import and register import functionality
        from schedule_import import register_schedule_import_routes
        register_schedule_import_routes(app)
        logger.info("Schedule import routes registered successfully")
        
        # Import and register template management
        from schedule_templates import register_schedule_templates_routes
        register_schedule_templates_routes(app)
        logger.info("Schedule templates routes registered successfully")
        
        # Import and register activity management
        from schedule_activities import register_schedule_activities_routes
        register_schedule_activities_routes(app)
        logger.info("Schedule activities routes registered successfully")
        
        logger.info("All scheduling routes registered successfully")
        
    except Exception as e:
        logger.error(f"Error registering scheduling routes: {str(e)}")
        raise
