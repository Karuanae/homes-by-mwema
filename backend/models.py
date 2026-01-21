from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import MetaData
from werkzeug.security import generate_password_hash, check_password_hash

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
    specs = db.Column(db.JSON)  # {'guests': 2, 'bedrooms': 1, 'beds': 1, 'bathrooms': 1}
    amenities = db.Column(db.JSON)  # List of amenities
    images = db.Column(db.JSON)  # List of image URLs
    tags = db.Column(db.JSON)  # List of tags
    status = db.Column(db.String(20), default='active')  # 'active', 'inactive', 'maintenance'
    rating = db.Column(db.Numeric(3, 2), default=0)
    review_count = db.Column(db.Integer, default=0)
    bookings_count = db.Column(db.Integer, default=0)
    is_featured = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    bookings = db.relationship('Booking', backref='property', lazy=True)
    payments = db.relationship('Payment', backref='property', lazy=True)
    chats = db.relationship('Chat', backref='property', lazy=True)

class Booking(db.Model):
    __tablename__ = 'bookings'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    property_id = db.Column(db.Integer, db.ForeignKey('properties.id'), nullable=False)
    check_in = db.Column(db.Date, nullable=False)
    check_out = db.Column(db.Date, nullable=False)
    guests = db.Column(db.JSON)  # {'adults': 2, 'children': 0, 'infants': 0}
    nights = db.Column(db.Integer, nullable=False)
    base_amount = db.Column(db.Numeric(10, 2), nullable=False)
    cleaning_fee = db.Column(db.Numeric(10, 2), default=1500)
    service_fee = db.Column(db.Numeric(10, 2), default=0)
    total_amount = db.Column(db.Numeric(10, 2), nullable=False)
    pending_amount = db.Column(db.Numeric(10, 2), default=0)
    payment_type = db.Column(db.String(20), default='full')  # 'full', 'partial'
    payment_method = db.Column(db.String(20))  # 'mpesa', 'card', 'bank', 'cash'
    payment_status = db.Column(db.String(20), default='pending')  # 'pending', 'partial', 'completed', 'failed'
    confirmation = db.Column(db.String(20), default='pending')  # 'pending', 'confirmed', 'cancelled'
    status = db.Column(db.String(20), default='upcoming')  # 'upcoming', 'active', 'completed', 'cancelled'
    message_to_host = db.Column(db.Text)
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
    payment_date = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Chat(db.Model):
    __tablename__ = 'chats'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    property_id = db.Column(db.Integer, db.ForeignKey('properties.id'))
    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.id'))
    chat_type = db.Column(db.String(20), default='general')  # 'general', 'booking', 'inquiry', 'lead'
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