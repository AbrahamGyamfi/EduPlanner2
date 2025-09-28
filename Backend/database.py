"""
Database configuration and connection setup for EduMaster application.
This module handles MongoDB connection and collection initialization.
"""

import os
import logging
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Create logger instance
logger = logging.getLogger(__name__)

class DatabaseManager:
    """Manages MongoDB connection and collections"""
    
    def __init__(self):
        self.client = None
        self.db = None
        self.collections = {}
        self._initialize_connection()
    
    def _initialize_connection(self):
        """Initialize MongoDB connection"""
        try:
            # MongoDB configuration from environment variables
            mongodb_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
            database_name = os.getenv('DATABASE_NAME', 'eduplanner')
            
            self.client = MongoClient(mongodb_uri)
            self.db = self.client[database_name]
            
            # Initialize all collections
            self._initialize_collections()
            
            logger.info(f"Connected to MongoDB database: {database_name}")
            
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {str(e)}")
            raise
    
    def _initialize_collections(self):
        """Initialize all MongoDB collections"""
        collection_names = [
            'users',
            'files',
            'assignments',
            'notifications',
            'scheduled_activities',
            'schedules',
            'quizzes',
            'quiz_results',
            'summaries',
            'activities',
            'study_sessions'
        ]
        
        for name in collection_names:
            self.collections[name] = self.db[name]
        
        logger.info("All collections initialized successfully")
    
    def get_collection(self, name):
        """Get a specific collection"""
        if name not in self.collections:
            logger.error(f"Collection '{name}' not found")
            return None
        return self.collections[name]
    
    def close_connection(self):
        """Close MongoDB connection"""
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed")
    
    # Properties for easy access to collections
    @property
    def users_collection(self):
        return self.collections['users']
    
    @property
    def files_collection(self):
        return self.collections['files']
    
    @property
    def assignments_collection(self):
        return self.collections['assignments']
    
    @property
    def notifications_collection(self):
        return self.collections['notifications']
    
    @property
    def scheduled_activities_collection(self):
        return self.collections['scheduled_activities']
    
    @property
    def schedules_collection(self):
        return self.collections['schedules']
    
    @property
    def quizzes_collection(self):
        return self.collections['quizzes']
    
    @property
    def summaries_collection(self):
        return self.collections['summaries']
    
    @property
    def activities_collection(self):
        return self.collections['activities']
    
    @property
    def study_sessions_collection(self):
        return self.collections['study_sessions']
    
    @property
    def quiz_results_collection(self):
        return self.collections['quiz_results']

# Global database manager instance
db_manager = DatabaseManager()

# Export collections for backward compatibility
users_collection = db_manager.users_collection
files_collection = db_manager.files_collection
assignments_collection = db_manager.assignments_collection
notifications_collection = db_manager.notifications_collection
scheduled_activities_collection = db_manager.scheduled_activities_collection
schedules_collection = db_manager.schedules_collection
quizzes_collection = db_manager.quizzes_collection
summaries_collection = db_manager.summaries_collection
activities_collection = db_manager.activities_collection
study_sessions_collection = db_manager.study_sessions_collection
quiz_results_collection = db_manager.quiz_results_collection
