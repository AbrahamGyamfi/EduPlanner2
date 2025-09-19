"""
Test script to verify complete signup/signin flow with OTP verification
"""
import requests
import json
import time
import random
from datetime import datetime

BASE_URL = "http://127.0.0.1:5000"

def test_signup_flow():
    """Test the complete signup flow with OTP verification"""
    print("🔐 Testing Signup Flow")
    print("=" * 40)
    
    # Generate test user data
    timestamp = int(time.time())
    test_email = f"test{timestamp}@example.com"
    
    signup_data = {
        "firstname": "Test",
        "lastname": "User", 
        "studentId": f"STU{timestamp}",
        "email": test_email,
        "password": "TestPass123!"
    }
    
    print(f"📝 Signing up user: {test_email}")
    
    # Step 1: Sign up
    try:
        response = requests.post(f"{BASE_URL}/signup", json=signup_data)
        result = response.json()
        
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(result, indent=2)}")
        
        if response.status_code == 200 and result.get("status") == "success":
            print("✅ Signup successful - OTP sent")
            
            # Get OTP from development response if available
            dev_otp = result.get("dev_otp")
            if dev_otp:
                print(f"🔑 Development OTP: {dev_otp}")
                
                # Step 2: Verify OTP
                print("\n📧 Verifying OTP...")
                verify_data = {
                    "email": test_email,
                    "otp": dev_otp
                }
                
                verify_response = requests.post(f"{BASE_URL}/verify-signup-otp", json=verify_data)
                verify_result = verify_response.json()
                
                print(f"Verify Status: {verify_response.status_code}")
                print(f"Verify Response: {json.dumps(verify_result, indent=2)}")
                
                if verify_response.status_code == 200 and verify_result.get("status") == "success":
                    print("✅ Email verification successful")
                    return test_email, signup_data["password"]
                else:
                    print("❌ Email verification failed")
                    return None, None
            else:
                print("⚠️  No development OTP provided - check email manually")
                return test_email, signup_data["password"]
        else:
            print("❌ Signup failed")
            return None, None
            
    except Exception as e:
        print(f"❌ Signup error: {str(e)}")
        return None, None

def test_login_flow(email, password):
    """Test the login flow (password-based)"""
    print(f"\n🔑 Testing Password Login Flow")
    print("=" * 40)
    
    login_data = {
        "email": email,
        "password": password
    }
    
    try:
        print(f"🔐 Logging in user: {email}")
        response = requests.post(f"{BASE_URL}/login", json=login_data)
        result = response.json()
        
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(result, indent=2)}")
        
        if response.status_code == 200 and result.get("status") == "success":
            print("✅ Password login successful")
            return result.get("user")
        else:
            print("❌ Password login failed")
            return None
            
    except Exception as e:
        print(f"❌ Login error: {str(e)}")
        return None

def test_otp_login_flow(email):
    """Test the OTP login flow"""
    print(f"\n📧 Testing OTP Login Flow")
    print("=" * 40)
    
    # Step 1: Request login OTP
    try:
        print(f"📤 Requesting login OTP for: {email}")
        response = requests.post(f"{BASE_URL}/request-login-otp", json={"email": email})
        result = response.json()
        
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(result, indent=2)}")
        
        if response.status_code == 200 and result.get("status") == "success":
            print("✅ Login OTP request successful")
            
            # Get OTP from development response if available
            dev_otp = result.get("dev_otp")
            if dev_otp:
                print(f"🔑 Development OTP: {dev_otp}")
                
                # Step 2: Verify login OTP
                print("\n🔓 Verifying login OTP...")
                verify_data = {
                    "email": email,
                    "otp": dev_otp
                }
                
                verify_response = requests.post(f"{BASE_URL}/verify-login-otp", json=verify_data)
                verify_result = verify_response.json()
                
                print(f"Verify Status: {verify_response.status_code}")
                print(f"Verify Response: {json.dumps(verify_result, indent=2)}")
                
                if verify_response.status_code == 200 and verify_result.get("status") == "success":
                    print("✅ OTP login verification successful")
                    return verify_result.get("user")
                else:
                    print("❌ OTP login verification failed")
                    return None
            else:
                print("⚠️  No development OTP provided - check email manually")
                return None
        else:
            print("❌ Login OTP request failed")
            return None
            
    except Exception as e:
        print(f"❌ OTP login error: {str(e)}")
        return None

def test_resend_otp():
    """Test OTP resend functionality"""
    print(f"\n🔄 Testing OTP Resend")
    print("=" * 40)
    
    # We'll use a fake email for this test since we just want to test the endpoint
    test_email = "test@example.com"
    
    try:
        print(f"🔄 Resending signup OTP for: {test_email}")
        response = requests.post(f"{BASE_URL}/resend-signup-otp", json={"email": test_email})
        result = response.json()
        
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(result, indent=2)}")
        
        # This might fail if no pending registration exists, which is expected
        if response.status_code == 200:
            print("✅ OTP resend endpoint working")
        else:
            print("⚠️  OTP resend failed (expected for non-existent pending registration)")
            
    except Exception as e:
        print(f"❌ OTP resend error: {str(e)}")

def main():
    """Run all authentication flow tests"""
    print("🧪 Testing EduMaster Authentication Flow")
    print("=" * 50)
    print(f"⏰ Test started at: {datetime.now()}")
    print()
    
    # Test 1: Signup Flow
    email, password = test_signup_flow()
    
    if email and password:
        time.sleep(2)  # Brief pause between tests
        
        # Test 2: Password Login Flow
        user = test_login_flow(email, password)
        
        if user:
            time.sleep(2)  # Brief pause between tests
            
            # Test 3: OTP Login Flow
            otp_user = test_otp_login_flow(email)
            
            if otp_user:
                print("\n🎉 All authentication flows working!")
            else:
                print("\n⚠️  OTP login flow needs attention")
        else:
            print("\n⚠️  Password login flow needs attention")
    else:
        print("\n⚠️  Signup flow needs attention")
    
    # Test 4: OTP Resend (independent test)
    time.sleep(2)
    test_resend_otp()
    
    print(f"\n✅ Authentication flow testing completed at: {datetime.now()}")

if __name__ == "__main__":
    main()
