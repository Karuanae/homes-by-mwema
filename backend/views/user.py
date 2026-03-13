from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User
from werkzeug.exceptions import BadRequest
from datetime import datetime
import re
import logging

logger = logging.getLogger(__name__)
user_bp = Blueprint('user', __name__)

def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_phone(phone):
    """Basic phone validation"""
    if not phone:
        return True, ''
    # Remove any non-digit characters
    cleaned = ''.join(filter(str.isdigit, str(phone)))
    if len(cleaned) < 9 or len(cleaned) > 13:
        return False, 'Phone number must be between 9 and 13 digits'
    return True, ''

def validate_password(password):
    """Password validation"""
    if len(password) < 6:
        return False, 'Password must be at least 6 characters'
    return True, ''

@user_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get current user profile"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get_or_404(user_id)
        
        return jsonify({
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'phone': user.phone,
            'role': user.role,
            'avatar_url': user.avatar_url,
            'created_at': user.created_at.isoformat() if user.created_at else None,
            'updated_at': user.updated_at.isoformat() if user.updated_at else None
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching profile: {str(e)}")
        return jsonify({'error': 'Failed to fetch profile'}), 500

@user_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update user profile information"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get_or_404(user_id)
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Update name if provided
        if 'name' in data and data['name']:
            user.name = data['name'].strip()
        
        # Update email if provided
        if 'email' in data and data['email']:
            email = data['email'].strip().lower()
            
            # Validate email format
            if not validate_email(email):
                return jsonify({'error': 'Invalid email format'}), 400
            
            # Check if email is already taken by another user
            existing = User.query.filter_by(email=email).first()
            if existing and existing.id != user_id:
                return jsonify({'error': 'Email already registered'}), 400
            
            user.email = email
        
        # Update phone if provided
        if 'phone' in data:
            phone = data['phone'].strip() if data['phone'] else None
            is_valid, error_msg = validate_phone(phone)
            if not is_valid:
                return jsonify({'error': error_msg}), 400
            user.phone = phone
        
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        logger.info(f"Profile updated for user: {user.email}")
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': {
                'id': user.id,
                'name': user.name,
                'email': user.email,
                'phone': user.phone,
                'role': user.role,
                'avatar_url': user.avatar_url,
                'created_at': user.created_at.isoformat() if user.created_at else None,
                'updated_at': user.updated_at.isoformat() if user.updated_at else None
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error updating profile: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to update profile'}), 500

@user_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Change user password (while logged in)"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get_or_404(user_id)
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        if not data.get('current_password'):
            return jsonify({'error': 'Current password is required'}), 400
        
        if not data.get('new_password'):
            return jsonify({'error': 'New password is required'}), 400
        
        current_password = data['current_password']
        new_password = data['new_password']
        
        # Verify current password
        if not user.check_password(current_password):
            logger.warning(f"Failed password change attempt for user: {user.email} - incorrect current password")
            return jsonify({'error': 'Current password is incorrect'}), 401
        
        # Validate new password
        is_valid, error_msg = validate_password(new_password)
        if not is_valid:
            return jsonify({'error': error_msg}), 400
        
        # Update password
        user.set_password(new_password)
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        logger.info(f"Password changed successfully for user: {user.email}")
        
        return jsonify({'message': 'Password changed successfully'}), 200
        
    except Exception as e:
        logger.error(f"Error changing password: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to change password'}), 500

@user_bp.route('/delete-account', methods=['DELETE'])
@jwt_required()
def delete_account():
    """Delete user account (with password confirmation)"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get_or_404(user_id)
        data = request.get_json()
        
        if not data or not data.get('password'):
            return jsonify({'error': 'Password confirmation is required'}), 400
        
        password = data['password']
        
        # Verify password
        if not user.check_password(password):
            logger.warning(f"Failed account deletion attempt for user: {user.email} - incorrect password")
            return jsonify({'error': 'Password is incorrect'}), 401
        
        # Store email for logging
        user_email = user.email
        
        # Delete the user (cascade will handle related records)
        db.session.delete(user)
        db.session.commit()
        
        logger.info(f"Account deleted for user: {user_email}")
        
        return jsonify({'message': 'Account deleted successfully'}), 200
        
    except Exception as e:
        logger.error(f"Error deleting account: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to delete account'}), 500

@user_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_user_stats():
    """Get user statistics (bookings count, total spent, etc.)"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get_or_404(user_id)
        
        # Import here to avoid circular imports
        from models import Booking, Payment
        
        # Get user's bookings
        bookings = Booking.query.filter_by(user_id=user_id).all()
        total_bookings = len(bookings)
        
        # Get completed bookings
        completed_bookings = sum(1 for b in bookings if b.status == 'completed')
        
        # Get upcoming bookings (check-in in future)
        from datetime import datetime
        now = datetime.now().date()
        upcoming_bookings = sum(1 for b in bookings if b.check_in > now)
        
        # Get total spent
        total_spent = db.session.query(db.func.sum(Payment.amount)).filter(
            Payment.user_id == user_id,
            Payment.status == 'completed'
        ).scalar() or 0
        
        return jsonify({
            'total_bookings': total_bookings,
            'completed_bookings': completed_bookings,
            'upcoming_bookings': upcoming_bookings,
            'total_spent': float(total_spent)
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching user stats: {str(e)}")
        return jsonify({'error': 'Failed to fetch statistics'}), 500