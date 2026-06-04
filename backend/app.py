# app.py 
from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from models import db, TokenBlocklist, User
import os
from datetime import datetime, timedelta
from flask_migrate import Migrate
from dotenv import load_dotenv
from flask_socketio import SocketIO, emit, join_room, leave_room
import eventlet
from flask_mail import Mail
import logging

# Load environment variables from .env file
load_dotenv()

# Create the Flask application
app = Flask(__name__)
app.url_map.strict_slashes = False

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database configuration - Force PostgreSQL in production, SQLite only for local dev
database_url = os.environ.get('DATABASE_URL')
if not database_url:
    if os.environ.get('FLASK_ENV') == 'development':
        database_url = 'sqlite:///homes.db'
        print("⚠️  WARNING: Using SQLite database - not suitable for production!")
    else:
        raise ValueError("DATABASE_URL environment variable is required in production")

# Handle Railway's PostgreSQL URL format
if database_url and database_url.startswith('postgres://'):
    database_url = database_url.replace('postgres://', 'postgresql://', 1)

app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# File upload configurations - Use Railway volume if available
if os.environ.get('RAILWAY_VOLUME_MOUNT_PATH'):
    UPLOAD_FOLDER = os.path.join(os.environ.get('RAILWAY_VOLUME_MOUNT_PATH'), 'uploads/properties')
else:
    UPLOAD_FOLDER = 'uploads/properties'

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
app.config['ALLOWED_EXTENSIONS'] = ALLOWED_EXTENSIONS

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
print(f"📁 Upload directory: {UPLOAD_FOLDER}")

migrate = Migrate(app, db)
db.init_app(app)

# ===== CORS CONFIGURATION =====
default_origins = 'http://localhost:3000,http://localhost:5173'
allowed_origins_str = os.environ.get('ALLOWED_ORIGINS', default_origins)
allowed_origins = [d.strip() for d in allowed_origins_str.split(',') if d.strip()]

vercel_domains = [
    'https://homes-by-mwema-bc0hneof2-karuanaes-projects.vercel.app',
    'https://homes-by-mwema.vercel.app',
]

custom_domains = [
    'https://homesbymwema.com',
    'https://www.homesbymwema.com',
]

railway_domain = os.environ.get('RAILWAY_PUBLIC_DOMAIN')
if railway_domain:
    allowed_origins.extend([f'https://{railway_domain}', f'https://www.{railway_domain}'])

# Combine all domains and remove duplicates/empty strings
all_domains = list({d for d in allowed_origins + vercel_domains + custom_domains if d and d.strip()})

CORS(app, 
     resources={
         r"/api/*": {
             "origins": all_domains,
             "methods": ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
             "allow_headers": ["Content-Type", "Authorization", "X-Requested-With", "idempotency-key"],
             "expose_headers": ["Content-Type", "Authorization", "X-Total-Count"],
             "supports_credentials": True,
             "max_age": 3600,
             "send_wildcard": False,
             "vary_header": True
         },
         r"/socket.io/*": {
             "origins": all_domains,
             "supports_credentials": True
         }
     },
     expose_headers=['Content-Type', 'Authorization', 'X-Total-Count'],
     max_age=3600
)

print("=" * 60)
print("🌐 CORS Configuration Active")
print(f"   Environment ALLOWED_ORIGINS: {os.environ.get('ALLOWED_ORIGINS', 'NOT SET')}")
print(f"   Railway Public Domain: {railway_domain or 'NOT SET'}")
print(f"   Total allowed origins: {len(all_domains)}")
for origin in sorted(all_domains):
    print(f"     ✓ {origin}")
print("=" * 60)

# ===== JWT CONFIGURATION =====
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'akerywaeiyff\jk632423746')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
app.config['JWT_VERIFY_SUB'] = False

