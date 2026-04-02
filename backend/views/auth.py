from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models import db, User, PasswordResetToken, Property
from werkzeug.exceptions import BadRequest
from datetime import datetime, timedelta
import re
import logging
import secrets
import os
from views.email_service import email_service

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
            role='user',
            email_verified=False
        )
        new_user.set_password(password)
        new_user.generate_verification_token()
        
        db.session.add(new_user)
        db.session.commit()
        
        logger.info(f"User created successfully: {email}")
        
        # Send email verification instead of welcome email
        try:
            email_service.send_email_verification(new_user)
            logger.info(f"Verification email sent to: {email}")
        except Exception as e:
            logger.error(f"Failed to send verification email to {email}: {str(e)}")
            # Don't fail registration if email fails, but user won't be able to verify
        
        return jsonify({
            'message': 'Registration successful! Please check your email to verify your account.',
            'user': {
                'id': new_user.id,
                'name': new_user.name,
                'email': new_user.email,
                'phone': new_user.phone,
                'role': new_user.role,
                'email_verified': new_user.email_verified
            }
        }), 201
        
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
        
        # Check if email is verified
        if not user.email_verified:
            logger.warning(f"Unverified email login attempt for: {email}")
            return jsonify({
                'error': 'Please verify your email before logging in. Check your inbox for the verification link.',
                'needs_verification': True
            }), 403
        
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

        # Send welcome-back email with popular properties
        try:
            popular = (
                Property.query
                .filter_by(status='active')
                .order_by(Property.bookings_count.desc())
                .limit(3)
                .all()
            )
            props = [
                {'id': p.id, 'name': p.name, 'location': p.location, 'price': p.price}
                for p in popular
            ]
            email_service.send_welcome_back(user, popular_properties=props)
        except Exception as mail_err:
            logger.warning(f"Welcome-back email failed for {email}: {mail_err}")

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

