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

# ==================== HELPER FUNCTIONS ====================

def derive_display_status(booking, today):
    """
    Single source of truth for booking display status.
    Call AFTER check_and_update_expired() has already run.
    """
    raw = booking.status          # value stored in DB
    pay = booking.payment_status  # 'pending' | 'completed' | 'partial' | 'refunded'

    if raw in ('pending', 'expired', 'cancelled'):
        return raw                # these are exact — no override needed

    # DB status is confirmed / upcoming / active — payment decides the rest
    if pay == 'completed':
        if booking.check_out < today:
            return 'completed'        # stay is over
        if booking.check_in <= today:
            return 'active'           # guest is currently staying
        return 'confirmed'            # paid, stay is upcoming

    # Payment not yet confirmed but booking is acknowledged
    return 'confirmed'

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


def check_and_update_expired(booking):
    """
    REAL-TIME EXPIRY CHECK - Check if a booking is expired and update its status if needed.
    Returns True if booking was just expired, False otherwise.
    """
    if (booking.status == 'pending' and 
        booking.expires_at and 
        booking.expires_at < datetime.utcnow()):
        booking.status = 'expired'
        db.session.commit()
        logger.info(f"⚡ Real-time expiry: Booking {booking.id} expired")
        return True
    return False


# ==================== CREATE BOOKING ====================

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
        total_amount = base_amount
        
        logger.info(f"  Base amount: {base_amount}")
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
            cleaning_fee=Decimal('0'),
            service_fee=Decimal('0'),
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

        # Build property image URL instead of passing the ORM object
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
                'cleaning_fee': 0,
                'service_fee': 0,
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
            'details': str(e)
        }), 500


# ========== SESSION BOOKING ==========

@booking_bp.route('/create-from-session', methods=['POST'])
@jwt_required()
def create_booking_from_session():
    """
    Create a booking from session data saved during pre-login
    This is called after user logs in, before showing payment page
    """
    try:
        user_id = get_jwt_identity()
        data = request.json
        
        logger.info(f"📝 Creating booking from session for user {user_id}")
        logger.info(f"📦 Session data: {data}")
        
        # Validate required fields
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
        except ValueError as e:
            return jsonify({'error': 'Invalid date format'}), 400
        
        # Validate date logic
        if check_in >= check_out:
            return jsonify({'error': 'Check-out must be after check-in'}), 400
        
        if check_in < datetime.now().date():
            return jsonify({'error': 'Check-in cannot be in the past'}), 400
        
        # Get property and verify it exists
        property = Property.query.get(data['property_id'])
        if not property:
            logger.error(f"❌ Property not found: {data['property_id']}")
            return jsonify({'error': 'Property not found'}), 404
        
        # Check availability AGAIN (in case dates were booked while user was logging in)
        is_available, conflicts = check_property_availability(
            property.id, check_in, check_out
        )
        
        if not is_available:
            logger.warning(f"⚠️ Property {property.id} no longer available for selected dates")
            return jsonify({
                'success': False,
                'error': 'These dates are no longer available',
                'available': False,
                'message': 'Sorry, these dates were just booked by someone else. Please try different dates.'
            }), 409
        
        # Calculate nights
        nights = (check_out - check_in).days
        
        # Get config values
        timeout_minutes = current_app.config['BOOKING_TIMEOUT_MINUTES']
        
        # Calculate amounts
        base_amount = Decimal(str(property.price)) * Decimal(nights)
        total_amount = base_amount
        
        # Generate idempotency key
        idempotency_key = f"session_{user_id}_{property.id}_{check_in}_{check_out}_{datetime.utcnow().timestamp()}"
        
        # Check if already processed
        existing = Booking.query.filter_by(idempotency_key=idempotency_key).first()
        if existing:
            logger.info(f"🔄 Booking already exists from session with id: {existing.id}")
            property_image_url = None
            if property.images and len(property.images) > 0:
                property_image_url = f"/api/admin/property-image/{property.images[0].id}"
            
            return jsonify({
                'success': True,
                'booking': {
                    'id': existing.id,
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
                    'cleaning_fee': 0,
                    'service_fee': 0,
                    'total_amount': float(total_amount),
                    'expires_at': existing.expires_at.isoformat(),
                    'expires_in_minutes': timeout_minutes
                }
            }), 200
        
        # Create booking
        booking = Booking(
            user_id=user_id,
            property_id=property.id,
            check_in=check_in,
            check_out=check_out,
            guests=data['guests'],
            nights=nights,
            base_amount=base_amount,
            cleaning_fee=Decimal('0'),
            service_fee=Decimal('0'),
            total_amount=total_amount,
            payment_type=data.get('payment_type', 'full'),
            status='pending',
            confirmation='pending',
            payment_status='pending',
            idempotency_key=idempotency_key,
            expires_at=datetime.utcnow() + timedelta(minutes=timeout_minutes)
        )
        
        db.session.add(booking)
        db.session.commit()
        
        logger.info(f"✅ Booking created successfully from session: ID {booking.id}")
        
        # Build property image URL
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
                'cleaning_fee': 0,
                'service_fee': 0,
                'total_amount': float(total_amount),
                'status': booking.status,
                'expires_at': booking.expires_at.isoformat(),
                'expires_in_minutes': timeout_minutes
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"❌ Error creating booking from session: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to create booking. Please try again.'
        }), 500


