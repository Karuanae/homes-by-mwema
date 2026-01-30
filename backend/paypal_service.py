"""
PayPal REST API Service for Homes by Mwema
Handles PayPal payment creation, capture, and verification
"""

import requests
import base64
import json
from flask import current_app
from datetime import datetime


class PayPalService:
    """Service class for PayPal REST API integration"""
    
    def __init__(self):
        self.client_id = current_app.config.get('PAYPAL_CLIENT_ID')
        self.client_secret = current_app.config.get('PAYPAL_CLIENT_SECRET')
        self.environment = current_app.config.get('PAYPAL_ENVIRONMENT', 'sandbox')
        
        # Set base URL based on environment
        if self.environment == 'production':
            self.base_url = 'https://api-m.paypal.com'
        else:
            self.base_url = 'https://api-m.sandbox.paypal.com'
        
        self.access_token = None
        self.token_expires_at = None
    
    def _get_access_token(self):
        """Get OAuth 2.0 access token from PayPal"""
        if self.access_token and self.token_expires_at and datetime.now() < self.token_expires_at:
            return self.access_token
        
        url = f"{self.base_url}/v1/oauth2/token"
        
        # Encode credentials
        credentials = base64.b64encode(
            f"{self.client_id}:{self.client_secret}".encode()
        ).decode()
        
        headers = {
            'Authorization': f'Basic {credentials}',
            'Content-Type': 'application/x-www-form-urlencoded'
        }
        
        data = {'grant_type': 'client_credentials'}
        
        try:
            response = requests.post(url, headers=headers, data=data)
            response.raise_for_status()
            
            token_data = response.json()
            self.access_token = token_data['access_token']
            # Token expires in seconds, set expiry time
            expires_in = token_data.get('expires_in', 3600)
            from datetime import timedelta
            self.token_expires_at = datetime.now() + timedelta(seconds=expires_in - 60)
            
            return self.access_token
        except requests.exceptions.RequestException as e:
            raise PayPalError(f"Failed to get access token: {str(e)}")
    
    def _make_request(self, method, endpoint, data=None):
        """Make authenticated request to PayPal API"""
        access_token = self._get_access_token()
        
        url = f"{self.base_url}{endpoint}"
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, headers=headers, json=data)
            elif method == 'PATCH':
                response = requests.patch(url, headers=headers, json=data)
            else:
                raise PayPalError(f"Unsupported HTTP method: {method}")
            
            response.raise_for_status()
            
            if response.content:
                return response.json()
            return {}
            
        except requests.exceptions.HTTPError as e:
            error_data = {}
            try:
                error_data = response.json()
            except:
                pass
            raise PayPalError(
                f"PayPal API error: {str(e)}",
                details=error_data
            )
        except requests.exceptions.RequestException as e:
            raise PayPalError(f"Request failed: {str(e)}")
    
    def create_order(self, amount, currency='USD', booking_id=None, description=None, return_url=None, cancel_url=None):
        """
        Create a PayPal order for payment
        
        Args:
            amount: Payment amount
            currency: Currency code (default: USD)
            booking_id: Reference booking ID
            description: Order description
            return_url: URL to redirect after approval
            cancel_url: URL to redirect if cancelled
        
        Returns:
            dict with order_id, status, and approval_url
        """
        order_data = {
            "intent": "CAPTURE",
            "purchase_units": [
                {
                    "reference_id": f"BOOKING-{booking_id}" if booking_id else "ORDER",
                    "description": description or "Homes by Mwema Booking Payment",
                    "amount": {
                        "currency_code": currency,
                        "value": f"{float(amount):.2f}"
                    }
                }
            ],
            "payment_source": {
                "paypal": {
                    "experience_context": {
                        "payment_method_preference": "IMMEDIATE_PAYMENT_REQUIRED",
                        "brand_name": "Homes by Mwema",
                        "locale": "en-US",
                        "landing_page": "LOGIN",
                        "shipping_preference": "NO_SHIPPING",
                        "user_action": "PAY_NOW",
                        "return_url": return_url or current_app.config.get('PAYPAL_RETURN_URL', 'http://localhost:5173/payment/success'),
                        "cancel_url": cancel_url or current_app.config.get('PAYPAL_CANCEL_URL', 'http://localhost:5173/payment/cancel')
                    }
                }
            }
        }
        
        try:
            result = self._make_request('POST', '/v2/checkout/orders', order_data)
            
            # Extract approval URL
            approval_url = None
            for link in result.get('links', []):
                if link.get('rel') == 'payer-action':
                    approval_url = link.get('href')
                    break
            
            return {
                'success': True,
                'order_id': result.get('id'),
                'status': result.get('status'),
                'approval_url': approval_url,
                'raw_response': result
            }
        except PayPalError as e:
            return {
                'success': False,
                'error': str(e),
                'details': e.details if hasattr(e, 'details') else {}
            }
    
    def capture_order(self, order_id):
        """
        Capture payment for an approved order
        
        Args:
            order_id: PayPal order ID
        
        Returns:
            dict with capture details including transaction_id
        """
        try:
            result = self._make_request('POST', f'/v2/checkout/orders/{order_id}/capture')
            
            # Extract transaction details
            capture_details = {}
            purchase_units = result.get('purchase_units', [])
            if purchase_units:
                captures = purchase_units[0].get('payments', {}).get('captures', [])
                if captures:
                    capture = captures[0]
                    capture_details = {
                        'transaction_id': capture.get('id'),
                        'status': capture.get('status'),
                        'amount': capture.get('amount', {}).get('value'),
                        'currency': capture.get('amount', {}).get('currency_code')
                    }
            
            return {
                'success': True,
                'order_id': result.get('id'),
                'status': result.get('status'),
                'payer': result.get('payer', {}),
                'capture': capture_details,
                'raw_response': result
            }
        except PayPalError as e:
            return {
                'success': False,
                'error': str(e),
                'details': e.details if hasattr(e, 'details') else {}
            }
    
    def get_order_details(self, order_id):
        """
        Get details of an existing order
        
        Args:
            order_id: PayPal order ID
        
        Returns:
            dict with order details
        """
        try:
            result = self._make_request('GET', f'/v2/checkout/orders/{order_id}')
            
            return {
                'success': True,
                'order_id': result.get('id'),
                'status': result.get('status'),
                'intent': result.get('intent'),
                'purchase_units': result.get('purchase_units', []),
                'payer': result.get('payer', {}),
                'create_time': result.get('create_time'),
                'update_time': result.get('update_time'),
                'raw_response': result
            }
        except PayPalError as e:
            return {
                'success': False,
                'error': str(e),
                'details': e.details if hasattr(e, 'details') else {}
            }
    
    def refund_capture(self, capture_id, amount=None, currency='USD', note=None):
        """
        Refund a captured payment
        
        Args:
            capture_id: The capture transaction ID
            amount: Amount to refund (None for full refund)
            currency: Currency code
            note: Note to payer
        
        Returns:
            dict with refund details
        """
        refund_data = {}
        if amount:
            refund_data['amount'] = {
                'value': f"{float(amount):.2f}",
                'currency_code': currency
            }
        if note:
            refund_data['note_to_payer'] = note
        
        try:
            result = self._make_request(
                'POST', 
                f'/v2/payments/captures/{capture_id}/refund',
                refund_data if refund_data else None
            )
            
            return {
                'success': True,
                'refund_id': result.get('id'),
                'status': result.get('status'),
                'amount': result.get('amount', {}).get('value'),
                'raw_response': result
            }
        except PayPalError as e:
            return {
                'success': False,
                'error': str(e),
                'details': e.details if hasattr(e, 'details') else {}
            }
    
    def verify_webhook_signature(self, headers, body, webhook_id):
        """
        Verify PayPal webhook signature
        
        Args:
            headers: Request headers
            body: Raw request body
            webhook_id: Your webhook ID from PayPal developer dashboard
        
        Returns:
            bool indicating if signature is valid
        """
        verification_data = {
            'auth_algo': headers.get('PAYPAL-AUTH-ALGO'),
            'cert_url': headers.get('PAYPAL-CERT-URL'),
            'transmission_id': headers.get('PAYPAL-TRANSMISSION-ID'),
            'transmission_sig': headers.get('PAYPAL-TRANSMISSION-SIG'),
            'transmission_time': headers.get('PAYPAL-TRANSMISSION-TIME'),
            'webhook_id': webhook_id,
            'webhook_event': json.loads(body) if isinstance(body, str) else body
        }
        
        try:
            result = self._make_request(
                'POST',
                '/v1/notifications/verify-webhook-signature',
                verification_data
            )
            
            return result.get('verification_status') == 'SUCCESS'
        except PayPalError:
            return False


