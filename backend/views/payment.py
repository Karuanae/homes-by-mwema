from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Payment, Booking, User
from sqlalchemy import and_, or_
from datetime import datetime, timedelta
from decimal import Decimal
import hmac
import hashlib
import json
import logging
import uuid
import requests

payment_bp = Blueprint('payment', __name__)
logger = logging.getLogger(__name__)

def verify_mpesa_signature(request):
    """
    Verify that callback is genuinely from Safaricom
    Uses MPESA_SECRET from environment variables
    """
    # Get signature from headers
    signature = request.headers.get('X-Mpesa-Signature')
    
    # For sandbox/testing, we might skip verification
    if current_app.config.get('MPESA_ENVIRONMENT') == 'sandbox':
        return True
    
    if not signature:
        logger.warning("Missing M-PESA signature")
        return False
    
    # Get secret from env vars
    mpesa_secret = current_app.config.get('MPESA_SECRET', '')
    if not mpesa_secret:
        logger.warning("MPESA_SECRET not configured - skipping verification")
        return True  # Allow in development, but should be configured in production
    
    # Calculate expected signature
    expected = hmac.new(
        mpesa_secret.encode(),
        request.get_data(),
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(signature, expected)

@payment_bp.route('/mpesa/initiate', methods=['POST'])
@jwt_required()
def initiate_mpesa_payment():
    """
    STEP 1: Start M-PESA payment
    Called when user clicks "Pay with M-PESA"
    """
    user_id = get_jwt_identity()
    data = request.json
    
    # Get timeout from env vars
    timeout_minutes = current_app.config['BOOKING_TIMEOUT_MINUTES']
    
    # Validate required fields
    required_fields = ['booking_id', 'phone_number', 'amount']
    for field in required_fields:
        if field not in data:
            return jsonify({
                'success': False,
                'error': f'Missing {field}'
            }), 400
    
    # Find the booking
    booking = Booking.query.filter_by(
        id=data['booking_id'],
        user_id=user_id
    ).first()
    
    if not booking:
        return jsonify({
            'success': False,
            'error': 'Booking not found'
        }), 404
    
    # Check if booking is still valid (not expired)
    if booking.expires_at and booking.expires_at < datetime.utcnow():
        booking.status = 'expired'
        db.session.commit()
        return jsonify({
            'success': False,
            'error': 'Booking session expired. Please start over.',
            'expired': True
        }), 400
    
    # Check if already paid
    if booking.payment_status == 'completed':
        return jsonify({
            'success': False,
            'error': 'This booking is already paid'
        }), 400
    
    # Format phone number (remove spaces, ensure 254 format)
    phone = data['phone_number'].strip().replace(' ', '').replace('+', '')
    if phone.startswith('0'):
        phone = '254' + phone[1:]
    elif not phone.startswith('254'):
        phone = '254' + phone
    
    # Generate unique idempotency key
    idempotency_key = f"MPESA_{booking.id}_{datetime.utcnow().timestamp()}"
    
    # Create payment record
    payment = Payment(
        booking_id=booking.id,
        user_id=user_id,
        property_id=booking.property_id,
        amount=Decimal(str(data['amount'])),
        method='mpesa',
        mpesa_number=phone,
        status='pending',
        idempotency_key=idempotency_key,
        created_at=datetime.utcnow()
    )
    
    db.session.add(payment)
    db.session.commit()
    
    try:
        # Call M-PESA API with env configs
        mpesa_result = call_mpesa_api(
            phone_number=phone,
            amount=int(data['amount']),
            account_reference=f"BOOK{booking.id}",
            transaction_desc=f"Payment for booking #{booking.id}"
        )
        
        if mpesa_result.get('success'):
            # Update payment with checkout request ID
            payment.checkout_request_id = mpesa_result.get('CheckoutRequestID')
            payment.merchant_request_id = mpesa_result.get('MerchantRequestID')
            db.session.commit()
            
            return jsonify({
                'success': True,
                'payment_id': payment.id,
                'checkout_request_id': mpesa_result.get('CheckoutRequestID'),
                'message': 'STK Push sent. Please check your phone and enter PIN.',
                'expires_at': booking.expires_at.isoformat()
            }), 200
        else:
            # Payment initiation failed
            payment.status = 'failed'
            payment.error_log = mpesa_result.get('error', 'Unknown error')
            db.session.commit()
            
            return jsonify({
                'success': False,
                'error': 'Failed to initiate payment. Please try again.'
            }), 400
            
    except Exception as e:
        payment.status = 'failed'
        payment.error_log = str(e)
        db.session.commit()
        
        logger.error(f"M-PESA initiation error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Payment service unavailable. Please try again.'
        }), 500

