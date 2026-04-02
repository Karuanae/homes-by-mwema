from flask import Blueprint, request, jsonify, Response
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, Property, Booking, Payment, Lead, HomepageContent, AdminStats, PropertyImage, Chat, ChatMessage, ImageCategory, Notification
from werkzeug.exceptions import Forbidden
from datetime import datetime, timedelta
from decimal import Decimal
from sqlalchemy import func, extract, case, select as sa_select
import os
from werkzeug.utils import secure_filename
import uuid
import base64
import json
import logging
import re as _re

admin_bp = Blueprint('admin', __name__)
logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def require_admin():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user or user.role != 'admin':
        raise Forbidden('Admin access required')

def _slugify(text: str) -> str:
    """Convert display name → url-safe slug."""
    slug = text.strip().lower()
    slug = _re.sub(r'[^a-z0-9]+', '-', slug)
    slug = slug.strip('-')
    return slug or 'category'


# ── ID-only image helpers ─────────────────────────────────────────────────────
# These never load PropertyImage.image_data (the binary blob).
# Only the integer ID column is fetched, keeping list endpoints fast.

def _admin_cover_url(property_id):
    """Return cover image URL using an ID-only query."""
    row = db.session.execute(
        sa_select(PropertyImage.id)
        .where(PropertyImage.property_id == property_id)
        .where(PropertyImage.is_cover == True)
        .limit(1)
    ).first()
    if row:
        return f"/api/admin/property-image/{row[0]}"
    # Fallback: first image by ID if no cover is flagged
    first = db.session.execute(
        sa_select(PropertyImage.id)
        .where(PropertyImage.property_id == property_id)
        .order_by(PropertyImage.id)
        .limit(1)
    ).first()
    return f"/api/admin/property-image/{first[0]}" if first else None


def _admin_all_image_urls(property_id):
    """Return all image URLs — cover first, then gallery ordered by ID."""
    rows = db.session.execute(
        sa_select(PropertyImage.id)
        .where(PropertyImage.property_id == property_id)
        .order_by(PropertyImage.is_cover.desc(), PropertyImage.id)
    ).fetchall()
    return [f"/api/admin/property-image/{r[0]}" for r in rows]


