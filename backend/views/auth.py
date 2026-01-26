from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models import db, User
from werkzeug.exceptions import BadRequest
from datetime import timedelta
import re
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

auth_bp = Blueprint('auth', __name__)

def validate_email(email):
    """Simple email validation"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    """Password validation"""
    if len(password) < 6:
        return False, 'Password must be at least 6 characters'
    return True, ''

@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Register a new user
    Expected JSON: {
        "name": "John Doe",
        "email": "john@example.com",
        "password": "password123",
        "phone": "0712345678" (optional)
    }
    """
    try:
        data = request.get_json()
        logger.info(f"Registration attempt for email: {data.get('email')}")
        
        # Check if data is provided
        if not data:
            logger.error("No JSON data provided")
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate required fields
        required_fields = ['name', 'email', 'password']
        missing_fields = []
        for field in required_fields:
            if field not in data or not data.get(field):
                missing_fields.append(field)
        
        if missing_fields:
            logger.error(f"Missing required fields: {missing_fields}")
            return jsonify({'error': f'Missing required fields: {", ".join(missing_fields)}'}), 400
        
        # Extract and sanitize fields
        name = data['name'].strip()
        email = data['email'].strip().lower()
        password = data['password']
        phone = data.get('phone', '').strip()
        
        # Validate email format
        if not validate_email(email):
            logger.error(f"Invalid email format: {email}")
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Validate password
        is_valid_password, password_error = validate_password(password)
        if not is_valid_password:
            logger.error(f"Invalid password: {password_error}")
            return jsonify({'error': password_error}), 400
        
        # Check if user already exists
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            logger.warning(f"User already exists: {email}")
            return jsonify({'error': 'User already exists'}), 409
        
        # Create new user
        new_user = User(
            name=name,
            email=email,
            phone=phone,
            role='user'
        )
        new_user.set_password(password)
        
        db.session.add(new_user)
        db.session.commit()
        
        logger.info(f"User created successfully: {email}")
        
        # Create access token (expires in 7 days)
        access_token = create_access_token(
            identity=new_user.id,
            expires_delta=timedelta(days=7)
        )
        
        # Prepare user data for response
        user_data = {
            'id': new_user.id,
            'name': new_user.name,
            'email': new_user.email,
            'phone': new_user.phone,
            'role': new_user.role,
            'avatar_url': new_user.avatar_url,
            'created_at': new_user.created_at.isoformat() if new_user.created_at else None
        }
        
        return jsonify({
            'message': 'Registration successful',
            'user': user_data,
            'token': access_token
        }), 201
        
    except BadRequest as e:
        logger.error(f"Bad request: {str(e)}")
        return jsonify({'error': 'Invalid request format'}), 400
        
    except Exception as e:
        logger.error(f"Unexpected error during registration: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Login user
    Expected JSON: {
        "email": "john@example.com",
        "password": "password123"
    }
    """
    try:
        data = request.get_json()
        logger.info(f"Login attempt for email: {data.get('email')}")
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate required fields
        if 'email' not in data or not data.get('email'):
            return jsonify({'error': 'Email is required'}), 400
        
        if 'password' not in data or not data.get('password'):
            return jsonify({'error': 'Password is required'}), 400
        
        email = data['email'].strip().lower()
        password = data['password']
        
        # Find user
        user = User.query.filter_by(email=email).first()
        
        # Check if user exists and password is correct
        if not user or not user.check_password(password):
            logger.warning(f"Invalid login attempt for email: {email}")
            return jsonify({'error': 'Invalid credentials'}), 401
        
        logger.info(f"Login successful for user: {email}")
        
        # Create access token
        access_token = create_access_token(
            identity=user.id,
            expires_delta=timedelta(days=7)
        )
        
        # Prepare user data
        user_data = {
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'phone': user.phone,
            'role': user.role,
            'avatar_url': user.avatar_url,
            'created_at': user.created_at.isoformat() if user.created_at else None
        }
        
        return jsonify({
            'message': 'Login successful',
            'user': user_data,
            'token': access_token
        })
        
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """
    Logout user (invalidate token on frontend)
    """
    try:
        user_id = get_jwt_identity()
        logger.info(f"Logout request for user ID: {user_id}")
        
        # In a real app, you might want to add the token to a blacklist
        # For now, we'll just return success
        
        return jsonify({'message': 'Logout successful'}), 200
        
    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """
    Refresh access token
    """
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Create new access token
        new_access_token = create_access_token(identity=user_id)
        
        return jsonify({
            'message': 'Token refreshed',
            'token': new_access_token
        })
        
    except Exception as e:
        logger.error(f"Token refresh error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """
    Get current user profile
    """
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        user_data = {
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'phone': user.phone,
            'role': user.role,
            'avatar_url': user.avatar_url,
            'created_at': user.created_at.isoformat() if user.created_at else None
        }
        
        return jsonify({'user': user_data}), 200
        
    except Exception as e:
        logger.error(f"Get current user error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500