@payment_bp.route('/mpesa/callback', methods=['POST'])
def mpesa_callback():
    """
    STEP 2: M-PESA sends result here after user enters PIN
    This endpoint is PUBLIC but secured by signature
    """
    # Log the callback for debugging
    logger.info(f"📞 M-PESA Callback received")
    
    # Verify signature (in production)
    if not verify_mpesa_signature(request):
        logger.warning("Invalid M-PESA signature")
        return jsonify({'ResultCode': 1, 'ResultDesc': 'Invalid signature'}), 401
    
    try:
        callback_data = request.json
        body = callback_data.get('Body', {})
        stk_callback = body.get('stkCallback', {})
        
        # Extract key information
        checkout_request_id = stk_callback.get('CheckoutRequestID')
        result_code = stk_callback.get('ResultCode')
        result_desc = stk_callback.get('ResultDesc')
        
        # Find the payment record
        payment = Payment.query.filter_by(
            checkout_request_id=checkout_request_id
        ).first()
        
        if not payment:
            logger.error(f"Payment not found for checkout: {checkout_request_id}")
            return jsonify({'ResultCode': 1, 'ResultDesc': 'Payment not found'}), 200
        
        # Record callback received
        payment.webhook_received_at = datetime.utcnow()
        
        if result_code == 0:
            # SUCCESS! User entered PIN and payment completed
            
            # Extract M-PESA receipt number
            callback_metadata = stk_callback.get('CallbackMetadata', {}).get('Item', [])
            mpesa_receipt = None
            transaction_date = None
            
            for item in callback_metadata:
                if item.get('Name') == 'MpesaReceiptNumber':
                    mpesa_receipt = item.get('Value')
                elif item.get('Name') == 'TransactionDate':
                    transaction_date = item.get('Value')
            
            # Update payment record
            payment.status = 'completed'
            payment.mpesa_receipt_number = mpesa_receipt
            payment.transaction_id = mpesa_receipt
            payment.completed_at = datetime.utcnow()
            
            # Update the booking
            booking = Booking.query.get(payment.booking_id)
            if booking:
                # Calculate total paid for this booking
                total_paid = db.session.query(
                    db.func.sum(Payment.amount)
                ).filter(
                    Payment.booking_id == booking.id,
                    Payment.status == 'completed'
                ).scalar() or Decimal('0')
                
                # Update payment status
                if total_paid >= booking.total_amount:
                    booking.payment_status = 'completed'
                    booking.status = 'confirmed'
                    booking.confirmation = 'confirmed'
                    logger.info(f"✅ Booking {booking.id} fully paid")
                elif total_paid >= (booking.total_amount - booking.pending_amount):
                    booking.payment_status = 'partial'
                    booking.status = 'confirmed'
                    booking.confirmation = 'confirmed'
                    logger.info(f"✅ Booking {booking.id} partially paid")
                
                # Clear expiry since payment received
                booking.expires_at = None
            
            db.session.commit()
            
            logger.info(f"💰 Payment completed: {mpesa_receipt} for KES {payment.amount}")
            
        else:
            # FAILURE - User cancelled or transaction failed
            payment.status = 'failed'
            payment.error_log = result_desc
            db.session.commit()
            
            logger.warning(f"❌ Payment failed: {result_desc}")
        
        # Always return success to M-PESA
        return jsonify({'ResultCode': 0, 'ResultDesc': 'Success'}), 200
        
    except Exception as e:
        logger.error(f"Callback processing error: {str(e)}")
        # Still return success to M-PESA to prevent retries
        return jsonify({'ResultCode': 0, 'ResultDesc': 'Received'}), 200

