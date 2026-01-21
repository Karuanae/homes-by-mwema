from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User
from werkzeug.exceptions import BadRequest

user_bp = Blueprint('user', __name__)

@user_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)
    
    return jsonify({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'role': user.role,
        'created_at': user.created_at.isoformat()
    }), 200

@user_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    
    # Update allowed fields
    allowed_fields = ['username', 'email']
    for field in allowed_fields:
        if field in data:
            # Check if username/email is already taken by another user
            if field == 'username':
                existing = User.query.filter_by(username=data[field]).first()
                if existing and existing.id != user_id:
                    return jsonify({'message': 'Username already taken'}), 400
            elif field == 'email':
                existing = User.query.filter_by(email=data[field]).first()
                if existing and existing.id != user_id:
                    return jsonify({'message': 'Email already registered'}), 400
            
            setattr(user, field, data[field])
    
    db.session.commit()
    return jsonify({'message': 'Profile updated successfully'}), 200

@user_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    
    if not data or not data.get('current_password') or not data.get('new_password'):
        raise BadRequest('Current password and new password are required')
    
    if not user.check_password(data['current_password']):
        return jsonify({'message': 'Current password is incorrect'}), 400
    
    user.set_password(data['new_password'])
    db.session.commit()
    
    return jsonify({'message': 'Password changed successfully'}), 200
