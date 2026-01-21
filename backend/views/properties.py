from flask import Blueprint, request, jsonify
from models import Property

properties_bp = Blueprint('properties', __name__)

@properties_bp.route('', methods=['GET'])
def get_all_properties():
    """Get all active properties (public)"""
    properties = Property.query.filter_by(status='active').all()
    
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
            'created_at': prop.created_at.isoformat() if prop.created_at else None
        })
    
    return jsonify(result)

@properties_bp.route('/<property_id>', methods=['GET'])
def get_property(property_id):
    """Get single property by ID (public)"""
    property = Property.query.get(property_id)
    if not property:
        return jsonify({'error': 'Property not found'}), 404
    
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
        'images': property.images or [],
        'tags': property.tags or [],
        'status': property.status,
        'rating': float(property.rating) if property.rating else 0,
        'review_count': property.review_count,
        'bookings': property.bookings_count,
        'is_featured': property.is_featured,
        'created_at': property.created_at.isoformat() if property.created_at else None
    })