@payment_bp.route('/mpesa/status/<checkout_request_id>', methods=['GET'])
@jwt_required()
def check_payment_status(checkout_request_id):
    """
    STEP 3: Frontend polls this to check if payment completed
    """
    user_id = get_jwt_identity()
    
    payment = Payment.query.filter_by(
        checkout_request_id=checkout_request_id,
        user_id=user_id
    ).first()
    
    if not payment:
        return jsonify({'error': 'Payment not found'}), 404
    
    # Get booking info
    booking = Booking.query.get(payment.booking_id)
    
    return jsonify({
        'success': True,
        'payment': {
            'id': payment.id,
            'status': payment.status,
            'amount': float(payment.amount),
            'method': payment.method,
            'mpesa_receipt': payment.mpesa_receipt_number,
            'completed_at': payment.completed_at.isoformat() if payment.completed_at else None
        },
        'booking': {
            'id': booking.id,
            'status': booking.status,
            'payment_status': booking.payment_status,
            'confirmation': booking.confirmation
        }
    }), 200

@payment_bp.route('/booking/<int:booking_id>/payments', methods=['GET'])
@jwt_required()
def get_booking_payments(booking_id):
    """
    Get all payments for a specific booking
    """
    user_id = get_jwt_identity()
    
    # Verify booking belongs to user
    booking = Booking.query.filter_by(id=booking_id, user_id=user_id).first()
    if not booking:
        return jsonify({'error': 'Booking not found'}), 404
    
    payments = Payment.query.filter_by(booking_id=booking_id).order_by(
        Payment.created_at.desc()
    ).all()
    
    result = []
    for p in payments:
        result.append({
            'id': p.id,
            'amount': float(p.amount),
            'method': p.method,
            'status': p.status,
            'mpesa_receipt': p.mpesa_receipt_number,
            'created_at': p.created_at.isoformat() if p.created_at else None,
            'completed_at': p.completed_at.isoformat() if p.completed_at else None
        })
    
    return jsonify({
        'booking_id': booking_id,
        'total_paid': float(booking.total_amount - booking.pending_amount),
        'pending': float(booking.pending_amount),
        'payments': result
    }), 200

@payment_bp.route('/process', methods=['POST'])
@jwt_required()
def process_payment():
    """
    Legacy payment processing endpoint (for non-M-PESA methods)
    """
    user_id = get_jwt_identity()
    data = request.json
    
    # Validate required fields
    required_fields = ['booking_id', 'amount', 'method']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    booking = Booking.query.filter_by(id=data['booking_id'], user_id=user_id).first()
    if not booking:
        return jsonify({'error': 'Booking not found'}), 404
    
    if booking.payment_status == 'completed':
        return jsonify({'error': 'Payment already completed for this booking'}), 400
    
    # Create payment record
    payment = Payment(
        booking_id=data['booking_id'],
        user_id=user_id,
        property_id=booking.property_id,
        amount=Decimal(str(data['amount'])),
        method=data['method'],
        mpesa_number=data.get('mpesa_number'),
        status='completed'  # Assume success for non-M-PESA methods
    )
    
    # Update booking payment status
    booking.payment_status = 'completed'
    booking.confirmation = 'confirmed'
    
    # If it's a partial payment, calculate pending amount
    if booking.payment_type == 'partial':
        booking.pending_amount = booking.total_amount - payment.amount
    
    db.session.add(payment)
    db.session.commit()
    
    return jsonify({
        'id': payment.id,
        'booking_id': payment.booking_id,
        'amount': float(payment.amount),
        'method': payment.method,
        'status': payment.status,
        'transaction_id': payment.transaction_id or f'TXN{str(payment.id).zfill(8)}',
        'payment_date': payment.payment_date.isoformat()
    }), 201

# ==================== PAYPAL ENDPOINTS ====================