# ===== CORS HEADERS HANDLER =====
@app.after_request
def after_request(response):
    """Ensure CORS headers are set on all responses"""
    origin = request.headers.get('Origin')
    
    # Check if origin is in our allowed list
    if origin in all_domains:
        response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Access-Control-Allow-Credentials'] = 'true'
    elif origin and origin.replace('https://', '').replace('http://', '') in [d.replace('https://', '').replace('http://', '') for d in all_domains]:
        response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Access-Control-Allow-Credentials'] = 'true'
    else:
        # Still set headers for any allowed origin as fallback
        response.headers['Access-Control-Allow-Origin'] = ', '.join(all_domains)
    
    # Ensure these headers are always present
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, idempotency-key'
    response.headers['Access-Control-Expose-Headers'] = 'Content-Type, Authorization, X-Total-Count'
    response.headers['Access-Control-Max-Age'] = '3600'
    
    return response

# ===== BOOKING & PAYMENT CONFIGURATION =====
# All values come from environment variables with sensible fallbacks
app.config['BOOKING_TIMEOUT_MINUTES'] = int(os.environ.get('BOOKING_TIMEOUT_MINUTES', 15))
app.config['MAX_GUESTS_PER_BOOKING'] = int(os.environ.get('MAX_GUESTS_PER_BOOKING', 10))
app.config['MIN_NIGHTS_BOOKING'] = int(os.environ.get('MIN_NIGHTS_BOOKING', 1))
app.config['MAX_NIGHTS_BOOKING'] = int(os.environ.get('MAX_NIGHTS_BOOKING', 30))

# ===== M-PESA DARAJA API CONFIGURATION =====
app.config['MPESA_ENVIRONMENT'] = os.environ.get('MPESA_ENVIRONMENT', 'production')
app.config['MPESA_CONSUMER_KEY'] = os.environ.get('MPESA_CONSUMER_KEY', '')
app.config['MPESA_CONSUMER_SECRET'] = os.environ.get('MPESA_CONSUMER_SECRET', '')
app.config['MPESA_BUSINESS_SHORT_CODE'] = os.environ.get('MPESA_BUSINESS_SHORT_CODE', '008814')
app.config['MPESA_PASSKEY'] = os.environ.get('MPESA_PASSKEY', '')
app.config['MPESA_CALLBACK_URL'] = os.environ.get('MPESA_CALLBACK_URL', '')
app.config['MPESA_SECRET'] = os.environ.get('MPESA_SECRET', '')  # For webhook verification

# M-PESA B2C Configuration (for refunds)
app.config['MPESA_INITIATOR_NAME'] = os.environ.get('MPESA_INITIATOR_NAME', 'testapi')
app.config['MPESA_SECURITY_CREDENTIAL'] = os.environ.get('MPESA_SECURITY_CREDENTIAL', '')
app.config['MPESA_B2C_TIMEOUT_URL'] = os.environ.get('MPESA_B2C_TIMEOUT_URL', '')
app.config['MPESA_B2C_RESULT_URL'] = os.environ.get('MPESA_B2C_RESULT_URL', '')

# ===== PAYPAL REST API CONFIGURATION =====
app.config['PAYPAL_ENVIRONMENT'] = os.environ.get('PAYPAL_ENVIRONMENT', 'sandbox')
app.config['PAYPAL_CLIENT_ID'] = os.environ.get('PAYPAL_CLIENT_ID', '')
app.config['PAYPAL_CLIENT_SECRET'] = os.environ.get('PAYPAL_CLIENT_SECRET', '')
app.config['PAYPAL_RETURN_URL'] = os.environ.get('PAYPAL_RETURN_URL', '')
app.config['PAYPAL_CANCEL_URL'] = os.environ.get('PAYPAL_CANCEL_URL', '')
app.config['PAYPAL_WEBHOOK_ID'] = os.environ.get('PAYPAL_WEBHOOK_ID', '')

# ===== CURRENCY CONVERSION =====
app.config['KES_TO_USD_RATE'] = float(os.environ.get('KES_TO_USD_RATE', '129.0'))

