from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

bp = Blueprint('main', __name__)

@bp.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'message': 'API is running'}), 200

@bp.route('/homepage', methods=['GET'])
def get_homepage():
    from models import HomepageContent
    content = HomepageContent.query.first()
    if content:
        return jsonify({
            'hero_images': content.hero_images or [],
            'featured_properties': content.featured_properties or [],
            'premium_badges': content.premium_badges or [],
            'testimonials': content.testimonials or [],
            'faqs': content.faqs or []
        }), 200
    else:
        # Return default empty structure
        return jsonify({
            'hero_images': [],
            'featured_properties': [],
            'premium_badges': [],
            'testimonials': [],
            'faqs': []
        }), 200

@bp.route('/contact', methods=['POST'])
def contact():
    data = request.get_json()
    
    if not data or not data.get('name') or not data.get('email') or not data.get('message'):
        return jsonify({'message': 'Name, email, and message are required'}), 400
    
    # In a real app, send email or save to database
    # For now, just return success
    return jsonify({'message': 'Message sent successfully'}), 200


@bp.route('/consultations', methods=['POST'])
@jwt_required()
def create_consultation():
    """Receive a consultation appointment request.
    Expects JSON with:
      - date (ISO string, required)
      - hour (0-23, optional)
      - minute (0-59, optional)
      - notes (string, optional)
      - name, email, user_id (optional for tracking)
    """
    data = request.get_json() or {}
    date = data.get('date')
    if not date:
        return jsonify({'error': 'Date is required'}), 400

    user_id = get_jwt_identity()

    # persist consultation and create chat
    from models import Consultation, Chat, db
    from datetime import datetime
    try:
        dt = datetime.fromisoformat(date)
    except Exception:
        return jsonify({'error': 'Invalid date format'}), 400

    consult = Consultation(
        user_id=user_id,
        date=dt,
        hour=data.get('hour'),
        minute=data.get('minute'),
        notes=data.get('notes'),
        status='pending'
    )
    db.session.add(consult)
    db.session.flush()

    chat = Chat(
        user_id=user_id,
        consultation_id=consult.id,
        chat_type='consultation',
        status='active',
        last_active=datetime.utcnow()
    )
    db.session.add(chat)
    db.session.commit()

    return jsonify({
        'message': 'Consultation request received',
        'consultation': {
            'id': consult.id,
            'date': consult.date.isoformat(),
            'hour': consult.hour,
            'minute': consult.minute,
            'notes': consult.notes,
            'status': consult.status,
        },
        'chat': {
            'id': chat.id,
            'user_id': chat.user_id,
            'chat_type': chat.chat_type,
            'status': chat.status,
        }
    }), 201

@bp.route('/consultations', methods=['GET'])
@jwt_required()
def list_consultations():
    """Return all consultation requests (admin only)."""
    from models import Consultation, User
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user or user.role != 'admin':
        return jsonify({'error': 'Forbidden'}), 403
    consults = Consultation.query.order_by(Consultation.created_at.desc()).all()
    return jsonify([
        {
            'id': c.id,
            'user_id': c.user_id,
            'date': c.date.isoformat(),
            'hour': c.hour,
            'minute': c.minute,
            'notes': c.notes,
            'status': c.status,
            'created_at': c.created_at.isoformat() if c.created_at else None,
        } for c in consults
    ]), 200


@bp.route('/featured-properties', methods=['GET'])
def get_featured_properties():
    # In a real app, query for featured properties
    # For now, return empty list
    return jsonify([]), 200