@auth_bp.route('/verify-email', methods=['POST'])
def verify_email():
    """
    Verify user email with token
    Expected JSON: {
        "token": "verification_token_here"
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'token' not in data:
            return jsonify({'error': 'Verification token is required'}), 400
        
        token = data['token'].strip()
        
        # Find user with this token
        user = User.query.filter_by(email_verification_token=token).first()
        
        if not user:
            return jsonify({'error': 'Invalid or expired verification token'}), 400
        
        # Verify the email
        if user.verify_email(token):
            db.session.commit()
            logger.info(f"Email verified for user: {user.email}")
            
            # Send welcome email now that email is verified
            try:
                email_service.send_welcome_email(user)
                logger.info(f"Welcome email sent to verified user: {user.email}")
            except Exception as e:
                logger.error(f"Failed to send welcome email to {user.email}: {str(e)}")
            
            return jsonify({
                'message': 'Email verified successfully! You can now log in.',
                'user': {
                    'id': user.id,
                    'name': user.name,
                    'email': user.email,
                    'email_verified': user.email_verified
                }
            }), 200
        else:
            return jsonify({'error': 'Invalid or expired verification token'}), 400
            
    except Exception as e:
        logger.error(f"Email verification error: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500

@auth_bp.route('/resend-verification', methods=['POST'])
def resend_verification():
    """
    Resend email verification
    Expected JSON: {
        "email": "user@example.com"
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'email' not in data:
            return jsonify({'error': 'Email is required'}), 400
        
        email = data['email'].strip().lower()
        
        # Find user
        user = User.query.filter_by(email=email).first()
        
        if not user:
            # Don't reveal if email exists or not for security
            return jsonify({'message': 'If the email exists, a verification link has been sent.'}), 200
        
        if user.email_verified:
            return jsonify({'message': 'Email is already verified.'}), 200
        
        # Generate new verification token
        user.generate_verification_token()
        db.session.commit()
        
        # Send verification email
        try:
            email_service.send_email_verification(user)
            logger.info(f"Verification email resent to: {email}")
        except Exception as e:
            logger.error(f"Failed to resend verification email to {email}: {str(e)}")
            return jsonify({'error': 'Failed to send verification email'}), 500
        
        return jsonify({'message': 'Verification email sent successfully.'}), 200
        
    except Exception as e:
        logger.error(f"Resend verification error: {str(e)}")
        db.session.rollback()
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

# ==================== FORGOT PASSWORD ENDPOINTS ====================

def send_password_reset_email(user, token):
    """Send password reset email using Resend"""
    try:
        import resend
        resend.api_key = os.environ.get('RESEND_API_KEY')
        
        reset_link = f"https://homesbymwema.com/reset-password?token={token}"
        
        html_body = f"""
        <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; background: #f9f8f6; padding: 24px;">
          <div style="background: #093A3E; color: white; padding: 24px;">
            <p style="color: #ED9B40; font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em; margin: 0 0 8px;">Homes by Mwema</p>
            <h1 style="font-size: 20px; margin: 0; font-weight: normal;">Password Reset Request</h1>
          </div>
          <div style="background: white; border: 1px solid #ebe5de; padding: 24px;">
            <p style="color: #555; font-size: 14px; line-height: 1.6;">Dear {user.name or 'Valued Client'},</p>
            <p style="color: #555; font-size: 14px; line-height: 1.6;">
              We received a request to reset your password for your Homes by Mwema account.
            </p>
            <div style="text-align: center; margin: 24px 0;">
              <a href="{reset_link}" 
                 style="background: #093A3E; color: white; padding: 12px 28px; text-decoration: none; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p style="color: #555; font-size: 13px; line-height: 1.6;">
              This link will expire in <strong>1 hour</strong>. If you didn't request this, please ignore this email.
            </p>
            <p style="color: #888; font-size: 13px; margin-top: 24px; padding-top: 16px; border-top: 1px solid #eee;">
              Warm regards,<br/>
              <strong style="color: #1C1917;">The Homes by Mwema Team</strong>
            </p>
          </div>
          <p style="color: #aaa; font-size: 11px; text-align: center; margin-top: 16px;">
            <a href="https://homesbymwema.com" style="color: #aaa;">homesbymwema.com</a>
          </p>
        </div>
        """
        
        params = {
            "from": "Homes by Mwema <noreply@homesbymwema.com>",
            "to": [user.email],
            "subject": "Reset Your Homes by Mwema Password",
            "html": html_body,
        }
        
        email = resend.Emails.send(params)
        logger.info(f"✅ Password reset email sent to {user.email}")
        
    except Exception as e:
        logger.error(f"❌ Failed to send password reset email: {e}")
        raise


@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Request a password reset email"""
    try:
        data = request.get_json()
        email = data.get('email') if data else None
        
        if not email:
            return jsonify({'error': 'Email is required'}), 400
        
        # Find user
        user = User.query.filter_by(email=email.lower().strip()).first()
        
        # Always return success even if email not found (security best practice)
        if not user:
            logger.info(f"Password reset requested for non-existent email: {email}")
            return jsonify({
                'message': 'If your email is registered, you will receive a password reset link.'
            }), 200
        
        # Invalidate any existing unused tokens
        PasswordResetToken.query.filter_by(
            user_id=user.id, 
            used=False
        ).update({'used': True})
        
        # Generate secure token
        token = secrets.token_urlsafe(32)
        
        # Create new token (expires in 1 hour)
        reset_token = PasswordResetToken(
            user_id=user.id,
            token=token,
            expires_at=datetime.utcnow() + timedelta(hours=1),
            used=False
        )
        
        db.session.add(reset_token)
        db.session.commit()
        
        # Send email with reset link
        try:
            send_password_reset_email(user, token)
        except Exception as e:
            logger.error(f"Failed to send password reset email: {e}")
            # Still return success to prevent email enumeration
            pass
        
        logger.info(f"Password reset token generated for user: {user.email}")
        
        return jsonify({
            'message': 'If your email is registered, you will receive a password reset link.'
        }), 200
        
    except Exception as e:
        logger.error(f"Forgot password error: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to process request'}), 500


@auth_bp.route('/verify-reset-token/<token>', methods=['GET'])
def verify_reset_token(token):
    """Verify if a reset token is valid"""
    try:
        reset_token = PasswordResetToken.query.filter_by(token=token).first()
        
        if not reset_token or not reset_token.is_valid():
            return jsonify({'valid': False, 'error': 'Invalid or expired token'}), 400
        
        return jsonify({
            'valid': True,
            'email': reset_token.user.email
        }), 200
        
    except Exception as e:
        logger.error(f"Verify token error: {str(e)}")
        return jsonify({'error': 'Failed to verify token'}), 500


@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """Reset password using token"""
    try:
        data = request.get_json()
        token = data.get('token')
        new_password = data.get('password')
        
        if not token or not new_password:
            return jsonify({'error': 'Token and password are required'}), 400
        
        # Validate password strength
        if len(new_password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters'}), 400
        
        # Find token
        reset_token = PasswordResetToken.query.filter_by(token=token).first()
        
        if not reset_token or not reset_token.is_valid():
            return jsonify({'error': 'Invalid or expired token'}), 400
        
        # Update password
        user = reset_token.user
        user.set_password(new_password)
        
        # Mark token as used
        reset_token.used = True
        
        db.session.commit()
        
        logger.info(f"Password reset successful for user: {user.email}")
        
        return jsonify({
            'message': 'Password reset successful. You can now login with your new password.'
        }), 200
        
    except Exception as e:
        logger.error(f"Reset password error: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to reset password'}), 500