from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, Property, Booking, Payment, Consultation, Notification
from datetime import datetime
import logging
import traceback
import resend
import os
from views.email_service import email_service

logger = logging.getLogger(__name__)
consultation_bp = Blueprint('consultation', __name__)


# ==================== HELPER FUNCTIONS ====================

def get_user_from_token():
    """Get current user from JWT token"""
    try:
        user_id = get_jwt_identity()
        if user_id:
            return User.query.get(user_id)
    except:
        pass
    return None


def is_admin():
    """Check if current user is admin"""
    user = get_user_from_token()
    return user and user.role == 'admin'


# ==================== EMAIL HELPERS WITH RESEND ====================

def format_datetime_for_email(consultation):
    """Format consultation date/time for email display"""
    months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
    d = consultation.date
    date_str = f"{months[d.month-1]} {d.day}, {d.year}" if d else "TBD"
    h = consultation.hour or 0
    m = str(consultation.minute or 0).zfill(2)
    period = "PM" if h >= 12 else "AM"
    h12 = h - 12 if h > 12 else (12 if h == 0 else h)
    time_str = f"{h12}:{m} {period}"
    return date_str, time_str


def _notify_admin_new_consultation(consultation, user=None):
    """Send email to admin when a new consultation is booked using Resend API"""
    try:
        # Create admin notification in database
        admin_users = User.query.filter_by(role='admin').all()
        for admin in admin_users:
            notification = Notification(
                user_id=admin.id,
                type='consultation',
                title='New Consultation Request',
                message=f'New consultation request from {consultation.name or "Anonymous"}',
                related_id=consultation.id,
                priority='normal'
            )
            db.session.add(notification)
        
        # Send email notification to admin
        email_service.send_admin_consultation_notification(consultation, user)
        
        db.session.commit()
        logger.info(f"Admin notifications created and email sent for consultation {consultation.id}")

    except Exception as e:
        logger.error(f"❌ Admin notification error: {e}")
        db.session.rollback()
        # Don't raise - non-fatal error


def _send_user_booking_received(consultation):
    """Send confirmation email to client using Resend API"""
    try:
        recipient = consultation.email
        if not recipient:
            logger.warning(f"⚠️ No recipient email for consultation #{consultation.id}")
            return

        # Initialize Resend with API key from environment
        resend.api_key = os.environ.get('RESEND_API_KEY')
        if not resend.api_key:
            logger.error("❌ RESEND_API_KEY not set in environment")
            return

        date_str, time_str = format_datetime_for_email(consultation)
        client_name = consultation.name or 'Valued Client'

        html_body = f"""
        <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; background: #f9f8f6; padding: 24px;">
          <div style="background: #1C2321; color: white; padding: 24px;">
            <p style="color: #D4AF37; font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em; margin: 0 0 8px;">Homes by Mwema</p>
            <h1 style="font-size: 20px; margin: 0; font-weight: normal;">We've Received Your Request</h1>
          </div>
          <div style="background: white; border: 1px solid #ebe5de; padding: 24px; margin-top: 0;">
            <p style="color: #555; font-size: 14px; line-height: 1.6;">Dear {client_name},</p>
            <p style="color: #555; font-size: 14px; line-height: 1.6;">
              Thank you for requesting a private consultation. We've received your booking for:
            </p>
            <div style="background: #f9f8f6; border-left: 3px solid #D4AF37; padding: 16px; margin: 16px 0;">
              <p style="margin: 0 0 4px; color: #1C1917; font-size: 15px; font-weight: bold;">{date_str} at {time_str}</p>
              <p style="margin: 0 0 4px; color: #555; font-size: 13px;">Topic: {consultation.topic or 'General Inquiry'}</p>
              <p style="margin: 0; color: #888; font-size: 12px;">Consultation fee: KSh 20,000</p>
            </div>
            <p style="color: #555; font-size: 13px; line-height: 1.6;">
              Your request is currently <strong>pending review</strong>. We will send you a confirmation email
              once your slot is approved, along with payment instructions.
            </p>
            <p style="color: #555; font-size: 13px; line-height: 1.6;">
              You can track your consultation status in your
              <a href="https://homesbymwema.com/my-consultations" style="color: #1C2321;">dashboard</a>.
            </p>
            <p style="color: #888; font-size: 13px; margin-top: 24px; padding-top: 16px; border-top: 1px solid #eee;">
              Warm regards,<br/>
              <strong style="color: #1C1917;">The Homes by Mwema Team</strong>
            </p>
          </div>
          <p style="color: #aaa; font-size: 11px; text-align: center; margin-top: 16px;">
            Consultation #{consultation.id} ·
            <a href="https://homesbymwema.com" style="color: #aaa;">homesbymwema.com</a>
          </p>
        </div>
        """

        params = {
            "from": "Homes by Mwema <noreply@homesbymwema.com>",  # Updated to verified domain
            "to": [recipient],
            "subject": f"Consultation Request Received – {date_str}",
            "html": html_body,
        }

        email = resend.Emails.send(params)
        logger.info(f"✅ Booking-received email sent to {recipient} via Resend (ID: {email['id']})")
        
    except Exception as e:
        logger.error(f"❌ User confirmation email error: {e}")
        raise  # Re-raise so caller knows it failed


