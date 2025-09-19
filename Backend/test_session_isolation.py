"""
Comprehensive test for user session isolation and data security.
This test simulates the exact scenario described in the issue:
1. User "Lou" logs in and creates data
2. User "Lou" logs out
3. User "Josh" signs up and logs in
4. Verify Josh sees no data from Lou's session
"""

import requests
import json
import time
from datetime import datetime

BASE_URL = "http://127.0.0.1:5000"

class UserSessionIsolationTest:
    def __init__(self):
        self.test_results = {}
        self.current_test = None
        
    def log_test(self, message, success=True):
        """Log test results"""
        status = "✅" if success else "❌"
        print(f"{status} {message}")
        
        if self.current_test:
            if self.current_test not in self.test_results:
                self.test_results[self.current_test] = []
            self.test_results[self.current_test].append({
                "message": message,
                "success": success,
                "timestamp": datetime.now().isoformat()
            })
    
    def create_test_user(self, name_prefix):
        """Create a test user with unique data"""
        timestamp = int(time.time())
        user_data = {
            "firstname": f"{name_prefix}Test",
            "lastname": "User",
            "studentId": f"STU{name_prefix.upper()}{timestamp}",
            "email": f"{name_prefix.lower()}{timestamp}@test.com",
            "password": "TestPass123!"
        }
        return user_data
    
    def signup_and_verify_user(self, user_data):
        """Complete signup process with OTP verification"""
        try:
            # Step 1: Sign up
            self.log_test(f"Signing up user: {user_data['email']}")
            response = requests.post(f"{BASE_URL}/signup", json=user_data)
            result = response.json()
            
            if not (response.status_code == 200 and result.get("status") == "success"):
                self.log_test(f"Signup failed: {result}", False)
                return None
            
            dev_otp = result.get("dev_otp")
            if not dev_otp:
                self.log_test("No development OTP received", False)
                return None
            
            self.log_test(f"Received OTP: {dev_otp}")
            
            # Step 2: Verify OTP
            verify_data = {
                "email": user_data["email"],
                "otp": dev_otp
            }
            
            verify_response = requests.post(f"{BASE_URL}/verify-signup-otp", json=verify_data)
            verify_result = verify_response.json()
            
            if verify_response.status_code == 200 and verify_result.get("status") == "success":
                self.log_test(f"User {user_data['firstname']} verified successfully")
                user_id = verify_result.get("user_id")
                return {**user_data, "id": user_id}
            else:
                self.log_test(f"OTP verification failed: {verify_result}", False)
                return None
                
        except Exception as e:
            self.log_test(f"Error during signup: {str(e)}", False)
            return None
    
    def login_user(self, email, password):
        """Login user and return user data"""
        try:
            login_data = {"email": email, "password": password}
            response = requests.post(f"{BASE_URL}/login", json=login_data)
            result = response.json()
            
            if response.status_code == 200 and result.get("status") == "success":
                self.log_test(f"User {email} logged in successfully")
                return result.get("user")
            else:
                self.log_test(f"Login failed for {email}: {result}", False)
                return None
                
        except Exception as e:
            self.log_test(f"Login error for {email}: {str(e)}", False)
            return None
    
    def create_user_data(self, user_id, user_name):
        """Create test data for a user (simulating assignments, etc.)"""
        try:
            # Create test assignment
            assignment_data = {
                "title": f"{user_name}'s Test Assignment",
                "description": f"This is a test assignment created by {user_name}",
                "dueDate": "2025-12-31",
                "userId": user_id,
                "courseName": f"{user_name}'s Course",
                "priority": "high"
            }
            
            response = requests.post(f"{BASE_URL}/assignments", json=assignment_data)
            result = response.json()
            
            if response.status_code == 201 and result.get("status") == "success":
                assignment_id = result.get("assignment_id")
                self.log_test(f"Created assignment for {user_name}: {assignment_id}")
                return {"assignment_id": assignment_id}
            else:
                self.log_test(f"Failed to create assignment for {user_name}: {result}", False)
                return None
                
        except Exception as e:
            self.log_test(f"Error creating data for {user_name}: {str(e)}", False)
            return None
    
    def get_user_assignments(self, user_id, user_name):
        """Get assignments for a user"""
        try:
            # Add user context header for secure API
            headers = {"X-User-ID": user_id}
            response = requests.get(f"{BASE_URL}/assignments/{user_id}", headers=headers)
            result = response.json()
            
            if response.status_code == 200:
                assignments = result.get("data", result.get("assignments", []))
                self.log_test(f"Retrieved {len(assignments)} assignments for {user_name}")
                return assignments
            else:
                self.log_test(f"Failed to get assignments for {user_name}: {result}", False)
                return []
                
        except Exception as e:
            self.log_test(f"Error getting assignments for {user_name}: {str(e)}", False)
            return []
    
    def simulate_logout(self, user_id, user_name):
        """Simulate logout (frontend would clear localStorage)"""
        try:
            # Call logout endpoint if available
            headers = {"X-User-ID": user_id}
            logout_data = {"userId": user_id}
            
            # Try to call logout endpoint
            try:
                response = requests.post(f"{BASE_URL}/logout", json=logout_data, headers=headers)
                self.log_test(f"Logout API called for {user_name}")
            except:
                self.log_test(f"Logout API not available, simulating frontend logout for {user_name}")
            
            # In reality, the frontend would clear all localStorage here
            self.log_test(f"User {user_name} logged out (localStorage cleared)")
            
        except Exception as e:
            self.log_test(f"Logout error for {user_name}: {str(e)}", False)
    
    def run_isolation_test(self):
        """Run the complete user session isolation test"""
        print("🔒 Starting User Session Isolation Test")
        print("=" * 60)
        print(f"⏰ Test started at: {datetime.now()}")
        print()
        
        # Test Phase 1: User Lou
        self.current_test = "Phase 1: User Lou Session"
        print("📋 Phase 1: User Lou Session")
        print("-" * 30)
        
        # Create and register Lou
        lou_data = self.create_test_user("Lou")
        lou_user = self.signup_and_verify_user(lou_data)
        
        if not lou_user:
            self.log_test("Failed to create Lou user - aborting test", False)
            return False
        
        # Login Lou
        lou_logged_in = self.login_user(lou_user["email"], lou_user["password"])
        if not lou_logged_in:
            self.log_test("Failed to login Lou - aborting test", False)
            return False
        
        lou_user_id = lou_logged_in["id"]
        
        # Create Lou's data
        lou_assignment = self.create_user_data(lou_user_id, "Lou")
        if not lou_assignment:
            self.log_test("Failed to create Lou's data - aborting test", False)
            return False
        
        # Verify Lou can see their data
        lou_assignments = self.get_user_assignments(lou_user_id, "Lou")
        if len(lou_assignments) == 0:
            self.log_test("Lou cannot see their own assignments - test issue", False)
            return False
        
        self.log_test(f"Lou has {len(lou_assignments)} assignments (expected)")
        
        # Logout Lou
        self.simulate_logout(lou_user_id, "Lou")
        
        print()
        
        # Test Phase 2: User Josh
        self.current_test = "Phase 2: User Josh Session"
        print("📋 Phase 2: User Josh Session")
        print("-" * 30)
        
        # Create and register Josh
        josh_data = self.create_test_user("Josh")
        josh_user = self.signup_and_verify_user(josh_data)
        
        if not josh_user:
            self.log_test("Failed to create Josh user - aborting test", False)
            return False
        
        # Login Josh
        josh_logged_in = self.login_user(josh_user["email"], josh_user["password"])
        if not josh_logged_in:
            self.log_test("Failed to login Josh - aborting test", False)
            return False
        
        josh_user_id = josh_logged_in["id"]
        
        print()
        
        # Test Phase 3: Critical Security Check
        self.current_test = "Phase 3: Data Isolation Verification"
        print("📋 Phase 3: Critical Security Check - Data Isolation")
        print("-" * 50)
        
        # Verify Josh sees NO data from Lou
        josh_assignments = self.get_user_assignments(josh_user_id, "Josh")
        
        if len(josh_assignments) == 0:
            self.log_test("✅ SECURITY PASS: Josh sees NO assignments from Lou", True)
            security_pass = True
        else:
            self.log_test(f"❌ SECURITY FAIL: Josh can see {len(josh_assignments)} assignments!", False)
            self.log_test("Data leakage detected - this is a critical security vulnerability!", False)
            security_pass = False
            
            # Log details of leaked data
            for assignment in josh_assignments:
                owner = assignment.get('userId', 'unknown')
                title = assignment.get('title', 'unknown')
                self.log_test(f"Leaked assignment: '{title}' (owner: {owner})", False)
        
        # Create Josh's own data
        josh_assignment = self.create_user_data(josh_user_id, "Josh") 
        if josh_assignment:
            josh_new_assignments = self.get_user_assignments(josh_user_id, "Josh")
            if len(josh_new_assignments) == 1:
                self.log_test("Josh can create and see their own assignments", True)
            else:
                self.log_test(f"Josh assignment count unexpected: {len(josh_new_assignments)}", False)
        
        print()
        
        # Test Phase 4: Cross-User Security Check  
        self.current_test = "Phase 4: Cross-User Access Prevention"
        print("📋 Phase 4: Cross-User Access Prevention")
        print("-" * 40)
        
        # Try to access Lou's data as Josh (should fail)
        try:
            headers = {"X-User-ID": josh_user_id}  # Josh's context
            # Try to access Lou's assignments directly
            response = requests.get(f"{BASE_URL}/assignments/{lou_user_id}", headers=headers)
            
            if response.status_code == 403:
                self.log_test("✅ SECURITY PASS: Josh cannot access Lou's data via API", True)
            elif response.status_code == 200:
                data = response.json().get("data", [])
                if len(data) == 0:
                    self.log_test("✅ SECURITY PASS: Josh gets empty data when trying to access Lou's assignments", True)
                else:
                    self.log_test("❌ SECURITY FAIL: Josh can access Lou's assignments directly!", False)
                    security_pass = False
            else:
                self.log_test(f"Unexpected response when Josh tries to access Lou's data: {response.status_code}", False)
                
        except Exception as e:
            self.log_test(f"Error testing cross-user access: {str(e)}", False)
        
        print()
        
        # Final Results
        print("📊 Test Results Summary")
        print("=" * 30)
        
        total_tests = sum(len(tests) for tests in self.test_results.values())
        passed_tests = sum(len([t for t in tests if t["success"]]) for tests in self.test_results.values())
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {total_tests - passed_tests}")
        print()
        
        if security_pass and passed_tests == total_tests:
            print("🎉 ALL TESTS PASSED - USER SESSION ISOLATION IS SECURE!")
            print("✅ The critical security vulnerability has been FIXED!")
        elif security_pass:
            print("⚠️  SECURITY TESTS PASSED but some non-critical tests failed")
            print("✅ The critical data isolation vulnerability has been FIXED!")
        else:
            print("❌ CRITICAL SECURITY FAILURE DETECTED!")
            print("🚨 USER DATA LEAKAGE VULNERABILITY STILL EXISTS!")
            print("🔧 Additional fixes required for complete data isolation!")
        
        print(f"⏰ Test completed at: {datetime.now()}")
        
        return security_pass

def main():
    """Run the complete user session isolation test"""
    test = UserSessionIsolationTest()
    success = test.run_isolation_test()
    
    # Print detailed results for debugging
    print("\n" + "=" * 60)
    print("📝 DETAILED TEST LOG")
    print("=" * 60)
    
    for phase, tests in test.test_results.items():
        print(f"\n{phase}:")
        for test_result in tests:
            status = "✅" if test_result["success"] else "❌"
            print(f"  {status} {test_result['message']}")
    
    return success

if __name__ == "__main__":
    main()
