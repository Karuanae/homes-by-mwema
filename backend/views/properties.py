from flask import Blueprint, request, jsonify
from models import db, Property, PropertyImage, ImageCategory, DateBlock, Booking
from sqlalchemy import select, func, and_, or_
from datetime import datetime
from collections import defaultdict

properties_bp = Blueprint('properties', __name__)


# ── image helpers ─────────────────────────────────────────────────────────────

def _cover_url(property_id):
    """Return the cover image URL for a property using an ID-only query."""
    row = db.session.execute(
        select(PropertyImage.id)
        .where(PropertyImage.property_id == property_id)
        .where(PropertyImage.is_cover == True)
        .limit(1)
    ).first()
    if row:
        return f"/api/admin/property-image/{row[0]}"
    
    first = db.session.execute(
        select(PropertyImage.id)
        .where(PropertyImage.property_id == property_id)
        .order_by(PropertyImage.id)
        .limit(1)
    ).first()
    return f"/api/admin/property-image/{first[0]}" if first else None


def _all_image_dicts(property_id):
    rows = db.session.execute(
        select(PropertyImage.id, PropertyImage.is_cover, PropertyImage.category)
        .where(PropertyImage.property_id == property_id)
        .order_by(PropertyImage.is_cover.desc(), PropertyImage.id)
    ).fetchall()
    return [
        {
            'id':       r[0],
            'url':      f"/api/admin/property-image/{r[0]}",
            'is_cover': r[1],
            'category': r[2] if r[2] else None,
        }
        for r in rows
    ]


def _host_dict(host):
    if not host:
        return None
    return {
        'id': host.id,
        'name': host.name,
        'avatar': host.avatar_url or 'https://via.placeholder.com/100',
        'is_superhost': False,
        'response_time': '1 hour',
        'response_rate': 98,
    }


def _prop_list_dict(prop):
    cover = _cover_url(prop.id)
    return {
        'id': prop.id,
        'name': prop.name,
        'title': prop.title or prop.name,
        'type': prop.type,
        'price': float(prop.price) if prop.price else 0,
        'location': prop.location,
        'rooms': prop.rooms,
        'bathrooms': prop.bathrooms,
        'area': prop.area,
        'max_guests': prop.max_guests,
        'amenities': prop.amenities or [],
        'cover_image': cover,
        'images': [{'id': None, 'url': cover, 'is_cover': True, 'category': None}] if cover else [],
        'tags': prop.tags or [],
        'status': prop.status,
        'rating': float(prop.rating) if prop.rating else 0,
        'review_count': prop.review_count,
        'bookings_count': prop.bookings_count,
        'is_featured': prop.is_featured,
        'created_at': prop.created_at.isoformat() if prop.created_at else None,
        'coordinates': {
            'lat': float(prop.latitude) if prop.latitude else None,
            'lng': float(prop.longitude) if prop.longitude else None,
        } if prop.latitude and prop.longitude else None,
    }


def _prop_detail_dict(prop):
    image_dicts = _all_image_dicts(prop.id)
    cover = image_dicts[0]['url'] if image_dicts else None

    cats = (
        ImageCategory.query
        .filter_by(property_id=prop.id)
        .order_by(ImageCategory.sort_order, ImageCategory.id)
        .all()
    )

    return {
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
            'bathrooms': prop.bathrooms,
        },
        'amenities': prop.amenities or [],
        'images': image_dicts,
        'cover_image': cover,
        'image_categories': [c.to_dict() for c in cats],
        'tags': prop.tags or [],
        'status': prop.status,
        'rating': float(prop.rating) if prop.rating else 0,
        'review_count': prop.review_count,
        'bookings_count': prop.bookings_count,
        'is_featured': prop.is_featured,
        'host': _host_dict(prop.host),
        'created_at': prop.created_at.isoformat() if prop.created_at else None,
        'coordinates': {
            'lat': float(prop.latitude) if prop.latitude else None,
            'lng': float(prop.longitude) if prop.longitude else None,
        } if prop.latitude and prop.longitude else None,
        'formatted_address': prop.formatted_address,
        'place_id': prop.place_id,
    }


# ── routes ───────────────────────────────────────────────────────────────────

@properties_bp.route('', methods=['GET'])
def get_all_properties():
    try:
        properties = (
            Property.query
            .filter_by(status='active')
            .order_by(Property.created_at.desc())
            .all()
        )
        return jsonify([_prop_list_dict(p) for p in properties])
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@properties_bp.route('/<int:property_id>', methods=['GET'])
def get_property(property_id):
    try:
        prop = Property.query.get(property_id)
        if not prop or prop.status != 'active':
            return jsonify({'error': 'Property not found'}), 404
        return jsonify(_prop_detail_dict(prop))
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@properties_bp.route('/featured', methods=['GET'])
def get_featured_properties():
    properties = (
        Property.query
        .filter_by(status='active', is_featured=True)
        .order_by(Property.created_at.desc())
        .all()
    )
    return jsonify([_prop_list_dict(p) for p in properties])


@properties_bp.route('/search', methods=['POST'])
def search_properties():
    data = request.json or {}
    query = Property.query.filter_by(status='active')

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

    properties = query.order_by(Property.created_at.desc()).all()
    return jsonify([_prop_list_dict(p) for p in properties])


@properties_bp.route('/<int:property_id>/availability', methods=['GET'])
def check_availability(property_id):
    """
    Check if property is available for given dates.
    FIX: Only confirmed, completed, active, or upcoming paid bookings block dates.
    """
    prop = Property.query.get(property_id)
    if not prop or prop.status != 'active':
        return jsonify({'error': 'Property not found'}), 404

    check_in  = request.args.get('check_in')
    check_out = request.args.get('check_out')

    if not check_in or not check_out:
        return jsonify({'error': 'check_in and check_out dates required'}), 400

    try:
        check_in_date  = datetime.strptime(check_in,  '%Y-%m-%d').date()
        check_out_date = datetime.strptime(check_out, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400

    conflict = db.session.query(Booking.id).filter(
        Booking.property_id == property_id,
        Booking.check_in < check_out_date,
        Booking.check_out > check_in_date,
        Booking.status.in_(['confirmed', 'upcoming', 'active', 'completed']),
        Booking.payment_status == 'completed'
    ).first()
    
    block = DateBlock.query.filter(
        DateBlock.property_id == property_id,
        DateBlock.check_in < check_out_date,
        DateBlock.check_out > check_in_date
    ).first()
    
    available = not conflict and not block
    return jsonify({
        'available': available,
        'property_id': property_id,
        'check_in': check_in,
        'check_out': check_out,
        'message': 'Property is available for these dates' if available else 'Property is not available for these dates',
    })


@properties_bp.route('/<int:property_id>/categories', methods=['GET'])
def get_property_categories(property_id):
    try:
        prop = Property.query.get(property_id)
        if not prop or prop.status != 'active':
            return jsonify({'error': 'Property not found'}), 404
        
        cats = (
            ImageCategory.query
            .filter_by(property_id=property_id)
            .order_by(ImageCategory.sort_order, ImageCategory.id)
            .all()
        )
        return jsonify([c.to_dict() for c in cats])
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500