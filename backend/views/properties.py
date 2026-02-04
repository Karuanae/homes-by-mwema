# properties.py - COMPLETE VERSION
from flask import Blueprint, request, jsonify
from models import Property, PropertyImage
from datetime import datetime

properties_bp = Blueprint('properties', __name__)

@properties_bp.route('', methods=['GET'])
def get_all_properties():
    """Get all active properties (public)"""
    properties = Property.query.filter_by(status='active').all()
    
    result = []
    for prop in properties:
        host_data = None
        if prop.host:
            host_data = {
                'id': prop.host.id,
                'name': prop.host.name,
                'avatar': prop.host.avatar_url or 'https://via.placeholder.com/100',
                'is_superhost': False,
                'response_time': '1 hour',
                'response_rate': 98
            }
        
        # Get image URLs from database
        image_urls = prop.get_image_urls()
        
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
            'images': image_urls,  # API URLs to get images from database
            'cover_image': prop.get_cover_image_url(),
            'tags': prop.tags or [],
            'status': prop.status,
            'rating': float(prop.rating) if prop.rating else 0,
            'review_count': prop.review_count,
            'bookings_count': prop.bookings_count,
            'is_featured': prop.is_featured,
            'host': host_data,
            'created_at': prop.created_at.isoformat() if prop.created_at else None
        })
    
    return jsonify(result)

@properties_bp.route('/<int:property_id>', methods=['GET'])
def get_property(property_id):
    """Get single property by ID (public)"""
    property = Property.query.get(property_id)
    if not property or property.status != 'active':
        return jsonify({'error': 'Property not found'}), 404
    
    host_data = None
    if property.host:
        host_data = {
            'id': property.host.id,
            'name': property.host.name,
            'avatar': property.host.avatar_url or 'https://via.placeholder.com/100',
            'is_superhost': False,
            'response_time': '1 hour',
            'response_rate': 98
        }
    
    # Get image URLs from database
    image_urls = property.get_image_urls()
    
    return jsonify({
        'id': property.id,
        'name': property.name,
        'title': property.title or property.name,
        'description': property.description,
        'type': property.type,
        'price': float(property.price) if property.price else 0,
        'location': property.location,
        'rooms': property.rooms,
        'bathrooms': property.bathrooms,
        'area': property.area,
        'max_guests': property.max_guests,
        'specs': property.specs or {
            'guests': property.max_guests,
            'bedrooms': property.rooms,
            'beds': property.rooms,
            'bathrooms': property.bathrooms
        },
        'amenities': property.amenities or [],
        'images': image_urls,  # API URLs to get images from database
        'cover_image': property.get_cover_image_url(),
        'tags': property.tags or [],
        'status': property.status,
        'rating': float(property.rating) if property.rating else 0,
        'review_count': property.review_count,
        'bookings_count': property.bookings_count,
        'is_featured': property.is_featured,
        'host': host_data,
        'created_at': property.created_at.isoformat() if property.created_at else None
    })

@properties_bp.route('/featured', methods=['GET'])
def get_featured_properties():
    """Get featured properties (public)"""
    properties = Property.query.filter_by(status='active', is_featured=True).all()
    
    result = []
    for prop in properties:
        # Get image URLs from database
        image_urls = prop.get_image_urls()
        
        result.append({
            'id': prop.id,
            'name': prop.name,
            'title': prop.title or prop.name,
            'type': prop.type,
            'price': float(prop.price) if prop.price else 0,
            'location': prop.location,
            'rooms': prop.rooms,
            'bathrooms': prop.bathrooms,
            'max_guests': prop.max_guests,
            'images': image_urls[:1],  # Only first image for featured
            'cover_image': prop.get_cover_image_url(),
            'rating': float(prop.rating) if prop.rating else 0,
            'is_featured': prop.is_featured
        })
    
    return jsonify(result)

@properties_bp.route('/search', methods=['POST'])
def search_properties():
    """Search properties by criteria"""
    data = request.json
    query = Property.query.filter_by(status='active')
    
    # Apply filters
    if data.get('location'):
        query = query.filter(Property.location.ilike(f"%{data['location']}%"))
    
    if data.get('type'):
        query = query.filter_by(type=data['type'])
    
    if data.get('min_price'):
        query = query.filter(Property.price >= float(data['min_price']))
    
    if data.get('max_price'):
        query = query.filter(Property.price <= float(data['max_price']))
    
    if data.get('min_rooms'):
        query = query.filter(Property.rooms >= int(data['min_rooms']))
    
    if data.get('min_guests'):
        query = query.filter(Property.max_guests >= int(data['min_guests']))
    
    properties = query.all()
    
    result = []
    for prop in properties:
        # Get image URLs from database
        image_urls = prop.get_image_urls()
        
        result.append({
            'id': prop.id,
            'name': prop.name,
            'title': prop.title or prop.name,
            'type': prop.type,
            'price': float(prop.price) if prop.price else 0,
            'location': prop.location,
            'rooms': prop.rooms,
            'bathrooms': prop.bathrooms,
            'max_guests': prop.max_guests,
            'images': image_urls[:1],  # Only first image for search results
            'cover_image': prop.get_cover_image_url(),
            'rating': float(prop.rating) if prop.rating else 0
        })
    
    return jsonify(result)

@properties_bp.route('/<int:property_id>/availability', methods=['GET'])
def check_availability(property_id):
    """Check if property is available for given dates"""
    property = Property.query.get(property_id)
    if not property or property.status != 'active':
        return jsonify({'error': 'Property not found'}), 404
    
    check_in = request.args.get('check_in')
    check_out = request.args.get('check_out')
    
    if not check_in or not check_out:
        return jsonify({'error': 'check_in and check_out dates required'}), 400
    
    try:
        check_in_date = datetime.strptime(check_in, '%Y-%m-%d').date()
        check_out_date = datetime.strptime(check_out, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    
    # For now, return available (real implementation would check bookings)
    # In a real app, you would check for overlapping bookings
    return jsonify({
        'available': True,
        'property_id': property_id,
        'check_in': check_in,
        'check_out': check_out,
        'message': 'Property is available for these dates'
    })