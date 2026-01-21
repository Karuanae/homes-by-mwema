from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, Property, Booking, Payment, Lead, HomepageContent, AdminStats
from werkzeug.exceptions import Forbidden
from datetime import datetime, timedelta
from decimal import Decimal

admin_bp = Blueprint('admin', __name__)

def require_admin():
    """Check if current user is admin"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user or user.role != 'admin':
        raise Forbidden('Admin access required')

# ========== PROPERTY MANAGEMENT ==========
@admin_bp.route('/properties', methods=['GET'])
@jwt_required()
def admin_get_properties():
    """Admin: Get all properties (including inactive)"""
    require_admin()
    properties = Property.query.all()
    
    result = []
    for prop in properties:
        result.append({
            'id': prop.id,
            'name': prop.name,
            'title': prop.title or prop.name,
            'description': prop.description,
            'type': prop.type,
            'price': float(prop.price) if prop.price else 0,
            'location': prop.location,
            'rooms': prop.rooms,
            'bathrooms': prop.bathrooms,
            'area': prop.area,
            'max_guests': prop.max_guests,
            'specs': prop.specs or {
                'guests': prop.max_guests,
                'bedrooms': prop.rooms,
                'beds': prop.rooms,
                'bathrooms': prop.bathrooms
            },
            'amenities': prop.amenities or [],
            'images': prop.images or [],
            'tags': prop.tags or [],
            'status': prop.status,
            'rating': float(prop.rating) if prop.rating else 0,
            'review_count': prop.review_count,
            'bookings': prop.bookings_count,
            'is_featured': prop.is_featured,
            'created_at': prop.created_at.isoformat() if prop.created_at else None,
            'updated_at': prop.updated_at.isoformat() if prop.updated_at else None
        })
    
    return jsonify(result)

@admin_bp.route('/properties', methods=['POST'])
@jwt_required()
def admin_create_property():
    """Admin: Create new property"""
    require_admin()
    
    data = request.json
    
    # Validate required fields
    required_fields = ['name', 'type', 'price', 'location']
    for field in required_fields:
        if field not in data or not data[field]:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    # Create new property
    new_property = Property(
        name=data['name'],
        title=data.get('title', data['name']),
        type=data['type'],
        price=Decimal(str(data['price'])),
        location=data['location'],
        description=data.get('description', ''),
        rooms=data.get('rooms', 1),
        bathrooms=data.get('bathrooms', 1),
        max_guests=data.get('max_guests', data.get('maxGuests', 2)),
        area=data.get('area', ''),
        specs=data.get('specs', {
            'guests': data.get('max_guests', data.get('maxGuests', 2)),
            'bedrooms': data.get('rooms', 1),
            'beds': data.get('rooms', 1),
            'bathrooms': data.get('bathrooms', 1)
        }),
        amenities=data.get('amenities', []),
        images=data.get('images', []),
        tags=data.get('tags', []),
        status='active'
    )
    
    db.session.add(new_property)
    db.session.commit()
    
    return jsonify({
        'id': new_property.id,
        'name': new_property.name,
        'type': new_property.type,
        'price': float(new_property.price) if new_property.price else 0,
        'location': new_property.location,
        'status': new_property.status,
        'created_at': new_property.created_at.isoformat() if new_property.created_at else None
    }), 201

@admin_bp.route('/properties/<property_id>', methods=['PUT'])
@jwt_required()
def admin_update_property(property_id):
    """Admin: Update property"""
    require_admin()
    
    property = Property.query.get(property_id)
    if not property:
        return jsonify({'error': 'Property not found'}), 404
    
    data = request.json
    
    # Update fields if provided
    if 'name' in data:
        property.name = data['name']
    if 'title' in data:
        property.title = data['title']
    if 'type' in data:
        property.type = data['type']
    if 'price' in data:
        property.price = Decimal(str(data['price']))
    if 'location' in data:
        property.location = data['location']
    if 'description' in data:
        property.description = data['description']
    if 'rooms' in data:
        property.rooms = data['rooms']
    if 'bathrooms' in data:
        property.bathrooms = data['bathrooms']
    if 'max_guests' in data:
        property.max_guests = data['max_guests']
    if 'area' in data:
        property.area = data['area']
    if 'specs' in data:
        property.specs = data['specs']
    if 'amenities' in data:
        property.amenities = data['amenities']
    if 'images' in data:
        property.images = data['images']
    if 'tags' in data:
        property.tags = data['tags']
    if 'status' in data:
        property.status = data['status']
    if 'rating' in data:
        property.rating = Decimal(str(data['rating'])) if data['rating'] else 0
    if 'is_featured' in data:
        property.is_featured = data['is_featured']
    
    db.session.commit()
    
    return jsonify({
        'id': property.id,
        'name': property.name,
        'type': property.type,
        'price': float(property.price) if property.price else 0,
        'location': property.location,
        'status': property.status,
        'updated_at': property.updated_at.isoformat() if property.updated_at else None
    })

@admin_bp.route('/properties/<property_id>', methods=['DELETE'])
@jwt_required()
def admin_delete_property(property_id):
    """Admin: Soft delete property (change status to inactive)"""
    require_admin()
    
    property = Property.query.get(property_id)
    if not property:
        return jsonify({'error': 'Property not found'}), 404
    
    property.status = 'inactive'
    db.session.commit()
    
    return jsonify({'message': 'Property deleted successfully'})

# ========== STATISTICS ==========
@admin_bp.route('/stats', methods=['GET'])
@jwt_required()
def admin_get_stats():
    """Admin: Get dashboard statistics"""
    require_admin()
    
    # Calculate stats
    total_properties = Property.query.filter_by(status='active').count()
    active_bookings = Booking.query.filter(Booking.status.in_(['upcoming', 'active'])).count()
    pending_leads = Lead.query.filter_by(status='new').count()
    
    # Calculate revenue from completed payments
    completed_payments = Payment.query.filter_by(status='completed').all()
    total_revenue = sum(float(p.amount) for p in completed_payments) if completed_payments else 0
    
    # Simple occupancy rate calculation
    total_booked_nights = sum(b.nights for b in Booking.query.filter_by(status='upcoming').all())
    total_property_nights = total_properties * 30  # Assume 30 days per property
    occupancy_rate = (total_booked_nights / total_property_nights * 100) if total_property_nights > 0 else 0
    
    # Pending payments
    pending_payments = Payment.query.filter_by(status='pending').all()
    total_pending = sum(float(p.amount) for p in pending_payments) if pending_payments else 0
    
    return jsonify({
        'totalProperties': total_properties,
        'activeBookings': active_bookings,
        'pendingLeads': pending_leads,
        'revenue': total_revenue,
        'occupancyRate': round(occupancy_rate, 2),
        'pendingPayments': total_pending
    })

# ========== USER MANAGEMENT ==========
@admin_bp.route('/users', methods=['GET'])
@jwt_required()
def admin_get_users():
    """Admin: Get all users"""
    require_admin()
    users = User.query.all()
    
    result = []
    for user in users:
        result.append({
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'phone': user.phone,
            'role': user.role,
            'is_guest': user.is_guest,
            'avatar_url': user.avatar_url,
            'created_at': user.created_at.isoformat() if user.created_at else None,
            'bookings_count': len(user.bookings)
        })
    
    return jsonify(result)

# ========== BOOKING MANAGEMENT ==========
@admin_bp.route('/bookings', methods=['GET'])
@jwt_required()
def admin_get_bookings():
    """Admin: Get all bookings"""
    require_admin()
    bookings = Booking.query.all()
    
    result = []
    for booking in bookings:
        result.append({
            'id': booking.id,
            'guestName': booking.user.name if booking.user else 'Guest',
            'email': booking.user.email if booking.user else '',
            'property': booking.property.name if booking.property else '',
            'propertyName': booking.property.name if booking.property else '',
            'propertyLocation': booking.property.location if booking.property else '',
            'propertyImage': booking.property.images[0] if booking.property and booking.property.images else '',
            'checkIn': booking.check_in.isoformat() if booking.check_in else None,
            'checkOut': booking.check_out.isoformat() if booking.check_out else None,
            'nights': booking.nights,
            'guests': booking.guests or {'adults': 1, 'children': 0, 'infants': 0},
            'amount': float(booking.base_amount) if booking.base_amount else 0,
            'totalAmount': float(booking.total_amount) if booking.total_amount else 0,
            'pendingAmount': float(booking.pending_amount) if booking.pending_amount else 0,
            'paymentMethod': booking.payment_method,
            'paymentStatus': booking.payment_status,
            'confirmation': booking.confirmation,
            'status': booking.status,
            'createdAt': booking.created_at.isoformat() if booking.created_at else None
        })
    
    return jsonify(result)

# ========== PAYMENT MANAGEMENT ==========
@admin_bp.route('/payments', methods=['GET'])
@jwt_required()
def admin_get_payments():
    """Admin: Get all payments"""
    require_admin()
    payments = Payment.query.all()
    
    result = []
    for payment in payments:
        result.append({
            'id': payment.id,
            'bookingId': payment.booking_id,
            'guestName': payment.guest_name,
            'property': payment.property.name if payment.property else '',
            'amount': float(payment.amount) if payment.amount else 0,
            'method': payment.method,
            'status': payment.status,
            'date': payment.payment_date.strftime('%Y-%m-%d') if payment.payment_date else '',
            'transactionId': payment.transaction_id or ''
        })
    
    return jsonify(result)

# ========== LEAD MANAGEMENT ==========
@admin_bp.route('/leads', methods=['GET'])
@jwt_required()
def admin_get_leads():
    """Admin: Get all leads"""
    require_admin()
    leads = Lead.query.all()
    
    result = []
    for lead in leads:
        result.append({
            'id': lead.id,
            'name': lead.name,
            'email': lead.email,
            'phone': lead.phone,
            'source': lead.source,
            'status': lead.status,
            'priority': lead.priority,
            'assignedTo': lead.assigned_to.name if lead.assigned_to else None,
            'propertyInterest': lead.property_interest,
            'message': lead.message,
            'followUpDate': lead.follow_up_date.isoformat() if lead.follow_up_date else None,
            'createdAt': lead.created_at.isoformat() if lead.created_at else None
        })
    
    return jsonify(result)

# ========== HOMEPAGE CONTENT (Minimal) ==========
@admin_bp.route('/homepage', methods=['GET'])
@jwt_required()
def admin_get_homepage():
    """Admin: Get homepage content (read-only since it's static)"""
    require_admin()
    
    content = HomepageContent.query.first()
    if not content:
        return jsonify({
            'message': 'Homepage content is embedded in frontend',
            'hero_images': [],
            'featured_properties': [],
            'premium_badges': [],
            'testimonials': [],
            'faqs': []
        })
    
    return jsonify({
        'hero_images': content.hero_images or [],
        'featured_properties': content.featured_properties or [],
        'premium_badges': content.premium_badges or [],
        'testimonials': content.testimonials or [],
        'faqs': content.faqs or []
    })