#!/usr/bin/env python3
"""
Test script to verify EduMaster functionality
"""

import requests
import json
import os
import time
from pathlib import Path

BASE_URL = "http://localhost:5000"

def test_backend_health():
    """Test if backend is running"""
    try:
        response = requests.get(f"{BASE_URL}/slides", timeout=5)
        print("✅ Backend is running")
        return True
    except requests.exceptions.RequestException:
        print("❌ Backend is not running. Please start the backend first.")
        return False

def test_file_upload():
    """Test file upload functionality"""
    print("\n📁 Testing file upload...")
    
    # Create a test text file
    test_content = """
    This is a test document for EduMaster.
    
    Topic: Introduction to Programming
    
    Programming is the process of creating instructions for computers to execute.
    It involves writing code in various programming languages such as Python, JavaScript, and Java.
    
    Key concepts include:
    - Variables and data types
    - Control structures (loops, conditionals)
    - Functions and procedures
    - Object-oriented programming
    
    Programming helps solve complex problems by breaking them down into smaller, manageable tasks.
    """
    
    test_file_path = Path("test_document.txt")
    with open(test_file_path, 'w') as f:
        f.write(test_content)
    
    try:
        # Test different endpoints to debug
        print("Testing available endpoints...")
        
        # Try to get slides first to see if endpoint exists
        try:
            slides_response = requests.get(f"{BASE_URL}/slides")
            print(f"GET /slides status: {slides_response.status_code}")
        except Exception as e:
            print(f"Error accessing /slides: {e}")
        
        with open(test_file_path, 'rb') as f:
            files = {'file': ('test_document.txt', f, 'text/plain')}
            response = requests.post(f"{BASE_URL}/upload-slide", files=files)
        
        print(f"Upload response status: {response.status_code}")
        print(f"Upload response headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            print("✅ File upload successful")
            return True
        else:
            print(f"❌ File upload failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ File upload error: {e}")
        return False
    finally:
        # Clean up test file
        if test_file_path.exists():
            test_file_path.unlink()

def test_summary_generation():
    """Test summary generation"""
    print("\n📝 Testing summary generation...")
    
    # First, get the list of uploaded files
    try:
        response = requests.get(f"{BASE_URL}/slides")
        if response.status_code != 200:
            print("❌ Could not get slides list")
            return False
        
        slides = response.json().get('slides', [])
        if not slides:
            print("❌ No slides available for testing")
            return False
        
        # Use the first slide for testing
        test_slide = slides[0]
        print(f"Testing with slide: {test_slide}")
        
        # Download the file and test summary generation
        slide_response = requests.get(f"{BASE_URL}/slides/{test_slide}")
        if slide_response.status_code != 200:
            print("❌ Could not download test slide")
            return False
        
        # Test summary generation
        files = {'file': (test_slide, slide_response.content)}
        summary_response = requests.post(f"{BASE_URL}/generate-summary", files=files)
        
        if summary_response.status_code == 200:
            result = summary_response.json()
            summary = result.get('summary', '')
            if summary and len(summary) > 10:
                print("✅ Summary generation successful")
                print(f"Generated summary: {summary[:100]}...")
                return True
            else:
                print("❌ Summary generation returned empty result")
                return False
        else:
            print(f"❌ Summary generation failed: {summary_response.status_code} - {summary_response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Summary generation error: {e}")
        return False

def test_quiz_generation():
    """Test quiz generation"""
    print("\n🎯 Testing quiz generation...")
    
    try:
        response = requests.get(f"{BASE_URL}/slides")
        if response.status_code != 200:
            print("❌ Could not get slides list")
            return False
        
        slides = response.json().get('slides', [])
        if not slides:
            print("❌ No slides available for testing")
            return False
        
        # Use the first slide for testing
        test_slide = slides[0]
        
        # Download the file and test quiz generation
        slide_response = requests.get(f"{BASE_URL}/slides/{test_slide}")
        if slide_response.status_code != 200:
            print("❌ Could not download test slide")
            return False
        
        # Test quiz generation
        files = {'file': (test_slide, slide_response.content)}
        quiz_response = requests.post(f"{BASE_URL}/generate-quiz", files=files)
        
        if quiz_response.status_code == 200:
            result = quiz_response.json()
            quiz = result.get('quiz', '')
            if quiz and len(quiz) > 10:
                print("✅ Quiz generation successful")
                print(f"Generated quiz: {quiz[:100]}...")
                return True
            else:
                print("❌ Quiz generation returned empty result")
                return False
        else:
            print(f"❌ Quiz generation failed: {quiz_response.status_code} - {quiz_response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Quiz generation error: {e}")
        return False

def test_file_deletion():
    """Test file deletion"""
    print("\n🗑️  Testing file deletion...")
    
    try:
        # Get current slides
        response = requests.get(f"{BASE_URL}/slides")
        if response.status_code != 200:
            print("❌ Could not get slides list")
            return False
        
        slides = response.json().get('slides', [])
        if not slides:
            print("❌ No slides available for deletion testing")
            return False
        
        # Delete the first slide
        test_slide = slides[0]
        delete_response = requests.delete(f"{BASE_URL}/slides/{test_slide}")
        
        if delete_response.status_code == 200:
            print(f"✅ File deletion successful: {test_slide}")
            
            # Verify the file is actually deleted
            time.sleep(1)  # Give server time to process
            updated_response = requests.get(f"{BASE_URL}/slides")
            if updated_response.status_code == 200:
                updated_slides = updated_response.json().get('slides', [])
                if test_slide not in updated_slides:
                    print("✅ File deletion verified")
                    return True
                else:
                    print("❌ File still exists after deletion")
                    return False
            else:
                print("❌ Could not verify deletion")
                return False
        else:
            print(f"❌ File deletion failed: {delete_response.status_code} - {delete_response.text}")
            return False
            
    except Exception as e:
        print(f"❌ File deletion error: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 EduMaster Functionality Test")
    print("=" * 40)
    
    tests = [
        ("Backend Health", test_backend_health),
        ("File Upload", test_file_upload),
        ("Summary Generation", test_summary_generation),
        ("Quiz Generation", test_quiz_generation),
        ("File Deletion", test_file_deletion)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n🔍 Running {test_name}...")
        if test_func():
            passed += 1
        else:
            print(f"   ⚠️  {test_name} test failed")
            # Don't continue if backend health fails
            if test_name == "Backend Health":
                break
    
    print("\n" + "=" * 40)
    print(f"🎯 Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! CourseDetails functionality is working correctly!")
    else:
        print("❌ Some tests failed. Check the error messages above.")
        return 1
    
    return 0

if __name__ == "__main__":
    import sys
    sys.exit(main())
