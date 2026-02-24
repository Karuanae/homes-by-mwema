# app.py - COMPLETE RAILWAY-READY VERSION WITH UPDATED DOMAINS
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

# Load environment variables from .env file
load_dotenv()

# Create the Flask application
app = Flask(__name__)
app.url_map.strict_slashes = False

# Database configuration - Force PostgreSQL in production, SQLite only for local dev
database_url = os.environ.get('DATABASE_URL')
if not database_url:
    # Only use SQLite if explicitly in development mode and no DATABASE_URL
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

# Create upload folder if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
print(f"📁 Upload directory: {UPLOAD_FOLDER}")

migrate = Migrate(app, db)
db.init_app(app)

# ===== UPDATED CORS CONFIGURATION WITH ALL YOUR DOMAINS =====
# Get allowed origins from environment or use defaults
default_origins = 'http://localhost:3000,http://localhost:5173'
allowed_origins = os.environ.get('ALLOWED_ORIGINS', default_origins).split(',')

# Add Vercel domains (temporary and production)
vercel_domains = [
    'https://homes-by-mwema-bc0hneof2-karuanaes-projects.vercel.app',
    'https://homes-by-mwema.vercel.app',
]

# Add Truehost/Custom domains
custom_domains = [
    'https://homesbymwema.com',
    'https://www.homesbymwema.com',
]

# Add Railway domain if available
railway_domain = os.environ.get('RAILWAY_PUBLIC_DOMAIN')
if railway_domain:
    allowed_origins.append(f'https://{railway_domain}')
    allowed_origins.append(f'https://www.{railway_domain}')

# Combine all domains (remove duplicates by converting to set)
all_domains = set(allowed_origins + vercel_domains + custom_domains)
# Filter out any empty strings
all_domains = [domain for domain in all_domains if domain]

# Update CORS configuration
CORS(app, resources={
    r"/api/*": {
        "origins": list(all_domains),
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
        "expose_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True,
        "max_age": 600
    },
    r"/socket.io/*": {
        "origins": list(all_domains),
        "supports_credentials": True
    }
})

# Print configured origins for debugging
print("=" * 50)
print("🌐 CORS Allowed Origins:")
for origin in sorted(list(all_domains)):
    print(f"  • {origin}")
print("=" * 50)

# Configuration
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'akerywaeiyff\jk632423746')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
app.config['JWT_VERIFY_SUB'] = False

# M-PESA Daraja API Configuration
app.config['MPESA_ENVIRONMENT'] = os.environ.get('MPESA_ENVIRONMENT', 'sandbox')
app.config['MPESA_CONSUMER_KEY'] = os.environ.get('MPESA_CONSUMER_KEY', 'YOUR_CONSUMER_KEY_HERE')
app.config['MPESA_CONSUMER_SECRET'] = os.environ.get('MPESA_CONSUMER_SECRET', 'YOUR_CONSUMER_SECRET_HERE')
app.config['MPESA_BUSINESS_SHORT_CODE'] = os.environ.get('MPESA_BUSINESS_SHORT_CODE', '174379')
app.config['MPESA_PASSKEY'] = os.environ.get('MPESA_PASSKEY', 'YOUR_PASSKEY_HERE')
app.config['MPESA_CALLBACK_URL'] = os.environ.get('MPESA_CALLBACK_URL', 'https://homesbymwema.com/api/payments/mpesa/callback')

# M-PESA B2C Configuration (for refunds)
app.config['MPESA_INITIATOR_NAME'] = os.environ.get('MPESA_INITIATOR_NAME', 'testapi')
app.config['MPESA_SECURITY_CREDENTIAL'] = os.environ.get('MPESA_SECURITY_CREDENTIAL', 'YOUR_SECURITY_CREDENTIAL')
app.config['MPESA_B2C_TIMEOUT_URL'] = os.environ.get('MPESA_B2C_TIMEOUT_URL', 'https://homesbymwema.com/api/payments/mpesa/b2c/timeout')
app.config['MPESA_B2C_RESULT_URL'] = os.environ.get('MPESA_B2C_RESULT_URL', 'https://homesbymwema.com/api/payments/mpesa/b2c/result')

