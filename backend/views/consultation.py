# views/consultation.py
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, Consultation
from datetime import datetime
import logging
import traceback

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

# ==================== CLIENT ENDPOINTS ====================

@consultation_bp.route('/', methods=['POST'])
@jwt_required(optional=True)
def create_consultation():
    """
    Create a new consultation request
    Expected JSON:
    {
        "date": "2024-03-20T10:00:00Z",
        "hour": 10,
        "minute": 0,
        "notes": "Optional notes",
        "topic": "Property Investment",
        "name": "Optional name override",
        "email": "Optional email override",
        "phone": "Optional phone override"
    }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        # Get current user if authenticated
        current_user = get_user_from_token()
        user_id = current_user.id if current_user else None

        # Validate required fields
        required_fields = ['date', 'hour', 'minute']
        missing = [f for f in required_fields if f not in data]
        if missing:
            return jsonify({'error': f'Missing fields: {", ".join(missing)}'}), 400

        # Parse date
        try:
            if isinstance(data['date'], str):
                consultation_date = datetime.fromisoformat(data['date'].replace('Z', '+00:00'))
            else:
                consultation_date = datetime.fromisoformat(data['date'])
        except Exception as e:
            logger.error(f"Date parsing error: {str(e)}")
            return jsonify({'error': 'Invalid date format. Use ISO format (e.g., 2024-03-20T10:00:00Z)'}), 400

        # Ensure hour and minute are integers
        hour = int(data.get('hour', 0))
        minute = int(data.get('minute', 0))

        # Validate hour and minute
        if hour < 0 or hour > 23:
            return jsonify({'error': 'Hour must be between 0 and 23'}), 400
        if minute not in [0, 15, 30, 45]:
            return jsonify({'error': 'Minute must be 0, 15, 30, or 45'}), 400

        # Create consultation
        consultation = Consultation(
            user_id=user_id,
            name=data.get('name') or (current_user.name if current_user else None),
            email=data.get('email') or (current_user.email if current_user else None),
            phone=data.get('phone') or (current_user.phone if current_user else None),
            date=consultation_date,
            hour=hour,
            minute=minute,
            notes=data.get('notes', ''),
            topic=data.get('topic', 'General Inquiry'),
            status='pending'
        )

        db.session.add(consultation)
        db.session.commit()

        logger.info(f"✅ Consultation created: ID {consultation.id} for user {consultation.user_id or 'guest'}")

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

        # Check ownership or admin
        if consultation.user_id != user_id and not is_admin():
            return jsonify({'error': 'Unauthorized'}), 403

        return jsonify(consultation.to_dict(detailed=is_admin())), 200

    except Exception as e:
        logger.error(f"❌ Error fetching consultation: {str(e)}")
        return jsonify({'error': 'Failed to fetch consultation'}), 500


@consultation_bp.route('/<int:consultation_id>/cancel', methods=['PUT'])
@jwt_required()
def cancel_consultation(consultation_id):
    """User cancels their consultation"""
    try:
        user_id = get_jwt_identity()
        consultation = Consultation.query.get_or_404(consultation_id)

        # Check ownership
        if consultation.user_id != user_id:
            return jsonify({'error': 'Unauthorized'}), 403

        # Can only cancel pending or confirmed consultations
        if consultation.status not in ['pending', 'confirmed']:
            return jsonify({'error': f'Cannot cancel consultation with status: {consultation.status}'}), 400

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
            consultation.admin_notes = data.get('admin_notes', consultation.admin_notes)
        elif new_status == 'completed':
            consultation.completed_at = now
        elif new_status == 'cancelled':
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


@consultation_bp.route('/admin/<int:consultation_id>/confirm-with-email', methods=['POST'])
@jwt_required()
def admin_confirm_with_email(consultation_id):
    """Admin: Confirm consultation and send email"""
    try:
        if not is_admin():
            return jsonify({'error': 'Admin access required'}), 403

        data = request.json
        consultation = Consultation.query.get_or_404(consultation_id)
        
        # Get recipient email
        recipient_email = consultation.email or (consultation.user.email if consultation.user else None)
        if not recipient_email:
            return jsonify({'error': 'No email address found for this consultation'}), 400

        # Update consultation
        consultation.status = 'confirmed'
        consultation.confirmed_at = datetime.utcnow()
        consultation.meeting_link = data.get('meeting_link')
        consultation.admin_notes = data.get('admin_notes', consultation.admin_notes)
        
        # Send email using our service
        from views.email_service import email_service
        
        # Set mail instance from app
        email_service.mail = current_app.mail
        
        # Generate email content
        consultation_dict = consultation.to_dict(detailed=True)
        email_data = email_service.generate_confirmation_email(
            consultation_dict, 
            data.get('meeting_link')
        )
        
        # Send email
        result = email_service.send_email(
            to_email=recipient_email,
            subject=email_data['subject'],
            html_content=email_data['html'],
            text_content=email_data['text']
        )
        
        if result.get('success'):
            consultation.email_sent = True
            consultation.email_sent_at = datetime.utcnow()
            consultation.email_content = email_data['html']
            logger.info(f"✅ Email sent to {recipient_email} for consultation {consultation_id}")
        else:
            logger.warning(f"⚠️ Failed to send email to {recipient_email}: {result.get('error')}")
        
        db.session.commit()

        return jsonify({
            'message': 'Consultation confirmed' + (' and email sent' if result.get('success') else ' (email failed)'),
            'consultation': consultation.to_dict(detailed=True),
            'email_status': 'sent' if result.get('success') else 'failed'
        }), 200

    except Exception as e:
        logger.error(f"❌ Error confirming consultation: {str(e)}")
        logger.error(traceback.format_exc())
        db.session.rollback()
        return jsonify({'error': 'Failed to confirm consultation'}), 500


@consultation_bp.route('/admin/stats', methods=['GET'])
@jwt_required()
def admin_get_stats():
    """Admin: Get consultation statistics"""
    try:
        if not is_admin():
            return jsonify({'error': 'Admin access required'}), 403

        total = Consultation.query.count()
        pending = Consultation.query.filter_by(status='pending').count()
        confirmed = Consultation.query.filter_by(status='confirmed').count()
        completed = Consultation.query.filter_by(status='completed').count()
        cancelled = Consultation.query.filter_by(status='cancelled').count()
        rejected = Consultation.query.filter_by(status='rejected').count()

        recent = Consultation.query.order_by(Consultation.created_at.desc()).limit(5).all()

        return jsonify({
            'stats': {
                'total': total,
                'pending': pending,
                'confirmed': confirmed,
                'completed': completed,
                'cancelled': cancelled,
                'rejected': rejected
            },
            'recent': [c.to_dict() for c in recent]
        }), 200

    except Exception as e:
        logger.error(f"❌ Error fetching consultation stats: {str(e)}")
        return jsonify({'error': 'Failed to fetch statistics'}), 500


@consultation_bp.route('/admin/<int:consultation_id>', methods=['DELETE'])
@jwt_required()
def admin_delete_consultation(consultation_id):
    """Admin: Delete a consultation (for clearing completed/cancelled)"""
    try:
        if not is_admin():
            return jsonify({'error': 'Admin access required'}), 403

        consultation = Consultation.query.get_or_404(consultation_id)

        if consultation.status not in ['completed', 'cancelled', 'rejected']:
            return jsonify({'error': 'Can only delete completed, cancelled, or rejected consultations'}), 400

        db.session.delete(consultation)
        db.session.commit()

        logger.info(f"✅ Consultation {consultation_id} deleted")

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

        data = request.json
        status = data.get('status')

        if status not in ['completed', 'cancelled', 'rejected']:
            return jsonify({'error': 'Can only bulk delete completed, cancelled, or rejected consultations'}), 400

        consultations = Consultation.query.filter_by(status=status).all()
        count = len(consultations)

        for c in consultations:
            db.session.delete(c)

        db.session.commit()

        logger.info(f"✅ Bulk deleted {count} {status} consultations")

        return jsonify({
            'message': f'Deleted {count} {status} consultations',
            'count': count
        }), 200

    except Exception as e:
        logger.error(f"❌ Error bulk deleting consultations: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to delete consultations'}), 500


@consultation_bp.route('/test', methods=['GET'])
def test():
    """Test endpoint to verify consultation routes are working"""
    return jsonify({
        'message': 'Consultation routes are working',
        'endpoints': [
            'POST / - Create consultation',
            'GET /my-consultations - Get user consultations',
            'GET /<id> - Get consultation',
            'PUT /<id>/cancel - Cancel consultation',
            'GET /admin/list - Admin list',
            'GET /admin/<id> - Admin get',
            'PUT /admin/<id>/status - Update status',
            'POST /admin/<id>/confirm-with-email - Confirm with email',
            'GET /admin/stats - Get stats',
            'DELETE /admin/<id> - Delete',
            'POST /admin/bulk-delete - Bulk delete'
        ]
    }), 200