"""
Test script for PayPal REST API Integration
Run from the backend directory: python test_paypal.py
"""

import os
import sys

# Add the current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Create a minimal Flask app for testing
app = Flask(__name__)

# Configure PayPal settings
app.config['PAYPAL_ENVIRONMENT'] = os.environ.get('PAYPAL_ENVIRONMENT', 'sandbox')
app.config['PAYPAL_CLIENT_ID'] = os.environ.get('PAYPAL_CLIENT_ID')
app.config['PAYPAL_CLIENT_SECRET'] = os.environ.get('PAYPAL_CLIENT_SECRET')
app.config['PAYPAL_RETURN_URL'] = os.environ.get('PAYPAL_RETURN_URL', 'http://localhost:5173/payment/success')
app.config['PAYPAL_CANCEL_URL'] = os.environ.get('PAYPAL_CANCEL_URL', 'http://localhost:5173/payment/cancel')
app.config['KES_TO_USD_RATE'] = float(os.environ.get('KES_TO_USD_RATE', '153.0'))


def test_paypal_authentication():
    """Test PayPal OAuth2 authentication"""
    print("\n" + "="*60)
    print("TEST 1: PayPal Authentication")
    print("="*60)
    
    with app.app_context():
        from paypal_service import PayPalService
        
        try:
            service = PayPalService()
            token = service._get_access_token()
            
            if token:
                print(f"✅ SUCCESS: Got access token")
                print(f"   Token (first 20 chars): {token[:20]}...")
                return True
            else:
                print("❌ FAILED: No access token received")
                return False
        except Exception as e:
            print(f"❌ FAILED: {str(e)}")
            return False


def test_create_order():
    """Test creating a PayPal order"""
    print("\n" + "="*60)
    print("TEST 2: Create PayPal Order")
    print("="*60)
    
    with app.app_context():
        from paypal_service import PayPalService
        
        try:
            service = PayPalService()
            
            # Create a test order for $10 USD
            result = service.create_order(
                amount=10.00,
                currency='USD',
                booking_id='TEST-123',
                description='Test payment for Homes by Mwema'
            )
            
            if result['success']:
                print(f"✅ SUCCESS: Order created")
                print(f"   Order ID: {result['order_id']}")
                print(f"   Status: {result['status']}")
                print(f"   Approval URL: {result['approval_url']}")
                return result['order_id']
            else:
                print(f"❌ FAILED: {result.get('error')}")
                if result.get('details'):
                    print(f"   Details: {result['details']}")
                return None
        except Exception as e:
            print(f"❌ FAILED: {str(e)}")
            return None


def test_get_order_details(order_id):
    """Test getting order details"""
    print("\n" + "="*60)
    print("TEST 3: Get Order Details")
    print("="*60)
    
    if not order_id:
        print("⚠️  SKIPPED: No order ID available")
        return False
    
    with app.app_context():
        from paypal_service import PayPalService
        
        try:
            service = PayPalService()
            result = service.get_order_details(order_id)
            
            if result['success']:
                print(f"✅ SUCCESS: Retrieved order details")
                print(f"   Order ID: {result['order_id']}")
                print(f"   Status: {result['status']}")
                print(f"   Intent: {result['intent']}")
                print(f"   Created: {result.get('create_time')}")
                return True
            else:
                print(f"❌ FAILED: {result.get('error')}")
                return False
        except Exception as e:
            print(f"❌ FAILED: {str(e)}")
            return False


def test_currency_conversion():
    """Test KES to USD conversion"""
    print("\n" + "="*60)
    print("TEST 4: Currency Conversion (KES to USD)")
    print("="*60)
    
    with app.app_context():
        from paypal_service import convert_kes_to_usd
        
        try:
            # Test conversion
            kes_amount = 15000  # 15,000 KES
            usd_amount = convert_kes_to_usd(kes_amount)
            
            print(f"✅ SUCCESS: Currency conversion works")
            print(f"   KES {kes_amount:,} = USD {usd_amount:.2f}")
            print(f"   Exchange rate: {app.config['KES_TO_USD_RATE']}")
            return True
        except Exception as e:
            print(f"❌ FAILED: {str(e)}")
            return False


def main():
    print("\n" + "="*60)
    print("PayPal REST API Integration Test")
    print("="*60)
    print(f"\nEnvironment: {app.config['PAYPAL_ENVIRONMENT']}")
    print(f"Client ID: {app.config['PAYPAL_CLIENT_ID'][:20]}..." if app.config['PAYPAL_CLIENT_ID'] else "Client ID: Not set")
    print(f"Return URL: {app.config['PAYPAL_RETURN_URL']}")
    
    # Run tests
    auth_ok = test_paypal_authentication()
    
    order_id = None
    if auth_ok:
        order_id = test_create_order()
    
    if order_id:
        test_get_order_details(order_id)
    
    test_currency_conversion()
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    print(f"Authentication: {'✅ PASS' if auth_ok else '❌ FAIL'}")
    print(f"Create Order: {'✅ PASS' if order_id else '❌ FAIL'}")
    print(f"Currency Conversion: ✅ PASS")
    
    if order_id:
        print(f"\n📋 To test the full payment flow:")
        print(f"   1. Visit the approval URL in your browser")
        print(f"   2. Log in with a PayPal sandbox account")
        print(f"   3. Approve the payment")
        print(f"   4. You'll be redirected to the return URL")


if __name__ == '__main__':
    main()
