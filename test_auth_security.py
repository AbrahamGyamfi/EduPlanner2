#!/usr/bin/env python3
"""
EduMaster Authentication & Security Test Suite
==============================================
This script tests the login/signup functionality and security measures.
"""

import requests
import json
import hashlib
import time
import random
import string
from typing import Dict, List, Tuple

class AuthSecurityTester:
    def __init__(self, base_url: str = "http://127.0.0.1:5000"):
        self.base_url = base_url
        self.session = requests.Session()
        self.test_results = []
        
    def log_result(self, test_name: str, passed: bool, message: str = ""):
        """Log test result"""
        status = "✅ PASSED" if passed else "❌ FAILED"
        self.test_results.append({
            'test': test_name,
            'passed': passed,
            'message': message
        })
        print(f"{status}: {test_name}")
        if message:
            print(f"   📝 {message}")
        print()

    def test_server_health(self) -> bool:
        """Test if backend server is running"""
        try:
            response = self.session.get(f"{self.base_url}/")
            if response.status_code == 200:
                self.log_result("Server Health Check", True, "Backend server is running")
                return True
            else:
                self.log_result("Server Health Check", False, f"Server returned {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Server Health Check", False, f"Cannot connect to server: {str(e)}")
            return False

    def test_signup_functionality(self) -> Tuple[bool, Dict]:
        """Test user signup functionality"""
        # Generate random test user
        test_user = {
            "firstname": "Test",
            "lastname": "User",
            "studentId": f"STU{random.randint(1000, 9999)}",
            "email": f"test{random.randint(1000, 9999)}@example.com",
            "password": "SecurePass123!"
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/signup",
                json=test_user,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 201:
                self.log_result("User Signup", True, f"User created successfully: {test_user['email']}")
                return True, test_user
            else:
                error_msg = response.text if response.text else f"Status code: {response.status_code}"
                self.log_result("User Signup", False, f"Signup failed: {error_msg}")
                return False, test_user
        except Exception as e:
            self.log_result("User Signup", False, f"Exception during signup: {str(e)}")
            return False, test_user

    def test_login_functionality(self, user_data: Dict) -> bool:
        """Test user login functionality"""
        login_data = {
            "email": user_data["email"],
            "password": user_data["password"]
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/login",
                json=login_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "success":
                    self.log_result("User Login", True, f"Login successful for: {user_data['email']}")
                    return True
                else:
                    self.log_result("User Login", False, f"Login failed: {data.get('message', 'Unknown error')}")
                    return False
            else:
                error_msg = response.text if response.text else f"Status code: {response.status_code}"
                self.log_result("User Login", False, f"Login request failed: {error_msg}")
                return False
        except Exception as e:
            self.log_result("User Login", False, f"Exception during login: {str(e)}")
            return False

    def test_invalid_login(self) -> bool:
        """Test login with invalid credentials"""
        invalid_data = {
            "email": "nonexistent@example.com",
            "password": "wrongpassword"
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/login",
                json=invalid_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 401:
                self.log_result("Invalid Login Protection", True, "System correctly rejected invalid credentials")
                return True
            else:
                self.log_result("Invalid Login Protection", False, f"Expected 401, got {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Invalid Login Protection", False, f"Exception: {str(e)}")
            return False

    def test_duplicate_email_signup(self, existing_email: str) -> bool:
        """Test signup with duplicate email"""
        duplicate_user = {
            "firstname": "Duplicate",
            "lastname": "User",
            "studentId": "DUP123",
            "email": existing_email,
            "password": "AnotherPass123!"
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/signup",
                json=duplicate_user,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 400:
                self.log_result("Duplicate Email Protection", True, "System correctly rejected duplicate email")
                return True
            else:
                self.log_result("Duplicate Email Protection", False, f"Expected 400, got {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Duplicate Email Protection", False, f"Exception: {str(e)}")
            return False

    def test_sql_injection_attempts(self) -> bool:
        """Test for SQL injection vulnerabilities"""
        sql_payloads = [
            "' OR '1'='1",
            "'; DROP TABLE users; --",
            "' UNION SELECT * FROM users --",
            "admin'--",
            "' OR 1=1#"
        ]
        
        all_protected = True
        for payload in sql_payloads:
            try:
                malicious_data = {
                    "email": payload,
                    "password": payload
                }
                
                response = self.session.post(
                    f"{self.base_url}/login",
                    json=malicious_data,
                    headers={"Content-Type": "application/json"}
                )
                
                # Should not succeed with malicious payload
                if response.status_code == 200:
                    data = response.json()
                    if data.get("status") == "success":
                        all_protected = False
                        break
                        
            except Exception:
                # Exceptions are expected with malformed requests
                continue
        
        if all_protected:
            self.log_result("SQL Injection Protection", True, "No SQL injection vulnerabilities found")
        else:
            self.log_result("SQL Injection Protection", False, "Potential SQL injection vulnerability detected")
        
        return all_protected

    def test_password_security(self) -> bool:
        """Test password security measures"""
        weak_passwords = [
            "123",
            "password",
            "abc",
            "",
            "12345678"
        ]
        
        security_issues = []
        
        for weak_pass in weak_passwords:
            test_user = {
                "firstname": "Weak",
                "lastname": "Password",
                "studentId": f"WEAK{random.randint(100, 999)}",
                "email": f"weak{random.randint(1000, 9999)}@example.com",
                "password": weak_pass
            }
            
            try:
                response = self.session.post(
                    f"{self.base_url}/signup",
                    json=test_user,
                    headers={"Content-Type": "application/json"}
                )
                
                # If weak password is accepted, it's a security issue
                if response.status_code == 201:
                    security_issues.append(f"Weak password '{weak_pass}' was accepted")
            except Exception:
                continue
        
        if not security_issues:
            self.log_result("Password Security", True, "Strong password requirements enforced")
            return True
        else:
            self.log_result("Password Security", False, f"Issues found: {', '.join(security_issues)}")
            return False

    def test_rate_limiting(self) -> bool:
        """Test for rate limiting on login attempts"""
        test_data = {
            "email": "test@ratelimit.com",
            "password": "wrongpassword"
        }
        
        # Make rapid login attempts
        failed_attempts = 0
        rate_limited = False
        
        for i in range(10):
            try:
                response = self.session.post(
                    f"{self.base_url}/login",
                    json=test_data,
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code == 429:  # Too Many Requests
                    rate_limited = True
                    break
                elif response.status_code == 401:
                    failed_attempts += 1
                    
                time.sleep(0.1)  # Small delay between requests
            except Exception:
                continue
        
        if rate_limited:
            self.log_result("Rate Limiting", True, "Rate limiting is implemented")
            return True
        else:
            self.log_result("Rate Limiting", False, "No rate limiting detected - potential security risk")
            return False

    def test_cors_configuration(self) -> bool:
        """Test CORS configuration"""
        try:
            response = self.session.options(f"{self.base_url}/login")
            cors_headers = {
                'Access-Control-Allow-Origin',
                'Access-Control-Allow-Methods',
                'Access-Control-Allow-Headers'
            }
            
            found_headers = set(response.headers.keys())
            has_cors = bool(cors_headers.intersection(found_headers))
            
            if has_cors:
                origin = response.headers.get('Access-Control-Allow-Origin', '')
                if origin == '*':
                    self.log_result("CORS Security", False, "Wildcard CORS origin detected - security risk")
                    return False
                else:
                    self.log_result("CORS Security", True, f"CORS properly configured: {origin}")
                    return True
            else:
                self.log_result("CORS Security", False, "CORS headers not found")
                return False
        except Exception as e:
            self.log_result("CORS Security", False, f"Error testing CORS: {str(e)}")
            return False

    def test_session_security(self, user_data: Dict) -> bool:
        """Test session security measures"""
        # First login to get session
        login_data = {
            "email": user_data["email"],
            "password": user_data["password"]
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/login",
                json=login_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                # Check for secure session cookies
                cookies = response.cookies
                secure_flags = []
                
                for cookie in cookies:
                    if cookie.secure:
                        secure_flags.append("Secure")
                    if hasattr(cookie, 'httponly') and cookie.httponly:
                        secure_flags.append("HttpOnly")
                
                if secure_flags:
                    self.log_result("Session Security", True, f"Secure cookie flags found: {', '.join(secure_flags)}")
                    return True
                else:
                    # For development, this might be expected
                    self.log_result("Session Security", False, "No secure cookie flags - consider for production")
                    return False
            else:
                self.log_result("Session Security", False, "Could not establish session for testing")
                return False
        except Exception as e:
            self.log_result("Session Security", False, f"Error testing session: {str(e)}")
            return False

    def run_comprehensive_test(self):
        """Run all authentication and security tests"""
        print("🔐 EduMaster Authentication & Security Test Suite")
        print("=" * 60)
        print()
        
        # 1. Server Health Check
        if not self.test_server_health():
            print("❌ Cannot proceed - server is not running")
            return
        
        # 2. Test Signup
        signup_success, test_user = self.test_signup_functionality()
        
        # 3. Test Login (if signup succeeded)
        if signup_success:
            self.test_login_functionality(test_user)
            self.test_duplicate_email_signup(test_user["email"])
            self.test_session_security(test_user)
        
        # 4. Security Tests
        self.test_invalid_login()
        self.test_sql_injection_attempts()
        self.test_password_security()
        self.test_rate_limiting()
        self.test_cors_configuration()
        
        # Summary
        print("=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result['passed'])
        total = len(self.test_results)
        
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {total - passed}")
        print(f"📈 Success Rate: {(passed/total)*100:.1f}%")
        print()
        
        # Show failed tests
        failed_tests = [result for result in self.test_results if not result['passed']]
        if failed_tests:
            print("🚨 FAILED TESTS:")
            for test in failed_tests:
                print(f"   • {test['test']}: {test['message']}")
            print()
        
        print("🔒 SECURITY RECOMMENDATIONS:")
        print("   • Implement password complexity requirements")
        print("   • Add rate limiting for login attempts")
        print("   • Use HTTPS in production")
        print("   • Implement JWT tokens for session management")
        print("   • Add input validation and sanitization")
        print("   • Consider implementing 2FA")
        print("   • Add logging for security events")

if __name__ == "__main__":
    tester = AuthSecurityTester()
    tester.run_comprehensive_test()
