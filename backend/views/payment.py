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
from mpesa_service import MPesaService
from paypal_service import PayPalService
from views.booking import check_and_update_expired

payment_bp = Blueprint('payment', __name__)
logger = logging.getLogger(__name__)

def verify_mpesa_signature(request):
    """
    Verify that callback is genuinely from Safaricom
    Uses MPESA_SECRET from environment variables
    """
    if current_app.config.get('MPESA_ENVIRONMENT') == 'sandbox':
        return True

    signature = request.headers.get('X-Mpesa-Signature')
    if not signature:
        logger.warning("Missing M-PESA signature")
        return False

    mpesa_secret = current_app.config.get('MPESA_SECRET', '')
    if not mpesa_secret:
        logger.warning("MPESA_SECRET not configured - skipping verification")
        return True

    expected = hmac.new(
        mpesa_secret.encode(),
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

    timeout_minutes = current_app.config['BOOKING_TIMEOUT_MINUTES']

    required_fields = ['booking_id', 'phone_number', 'amount']
    for field in required_fields:
        if field not in data:
            return jsonify({'success': False, 'error': f'Missing {field}'}), 400

    booking = Booking.query.filter_by(
        id=data['booking_id'],
        user_id=user_id
    ).first()

    if not booking:
        return jsonify({'success': False, 'error': 'Booking not found'}), 404

    if check_and_update_expired(booking):
        return jsonify({
            'success': False,
            'error': 'Booking session expired. Please start over.',
            'expired': True
        }), 400

    if booking.expires_at and booking.expires_at < datetime.utcnow():
        booking.status = 'expired'
        db.session.commit()
        return jsonify({
            'success': False,
            'error': 'Booking session expired. Please start over.',
            'expired': True
        }), 400

    if booking.payment_status == 'completed':
        return jsonify({'success': False, 'error': 'This booking is already paid'}), 400

    phone = data['phone_number'].strip().replace(' ', '').replace('+', '')
    if phone.startswith('0'):
        phone = '254' + phone[1:]
    elif not phone.startswith('254'):
        phone = '254' + phone

    idempotency_key = f"MPESA_{booking.id}_{datetime.utcnow().timestamp()}"

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
        mpesa_service = MPesaService()
        mpesa_result = mpesa_service.stk_push(
            phone_number=phone,
            amount=int(data['amount']),
            account_reference=f"BOOK{booking.id}",
            transaction_desc=f"Payment for booking #{booking.id}"
        )

        if mpesa_result.get('success'):
            payment.checkout_request_id = mpesa_result.get('checkout_request_id')
            payment.merchant_request_id = mpesa_result.get('merchant_request_id')
            db.session.commit()

            logger.info(f"✅ STK Push sent for booking {booking.id}, checkout: {payment.checkout_request_id}")

            return jsonify({
                'success': True,
                'payment_id': payment.id,
                'checkout_request_id': mpesa_result.get('checkout_request_id'),
                'message': 'STK Push sent. Please check your phone and enter PIN.',
                'expires_at': booking.expires_at.isoformat() if booking.expires_at else None
            }), 200
        else:
            payment.status = 'failed'
            payment.error_log = mpesa_result.get('error', 'Unknown error')
            db.session.commit()

            logger.error(f"❌ STK Push failed for booking {booking.id}: {mpesa_result.get('error')}")

            return jsonify({
                'success': False,
                'error': mpesa_result.get('error', 'Failed to initiate payment. Please try again.')
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
    logger.info(f"📞 M-PESA Callback received")

    if not verify_mpesa_signature(request):
        logger.warning("Invalid M-PESA signature")
        return jsonify({'ResultCode': 1, 'ResultDesc': 'Invalid signature'}), 401

    try:
        mpesa_service = MPesaService()
        callback_data = request.json
        processed = mpesa_service.process_callback(callback_data)

        checkout_request_id = processed.get('checkout_request_id')

        payment = Payment.query.filter_by(
            checkout_request_id=checkout_request_id
        ).first()

        if not payment:
            logger.error(f"Payment not found for checkout: {checkout_request_id}")
            return jsonify({'ResultCode': 1, 'ResultDesc': 'Payment not found'}), 200

        payment.webhook_received_at = datetime.utcnow()

        if processed.get('success'):
            payment.status = 'completed'
            payment.mpesa_receipt_number = processed.get('mpesa_receipt_number')
            payment.transaction_id = processed.get('mpesa_receipt_number')
            payment.completed_at = datetime.utcnow()

            booking = Booking.query.get(payment.booking_id)
            if booking:
                total_paid = db.session.query(
                    db.func.sum(Payment.amount)
                ).filter(
                    Payment.booking_id == booking.id,
                    Payment.status == 'completed',
                    Payment.method != 'refund'
                ).scalar() or Decimal('0')

                if total_paid >= booking.total_amount:
                    booking.payment_status = 'completed'
                    booking.status = 'confirmed'
                    booking.confirmation = 'confirmed'
                    logger.info(f"✅ Booking {booking.id} fully paid — KES {total_paid}")
                elif total_paid >= (booking.total_amount - booking.pending_amount):
                    booking.payment_status = 'partial'
                    booking.status = 'confirmed'
                    booking.confirmation = 'confirmed'
                    logger.info(f"✅ Booking {booking.id} partially paid — KES {total_paid}")

                booking.expires_at = None

            db.session.commit()
            logger.info(f"💰 Payment completed: {processed.get('mpesa_receipt_number')} for KES {payment.amount}")

            # Send payment received email
            try:
                from views.email_service import email_service
                booking_user = User.query.get(payment.user_id)
                if booking and booking_user:
                    email_service.send_payment_received(booking, booking_user, payment)
            except Exception as email_err:
                logger.warning(f"⚠️  Payment email failed (non-fatal): {email_err}")

        else:
            payment.status = 'failed'
            payment.error_log = processed.get('result_desc', 'Payment failed')
            db.session.commit()
            logger.warning(f"❌ Payment failed: {processed.get('result_desc')}")

        return jsonify({'ResultCode': 0, 'ResultDesc': 'Success'}), 200

    except Exception as e:
        logger.error(f"Callback processing error: {str(e)}")
        return jsonify({'ResultCode': 0, 'ResultDesc': 'Received'}), 200


@payment_bp.route('/mpesa/status/<checkout_request_id>', methods=['GET'])
@jwt_required()
def check_payment_status(checkout_request_id):
    """STEP 3: Frontend polls this to check if payment completed"""
    user_id = get_jwt_identity()

    payment = Payment.query.filter_by(
        checkout_request_id=checkout_request_id,
        user_id=user_id
    ).first()

    if not payment:
        return jsonify({'error': 'Payment not found'}), 404

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
    """Get all payments for a specific booking including refunds"""
    user_id = get_jwt_identity()

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
            'refund_payment_id': p.refund_payment_id,
            'refund_note': p.refund_note,
            'created_at': p.created_at.isoformat() if p.created_at else None,
            'completed_at': p.completed_at.isoformat() if p.completed_at else None
        })

    return jsonify({
        'booking_id': booking_id,
        'total_paid': float(booking.total_amount - booking.pending_amount),
        'pending': float(booking.pending_amount),
        'payments': result
    }), 200


@payment_bp.route('/process', methods=['POST'])
@jwt_required()
def process_payment():
    """Legacy payment processing endpoint (for non-M-PESA methods)"""
    user_id = get_jwt_identity()
    data = request.json

    required_fields = ['booking_id', 'amount', 'method']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400

    booking = Booking.query.filter_by(id=data['booking_id'], user_id=user_id).first()
    if not booking:
        return jsonify({'error': 'Booking not found'}), 404

    if booking.payment_status == 'completed':
        return jsonify({'error': 'Payment already completed for this booking'}), 400

    payment = Payment(
        booking_id=data['booking_id'],
        user_id=user_id,
        property_id=booking.property_id,
        amount=Decimal(str(data['amount'])),
        method=data['method'],
        mpesa_number=data.get('mpesa_number'),
        status='completed'
    )

    booking.payment_status = 'completed'
    booking.confirmation = 'confirmed'

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


# ==================== PAYPAL ENDPOINTS ====================

@payment_bp.route('/paypal/create-order', methods=['POST'])
@jwt_required()
def create_paypal_order():
    user_id = get_jwt_identity()
    data = request.json

    paypal_client_id = current_app.config.get('PAYPAL_CLIENT_ID', '')
    paypal_secret = current_app.config.get('PAYPAL_CLIENT_SECRET', '')

    if not paypal_client_id or not paypal_secret:
        return jsonify({'success': False, 'error': 'PayPal not configured'}), 500

    required_fields = ['booking_id', 'amount']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400

    booking = Booking.query.filter_by(id=data['booking_id'], user_id=user_id).first()
    if not booking:
        return jsonify({'error': 'Booking not found'}), 404

    if booking.payment_status == 'completed':
        return jsonify({'error': 'Payment already completed for this booking'}), 400

    amount = Decimal(str(data['amount']))
    currency = data.get('currency', 'KES')
    exchange_rate = current_app.config.get('KES_TO_USD_RATE', 129.0)

    if currency == 'KES':
        amount_usd = float(amount) / exchange_rate
        currency = 'USD'
    else:
        amount_usd = float(amount)

    payment = Payment(
        booking_id=data['booking_id'],
        user_id=user_id,
        property_id=booking.property_id,
        amount=Decimal(str(data['amount'])),
        method='paypal',
        status='pending'
    )
    db.session.add(payment)
    db.session.commit()

    try:
        paypal_service = PayPalService()
        description = f"Booking #{booking.id} - Homes by Mwema"

        return_url = data.get('return_url') or current_app.config.get('PAYPAL_RETURN_URL')
        cancel_url = data.get('cancel_url') or current_app.config.get('PAYPAL_CANCEL_URL')

        result = paypal_service.create_order(
            amount=amount_usd,
            currency=currency,
            booking_id=booking.id,
            description=description,
            return_url=return_url,
            cancel_url=cancel_url
        )

        if result['success']:
            payment.transaction_id = result['order_id']
            payment.mpesa_response_description = f"PayPal Order: {result['status']} | Rate: {exchange_rate}"
            db.session.commit()

            return jsonify({
                'success': True,
                'payment_id': payment.id,
                'order_id': result['order_id'],
                'status': result['status'],
                'approval_url': result['approval_url'],
                'amount_usd': amount_usd,
                'original_amount_kes': float(data['amount']),
                'exchange_rate': exchange_rate
            }), 200
        else:
            payment.status = 'failed'
            payment.mpesa_response_description = result.get('error', 'Order creation failed')
            db.session.commit()
            return jsonify({'success': False, 'error': result.get('error', 'Failed to create PayPal order')}), 400

    except Exception as e:
        payment.status = 'failed'
        payment.mpesa_response_description = str(e)
        db.session.commit()
        return jsonify({'success': False, 'error': f'Error creating PayPal order: {str(e)}'}), 500


@payment_bp.route('/paypal/capture-order', methods=['POST'])
@jwt_required()
def capture_paypal_order():
    user_id = get_jwt_identity()
    data = request.json

    if 'order_id' not in data:
        return jsonify({'error': 'Missing required field: order_id'}), 400

    order_id = data['order_id']

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
            payment.status = 'completed'
            payment.completed_at = datetime.utcnow()

            if result.get('capture'):
                payment.mpesa_receipt_number = result['capture'].get('transaction_id')

            payment.mpesa_response_description = f"PayPal payment completed: {result['status']}"

            booking = Booking.query.get(payment.booking_id)
            if booking:
                booking.payment_status = 'completed'
                booking.confirmation = 'confirmed'
                booking.payment_method = 'paypal'

                if booking.payment_type == 'partial':
                    paid_amount = db.session.query(
                        db.func.sum(Payment.amount)
                    ).filter(
                        Payment.booking_id == booking.id,
                        Payment.status == 'completed',
                        Payment.method != 'refund'
                    ).scalar() or Decimal('0')

                    booking.pending_amount = booking.total_amount - paid_amount
                    if booking.pending_amount > 0:
                        booking.payment_status = 'partial'

                booking.expires_at = None

            db.session.commit()

            # Send payment received email
            try:
                from views.email_service import email_service
                booking_user = User.query.get(payment.user_id)
                if booking and booking_user:
                    email_service.send_payment_received(booking, booking_user, payment)
            except Exception as email_err:
                logger.warning(f"⚠️  Payment email failed (non-fatal): {email_err}")

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
            return jsonify({'success': False, 'error': result.get('error', 'Failed to capture payment')}), 400

    except Exception as e:
        payment.status = 'failed'
        payment.mpesa_response_description = str(e)
        db.session.commit()
        return jsonify({'success': False, 'error': f'Error capturing PayPal payment: {str(e)}'}), 500


@payment_bp.route('/paypal/order/<order_id>', methods=['GET'])
@jwt_required()
def get_paypal_order(order_id):
    user_id = get_jwt_identity()

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
            return jsonify({'success': False, 'error': result.get('error', 'Failed to get order details')}), 400

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@payment_bp.route('/paypal/webhook', methods=['POST'])
def paypal_webhook():
    try:
        webhook_id = current_app.config.get('PAYPAL_WEBHOOK_ID', '')

        if not webhook_id:
            logger.warning("PAYPAL_WEBHOOK_ID not configured")
            return jsonify({'status': 'ignored'}), 200

        paypal_service = PayPalService()
        is_valid = paypal_service.verify_webhook_signature(
            headers=request.headers,
            body=request.get_data(as_text=True),
            webhook_id=webhook_id
        )

        if not is_valid:
            logger.warning("Invalid PayPal webhook signature")
            return jsonify({'error': 'Invalid signature'}), 401

        event = request.json
        event_type = event.get('event_type')
        resource = event.get('resource', {})

        if event_type == 'PAYMENT.CAPTURE.COMPLETED':
            order_id = resource.get('supplementary_data', {}).get('related_ids', {}).get('order_id')
            if order_id:
                payment = Payment.query.filter_by(transaction_id=order_id, method='paypal').first()
                if payment and payment.status != 'completed':
                    payment.status = 'completed'
                    payment.completed_at = datetime.utcnow()
                    payment.mpesa_receipt_number = resource.get('id')
                    booking = Booking.query.get(payment.booking_id)
                    if booking:
                        booking.payment_status = 'completed'
                        booking.confirmation = 'confirmed'
                        booking.expires_at = None
                    db.session.commit()

        elif event_type == 'PAYMENT.CAPTURE.DENIED':
            order_id = resource.get('supplementary_data', {}).get('related_ids', {}).get('order_id')
            if order_id:
                payment = Payment.query.filter_by(transaction_id=order_id, method='paypal').first()
                if payment:
                    payment.status = 'failed'
                    payment.mpesa_response_description = 'Payment denied'
                    db.session.commit()

        elif event_type == 'PAYMENT.CAPTURE.REFUNDED':
            capture_id = resource.get('id')
            payment = Payment.query.filter_by(mpesa_receipt_number=capture_id, method='paypal').first()
            if payment:
                payment.status = 'refunded'
                db.session.commit()

        return jsonify({'status': 'ok'}), 200

    except Exception as e:
        logger.error(f"PayPal webhook error: {str(e)}")
        return jsonify({'status': 'error'}), 500


# ==================== UNIFIED REFUND ENDPOINT ====================

@payment_bp.route('/refund', methods=['POST'])
@jwt_required()
def process_refund():
    """
    Admin: Process a refund for a cancelled booking.
    Handles both M-PESA B2C and PayPal automatically based on
    how the customer originally paid.

    Body: { booking_id: int, note: str (optional) }
    """
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user or user.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403

    data = request.get_json() or {}
    booking_id = data.get('booking_id')

    if not booking_id:
        return jsonify({'error': 'booking_id is required'}), 400

    # Validate booking
    booking = Booking.query.get(booking_id)
    if not booking:
        return jsonify({'error': 'Booking not found'}), 404

    if booking.status != 'cancelled':
        return jsonify({'error': 'Booking is not cancelled'}), 400

    refund_amount = float(booking.refund_amount or 0)
    if refund_amount <= 0:
        return jsonify({'error': 'No refund amount set for this booking'}), 400

    if booking.refund_processed:
        return jsonify({
            'error': 'Refund already processed',
            'refund_processed_at': booking.refund_processed_at.isoformat()
                if booking.refund_processed_at else None
        }), 400

    # Find the original completed payment (excluding refund rows)
    original_payment = Payment.query.filter_by(
        booking_id=booking_id,
        status='completed'
    ).filter(
        Payment.method != 'refund'
    ).order_by(Payment.completed_at.desc()).first()

    if not original_payment:
        return jsonify({'error': 'No completed payment found for this booking'}), 400

    method = original_payment.method

    # Call the appropriate refund API
    try:
        if method == 'mpesa':
            result = _process_mpesa_refund(original_payment, refund_amount, booking)
        elif method == 'paypal':
            result = _process_paypal_refund(
                original_payment, refund_amount,
                note=data.get('note', 'Refund from Homes by Mwema')
            )
        else:
            return jsonify({'error': f'Unsupported payment method: {method}'}), 400
    except Exception as e:
        logger.error(f"Refund API error for booking {booking_id}: {str(e)}")
        return jsonify({'error': f'Refund failed: {str(e)}'}), 500

    if not result.get('success'):
        return jsonify({
            'success': False,
            'error': result.get('error', 'Refund failed')
        }), 400

    # Create a refund Payment row — negative amount so SUM(amount) = net revenue
    refund_payment = Payment(
        booking_id=booking_id,
        user_id=booking.user_id,
        property_id=booking.property_id,
        amount=Decimal(str(-abs(refund_amount))),
        method='refund',
        status='completed',
        transaction_id=result.get('transaction_id'),
        refund_payment_id=original_payment.id,
        refund_note=data.get('note', f'Refund for cancelled booking #{booking_id}'),
        completed_at=datetime.utcnow(),
        created_at=datetime.utcnow()
    )
    db.session.add(refund_payment)

    # Mark booking as refunded
    booking.refund_processed = True
    booking.refund_processed_at = datetime.utcnow()
    booking.payment_status = 'refunded'

    db.session.commit()

    logger.info(
        f"✅ Refund processed for booking {booking_id}: "
        f"KES {refund_amount} via {method} "
        f"(refund payment id={refund_payment.id})"
    )

    # Send refund processed email
    try:
        from views.email_service import email_service
        booking_user = User.query.get(booking.user_id)
        if booking_user:
            email_service.send_refund_processed(booking, booking_user, refund_amount, method)
    except Exception as email_err:
        logger.warning(f"⚠️  Refund email failed (non-fatal): {email_err}")

    return jsonify({
        'success': True,
        'booking_id': booking_id,
        'refund_amount': refund_amount,
        'method': method,
        'transaction_id': result.get('transaction_id'),
        'refund_payment_id': refund_payment.id,
        'original_payment_id': original_payment.id,
        'processed_at': refund_payment.completed_at.isoformat()
    }), 200


def _process_mpesa_refund(original_payment, refund_amount, booking):
    """Trigger M-PESA B2C reversal."""
    mpesa_service = MPesaService()

    phone = original_payment.mpesa_number
    if not phone:
        user = User.query.get(original_payment.user_id)
        phone = user.phone if user else None

    if not phone:
        return {'success': False, 'error': 'No phone number for M-PESA refund'}

    phone = phone.strip().replace('+', '').replace(' ', '')
    if phone.startswith('0'):
        phone = '254' + phone[1:]

    try:
        result = mpesa_service.b2c_payment(
            phone_number=phone,
            amount=int(refund_amount),
            occasion=f"Refund booking #{booking.id}",
            remarks="Cancelled booking refund"
        )
        if result.get('success'):
            return {
                'success': True,
                'transaction_id': result.get('conversation_id') or result.get('transaction_id')
            }
        return {'success': False, 'error': result.get('error', 'M-PESA B2C failed')}
    except Exception as e:
        return {'success': False, 'error': str(e)}


def _process_paypal_refund(original_payment, refund_amount, note):
    """Trigger PayPal capture refund."""
    capture_id = original_payment.mpesa_receipt_number
    if not capture_id:
        return {'success': False, 'error': 'PayPal capture ID not found'}

    exchange_rate = current_app.config.get('KES_TO_USD_RATE', 129.0)
    amount_usd = refund_amount / exchange_rate

    paypal_service = PayPalService()
    result = paypal_service.refund_capture(
        capture_id=capture_id,
        amount=amount_usd,
        note=note
    )

    if result.get('success'):
        return {'success': True, 'transaction_id': result.get('refund_id')}
    return {'success': False, 'error': result.get('error', 'PayPal refund failed')}


# ==================== ADMIN ENDPOINTS ====================

@payment_bp.route('/admin/pending', methods=['GET'])
@jwt_required()
def get_pending_payments():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403

    timeout_minutes = current_app.config.get('BOOKING_TIMEOUT_MINUTES', 15)
    check_time = datetime.utcnow() - timedelta(minutes=timeout_minutes - 5)

    pending = Payment.query.filter(
        Payment.status == 'pending',
        Payment.created_at < check_time
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
    """Background task to mark very old pending payments as abandoned"""
    try:
        one_hour_ago = datetime.utcnow() - timedelta(hours=1)

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


def format_phone_number(phone_number):
    """Format phone number to M-PESA format (254XXXXXXXXX)"""
    phone_number = ''.join(filter(str.isdigit, str(phone_number)))

    if phone_number.startswith('0'):
        return '254' + phone_number[1:]
    elif phone_number.startswith('254'):
        return phone_number
    elif phone_number.startswith('7') or phone_number.startswith('1'):
        return '254' + phone_number
    else:
        return phone_number