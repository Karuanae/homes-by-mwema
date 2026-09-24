from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Payment, Booking, User, Notification
from sqlalchemy import and_, or_
from datetime import datetime, timedelta
from decimal import Decimal
import hmac
import hashlib
import json
import logging
import re
import uuid
import requests
from mpesa_service import MPesaService
from paypal_service import PayPalService
from views.booking import delete_if_timer_elapsed

payment_bp = Blueprint('payment', __name__)
logger = logging.getLogger(__name__)


def generate_mpesa_account_reference(user, booking_id):
    raw_name = None
    if user:
        raw_name = getattr(user, 'name', None) or getattr(user, 'first_name', None) or getattr(user, 'last_name', None) or getattr(user, 'email', None)

    if not raw_name or not str(raw_name).strip():
        return f"BOOK{booking_id}"

    raw_name = str(raw_name).strip()
    if '@' in raw_name and not getattr(user, 'name', None):
        raw_name = raw_name.split('@')[0]

    parts = [part for part in raw_name.split() if part]
    if not parts:
        return f"BOOK{booking_id}"

    selected_parts = parts[:2]
    cleaned_parts = [re.sub(r'[^A-Za-z0-9]', '', part) for part in selected_parts if re.sub(r'[^A-Za-z0-9]', '', part)]

    if not cleaned_parts:
        return f"BOOK{booking_id}"

    return ' '.join(cleaned_parts)


