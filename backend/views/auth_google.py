import logging
import os
import secrets
import string

from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token
from datetime import timedelta

from models import db, User

logger = logging.getLogger(__name__)

google_auth_bp = Blueprint('google_auth', __name__)


def _random_password(length=24):
    """Generate a secure random password for Google-only accounts."""
    alphabet = string.ascii_letters + string.digits + string.punctuation
    return ''.join(secrets.choice(alphabet) for _ in range(length))


@google_auth_bp.route('/google', methods=['POST'])
def google_login():
    """
    Verify a Google ID-token credential and return a JWT.

    Expected JSON body:
        { "credential": "<google_id_token>" }

    Returns:
        { "token": "<jwt>", "user": { ... } }
    """
    data = request.get_json(silent=True)
    if not data or not data.get('credential'):
        return jsonify({'error': 'No credential provided'}), 400

    google_client_id = os.environ.get('GOOGLE_CLIENT_ID')
    if not google_client_id:
        logger.error('GOOGLE_CLIENT_ID env var is not set')
        return jsonify({'error': 'Google authentication is not configured on this server'}), 500

    # ── Verify the Google token ───────────────────────────────────────────────
    try:
        from google.oauth2 import id_token
        from google.auth.transport import requests as google_requests

        idinfo = id_token.verify_oauth2_token(
            data['credential'],
            google_requests.Request(),
            google_client_id,
            clock_skew_in_seconds=10,   # tolerate minor clock drift
        )
    except ValueError as exc:
        logger.warning('Invalid Google token: %s', exc)
        return jsonify({'error': 'Invalid or expired Google token'}), 401
    except Exception as exc:
        logger.error('Google token verification failed: %s', exc)
        return jsonify({'error': 'Google authentication failed'}), 500

    # ── Extract verified claims ───────────────────────────────────────────────
    email = idinfo.get('email')
    if not email:
        return jsonify({'error': 'Email not provided by Google'}), 400

    if not idinfo.get('email_verified'):
        return jsonify({'error': 'Google account email is not verified'}), 400

    name       = idinfo.get('name') or email.split('@')[0]
    picture    = idinfo.get('picture', '')

    # ── Find or create the user ───────────────────────────────────────────────
    try:
        user = User.query.filter_by(email=email).first()

        if not user:
            user = User(
                name=name,
                email=email,
                phone='',
                role='user',
                avatar_url=picture or None,
            )
            user.set_password(_random_password())
            db.session.add(user)
            db.session.commit()
            logger.info('New user created via Google OAuth: %s', email)
        else:
            # Keep avatar up-to-date if they didn't set one manually
            changed = False
            if picture and not user.avatar_url:
                user.avatar_url = picture
                changed = True
            if changed:
                db.session.commit()
            logger.info('Existing user signed in via Google OAuth: %s', email)

    except Exception as exc:
        db.session.rollback()
        logger.error('DB error during Google auth: %s', exc)
        return jsonify({'error': 'Server error, please try again'}), 500

    # ── Issue JWT ─────────────────────────────────────────────────────────────
    access_token = create_access_token(
        identity=user.id,
        expires_delta=timedelta(days=7),
    )

    user_data = {
        'id':         user.id,
        'name':       user.name,
        'email':      user.email,
        'phone':      user.phone or '',
        'role':       user.role,
        'avatar_url': user.avatar_url or picture,
        'created_at': user.created_at.isoformat() if getattr(user, 'created_at', None) else None,
    }

    return jsonify({
        'message': 'Google authentication successful',
        'token':   access_token,
        'user':    user_data,
    }), 200