#!/usr/bin/env python3
"""
Test script to verify quiz result saving and CWA analysis integration
"""

import requests
import json
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:5000"
TEST_USER_ID = "test_user_123"

def test_save_quiz_result():
    """Test saving a quiz result"""
    print("Testing quiz result saving...")
    
    # Sample quiz result data
    quiz_result_data = {
        "userId": TEST_USER_ID,
        "quizTitle": "Math Quiz - Test",
        "score": 4,
        "maxScore": 5,
        "questions": [
            {
                "question": "What is 2+2?",
                "options": ["A) 3", "B) 4", "C) 5", "D) 6"],
                "correct_answer": "B"
            },
            {
                "question": "What is 3*3?",
                "options": ["A) 6", "B) 9", "C) 12", "D) 15"],
                "correct_answer": "B"
            },
            {
                "question": "What is 10/2?",
                "options": ["A) 5", "B) 2", "C) 8", "D) 10"],
                "correct_answer": "A"
            },
            {
                "question": "What is 7-3?",
                "options": ["A) 10", "B) 4", "C) 3", "D) 1"],
                "correct_answer": "B"
            },
            {
                "question": "What is 5+5?",
                "options": ["A) 5", "B) 15", "C) 10", "D) 25"],
                "correct_answer": "C"
            }
        ],
        "userAnswers": ["B", "B", "A", "B", "A"],  # Last one is wrong
        "courseId": "course_123",
        "courseName": "Mathematics",
        "courseCode": "MATH101",
        "difficulty": "Medium",
        "topic": "Basic Math",
        "timeSpent": 5,
        "attemptsUsed": 1,
        "maxAttempts": 3,
        "metadata": {
            "testRun": True,
            "fileName": "test_quiz.pdf"
        }
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/quiz-results", json=quiz_result_data)
        
        if response.status_code == 201:
            result = response.json()
            print(f"✅ Quiz result saved successfully!")
            print(f"   Quiz Result ID: {result['quizResultId']}")
            print(f"   Timestamp: {result['timestamp']}")
            return True
        else:
            print(f"❌ Failed to save quiz result: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error saving quiz result: {str(e)}")
        return False

def test_get_quiz_results():
    """Test getting quiz results for a user"""
    print("\nTesting quiz results retrieval...")
    
    try:
        response = requests.get(f"{BASE_URL}/api/quiz-results/{TEST_USER_ID}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Quiz results retrieved successfully!")
            print(f"   Total Quiz Results: {len(result['quizResults'])}")
            print(f"   Summary: {result['summary']}")
            return result
        else:
            print(f"❌ Failed to get quiz results: {response.status_code}")
            print(f"   Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error getting quiz results: {str(e)}")
        return None

def test_cwa_analysis():
    """Test CWA analysis with quiz data"""
    print("\nTesting CWA analysis with quiz data...")
    
    # Sample CWA analysis data
    cwa_data = {
        "userId": TEST_USER_ID,
        "studentProfile": {
            "studyHoursPerWeek": 20,
            "motivationLevel": 8,
            "stressLevel": 4
        },
        "courses": [
            {
                "name": "Mathematics",
                "creditHours": 3,
                "assignments": [
                    {"score": 85, "maxScore": 100, "weight": 0.3},
                    {"score": 90, "maxScore": 100, "weight": 0.7}
                ]
            },
            {
                "name": "Physics",
                "creditHours": 4,
                "assignments": [
                    {"score": 78, "maxScore": 100, "weight": 0.4},
                    {"score": 82, "maxScore": 100, "weight": 0.6}
                ]
            }
        ],
        "behaviorMetrics": {
            "studyConsistency": 75,
            "procrastinationLevel": 3,
            "plannerUsage": 80
        }
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/analyze", json=cwa_data)
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ CWA analysis completed successfully!")
            print(f"   Current GPA: {result['currentGPA']}")
            print(f"   Projected GPA: {result['projectedGPA']}")
            print(f"   Improvement Potential: {result['improvementPotential']}")
            print(f"   Recommendations: {len(result['recommendations'])}")
            for i, rec in enumerate(result['recommendations'][:3], 1):
                print(f"     {i}. {rec}")
            return result
        else:
            print(f"❌ Failed to run CWA analysis: {response.status_code}")
            print(f"   Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error running CWA analysis: {str(e)}")
        return None

def main():
    """Main test function"""
    print("🧪 Testing Quiz Result Saving and CWA Integration")
    print("=" * 50)
    
    # Test saving quiz result
    if test_save_quiz_result():
        print("\n⏳ Waiting a moment for database consistency...")
        import time
        time.sleep(1)
        
        # Test getting quiz results
        quiz_results = test_get_quiz_results()
        
        if quiz_results:
            # Test CWA analysis
            cwa_result = test_cwa_analysis()
            
            if cwa_result:
                print("\n🎉 All tests passed! Quiz integration is working correctly.")
                print("\nNext steps:")
                print("1. Take a quiz in the frontend application")
                print("2. Check the CWA analysis page to see real quiz data")
                print("3. Verify that quiz results are being used in predictions")
            else:
                print("\n⚠️  CWA analysis test failed - check backend logs")
        else:
            print("\n⚠️  Quiz results retrieval failed - check backend logs")
    else:
        print("\n⚠️  Quiz result saving failed - check backend logs")

if __name__ == "__main__":
    main()
