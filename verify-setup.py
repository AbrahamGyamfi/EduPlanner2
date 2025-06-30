#!/usr/bin/env python3
"""
EduMaster Setup Verification Script
This script checks if all dependencies and configuration are correct.
"""

import os
import sys
import json
import subprocess
from pathlib import Path

def check_python_packages():
    """Check if all required Python packages are installed."""
    required_packages = [
        'flask', 'flask_cors', 'pymongo', 'bcrypt', 
        'dotenv', 'werkzeug', 'PyPDF2', 
        'flask_restful', 'requests'
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package)
            print(f"✅ {package} is installed")
        except ImportError:
            missing_packages.append(package)
            print(f"❌ {package} is missing")
    
    return len(missing_packages) == 0

def check_env_file():
    """Check if .env file exists and has required variables."""
    env_path = Path('Backend/.env')
    
    if not env_path.exists():
        print("❌ .env file not found in Backend directory")
        return False
    
    try:
        with open(env_path, 'r') as f:
            env_content = f.read()
        
        required_vars = ['GEMINI_API_KEY', 'MONGODB_URI', 'DATABASE_NAME']
        missing_vars = []
        
        for var in required_vars:
            if var not in env_content:
                missing_vars.append(var)
        
        if missing_vars:
            print(f"❌ Missing environment variables: {', '.join(missing_vars)}")
            return False
        else:
            print("✅ .env file contains all required variables")
            return True
            
    except Exception as e:
        print(f"❌ Error reading .env file: {e}")
        return False

def check_gemini_api():
    """Test the Gemini API key."""
    try:
        from dotenv import load_dotenv
        load_dotenv('Backend/.env')
        
        api_key = os.getenv('GEMINI_API_KEY')
        
        if not api_key:
            print("❌ GEMINI_API_KEY not found in environment")
            return False
        
        if len(api_key) < 30:
            print("❌ GEMINI_API_KEY appears to be invalid (too short)")
            return False
        
        print(f"✅ Gemini API key found (length: {len(api_key)})")
        return True
        
    except Exception as e:
        print(f"❌ Error checking Gemini API key: {e}")
        return False

def check_node_modules():
    """Check if npm packages are installed."""
    node_modules_path = Path('FrontEnd/ai-study-planner/node_modules')
    
    if not node_modules_path.exists():
        print("❌ node_modules not found. Run 'npm install' in FrontEnd/ai-study-planner")
        return False
    
    package_json_path = Path('FrontEnd/ai-study-planner/package.json')
    
    if not package_json_path.exists():
        print("❌ package.json not found")
        return False
    
    try:
        with open(package_json_path, 'r') as f:
            package_data = json.load(f)
        
        dependencies = package_data.get('dependencies', {})
        
        key_dependencies = ['react', 'react-dom', 'axios', '@google/generative-ai']
        for dep in key_dependencies:
            if dep in dependencies:
                print(f"✅ {dep} is in package.json")
            else:
                print(f"❌ {dep} is missing from package.json")
        
        return True
        
    except Exception as e:
        print(f"❌ Error checking package.json: {e}")
        return False

def check_directories():
    """Check if all required directories exist."""
    required_dirs = [
        'Backend',
        'Backend/uploaded_slides',
        'FrontEnd/ai-study-planner/src',
        'FrontEnd/ai-study-planner/public'
    ]
    
    all_exist = True
    
    for dir_path in required_dirs:
        if Path(dir_path).exists():
            print(f"✅ {dir_path} directory exists")
        else:
            print(f"❌ {dir_path} directory missing")
            all_exist = False
    
    return all_exist

def check_backend_import():
    """Test if the backend server can be imported."""
    try:
        sys.path.append('Backend')
        import server
        print("✅ Backend server imports successfully")
        return True
    except Exception as e:
        print(f"❌ Backend import failed: {e}")
        return False

def main():
    """Run all verification checks."""
    print("🔍 EduMaster Setup Verification")
    print("=" * 40)
    
    checks = [
        ("Python Packages", check_python_packages),
        ("Directory Structure", check_directories),
        ("Environment File", check_env_file),
        ("Gemini API Key", check_gemini_api),
        ("Node Modules", check_node_modules),
        ("Backend Import", check_backend_import)
    ]
    
    passed = 0
    total = len(checks)
    
    for check_name, check_func in checks:
        print(f"\n📋 Checking {check_name}...")
        if check_func():
            passed += 1
        else:
            print(f"   ⚠️  {check_name} check failed")
    
    print("\n" + "=" * 40)
    print(f"🎯 Results: {passed}/{total} checks passed")
    
    if passed == total:
        print("🎉 All checks passed! Your EduMaster setup is ready!")
        print("\nTo start the application:")
        print("1. Start the backend: python Backend/server.py")
        print("2. Start the frontend: cd FrontEnd/ai-study-planner && npm start")
    else:
        print("❌ Some checks failed. Please address the issues above.")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