@payment_bp.route('/paypal/create-order', methods=['POST'])
@jwt_required()
def create_paypal_order():
    """
    Create a PayPal order for payment
    Expects: booking_id, amount (in KES or USD), currency (optional, default KES)
    """
    user_id = get_jwt_identity()
    data = request.json
    
    # Get PayPal config from env vars
    paypal_environment = current_app.config.get('PAYPAL_ENVIRONMENT', 'sandbox')
    paypal_client_id = current_app.config.get('PAYPAL_CLIENT_ID', '')
    paypal_secret = current_app.config.get('PAYPAL_CLIENT_SECRET', '')
    
    if not paypal_client_id or not paypal_secret:
        return jsonify({
            'success': False,
            'error': 'PayPal not configured'
        }), 500
    
    # Validate required fields
    required_fields = ['booking_id', 'amount']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    # Verify booking exists and belongs to user
    booking = Booking.query.filter_by(id=data['booking_id'], user_id=user_id).first()
    if not booking:
        return jsonify({'error': 'Booking not found'}), 404
    
    if booking.payment_status == 'completed':
        return jsonify({'error': 'Payment already completed for this booking'}), 400
    
    # Get amount and handle currency conversion
    amount = Decimal(str(data['amount']))
    currency = data.get('currency', 'KES')
    
    # Convert KES to USD for PayPal using configured rate
    exchange_rate = current_app.config.get('KES_TO_USD_RATE', 129.0)
    
    if currency == 'KES':
        amount_usd = float(amount) / exchange_rate
        currency = 'USD'
    else:
        amount_usd = float(amount)
    
    # Create pending payment record
    payment = Payment(
        booking_id=data['booking_id'],
        user_id=user_id,
        property_id=booking.property_id,
        amount=Decimal(str(data['amount'])),  # Store original KES amount
        method='paypal',
        status='pending'
    )
    db.session.add(payment)
    db.session.commit()
    
    # Create PayPal order
    try:
        paypal_service = PayPalService()
        description = f"Booking #{booking.id} - Homes by Mwema"
        
        # Get return/cancel URLs from env vars or request
        return_url = data.get('return_url') or current_app.config.get('PAYPAL_RETURN_URL')
        cancel_url = data.get('cancel_url') or current_app.config.get('PAYPAL_CANCEL_URL')
        
        result = paypal_service.create_order(
            amount=amount_usd,
            currency=currency,
            booking_id=booking.id,
            description=description,
            return_url=return_url,
            cancel_url=cancel_url
        )
        
        if result['success']:
            # Store PayPal order ID in payment record
            payment.transaction_id = result['order_id']
            payment.mpesa_response_description = f"PayPal Order: {result['status']} | Rate: {exchange_rate}"
            db.session.commit()
            
            return jsonify({
                'success': True,
                'payment_id': payment.id,
                'order_id': result['order_id'],
                'status': result['status'],
                'approval_url': result['approval_url'],
                'amount_usd': amount_usd,
                'original_amount_kes': float(data['amount']),
                'exchange_rate': exchange_rate
            }), 200
        else:
            payment.status = 'failed'
            payment.mpesa_response_description = result.get('error', 'Order creation failed')
            db.session.commit()
            
            return jsonify({
                'success': False,
                'error': result.get('error', 'Failed to create PayPal order')
            }), 400
            
    except Exception as e:
        payment.status = 'failed'
        payment.mpesa_response_description = str(e)
        db.session.commit()
        
        return jsonify({
            'success': False,
            'error': f'Error creating PayPal order: {str(e)}'
        }), 500

