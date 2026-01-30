from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Payment, Booking
from werkzeug.exceptions import BadRequest
from decimal import Decimal
from mpesa_service import MPesaService, format_phone_number
from paypal_service import PayPalService, PayPalError, convert_kes_to_usd
from datetime import datetime

payment_bp = Blueprint('payment', __name__)

@payment_bp.route('/mpesa/initiate', methods=['POST'])
@jwt_required()
def initiate_mpesa_payment():
    """
    Initiate M-PESA STK Push payment
    Expects: booking_id, phone_number, amount
    """
    user_id = get_jwt_identity()
    data = request.json
    
    # Validate required fields
    required_fields = ['booking_id', 'phone_number', 'amount']
    for field in required_fields:
        if field not in data:
            raise BadRequest(f'Missing required field: {field}')
    
    # Verify booking exists and belongs to user
    booking = Booking.query.filter_by(id=data['booking_id'], user_id=user_id).first()
    if not booking:
        return jsonify({'error': 'Booking not found'}), 404
    
    if booking.payment_status == 'completed':
        return jsonify({'error': 'Payment already completed for this booking'}), 400
    
    # Format phone number
    phone_number = format_phone_number(data['phone_number'])
    amount = Decimal(str(data['amount']))
    
    # Create pending payment record
    payment = Payment(
        booking_id=data['booking_id'],
        user_id=user_id,
        property_id=booking.property_id,
        amount=amount,
        method='mpesa',
        mpesa_number=phone_number,
        status='pending'
    )
    db.session.add(payment)
    db.session.commit()
    
    # Initiate M-PESA STK Push
    try:
        mpesa_service = MPesaService()
        account_reference = f"BOOKING-{booking.id}"
        transaction_desc = f"Payment for booking #{booking.id}"
        
        result = mpesa_service.stk_push(
            phone_number=phone_number,
            amount=float(amount),
            account_reference=account_reference,
            transaction_desc=transaction_desc
        )
        
        if result['success']:
            # Update payment with M-PESA details
            payment.merchant_request_id = result['merchant_request_id']
            payment.checkout_request_id = result['checkout_request_id']
            payment.mpesa_response_code = result['response_code']
            payment.mpesa_response_description = result['response_description']
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': result['customer_message'],
                'payment_id': payment.id,
                'checkout_request_id': result['checkout_request_id']
            }), 200
        else:
            # Mark payment as failed
            payment.status = 'failed'
            payment.mpesa_response_description = result.get('error', 'STK Push failed')
            db.session.commit()
            
            return jsonify({
                'success': False,
                'error': result.get('error', 'Failed to initiate payment')
            }), 400
            
    except Exception as e:
        payment.status = 'failed'
        payment.mpesa_response_description = str(e)
        db.session.commit()
        
        return jsonify({
            'success': False,
            'error': f'Error initiating M-PESA payment: {str(e)}'
        }), 500

@payment_bp.route('/mpesa/callback', methods=['POST'])
def mpesa_callback():
    """
    M-PESA callback endpoint
    Receives payment status updates from Safaricom
    """
    try:
        callback_data = request.json
        
        # Process callback
        mpesa_service = MPesaService()
        result = mpesa_service.process_callback(callback_data)
        
        if result.get('success'):
            # Find payment by checkout_request_id
            payment = Payment.query.filter_by(
                checkout_request_id=result['checkout_request_id']
            ).first()
            
            if payment:
                # Update payment status
                payment.status = 'completed'
                payment.mpesa_receipt_number = result['mpesa_receipt_number']
                payment.transaction_id = result['mpesa_receipt_number']
                payment.completed_at = datetime.utcnow()
                
                # Update booking status
                booking = Booking.query.get(payment.booking_id)
                if booking:
                    booking.payment_status = 'completed'
                    booking.confirmation = 'confirmed'
                    
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
                
                db.session.commit()
                
                return jsonify({'ResultCode': 0, 'ResultDesc': 'Success'}), 200
            else:
                return jsonify({'ResultCode': 1, 'ResultDesc': 'Payment not found'}), 404
        else:
            # Payment failed
            checkout_request_id = result.get('checkout_request_id')
            if checkout_request_id:
                payment = Payment.query.filter_by(
                    checkout_request_id=checkout_request_id
                ).first()
                
                if payment:
                    payment.status = 'failed'
                    payment.mpesa_response_description = result.get('result_desc', 'Payment failed')
                    db.session.commit()
            
            return jsonify({'ResultCode': 0, 'ResultDesc': 'Acknowledged'}), 200
            
    except Exception as e:
        return jsonify({'ResultCode': 1, 'ResultDesc': f'Error: {str(e)}'}), 500

