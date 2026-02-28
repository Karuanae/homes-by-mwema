from flask import Blueprint, request, jsonify
from models import db
from datetime import datetime

consultation_bp = Blueprint('consultation', __name__)

class Consultation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(40))
    preferred_date = db.Column(db.String(40), nullable=False)
    time_of_day = db.Column(db.String(40), nullable=False)
    topic = db.Column(db.Text, nullable=False)
    exact_time = db.Column(db.String(40))
    zoom_link = db.Column(db.String(255))
    admin_note = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# POST /api/consultation - create consultation request
@consultation_bp.route('/', methods=['POST'])
def create_consultation():
    data = request.json
    c = Consultation(
        name=data.get('name'),
        email=data.get('email'),
        phone=data.get('phone'),
        preferred_date=data.get('preferredDate'),
        time_of_day=data.get('timeOfDay'),
        topic=data.get('topic')
    )
    db.session.add(c)
    db.session.commit()
    return jsonify({'message': 'Consultation request created'}), 201

# GET /api/consultation - admin: list all consultations
@consultation_bp.route('/', methods=['GET'])
def get_consultations():
    consultations = Consultation.query.order_by(Consultation.created_at.desc()).all()
    return jsonify([
        {
            'id': c.id,
            'name': c.name,
            'email': c.email,
            'phone': c.phone,
            'preferredDate': c.preferred_date,
            'timeOfDay': c.time_of_day,
            'topic': c.topic,
            'exactTime': c.exact_time,
            'zoomLink': c.zoom_link,
            'adminNote': c.admin_note,
            'createdAt': c.created_at.isoformat()
        } for c in consultations
    ])

# PUT /api/consultation/<id> - admin: update meeting details
@consultation_bp.route('/<int:consultation_id>', methods=['PUT'])
def update_consultation(consultation_id):
    c = Consultation.query.get_or_404(consultation_id)
    data = request.json
    c.exact_time = data.get('exactTime', c.exact_time)
    c.zoom_link = data.get('zoomLink', c.zoom_link)
    c.admin_note = data.get('adminNote', c.admin_note)
    db.session.commit()
    return jsonify({'message': 'Consultation updated'})
