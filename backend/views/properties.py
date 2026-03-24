from flask import Blueprint, request, jsonify
from models import db, Property, PropertyImage, ImageCategory
from sqlalchemy import select, func
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
    
    # Fall back to the first image if no cover is flagged
    first = db.session.execute(
        select(PropertyImage.id)
        .where(PropertyImage.property_id == property_id)
        .order_by(PropertyImage.id)
        .limit(1)
    ).first()
    return f"/api/admin/property-image/{first[0]}" if first else None


def _all_image_dicts(property_id):
    """
    Return list of image dicts including category.
    Cover image is first (is_cover=True).
    No binary data loaded.
    """
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
            'category': r[2],
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
    """Lightweight serialiser for list views (homepage / properties page)."""
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
        # images list for cards: just the cover, as an object for shape consistency
        'images': [{'id': None, 'url': cover, 'is_cover': True, 'category': None}] if cover else [],
        'tags': prop.tags or [],
        'status': prop.status,
        'rating': float(prop.rating) if prop.rating else 0,
        'review_count': prop.review_count,
        'bookings_count': prop.bookings_count,
        'is_featured': prop.is_featured,
        'created_at': prop.created_at.isoformat() if prop.created_at else None,
    }


def _prop_detail_dict(prop):
    """Full serialiser for single-property detail view with categories."""
    image_dicts = _all_image_dicts(prop.id)
    cover = image_dicts[0]['url'] if image_dicts else None

    # Include categories so the frontend can build tabs without a second request
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
        'images': image_dicts,   # now objects with {id, url, is_cover, category}
        'cover_image': cover,
        'image_categories': [c.to_dict() for c in cats],  # bundled for convenience
        'tags': prop.tags or [],
        'status': prop.status,
        'rating': float(prop.rating) if prop.rating else 0,
        'review_count': prop.review_count,
        'bookings_count': prop.bookings_count,
        'is_featured': prop.is_featured,
        'host': _host_dict(prop.host),
        'created_at': prop.created_at.isoformat() if prop.created_at else None,
    }


# ── routes ───────────────────────────────────────────────────────────────────

@properties_bp.route('', methods=['GET'])
def get_all_properties():
    """Get all active properties (public) — list view, cover image only."""
    properties = (
        Property.query
        .filter_by(status='active')
        .order_by(Property.created_at.desc())
        .all()
    )
    return jsonify([_prop_list_dict(p) for p in properties])


@properties_bp.route('/<int:property_id>', methods=['GET'])
def get_property(property_id):
    """Get single property by ID (public) — full detail with all images and categories."""
    prop = Property.query.get(property_id)
    if not prop or prop.status != 'active':
        return jsonify({'error': 'Property not found'}), 404
    return jsonify(_prop_detail_dict(prop))


@properties_bp.route('/featured', methods=['GET'])
def get_featured_properties():
    """Get featured properties (public) — cover image only."""
    properties = (
        Property.query
        .filter_by(status='active', is_featured=True)
        .order_by(Property.created_at.desc())
        .all()
    )
    return jsonify([_prop_list_dict(p) for p in properties])


@properties_bp.route('/search', methods=['POST'])
def search_properties():
    """Search properties by criteria — cover image only."""
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
    """Check if property is available for given dates."""
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

    return jsonify({
        'available': True,
        'property_id': property_id,
        'check_in': check_in,
        'check_out': check_out,
        'message': 'Property is available for these dates',
    })