class PayPalError(Exception):
    """Custom exception for PayPal API errors"""
    
    def __init__(self, message, details=None):
        super().__init__(message)
        self.details = details or {}


# Cache for exchange rate to avoid too many API calls
_exchange_rate_cache = {
    'rate': None,
    'fetched_at': None
}


def get_live_exchange_rate():
    """
    Fetch live USD/KES exchange rate from a free API
    Caches the rate for 1 hour to avoid excessive API calls
    
    Returns:
        float: Current exchange rate (KES per 1 USD)
    """
    from datetime import timedelta
    
    # Check if we have a cached rate less than 1 hour old
    if (_exchange_rate_cache['rate'] and 
        _exchange_rate_cache['fetched_at'] and 
        datetime.now() - _exchange_rate_cache['fetched_at'] < timedelta(hours=1)):
        return _exchange_rate_cache['rate']
    
    # Try multiple free APIs as fallbacks
    apis = [
        # ExchangeRate-API (free, no key required for basic)
        {
            'url': 'https://api.exchangerate-api.com/v4/latest/USD',
            'parser': lambda data: data.get('rates', {}).get('KES')
        },
        # Open Exchange Rates alternative
        {
            'url': 'https://open.er-api.com/v6/latest/USD',
            'parser': lambda data: data.get('rates', {}).get('KES')
        },
    ]
    
    for api in apis:
        try:
            response = requests.get(api['url'], timeout=5)
            response.raise_for_status()
            data = response.json()
            rate = api['parser'](data)
            
            if rate:
                # Cache the rate
                _exchange_rate_cache['rate'] = float(rate)
                _exchange_rate_cache['fetched_at'] = datetime.now()
                return float(rate)
        except Exception as e:
            continue  # Try next API
    
    # Fallback to config or default if all APIs fail
    fallback_rate = current_app.config.get('KES_TO_USD_RATE', 153.0)
    return fallback_rate


def convert_kes_to_usd(amount_kes, exchange_rate=None):
    """
    Convert Kenyan Shillings to USD using live market rate
    
    Args:
        amount_kes: Amount in KES
        exchange_rate: Optional override rate (if None, fetches live rate)
    
    Returns:
        tuple: (amount_usd, exchange_rate_used)
    """
    if exchange_rate is None:
        exchange_rate = get_live_exchange_rate()
    
    amount_usd = round(float(amount_kes) / exchange_rate, 2)
    
    return amount_usd, exchange_rate