def _send_rejection_email(consultation, reason=''):
    """Send rejection notification to client using Resend API"""
    try:
        recipient = consultation.email
        if not recipient:
            return

        # Initialize Resend with API key from environment
        resend.api_key = os.environ.get('RESEND_API_KEY')
        if not resend.api_key:
            logger.error("❌ RESEND_API_KEY not set in environment")
            return

        date_str, _ = format_datetime_for_email(consultation)
        client_name = consultation.name or 'Valued Client'

        reason_block = (
            f'<p style="color: #666; font-size: 13px; background: #f5f2ee; padding: 12px; border-left: 3px solid #ddd;">'
            f'<em>{reason}</em></p>'
        ) if reason else ''

        html_body = f"""
        <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; background: #f9f8f6; padding: 24px;">
          <div style="background: #1C2321; color: white; padding: 24px;">
            <p style="color: #D4AF37; font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em; margin: 0 0 8px;">Homes by Mwema</p>
            <h1 style="font-size: 20px; margin: 0; font-weight: normal;">Consultation Update</h1>
          </div>
          <div style="background: white; border: 1px solid #ebe5de; padding: 24px;">
            <p style="color: #555; font-size: 14px;">Dear {client_name},</p>
            <p style="color: #555; font-size: 14px; line-height: 1.6;">
              We regret to inform you that we are unable to accommodate your consultation
              request for <strong>{date_str}</strong>.
            </p>
            {reason_block}
            <p style="color: #555; font-size: 13px; line-height: 1.6;">
              We encourage you to
              <a href="https://homesbymwema.com/consultation/new" style="color: #1C2321;">book a new slot</a>
              at your convenience. We apologise for any inconvenience.
            </p>
            <p style="color: #888; font-size: 13px; margin-top: 24px; border-top: 1px solid #eee; padding-top: 16px;">
              Kind regards,<br/><strong style="color: #1C1917;">Homes by Mwema</strong>
            </p>
          </div>
        </div>
        """

        params = {
            "from": "Homes by Mwema <noreply@homesbymwema.com>",  # Updated to verified domain
            "to": [recipient],
            "subject": "Update on Your Consultation Request",
            "html": html_body,
        }

        email = resend.Emails.send(params)
        logger.info(f"✅ Rejection email sent to {recipient} via Resend (ID: {email['id']})")
        
    except Exception as e:
        logger.error(f"❌ Rejection email error: {e}")
        raise


# ==================== ADMIN CONFIRM WITH EMAIL (UPDATED) ====================