def _admin_image_dicts(property_id):
    """
    Return list of {id, url, is_cover, category} for a property.
    No binary data loaded.
    """
    rows = db.session.execute(
        sa_select(PropertyImage.id, PropertyImage.is_cover, PropertyImage.category)
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


# ═════════════════════════════════════════════════════════════════════════════
# PROPERTY WITH IMAGES
# ═════════════════════════════════════════════════════════════════════════════

@admin_bp.route('/properties/with-images', methods=['POST'])
@jwt_required()
def create_property_with_images():
    require_admin()
    user_id = get_jwt_identity()
    if not request.content_type or 'multipart/form-data' not in request.content_type:
        return jsonify({'error': 'Content-Type must be multipart/form-data'}), 400
    try:
        name = request.form.get('name')
        ptype = request.form.get('type')
        price = request.form.get('price')
        location = request.form.get('location')
        if not all([name, ptype, price, location]):
            return jsonify({'error': 'Missing required fields: name, type, price, location'}), 400
        description = request.form.get('description', '')
        
        # NEW: Get coordinates from form data
        latitude = request.form.get('latitude')
        longitude = request.form.get('longitude')
        formatted_address = request.form.get('formatted_address')
        place_id = request.form.get('place_id')
        
        try:
            amenities = json.loads(request.form.get('amenities', '[]'))
            specs = json.loads(request.form.get('specs', '{}'))
            tags = json.loads(request.form.get('tags', '[]'))
        except json.JSONDecodeError:
            amenities, specs, tags = [], {}, []
            
        new_property = Property(
            name=name, title=request.form.get('title', name), type=ptype,
            price=Decimal(str(price)), location=location, description=description,
            rooms=int(request.form.get('rooms', 1)),
            bathrooms=int(request.form.get('bathrooms', 1)),
            max_guests=int(request.form.get('max_guests', request.form.get('maxGuests', 2))),
            area=request.form.get('area', ''), host_id=user_id,
            specs=specs if specs else {
                'guests': int(request.form.get('max_guests', request.form.get('maxGuests', 2))),
                'bedrooms': int(request.form.get('rooms', 1)),
                'beds': int(request.form.get('rooms', 1)),
                'bathrooms': int(request.form.get('bathrooms', 1))
            },
            amenities=amenities, tags=tags, status='active',
            # NEW: Set coordinates
            latitude=Decimal(str(latitude)) if latitude else None,
            longitude=Decimal(str(longitude)) if longitude else None,
            formatted_address=formatted_address,
            place_id=place_id,
        )
        db.session.add(new_property)
        db.session.flush()
        cover_image = request.files.get('coverImage')
        cover_image_saved = False
        if cover_image and allowed_file(cover_image.filename):
            try:
                db.session.add(PropertyImage(
                    image_data=cover_image.read(), filename=secure_filename(cover_image.filename),
                    mime_type=cover_image.mimetype, property_id=new_property.id, is_cover=True
                ))
                cover_image_saved = True
            except Exception as e:
                print(f"Error saving cover image: {e}")
        gallery_images_saved = 0
        for i, image in enumerate(request.files.getlist('galleryImages')):
            if image and image.filename and allowed_file(image.filename):
                try:
                    db.session.add(PropertyImage(
                        image_data=image.read(), filename=secure_filename(image.filename),
                        mime_type=image.mimetype, property_id=new_property.id, is_cover=False
                    ))
                    gallery_images_saved += 1
                except Exception as e:
                    print(f"Error saving gallery image {i}: {e}")
        if not cover_image_saved and gallery_images_saved > 0:
            first = PropertyImage.query.filter_by(property_id=new_property.id, is_cover=False).first()
            if first:
                first.is_cover = True
        db.session.commit()
        all_dicts = _admin_image_dicts(new_property.id)
        all_urls = [img['url'] for img in all_dicts]
        cover_url = all_urls[0] if all_urls else None
        return jsonify({
            'id': new_property.id, 'name': new_property.name, 'type': new_property.type,
            'price': float(new_property.price) if new_property.price else 0,
            'location': new_property.location,
            'description': new_property.description,
            'rooms': new_property.rooms, 'bathrooms': new_property.bathrooms,
            'max_guests': new_property.max_guests, 'area': new_property.area,
            'specs': new_property.specs, 'amenities': new_property.amenities,
            'tags': new_property.tags, 'status': new_property.status,
            'images': all_urls,
            'cover_image': cover_url,
            'created_at': new_property.created_at.isoformat() if new_property.created_at else None,
            # NEW: Return coordinates
            'coordinates': {
                'lat': float(new_property.latitude) if new_property.latitude else None,
                'lng': float(new_property.longitude) if new_property.longitude else None,
            } if new_property.latitude and new_property.longitude else None,
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create property: {str(e)}'}), 500


@admin_bp.route('/properties/<int:property_id>/images', methods=['POST'])
@jwt_required()
def add_property_images(property_id):
    require_admin()
    prop = Property.query.get(property_id)
    if not prop:
        return jsonify({'error': 'Property not found'}), 404
    try:
        images_added = []
        cover_image = request.files.get('coverImage')
        if cover_image and allowed_file(cover_image.filename):
            try:
                PropertyImage.query.filter_by(property_id=property_id, is_cover=True).update({'is_cover': False})
                db.session.add(PropertyImage(
                    image_data=cover_image.read(), filename=secure_filename(cover_image.filename),
                    mime_type=cover_image.mimetype, property_id=prop.id, is_cover=True
                ))
                images_added.append({'type': 'cover', 'filename': cover_image.filename})
            except Exception as e:
                print(f"Error saving cover image: {e}")
        for i, image in enumerate(request.files.getlist('galleryImages')):
            if image and image.filename and allowed_file(image.filename):
                try:
                    db.session.add(PropertyImage(
                        image_data=image.read(), filename=secure_filename(image.filename),
                        mime_type=image.mimetype, property_id=prop.id, is_cover=False
                    ))
                    images_added.append({'type': 'gallery', 'filename': image.filename})
                except Exception as e:
                    print(f"Error saving gallery image {i}: {e}")
        db.session.commit()
        return jsonify({
            'success': True,
            'message': f'Added {len(images_added)} image(s)',
            'images_added': images_added,
            'total_images': db.session.execute(
                sa_select(func.count(PropertyImage.id))
                .where(PropertyImage.property_id == property_id)
            ).scalar()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to add images: {str(e)}'}), 500


@admin_bp.route('/upload/property-image', methods=['POST'])
@jwt_required()
def upload_property_image_db():
    require_admin()
    if 'image' not in request.files:
        return jsonify({'error': 'No image file'}), 400
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type'}), 400
    try:
        property_id = request.form.get('property_id')
        if property_id and property_id.strip():
            try:
                pid = int(property_id)
                if not Property.query.get(pid):
                    return jsonify({'error': f'Property {property_id} not found'}), 404
                property_id = pid
            except (ValueError, TypeError):
                return jsonify({'error': 'Invalid property ID format'}), 400
        else:
            property_id = None
        is_cover = request.form.get('is_cover', 'false').lower() == 'true'
        pi = PropertyImage(image_data=file.read(), filename=secure_filename(file.filename),
                           mime_type=file.mimetype, property_id=property_id, is_cover=is_cover)
        db.session.add(pi)
        db.session.commit()
        return jsonify({'success': True, 'image_id': pi.id, 'property_id': pi.property_id,
                        'filename': pi.filename, 'mime_type': pi.mime_type, 'is_cover': is_cover,
                        'url': f"/api/admin/property-image/{pi.id}"})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to save image: {str(e)}'}), 500


@admin_bp.route('/upload/property-images', methods=['POST'])
@jwt_required()
def upload_property_images_db():
    require_admin()
    if 'images' not in request.files:
        return jsonify({'error': 'No images uploaded'}), 400
    files = request.files.getlist('images')
    if not files or files[0].filename == '':
        return jsonify({'error': 'No selected files'}), 400
    property_id = request.form.get('property_id')
    if property_id and property_id.strip():
        try:
            pid = int(property_id)
            if not Property.query.get(pid):
                return jsonify({'error': f'Property {property_id} not found'}), 404
            property_id = pid
        except (ValueError, TypeError):
            return jsonify({'error': 'Invalid property ID format'}), 400
    else:
        property_id = None
    uploaded, errors = [], []
    for i, file in enumerate(files):
        if file and allowed_file(file.filename):
            try:
                is_cover = (i == 0 and request.form.get('first_is_cover', 'false').lower() == 'true')
                pi = PropertyImage(image_data=file.read(), filename=secure_filename(file.filename),
                                   mime_type=file.mimetype, property_id=property_id, is_cover=is_cover)
                db.session.add(pi)
                uploaded.append({'image_id': pi.id, 'property_id': pi.property_id,
                                  'filename': pi.filename, 'mime_type': pi.mime_type, 'is_cover': is_cover,
                                  'url': f"/api/admin/property-image/{pi.id}"})
            except Exception as e:
                errors.append(f"File {file.filename}: {e}")
    db.session.commit()
    if uploaded:
        resp = {'success': True, 'images': uploaded}
        if errors:
            resp['warnings'] = errors
        return jsonify(resp)
    return jsonify({'error': 'No valid images uploaded', 'details': errors}), 400


@admin_bp.route('/property-image/<int:image_id>')
def get_property_image(image_id):
    pi = PropertyImage.query.get(image_id)
    if not pi:
        return jsonify({'error': 'Image not found'}), 404
    return Response(pi.image_data, mimetype=pi.mime_type)


@admin_bp.route('/property-image/<int:image_id>', methods=['DELETE'])
@jwt_required()
def admin_delete_property_image(image_id):
    """Admin: Delete a property image"""
    require_admin()
    image = PropertyImage.query.get(image_id)
    if not image:
        return jsonify({'error': 'Image not found'}), 404
    try:
        db.session.delete(image)
        db.session.commit()
        logger.info(f"✅ Property image {image_id} deleted by admin")
        return jsonify({'success': True, 'message': 'Image deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"❌ Error deleting property image: {str(e)}")
        return jsonify({'error': str(e)}), 500


# ═════════════════════════════════════════════════════════════════════════════
# PROPERTY MANAGEMENT
# ═════════════════════════════════════════════════════════════════════════════

@admin_bp.route('/properties', methods=['GET'])
@jwt_required()
def admin_get_properties():
    require_admin()

    properties = Property.query.order_by(Property.created_at.desc()).all()
    if not properties:
        return jsonify([])

    # ── Single bulk query: fetch ALL image IDs for ALL properties at once ──────
    # This replaces N separate per-property queries with 1 query total.
    property_ids = [p.id for p in properties]
    image_rows = db.session.execute(
        sa_select(PropertyImage.id, PropertyImage.property_id, PropertyImage.is_cover, PropertyImage.category)
        .where(PropertyImage.property_id.in_(property_ids))
        .order_by(PropertyImage.property_id, PropertyImage.is_cover.desc(), PropertyImage.id)
    ).fetchall()

    # Group into {property_id: [{id, url, is_cover, category}, ...]}
    from collections import defaultdict
    images_by_prop = defaultdict(list)
    for img_id, prop_id, is_cover, category in image_rows:
        images_by_prop[prop_id].append({
            'id': img_id,
            'url': f"/api/admin/property-image/{img_id}",
            'is_cover': is_cover,
            'category': category,
        })

    result = []
    for prop in properties:
        images = images_by_prop.get(prop.id, [])
        all_urls = [img['url'] for img in images]
        cover_url = all_urls[0] if all_urls else None

        result.append({
            'id':           prop.id,
            'name':         prop.name,
            'title':        prop.title or prop.name,
            'description':  prop.description,
            'type':         prop.type,
            'price':        float(prop.price) if prop.price else 0,
            'location':     prop.location,
            'rooms':        prop.rooms,
            'bathrooms':    prop.bathrooms,
            'area':         prop.area,
            'max_guests':   prop.max_guests,
            'specs':        prop.specs or {
                'guests':    prop.max_guests,
                'bedrooms':  prop.rooms,
                'beds':      prop.rooms,
                'bathrooms': prop.bathrooms,
            },
            'amenities':    prop.amenities or [],
            'images':       all_urls,
            'image_details': images,  # includes category field
            'cover_image':  cover_url,
            'tags':         prop.tags or [],
            'status':       prop.status,
            'rating':       float(prop.rating) if prop.rating else 0,
            'review_count': prop.review_count,
            'bookings':     prop.bookings_count,
            'is_featured':  prop.is_featured,
            'created_at':   prop.created_at.isoformat() if prop.created_at else None,
            'updated_at':   prop.updated_at.isoformat() if prop.updated_at else None,
            # NEW: Add coordinates
            'coordinates': {
                'lat': float(prop.latitude) if prop.latitude else None,
                'lng': float(prop.longitude) if prop.longitude else None,
            } if prop.latitude and prop.longitude else None,
            'formatted_address': prop.formatted_address,
            'place_id': prop.place_id,
        })
    return jsonify(result)


@admin_bp.route('/properties', methods=['POST'])
@jwt_required()
def admin_create_property():
    require_admin()
    user_id = get_jwt_identity()
    data = request.json
    for field in ['name', 'type', 'price', 'location']:
        if field not in data or not data[field]:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    amenities = data.get('amenities', [])
    if isinstance(amenities, str):
        amenities = [amenities]
    elif not isinstance(amenities, list):
        amenities = []
    
    # NEW: Get coordinates
    latitude = data.get('latitude')
    longitude = data.get('longitude')
    formatted_address = data.get('formatted_address')
    place_id = data.get('place_id')
    
    new_property = Property(
        name=data['name'], title=data.get('title', data['name']), type=data['type'],
        price=Decimal(str(data['price'])), location=data['location'],
        description=data.get('description', ''), rooms=data.get('rooms', 1),
        bathrooms=data.get('bathrooms', 1),
        max_guests=data.get('max_guests', data.get('maxGuests', 2)),
        area=data.get('area', ''), host_id=user_id,
        specs=data.get('specs', {
            'guests': data.get('max_guests', data.get('maxGuests', 2)),
            'bedrooms': data.get('rooms', 1), 'beds': data.get('rooms', 1),
            'bathrooms': data.get('bathrooms', 1)
        }),
        amenities=amenities, tags=data.get('tags', []), status='active',
        # NEW: Set coordinates
        latitude=Decimal(str(latitude)) if latitude else None,
        longitude=Decimal(str(longitude)) if longitude else None,
        formatted_address=formatted_address,
        place_id=place_id,
    )
    db.session.add(new_property)
    db.session.flush()
    if 'image_ids' in data and isinstance(data['image_ids'], list):
        for i, image_id in enumerate(data['image_ids']):
            pi = PropertyImage.query.get(image_id)
            if pi:
                pi.property_id = new_property.id
                if i == 0:
                    PropertyImage.query.filter_by(property_id=new_property.id, is_cover=True).update({'is_cover': False})
                    pi.is_cover = True
    db.session.commit()
    all_dicts = _admin_image_dicts(new_property.id)
    all_urls = [img['url'] for img in all_dicts]
    cover_url = all_urls[0] if all_urls else None
    return jsonify({
        'id': new_property.id, 'name': new_property.name, 'type': new_property.type,
        'price': float(new_property.price) if new_property.price else 0,
        'location': new_property.location, 'status': new_property.status,
        'images': all_urls,
        'image_details': all_dicts,
        'cover_image': cover_url,
        'created_at': new_property.created_at.isoformat() if new_property.created_at else None,
        # NEW: Return coordinates
        'coordinates': {
            'lat': float(new_property.latitude) if new_property.latitude else None,
            'lng': float(new_property.longitude) if new_property.longitude else None,
        } if new_property.latitude and new_property.longitude else None,
    }), 201


@admin_bp.route('/properties/<int:property_id>', methods=['PUT'])
@jwt_required()
def admin_update_property(property_id):
    require_admin()
    prop = Property.query.get(property_id)
    if not prop:
        return jsonify({'error': 'Property not found'}), 404
    data = request.json
    if 'name' in data: prop.name = data['name']
    if 'title' in data: prop.title = data['title']
    if 'type' in data: prop.type = data['type']
    if 'price' in data: prop.price = Decimal(str(data['price']))
    if 'location' in data: prop.location = data['location']
    if 'description' in data: prop.description = data['description']
    if 'rooms' in data: prop.rooms = data['rooms']
    if 'bathrooms' in data: prop.bathrooms = data['bathrooms']
    if 'max_guests' in data: prop.max_guests = data['max_guests']
    if 'area' in data: prop.area = data['area']
    if 'specs' in data: prop.specs = data['specs']
    if 'amenities' in data:
        a = data['amenities']
        prop.amenities = [a] if isinstance(a, str) else a if isinstance(a, list) else []
    if 'tags' in data: prop.tags = data['tags']
    if 'status' in data: prop.status = data['status']
    if 'rating' in data: prop.rating = Decimal(str(data['rating'])) if data['rating'] else 0
    if 'is_featured' in data: prop.is_featured = data['is_featured']
    
    # NEW: Update coordinates
    if 'latitude' in data:
        prop.latitude = Decimal(str(data['latitude'])) if data['latitude'] else None
    if 'longitude' in data:
        prop.longitude = Decimal(str(data['longitude'])) if data['longitude'] else None
    if 'formatted_address' in data:
        prop.formatted_address = data['formatted_address']
    if 'place_id' in data:
        prop.place_id = data['place_id']
    
    if 'image_ids' in data and isinstance(data['image_ids'], list):
        PropertyImage.query.filter_by(property_id=prop.id).update({'property_id': None, 'is_cover': False})
        for i, image_id in enumerate(data['image_ids']):
            pi = PropertyImage.query.get(image_id)
            if pi:
                pi.property_id = prop.id
                if i == 0: pi.is_cover = True
    db.session.commit()
    all_dicts = _admin_image_dicts(prop.id)
    all_urls = [img['url'] for img in all_dicts]
    cover_url = all_urls[0] if all_urls else None
    return jsonify({
        'id': prop.id, 'name': prop.name, 'type': prop.type,
        'price': float(prop.price) if prop.price else 0,
        'location': prop.location, 'status': prop.status,
        'images': all_urls,
        'image_details': all_dicts,
        'cover_image': cover_url,
        'updated_at': prop.updated_at.isoformat() if prop.updated_at else None,
        # NEW: Return coordinates
        'coordinates': {
            'lat': float(prop.latitude) if prop.latitude else None,
            'lng': float(prop.longitude) if prop.longitude else None,
        } if prop.latitude and prop.longitude else None,
    })


@admin_bp.route('/properties/<int:property_id>', methods=['DELETE'])
@jwt_required()
def admin_delete_property(property_id):
    require_admin()
    prop = Property.query.get(property_id)
    if not prop:
        return jsonify({'error': 'Property not found'}), 404
    PropertyImage.query.filter_by(property_id=property_id).delete()
    Booking.query.filter_by(property_id=property_id).delete()
    db.session.delete(prop)
    db.session.commit()
    return jsonify({'message': 'Property and related bookings deleted successfully'})


# ═════════════════════════════════════════════════════════════════════════════
# IMAGE CATEGORY ROUTES
# ═════════════════════════════════════════════════════════════════════════════

@admin_bp.route('/properties/<int:property_id>/categories', methods=['GET'])
@jwt_required()
def list_image_categories(property_id):
    require_admin()
    prop = Property.query.get(property_id)
    if not prop:
        return jsonify({'error': 'Property not found'}), 404

    cats = (
        ImageCategory.query
        .filter_by(property_id=property_id)
        .order_by(ImageCategory.sort_order, ImageCategory.id)
        .all()
    )
    return jsonify([c.to_dict() for c in cats])


@admin_bp.route('/properties/<int:property_id>/categories', methods=['POST'])
@jwt_required()
def create_image_category(property_id):
    require_admin()
    prop = Property.query.get(property_id)
    if not prop:
        return jsonify({'error': 'Property not found'}), 404

    data = request.json or {}
    name = (data.get('name') or '').strip()
    if not name:
        return jsonify({'error': 'name is required'}), 400

    slug = _slugify(data.get('slug') or name)

    # Ensure slug is unique within property
    existing = ImageCategory.query.filter_by(property_id=property_id, slug=slug).first()
    if existing:
        return jsonify({'error': f"Category slug '{slug}' already exists for this property"}), 409

    max_order = db.session.query(db.func.max(ImageCategory.sort_order)).filter_by(property_id=property_id).scalar() or 0
    cat = ImageCategory(
        property_id=property_id,
        name=name,
        slug=slug,
        sort_order=max_order + 1,
    )
    db.session.add(cat)
    db.session.commit()
    return jsonify(cat.to_dict()), 201


@admin_bp.route('/properties/<int:property_id>/categories/<int:cat_id>', methods=['PUT', 'PATCH'])
@jwt_required()
def update_image_category(property_id, cat_id):
    require_admin()
    cat = ImageCategory.query.filter_by(id=cat_id, property_id=property_id).first()
    if not cat:
        return jsonify({'error': 'Category not found'}), 404

    data = request.json or {}
    if 'name' in data:
        cat.name = data['name'].strip()
    if 'slug' in data:
        new_slug = _slugify(data['slug'])
        conflict = ImageCategory.query.filter(
            ImageCategory.property_id == property_id,
            ImageCategory.slug == new_slug,
            ImageCategory.id != cat_id,
        ).first()
        if conflict:
            return jsonify({'error': f"Slug '{new_slug}' already in use"}), 409
        cat.slug = new_slug
    if 'sort_order' in data:
        cat.sort_order = int(data['sort_order'])

    db.session.commit()
    return jsonify(cat.to_dict())


@admin_bp.route('/properties/<int:property_id>/categories/<int:cat_id>', methods=['DELETE'])
@jwt_required()
def delete_image_category(property_id, cat_id):
    require_admin()
    cat = ImageCategory.query.filter_by(id=cat_id, property_id=property_id).first()
    if not cat:
        return jsonify({'error': 'Category not found'}), 404

    # Unassign images that belonged to this category
    PropertyImage.query.filter_by(
        property_id=property_id,
        category=cat.slug,
    ).update({'category': None})

    db.session.delete(cat)
    db.session.commit()
    return jsonify({'success': True, 'message': f"Category '{cat.name}' deleted"})


@admin_bp.route('/property-image/<int:image_id>/category', methods=['PUT', 'PATCH'])
@jwt_required()
def set_image_category(image_id):
    require_admin()
    image = PropertyImage.query.get(image_id)
    if not image:
        return jsonify({'error': 'Image not found'}), 404

    data = request.json or {}
    slug = data.get('category')   # pass null / empty string to un-assign

    if slug:
        slug = slug.strip()
        # Validate the category exists for this property
        if image.property_id:
            valid = ImageCategory.query.filter_by(
                property_id=image.property_id,
                slug=slug,
            ).first()
            if not valid:
                return jsonify({'error': f"Category '{slug}' does not exist for this property"}), 404
        image.category = slug
    else:
        image.category = None

    db.session.commit()
    return jsonify({'success': True, 'image_id': image_id, 'category': image.category})


@admin_bp.route('/properties/<int:property_id>/images/bulk-categorize', methods=['POST'])
@jwt_required()
def bulk_categorize_images(property_id):
    """
    Body: { "assignments": [{"image_id": 1, "category": "bedroom"}, ...] }
    Pass category: null to un-assign.
    """
    require_admin()
    prop = Property.query.get(property_id)
    if not prop:
        return jsonify({'error': 'Property not found'}), 404

    data = request.json or {}
    assignments = data.get('assignments', [])
    if not isinstance(assignments, list):
        return jsonify({'error': 'assignments must be an array'}), 400

    # Build valid slug set once
    valid_slugs = {
        c.slug for c in ImageCategory.query.filter_by(property_id=property_id).all()
    }

    updated, errors = 0, []
    for item in assignments:
        img_id = item.get('image_id')
        slug   = item.get('category')
        if not img_id:
            continue
        img = PropertyImage.query.filter_by(id=img_id, property_id=property_id).first()
        if not img:
            errors.append(f"Image {img_id} not found")
            continue
        if slug and slug not in valid_slugs:
            errors.append(f"Category '{slug}' not found for image {img_id}")
            continue
        img.category = slug or None
        updated += 1

    db.session.commit()
    return jsonify({'success': True, 'updated': updated, 'errors': errors})


# ═════════════════════════════════════════════════════════════════════════════
# STATISTICS
# ═════════════════════════════════════════════════════════════════════════════

@admin_bp.route('/stats', methods=['GET'])
@jwt_required()
def admin_get_stats():
    require_admin()
    total_properties = Property.query.filter_by(status='active').count()
    active_bookings = Booking.query.filter(Booking.status.in_(['upcoming', 'active'])).count()
    total_users = User.query.filter(User.role != 'admin').count()
    completed_payments = Payment.query.filter_by(status='completed').all()
    total_revenue = sum(float(p.amount) for p in completed_payments) if completed_payments else 0
    return jsonify({
        'total_properties': total_properties, 'active_bookings': active_bookings,
        'total_users': total_users, 'total_revenue': total_revenue
    })


# ═════════════════════════════════════════════════════════════════════════════
# REVENUE STATISTICS
# ═════════════════════════════════════════════════════════════════════════════

@admin_bp.route('/revenue', methods=['GET'])
@jwt_required()
def admin_get_revenue():
    require_admin()
    year  = request.args.get('year',  type=int)
    month = request.args.get('month', type=int)

    completed_q = Payment.query.filter_by(status='completed')
    if year:  completed_q = completed_q.filter(extract('year',  Payment.completed_at) == year)
    if month: completed_q = completed_q.filter(extract('month', Payment.completed_at) == month)
    all_completed = completed_q.all()

    gross   = sum(float(p.amount) for p in all_completed if float(p.amount) > 0 and p.method != 'refund')
    refunds = sum(abs(float(p.amount)) for p in all_completed if p.method == 'refund')
    net     = gross - refunds

    cancel_q = db.session.query(func.sum(Booking.cancellation_fee)).filter(
        Booking.status == 'cancelled', Booking.cancellation_fee > 0)
    if year:  cancel_q = cancel_q.filter(extract('year',  Booking.cancelled_at) == year)
    if month: cancel_q = cancel_q.filter(extract('month', Booking.cancelled_at) == month)
    total_cancellation_fees = float(cancel_q.scalar() or 0)

    total_service_fees = 0

    by_method = {}
    for p in all_completed:
        if p.method == 'refund': continue
        m = p.method or 'unknown'
        by_method.setdefault(m, {'gross': 0, 'count': 0})
        by_method[m]['gross'] += float(p.amount)
        by_method[m]['count'] += 1

    target_year = year or datetime.utcnow().year
    monthly_raw = db.session.query(
        extract('month', Payment.completed_at).label('month'),
        func.sum(case((Payment.method != 'refund', Payment.amount), else_=0)).label('gross'),
        func.sum(case((Payment.method == 'refund', func.abs(Payment.amount)), else_=0)).label('refunded')
    ).filter(
        Payment.status == 'completed',
        extract('year', Payment.completed_at) == target_year
    ).group_by(extract('month', Payment.completed_at)).all()

    monthly_map = {int(r.month): {'gross': float(r.gross), 'refunded': float(r.refunded)} for r in monthly_raw}
    month_names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    by_month = [
        {
            'month': i, 'label': month_names[i - 1],
            'gross':    monthly_map.get(i, {}).get('gross', 0),
            'refunded': monthly_map.get(i, {}).get('refunded', 0),
            'net':      monthly_map.get(i, {}).get('gross', 0) - monthly_map.get(i, {}).get('refunded', 0)
        }
        for i in range(1, 13)
    ]

    property_raw = db.session.query(
        Property.id, Property.name, Property.location,
        func.sum(Payment.amount).label('revenue'),
        func.count(Payment.id).label('payment_count')
    ).join(Payment, Payment.property_id == Property.id).filter(
        Payment.status == 'completed', Payment.method != 'refund'
    ).group_by(Property.id, Property.name, Property.location
    ).order_by(func.sum(Payment.amount).desc()).limit(10).all()

    by_property = [
        {'property_id': r.id, 'property_name': r.name, 'location': r.location,
         'revenue': float(r.revenue), 'payment_count': r.payment_count}
        for r in property_raw
    ]

    pending_refunds = Booking.query.filter(
        Booking.status == 'cancelled',
        Booking.refund_amount > 0,
        Booking.refund_processed == False
    ).all()

    return jsonify({
        'year': target_year, 'month': month,
        'summary': {
            'gross': round(gross, 2), 'refunds_paid': round(refunds, 2), 'net': round(net, 2),
            'cancellation_fees_kept': round(total_cancellation_fees, 2),
            'service_fees_collected': round(total_service_fees, 2),
            'pending_refunds_count': len(pending_refunds),
            'pending_refunds_total': round(sum(float(b.refund_amount) for b in pending_refunds), 2)
        },
        'by_method': by_method,
        'by_month': by_month,
        'by_property': by_property
    }), 200


# ═════════════════════════════════════════════════════════════════════════════
# USER MANAGEMENT
# ═════════════════════════════════════════════════════════════════════════════

@admin_bp.route('/users', methods=['GET'])
@jwt_required()
def admin_get_users():
    require_admin()
    result = []
    for user in User.query.all():
        bookings_count = Booking.query.filter_by(user_id=user.id).count()
        payments = Payment.query.filter_by(user_id=user.id, status='completed').filter(Payment.method != 'refund').all()
        total_spent = sum(float(p.amount) for p in payments) if payments else 0
        chats_count = Chat.query.filter_by(user_id=user.id).count()
        last_activity = None
        last_msg = ChatMessage.query.join(Chat).filter(Chat.user_id == user.id).order_by(ChatMessage.timestamp.desc()).first()
        if last_msg: last_activity = last_msg.timestamp
        if not last_activity:
            last_bk = Booking.query.filter_by(user_id=user.id).order_by(Booking.created_at.desc()).first()
            if last_bk: last_activity = last_bk.created_at
        result.append({
            'id': user.id, 'name': user.name, 'email': user.email, 'phone': user.phone,
            'role': user.role, 'is_guest': user.is_guest, 'avatar_url': user.avatar_url,
            'created_at': user.created_at.isoformat() if user.created_at else None,
            'bookings_count': bookings_count, 'total_spent': float(total_spent),
            'chats_count': chats_count,
            'last_activity': last_activity.isoformat() if last_activity else None
        })
    return jsonify(result)


@admin_bp.route('/users/<int:user_id>/details', methods=['GET'])
@jwt_required()
def admin_get_user_details(user_id):
    require_admin()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    try:
        bookings_count = Booking.query.filter_by(user_id=user_id).count()
        payments = Payment.query.filter_by(user_id=user_id, status='completed').filter(Payment.method != 'refund').all()
        total_spent = sum(float(p.amount) for p in payments) if payments else 0
        chats_count = Chat.query.filter_by(user_id=user_id).count()
        recent_bookings = Booking.query.filter_by(user_id=user_id).order_by(Booking.created_at.desc()).limit(3).all()
        recent_messages = ChatMessage.query.join(Chat).filter(Chat.user_id == user_id).order_by(ChatMessage.timestamp.desc()).limit(3).all()
        recent_activity = []
        for b in recent_bookings:
            pname = b.property.name if b.property else 'Unknown property'
            recent_activity.append(f"Booked: {pname} on {b.created_at.strftime('%b %d, %Y')}")
        for m in recent_messages:
            recent_activity.append(f"Message: \"{m.content[:30]}...\" on {m.timestamp.strftime('%b %d, %Y')}")
        if not recent_activity:
            recent_activity = [f"User joined on {user.created_at.strftime('%b %d, %Y')}"]
        last_login = user.updated_at if user.updated_at else user.created_at
        return jsonify({
            'user_id': user.id, 'name': user.name, 'email': user.email, 'phone': user.phone,
            'role': user.role, 'is_guest': user.is_guest,
            'created_at': user.created_at.isoformat() if user.created_at else None,
            'last_login': last_login.isoformat() if last_login else None,
            'stats': {'bookings_count': bookings_count, 'total_spent': float(total_spent),
                      'chats_count': chats_count},
            'recent_activity': recent_activity[:5]
        }), 200
    except Exception as e:
        return jsonify({'error': f'Failed to get user details: {str(e)}'}), 500


@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
def admin_delete_user(user_id):
    require_admin()
    current_user_id = get_jwt_identity()
    if current_user_id == user_id:
        return jsonify({'error': 'Cannot delete your own account'}), 400
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    if user.role == 'admin':
        return jsonify({'error': 'Cannot delete other admin users'}), 403
    try:
        for chat in user.chats:
            ChatMessage.query.filter_by(chat_id=chat.id).delete()
        Chat.query.filter_by(user_id=user_id).delete()
        Payment.query.filter_by(user_id=user_id).delete()
        Booking.query.filter_by(user_id=user_id).delete()
        Lead.query.filter_by(assigned_to_id=user_id).delete()
        db.session.delete(user)
        db.session.commit()
        return jsonify({'message': 'User deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to delete user: {str(e)}'}), 500


# ═════════════════════════════════════════════════════════════════════════════
# ADMIN BOOKING MANAGEMENT
# ═════════════════════════════════════════════════════════════════════════════

@admin_bp.route('/bookings', methods=['GET'])
@jwt_required()
def admin_get_bookings():
    require_admin()

    bookings = Booking.query.order_by(Booking.created_at.desc()).all()
    if not bookings:
        return jsonify([])

    # ── Bulk-fetch payments for all bookings in one query ─────────────────────
    booking_ids = [b.id for b in bookings]
    all_payments = Payment.query.filter(Payment.booking_id.in_(booking_ids)).all()
    from collections import defaultdict
    payments_by_booking = defaultdict(list)
    for p in all_payments:
        payments_by_booking[p.booking_id].append(p)

    # ── Bulk-fetch cover image IDs for all referenced properties ──────────────
    prop_ids = list({b.property_id for b in bookings if b.property_id})
    cover_rows = db.session.execute(
        sa_select(PropertyImage.property_id, PropertyImage.id)
        .where(PropertyImage.property_id.in_(prop_ids))
        .where(PropertyImage.is_cover == True)
    ).fetchall()
    cover_by_prop = {row[0]: f"/api/admin/property-image/{row[1]}" for row in cover_rows}

    # Fallback: for properties with no is_cover=True, grab first image by ID
    covered = set(cover_by_prop.keys())
    uncovered = [pid for pid in prop_ids if pid not in covered]
    if uncovered:
        fallback_rows = db.session.execute(
            sa_select(
                PropertyImage.property_id,
                func.min(PropertyImage.id).label('min_id')
            )
            .where(PropertyImage.property_id.in_(uncovered))
            .group_by(PropertyImage.property_id)
        ).fetchall()
        for prop_id, img_id in fallback_rows:
            cover_by_prop[prop_id] = f"/api/admin/property-image/{img_id}"

    result = []
    for booking in bookings:
        pmts = payments_by_booking.get(booking.id, [])
        total_paid = sum(float(p.amount) for p in pmts
                         if p.status == 'completed' and p.method != 'refund')
        result.append({
            'id': booking.id,
            'guest_name': booking.user.name if booking.user else 'Guest',
            'guest_email': booking.user.email if booking.user else '',
            'guest_phone': booking.user.phone if booking.user else '',
            'property_id': booking.property_id,
            'property_name': booking.property.name if booking.property else '',
            'property_location': booking.property.location if booking.property else '',
            'property_image': cover_by_prop.get(booking.property_id, ''),
            'check_in': booking.check_in.isoformat() if booking.check_in else None,
            'check_out': booking.check_out.isoformat() if booking.check_out else None,
            'nights': booking.nights,
            'guests': booking.guests or {'adults': 1, 'children': 0, 'infants': 0},
            'total_amount': float(booking.total_amount) if booking.total_amount else 0,
            'base_amount': float(booking.base_amount) if booking.base_amount else 0,
            'cleaning_fee': 0,
            'service_fee': 0,
            'pending_amount': float(booking.total_amount) - total_paid if booking.total_amount else 0,
            'paid_amount': total_paid,
            'payment_method': booking.payment_method,
            'payment_status': booking.payment_status,
            'confirmation': booking.confirmation,
            'status': booking.status,
            'expires_at': booking.expires_at.isoformat() if booking.expires_at else None,
            'cancelled_at': booking.cancelled_at.isoformat() if booking.cancelled_at else None,
            'cancellation_fee': float(booking.cancellation_fee) if booking.cancellation_fee else 0,
            'refund_amount': float(booking.refund_amount) if booking.refund_amount else 0,
            'refund_processed': booking.refund_processed,
            'refund_processed_at': booking.refund_processed_at.isoformat() if booking.refund_processed_at else None,
            'created_at': booking.created_at.isoformat() if booking.created_at else None
        })
    return jsonify(result)


@admin_bp.route('/bookings/<int:booking_id>', methods=['DELETE'])
@jwt_required()
def admin_delete_booking(booking_id):
    require_admin()
    booking = Booking.query.get(booking_id)
    if not booking:
        return jsonify({'error': 'Booking not found'}), 404
    now = datetime.utcnow()
    if booking.status == 'pending' and booking.expires_at is not None and booking.expires_at < now:
        booking.status = 'expired'
        db.session.flush()
        logger.info(f"Auto-expired booking {booking_id} on delete request")
    if booking.status not in ['expired', 'cancelled']:
        return jsonify({'error': 'Can only delete expired or cancelled bookings',
                        'current_status': booking.status}), 400
    try:
        Payment.query.filter_by(booking_id=booking_id).delete()
        db.session.delete(booking)
        db.session.commit()
        logger.info(f"Booking {booking_id} deleted successfully")
        return jsonify({'success': True, 'message': 'Booking deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to delete booking: {str(e)}'}), 500


@admin_bp.route('/bookings/<int:booking_id>/status', methods=['PUT', 'PATCH'])
@jwt_required()
def admin_update_booking_status(booking_id):
    require_admin()
    booking = Booking.query.get(booking_id)
    if not booking:
        return jsonify({'error': 'Booking not found'}), 404
    data = request.json or {}
    new_status = data.get('status')
    allowed = ['confirmed', 'cancelled', 'pending', 'upcoming', 'completed', 'expired']
    if new_status not in allowed:
        return jsonify({'error': f'Invalid status. Must be one of: {", ".join(allowed)}'}), 400
    booking.status = new_status
    booking.confirmation = new_status
    if new_status == 'confirmed':
        booking.expires_at = None
    db.session.commit()
    return jsonify({'success': True, 'booking_id': booking.id, 'status': booking.status,
                    'confirmation': booking.confirmation,
                    'message': f'Booking {new_status} successfully'}), 200


# ═════════════════════════════════════════════════════════════════════════════
# PAYMENT MANAGEMENT
# ═════════════════════════════════════════════════════════════════════════════

@admin_bp.route('/payments', methods=['GET'])
@jwt_required()
def admin_get_payments():
    require_admin()
    result = []
    for p in Payment.query.all():
        result.append({
            'id': p.id, 'booking_id': p.booking_id,
            'guest_name': p.user.name if p.user else 'Guest',
            'property_name': p.property.name if p.property else '',
            'amount': float(p.amount) if p.amount else 0,
            'method': p.method, 'status': p.status,
            'date': p.payment_date.strftime('%Y-%m-%d') if p.payment_date else '',
            'transaction_id': p.transaction_id or '',
            'refund_payment_id': p.refund_payment_id,
            'refund_note': p.refund_note
        })
    return jsonify(result)


# ═════════════════════════════════════════════════════════════════════════════
# LEAD MANAGEMENT
# ═════════════════════════════════════════════════════════════════════════════

@admin_bp.route('/leads', methods=['GET'])
@jwt_required()
def admin_get_leads():
    require_admin()
    result = []
    for lead in Lead.query.all():
        result.append({
            'id': lead.id, 'name': lead.name, 'email': lead.email, 'phone': lead.phone,
            'source': lead.source, 'status': lead.status, 'priority': lead.priority,
            'assigned_to': lead.assigned_to.name if lead.assigned_to else None,
            'property_interest': lead.property_interest, 'message': lead.message,
            'follow_up_date': lead.follow_up_date.isoformat() if lead.follow_up_date else None,
            'created_at': lead.created_at.isoformat() if lead.created_at else None
        })
    return jsonify(result)


# ═════════════════════════════════════════════════════════════════════════════
# HOMEPAGE CONTENT
# ═════════════════════════════════════════════════════════════════════════════

@admin_bp.route('/homepage', methods=['GET'])
@jwt_required()
def admin_get_homepage():
    require_admin()
    content = HomepageContent.query.first()
    if not content:
        return jsonify({
            'message': 'Homepage content is embedded in frontend',
            'hero_images': [], 'featured_properties': [],
            'premium_badges': [], 'testimonials': [], 'faqs': []
        })
    return jsonify({
        'hero_images': content.hero_images or [],
        'featured_properties': content.featured_properties or [],
        'premium_badges': content.premium_badges or [],
        'testimonials': content.testimonials or [],
        'faqs': content.faqs or []
    })


# ═════════════════════════════════════════════════════════════════════════════
# NOTIFICATION MANAGEMENT
# ═════════════════════════════════════════════════════════════════════════════

@admin_bp.route('/notifications', methods=['GET'])
@jwt_required()
def admin_get_notifications():
    require_admin()
    user_id = get_jwt_identity()
    
    # Get all notifications for the admin user
    notifications = Notification.query.filter_by(user_id=user_id).order_by(Notification.created_at.desc()).all()
    
    result = []
    for notification in notifications:
        result.append(notification.to_dict())
    
    return jsonify(result)


@admin_bp.route('/notifications/<int:notification_id>/read', methods=['PUT'])
@jwt_required()
def admin_mark_notification_read(notification_id):
    require_admin()
    user_id = get_jwt_identity()
    
    notification = Notification.query.filter_by(id=notification_id, user_id=user_id).first()
    if not notification:
        return jsonify({'error': 'Notification not found'}), 404
    
    notification.is_read = True
    db.session.commit()
    
    return jsonify({'message': 'Notification marked as read'})