# PayPal REST API Configuration
app.config['PAYPAL_ENVIRONMENT'] = os.environ.get('PAYPAL_ENVIRONMENT', 'sandbox')
app.config['PAYPAL_CLIENT_ID'] = os.environ.get('PAYPAL_CLIENT_ID', 'ARx2bRbdY3X1kfuT8P-QlfoAsDF0rWqv4VExGthJOl5QOqQWhHLo76HdxztMGcyJylPpbnMqTfa_jggd')
app.config['PAYPAL_CLIENT_SECRET'] = os.environ.get('PAYPAL_CLIENT_SECRET', 'EIm6QhXUnU9QSuBJCr0-xdxrIacugPSQfjGeSzgzHyyoStbwL0rP5ONGbvDOGDIXekfSWs_RvRdliJBi')
app.config['PAYPAL_RETURN_URL'] = os.environ.get('PAYPAL_RETURN_URL', 'https://homesbymwema.com/payment/success')
app.config['PAYPAL_CANCEL_URL'] = os.environ.get('PAYPAL_CANCEL_URL', 'https://homesbymwema.com/payment/cancel')
app.config['PAYPAL_WEBHOOK_ID'] = os.environ.get('PAYPAL_WEBHOOK_ID', '')

# Currency conversion rate (KES to USD)
app.config['KES_TO_USD_RATE'] = float(os.environ.get('KES_TO_USD_RATE', '129.0'))

# Initialize extensions
jwt = JWTManager(app)
jwt.init_app(app)

# Initialize SocketIO with production settings
socketio = SocketIO(
    app,
    cors_allowed_origins=list(all_domains),
    async_mode='eventlet',
    logger=True,
    engineio_logger=False,
    ping_timeout=60,
    ping_interval=25,
    manage_session=False
)

# JWT token blocklist callback
@jwt.token_in_blocklist_loader
def check_if_token_revoked(jwt_header, jwt_payload):
    jti = jwt_payload['jti']
    token = db.session.query(TokenBlocklist).filter_by(jti=jti).first()
    return token is not None

# Serve uploaded files
@app.route('/uploads/properties/<filename>')
def uploaded_file(filename):
    """Serve uploaded property images"""
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# Health check endpoint for Railway
@app.route('/health')
def health_check():
    """Health check endpoint for Railway"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'database': 'connected' if db.engine else 'disconnected'
    })

# Root endpoint
@app.route('/')
def index():
    return jsonify({
        'name': 'MWEMA Estate API',
        'version': '1.0.0',
        'status': 'running',
        'environment': os.environ.get('FLASK_ENV', 'production'),
        'timestamp': datetime.utcnow().isoformat()
    })

# Register blueprints
from views.auth import auth_bp
from views.properties import properties_bp
from views.admin import admin_bp
from views.booking import booking_bp
from views.payment import payment_bp
from views.user import user_bp
from views.chat import chat_bp
from views.main import bp as main_bp

app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(properties_bp, url_prefix='/api/properties')
app.register_blueprint(admin_bp, url_prefix='/api/admin')
app.register_blueprint(booking_bp, url_prefix='/api/bookings')
app.register_blueprint(payment_bp, url_prefix='/api/payments')
app.register_blueprint(user_bp, url_prefix='/api/users')
app.register_blueprint(chat_bp, url_prefix='/api/chats')
app.register_blueprint(main_bp, url_prefix='/api')

# SocketIO event handlers
@socketio.on('connect')
def handle_connect():
    print(f'[SOCKETIO] Client connected: {request.sid}')
    emit('connected', {'status': 'connected', 'sid': request.sid})

@socketio.on('disconnect')
def handle_disconnect():
    print(f'[SOCKETIO] Client disconnected: {request.sid}')

# Simple test event
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

# Create database tables on startup
with app.app_context():
    try:
        db.create_all()
        print("✅ Database tables created/verified")
        
        # Create default admin user if none exists
        admin_email = "admin@mwema.com"
        admin_user = User.query.filter_by(email=admin_email).first()
        
        if not admin_user:
            admin_user = User(
                name="Administrator",
                email=admin_email,
                phone="+254700000000",
                role="admin"
            )
            admin_user.set_password(os.environ.get('ADMIN_PASSWORD', 'admin123'))
            db.session.add(admin_user)
            db.session.commit()
            print(f"✅ Created default admin user: {admin_email}")
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

# Update the main block for Railway
if __name__ == '__main__':
    # Local development
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_DEBUG', 'True').lower() == 'true'
    print("=" * 50)
    print("🚀 Starting MWEMA Estate server locally...")
    print(f"📡 Server will run on: http://0.0.0.0:{port}")
    print(f"📁 Upload folder: {UPLOAD_FOLDER}")
    print(f"🌐 CORS allowed origins: {list(all_domains)}")
    print("🔌 WebSocket endpoint: ws://localhost:5000/socket.io/")
    print("=" * 50)
    socketio.run(app, debug=debug, host='0.0.0.0', port=port)
else:
    # Production (imported by gunicorn)
    print("=" * 50)
    print("🚀 MWEMA Estate app initialized for production")
    print(f"📡 Database: {app.config['SQLALCHEMY_DATABASE_URI']}")
    print(f"📁 Upload folder: {app.config['UPLOAD_FOLDER']}")
    print(f"🌐 CORS allowed origins: {list(all_domains)}")
    print("=" * 50)