@payment_bp.route('/mpesa/query/<checkout_request_id>', methods=['GET'])
@jwt_required()
def query_mpesa_status(checkout_request_id):
    """
    Query M-PESA transaction status
    """
    user_id = get_jwt_identity()
    
    # Verify payment belongs to user
    payment = Payment.query.filter_by(
        checkout_request_id=checkout_request_id,
        user_id=user_id
    ).first()
    
    if not payment:
        return jsonify({'error': 'Payment not found'}), 404
    
    try:
        mpesa_service = MPesaService()
        result = mpesa_service.query_stk_push_status(checkout_request_id)
        
        if result['success']:
            # Update payment status if needed
            if result['result_code'] == '0' and payment.status == 'pending':
                payment.status = 'completed'
                payment.completed_at = datetime.utcnow()
                
                # Update booking
                booking = Booking.query.get(payment.booking_id)
                if booking:
                    booking.payment_status = 'completed'
                    booking.confirmation = 'confirmed'
                
                db.session.commit()
            
            return jsonify({
                'success': True,
                'status': payment.status,
                'result_code': result['result_code'],
                'result_desc': result['result_desc']
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': result.get('error', 'Query failed')
            }), 400
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

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
            raise BadRequest(f'Missing required field: {field}')
    
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

@payment_bp.route('/booking/<booking_id>', methods=['GET'])
@jwt_required()
def get_booking_payments(booking_id):
    """
    Get all payments for a booking
    """
    user_id = get_jwt_identity()
    
    # Verify user owns the booking
    booking = Booking.query.filter_by(id=booking_id, user_id=user_id).first()
    if not booking:
        return jsonify({'error': 'Booking not found'}), 404
    
    payments = Payment.query.filter_by(booking_id=booking_id).all()
    
    result = []
    for payment in payments:
        result.append({
            'id': payment.id,
            'amount': float(payment.amount),
            'method': payment.method,
            'status': payment.status,
            'transaction_id': payment.transaction_id or payment.mpesa_receipt_number,
            'mpesa_receipt': payment.mpesa_receipt_number,
            'payment_date': payment.payment_date.isoformat()
        })
    
    return jsonify(result)


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
    
    # Validate required fields
    required_fields = ['booking_id', 'amount']
    for field in required_fields:
        if field not in data:
            raise BadRequest(f'Missing required field: {field}')
    
    # Verify booking exists and belongs to user
    booking = Booking.query.filter_by(id=data['booking_id'], user_id=user_id).first()
    if not booking:
        return jsonify({'error': 'Booking not found'}), 404
    
    if booking.payment_status == 'completed':
        return jsonify({'error': 'Payment already completed for this booking'}), 400
    
    # Get amount and handle currency conversion
    amount = Decimal(str(data['amount']))
    currency = data.get('currency', 'KES')
    
    # Convert KES to USD for PayPal using live market rate
    exchange_rate_used = None
    if currency == 'KES':
        amount_usd, exchange_rate_used = convert_kes_to_usd(float(amount))
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
        
        result = paypal_service.create_order(
            amount=amount_usd,
            currency=currency,
            booking_id=booking.id,
            description=description,
            return_url=data.get('return_url'),
            cancel_url=data.get('cancel_url')
        )
        
        if result['success']:
            # Store PayPal order ID in payment record
            payment.transaction_id = result['order_id']
            payment.mpesa_response_description = f"PayPal Order: {result['status']} | Rate: {exchange_rate_used}"
            db.session.commit()
            
            return jsonify({
                'success': True,
                'payment_id': payment.id,
                'order_id': result['order_id'],
                'status': result['status'],
                'approval_url': result['approval_url'],
                'amount_usd': amount_usd,
                'original_amount_kes': float(data['amount']),
                'exchange_rate': exchange_rate_used
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
        raise BadRequest('Missing required field: order_id')
    
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
    """
    try:
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
                    
                    db.session.commit()
        
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
        
        return jsonify({'status': 'ok'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


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
        raise BadRequest('Missing required field: payment_id')
    
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
        
        # Convert refund amount to USD if provided
        refund_amount = None
        if data.get('amount'):
            refund_amount = convert_kes_to_usd(float(data['amount']))
        
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