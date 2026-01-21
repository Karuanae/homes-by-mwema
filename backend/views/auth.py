from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from models import db, User
from werkzeug.exceptions import BadRequest

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    
    if not data or not data.get('email') or not data.get('password') or not data.get('name'):
        raise BadRequest('Name, email and password are required')
    
    # Check if user exists
    existing_user = User.query.filter_by(email=data['email']).first()
    if existing_user:
        return jsonify({'error': 'User already exists'}), 400
    
    # Create new user
    new_user = User(
        name=data['name'],
        email=data['email'],
        phone=data.get('phone', ''),
        role='user'
    )
    new_user.set_password(data['password'])
    
    db.session.add(new_user)
    db.session.commit()
    
    # Create access token
    access_token = create_access_token(identity=new_user.id)
    
    return jsonify({
        'user': {
            'id': new_user.id,
            'name': new_user.name,
            'email': new_user.email,
            'phone': new_user.phone,
            'role': new_user.role,
            'avatar_url': new_user.avatar_url,
            'created_at': new_user.created_at.isoformat() if new_user.created_at else None
        },
        'token': access_token
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    
    if not data or not data.get('email') or not data.get('password'):
        raise BadRequest('Email and password are required')
    
    # Find user
    user = User.query.filter_by(email=data['email']).first()
    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    # Create access token
    access_token = create_access_token(identity=user.id)
    
    return jsonify({
        'user': {
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'phone': user.phone,
            'role': user.role,
            'avatar_url': user.avatar_url,
            'created_at': user.created_at.isoformat() if user.created_at else None
        },
        'token': access_token
    })