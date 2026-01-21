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
    
    # Validate required fields
    required_fields = ['property_id', 'check_in', 'check_out', 'guests']
    for field in required_fields:
        if field not in data:
            raise BadRequest(f'Missing required field: {field}')
    
    property = Property.query.get(data['property_id'])
    if not property:
        return jsonify({'error': 'Property not found'}), 404
    
    # Parse dates
    try:
        check_in = datetime.strptime(data['check_in'], '%Y-%m-%d').date()
        check_out = datetime.strptime(data['check_out'], '%Y-%m-%d').date()
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
        property_id=data['property_id'],
        check_in=check_in,
        check_out=check_out,
        guests=data['guests'],
        nights=nights,
        base_amount=base_amount,
        cleaning_fee=cleaning_fee,
        service_fee=service_fee,
        total_amount=total_amount,
        pending_amount=Decimal('0'),
        payment_type=data.get('payment_type', 'full'),
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
            'check_in': booking.check_in.isoformat(),
            'check_out': booking.check_out.isoformat(),
            'nights': booking.nights,
            'guests': booking.guests,
            'total_amount': float(booking.total_amount),
            'payment_status': booking.payment_status,
            'confirmation': booking.confirmation,
            'status': booking.status,
            'created_at': booking.created_at.isoformat()
        })
    
    return jsonify(result)