from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Booking, Property, User, Notification, Payment
from sqlalchemy import and_, or_
from datetime import datetime, timedelta
from decimal import Decimal
import uuid
import logging

booking_bp = Blueprint('booking', __name__)
logger = logging.getLogger(__name__)

# ==================== HELPER FUNCTIONS ====================

def check_property_availability_with_lock(property_id, check_in, check_out, exclude_booking_id=None):
    """Check availability with row locking to prevent race conditions"""
    if isinstance(check_in, str):
        check_in = datetime.strptime(check_in, '%Y-%m-%d').date()
    if isinstance(check_out, str):
        check_out = datetime.strptime(check_out, '%Y-%m-%d').date()
    
    query = Booking.query.filter(
        Booking.property_id == property_id,
        Booking.status.in_(['pending', 'confirmed', 'upcoming']),
        Booking.check_in < check_out,
        Booking.check_out > check_in
    ).with_for_update()
    
    if exclude_booking_id:
        query = query.filter(Booking.id != exclude_booking_id)
    
    conflicting = query.all()
    return len(conflicting) == 0, conflicting


def delete_if_timer_elapsed(booking):
    """
    If a pending booking's timer has elapsed with no confirmed payment,
    delete it and its payments permanently. Returns True if deleted.
    """
    if booking.status != 'pending':
        return False
    if booking.payment_status == 'completed':
        return False
    if booking.expires_at and booking.expires_at <= datetime.utcnow():
        logger.info(f"Deleting elapsed pending booking {booking.id} — no payment received")
        # Delete payments first to avoid NOT NULL constraint violation on booking_id
        Payment.query.filter_by(booking_id=booking.id).delete(synchronize_session='fetch')
        db.session.delete(booking)
        db.session.commit()
        return True
    return False


def derive_display_status(booking, today):
    """
    Single source of truth for display status.
    Call AFTER delete_if_timer_elapsed() so expired bookings are already gone.
    """
    raw = booking.status
    pay = booking.payment_status

    if raw == 'cancelled':
        return 'cancelled'
    if raw == 'pending':
        return 'pending'
    if pay == 'completed':
        if booking.check_out < today:
            return 'completed'
        if booking.check_in <= today:
            return 'active'
        return 'confirmed'
    return 'pending'


# ==================== CREATE BOOKING ====================

