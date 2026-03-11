from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Booking, Property, User
from sqlalchemy import and_, or_
from datetime import datetime, timedelta
from decimal import Decimal
import uuid
import logging

booking_bp = Blueprint('booking', __name__)
logger = logging.getLogger(__name__)

def check_property_availability(property_id, check_in, check_out, exclude_booking_id=None):
    """
    SIMPLE availability check:
    Returns (is_available, conflicting_bookings)
    """
    # Convert string dates if needed
    if isinstance(check_in, str):
        check_in = datetime.strptime(check_in, '%Y-%m-%d').date()
    if isinstance(check_out, str):
        check_out = datetime.strptime(check_out, '%Y-%m-%d').date()
    
    # Build query for bookings that conflict with requested dates
    query = Booking.query.filter(
        Booking.property_id == property_id,
        # Only active bookings block availability
        Booking.status.in_(['pending', 'confirmed', 'upcoming']),
        # Overlap condition: 
        # Existing booking starts before new checkout AND
        # Existing booking ends after new checkin
        Booking.check_in < check_out,
        Booking.check_out > check_in
    )
    
    # Exclude current booking if updating
    if exclude_booking_id:
        query = query.filter(Booking.id != exclude_booking_id)
    
    # Get all conflicting bookings
    conflicting = query.all()
    
    return len(conflicting) == 0, conflicting