@consultation_bp.route('/admin/<int:consultation_id>/confirm-with-email', methods=['POST'])
@jwt_required()
def admin_confirm_with_email(consultation_id):
    """Admin: Confirm consultation and send a custom email to the client using Resend"""
    try:
        if not is_admin():
            return jsonify({'error': 'Admin access required'}), 403

        data = request.json
        consultation = Consultation.query.get_or_404(consultation_id)

        recipient_email = consultation.email or (consultation.user.email if consultation.user else None)
        if not recipient_email:
            return jsonify({'error': 'No email address found for this consultation'}), 400

        # Initialize Resend
        resend.api_key = os.environ.get('RESEND_API_KEY')
        if not resend.api_key:
            return jsonify({'error': 'RESEND_API_KEY not configured'}), 500

        # Update status
        consultation.status       = 'confirmed'
        consultation.confirmed_at = datetime.utcnow()
        consultation.meeting_link = data.get('meeting_link', consultation.meeting_link)
        consultation.admin_notes  = data.get('admin_notes',  consultation.admin_notes)

        # Send the email
        try:
            subject  = data.get('subject', f'Your Consultation is Confirmed')
            body_text = data.get('body', '')

            body_html = f"""
            <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; background: #f9f8f6; padding: 24px;">
              <div style="background: #1C2321; color: white; padding: 24px;">
                <p style="color: #D4AF37; font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em; margin: 0 0 8px;">Homes by Mwema</p>
                <h1 style="font-size: 20px; margin: 0; font-weight: normal;">Consultation Confirmed</h1>
              </div>
              <div style="background: white; border: 1px solid #ebe5de; padding: 24px;">
                <pre style="font-family: Georgia, serif; font-size: 14px; color: #555; line-height: 1.7; white-space: pre-wrap; margin: 0;">{body_text}</pre>
              </div>
              <p style="color: #aaa; font-size: 11px; text-align: center; margin-top: 16px;">
                Consultation #{consultation.id} · <a href="https://homesbymwema.com" style="color:#aaa;">homesbymwema.com</a>
              </p>
            </div>
            """

            params = {
                "from": "Homes by Mwema <noreply@homesbymwema.com>",  # Updated to verified domain
                "to": [recipient_email],
                "subject": subject,
                "html": body_html,
            }

            email = resend.Emails.send(params)

            consultation.email_sent    = True
            consultation.email_sent_at = datetime.utcnow()
            consultation.email_content = body_html
            email_status = 'sent'
            logger.info(f"✅ Confirmation email sent to {recipient_email} for consultation {consultation_id} (ID: {email['id']})")

        except Exception as email_err:
            logger.error(f"❌ Failed to send email: {email_err}")
            email_status = 'failed'

        db.session.commit()

        return jsonify({
            'message': 'Consultation confirmed' + (' and email sent' if email_status == 'sent' else ' (email failed to send)'),
            'consultation': consultation.to_dict(detailed=True),
            'email_status': email_status
        }), 200

    except Exception as e:
        logger.error(f"❌ Error confirming consultation: {str(e)}")
        logger.error(traceback.format_exc())
        db.session.rollback()
        return jsonify({'error': 'Failed to confirm consultation'}), 500


# ==================== CLIENT ENDPOINTS ====================

@consultation_bp.route('/', methods=['POST'])
@jwt_required(optional=True)
def create_consultation():
    """
    Create a new consultation request.
    Emails admin (new request notification) + client (booking received).
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        current_user = get_user_from_token()
        user_id = current_user.id if current_user else None

        required_fields = ['date', 'hour', 'minute']
        missing = [f for f in required_fields if f not in data]
        if missing:
            return jsonify({'error': f'Missing fields: {", ".join(missing)}'}), 400

        try:
            if isinstance(data['date'], str):
                consultation_date = datetime.fromisoformat(data['date'].replace('Z', '+00:00'))
            else:
                consultation_date = datetime.fromisoformat(data['date'])
        except Exception as e:
            logger.error(f"Date parsing error: {str(e)}")
            return jsonify({'error': 'Invalid date format. Use ISO format (e.g. 2024-03-20T10:00:00Z)'}), 400

        hour   = int(data.get('hour', 0))
        minute = int(data.get('minute', 0))

        if hour < 0 or hour > 23:
            return jsonify({'error': 'Hour must be between 0 and 23'}), 400
        if minute not in [0, 15, 30, 45]:
            return jsonify({'error': 'Minute must be 0, 15, 30, or 45'}), 400

        consultation = Consultation(
            user_id=user_id,
            name=data.get('name')  or (current_user.name  if current_user else None),
            email=data.get('email') or (current_user.email if current_user else None),
            phone=data.get('phone') or (current_user.phone if current_user else None),
            date=consultation_date,
            hour=hour,
            minute=minute,
            notes=data.get('notes', ''),
            topic=(data.get('topic') or '').strip() or 'General Inquiry',
            status='pending'
        )

        db.session.add(consultation)
        db.session.commit()

        logger.info(f"✅ Consultation created: ID {consultation.id} for user {consultation.user_id or 'guest'}")

        # Notify admin (non-fatal)
        try:
            _notify_admin_new_consultation(consultation, current_user)
        except Exception as email_err:
            logger.warning(f"⚠️ Admin notification failed (non-fatal): {email_err}")

        # Send client confirmation (non-fatal)
        try:
            _send_user_booking_received(consultation)
        except Exception as email_err:
            logger.warning(f"⚠️ Client confirmation email failed (non-fatal): {email_err}")

        return jsonify({
            'message': 'Consultation request submitted successfully',
            'consultation': consultation.to_dict()
        }), 201

    except Exception as e:
        logger.error(f"❌ Error creating consultation: {str(e)}")
        logger.error(traceback.format_exc())
        db.session.rollback()
        return jsonify({'error': 'Failed to create consultation'}), 500


@consultation_bp.route('/my-consultations', methods=['GET'])
@jwt_required()
def get_my_consultations():
    """Get current user's consultations"""
    try:
        user_id = get_jwt_identity()
        if not user_id:
            return jsonify({'error': 'Authentication required'}), 401

        consultations = Consultation.query.filter_by(user_id=user_id)\
            .order_by(Consultation.created_at.desc()).all()

        return jsonify([c.to_dict() for c in consultations]), 200

    except Exception as e:
        logger.error(f"❌ Error fetching user consultations: {str(e)}")
        return jsonify({'error': 'Failed to fetch consultations'}), 500


