"""
Test script to verify email/SMTP configuration for OTP sending
"""
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_smtp_connection():
    """Test SMTP connection and email sending"""
    try:
        smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        smtp_port = int(os.getenv('SMTP_PORT', '587'))
        smtp_username = os.getenv('SMTP_USERNAME')
        smtp_password = os.getenv('SMTP_PASSWORD')
        
        print(f"Testing SMTP connection...")
        print(f"Server: {smtp_server}")
        print(f"Port: {smtp_port}")
        print(f"Username: {smtp_username}")
        print(f"Password: {'*' * len(smtp_password) if smtp_password else 'Not set'}")
        
        if not smtp_username or not smtp_password:
            print("❌ SMTP credentials not configured")
            return False
        
        # Test connection
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(smtp_username, smtp_password)
            print("✅ SMTP connection successful")
            return True
            
    except Exception as e:
        print(f"❌ SMTP connection failed: {str(e)}")
        return False

def send_test_otp_email():
    """Send a test OTP email"""
    try:
        smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        smtp_port = int(os.getenv('SMTP_PORT', '587'))
        smtp_username = os.getenv('SMTP_USERNAME')
        smtp_password = os.getenv('SMTP_PASSWORD')
        
        test_email = smtp_username  # Send to self for testing
        test_otp = "123456"
        test_name = "Test User"
        
        # Create email content
        subject = "EduMaster - Test OTP Verification Code"
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">EduMaster</h1>
                <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Your Smart Study Companion</p>
            </div>
            <div style="background: white; padding: 30px; border: 1px solid #e1e5e9; border-radius: 0 0 10px 10px;">
                <h2 style="color: #333; margin-top: 0;">Hi {test_name}!</h2>
                <p style="color: #555; font-size: 16px; line-height: 1.5;">This is a test email. Your verification code is:</p>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                    <span style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px;">{test_otp}</span>
                </div>
                <p style="color: #555; font-size: 14px; line-height: 1.5;">This is a test email to verify SMTP configuration.</p>
                <p style="color: #999; font-size: 12px; margin-top: 30px;">This is a test email for EduMaster development.</p>
            </div>
        </body>
        </html>
        """
        
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = smtp_username
        msg['To'] = test_email
        
        # Add HTML part
        html_part = MIMEText(html_body, 'html')
        msg.attach(html_part)
        
        # Send email
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(smtp_username, smtp_password)
            server.send_message(msg)
        
        print(f"✅ Test OTP email sent successfully to {test_email}")
        return True
        
    except Exception as e:
        print(f"❌ Failed to send test OTP email: {str(e)}")
        return False

if __name__ == "__main__":
    print("🧪 Testing EduMaster Email Configuration")
    print("=" * 50)
    
    # Test 1: SMTP Connection
    print("\n1. Testing SMTP connection...")
    smtp_ok = test_smtp_connection()
    
    # Test 2: Send test email
    if smtp_ok:
        print("\n2. Sending test OTP email...")
        send_test_otp_email()
    else:
        print("\n❌ Skipping email test due to SMTP connection failure")
    
    print("\n✅ Email testing completed!")
