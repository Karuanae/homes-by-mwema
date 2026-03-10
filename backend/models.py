# models.py - COMPLETE UPDATED VERSION
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import MetaData
from werkzeug.security import generate_password_hash, check_password_hash
import json

metadata = MetaData()
db = SQLAlchemy(metadata=metadata)

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(20))
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), default='user')  # 'user', 'host', 'admin'
    is_guest = db.Column(db.Boolean, default=False)
    avatar_url = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    bookings = db.relationship('Booking', backref='user', lazy=True)
    chats = db.relationship('Chat', backref='user', lazy=True)
    payments = db.relationship('Payment', backref='user', lazy=True)
    leads = db.relationship('Lead', backref='assigned_to', lazy=True, foreign_keys='Lead.assigned_to_id')
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Property(db.Model):
    __tablename__ = 'properties'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    title = db.Column(db.String(200))
    description = db.Column(db.Text)
    type = db.Column(db.String(50))  # 'studio', '1_bedroom', '2_bedroom', etc.
    price = db.Column(db.Numeric(10, 2), nullable=False)
    location = db.Column(db.String(200), nullable=False)
    rooms = db.Column(db.Integer, default=1)
    bathrooms = db.Column(db.Integer, default=1)
    area = db.Column(db.String(50))  # e.g., "1200 sq ft"
    max_guests = db.Column(db.Integer, default=2)
    host_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    specs = db.Column(db.JSON)  # {'guests': 2, 'bedrooms': 1, 'beds': 1, 'bathrooms': 1}
    amenities = db.Column(db.JSON)  # List of amenities
    tags = db.Column(db.JSON)  # List of tags
    status = db.Column(db.String(20), default='active')  # 'active', 'inactive', 'maintenance'
    rating = db.Column(db.Numeric(3, 2), default=0)
    review_count = db.Column(db.Integer, default=0)
    bookings_count = db.Column(db.Integer, default=0)
    is_featured = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    host = db.relationship('User', backref='properties', foreign_keys=[host_id])
    bookings = db.relationship('Booking', backref='property', lazy=True)
    payments = db.relationship('Payment', backref='property', lazy=True)
    chats = db.relationship('Chat', backref='property', lazy=True)
    images = db.relationship('PropertyImage', backref='property', lazy=True, cascade='all, delete-orphan')
    
    # Helper method to get image URLs
    def get_image_urls(self):
        """Get list of image API URLs"""
        return [f"/api/admin/property-image/{img.id}" for img in self.images]
    
    def get_cover_image_url(self):
        """Get cover image URL"""
        cover_image = PropertyImage.query.filter_by(property_id=self.id, is_cover=True).first()
        if cover_image:
            return f"/api/admin/property-image/{cover_image.id}"
        return None

class PropertyImage(db.Model):
    __tablename__ = 'property_images'
    
    id = db.Column(db.Integer, primary_key=True)
    property_id = db.Column(db.Integer, db.ForeignKey('properties.id'), nullable=True)
    image_data = db.Column(db.LargeBinary, nullable=False)  # Store actual image binary
    filename = db.Column(db.String(255))
    mime_type = db.Column(db.String(50))
    is_cover = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'property_id': self.property_id,
            'filename': self.filename,
            'mime_type': self.mime_type,
            'is_cover': self.is_cover,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'url': f"/api/admin/property-image/{self.id}"
        }

class Booking(db.Model):
    __tablename__ = 'bookings'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    property_id = db.Column(db.Integer, db.ForeignKey('properties.id'), nullable=False)
    check_in = db.Column(db.Date, nullable=False)
    check_out = db.Column(db.Date, nullable=False)
    guests = db.Column(db.JSON)
    nights = db.Column(db.Integer, nullable=False)
    base_amount = db.Column(db.Numeric(10, 2), nullable=False)
    cleaning_fee = db.Column(db.Numeric(10, 2), default=1500)
    service_fee = db.Column(db.Numeric(10, 2), default=0)
    total_amount = db.Column(db.Numeric(10, 2), nullable=False)
    pending_amount = db.Column(db.Numeric(10, 2), default=0)
    payment_type = db.Column(db.String(20), default='full')
    payment_method = db.Column(db.String(20))
    payment_status = db.Column(db.String(20), default='pending')
    confirmation = db.Column(db.String(20), default='pending')
    status = db.Column(db.String(20), default='upcoming')
    message_to_host = db.Column(db.Text)
    
    # ADD THESE MISSING FIELDS:
    idempotency_key = db.Column(db.String(100), unique=True, nullable=True)
    expires_at = db.Column(db.DateTime, nullable=True)
    booking_metadata = db.Column(db.JSON, default={})  # or 'additional_data'
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    payments = db.relationship('Payment', backref='booking', lazy=True)
    chat = db.relationship('Chat', backref='booking', uselist=False, lazy=True)
    