@booking_bp.route('', methods=['POST'])
@jwt_required()
def create_booking():
    """
    Create a new booking with configurable timeout
    All settings come from environment variables
    """
    try:
        user_id = get_jwt_identity()
        data = request.json
        
        # LOG INCOMING DATA
        logger.info(f"📥 Booking request from user {user_id}")
        logger.info(f"📦 Booking data: {data}")
        
        # CHECK CONFIG VALUES
        logger.info("🔍 Checking configuration values:")
        try:
            cleaning_fee = Decimal(str(current_app.config['CLEANING_FEE']))
            logger.info(f"  ✅ CLEANING_FEE: {cleaning_fee}")
        except Exception as e:
            logger.error(f"  ❌ CLEANING_FEE error: {str(e)}")
            return jsonify({'error': 'Configuration error: CLEANING_FEE'}), 500
            
        try:
            service_fee_percentage = Decimal(str(current_app.config['SERVICE_FEE_PERCENTAGE'])) / 100
            logger.info(f"  ✅ SERVICE_FEE_PERCENTAGE: {current_app.config['SERVICE_FEE_PERCENTAGE']}")
        except Exception as e:
            logger.error(f"  ❌ SERVICE_FEE_PERCENTAGE error: {str(e)}")
            return jsonify({'error': 'Configuration error: SERVICE_FEE_PERCENTAGE'}), 500
            
        try:
            timeout_minutes = current_app.config['BOOKING_TIMEOUT_MINUTES']
            logger.info(f"  ✅ BOOKING_TIMEOUT_MINUTES: {timeout_minutes}")
        except Exception as e:
            logger.error(f"  ❌ BOOKING_TIMEOUT_MINUTES error: {str(e)}")
            return jsonify({'error': 'Configuration error: BOOKING_TIMEOUT_MINUTES'}), 500
            
        try:
            max_guests = current_app.config['MAX_GUESTS_PER_BOOKING']
            logger.info(f"  ✅ MAX_GUESTS_PER_BOOKING: {max_guests}")
        except Exception as e:
            logger.error(f"  ❌ MAX_GUESTS_PER_BOOKING error: {str(e)}")
            return jsonify({'error': 'Configuration error: MAX_GUESTS_PER_BOOKING'}), 500
            
        try:
            min_nights = current_app.config['MIN_NIGHTS_BOOKING']
            logger.info(f"  ✅ MIN_NIGHTS_BOOKING: {min_nights}")
        except Exception as e:
            logger.error(f"  ❌ MIN_NIGHTS_BOOKING error: {str(e)}")
            return jsonify({'error': 'Configuration error: MIN_NIGHTS_BOOKING'}), 500
            
        try:
            max_nights = current_app.config['MAX_NIGHTS_BOOKING']
            logger.info(f"  ✅ MAX_NIGHTS_BOOKING: {max_nights}")
        except Exception as e:
            logger.error(f"  ❌ MAX_NIGHTS_BOOKING error: {str(e)}")
            return jsonify({'error': 'Configuration error: MAX_NIGHTS_BOOKING'}), 500
        
        # Generate unique idempotency key
        idempotency_key = request.headers.get('Idempotency-Key')
        if not idempotency_key:
            idempotency_key = str(uuid.uuid4())
        logger.info(f"🔑 Idempotency Key: {idempotency_key}")
        
        # Check if already processed
        existing = Booking.query.filter_by(idempotency_key=idempotency_key).first()
        if existing:
            logger.info(f"🔄 Booking already exists with id: {existing.id}")
            return jsonify({
                'success': True,
                'booking_id': existing.id,
                'status': existing.status,
                'message': 'Booking already created'
            }), 200
        
        # Validate required fields
        logger.info("🔍 Validating required fields...")
        required_fields = ['property_id', 'check_in', 'check_out', 'guests']
        for field in required_fields:
            if field not in data:
                logger.error(f"❌ Missing required field: {field}")
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        # Parse and validate dates
        try:
            check_in = datetime.strptime(data['check_in'], '%Y-%m-%d').date()
            check_out = datetime.strptime(data['check_out'], '%Y-%m-%d').date()
            logger.info(f"📅 Dates: {check_in} to {check_out}")
        except ValueError as e:
            logger.error(f"❌ Invalid date format: {str(e)}")
            return jsonify({
                'success': False,
                'error': 'Invalid date format. Use YYYY-MM-DD'
            }), 400
        
        # Validate date logic
        if check_in >= check_out:
            logger.error("❌ Check-out must be after check-in")
            return jsonify({
                'success': False,
                'error': 'Check-out must be after check-in'
            }), 400
        
        if check_in < datetime.now().date():
            logger.error("❌ Check-in cannot be in the past")
            return jsonify({
                'success': False,
                'error': 'Check-in cannot be in the past'
            }), 400
        
        # Validate nights
        nights = (check_out - check_in).days
        logger.info(f"🌙 Nights: {nights}")
        
        if nights < min_nights:
            logger.error(f"❌ Minimum stay is {min_nights} nights")
            return jsonify({
                'success': False,
                'error': f'Minimum stay is {min_nights} night{"s" if min_nights > 1 else ""}'
            }), 400
        
        if nights > max_nights:
            logger.error(f"❌ Maximum stay is {max_nights} nights")
            return jsonify({
                'success': False,
                'error': f'Maximum stay is {max_nights} nights'
            }), 400
        
        # Validate guests
        total_guests = data['guests'].get('adults', 0) + data['guests'].get('children', 0)
        logger.info(f"👥 Total guests: {total_guests}")
        
        if total_guests > max_guests:
            logger.error(f"❌ Maximum {max_guests} guests allowed")
            return jsonify({
                'success': False,
                'error': f'Maximum {max_guests} guests allowed'
            }), 400
        
        # Get property
        property = Property.query.get(data['property_id'])
        if not property:
            logger.error(f"❌ Property not found: {data['property_id']}")
            return jsonify({
                'success': False,
                'error': 'Property not found'
            }), 404
        
        logger.info(f"🏠 Property found: {property.name} (${property.price})")
        
        # Check availability
        is_available, conflicts = check_property_availability(
            property.id, check_in, check_out
        )
        
        if not is_available:
            logger.warning(f"⚠️ Property not available for selected dates")
            conflict_dates = []
            for c in conflicts[:3]:
                conflict_dates.append({
                    'check_in': c.check_in.strftime('%b %d'),
                    'check_out': c.check_out.strftime('%b %d'),
                    'status': c.status
                })
            
            return jsonify({
                'success': False,
                'error': 'Property not available for selected dates',
                'conflicts': conflict_dates,
                'message': 'These dates are already booked. Please try different dates.'
            }), 409
        
        # Calculate amounts
        logger.info("💰 Calculating amounts...")
        base_amount = Decimal(str(property.price)) * Decimal(nights)
        cleaning_fee_amount = cleaning_fee
        service_fee = base_amount * service_fee_percentage
        total_amount = base_amount + cleaning_fee_amount + service_fee
        
        logger.info(f"  Base amount: {base_amount}")
        logger.info(f"  Cleaning fee: {cleaning_fee_amount}")
        logger.info(f"  Service fee: {service_fee}")
        logger.info(f"  Total: {total_amount}")
        
        # Payment type
        payment_type = data.get('payment_type', 'full')
        pending_amount = Decimal('0')
        
        if payment_type == 'partial':
            pending_amount = total_amount * Decimal('0.5')
            logger.info(f"💰 Partial payment: {pending_amount} deposit")
        
        # Create booking
        logger.info("📝 Creating booking object...")
        booking = Booking(
            user_id=user_id,
            property_id=property.id,
            check_in=check_in,
            check_out=check_out,
            guests=data['guests'],
            nights=nights,
            base_amount=base_amount,
            cleaning_fee=cleaning_fee_amount,
            service_fee=service_fee,
            total_amount=total_amount,
            pending_amount=pending_amount,
            payment_type=payment_type,
            payment_method=data.get('payment_method'),
            message_to_host=data.get('message_to_host'),
            status='pending',
            confirmation='pending',
            payment_status='pending',
            idempotency_key=idempotency_key,
            expires_at=datetime.utcnow() + timedelta(minutes=timeout_minutes),
            created_at=datetime.utcnow()
        )
        
        logger.info("💾 Saving to database...")
        db.session.add(booking)
        db.session.commit()
        
        logger.info(f"✅ Booking created successfully with ID: {booking.id}")

        # FIX: Build property image URL instead of passing the ORM object
        property_image_url = None
        if property.images and len(property.images) > 0:
            property_image_url = f"/api/admin/property-image/{property.images[0].id}"
        
        return jsonify({
            'success': True,
            'booking': {
                'id': booking.id,
                'property_id': property.id,
                'property_name': property.name,
                'property_location': property.location,
                'property_image': property_image_url,
                'check_in': check_in.strftime('%Y-%m-%d'),
                'check_out': check_out.strftime('%Y-%m-%d'),
                'check_in_display': check_in.strftime('%b %d, %Y'),
                'check_out_display': check_out.strftime('%b %d, %Y'),
                'nights': nights,
                'guests': data['guests'],
                'price_per_night': float(property.price),
                'base_amount': float(base_amount),
                'cleaning_fee': float(cleaning_fee_amount),
                'service_fee': float(service_fee),
                'total_amount': float(total_amount),
                'pending_amount': float(pending_amount) if pending_amount > 0 else 0,
                'payment_type': payment_type,
                'status': booking.status,
                'expires_at': booking.expires_at.isoformat(),
                'expires_in_minutes': timeout_minutes
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"❌❌❌ UNHANDLED EXCEPTION: {str(e)}")
        logger.error(f"❌ Error type: {type(e).__name__}")
        import traceback
        logger.error(f"❌ Traceback: {traceback.format_exc()}")
        return jsonify({
            'success': False,
            'error': 'Failed to create booking. Please try again.',
            'details': str(e)  # Remove in production
        }), 500

@booking_bp.route('/<int:booking_id>/status', methods=['GET'])
@jwt_required()
def get_booking_status(booking_id):
    """
    Check if booking is still valid (not expired)
    Used by frontend to show timeout warnings
    """
    user_id = get_jwt_identity()
    
    booking = Booking.query.filter_by(id=booking_id, user_id=user_id).first()
    if not booking:
        return jsonify({'error': 'Booking not found'}), 404
    
    # Check if expired
    now = datetime.utcnow()
    is_expired = booking.expires_at and booking.expires_at < now
    
    # Calculate time left
    time_left = None
    if booking.expires_at and not is_expired and booking.status == 'pending':
        diff = booking.expires_at - now
        time_left = {
            'minutes': diff.seconds // 60,
            'seconds': diff.seconds % 60,
            'total_seconds': diff.seconds
        }
    
    return jsonify({
        'id': booking.id,
        'status': booking.status,
        'payment_status': booking.payment_status,
        'is_expired': is_expired,
        'expires_at': booking.expires_at.isoformat() if booking.expires_at else None,
        'time_left': time_left
    }), 200

@booking_bp.route('/check-availability', methods=['POST'])
def check_availability():
    """
    Public endpoint to check property availability
    No login required - used on booking page
    """
    try:
        data = request.json
        
        property_id = data.get('property_id')
        check_in = data.get('check_in')
        check_out = data.get('check_out')
        
        if not all([property_id, check_in, check_out]):
            return jsonify({
                'success': False,
                'error': 'Missing required fields'
            }), 400
        
        try:
            check_in_date = datetime.strptime(check_in, '%Y-%m-%d').date()
            check_out_date = datetime.strptime(check_out, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({
                'success': False,
                'error': 'Invalid date format'
            }), 400
        
        # Verify property exists
        property_obj = Property.query.get(property_id)
        if not property_obj:
            return jsonify({
                'success': False,
                'error': 'Property not found',
                'available': False
            }), 404
        
        is_available, conflicts = check_property_availability(
            property_id, check_in_date, check_out_date
        )
        
        return jsonify({
            'success': True,
            'available': is_available,
            'check_in': check_in,
            'check_out': check_out,
            'message': 'Dates are available' if is_available else 'Dates are not available'
        }), 200
    except Exception as e:
        logger.error(f"Availability check error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to check availability',
            'available': False
        }), 500

@booking_bp.route('/my-bookings', methods=['GET'])
@jwt_required()
def get_my_bookings():
    """
    Get all bookings for current user
    Includes pending, upcoming, past
    """
    try:
        user_id = get_jwt_identity()
        
        # Get all user bookings
        bookings = Booking.query.filter_by(user_id=user_id).order_by(
            Booking.created_at.desc()
        ).all()
        
        result = []
        now = datetime.now().date()
        
        for booking in bookings:
            try:
                # Auto-update expired pending bookings
                if (booking.status == 'pending' and 
                    booking.expires_at and 
                    booking.expires_at < datetime.utcnow()):
                    booking.status = 'expired'
                    db.session.commit()
                
                # Determine display status
                display_status = booking.status
                if booking.status == 'confirmed' and booking.check_out < now:
                    display_status = 'completed'
                elif booking.status == 'confirmed' and booking.check_in <= now <= booking.check_out:
                    display_status = 'active'
                
                # Safely get property information
                property_obj = booking.property
                if not property_obj:
                    logger.warning(f"Booking {booking.id} has no associated property")
                    continue
                
                # FIX: Build property image URL instead of passing the ORM object
                property_image = None
                if property_obj.images and len(property_obj.images) > 0:
                    property_image = f"/api/admin/property-image/{property_obj.images[0].id}"
                
                result.append({
                    'id': booking.id,
                    'property_id': booking.property_id,
                    'property_name': property_obj.name,
                    'property_location': property_obj.location,
                    'property_image': property_image,
                    'check_in': booking.check_in.strftime('%Y-%m-%d'),
                    'check_out': booking.check_out.strftime('%Y-%m-%d'),
                    'check_in_display': booking.check_in.strftime('%b %d, %Y'),
                    'check_out_display': booking.check_out.strftime('%b %d, %Y'),
                    'nights': booking.nights,
                    'guests': booking.guests,
                    'total_amount': float(booking.total_amount),
                    'paid_amount': float(booking.total_amount - booking.pending_amount),
                    'pending_amount': float(booking.pending_amount) if booking.pending_amount else 0,
                    'payment_status': booking.payment_status,
                    'status': display_status,
                    'original_status': booking.status,
                    'expires_at': booking.expires_at.isoformat() if booking.expires_at else None,
                    'created_at': booking.created_at.isoformat() if booking.created_at else None,
                    'can_cancel': booking.status in ['pending', 'confirmed'] and booking.check_in > now
                })
            except Exception as e:
                logger.error(f"Error processing booking {booking.id}: {str(e)}")
                continue
        
        return jsonify(result), 200
    except Exception as e:
        logger.error(f"Get my bookings error: {str(e)}")
        return jsonify({
            'error': 'Failed to fetch bookings',
            'message': str(e)
        }), 500

@booking_bp.route('/<int:booking_id>/cancel', methods=['POST'])
@jwt_required()
def cancel_booking(booking_id):
    """
    Cancel a booking (user-initiated)
    """
    user_id = get_jwt_identity()
    
    booking = Booking.query.filter_by(id=booking_id, user_id=user_id).first()
    if not booking:
        return jsonify({'error': 'Booking not found'}), 404
    
    # Check if cancellation is allowed
    now = datetime.now().date()
    if booking.check_in <= now:
        return jsonify({
            'success': False,
            'error': 'Cannot cancel booking that has already started'
        }), 400
    
    # Update status
    booking.status = 'cancelled'
    booking.confirmation = 'cancelled'
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Booking cancelled successfully'
    }), 200

# Background task to expire old pending bookings
# Run this every minute via cron or scheduler
def expire_old_pending_bookings():
    """
    Find pending bookings older than configured minutes and expire them
    Call this function every minute from a background task
    """
    try:
        # Get timeout from app config
        timeout_minutes = current_app.config['BOOKING_TIMEOUT_MINUTES']
        
        # Find expired pending bookings
        expired = Booking.query.filter(
            Booking.status == 'pending',
            Booking.expires_at < datetime.utcnow()
        ).all()
        
        for booking in expired:
            booking.status = 'expired'
            logger.info(f"⏰ Booking {booking.id} expired - no payment received")
        
        db.session.commit()
        return len(expired)
    except Exception as e:
        logger.error(f"Error expiring bookings: {str(e)}")
        return 0