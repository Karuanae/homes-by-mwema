"""
M-PESA Integration Test Script
Run this script to test your M-PESA configuration
"""

import os
import sys
from flask import Flask
from mpesa_service import MPesaService, format_phone_number

# Create a minimal Flask app for testing
app = Flask(__name__)

# Load configuration
app.config['MPESA_ENVIRONMENT'] = os.environ.get('MPESA_ENVIRONMENT', 'sandbox')
app.config['MPESA_CONSUMER_KEY'] = os.environ.get('MPESA_CONSUMER_KEY', 'YOUR_CONSUMER_KEY_HERE')
app.config['MPESA_CONSUMER_SECRET'] = os.environ.get('MPESA_CONSUMER_SECRET', 'YOUR_CONSUMER_SECRET_HERE')
app.config['MPESA_BUSINESS_SHORT_CODE'] = os.environ.get('MPESA_BUSINESS_SHORT_CODE', '174379')
app.config['MPESA_PASSKEY'] = os.environ.get('MPESA_PASSKEY', 'YOUR_PASSKEY_HERE')
app.config['MPESA_CALLBACK_URL'] = os.environ.get('MPESA_CALLBACK_URL', 'https://example.com/callback')

def test_phone_number_formatting():
    """Test phone number formatting"""
    print("\n=== Testing Phone Number Formatting ===")
    
    test_numbers = [
        '0712345678',
        '254712345678',
        '+254712345678',
        '712345678'
    ]
    
    for number in test_numbers:
        formatted = format_phone_number(number)
        print(f"{number:20} -> {formatted}")
    
    print("✓ Phone number formatting test passed\n")

def test_access_token():
    """Test getting M-PESA access token"""
    print("\n=== Testing Access Token Generation ===")
    
    with app.app_context():
        try:
            mpesa_service = MPesaService()
            
            # Check configuration
            print(f"Environment: {mpesa_service.environment}")
            print(f"Base URL: {mpesa_service.base_url}")
            print(f"Business Short Code: {mpesa_service.business_short_code}")
            
            # Try to get access token
            print("\nAttempting to get access token...")
            token = mpesa_service.get_access_token()
            
            if token:
                print(f"✓ Access token obtained successfully")
                print(f"  Token (first 20 chars): {token[:20]}...")
                return True
            else:
                print("✗ Failed to get access token")
                return False
                
        except Exception as e:
            print(f"✗ Error: {str(e)}")
            return False

def test_password_generation():
    """Test password generation for STK push"""
    print("\n=== Testing Password Generation ===")
    
    with app.app_context():
        try:
            mpesa_service = MPesaService()
            password, timestamp = mpesa_service.generate_password()
            
            print(f"Timestamp: {timestamp}")
            print(f"Password (first 30 chars): {password[:30]}...")
            print("✓ Password generation test passed\n")
            return True
            
        except Exception as e:
            print(f"✗ Error: {str(e)}")
            return False

def test_stk_push():
    """Test STK push (optional - requires valid credentials)"""
    print("\n=== Testing STK Push (Optional) ===")
    print("Note: This will send an actual STK push to the test number")
    
    proceed = input("Do you want to test STK push? (y/n): ").lower()
    
    if proceed != 'y':
        print("Skipping STK push test")
        return True
    
    phone = input("Enter test phone number (e.g., 0712345678): ")
    amount = input("Enter test amount (e.g., 1): ")
    
    with app.app_context():
        try:
            mpesa_service = MPesaService()
            
            result = mpesa_service.stk_push(
                phone_number=phone,
                amount=float(amount),
                account_reference="TEST-001",
                transaction_desc="Test payment"
            )
            
            if result['success']:
                print("\n✓ STK push initiated successfully!")
                print(f"  Merchant Request ID: {result.get('merchant_request_id')}")
                print(f"  Checkout Request ID: {result.get('checkout_request_id')}")
                print(f"  Message: {result.get('customer_message')}")
                return True
            else:
                print(f"\n✗ STK push failed: {result.get('error')}")
                return False
                
        except Exception as e:
            print(f"✗ Error: {str(e)}")
            return False

def check_configuration():
    """Check if all required configuration is set"""
    print("\n=== Checking Configuration ===")
    
    required_configs = [
        'MPESA_CONSUMER_KEY',
        'MPESA_CONSUMER_SECRET',
        'MPESA_BUSINESS_SHORT_CODE',
        'MPESA_PASSKEY',
        'MPESA_CALLBACK_URL'
    ]
    
    all_set = True
    for config in required_configs:
        value = app.config.get(config)
        is_set = value and value not in ['YOUR_CONSUMER_KEY_HERE', 'YOUR_CONSUMER_SECRET_HERE', 'YOUR_PASSKEY_HERE']
        status = "✓" if is_set else "✗"
        print(f"{status} {config}: {'Set' if is_set else 'Not set or default value'}")
        
        if not is_set:
            all_set = False
    
    if not all_set:
        print("\n⚠ Warning: Some configuration values are not set properly")
        print("Please update your .env file with actual values from Safaricom Developer Portal")
        return False
    
    print("\n✓ All configuration values are set")
    return True

def main():
    """Run all tests"""
    print("=" * 60)
    print("M-PESA Integration Test Suite")
    print("=" * 60)
    
    # Check configuration first
    config_ok = check_configuration()
    
    if not config_ok:
        print("\n" + "=" * 60)
        print("Configuration incomplete. Please set up your .env file first.")
        print("See .env.example for reference.")
        print("=" * 60)
        sys.exit(1)
    
    # Run tests
    test_phone_number_formatting()
    test_password_generation()
    token_ok = test_access_token()
    
    if token_ok:
        test_stk_push()
    
    print("\n" + "=" * 60)
    print("Test Suite Complete")
    print("=" * 60)
    
    if token_ok:
        print("\n✓ Your M-PESA integration is configured correctly!")
        print("\nNext steps:")
        print("1. Set up ngrok for callback URL (for local testing)")
        print("2. Update MPESA_CALLBACK_URL in .env")
        print("3. Test with your frontend application")
    else:
        print("\n✗ There are issues with your M-PESA configuration")
        print("\nPlease check:")
        print("1. Consumer Key and Secret are correct")
        print("2. You're using the right environment (sandbox/production)")
        print("3. Your credentials are from the correct app in Developer Portal")

if __name__ == '__main__':
    # Load environment variables if python-dotenv is available
    try:
        from dotenv import load_dotenv
        load_dotenv()
    except ImportError:
        print("Note: python-dotenv not installed. Using system environment variables.")
    
    main()