# ==================== GET BOOKING STATUS ====================

@booking_bp.route('/<int:booking_id>/status', methods=['GET'])
@jwt_required()
def get_booking_status(booking_id):
    """
    REAL-TIME STATUS CHECK - Check if booking is still valid (not expired)
    Used by frontend to show timeout warnings
    """
    user_id = get_jwt_identity()
    
    booking = Booking.query.filter_by(id=booking_id, user_id=user_id).first()
    if not booking:
        return jsonify({'error': 'Booking not found'}), 404
    
    # REAL-TIME EXPIRY CHECK - happens on every status request
    was_expired = check_and_update_expired(booking)
    
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
        'was_just_expired': was_expired,
        'expires_at': booking.expires_at.isoformat() if booking.expires_at else None,
        'time_left': time_left
    }), 200


# ==================== CHECK AVAILABILITY ====================

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


# ==================== GET MY BOOKINGS ====================

@booking_bp.route('/my-bookings', methods=['GET'])
@jwt_required()
def get_my_bookings():
    """Get all bookings for the current user with real-time status."""
    try:
        user_id = get_jwt_identity()

        bookings = Booking.query.filter_by(user_id=user_id).order_by(
            Booking.created_at.desc()
        ).all()

        result = []
        now_dt = datetime.utcnow()
        today  = now_dt.date()

        for booking in bookings:
            try:
                # Real-time expiry check for every pending booking
                if booking.status == 'pending':
                    check_and_update_expired(booking)

                prop = booking.property
                if not prop:
                    logger.warning(f"Booking {booking.id} has no property — skipping")
                    continue

                display_status = derive_display_status(booking, today)

                # Cover image
                property_image = None
                if prop.images:
                    property_image = f"/api/admin/property-image/{prop.images[0].id}"

                # Time left (only meaningful while pending)
                time_left = None
                if booking.status == 'pending' and booking.expires_at:
                    diff = booking.expires_at - now_dt
                    if diff.total_seconds() > 0:
                        time_left = {
                            'minutes': int(diff.total_seconds() // 60),
                            'seconds': int(diff.total_seconds() % 60)
                        }

                # Refund info for cancelled bookings
                refund_info = None
                if display_status == 'cancelled':
                    refund_info = {
                        'refund_amount':    float(booking.refund_amount or 0),
                        'cancellation_fee': float(booking.cancellation_fee or 0),
                        'refund_processed': booking.refund_processed or False,
                        'refund_processed_at': (
                            booking.refund_processed_at.isoformat()
                            if booking.refund_processed_at else None
                        ),
                        'cancelled_at': (
                            booking.cancelled_at.isoformat()
                            if booking.cancelled_at else None
                        ),
                    }

                result.append({
                    'id':                booking.id,
                    'property_id':       booking.property_id,
                    'property_name':     prop.name,
                    'property_location': prop.location,
                    'property_image':    property_image,
                    'property_latitude':  float(prop.latitude)  if prop.latitude  else None,
                    'property_longitude': float(prop.longitude) if prop.longitude else None,
                    'check_in':         booking.check_in.strftime('%Y-%m-%d'),
                    'check_out':        booking.check_out.strftime('%Y-%m-%d'),
                    'check_in_display': booking.check_in.strftime('%b %d, %Y'),
                    'check_out_display':booking.check_out.strftime('%b %d, %Y'),
                    'nights':           booking.nights,
                    'guests':           booking.guests,
                    'total_amount':     float(booking.total_amount),
                    'base_amount':      float(booking.base_amount),
                    'paid_amount':      float(booking.total_amount - (booking.pending_amount or 0)),
                    'pending_amount':   float(booking.pending_amount or 0),
                    'payment_status':   booking.payment_status,
                    'status':           display_status,
                    'original_status':  booking.status,
                    'expires_at':       booking.expires_at.isoformat() if booking.expires_at else None,
                    'time_left':        time_left,
                    'created_at':       booking.created_at.isoformat() if booking.created_at else None,
                    'can_cancel': (
                        booking.status in ['pending', 'confirmed', 'upcoming']
                        and booking.check_in > today
                    ),
                    'refund_info': refund_info,
                })

            except Exception as e:
                logger.error(f"Error processing booking {booking.id}: {str(e)}")
                continue

        return jsonify(result), 200

    except Exception as e:
        logger.error(f"get_my_bookings error: {str(e)}")
        return jsonify({'error': 'Failed to fetch bookings', 'message': str(e)}), 500


# ==================== CANCEL BOOKING ====================

@booking_bp.route('/<int:booking_id>/cancel', methods=['POST'])
@jwt_required()
def cancel_booking(booking_id):          # ← comes from URL, not request body
    """Cancel a booking (user-initiated) with refund calculation."""
    try:
        user_id = get_jwt_identity()

        booking = Booking.query.filter_by(id=booking_id, user_id=user_id).first()
        if not booking:
            return jsonify({'error': 'Booking not found'}), 404

        # Real-time expiry
        if check_and_update_expired(booking):
            return jsonify({
                'success': False,
                'error':   'Booking has expired and cannot be cancelled',
                'expired': True
            }), 400

        if booking.status == 'cancelled':
            return jsonify({'error': 'Booking already cancelled'}), 400

        today = datetime.now().date()
        if booking.check_in <= today:
            return jsonify({
                'success':    False,
                'error':      'Cannot cancel a booking that has already started',
                'can_cancel': False
            }), 400

        # Set deadlines if missing
        if hasattr(booking, 'calculate_cancellation_deadlines') and (
            not booking.cancellation_deadline_30 or not booking.cancellation_deadline_14
        ):
            booking.calculate_cancellation_deadlines()

        # Refund calculation
        if hasattr(booking, 'calculate_refund_amount'):
            fee_amount, refund_amount = booking.calculate_refund_amount()
        else:
            days = (booking.check_in - today).days
            if days >= 30:
                fee_amount, refund_amount = 0, float(booking.total_amount)
            elif days >= 14:
                fee_amount = float(booking.total_amount) * 0.5
                refund_amount = float(booking.total_amount) * 0.5
            else:
                fee_amount, refund_amount = float(booking.total_amount), 0

        logger.info(
            f"Cancelling booking {booking.id}: "
            f"fee={fee_amount}, refund={refund_amount}"
        )

        booking.status       = 'cancelled'
        booking.cancelled_at = datetime.utcnow()
        booking.updated_at   = datetime.utcnow()
        if hasattr(booking, 'cancellation_fee'):
            booking.cancellation_fee = fee_amount
        if hasattr(booking, 'refund_amount'):
            booking.refund_amount = refund_amount

        db.session.commit()

        if refund_amount > 0:
            if refund_amount == float(booking.total_amount):
                message = 'Booking cancelled. Full refund will be processed within 5-7 business days.'
            else:
                message = (
                    f'Booking cancelled. Partial refund of KES {refund_amount:,.0f} '
                    f'will be processed within 5-7 business days.'
                )
        else:
            message = 'Booking cancelled. No refund applies per the cancellation policy.'

        return jsonify({
            'success':       True,
            'message':       message,
            'refund_amount': float(refund_amount) if refund_amount else 0,
            'fee_amount':    float(fee_amount)    if fee_amount    else 0,
            'cancelled_at':  booking.cancelled_at.isoformat()
        }), 200

    except Exception as e:
        logger.error(f"Cancellation error: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to cancel booking'}), 500


# ==================== BACKGROUND TASK ====================

def expire_old_pending_bookings():
    """
    BACKGROUND TASK - Find pending bookings older than configured minutes and expire them
    This is a backup for the real-time checks
    """
    try:
        # Get timeout from app config
        timeout_minutes = current_app.config['BOOKING_TIMEOUT_MINUTES']
        
        # Find expired pending bookings
        expired = Booking.query.filter(
            Booking.status == 'pending',
            Booking.expires_at < datetime.utcnow()
        ).all()
        
        count = 0
        for booking in expired:
            booking.status = 'expired'
            logger.info(f"⏰ Background task: Booking {booking.id} expired - no payment received")
            count += 1
        
        if count > 0:
            db.session.commit()
            logger.info(f"✅ Background task expired {count} pending bookings")
        
        return count
    except Exception as e:
        logger.error(f"Error expiring bookings: {str(e)}")
        db.session.rollback()
        return 0