def verify_mpesa_signature(req):
    if current_app.config.get('MPESA_ENVIRONMENT') == 'sandbox':
        return True

    signature = req.headers.get('X-Mpesa-Signature')
    if not signature:
        return True

    mpesa_secret = current_app.config.get('MPESA_SECRET', '')
    if not mpesa_secret:
        return True

    expected = hmac.new(
        mpesa_secret.encode(),
        req.get_data(),
        hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(signature, expected)


def _extract_receipt_from_query_result(result_data):
    """Safely extract M-PESA Receipt Number from various Daraja response shapes."""
    if not isinstance(result_data, dict):
        return None
    
    if result_data.get('mpesa_receipt_number'):
        return result_data.get('mpesa_receipt_number')
    if result_data.get('MpesaReceiptNumber'):
        return result_data.get('MpesaReceiptNumber')
    
    try:
        items = result_data.get('CallbackMetadata', {}).get('Item', [])
        if not items and 'ResultParameters' in result_data:
            items = result_data.get('ResultParameters', {}).get('ResultParameter', [])
            
        for item in items:
            name = item.get('Name') or item.get('Key')
            if name in ('MpesaReceiptNumber', 'mpesa_receipt_number'):
                return str(item.get('Value'))
    except Exception as parse_err:
        logger.debug(f"Receipt extraction parse debug: {parse_err}")
        
    return None


def _translate_mpesa_error(result_code, result_desc):
    """Translate Daraja error codes into user-friendly messages."""
    try:
        code = str(result_code).strip() if result_code is not None else ""
    except Exception:
        code = ""
        
    if code == "1032": return "Transaction cancelled on your phone."
    if code == "1037": return "M-PESA prompt timed out. Your phone might be off or lacks network coverage."
    if code == "1": return "Insufficient funds in your M-PESA account."
    if code == "2001": return "Invalid M-PESA PIN entered."
    if result_desc: return str(result_desc)
    return f"Safaricom rejected the payment (Code {code})."


def sync_booking_payment_status(booking):
    total_paid = db.session.query(db.func.sum(Payment.amount)).filter(
        Payment.booking_id == booking.id,
        Payment.status == 'completed',
        Payment.method != 'refund'
    ).scalar() or Decimal('0')

    if total_paid >= booking.total_amount:
        changed = booking.payment_status != 'completed' or booking.status != 'confirmed'
        booking.payment_status = 'completed'
        booking.status = 'confirmed'
        booking.confirmation = 'confirmed'
        booking.pending_amount = Decimal('0')
        booking.expires_at = None
        if changed:
            db.session.commit()
        return True

    return False


def _mark_booking_paid(booking, payment):
    was_paid = booking.payment_status == 'completed'
    sync_booking_payment_status(booking)

    if not was_paid and booking.payment_status == 'completed':
        db.session.add(Notification(
            user_id=booking.user_id,
            type='booking',
            title='Payment received',
            message=f'Your payment for {booking.property.name if booking.property else "your booking"} was successful. Booking #{booking.id} is confirmed.',
            related_id=booking.id,
            priority='normal',
        ))


def _send_payment_email(booking, payment):
    try:
        from views.email_service import email_service
        booking_user = User.query.get(payment.user_id)
        if booking and booking_user:
            email_service.send_payment_received(booking, booking_user, payment)
            email_service.send_booking_confirmation(booking, booking_user)
    except Exception as email_err:
        logger.warning(f"Payment email failed (non-fatal): {email_err}")


@payment_bp.route('/mpesa/initiate', methods=['POST'])
@jwt_required()
def initiate_mpesa_payment():
    user_id = get_jwt_identity()
    data = request.json

    required_fields = ['booking_id', 'phone_number', 'amount']
    for field in required_fields:
        if field not in data:
            return jsonify({'success': False, 'error': f'Missing {field}'}), 400

    booking = Booking.query.filter_by(id=data['booking_id'], user_id=user_id).first()

    if not booking:
        return jsonify({'success': False, 'error': 'Booking not found'}), 404

    if delete_if_timer_elapsed(booking):
        return jsonify({'success': False, 'error': 'Booking session expired.', 'expired': True}), 400

    if booking.payment_status == 'completed':
        return jsonify({'success': False, 'error': 'This booking is already paid'}), 400

    phone = str(data['phone_number']).strip().replace(' ', '').replace('+', '')
    if phone.startswith('0'):
        phone = '254' + phone[1:]
    elif not phone.startswith('254'):
        phone = '254' + phone

    idempotency_key = f"MPESA_{booking.id}_{datetime.utcnow().timestamp()}"
    payment_amount = Decimal(str(booking.total_amount))
    
    payment = Payment(
        booking_id=booking.id,
        user_id=user_id,
        property_id=booking.property_id,
        amount=payment_amount,
        method='mpesa',
        mpesa_number=phone,
        status='pending',
        idempotency_key=idempotency_key,
        created_at=datetime.utcnow()
    )

    db.session.add(payment)
    db.session.commit()

    try:
        mpesa_service = MPesaService()
        booking_user = User.query.get(booking.user_id) if booking.user_id else None
        payment_ref = generate_mpesa_account_reference(booking_user, booking.id)

        mpesa_result = mpesa_service.stk_push(
            phone_number=phone,
            amount=int(payment_amount),
            account_reference=payment_ref,
            transaction_desc=f"Payment for booking #{booking.id}"
        )

        if mpesa_result.get('success'):
            payment.checkout_request_id = mpesa_result.get('checkout_request_id')
            payment.merchant_request_id = mpesa_result.get('merchant_request_id')
            db.session.commit()

            return jsonify({
                'success': True,
                'payment_id': payment.id,
                'checkout_request_id': mpesa_result.get('checkout_request_id'),
                'message': 'STK Push sent. Please check your phone and enter PIN.',
                'expires_at': booking.expires_at.isoformat() if booking.expires_at else None
            }), 200
        else:
            payment.status = 'failed'
            payment.error_log = mpesa_result.get('error', 'Safaricom rejected the request. Please try again.')
            db.session.commit()

            return jsonify({
                'success': False,
                'error': payment.error_log
            }), 400

    except Exception as e:
        payment.status = 'failed'
        payment.error_log = str(e)
        db.session.commit()

        return jsonify({'success': False, 'error': 'Payment service unavailable. Please try again.'}), 500


@payment_bp.route('/mpesa/callback', methods=['POST'])
@payment_bp.route('/re/mpesa/callback', methods=['POST'])
def mpesa_callback():
    logger.info("📞 M-PESA Callback received")

    if not verify_mpesa_signature(request):
        return jsonify({'ResultCode': 1, 'ResultDesc': 'Invalid signature'}), 401

    try:
        mpesa_service = MPesaService()
        callback_data = request.json or {}
        processed = mpesa_service.process_callback(callback_data)

        checkout_request_id = processed.get('checkout_request_id')
        payment = Payment.query.filter_by(checkout_request_id=checkout_request_id).first()

        if not payment:
            return jsonify({'ResultCode': 1, 'ResultDesc': 'Payment not found'}), 200

        payment.webhook_received_at = datetime.utcnow()

        if processed.get('success'):
            was_completed = (payment.status == 'completed')
            receipt = processed.get('mpesa_receipt_number') or _extract_receipt_from_query_result(callback_data)
            
            payment.status = 'completed'
            if receipt:
                payment.mpesa_receipt_number = receipt
                payment.transaction_id = receipt
            payment.completed_at = datetime.utcnow()

            booking = Booking.query.get(payment.booking_id)
            if booking:
                _mark_booking_paid(booking, payment)

            db.session.commit()

            if not was_completed and booking and booking.payment_status == 'completed':
                _send_payment_email(booking, payment)

        else:
            payment.status = 'failed'
            payment.error_log = _translate_mpesa_error(processed.get('result_code'), processed.get('result_desc'))
            booking = Booking.query.get(payment.booking_id)
            if booking and booking.payment_status != 'completed':
                booking.status = 'pending'
                booking.payment_status = 'pending'
                booking.confirmation = 'pending'
            db.session.commit()

        return jsonify({'ResultCode': 0, 'ResultDesc': 'Success'}), 200

    except Exception as e:
        logger.error(f"Callback processing error: {str(e)}")
        return jsonify({'ResultCode': 0, 'ResultDesc': 'Received'}), 200


@payment_bp.route('/mpesa/status/<checkout_request_id>', methods=['GET'])
@jwt_required()
def check_payment_status(checkout_request_id):
    """Frontend polls this endpoint to verify if STK Push payment completed."""
    user_id = get_jwt_identity()

    payment = Payment.query.filter_by(checkout_request_id=checkout_request_id, user_id=user_id).first()

    if not payment:
        return jsonify({'error': 'Payment not found'}), 404

    if payment.status == 'pending':
        try:
            mpesa_service = MPesaService()
            result = mpesa_service.query_stk_push_status(checkout_request_id)

            if not result.get('success'):
                logger.info("M-PESA status query unresolved for %s", checkout_request_id)
            else:
                result_code = result.get('result_code')
                if result_code is None:
                    result_code = result.get('ResultCode')

                if result_code is not None:
                    result_code_int = int(result_code)
                    booking = Booking.query.get(payment.booking_id)

                    if result_code_int == 0:
                        receipt = _extract_receipt_from_query_result(result)
                        payment.status = 'completed'
                        if receipt:
                            payment.mpesa_receipt_number = receipt
                            payment.transaction_id = receipt
                        payment.completed_at = datetime.utcnow()
                        payment.webhook_received_at = datetime.utcnow()
                        payment.mpesa_response_code = str(result_code_int)
                        payment.mpesa_response_description = result.get('result_desc') or result.get('ResultDesc')

                        if booking:
                            _mark_booking_paid(booking, payment)
                            db.session.commit()
                            if booking.payment_status == 'completed':
                                _send_payment_email(booking, payment)
                        else:
                            db.session.commit()
                    else:
                        payment.status = 'failed'
                        desc = result.get('result_desc') or result.get('ResultDesc')
                        payment.error_log = _translate_mpesa_error(result_code_int, desc)
                        
                        if booking and booking.payment_status != 'completed':
                            booking.status = 'pending'
                            booking.payment_status = 'pending'
                            booking.confirmation = 'pending'
                        db.session.commit()
                
        except Exception as query_err:
            logger.warning(f"M-PESA direct status query check failed: {query_err}")

    booking = Booking.query.get(payment.booking_id)
    property_obj = booking.property if booking else None

    # CRITICAL: We now include 'error_log' inside the 'payment' dictionary
    # so the frontend React app can display Safaricom's exact error message.
    return jsonify({
        'success': True,
        'payment': {
            'id': payment.id,
            'status': payment.status,
            'amount': float(payment.amount),
            'method': payment.method,
            'mpesa_receipt': payment.mpesa_receipt_number or payment.transaction_id,
            'error_log': payment.error_log,  # Exposed to frontend
            'completed_at': payment.completed_at.isoformat() if payment.completed_at else None
        },
        'booking': {
            'id': booking.id if booking else None,
            'status': booking.status if booking else None,
            'payment_status': booking.payment_status if booking else None,
            'confirmation': booking.confirmation if booking else None
        },
        'property': {
            'id': property_obj.id,
            'name': property_obj.name,
            'location': property_obj.location,
            'cover_image': property_obj.get_cover_image_url() if property_obj else None,
        } if property_obj else None,
        'house_details': {
            'name': property_obj.name if property_obj else None,
            'location': property_obj.location if property_obj else None,
            'check_in': booking.check_in.isoformat() if (booking and booking.check_in) else None,
            'check_out': booking.check_out.isoformat() if (booking and booking.check_out) else None,
            'nights': booking.nights if booking else None,
            'total_amount': float(booking.total_amount) if booking else None,
        } if booking else None
    }), 200


@payment_bp.route('/booking/<int:booking_id>/payments', methods=['GET'])
@jwt_required()
def get_booking_payments(booking_id):
    user_id = get_jwt_identity()

    booking = Booking.query.filter_by(id=booking_id, user_id=user_id).first()
    if not booking:
        return jsonify({'error': 'Booking not found'}), 404

    payments = Payment.query.filter_by(booking_id=booking_id).order_by(Payment.created_at.desc()).all()
    result = [{
        'id': p.id, 'amount': float(p.amount), 'method': p.method, 'status': p.status,
        'mpesa_receipt': p.mpesa_receipt_number, 'refund_payment_id': p.refund_payment_id,
        'refund_note': p.refund_note, 'created_at': p.created_at.isoformat() if p.created_at else None,
        'completed_at': p.completed_at.isoformat() if p.completed_at else None
    } for p in payments]

    return jsonify({
        'booking_id': booking_id,
        'total_paid': float(booking.total_amount - booking.pending_amount),
        'pending': float(booking.pending_amount),
        'payments': result
    }), 200


@payment_bp.route('/process', methods=['POST'])
@jwt_required()
def process_payment():
    user_id = get_jwt_identity()
    data = request.json
    booking = Booking.query.filter_by(id=data['booking_id'], user_id=user_id).first()
    if booking.payment_status == 'completed':
        return jsonify({'error': 'Payment already completed for this booking'}), 400

    payment = Payment(
        booking_id=data['booking_id'], user_id=user_id, property_id=booking.property_id,
        amount=Decimal(str(data['amount'])), method=data['method'], mpesa_number=data.get('mpesa_number'),
        status='completed', created_at=datetime.utcnow(), completed_at=datetime.utcnow()
    )

    db.session.add(payment)
    _mark_booking_paid(booking, payment)
    db.session.commit()
    _send_payment_email(booking, payment)

    return jsonify({'id': payment.id, 'status': payment.status}), 201