import logging
import os
import secrets
import string
import traceback

from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token
from datetime import timedelta

from models import db, User

logger = logging.getLogger(__name__)

google_auth_bp = Blueprint('google_auth', __name__)

# Check if Google Auth libraries are available at module level
try:
    from google.oauth2 import id_token
    from google.auth.transport import requests as google_requests
    GOOGLE_AUTH_AVAILABLE = True
    logger.info("✅ Google Auth libraries loaded successfully")
except ImportError as e:
    GOOGLE_AUTH_AVAILABLE = False
    logger.error(f"❌ Google Auth libraries not available: {str(e)}")


def _random_password(length=24):
    """Generate a secure random password for Google-only accounts."""
    alphabet = string.ascii_letters + string.digits + string.punctuation
    return ''.join(secrets.choice(alphabet) for _ in range(length))


@google_auth_bp.route('/google/test', methods=['GET'])
def google_test():
    """Test endpoint to check Google auth configuration"""
    google_client_id = os.environ.get('GOOGLE_CLIENT_ID', '')
    
    # Get list of installed packages related to google
    import pkg_resources
    google_packages = []
    try:
        installed_packages = [f"{d.project_name}=={d.version}" for d in pkg_resources.working_set]
        google_packages = [pkg for pkg in installed_packages if 'google' in pkg.lower()]
    except Exception as e:
        google_packages = [f"Error listing packages: {str(e)}"]
    
    return jsonify({
        'status': 'healthy',
        'google_auth_available': GOOGLE_AUTH_AVAILABLE,
        'google_client_id_configured': bool(google_client_id),
        'google_client_id_prefix': google_client_id[:15] + '...' if google_client_id and len(google_client_id) > 15 else google_client_id,
        'google_related_packages': google_packages[:10],  # First 10 packages
        'python_version': os.sys.version,
        'environment': os.environ.get('FLASK_ENV', 'production')
    }), 200


@google_auth_bp.route('/google', methods=['POST'])
def google_login():
    """
    Verify a Google ID-token credential and return a JWT.

    Expected JSON body:
        { "credential": "<google_id_token>" }

    Returns:
        { "token": "<jwt>", "user": { ... } }
    """
    # Check if Google Auth libraries are available
    if not GOOGLE_AUTH_AVAILABLE:
        logger.error("Google Auth libraries not installed")
        return jsonify({
            'error': 'Google authentication is temporarily unavailable',
            'details': 'Server missing required authentication libraries'
        }), 503  # Service Unavailable

    data = request.get_json(silent=True)
    if not data or not data.get('credential'):
        logger.warning("No credential provided in request")
        return jsonify({'error': 'No credential provided'}), 400

    google_client_id = os.environ.get('GOOGLE_CLIENT_ID')
    if not google_client_id:
        logger.error('GOOGLE_CLIENT_ID env var is not set')
        return jsonify({'error': 'Google authentication is not configured on this server'}), 500

    # ── Verify the Google token ───────────────────────────────────────────────
    try:
        # Import here to avoid loading if not needed, but we already checked at module level
        from google.oauth2 import id_token
        from google.auth.transport import requests as google_requests

        idinfo = id_token.verify_oauth2_token(
            data['credential'],
            google_requests.Request(),
            google_client_id,
            clock_skew_in_seconds=10,   # tolerate minor clock drift
        )
        
        logger.info(f"Google token verified successfully for email: {idinfo.get('email')}")
        
    except ValueError as exc:
        logger.warning('Invalid Google token: %s', exc)
        return jsonify({'error': 'Invalid or expired Google token'}), 401
    except Exception as exc:
        logger.error('Google token verification failed: %s', exc)
        logger.error(traceback.format_exc())
        return jsonify({'error': 'Google authentication failed'}), 500

    # ── Extract verified claims ───────────────────────────────────────────────
    email = idinfo.get('email')
    if not email:
        logger.error("Email not provided by Google")
        return jsonify({'error': 'Email not provided by Google'}), 400

    if not idinfo.get('email_verified'):
        logger.warning(f"Unverified email attempt: {email}")
        return jsonify({'error': 'Google account email is not verified'}), 400

    name       = idinfo.get('name') or email.split('@')[0]
    picture    = idinfo.get('picture', '')

    # ── Find or create the user ───────────────────────────────────────────────
    try:
        user = User.query.filter_by(email=email).first()

        if not user:
            logger.info(f"Creating new user for email: {email}")
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
            logger.info('✅ New user created via Google OAuth: %s', email)
        else:
            logger.info(f"Existing user found: {email}")
            # Keep avatar up-to-date if they didn't set one manually
            changed = False
            if picture and not user.avatar_url:
                user.avatar_url = picture
                changed = True
                logger.info(f"Updated avatar for user: {email}")
            if changed:
                db.session.commit()
            logger.info('✅ Existing user signed in via Google OAuth: %s', email)

    except Exception as exc:
        db.session.rollback()
        logger.error('DB error during Google auth: %s', exc)
        logger.error(traceback.format_exc())
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

    logger.info(f"✅ Google auth successful for user: {email}")
    return jsonify({
        'message': 'Google authentication successful',
        'token':   access_token,
        'user':    user_data,
    }), 200


@google_auth_bp.route('/google/debug', methods=['GET'])
def google_debug():
    """Debug endpoint - only enable in development!"""
    if os.environ.get('FLASK_ENV') != 'development':
        return jsonify({'error': 'Debug endpoint only available in development'}), 403
    
    # This is intentionally unsafe - only for debugging
    try:
        # Try to import and show version info
        import google
        from google.oauth2 import id_token
        from google.auth import __version__ as google_auth_version
        
        return jsonify({
            'google_module_path': google.__file__,
            'google_auth_version': google_auth_version,
            'google_client_id_configured': bool(os.environ.get('GOOGLE_CLIENT_ID')),
            'env': os.environ.get('FLASK_ENV'),
            'cwd': os.getcwd(),
            'python_path': os.sys.path[:5],  # First 5 paths
        }), 200
    except Exception as e:
        return jsonify({'error': str(e), 'traceback': traceback.format_exc()}), 500