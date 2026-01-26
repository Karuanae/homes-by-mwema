from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Booking, Property, User
from werkzeug.exceptions import BadRequest
from datetime import datetime
from decimal import Decimal

booking_bp = Blueprint('booking', __name__)

@booking_bp.route('', methods=['POST'])
@jwt_required()
def create_booking():
    user_id = get_jwt_identity()
    data = request.json
    
    # Normalize field names (accept both camelCase and snake_case)
    property_id = data.get('property_id') or data.get('propertyId')
    check_in_str = data.get('check_in') or data.get('checkIn')
    check_out_str = data.get('check_out') or data.get('checkOut')
    guests = data.get('guests')
    payment_type = data.get('payment_type') or data.get('paymentType', 'full')
    payment_method = data.get('payment_method') or data.get('paymentMethod')
    message_to_host = data.get('message_to_host') or data.get('messageToHost')
    
    # Validate required fields
    if not property_id:
        return jsonify({'error': 'Missing required field: property_id'}), 400
    if not check_in_str:
        return jsonify({'error': 'Missing required field: check_in'}), 400
    if not check_out_str:
        return jsonify({'error': 'Missing required field: check_out'}), 400
    if not guests:
        return jsonify({'error': 'Missing required field: guests'}), 400
    
    property = Property.query.get(property_id)
    if not property:
        return jsonify({'error': 'Property not found'}), 404
    
    # Parse dates
    try:
        check_in = datetime.strptime(check_in_str, '%Y-%m-%d').date()
        check_out = datetime.strptime(check_out_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    
    # Calculate nights
    nights = (check_out - check_in).days
    if nights <= 0:
        return jsonify({'error': 'Check-out date must be after check-in date'}), 400
    
    # Calculate amounts
    base_amount = property.price * nights
    cleaning_fee = Decimal('1500')
    service_fee = base_amount * Decimal('0.12')
    total_amount = base_amount + cleaning_fee + service_fee
    
    # Create booking
    booking = Booking(
        user_id=user_id,
        property_id=property_id,
        check_in=check_in,
        check_out=check_out,
        guests=guests,
        nights=nights,
        base_amount=base_amount,
        cleaning_fee=cleaning_fee,
        service_fee=service_fee,
        total_amount=total_amount,
        pending_amount=Decimal('0'),
        payment_type=payment_type,
        payment_method=payment_method,
        message_to_host=message_to_host,
        status='upcoming',
        confirmation='pending'
    )
    
    # Update property bookings count
    property.bookings_count = (property.bookings_count or 0) + 1
    
    db.session.add(booking)
    db.session.commit()
    
    return jsonify({
        'id': booking.id,
        'property': booking.property.name,
        'check_in': booking.check_in.isoformat(),
        'check_out': booking.check_out.isoformat(),
        'nights': booking.nights,
        'total_amount': float(booking.total_amount),
        'status': booking.status,
        'created_at': booking.created_at.isoformat()
    }), 201

@booking_bp.route('/my-bookings', methods=['GET'])
@jwt_required()
def get_my_bookings():
    user_id = get_jwt_identity()
    bookings = Booking.query.filter_by(user_id=user_id).all()
    
    result = []
    for booking in bookings:
        result.append({
            'id': booking.id,
            'property': {
                'id': booking.property.id,
                'name': booking.property.name,
                'location': booking.property.location,
                'image': booking.property.images[0] if booking.property.images else None
            },
            'propertyName': booking.property.name,
            'propertyLocation': booking.property.location,
            'propertyImage': booking.property.images[0] if booking.property.images else None,
            'checkIn': booking.check_in.isoformat(),
            'checkOut': booking.check_out.isoformat(),
            'check_in': booking.check_in.isoformat(),
            'check_out': booking.check_out.isoformat(),
            'nights': booking.nights,
            'guests': booking.guests,
            'amount': float(booking.base_amount),
            'totalAmount': float(booking.total_amount),
            'total_amount': float(booking.total_amount),
            'pendingAmount': float(booking.pending_amount) if booking.pending_amount else 0,
            'paymentType': booking.payment_type,
            'paymentStatus': booking.payment_status,
            'payment_status': booking.payment_status,
            'confirmation': booking.confirmation,
            'status': booking.status,
            'createdAt': booking.created_at.isoformat(),
            'created_at': booking.created_at.isoformat()
        })
    
    return jsonify(result)