class Payment(db.Model):
    __tablename__ = 'payments'
    
    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    property_id = db.Column(db.Integer, db.ForeignKey('properties.id'))
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    method = db.Column(db.String(20), nullable=False)  # 'mpesa', 'card', 'bank', 'cash'
    transaction_id = db.Column(db.String(100))
    mpesa_number = db.Column(db.String(20))
    card_last_four = db.Column(db.String(4))
    status = db.Column(db.String(20), default='pending')  # 'pending', 'completed', 'failed', 'refunded'
    
    # M-PESA specific fields
    mpesa_receipt_number = db.Column(db.String(100))  # M-PESA receipt number (e.g., QBR31H5YZX)
    merchant_request_id = db.Column(db.String(100))  # Merchant request ID from STK push
    checkout_request_id = db.Column(db.String(100))  # Checkout request ID from STK push
    mpesa_response_code = db.Column(db.String(10))  # Response code from M-PESA
    mpesa_response_description = db.Column(db.String(255))  # Response description
    
    # Error handling and idempotency
    idempotency_key = db.Column(db.String(100), unique=True, nullable=True)  # Prevent duplicate payments
    error_log = db.Column(db.Text, nullable=True)  # Log any payment errors
    
    payment_date = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Consultation(db.Model):
    __tablename__ = 'consultations'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(100), nullable=True)  # Store name in case user updates profile later
    email = db.Column(db.String(120), nullable=True) # Store email for notifications
    phone = db.Column(db.String(20), nullable=True)
    
    # Scheduling
    date = db.Column(db.DateTime, nullable=False)
    hour = db.Column(db.Integer)
    minute = db.Column(db.Integer)
    
    # Consultation details
    notes = db.Column(db.Text)
    topic = db.Column(db.String(100), default='General Inquiry')  # Type of consultation
    
    # Status tracking
    status = db.Column(db.String(20), default='pending')  # pending, confirmed, completed, cancelled, rejected
    
    # Admin fields
    admin_notes = db.Column(db.Text)  # Private notes for admin
    meeting_link = db.Column(db.String(255))  # Zoom/Google Meet link for confirmed consultations
    meeting_time = db.Column(db.DateTime)  # Actual scheduled meeting time (if different from requested)
    
    # Email tracking
    email_sent = db.Column(db.Boolean, default=False)
    email_sent_at = db.Column(db.DateTime)
    email_content = db.Column(db.Text)  # Store the email that was sent
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    confirmed_at = db.Column(db.DateTime)
    completed_at = db.Column(db.DateTime)
    cancelled_at = db.Column(db.DateTime)

    # Relationships
    user = db.relationship('User', backref=db.backref('consultations', lazy=True))
    chat = db.relationship('Chat', backref='consultation', uselist=False)
    
    def to_dict(self, include_user=False, detailed=False):
        """Convert consultation to dictionary"""
        data = {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name or (self.user.name if self.user else None),
            'email': self.email or (self.user.email if self.user else None),
            'phone': self.phone or (self.user.phone if self.user else None),
            'date': self.date.isoformat() if self.date else None,
            'hour': self.hour,
            'minute': self.minute,
            'notes': self.notes,
            'topic': self.topic,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
        
        if detailed or include_user:
            data['user'] = {
                'id': self.user.id,
                'name': self.user.name,
                'email': self.user.email,
                'phone': self.user.phone,
                'avatar_url': self.user.avatar_url
            } if self.user else None
        
        if detailed:
            data.update({
                'admin_notes': self.admin_notes,
                'meeting_link': self.meeting_link,
                'meeting_time': self.meeting_time.isoformat() if self.meeting_time else None,
                'email_sent': self.email_sent,
                'email_sent_at': self.email_sent_at.isoformat() if self.email_sent_at else None,
                'confirmed_at': self.confirmed_at.isoformat() if self.confirmed_at else None,
                'completed_at': self.completed_at.isoformat() if self.completed_at else None,
                'cancelled_at': self.cancelled_at.isoformat() if self.cancelled_at else None,
            })
        
        return data
    
    def __repr__(self):
        return f'<Consultation {self.id} - {self.status}>'

class Chat(db.Model):
    __tablename__ = 'chats'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    property_id = db.Column(db.Integer, db.ForeignKey('properties.id'))
    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.id'))
    consultation_id = db.Column(db.Integer, db.ForeignKey('consultations.id'))
    chat_type = db.Column(db.String(20), default='general')  # 'general', 'booking', 'inquiry', 'lead', 'consultation'
    status = db.Column(db.String(20), default='active')  # 'active', 'closed', 'archived'
    unread_count = db.Column(db.Integer, default=0)
    last_message = db.Column(db.Text)
    last_message_time = db.Column(db.DateTime, default=datetime.utcnow)
    last_active = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    messages = db.relationship('ChatMessage', backref='chat', lazy=True, order_by='ChatMessage.timestamp')

class ChatMessage(db.Model):
    __tablename__ = 'chat_messages'
    
    id = db.Column(db.Integer, primary_key=True)
    chat_id = db.Column(db.Integer, db.ForeignKey('chats.id'), nullable=False)
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    sender_name = db.Column(db.String(100), nullable=False)
    content = db.Column(db.Text, nullable=False)
    message_type = db.Column(db.String(20), default='text')  # 'text', 'image', 'file'
    is_read = db.Column(db.Boolean, default=False)
    is_host = db.Column(db.Boolean, default=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Lead(db.Model):
    __tablename__ = 'leads'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120))
    phone = db.Column(db.String(20))
    source = db.Column(db.String(50))  # 'website', 'whatsapp', 'call', 'referral'
    status = db.Column(db.String(20), default='new')  # 'new', 'contacted', 'qualified', 'converted', 'lost'
    priority = db.Column(db.String(20), default='medium')  # 'low', 'medium', 'high', 'urgent'
    assigned_to_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    property_interest = db.Column(db.String(200))
    message = db.Column(db.Text)
    follow_up_date = db.Column(db.Date)
    last_contacted = db.Column(db.DateTime)
    converted_to_booking_id = db.Column(db.Integer, db.ForeignKey('bookings.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class HomepageContent(db.Model):
    __tablename__ = 'homepage_content'
    
    id = db.Column(db.Integer, primary_key=True)
    hero_images = db.Column(db.JSON, default=list)  # List of hero image URLs
    featured_properties = db.Column(db.JSON, default=list)  # List of property IDs
    premium_badges = db.Column(db.JSON, default=list)  # List of badge objects
    testimonials = db.Column(db.JSON, default=list)  # List of testimonial objects
    faqs = db.Column(db.JSON, default=list)  # List of FAQ objects
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class AdminStats(db.Model):
    __tablename__ = 'admin_stats'
    
    id = db.Column(db.Integer, primary_key=True)
    total_properties = db.Column(db.Integer, default=0)
    active_bookings = db.Column(db.Integer, default=0)
    pending_leads = db.Column(db.Integer, default=0)
    total_revenue = db.Column(db.Numeric(12, 2), default=0)
    occupancy_rate = db.Column(db.Numeric(5, 2), default=0)
    pending_payments = db.Column(db.Numeric(12, 2), default=0)
    date = db.Column(db.Date, default=datetime.utcnow().date, unique=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class TokenBlocklist(db.Model):
    __tablename__ = 'token_blocklist'
    
    id = db.Column(db.Integer, primary_key=True)
    jti = db.Column(db.String(36), nullable=False, unique=True)
    token_type = db.Column(db.String(10), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    revoked_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)
    
    user = db.relationship('User', backref=db.backref('tokens', lazy=True))
    
    def __repr__(self):
        return f'<TokenBlocklist {self.jti}>'