@booking_bp.route('', methods=['POST'])
@jwt_required()
def create_booking():
    """Create a new booking with configurable timeout and row locking"""
    try:
        user_id = get_jwt_identity()
        data = request.json
        
        logger.info(f"📥 Booking request from user {user_id}")
        
        timeout_minutes = current_app.config.get('BOOKING_TIMEOUT_MINUTES', 15)
        max_guests      = current_app.config.get('MAX_GUESTS_PER_BOOKING', 10)
        min_nights      = current_app.config.get('MIN_NIGHTS_BOOKING', 1)
        max_nights      = current_app.config.get('MAX_NIGHTS_BOOKING', 30)
        
        idempotency_key = request.headers.get('Idempotency-Key') or str(uuid.uuid4())
        
        existing = Booking.query.filter_by(idempotency_key=idempotency_key).first()
        if existing:
            return jsonify({
                'success': True,
                'booking_id': existing.id,
                'status': existing.status,
                'message': 'Booking already created'
            }), 200
        
        required_fields = ['property_id', 'check_in', 'check_out', 'guests']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        try:
            check_in  = datetime.strptime(data['check_in'],  '%Y-%m-%d').date()
            check_out = datetime.strptime(data['check_out'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        
        if check_in >= check_out:
            return jsonify({'error': 'Check-out must be after check-in'}), 400
        if check_in < datetime.now().date():
            return jsonify({'error': 'Check-in cannot be in the past'}), 400
        
        nights = (check_out - check_in).days
        if nights < min_nights:
            return jsonify({'error': f'Minimum stay is {min_nights} night{"s" if min_nights > 1 else ""}'}), 400
        if nights > max_nights:
            return jsonify({'error': f'Maximum stay is {max_nights} nights'}), 400
        
        total_guests = data['guests'].get('adults', 0) + data['guests'].get('children', 0)
        if total_guests > max_guests:
            return jsonify({'error': f'Maximum {max_guests} guests allowed'}), 400
        
        property = Property.query.filter_by(id=data['property_id']).with_for_update().first()
        if not property:
            return jsonify({'error': 'Property not found'}), 404
        
        is_available, conflicts = check_property_availability_with_lock(property.id, check_in, check_out)
        if not is_available:
            conflict_dates = [
                {'check_in': c.check_in.strftime('%b %d'), 'check_out': c.check_out.strftime('%b %d'), 'status': c.status}
                for c in conflicts[:3]
            ]
            return jsonify({
                'error':     'Property not available for selected dates',
                'conflicts': conflict_dates,
                'message':   'These dates are already booked. Please try different dates.'
            }), 409
        
        base_amount  = Decimal(str(property.price)) * Decimal(nights)
        total_amount = base_amount
        payment_type = data.get('payment_type', 'full')
        pending_amount = Decimal('0')
        if payment_type == 'partial':
            pending_amount = total_amount * Decimal('0.5')
        
        booking = Booking(
            user_id            = user_id,
            property_id        = property.id,
            check_in           = check_in,
            check_out          = check_out,
            guests             = data['guests'],
            nights             = nights,
            base_amount        = base_amount,
            cleaning_fee       = Decimal('0'),
            service_fee        = Decimal('0'),
            total_amount       = total_amount,
            pending_amount     = pending_amount,
            payment_type       = payment_type,
            payment_method     = data.get('payment_method'),
            message_to_host    = data.get('message_to_host'),
            status             = 'pending',
            confirmation       = 'pending',
            payment_status     = 'pending',
            idempotency_key    = idempotency_key,
            expires_at         = datetime.utcnow() + timedelta(minutes=timeout_minutes),
            created_at         = datetime.utcnow(),
            cancellation_policy = 'moderate',
        )
        if hasattr(booking, 'calculate_cancellation_deadlines'):
            booking.calculate_cancellation_deadlines()
        
        db.session.add(booking)
        db.session.commit()
        
        try:
            db.session.add(Notification(
                user_id    = user_id,
                type       = 'booking',
                title      = 'Booking Confirmed',
                message    = f'Your booking at {property.name} has been confirmed',
                related_id = booking.id,
                priority   = 'normal',
            ))
            db.session.commit()
        except Exception as notif_err:
            logger.warning(f"⚠️ Failed to create user notification: {notif_err}")
        
        logger.info(f"✅ Booking created: {booking.id}")
        
        property_image_url = (
            f"/api/admin/property-image/{property.images[0].id}"
            if property.images else None
        )
        
        return jsonify({
            'success': True,
            'booking': {
                'id':                      booking.id,
                'property_id':             property.id,
                'property_name':           property.name,
                'property_location':       property.location,
                'property_image':          property_image_url,
                'check_in':                check_in.strftime('%Y-%m-%d'),
                'check_out':               check_out.strftime('%Y-%m-%d'),
                'check_in_display':        check_in.strftime('%b %d, %Y'),
                'check_out_display':       check_out.strftime('%b %d, %Y'),
                'nights':                  nights,
                'guests':                  data['guests'],
                'price_per_night':         float(property.price),
                'base_amount':             float(base_amount),
                'total_amount':            float(total_amount),
                'pending_amount':          float(pending_amount) if pending_amount > 0 else 0,
                'payment_type':            payment_type,
                'status':                  booking.status,
                'expires_at':              booking.expires_at.isoformat(),
                'expires_in_minutes':      timeout_minutes,
                'cancellation_deadline_30': booking.cancellation_deadline_30.isoformat() if hasattr(booking, 'cancellation_deadline_30') and booking.cancellation_deadline_30 else None,
                'cancellation_deadline_14': booking.cancellation_deadline_14.isoformat() if hasattr(booking, 'cancellation_deadline_14') and booking.cancellation_deadline_14 else None,
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"❌ Error creating booking: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return jsonify({'error': 'Failed to create booking. Please try again.'}), 500


# ==================== CREATE BOOKING FROM SESSION ====================

@booking_bp.route('/create-from-session', methods=['POST'])
@jwt_required()
def create_booking_from_session():
    """Create a booking from session data saved during pre-login"""
    try:
        user_id = get_jwt_identity()
        data    = request.json
        
        logger.info(f"📝 Creating booking from session for user {user_id}")
        
        required_fields = ['property_id', 'check_in', 'check_out', 'guests']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        try:
            check_in  = datetime.strptime(data['check_in'],  '%Y-%m-%d').date()
            check_out = datetime.strptime(data['check_out'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format'}), 400
        
        if check_in >= check_out:
            return jsonify({'error': 'Check-out must be after check-in'}), 400
        if check_in < datetime.now().date():
            return jsonify({'error': 'Check-in cannot be in the past'}), 400
        
        property = Property.query.filter_by(id=data['property_id']).with_for_update().first()
        if not property:
            return jsonify({'error': 'Property not found'}), 404
        
        is_available, _ = check_property_availability_with_lock(property.id, check_in, check_out)
        if not is_available:
            return jsonify({
                'error':     'These dates are no longer available',
                'available': False,
                'message':   'Sorry, these dates were just booked by someone else. Please try different dates.'
            }), 409
        
        nights          = (check_out - check_in).days
        timeout_minutes = current_app.config.get('BOOKING_TIMEOUT_MINUTES', 15)
        base_amount     = Decimal(str(property.price)) * Decimal(nights)
        total_amount    = base_amount
        idempotency_key = f"session_{user_id}_{property.id}_{check_in}_{check_out}_{datetime.utcnow().timestamp()}"
        
        existing = Booking.query.filter_by(idempotency_key=idempotency_key).first()
        if existing:
            property_image_url = (
                f"/api/admin/property-image/{property.images[0].id}"
                if property.images else None
            )
            return jsonify({
                'success': True,
                'booking': {
                    'id':               existing.id,
                    'property_id':      property.id,
                    'property_name':    property.name,
                    'property_location':property.location,
                    'property_image':   property_image_url,
                    'check_in':         check_in.strftime('%Y-%m-%d'),
                    'check_out':        check_out.strftime('%Y-%m-%d'),
                    'nights':           nights,
                    'guests':           data['guests'],
                    'price_per_night':  float(property.price),
                    'base_amount':      float(base_amount),
                    'total_amount':     float(total_amount),
                    'expires_at':       existing.expires_at.isoformat(),
                    'expires_in_minutes': timeout_minutes,
                }
            }), 200
        
        booking = Booking(
            user_id             = user_id,
            property_id         = property.id,
            check_in            = check_in,
            check_out           = check_out,
            guests              = data['guests'],
            nights              = nights,
            base_amount         = base_amount,
            cleaning_fee        = Decimal('0'),
            service_fee         = Decimal('0'),
            total_amount        = total_amount,
            payment_type        = data.get('payment_type', 'full'),
            status              = 'pending',
            confirmation        = 'pending',
            payment_status      = 'pending',
            idempotency_key     = idempotency_key,
            expires_at          = datetime.utcnow() + timedelta(minutes=timeout_minutes),
            created_at          = datetime.utcnow(),
            cancellation_policy = 'moderate',
        )
        if hasattr(booking, 'calculate_cancellation_deadlines'):
            booking.calculate_cancellation_deadlines()
        
        db.session.add(booking)
        db.session.commit()
        
        logger.info(f"✅ Booking created from session: {booking.id}")
        
        property_image_url = (
            f"/api/admin/property-image/{property.images[0].id}"
            if property.images else None
        )
        
        return jsonify({
            'success': True,
            'booking': {
                'id':               booking.id,
                'property_id':      property.id,
                'property_name':    property.name,
                'property_location':property.location,
                'property_image':   property_image_url,
                'check_in':         check_in.strftime('%Y-%m-%d'),
                'check_out':        check_out.strftime('%Y-%m-%d'),
                'nights':           nights,
                'guests':           data['guests'],
                'price_per_night':  float(property.price),
                'base_amount':      float(base_amount),
                'total_amount':     float(total_amount),
                'status':           booking.status,
                'expires_at':       booking.expires_at.isoformat(),
                'expires_in_minutes': timeout_minutes,
                'cancellation_deadline_30': booking.cancellation_deadline_30.isoformat() if hasattr(booking, 'cancellation_deadline_30') and booking.cancellation_deadline_30 else None,
                'cancellation_deadline_14': booking.cancellation_deadline_14.isoformat() if hasattr(booking, 'cancellation_deadline_14') and booking.cancellation_deadline_14 else None,
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"❌ Error creating booking from session: {str(e)}")
        return jsonify({'error': 'Failed to create booking. Please try again.'}), 500


# ==================== GET BOOKING BY ID ====================

@booking_bp.route('/<int:booking_id>', methods=['GET'])
@jwt_required()
def get_booking_by_id(booking_id):
    try:
        user_id = get_jwt_identity()
        booking = Booking.query.filter_by(id=booking_id, user_id=user_id).first()
        if not booking:
            return jsonify({'error': 'Booking not found'}), 404
        if delete_if_timer_elapsed(booking):
            return jsonify({'error': 'Booking expired and has been removed'}), 404
        
        property_obj = booking.property
        return jsonify({
            'id':             booking.id,
            'property_id':    booking.property_id,
            'property_name':  property_obj.name if property_obj else 'Unknown',
            'property_location': property_obj.location if property_obj else 'Unknown',
            'check_in':       booking.check_in.strftime('%Y-%m-%d'),
            'check_out':      booking.check_out.strftime('%Y-%m-%d'),
            'nights':         booking.nights,
            'guests':         booking.guests,
            'total_amount':   float(booking.total_amount),
            'paid_amount':    float(booking.total_amount) if booking.payment_status == 'completed' else 0,
            'pending_amount': float(booking.pending_amount or 0) if booking.status == 'pending' else 0,
            'payment_status': booking.payment_status,
            'status':         booking.status,
            'expires_at':     booking.expires_at.isoformat() if booking.expires_at else None,
            'created_at':     booking.created_at.isoformat() if booking.created_at else None,
        }), 200
    except Exception as e:
        logger.error(f"Get booking error: {str(e)}")
        return jsonify({'error': 'Failed to fetch booking'}), 500


# ==================== GET BOOKING STATUS ====================

@booking_bp.route('/<int:booking_id>/status', methods=['GET'])
@jwt_required()
def get_booking_status(booking_id):
    user_id = get_jwt_identity()
    booking = Booking.query.filter_by(id=booking_id, user_id=user_id).first()
    if not booking:
        return jsonify({'error': 'Booking not found', 'is_expired': True}), 404

    if delete_if_timer_elapsed(booking):
        return jsonify({
            'error':      'Booking window expired. The booking has been removed.',
            'is_expired': True,
        }), 404

    now       = datetime.utcnow()
    time_left = None
    if booking.status == 'pending' and booking.expires_at:
        diff = booking.expires_at - now
        if diff.total_seconds() > 0:
            time_left = {
                'minutes':       diff.seconds // 60,
                'seconds':       diff.seconds % 60,
                'total_seconds': int(diff.total_seconds()),
            }

    return jsonify({
        'id':             booking.id,
        'status':         booking.status,
        'payment_status': booking.payment_status,
        'is_expired':     False,
        'expires_at':     booking.expires_at.isoformat() if booking.expires_at else None,
        'time_left':      time_left,
    }), 200


# ==================== CHECK AVAILABILITY ====================

@booking_bp.route('/check-availability', methods=['POST'])
def check_availability():
    try:
        data        = request.json
        property_id = data.get('property_id')
        check_in    = data.get('check_in')
        check_out   = data.get('check_out')
        
        if not all([property_id, check_in, check_out]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        try:
            check_in_date  = datetime.strptime(check_in,  '%Y-%m-%d').date()
            check_out_date = datetime.strptime(check_out, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format'}), 400
        
        if not Property.query.get(property_id):
            return jsonify({'error': 'Property not found', 'available': False}), 404
        
        is_available, _ = check_property_availability_with_lock(property_id, check_in_date, check_out_date)
        
        return jsonify({
            'success':   True,
            'available': is_available,
            'check_in':  check_in,
            'check_out': check_out,
            'message':   'Dates are available' if is_available else 'Dates are not available',
        }), 200
    except Exception as e:
        logger.error(f"Availability check error: {str(e)}")
        return jsonify({'error': 'Failed to check availability', 'available': False}), 500


# ==================== GET MY BOOKINGS ====================

@booking_bp.route('/my-bookings', methods=['GET'])
@jwt_required()
def get_my_bookings():
    try:
        user_id  = get_jwt_identity()
        bookings = Booking.query.filter_by(user_id=user_id).order_by(Booking.created_at.desc()).all()

        result = []
        now_dt = datetime.utcnow()
        today  = now_dt.date()

        for booking in bookings:
            try:
                if delete_if_timer_elapsed(booking):
                    continue

                prop = booking.property
                if not prop:
                    logger.warning(f"Booking {booking.id} has no property — skipping")
                    continue

                display_status = derive_display_status(booking, today)
                property_image = (
                    f"/api/admin/property-image/{prop.images[0].id}"
                    if prop.images else None
                )

                time_left = None
                if display_status == 'pending' and booking.expires_at:
                    diff = booking.expires_at - now_dt
                    if diff.total_seconds() > 0:
                        time_left = {
                            'minutes': int(diff.total_seconds() // 60),
                            'seconds': int(diff.total_seconds() % 60),
                        }

                refund_info = None
                if display_status == 'cancelled' and float(booking.refund_amount or 0) > 0:
                    refund_info = {
                        'refund_amount':      float(booking.refund_amount),
                        'cancellation_fee':   float(booking.cancellation_fee or 0),
                        'refund_processed':   booking.refund_processed or False,
                        'refund_processed_at': booking.refund_processed_at.isoformat() if booking.refund_processed_at else None,
                        'cancelled_at':        booking.cancelled_at.isoformat() if booking.cancelled_at else None,
                    }

                result.append({
                    'id':                  booking.id,
                    'property_id':         booking.property_id,
                    'property_name':       prop.name,
                    'property_location':   prop.location,
                    'property_image':      property_image,
                    'property_latitude':   float(prop.latitude)  if prop.latitude  else None,
                    'property_longitude':  float(prop.longitude) if prop.longitude else None,
                    'check_in':            booking.check_in.strftime('%Y-%m-%d'),
                    'check_out':           booking.check_out.strftime('%Y-%m-%d'),
                    'check_in_display':    booking.check_in.strftime('%b %d, %Y'),
                    'check_out_display':   booking.check_out.strftime('%b %d, %Y'),
                    'nights':              booking.nights,
                    'guests':              booking.guests,
                    'total_amount':        float(booking.total_amount),
                    'base_amount':         float(booking.base_amount),
                    'pending_amount':      float(booking.pending_amount or 0) if display_status == 'pending' else 0,
                    'paid_amount':         float(booking.total_amount) if display_status != 'pending' else 0,
                    'payment_status':      booking.payment_status,
                    'status':              display_status,
                    'expires_at':          booking.expires_at.isoformat() if booking.expires_at else None,
                    'time_left':           time_left,
                    'created_at':          booking.created_at.isoformat() if booking.created_at else None,
                    'can_cancel':          display_status in ['pending', 'confirmed'] and booking.check_in > today,
                    'refund_info':         refund_info,
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
def cancel_booking(booking_id):
    try:
        user_id = get_jwt_identity()
        booking = Booking.query.filter_by(id=booking_id, user_id=user_id).first()
        if not booking:
            return jsonify({'error': 'Booking not found'}), 404

        if delete_if_timer_elapsed(booking):
            return jsonify({
                'success': False,
                'error':   'Your booking window expired. The booking has been removed.',
            }), 400

        if booking.status == 'cancelled':
            return jsonify({'error': 'Booking already cancelled'}), 400

        today = datetime.now().date()
        if booking.check_in <= today:
            return jsonify({
                'success':    False,
                'error':      'Cannot cancel a booking that has already started',
                'can_cancel': False,
            }), 400

        if hasattr(booking, 'calculate_cancellation_deadlines') and (
            not booking.cancellation_deadline_30 or not booking.cancellation_deadline_14
        ):
            booking.calculate_cancellation_deadlines()

        payment_was_made = booking.payment_status == 'completed'

        if payment_was_made:
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
        else:
            fee_amount, refund_amount = 0, 0

        booking.status       = 'cancelled'
        booking.cancelled_at = datetime.utcnow()
        booking.updated_at   = datetime.utcnow()
        if hasattr(booking, 'cancellation_fee'):
            booking.cancellation_fee = fee_amount
        if hasattr(booking, 'refund_amount'):
            booking.refund_amount = refund_amount

        db.session.commit()

        if not payment_was_made:
            message = 'Booking cancelled. No payment was taken.'
        elif refund_amount > 0:
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
            'refund_amount': float(refund_amount),
            'fee_amount':    float(fee_amount),
            'cancelled_at':  booking.cancelled_at.isoformat(),
        }), 200

    except Exception as e:
        logger.error(f"Cancellation error: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to cancel booking'}), 500


# ==================== SCHEDULER FUNCTION ====================

def expire_old_pending_bookings():
    """
    Background task — permanently delete pending bookings whose timer has
    elapsed with no confirmed payment.

    THE KEY FIX: payments are explicitly deleted BEFORE their booking is
    deleted. This avoids the PostgreSQL NOT NULL constraint violation on
    payments.booking_id that was causing the scheduler to fail every minute.
    """
    try:
        now             = datetime.utcnow()
        timeout_minutes = current_app.config.get('BOOKING_TIMEOUT_MINUTES', 15)

        # Bookings with expires_at set and elapsed
        expired_with_expiry = Booking.query.filter(
            Booking.status         == 'pending',
            Booking.payment_status != 'completed',
            Booking.expires_at.isnot(None),
            Booking.expires_at     <  now,
        ).all()

        # Legacy bookings with no expires_at but old enough
        expired_without_expiry = Booking.query.filter(
            Booking.status         == 'pending',
            Booking.payment_status != 'completed',
            Booking.expires_at.is_(None),
            Booking.created_at     <  now - timedelta(minutes=timeout_minutes),
        ).all()

        # Also catch any bookings still stuck in the old 'expired' status
        legacy_expired = Booking.query.filter(Booking.status == 'expired').all()

        all_expired = expired_with_expiry + expired_without_expiry + legacy_expired
        count       = 0

        for booking in all_expired:
            try:
                logger.info(f"🗑️  Deleting expired booking {booking.id}")

                # ── THE FIX ──────────────────────────────────────────────────
                # Delete all payments for this booking first, before deleting
                # the booking itself.  Without this, PostgreSQL raises:
                #   NotNullViolation: null value in column "booking_id"
                # because SQLAlchemy tries to SET booking_id = NULL on the
                # payment rows instead of deleting them.
                deleted_payments = Payment.query.filter_by(
                    booking_id=booking.id
                ).delete(synchronize_session='fetch')

                if deleted_payments:
                    logger.info(
                        f"   Deleted {deleted_payments} payment(s) for booking {booking.id}"
                    )
                # ─────────────────────────────────────────────────────────────

                db.session.delete(booking)
                count += 1

            except Exception as e:
                logger.error(f"❌ Failed to delete booking {booking.id}: {e}")
                db.session.rollback()
                continue

        if count > 0:
            db.session.commit()
            logger.info(f"✅ Expired and deleted {count} pending booking(s)")

        # Clean up any orphaned payments whose booking_id is already NULL
        # (left over from before this fix was deployed)
        try:
            orphaned = Payment.query.filter(
                Payment.booking_id.is_(None),
                Payment.status.in_(['pending', 'failed']),
            ).all()
            if orphaned:
                for p in orphaned:
                    logger.info(f"🧹 Deleting orphaned payment {p.id}")
                    db.session.delete(p)
                db.session.commit()
                logger.info(f"✅ Cleaned up {len(orphaned)} orphaned payment(s)")
        except Exception as e:
            logger.error(f"❌ Orphaned payment cleanup failed: {e}")
            db.session.rollback()

        return count

    except Exception as e:
        logger.error(f"❌ Error in expire_old_pending_bookings: {e}")
        import traceback
        logger.error(traceback.format_exc())
        db.session.rollback()
        return 0


# ==================== ADMIN ENDPOINTS ====================

@booking_bp.route('/admin/cleanup-stale', methods=['POST'])
@jwt_required()
def cleanup_stale_bookings():
    """One-time admin endpoint: delete all stale pending/expired bookings."""
    user_id = get_jwt_identity()
    user    = User.query.get(user_id)
    if not user or user.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403

    try:
        now             = datetime.utcnow()
        timeout_minutes = current_app.config.get('BOOKING_TIMEOUT_MINUTES', 15)

        stale = Booking.query.filter(
            Booking.status.in_(['pending', 'expired']),
            Booking.payment_status != 'completed',
            or_(
                and_(Booking.expires_at.isnot(None), Booking.expires_at < now),
                and_(Booking.expires_at.is_(None),   Booking.created_at < now - timedelta(minutes=timeout_minutes)),
            )
        ).all()

        count = 0
        for b in stale:
            Payment.query.filter_by(booking_id=b.id).delete(synchronize_session='fetch')
            db.session.delete(b)
            count += 1

        if count:
            db.session.commit()

        return jsonify({
            'success': True,
            'deleted': count,
            'message': f'Deleted {count} stale booking(s) and their payments.',
        }), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Cleanup error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@booking_bp.route('/admin/pending-status', methods=['GET'])
@jwt_required()
def get_pending_bookings_status():
    """Admin diagnostic: show pending bookings and how many should already be deleted."""
    user_id = get_jwt_identity()
    user    = User.query.get(user_id)
    if not user or user.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403

    try:
        now             = datetime.utcnow()
        timeout_minutes = current_app.config.get('BOOKING_TIMEOUT_MINUTES', 15)
        all_pending     = Booking.query.filter(Booking.status == 'pending').all()

        valid_pending         = [b for b in all_pending if b.expires_at and b.expires_at > now]
        expired_with_timer    = [b for b in all_pending if b.expires_at and b.expires_at <= now]
        legacy_pending        = [b for b in all_pending if not b.expires_at]
        old_legacy            = [b for b in legacy_pending if b.created_at < now - timedelta(minutes=timeout_minutes)]

        return jsonify({
            'success':   True,
            'timestamp': now.isoformat(),
            'summary': {
                'total_pending':           len(all_pending),
                'valid_pending':           len(valid_pending),
                'expired_should_delete':   len(expired_with_timer),
                'legacy_bookings':         len(legacy_pending),
                'legacy_old_enough':       len(old_legacy),
            },
            'expired_bookings': [
                {
                    'id':             b.id,
                    'user_id':        b.user_id,
                    'created':        b.created_at.isoformat(),
                    'expires_at':     b.expires_at.isoformat() if b.expires_at else None,
                    'payment_status': b.payment_status,
                }
                for b in (expired_with_timer + old_legacy)[:20]
            ],
        }), 200

    except Exception as e:
        logger.error(f"Diagnostic error: {str(e)}")
        return jsonify({'error': str(e)}), 500