@consultation_bp.route('/<int:consultation_id>', methods=['GET'])
@jwt_required()
def get_consultation(consultation_id):
    """Get a single consultation (user can only see their own)"""
    try:
        user_id = get_jwt_identity()
        consultation = Consultation.query.get_or_404(consultation_id)

        if consultation.user_id != user_id and not is_admin():
            return jsonify({'error': 'Unauthorized'}), 403

        return jsonify(consultation.to_dict(detailed=is_admin())), 200

    except Exception as e:
        logger.error(f"❌ Error fetching consultation: {str(e)}")
        return jsonify({'error': 'Failed to fetch consultation'}), 500


@consultation_bp.route('/<int:consultation_id>/cancel', methods=['PUT'])
@jwt_required()
def cancel_consultation(consultation_id):
    """User cancels their own consultation"""
    try:
        user_id = get_jwt_identity()
        consultation = Consultation.query.get_or_404(consultation_id)

        if consultation.user_id != user_id:
            return jsonify({'error': 'Unauthorized'}), 403

        if consultation.status not in ['pending', 'confirmed']:
            return jsonify({'error': f'Cannot cancel a consultation with status: {consultation.status}'}), 400

        consultation.status = 'cancelled'
        consultation.cancelled_at = datetime.utcnow()
        db.session.commit()

        logger.info(f"✅ Consultation {consultation_id} cancelled by user")

        return jsonify({
            'message': 'Consultation cancelled successfully',
            'consultation': consultation.to_dict()
        }), 200

    except Exception as e:
        logger.error(f"❌ Error cancelling consultation: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to cancel consultation'}), 500


@consultation_bp.route('/<int:consultation_id>', methods=['DELETE'])
@jwt_required()
def delete_my_consultation(consultation_id):
    """User deletes their own cancelled / completed / rejected consultation from history"""
    try:
        user_id = get_jwt_identity()
        consultation = Consultation.query.get_or_404(consultation_id)

        if consultation.user_id != user_id:
            return jsonify({'error': 'Unauthorized'}), 403

        if consultation.status not in ['cancelled', 'completed', 'rejected']:
            return jsonify({'error': 'You can only delete cancelled or completed consultations'}), 400

        db.session.delete(consultation)
        db.session.commit()

        logger.info(f"✅ Consultation {consultation_id} deleted by user {user_id}")
        return jsonify({'message': 'Consultation removed from your history'}), 200

    except Exception as e:
        logger.error(f"❌ Error deleting consultation: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to delete consultation'}), 500


# ==================== ADMIN ENDPOINTS ====================

@consultation_bp.route('/admin/list', methods=['GET'])
@jwt_required()
def admin_list_consultations():
    """Admin: List all consultations with optional filters"""
    try:
        if not is_admin():
            return jsonify({'error': 'Admin access required'}), 403

        status = request.args.get('status')
        search = request.args.get('search', '')

        query = Consultation.query

        if status:
            query = query.filter_by(status=status)

        if search:
            query = query.filter(
                db.or_(
                    Consultation.name.ilike(f'%{search}%'),
                    Consultation.email.ilike(f'%{search}%'),
                    Consultation.phone.ilike(f'%{search}%')
                )
            )

        consultations = query.order_by(Consultation.created_at.desc()).all()

        return jsonify([c.to_dict(include_user=True) for c in consultations]), 200

    except Exception as e:
        logger.error(f"❌ Error listing consultations: {str(e)}")
        return jsonify({'error': 'Failed to fetch consultations'}), 500


@consultation_bp.route('/admin/<int:consultation_id>', methods=['GET'])
@jwt_required()
def admin_get_consultation(consultation_id):
    """Admin: Get detailed consultation info"""
    try:
        if not is_admin():
            return jsonify({'error': 'Admin access required'}), 403

        consultation = Consultation.query.get_or_404(consultation_id)
        return jsonify(consultation.to_dict(include_user=True, detailed=True)), 200

    except Exception as e:
        logger.error(f"❌ Error fetching consultation details: {str(e)}")
        return jsonify({'error': 'Failed to fetch consultation'}), 500


@consultation_bp.route('/admin/<int:consultation_id>/status', methods=['PUT'])
@jwt_required()
def admin_update_status(consultation_id):
    """Admin: Update consultation status"""
    try:
        if not is_admin():
            return jsonify({'error': 'Admin access required'}), 403

        data = request.json
        new_status = data.get('status')

        if new_status not in ['pending', 'confirmed', 'completed', 'cancelled', 'rejected']:
            return jsonify({'error': 'Invalid status'}), 400

        consultation = Consultation.query.get_or_404(consultation_id)
        old_status = consultation.status

        consultation.status = new_status

        now = datetime.utcnow()
        if new_status == 'confirmed':
            consultation.confirmed_at = now
            consultation.meeting_link = data.get('meeting_link', consultation.meeting_link)
            consultation.admin_notes  = data.get('admin_notes',  consultation.admin_notes)
        elif new_status == 'completed':
            consultation.completed_at = now
        elif new_status in ('cancelled', 'rejected'):
            consultation.cancelled_at = now

        db.session.commit()

        logger.info(f"✅ Consultation {consultation_id} status updated: {old_status} → {new_status}")

        return jsonify({
            'message': f'Consultation {new_status}',
            'consultation': consultation.to_dict(detailed=True)
        }), 200

    except Exception as e:
        logger.error(f"❌ Error updating consultation status: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to update consultation'}), 500


@consultation_bp.route('/admin/<int:consultation_id>/reject', methods=['POST'])
@jwt_required()
def admin_reject_consultation(consultation_id):
    """Admin: Reject a consultation and optionally notify the client"""
    try:
        if not is_admin():
            return jsonify({'error': 'Admin access required'}), 403

        data = request.json or {}
        consultation = Consultation.query.get_or_404(consultation_id)

        if consultation.status in ['completed', 'cancelled']:
            return jsonify({'error': f'Cannot reject a {consultation.status} consultation'}), 400

        consultation.status       = 'rejected'
        consultation.cancelled_at = datetime.utcnow()
        consultation.admin_notes  = data.get('reason', consultation.admin_notes)
        db.session.commit()

        if data.get('notify_client', True):
            try:
                _send_rejection_email(consultation, data.get('reason', ''))
            except Exception as e:
                logger.warning(f"⚠️ Rejection email failed (non-fatal): {e}")

        return jsonify({
            'message': 'Consultation rejected',
            'consultation': consultation.to_dict(detailed=True)
        }), 200

    except Exception as e:
        logger.error(f"❌ Error rejecting consultation: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to reject consultation'}), 500


@consultation_bp.route('/admin/stats', methods=['GET'])
@jwt_required()
def admin_get_stats():
    """Admin: Get consultation statistics"""
    try:
        if not is_admin():
            return jsonify({'error': 'Admin access required'}), 403

        total_consultations     = Consultation.query.count()
        pending_consultations   = Consultation.query.filter_by(status='pending').count()
        confirmed_consultations = Consultation.query.filter_by(status='confirmed').count()
        completed_consultations = Consultation.query.filter_by(status='completed').count()
        cancelled_consultations = Consultation.query.filter_by(status='cancelled').count()
        rejected_consultations  = Consultation.query.filter_by(status='rejected').count()

        total_properties = Property.query.count()
        total_users = User.query.count()
        active_bookings = Booking.query.filter(Booking.status.in_(['pending', 'confirmed', 'upcoming', 'active'])).count()
        completed_bookings = Booking.query.filter_by(status='completed').count()
        total_revenue = db.session.query(db.func.coalesce(db.func.sum(Payment.amount), 0)).scalar() or 0
        pending_payments = db.session.query(db.func.coalesce(db.func.sum(Payment.amount), 0)).filter(Payment.status != 'completed').scalar() or 0

        recent = Consultation.query.order_by(Consultation.created_at.desc()).limit(5).all()

        return jsonify({
            'stats': {
                'total_properties': total_properties,
                'total_users': total_users,
                'active_bookings': active_bookings,
                'completed_bookings': completed_bookings,
                'total_revenue': float(total_revenue),
                'pending_payments': float(pending_payments),
                'consultation_total': total_consultations,
                'consultation_pending': pending_consultations,
                'consultation_confirmed': confirmed_consultations,
                'consultation_completed': completed_consultations,
                'consultation_cancelled': cancelled_consultations,
                'consultation_rejected': rejected_consultations
            },
            'recent': [c.to_dict() for c in recent]
        }), 200

    except Exception as e:
        logger.error(f"❌ Error fetching consultation stats: {str(e)}")
        return jsonify({'error': 'Failed to fetch statistics'}), 500


@consultation_bp.route('/admin/<int:consultation_id>', methods=['DELETE'])
@jwt_required()
def admin_delete_consultation(consultation_id):
    """Admin: Delete a consultation (completed / cancelled / rejected only)"""
    try:
        if not is_admin():
            return jsonify({'error': 'Admin access required'}), 403

        consultation = Consultation.query.get_or_404(consultation_id)

        if consultation.status not in ['completed', 'cancelled', 'rejected']:
            return jsonify({'error': 'Can only delete completed, cancelled, or rejected consultations'}), 400

        db.session.delete(consultation)
        db.session.commit()

        logger.info(f"✅ Consultation {consultation_id} deleted by admin")
        return jsonify({'message': 'Consultation deleted successfully'}), 200

    except Exception as e:
        logger.error(f"❌ Error deleting consultation: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to delete consultation'}), 500


@consultation_bp.route('/admin/bulk-delete', methods=['POST'])
@jwt_required()
def admin_bulk_delete():
    """Admin: Bulk delete consultations by status"""
    try:
        if not is_admin():
            return jsonify({'error': 'Admin access required'}), 403

        data   = request.json
        status = data.get('status')

        if status not in ['completed', 'cancelled', 'rejected']:
            return jsonify({'error': 'Can only bulk-delete completed, cancelled, or rejected consultations'}), 400

        consultations = Consultation.query.filter_by(status=status).all()
        count = len(consultations)

        for c in consultations:
            db.session.delete(c)

        db.session.commit()

        logger.info(f"✅ Bulk deleted {count} {status} consultations")
        return jsonify({'message': f'Deleted {count} {status} consultations', 'count': count}), 200

    except Exception as e:
        logger.error(f"❌ Error bulk deleting consultations: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to delete consultations'}), 500


# Legacy route kept for backwards-compat (redirects to admin/list behaviour)
@consultation_bp.route('/', methods=['GET'])
@jwt_required()
def list_consultations_legacy():
    """Legacy: returns all consultations (admin) or own (user)"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if user and user.role == 'admin':
            consultations = Consultation.query.order_by(Consultation.created_at.desc()).all()
            return jsonify([c.to_dict(include_user=True) for c in consultations]), 200
        else:
            consultations = Consultation.query.filter_by(user_id=user_id)\
                .order_by(Consultation.created_at.desc()).all()
            return jsonify([c.to_dict() for c in consultations]), 200

    except Exception as e:
        logger.error(f"❌ Error in legacy list: {str(e)}")
        return jsonify({'error': 'Failed to fetch consultations'}), 500


@consultation_bp.route('/test', methods=['GET'])
def test():
    """Health-check / route listing"""
    return jsonify({
        'message': 'Consultation routes are working',
        'endpoints': [
            'POST   /              – Create consultation (notifies admin + client)',
            'GET    /my-consultations – Get user consultations',
            'GET    /<id>           – Get single consultation',
            'PUT    /<id>/cancel    – User cancels',
            'DELETE /<id>           – User deletes (cancelled/completed/rejected)',
            'GET    /admin/list     – Admin list (filterable)',
            'GET    /admin/<id>     – Admin detail',
            'PUT    /admin/<id>/status           – Update status',
            'POST   /admin/<id>/confirm-with-email – Confirm + send custom email',
            'POST   /admin/<id>/reject           – Reject + notify client',
            'GET    /admin/stats    – Stats',
            'DELETE /admin/<id>     – Admin delete',
            'POST   /admin/bulk-delete – Bulk delete by status',
        ]
    }), 200