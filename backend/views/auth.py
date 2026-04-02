from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models import db, User, PasswordResetToken, Property
from werkzeug.exceptions import BadRequest
from datetime import datetime, timedelta
from collections import defaultdict
import re
import logging
import secrets
import time
import os
from views.email_service import email_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

auth_bp = Blueprint('auth', __name__)


# ─── Helpers ──────────────────────────────────────────────────────────────────

def validate_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    if len(password) < 6:
        return False, 'Password must be at least 6 characters'
    return True, ''


# ─── Simple in-memory rate limiter ────────────────────────────────────────────
# Limits registration attempts per IP to 5 per hour.
# For multi-worker production deployments, replace with a Redis-backed solution.

_reg_attempts = defaultdict(list)
REG_LIMIT     = 5
REG_WINDOW    = 3600  # seconds

def _is_rate_limited():
    ip  = request.remote_addr or 'unknown'
    now = time.time()
    _reg_attempts[ip] = [t for t in _reg_attempts[ip] if now - t < REG_WINDOW]
    if len(_reg_attempts[ip]) >= REG_LIMIT:
        return True
    _reg_attempts[ip].append(now)
    return False


# ─── Register ─────────────────────────────────────────────────────────────────

@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Register a new user with email + password.

    The account is created with email_verified=False.
    A verification email is sent immediately.
    The user CANNOT log in until they click the link in that email.
    No token is returned here — login is only possible after verification.

    Expected JSON:
        { "name": "Jane", "email": "jane@example.com",
          "password": "secret123", "phone": "0712345678" }
    """
    try:
        if _is_rate_limited():
            logger.warning(f"Rate limit hit for registration from {request.remote_addr}")
            return jsonify({
                'error': 'Too many registration attempts. Please try again later.'
            }), 429

        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        # Required fields
        missing = [f for f in ['name', 'email', 'password'] if not data.get(f)]
        if missing:
            return jsonify({'error': f'Missing required fields: {", ".join(missing)}'}), 400

        name     = data['name'].strip()
        email    = data['email'].strip().lower()
        password = data['password']
        phone    = data.get('phone', '').strip()

        if not validate_email(email):
            return jsonify({'error': 'Invalid email format'}), 400

        is_valid, pwd_error = validate_password(password)
        if not is_valid:
            return jsonify({'error': pwd_error}), 400

        # Duplicate check — vague message so we don't confirm whether an email exists
        if User.query.filter_by(email=email).first():
            return jsonify({
                'error': 'An account with this email already exists. '
                         'Try logging in, or use "Forgot password" if you\'ve lost access.'
            }), 409

        # Create user (unverified, no token issued)
        new_user = User(
            name           = name,
            email          = email,
            phone          = phone,
            role           = 'user',
            email_verified = False,
        )
        new_user.set_password(password)
        new_user.generate_verification_token()  # sets token + 24h expiry

        db.session.add(new_user)
        db.session.commit()
        logger.info(f"User created (unverified): {email}")

        # Send verification email — roll back user if this fails so they can retry cleanly
        try:
            email_service.send_email_verification(new_user)
            logger.info(f"Verification email sent to: {email}")
        except Exception as e:
            logger.error(f"Failed to send verification email to {email}: {e}")
            db.session.delete(new_user)
            db.session.commit()
            return jsonify({
                'error': 'We could not send a verification email to that address. '
                         'Please double-check it and try again.'
            }), 500

        # Return success — deliberately NO token, NO auto-login
        return jsonify({
            'message': (
                f"Account created! We've sent a verification link to {email}. "
                "Please check your inbox (and spam folder) and click the link "
                "before logging in."
            ),
            'email_verification_required': True,
            'user': {
                'id':             new_user.id,
                'name':           new_user.name,
                'email':          new_user.email,
                'email_verified': False,
            },
        }), 201

    except Exception as e:
        logger.error(f"Unexpected registration error: {e}")
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500


# ─── Login ────────────────────────────────────────────────────────────────────

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Login with email + password.

    Unverified accounts → 403 with needs_verification flag.
    Google-only accounts → 403 with use_google flag.
    Wrong credentials   → 401 (same message for wrong email OR wrong password).

    Expected JSON: { "email": "jane@example.com", "password": "secret123" }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        if not data.get('email'):
            return jsonify({'error': 'Email is required'}), 400
        if not data.get('password'):
            return jsonify({'error': 'Password is required'}), 400

        email    = data['email'].strip().lower()
        password = data['password']

        user = User.query.filter_by(email=email).first()

        # Same error for wrong email and wrong password — prevents user enumeration
        if not user or not user.check_password(password):
            logger.warning(f"Failed login attempt for: {email}")
            return jsonify({'error': 'Invalid email or password'}), 401

        # Google-only accounts have no usable password
        if getattr(user, 'auth_provider', None) == 'google' or not user.password_hash:
            return jsonify({
                'error': 'This account was created with Google. Please sign in with Google.',
                'use_google': True,
            }), 403

        # Email must be verified before access is granted
        if not user.email_verified:
            logger.warning(f"Unverified login attempt: {email}")
            return jsonify({
                'error': (
                    'Your email address hasn\'t been verified yet. '
                    'Please check your inbox for the verification link, '
                    'or click below to receive a new one.'
                ),
                'needs_verification': True,
                'email': email,  # frontend uses this to pre-fill the resend form
            }), 403

        # All checks passed — issue JWT
        logger.info(f"Login successful: {email}")

        access_token = create_access_token(
            identity      = user.id,
            expires_delta = timedelta(days=7),
        )

        user_data = {
            'id':         user.id,
            'name':       user.name,
            'email':      user.email,
            'phone':      user.phone,
            'role':       user.role,
            'avatar_url': user.avatar_url,
            'created_at': user.created_at.isoformat() if user.created_at else None,
        }

        # Welcome-back email — best-effort, never blocks login
        try:
            popular = (
                Property.query
                .filter_by(status='active')
                .order_by(Property.bookings_count.desc())
                .limit(3)
                .all()
            )
            email_service.send_welcome_back(user, popular_properties=[
                {'id': p.id, 'name': p.name, 'location': p.location, 'price': p.price}
                for p in popular
            ])
        except Exception as mail_err:
            logger.warning(f"Welcome-back email failed for {email}: {mail_err}")

        return jsonify({
            'message': 'Login successful',
            'user':    user_data,
            'token':   access_token,
        })

    except Exception as e:
        logger.error(f"Login error: {e}")
        return jsonify({'error': 'Internal server error'}), 500


# ─── Logout ───────────────────────────────────────────────────────────────────

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    try:
        logger.info(f"Logout for user ID: {get_jwt_identity()}")
        return jsonify({'message': 'Logout successful'}), 200
    except Exception as e:
        logger.error(f"Logout error: {e}")
        return jsonify({'error': 'Internal server error'}), 500


# ─── Email verification ───────────────────────────────────────────────────────

@auth_bp.route('/verify-email', methods=['POST'])
def verify_email():
    """
    Verify email address using the token from the verification link.
    Expected JSON: { "token": "<token>" }
    """
    try:
        data = request.get_json()
        if not data or not data.get('token'):
            return jsonify({'error': 'Verification token is required'}), 400

        token = data['token'].strip()
        user  = User.query.filter_by(email_verification_token=token).first()

        if not user:
            return jsonify({'error': 'Invalid or expired verification link'}), 400

        if user.verify_email(token):  # checks token + expiry, sets email_verified=True
            db.session.commit()
            logger.info(f"Email verified: {user.email}")

            try:
                email_service.send_welcome_email(user)
            except Exception as e:
                logger.error(f"Welcome email failed for {user.email}: {e}")

            return jsonify({
                'message': 'Email verified successfully! You can now log in.',
                'user': {
                    'id':             user.id,
                    'name':           user.name,
                    'email':          user.email,
                    'email_verified': True,
                },
            }), 200
        else:
            return jsonify({
                'error': 'This verification link has expired. Please request a new one.'
            }), 400

    except Exception as e:
        logger.error(f"Email verification error: {e}")
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500


@auth_bp.route('/resend-verification', methods=['POST'])
def resend_verification():
    """
    Resend the email verification link.
    Expected JSON: { "email": "jane@example.com" }
    """
    try:
        data = request.get_json()
        if not data or not data.get('email'):
            return jsonify({'error': 'Email is required'}), 400

        email = data['email'].strip().lower()
        user  = User.query.filter_by(email=email).first()

        # Generic response — don't confirm whether the email is registered
        generic = {
            'message': 'If that email is registered and unverified, a new link has been sent.'
        }

        if not user or user.email_verified:
            return jsonify(generic), 200

        user.generate_verification_token()  # resets token + restarts 24h clock
        db.session.commit()

        try:
            email_service.send_email_verification(user)
            logger.info(f"Verification email resent to: {email}")
        except Exception as e:
            logger.error(f"Failed to resend verification email to {email}: {e}")
            return jsonify({'error': 'Failed to send email. Please try again later.'}), 500

        return jsonify(generic), 200

    except Exception as e:
        logger.error(f"Resend verification error: {e}")
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500


# ─── Token refresh ────────────────────────────────────────────────────────────

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    try:
        user_id = get_jwt_identity()
        if not User.query.get(user_id):
            return jsonify({'error': 'User not found'}), 404
        return jsonify({
            'message': 'Token refreshed',
            'token':   create_access_token(identity=user_id),
        })
    except Exception as e:
        logger.error(f"Token refresh error: {e}")
        return jsonify({'error': 'Internal server error'}), 500


# ─── Current user ─────────────────────────────────────────────────────────────

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    try:
        user = User.query.get(get_jwt_identity())
        if not user:
            return jsonify({'error': 'User not found'}), 404

        return jsonify({
            'user': {
                'id':         user.id,
                'name':       user.name,
                'email':      user.email,
                'phone':      user.phone,
                'role':       user.role,
                'avatar_url': user.avatar_url,
                'created_at': user.created_at.isoformat() if user.created_at else None,
            }
        }), 200

    except Exception as e:
        logger.error(f"Get current user error: {e}")
        return jsonify({'error': 'Internal server error'}), 500


# ─── Forgot / reset password ──────────────────────────────────────────────────

def _send_password_reset_email(user, token):
    import resend
    resend.api_key = os.environ.get('RESEND_API_KEY')
    reset_link = f"https://homesbymwema.com/reset-password?token={token}"

    html_body = f"""
    <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;background:#f9f8f6;padding:24px">
      <div style="background:#093A3E;color:white;padding:24px">
        <p style="color:#ED9B40;font-size:11px;text-transform:uppercase;letter-spacing:.2em;margin:0 0 8px">
          Homes by Mwema</p>
        <h1 style="font-size:20px;margin:0;font-weight:normal">Password Reset Request</h1>
      </div>
      <div style="background:white;border:1px solid #ebe5de;padding:24px">
        <p style="color:#555;font-size:14px;line-height:1.6">Dear {user.name or 'Valued Client'},</p>
        <p style="color:#555;font-size:14px;line-height:1.6">
          We received a request to reset the password for your Homes by Mwema account.</p>
        <div style="text-align:center;margin:24px 0">
          <a href="{reset_link}"
             style="background:#093A3E;color:white;padding:12px 28px;text-decoration:none;
                    font-size:11px;letter-spacing:.2em;text-transform:uppercase;display:inline-block">
            Reset Password</a>
        </div>
        <p style="color:#555;font-size:13px;line-height:1.6">
          This link expires in <strong>1 hour</strong>.
          If you didn't request this, you can safely ignore this email.</p>
        <p style="color:#888;font-size:13px;margin-top:24px;padding-top:16px;border-top:1px solid #eee">
          Warm regards,<br/>
          <strong style="color:#1C1917">The Homes by Mwema Team</strong></p>
      </div>
    </div>
    """

    resend.Emails.send({
        "from":    "Homes by Mwema <noreply@homesbymwema.com>",
        "to":      [user.email],
        "subject": "Reset Your Homes by Mwema Password",
        "html":    html_body,
    })
    logger.info(f"Password reset email sent to {user.email}")


@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    try:
        data  = request.get_json()
        email = data.get('email') if data else None

        if not email:
            return jsonify({'error': 'Email is required'}), 400

        generic = {'message': 'If your email is registered, you will receive a password reset link.'}
        user    = User.query.filter_by(email=email.lower().strip()).first()

        if not user:
            return jsonify(generic), 200

        # Google-only accounts don't have a password — silently skip
        if getattr(user, 'auth_provider', None) == 'google' or not user.password_hash:
            return jsonify(generic), 200

        PasswordResetToken.query.filter_by(user_id=user.id, used=False).update({'used': True})

        token = secrets.token_urlsafe(32)
        db.session.add(PasswordResetToken(
            user_id    = user.id,
            token      = token,
            expires_at = datetime.utcnow() + timedelta(hours=1),
            used       = False,
        ))
        db.session.commit()

        try:
            _send_password_reset_email(user, token)
        except Exception as e:
            logger.error(f"Failed to send password reset email: {e}")

        return jsonify(generic), 200

    except Exception as e:
        logger.error(f"Forgot password error: {e}")
        db.session.rollback()
        return jsonify({'error': 'Failed to process request'}), 500


@auth_bp.route('/verify-reset-token/<token>', methods=['GET'])
def verify_reset_token(token):
    try:
        reset_token = PasswordResetToken.query.filter_by(token=token).first()
        if not reset_token or not reset_token.is_valid():
            return jsonify({'valid': False, 'error': 'Invalid or expired token'}), 400
        return jsonify({'valid': True, 'email': reset_token.user.email}), 200
    except Exception as e:
        logger.error(f"Verify reset token error: {e}")
        return jsonify({'error': 'Failed to verify token'}), 500


@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    try:
        data         = request.get_json()
        token        = data.get('token')
        new_password = data.get('password')

        if not token or not new_password:
            return jsonify({'error': 'Token and password are required'}), 400
        if len(new_password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters'}), 400

        reset_token = PasswordResetToken.query.filter_by(token=token).first()
        if not reset_token or not reset_token.is_valid():
            return jsonify({'error': 'Invalid or expired token'}), 400

        reset_token.user.set_password(new_password)
        reset_token.used = True
        db.session.commit()

        logger.info(f"Password reset successful for: {reset_token.user.email}")
        return jsonify({'message': 'Password reset successful. You can now log in.'}), 200

    except Exception as e:
        logger.error(f"Reset password error: {e}")
        db.session.rollback()
        return jsonify({'error': 'Failed to reset password'}), 500