# ===== MAIL CONFIGURATION =====
app.config['MAIL_SERVER'] = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
app.config['MAIL_PORT'] = int(os.environ.get('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = os.environ.get('MAIL_USE_TLS', 'true').lower() == 'true'
app.config['MAIL_USE_SSL'] = os.environ.get('MAIL_USE_SSL', 'false').lower() == 'true'
app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME', '')
app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD', '')
app.config['MAIL_DEFAULT_SENDER'] = os.environ.get('MAIL_DEFAULT_SENDER', 'noreply@homesbymwema.com')
app.config['MAIL_FROM_NAME'] = os.environ.get('MAIL_FROM_NAME', 'Homes by Mwema')

# Print configuration on startup
print("=" * 50)
print("💰 BOOKING CONFIGURATION:")
print(f"  • Booking Timeout: {app.config['BOOKING_TIMEOUT_MINUTES']} minutes")
print(f"  • Max Guests: {app.config['MAX_GUESTS_PER_BOOKING']}")
print(f"  • Min Nights: {app.config['MIN_NIGHTS_BOOKING']}")
print(f"  • Max Nights: {app.config['MAX_NIGHTS_BOOKING']}")
print("=" * 50)
print("📱 M-PESA CONFIGURATION:")
print(f"  • Environment: {app.config['MPESA_ENVIRONMENT']}")
print(f"  • Short Code: {app.config['MPESA_BUSINESS_SHORT_CODE']}")
print(f"  • Callback URL: {app.config['MPESA_CALLBACK_URL'] or 'Not set'}")
print("=" * 50)
print("💳 PAYPAL CONFIGURATION:")
print(f"  • Environment: {app.config['PAYPAL_ENVIRONMENT']}")
print(f"  • Webhook ID: {app.config['PAYPAL_WEBHOOK_ID'] or 'Not set'}")
print(f"  • KES to USD Rate: {app.config['KES_TO_USD_RATE']}")
print("=" * 50)

# Initialize Mail
mail = Mail(app)
app.mail = mail
from views.email_service import init_email_service
init_email_service(mail)

# Initialize extensions
jwt = JWTManager(app)
jwt.init_app(app)

# Initialize SocketIO with production settings
socketio = SocketIO(
    app,
    cors_allowed_origins=all_domains,
    async_mode='eventlet',
    logger=True,
    engineio_logger=False,
    ping_timeout=60,
    ping_interval=25,
    manage_session=False
)

# ===== INITIALIZE APSCHEDULER =====
# Import and start the scheduler
from scheduler import init_scheduler

# ALWAYS start scheduler (needed for booking expirations, payment cleanup, etc)
# Avoid starting twice in Werkzeug reloader by checking environment
if os.environ.get('WERKZEUG_RUN_MAIN') != 'false':
    try:
        init_scheduler(app)
        logger.info("✅ APScheduler initialized successfully")
    except Exception as e:
        logger.error(f"❌ Failed to initialize APScheduler: {e}")
        import traceback
        logger.error(traceback.format_exc())

# JWT token blocklist callback
@jwt.token_in_blocklist_loader
def check_if_token_revoked(jwt_header, jwt_payload):
    jti = jwt_payload['jti']
    token = db.session.query(TokenBlocklist).filter_by(jti=jti).first()
    return token is not None

# Serve uploaded files
@app.route('/uploads/properties/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# Health check endpoint for Railway
@app.route('/health')
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'database': 'connected' if db.engine else 'disconnected'
    })

# Root endpoint
@app.route('/')
def index():
    return jsonify({
        'name': 'Homes by Mwema API',
        'version': '1.0.0',
        'status': 'running',
        'environment': os.environ.get('FLASK_ENV', 'production'),
        'timestamp': datetime.utcnow().isoformat()
    })

# ── Register blueprints ────────────────────────────────────────────────────
from views.auth import auth_bp
from views.auth_google import google_auth_bp
from views.properties import properties_bp
from views.admin import admin_bp
from views.booking import booking_bp
from views.payment import payment_bp
from views.user import user_bp
from views.chat import chat_bp
from views.main import bp as main_bp
from views.consultation import consultation_bp

app.register_blueprint(auth_bp,        url_prefix='/api/auth')
app.register_blueprint(google_auth_bp, url_prefix='/api/auth')
app.register_blueprint(properties_bp,  url_prefix='/api/properties')
app.register_blueprint(admin_bp,       url_prefix='/api/admin')
app.register_blueprint(booking_bp,     url_prefix='/api/bookings')
app.register_blueprint(payment_bp,     url_prefix='/api/payments')
app.register_blueprint(user_bp,        url_prefix='/api/users')
app.register_blueprint(chat_bp,        url_prefix='/api/chats')
app.register_blueprint(main_bp,        url_prefix='/api')
app.register_blueprint(consultation_bp, url_prefix='/api/consultations')
# ──────────────────────────────────────────────────────────────────────────

# SocketIO event handlers
@socketio.on('connect')
def handle_connect():
    print(f'[SOCKETIO] Client connected: {request.sid}')
    emit('connected', {'status': 'connected', 'sid': request.sid})

@socketio.on('disconnect')
def handle_disconnect():
    print(f'[SOCKETIO] Client disconnected: {request.sid}')

@socketio.on('ping')
def handle_ping():
    emit('pong', {'message': 'pong', 'timestamp': datetime.utcnow().isoformat()})

# Import and register chat socket events AFTER socketio is defined
try:
    from socket_events import register_chat_events
    register_chat_events(socketio)
    print("✅ Chat socket events registered successfully")
except ImportError as e:
    print(f"⚠️  Could not import socket_events: {e}")
    print("⚠️  Creating socket_events.py file...")

    socket_events_content = '''# socket_events.py
def register_chat_events(socketio):
    """Placeholder for chat events"""
    print("ℹ️  Using placeholder socket events")

    @socketio.on('authenticate')
    def handle_authentication(data):
        print(f"Authentication attempt: {data}")
        socketio.emit('authenticated', {'status': 'success'})
'''

    with open('socket_events.py', 'w') as f:
        f.write(socket_events_content)

    from socket_events import register_chat_events
    register_chat_events(socketio)

# ===== ADMIN USER SECTION =====
with app.app_context():
    try:
        db.create_all()
        print("✅ Database tables created/verified")

        admin_email    = os.environ.get('ADMIN_EMAIL', 'homesbymwema@gmail.com')
        admin_password = os.environ.get('ADMIN_PASSWORD', 'admin123')
        admin_name     = os.environ.get('ADMIN_NAME', 'Homes by Mwema Admin')
        admin_phone    = os.environ.get('ADMIN_PHONE', '+254700000000')

        admin_user = User.query.filter_by(email=admin_email).first()

        if not admin_user:
            admin_user = User(
                name=admin_name,
                email=admin_email,
                phone=admin_phone,
                role="admin"
            )
            admin_user.set_password(admin_password)
            db.session.add(admin_user)
            db.session.commit()
            print(f"✅ Created admin user: {admin_email}")
        else:
            updated = False

            if not admin_user.check_password(admin_password):
                admin_user.set_password(admin_password)
                updated = True
                print("🔄 Updated admin password from environment variable")

            if admin_user.email != admin_email:
                admin_user.email = admin_email
                updated = True
                print(f"🔄 Updated admin email to: {admin_email}")

            if admin_user.name != admin_name:
                admin_user.name = admin_name
                updated = True
                print(f"🔄 Updated admin name to: {admin_name}")

            if admin_user.phone != admin_phone:
                admin_user.phone = admin_phone
                updated = True
                print(f"🔄 Updated admin phone to: {admin_phone}")

            if updated:
                db.session.commit()
                print(f"✅ Admin user updated: {admin_email}")
            else:
                print(f"✅ Admin user already exists: {admin_email}")

    except Exception as e:
        print(f"⚠️  Database initialization warning: {e}")
        print("This is normal if migrations haven't been applied yet.")

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Resource not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_DEBUG', 'True').lower() == 'true'
    print("=" * 50)
    print("🚀 Starting Homes by Mwema server locally...")
    print(f"📡 Server will run on: http://0.0.0.0:{port}")
    print(f"📁 Upload folder: {UPLOAD_FOLDER}")
    print(f"🌐 CORS allowed origins: {all_domains}")
    print("🔌 WebSocket endpoint: ws://localhost:5000/socket.io/")
    print("=" * 50)
    socketio.run(app, debug=debug, host='0.0.0.0', port=port)
else:
    print("=" * 50)
    print("🚀 Homes by Mwema app initialized for production")
    print(f"📡 Database: {app.config['SQLALCHEMY_DATABASE_URI']}")
    print(f"📁 Upload folder: {app.config['UPLOAD_FOLDER']}")
    print(f"🌐 CORS allowed origins: {all_domains}")
    print("=" * 50)