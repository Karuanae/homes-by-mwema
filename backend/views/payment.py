from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Payment, Booking
from werkzeug.exceptions import BadRequest
from decimal import Decimal

payment_bp = Blueprint('payment', __name__)

@payment_bp.route('/process', methods=['POST'])
@jwt_required()
def process_payment():
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
        status='completed'  # Assume success for now
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
        'transaction_id': payment.transaction_id or f'TXN{payment.id[:8].upper()}',
        'payment_date': payment.payment_date.isoformat()
    }), 201

@payment_bp.route('/booking/<booking_id>', methods=['GET'])
@jwt_required()
def get_booking_payments(booking_id):
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
            'transaction_id': payment.transaction_id,
            'payment_date': payment.payment_date.isoformat()
        })
    
    return jsonify(result)