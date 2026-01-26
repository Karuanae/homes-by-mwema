from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from models import db, TokenBlocklist, User
import os
from datetime import timedelta
from flask_migrate import Migrate
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Create the Flask application
app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///homes.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

migrate = Migrate(app, db)
db.init_app(app)



# CORS Configuration
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

# Configuration


app.config['JWT_SECRET_KEY'] = "akerywaeiyff\jk632423746"
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
app.config['JWT_VERIFY_SUB'] = False

# M-PESA Daraja API Configuration
# For production, use environment variables instead of hardcoding
app.config['MPESA_ENVIRONMENT'] = os.environ.get('MPESA_ENVIRONMENT', 'sandbox')  # 'sandbox' or 'production'
app.config['MPESA_CONSUMER_KEY'] = os.environ.get('MPESA_CONSUMER_KEY', 'YOUR_CONSUMER_KEY_HERE')
app.config['MPESA_CONSUMER_SECRET'] = os.environ.get('MPESA_CONSUMER_SECRET', 'YOUR_CONSUMER_SECRET_HERE')
app.config['MPESA_BUSINESS_SHORT_CODE'] = os.environ.get('MPESA_BUSINESS_SHORT_CODE', '174379')  # Use 174379 for sandbox
app.config['MPESA_PASSKEY'] = os.environ.get('MPESA_PASSKEY', 'YOUR_PASSKEY_HERE')
app.config['MPESA_CALLBACK_URL'] = os.environ.get('MPESA_CALLBACK_URL', 'https://yourdomain.com/api/payments/mpesa/callback')

# M-PESA B2C Configuration (for refunds)
app.config['MPESA_INITIATOR_NAME'] = os.environ.get('MPESA_INITIATOR_NAME', 'testapi')
app.config['MPESA_SECURITY_CREDENTIAL'] = os.environ.get('MPESA_SECURITY_CREDENTIAL', 'YOUR_SECURITY_CREDENTIAL')
app.config['MPESA_B2C_TIMEOUT_URL'] = os.environ.get('MPESA_B2C_TIMEOUT_URL', 'https://yourdomain.com/api/payments/mpesa/b2c/timeout')
app.config['MPESA_B2C_RESULT_URL'] = os.environ.get('MPESA_B2C_RESULT_URL', 'https://yourdomain.com/api/payments/mpesa/b2c/result')

# Initialize extensions

jwt = JWTManager(app)
jwt.init_app(app)


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


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)