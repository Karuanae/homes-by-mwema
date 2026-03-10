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
    """
    # Get signature from headers
    signature = request.headers.get('X-Mpesa-Signature')
    
    # For sandbox/testing, we might skip verification
    if current_app.config.get('MPESA_ENVIRONMENT') == 'sandbox':
        return True
    
    if not signature:
        logger.warning("Missing M-PESA signature")
        return False
    
    # Calculate expected signature
    # You'll implement this based on your M-PESA setup
    expected = hmac.new(
        current_app.config['MPESA_SECRET'].encode(),
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
        # Call M-PESA API (Daraja)
        # This is simplified - you'll integrate with your M-PESA service
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
    logger.info(f"📞 M-PESA Callback received: {request.json}")
    
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

# ==================== M-PESA API SIMULATION ====================

def call_mpesa_api(phone_number, amount, account_reference, transaction_desc):
    """
    Simulate calling M-PESA API
    In production, replace with actual Daraja API call
    """
    try:
        # This is where you'd call the real M-PESA API
        # For now, return success for testing
        
        # Generate fake checkout request ID
        checkout_id = f"ws_CO_{datetime.now().timestamp()}_{phone_number}"
        
        return {
            'success': True,
            'MerchantRequestID': str(uuid.uuid4()),
            'CheckoutRequestID': checkout_id,
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
    
    # Get all pending payments older than 2 minutes
    five_min_ago = datetime.utcnow() - timedelta(minutes=5)
    
    pending = Payment.query.filter(
        Payment.status == 'pending',
        Payment.created_at < five_min_ago
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