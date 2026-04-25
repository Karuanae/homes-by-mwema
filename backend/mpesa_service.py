"""
M-PESA Daraja API Integration Service
Handles M-PESA STK Push, callbacks, and transaction queries
"""

import requests
from requests.auth import HTTPBasicAuth
import base64
from datetime import datetime
import json
from flask import current_app


class MPesaService:
    """Service class for interacting with Safaricom's Daraja API"""
    
    def __init__(self):
        """Initialize M-PESA service with credentials from config"""
        self.consumer_key = current_app.config.get('MPESA_CONSUMER_KEY')
        self.consumer_secret = current_app.config.get('MPESA_CONSUMER_SECRET')
        self.business_short_code = current_app.config.get('MPESA_BUSINESS_SHORT_CODE')
        self.passkey = current_app.config.get('MPESA_PASSKEY')
        self.callback_url = current_app.config.get('MPESA_CALLBACK_URL')
        self.environment = current_app.config.get('MPESA_ENVIRONMENT', 'sandbox')
        
        # API URLs based on environment
        if self.environment == 'production':
            self.base_url = 'https://api.safaricom.co.ke'
        else:
            self.base_url = 'https://sandbox.safaricom.co.ke'
        
        self.access_token = None
        self.token_expiry = None
    
    def get_access_token(self):
        """
        Generate OAuth access token for M-PESA API authentication
        Returns: Access token string
        """
        # Check if token is still valid
        if self.access_token and self.token_expiry:
            if datetime.now() < self.token_expiry:
                return self.access_token
        
        url = f"{self.base_url}/oauth/v1/generate?grant_type=client_credentials"
        
        try:
            response = requests.get(
                url,
                auth=HTTPBasicAuth(self.consumer_key, self.consumer_secret)
            )
            response.raise_for_status()
            
            data = response.json()
            self.access_token = data['access_token']
            
            # Token expires in 3599 seconds, we'll refresh 5 minutes before
            from datetime import timedelta
            self.token_expiry = datetime.now() + timedelta(seconds=3300)
            
            return self.access_token
            
        except requests.exceptions.RequestException as e:
            current_app.logger.error(f"Error getting M-PESA access token: {str(e)}")
            raise Exception(f"Failed to get M-PESA access token: {str(e)}")
    
    def generate_password(self):
        """
        Generate password for STK push
        Returns: Base64 encoded password and timestamp
        """
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        data_to_encode = f"{self.business_short_code}{self.passkey}{timestamp}"
        encoded = base64.b64encode(data_to_encode.encode()).decode('utf-8')
        return encoded, timestamp
    
    def stk_push(self, phone_number, amount, account_reference, transaction_desc):
        """
        Initiate STK Push (Lipa Na M-PESA Online)
        
        Args:
            phone_number: Customer's phone number (format: 2547XXXXXXXX)
            amount: Amount to charge
            account_reference: Unique identifier for the transaction
            transaction_desc: Description of the transaction
            
        Returns:
            dict: Response from M-PESA API
        """
        # Get access token
        access_token = self.get_access_token()
        
        # Generate password and timestamp
        password, timestamp = self.generate_password()
        
        # Prepare phone number (ensure it's in correct format)
        if phone_number.startswith('0'):
            phone_number = '254' + phone_number[1:]
        elif phone_number.startswith('+'):
            phone_number = phone_number[1:]
        elif not phone_number.startswith('254'):
            phone_number = '254' + phone_number
        
        # API endpoint
        url = f"{self.base_url}/mpesa/stkpush/v1/processrequest"
        
        # Request headers
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        
                # Correct for Bank PayBill setup
        bank_paybill = '542542' 
        your_bank_account = '008814'

        payload = {
            'BusinessShortCode': bank_paybill,
            'Password': password,
            'Timestamp': timestamp,
            'TransactionType': 'CustomerPayBillOnline',
            'Amount': int(amount),
            'PartyA': phone_number,
            'PartyB': bank_paybill,  # MUST be the bank's PayBill number
            'PhoneNumber': phone_number,
            'CallBackURL': self.callback_url,
            'AccountReference': your_bank_account, # YOUR 008814 number goes here!
            'TransactionDesc': transaction_desc
        }
        
        try:
            response = requests.post(url, json=payload, headers=headers)
            response.raise_for_status()
            
            result = response.json()
            current_app.logger.info(f"STK Push initiated: {result}")
            
            return {
                'success': True,
                'merchant_request_id': result.get('MerchantRequestID'),
                'checkout_request_id': result.get('CheckoutRequestID'),
                'response_code': result.get('ResponseCode'),
                'response_description': result.get('ResponseDescription'),
                'customer_message': result.get('CustomerMessage')
            }
            
        except requests.exceptions.RequestException as e:
            current_app.logger.error(f"STK Push error: {str(e)}")
            
            # Try to get error details from response
            error_message = str(e)
            if hasattr(e, 'response') and e.response is not None:
                try:
                    error_data = e.response.json()
                    error_message = error_data.get('errorMessage', str(e))
                except:
                    pass
            
            return {
                'success': False,
                'error': error_message
            }
    
    def query_stk_push_status(self, checkout_request_id):
        """
        Query the status of an STK Push transaction
        
        Args:
            checkout_request_id: The checkout request ID from STK push initiation
            
        Returns:
            dict: Transaction status information
        """
        access_token = self.get_access_token()
        password, timestamp = self.generate_password()
        
        url = f"{self.base_url}/mpesa/stkpushquery/v1/query"
        
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        
        payload = {
            'BusinessShortCode': self.business_short_code,
            'Password': password,
            'Timestamp': timestamp,
            'CheckoutRequestID': checkout_request_id
        }
        
        try:
            response = requests.post(url, json=payload, headers=headers)
            response.raise_for_status()
            
            result = response.json()
            
            return {
                'success': True,
                'result_code': result.get('ResultCode'),
                'result_desc': result.get('ResultDesc'),
                'merchant_request_id': result.get('MerchantRequestID'),
                'checkout_request_id': result.get('CheckoutRequestID')
            }
            
        except requests.exceptions.RequestException as e:
            current_app.logger.error(f"STK query error: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def process_callback(self, callback_data):
        """
        Process M-PESA callback data
        
        Args:
            callback_data: The callback JSON data from M-PESA
            
        Returns:
            dict: Processed callback information
        """
        try:
            body = callback_data.get('Body', {})
            stk_callback = body.get('stkCallback', {})
            
            merchant_request_id = stk_callback.get('MerchantRequestID')
            checkout_request_id = stk_callback.get('CheckoutRequestID')
            result_code = stk_callback.get('ResultCode')
            result_desc = stk_callback.get('ResultDesc')
            
            # Extract callback metadata
            callback_metadata = stk_callback.get('CallbackMetadata', {})
            items = callback_metadata.get('Item', [])
            
            # Parse metadata items
            metadata = {}
            for item in items:
                name = item.get('Name')
                value = item.get('Value')
                metadata[name] = value
            
            return {
                'merchant_request_id': merchant_request_id,
                'checkout_request_id': checkout_request_id,
                'result_code': result_code,
                'result_desc': result_desc,
                'amount': metadata.get('Amount'),
                'mpesa_receipt_number': metadata.get('MpesaReceiptNumber'),
                'transaction_date': metadata.get('TransactionDate'),
                'phone_number': metadata.get('PhoneNumber'),
                'success': result_code == 0
            }
            
        except Exception as e:
            current_app.logger.error(f"Error processing M-PESA callback: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def b2c_payment(self, phone_number, amount, occasion, remarks):
        """
        Business to Customer (B2C) payment
        Used for refunds or payouts
        
        Args:
            phone_number: Customer's phone number
            amount: Amount to send
            occasion: Occasion for the payment
            remarks: Payment remarks
            
        Returns:
            dict: Response from M-PESA API
        """
        access_token = self.get_access_token()
        initiator_name = current_app.config.get('MPESA_INITIATOR_NAME')
        security_credential = current_app.config.get('MPESA_SECURITY_CREDENTIAL')
        
        url = f"{self.base_url}/mpesa/b2c/v1/paymentrequest"
        
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        
        # Format phone number
        if phone_number.startswith('0'):
            phone_number = '254' + phone_number[1:]
        elif not phone_number.startswith('254'):
            phone_number = '254' + phone_number
        
        payload = {
            'InitiatorName': initiator_name,
            'SecurityCredential': security_credential,
            'CommandID': 'BusinessPayment',
            'Amount': int(amount),
            'PartyA': self.business_short_code,
            'PartyB': phone_number,
            'Remarks': remarks,
            'QueueTimeOutURL': current_app.config.get('MPESA_B2C_TIMEOUT_URL'),
            'ResultURL': current_app.config.get('MPESA_B2C_RESULT_URL'),
            'Occasion': occasion
        }
        
        try:
            response = requests.post(url, json=payload, headers=headers)
            response.raise_for_status()
            
            result = response.json()
            
            return {
                'success': True,
                'conversation_id': result.get('ConversationID'),
                'originator_conversation_id': result.get('OriginatorConversationID'),
                'response_code': result.get('ResponseCode'),
                'response_description': result.get('ResponseDescription')
            }
            
        except requests.exceptions.RequestException as e:
            current_app.logger.error(f"B2C payment error: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }


# Helper function to format phone number
def format_phone_number(phone_number):
    """
    Format phone number to M-PESA format (254XXXXXXXXX)
    """
    # Remove any spaces or special characters
    phone_number = ''.join(filter(str.isdigit, str(phone_number)))
    
    # Format to 254 format
    if phone_number.startswith('0'):
        return '254' + phone_number[1:]
    elif phone_number.startswith('254'):
        return phone_number
    elif phone_number.startswith('7') or phone_number.startswith('1'):
        return '254' + phone_number
    else:
        return phone_number