@payment_bp.route('/paypal/capture-order', methods=['POST'])
@jwt_required()
def capture_paypal_order():
    """
    Capture (complete) a PayPal payment after user approval
    Expects: order_id
    """
    user_id = get_jwt_identity()
    data = request.json
    
    if 'order_id' not in data:
        return jsonify({'error': 'Missing required field: order_id'}), 400
    
    order_id = data['order_id']
    
    # Find payment by PayPal order ID
    payment = Payment.query.filter_by(
        transaction_id=order_id,
        user_id=user_id,
        method='paypal'
    ).first()
    
    if not payment:
        return jsonify({'error': 'Payment not found'}), 404
    
    if payment.status == 'completed':
        return jsonify({'error': 'Payment already completed'}), 400
    
    try:
        paypal_service = PayPalService()
        result = paypal_service.capture_order(order_id)
        
        if result['success'] and result['status'] == 'COMPLETED':
            # Update payment record
            payment.status = 'completed'
            payment.completed_at = datetime.utcnow()
            
            # Store capture transaction ID
            if result.get('capture'):
                payment.mpesa_receipt_number = result['capture'].get('transaction_id')
            
            payment.mpesa_response_description = f"PayPal payment completed: {result['status']}"
            
            # Update booking status
            booking = Booking.query.get(payment.booking_id)
            if booking:
                booking.payment_status = 'completed'
                booking.confirmation = 'confirmed'
                booking.payment_method = 'paypal'
                
                # Handle partial payments
                if booking.payment_type == 'partial':
                    paid_amount = db.session.query(
                        db.func.sum(Payment.amount)
                    ).filter(
                        Payment.booking_id == booking.id,
                        Payment.status == 'completed'
                    ).scalar() or Decimal('0')
                    
                    booking.pending_amount = booking.total_amount - paid_amount
                    
                    if booking.pending_amount > 0:
                        booking.payment_status = 'partial'
                
                # Clear expiry since payment received
                booking.expires_at = None
            
            db.session.commit()
            
            return jsonify({
                'success': True,
                'payment_id': payment.id,
                'order_id': order_id,
                'status': 'completed',
                'transaction_id': result['capture'].get('transaction_id') if result.get('capture') else None,
                'payer': result.get('payer', {})
            }), 200
        else:
            payment.status = 'failed'
            payment.mpesa_response_description = result.get('error', 'Capture failed')
            db.session.commit()
            
            return jsonify({
                'success': False,
                'error': result.get('error', 'Failed to capture payment')
            }), 400
            
    except Exception as e:
        payment.status = 'failed'
        payment.mpesa_response_description = str(e)
        db.session.commit()
        
        return jsonify({
            'success': False,
            'error': f'Error capturing PayPal payment: {str(e)}'
        }), 500

