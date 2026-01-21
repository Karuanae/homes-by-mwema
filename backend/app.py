from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from models import db, TokenBlocklist, User
import os
from datetime import timedelta
from flask_migrate import Migrate


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


app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(properties_bp, url_prefix='/api/properties')
app.register_blueprint(admin_bp, url_prefix='/api/admin')
app.register_blueprint(booking_bp, url_prefix='/api/bookings')
app.register_blueprint(payment_bp, url_prefix='/api/payments')
app.register_blueprint(user_bp, url_prefix='/api/users')
app.register_blueprint(chat_bp, url_prefix='/api/chats')


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)