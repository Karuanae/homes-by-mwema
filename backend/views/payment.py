from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Payment, Booking
from werkzeug.exceptions import BadRequest
from decimal import Decimal
from mpesa_service import MPesaService, format_phone_number
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