@payment_bp.route('/paypal/order/<order_id>', methods=['GET'])
@jwt_required()
def get_paypal_order(order_id):
    """
    Get PayPal order details
    """
    user_id = get_jwt_identity()
    
    # Verify payment belongs to user
    payment = Payment.query.filter_by(
        transaction_id=order_id,
        user_id=user_id,
        method='paypal'
    ).first()
    
    if not payment:
        return jsonify({'error': 'Payment not found'}), 404
    
    try:
        paypal_service = PayPalService()
        result = paypal_service.get_order_details(order_id)
        
        if result['success']:
            return jsonify({
                'success': True,
                'order_id': result['order_id'],
                'status': result['status'],
                'payment_status': payment.status,
                'amount': float(payment.amount),
                'create_time': result.get('create_time'),
                'update_time': result.get('update_time')
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': result.get('error', 'Failed to get order details')
            }), 400
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@payment_bp.route('/paypal/webhook', methods=['POST'])
def paypal_webhook():
    """
    PayPal webhook endpoint for payment events
    Verifies signature using PAYPAL_WEBHOOK_ID from env vars
    """
    try:
        # Get webhook ID from env vars
        webhook_id = current_app.config.get('PAYPAL_WEBHOOK_ID', '')
        
        if not webhook_id:
            logger.warning("PAYPAL_WEBHOOK_ID not configured")
            return jsonify({'status': 'ignored'}), 200
        
        # Verify webhook signature
        paypal_service = PayPalService()
        is_valid = paypal_service.verify_webhook_signature(
            headers=request.headers,
            body=request.get_data(as_text=True),
            webhook_id=webhook_id
        )
        
        if not is_valid:
            logger.warning("Invalid PayPal webhook signature")
            return jsonify({'error': 'Invalid signature'}), 401
        
        event = request.json
        event_type = event.get('event_type')
        resource = event.get('resource', {})
        
        # Handle different event types
        if event_type == 'PAYMENT.CAPTURE.COMPLETED':
            # Payment was successfully captured
            order_id = resource.get('supplementary_data', {}).get('related_ids', {}).get('order_id')
            
            if order_id:
                payment = Payment.query.filter_by(
                    transaction_id=order_id,
                    method='paypal'
                ).first()
                
                if payment and payment.status != 'completed':
                    payment.status = 'completed'
                    payment.completed_at = datetime.utcnow()
                    payment.mpesa_receipt_number = resource.get('id')
                    
                    # Update booking
                    booking = Booking.query.get(payment.booking_id)
                    if booking:
                        booking.payment_status = 'completed'
                        booking.confirmation = 'confirmed'
                        booking.expires_at = None
                    
                    db.session.commit()
                    logger.info(f"PayPal payment completed via webhook: {order_id}")
        
        elif event_type == 'PAYMENT.CAPTURE.DENIED':
            # Payment was denied
            order_id = resource.get('supplementary_data', {}).get('related_ids', {}).get('order_id')
            
            if order_id:
                payment = Payment.query.filter_by(
                    transaction_id=order_id,
                    method='paypal'
                ).first()
                
                if payment:
                    payment.status = 'failed'
                    payment.mpesa_response_description = 'Payment denied'
                    db.session.commit()
                    logger.warning(f"PayPal payment denied: {order_id}")
        
        elif event_type == 'PAYMENT.CAPTURE.REFUNDED':
            # Payment was refunded
            capture_id = resource.get('id')
            
            payment = Payment.query.filter_by(
                mpesa_receipt_number=capture_id,
                method='paypal'
            ).first()
            
            if payment:
                payment.status = 'refunded'
                db.session.commit()
                logger.info(f"PayPal payment refunded: {capture_id}")
        
        return jsonify({'status': 'ok'}), 200
        
    except Exception as e:
        logger.error(f"PayPal webhook error: {str(e)}")
        return jsonify({'status': 'error'}), 500

@payment_bp.route('/paypal/refund', methods=['POST'])
@jwt_required()
def refund_paypal_payment():
    """
    Refund a PayPal payment (admin only)
    Expects: payment_id, amount (optional for partial refund)
    """
    from models import User
    
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or user.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    
    data = request.json
    
    if 'payment_id' not in data:
        return jsonify({'error': 'Missing required field: payment_id'}), 400
    
    payment = Payment.query.filter_by(
        id=data['payment_id'],
        method='paypal',
        status='completed'
    ).first()
    
    if not payment:
        return jsonify({'error': 'Completed PayPal payment not found'}), 404
    
    if not payment.mpesa_receipt_number:
        return jsonify({'error': 'Capture ID not found for this payment'}), 400
    
    try:
        paypal_service = PayPalService()
        
        # Get exchange rate for conversion
        exchange_rate = current_app.config.get('KES_TO_USD_RATE', 129.0)
        
        # Convert refund amount to USD if provided
        refund_amount = None
        if data.get('amount'):
            refund_amount = float(data['amount']) / exchange_rate
        
        result = paypal_service.refund_capture(
            capture_id=payment.mpesa_receipt_number,
            amount=refund_amount,
            note=data.get('note', 'Refund from Homes by Mwema')
        )
        
        if result['success']:
            payment.status = 'refunded'
            payment.mpesa_response_description = f"Refunded: {result['refund_id']}"
            
            # Update booking status
            booking = Booking.query.get(payment.booking_id)
            if booking:
                booking.payment_status = 'refunded'
            
            db.session.commit()
            
            return jsonify({
                'success': True,
                'refund_id': result['refund_id'],
                'status': result['status'],
                'amount': result.get('amount')
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': result.get('error', 'Refund failed')
            }), 400
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ==================== M-PESA API SIMULATION ====================

