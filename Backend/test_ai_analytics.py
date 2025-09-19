"""
Test script for AI Analytics system.
This script verifies that the AI analytics system is working correctly.
"""

import os
import sys
import logging
from dotenv import load_dotenv

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_gemini_connection():
    """Test connection to Gemini API"""
    try:
        from ai_analytics import initialize_ai_analytics
        initialize_ai_analytics()
        logger.info("✅ Gemini API connection successful")
        return True
    except Exception as e:
        logger.error(f"❌ Gemini API connection failed: {e}")
        return False

def test_ai_insights():
    """Test AI insights generation with sample data"""
    try:
        from ai_analytics import generate_ai_insights
        
        # Sample behavioral data
        sample_behavioral_data = {
            'summary': {
                'study_hours_per_week': 15,
                'task_completion_rate': 78,
                'consistency_score': 82,
                'schedule_following_rate': 65,
                'procrastination_level': 35,
                'focus_level': 75
            },
            'behavioral_insights': {
                'study_pattern_analysis': ['Morning learner', 'Consistent performer'],
                'behavioral_strengths': ['High task completion', 'Good time management'],
                'improvement_areas': ['Schedule adherence', 'Focus duration']
            }
        }
        
        # Sample quiz stats
        sample_quiz_stats = {
            'total_quizzes': 12,
            'average_score': 78.5,
            'performance_level': 'Good',
            'total_time_spent_hours': 8.5
        }
        
        # Sample subject performance
        sample_subject_performance = [
            {'subject': 'Mathematics', 'avg_score': 85, 'quiz_count': 5},
            {'subject': 'Science', 'avg_score': 72, 'quiz_count': 4},
            {'subject': 'History', 'avg_score': 68, 'quiz_count': 3}
        ]
        
        insights = generate_ai_insights(
            sample_behavioral_data, 
            sample_quiz_stats, 
            sample_subject_performance, 
            'test_user_123'
        )
        
        if 'error' not in insights:
            logger.info("✅ AI insights generation successful")
            logger.info(f"Generated insights with {len(insights)} main sections")
            return True
        else:
            logger.error(f"❌ AI insights generation failed: {insights.get('error')}")
            return False
            
    except Exception as e:
        logger.error(f"❌ AI insights test failed: {e}")
        return False

def test_ai_predictions():
    """Test AI predictions generation"""
    try:
        from ai_analytics import generate_ai_predictions
        
        # Sample data for predictions
        sample_behavioral_data = {
            'summary': {
                'study_hours_per_week': 20,
                'task_completion_rate': 85,
                'consistency_score': 78,
                'schedule_following_rate': 72,
                'performance_trend': 'improving'
            }
        }
        
        sample_quiz_stats = {
            'average_score': 82,
            'total_quizzes': 15
        }
        
        predictions = generate_ai_predictions(
            sample_behavioral_data,
            sample_quiz_stats,
            'test_user_123'
        )
        
        if 'error' not in predictions:
            logger.info("✅ AI predictions generation successful")
            return True
        else:
            logger.error(f"❌ AI predictions generation failed: {predictions.get('error')}")
            return False
            
    except Exception as e:
        logger.error(f"❌ AI predictions test failed: {e}")
        return False

def test_study_strategy():
    """Test AI study strategy generation"""
    try:
        from ai_analytics import generate_ai_study_strategy
        
        # Sample data for study strategy
        sample_behavioral_data = {
            'summary': {
                'study_hours_per_week': 18,
                'task_completion_rate': 75,
                'consistency_score': 80
            },
            'activity_patterns': {
                'scheduling_patterns': {
                    'morning': 5,
                    'afternoon': 8,
                    'evening': 3
                }
            }
        }
        
        sample_quiz_stats = {
            'average_score': 76,
            'performance_level': 'Good'
        }
        
        sample_subject_performance = [
            {'subject': 'Math', 'avg_score': 85},
            {'subject': 'English', 'avg_score': 70}
        ]
        
        strategy = generate_ai_study_strategy(
            sample_behavioral_data,
            sample_quiz_stats,
            sample_subject_performance,
            'improve_overall',
            'test_user_123'
        )
        
        if 'error' not in strategy:
            logger.info("✅ AI study strategy generation successful")
            return True
        else:
            logger.error(f"❌ AI study strategy generation failed: {strategy.get('error')}")
            return False
            
    except Exception as e:
        logger.error(f"❌ AI study strategy test failed: {e}")
        return False

def run_all_tests():
    """Run all AI analytics tests"""
    logger.info("🧪 Starting AI Analytics System Tests")
    logger.info("=" * 50)
    
    tests = [
        ("Gemini API Connection", test_gemini_connection),
        ("AI Insights Generation", test_ai_insights), 
        ("AI Predictions Generation", test_ai_predictions),
        ("AI Study Strategy Generation", test_study_strategy)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        logger.info(f"\n🔍 Testing: {test_name}")
        if test_func():
            passed += 1
        
    logger.info("\n" + "=" * 50)
    logger.info(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        logger.info("🎉 All tests passed! AI Analytics system is ready.")
    else:
        logger.warning(f"⚠️  {total - passed} test(s) failed. Check the issues above.")
    
    return passed == total

def check_prerequisites():
    """Check system prerequisites"""
    logger.info("🔍 Checking Prerequisites")
    logger.info("-" * 30)
    
    # Check environment variable
    gemini_key = os.getenv('GEMINI_API_KEY')
    if gemini_key:
        logger.info("✅ GEMINI_API_KEY found in environment")
    else:
        logger.error("❌ GEMINI_API_KEY not found in environment")
        logger.error("   Please add GEMINI_API_KEY=your_key_here to your .env file")
        return False
    
    # Check imports
    try:
        import google.generativeai as genai
        logger.info("✅ google-generativeai package available")
    except ImportError:
        logger.error("❌ google-generativeai package not found")
        logger.error("   Please install: pip install google-generativeai")
        return False
    
    # Check database connections (basic check)
    try:
        from database import users_collection
        logger.info("✅ Database connection available")
    except ImportError as e:
        logger.error(f"❌ Database connection issue: {e}")
        return False
    
    logger.info("✅ All prerequisites met")
    return True

if __name__ == "__main__":
    print("🤖 AI Analytics System Test Suite")
    print("==================================")
    
    # First check prerequisites
    if not check_prerequisites():
        print("\n❌ Prerequisites not met. Please fix the issues above and try again.")
        sys.exit(1)
    
    # Run tests
    success = run_all_tests()
    
    if success:
        print("\n🚀 AI Analytics system is ready for use!")
        print("\nNext steps:")
        print("1. Test the API endpoints using your frontend or tools like Postman")
        print("2. Check the AI_ANALYTICS_GUIDE.md for usage examples")
        print("3. Monitor the logs for any issues during normal operation")
    else:
        print("\n⚠️  Some tests failed. Please check the logs and fix the issues.")
        sys.exit(1)