def call_mpesa_api(phone_number, amount, account_reference, transaction_desc):
    """
    Call M-PESA API with credentials from environment variables
    In production, this calls the actual Daraja API
    """
    try:
        # Get M-PESA config from env vars
        environment = current_app.config.get('MPESA_ENVIRONMENT', 'sandbox')
        consumer_key = current_app.config.get('MPESA_CONSUMER_KEY', '')
        consumer_secret = current_app.config.get('MPESA_CONSUMER_SECRET', '')
        business_short_code = current_app.config.get('MPESA_BUSINESS_SHORT_CODE', '174379')
        passkey = current_app.config.get('MPESA_PASSKEY', '')
        callback_url = current_app.config.get('MPESA_CALLBACK_URL', '')
        
        # For sandbox/testing without actual credentials, return mock success
        if environment == 'sandbox' and (not consumer_key or not consumer_secret):
            logger.info("Using mock M-PESA response (sandbox mode)")
            return {
                'success': True,
                'MerchantRequestID': str(uuid.uuid4()),
                'CheckoutRequestID': f"ws_CO_{datetime.now().timestamp()}_{phone_number}",
                'ResponseCode': '0',
                'ResponseDescription': 'Success. Request accepted for processing',
                'CustomerMessage': 'Success. Request accepted for processing'
            }
        
        # TODO: Implement actual M-PESA API call here
        # This is where you'd use the credentials to call the real Daraja API
        
        return {
            'success': True,
            'MerchantRequestID': str(uuid.uuid4()),
            'CheckoutRequestID': f"ws_CO_{datetime.now().timestamp()}_{phone_number}",
            'ResponseCode': '0',
            'ResponseDescription': 'Success. Request accepted for processing',
            'CustomerMessage': 'Success. Request accepted for processing'
        }
        
    except Exception as e:
        logger.error(f"M-PESA API error: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

# ==================== ADMIN ENDPOINTS ====================

@payment_bp.route('/admin/pending', methods=['GET'])
@jwt_required()
def get_pending_payments():
    """
    Admin: Get all pending payments
    """
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Get timeout from env vars
    timeout_minutes = current_app.config.get('BOOKING_TIMEOUT_MINUTES', 15)
    
    # Get all pending payments older than configured time
    check_time = datetime.utcnow() - timedelta(minutes=timeout_minutes - 5)
    
    pending = Payment.query.filter(
        Payment.status == 'pending',
        Payment.created_at < check_time
    ).order_by(Payment.created_at.desc()).all()
    
    result = []
    for p in pending:
        result.append({
            'id': p.id,
            'booking_id': p.booking_id,
            'user_id': p.user_id,
            'amount': float(p.amount),
            'phone': p.mpesa_number,
            'checkout_id': p.checkout_request_id,
            'created_at': p.created_at.isoformat(),
            'minutes_ago': int((datetime.utcnow() - p.created_at).total_seconds() / 60)
        })
    
    return jsonify(result), 200

@payment_bp.route('/admin/failed', methods=['GET'])
@jwt_required()
def get_failed_payments():
    """
    Admin: Get failed payments for monitoring
    """
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    failed = Payment.query.filter(
        Payment.status == 'failed'
    ).order_by(Payment.created_at.desc()).limit(50).all()
    
    result = []
    for p in failed:
        result.append({
            'id': p.id,
            'booking_id': p.booking_id,
            'amount': float(p.amount),
            'error': p.error_log,
            'created_at': p.created_at.isoformat()
        })
    
    return jsonify(result), 200

# ==================== BACKGROUND TASKS ====================

def cleanup_old_payments():
    """
    Background task to mark very old pending payments as abandoned
    Run every hour
    """
    try:
        one_hour_ago = datetime.utcnow() - timedelta(hours=1)
        
        # Find payments pending for over an hour
        old_payments = Payment.query.filter(
            Payment.status == 'pending',
            Payment.created_at < one_hour_ago
        ).all()
        
        for payment in old_payments:
            payment.status = 'abandoned'
            logger.info(f"Payment {payment.id} marked as abandoned")
        
        db.session.commit()
        return len(old_payments)
        
    except Exception as e:
        logger.error(f"Cleanup error: {str(e)}")
        return 0

# ==================== HELPER FUNCTION FOR PHONE FORMATTING ====================

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