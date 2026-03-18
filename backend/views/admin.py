from flask import Blueprint, request, jsonify, Response
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, Property, Booking, Payment, Lead, HomepageContent, AdminStats, PropertyImage, Chat, ChatMessage
from werkzeug.exceptions import Forbidden
from datetime import datetime, timedelta
from decimal import Decimal
from sqlalchemy import func, extract, case
import os
from werkzeug.utils import secure_filename
import uuid
import base64
import json
import logging

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


# ========== PROPERTY WITH IMAGES ==========
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
            amenities=amenities, tags=tags, status='active'
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
        p = Property.query.get(new_property.id)
        return jsonify({
            'id': p.id, 'name': p.name, 'type': p.type,
            'price': float(p.price) if p.price else 0, 'location': p.location,
            'description': p.description, 'rooms': p.rooms, 'bathrooms': p.bathrooms,
            'max_guests': p.max_guests, 'area': p.area, 'specs': p.specs,
            'amenities': p.amenities, 'tags': p.tags, 'status': p.status,
            'images': [f"/api/admin/property-image/{img.id}" for img in p.images],
            'cover_image': p.get_cover_image_url(),
            'created_at': p.created_at.isoformat() if p.created_at else None
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
        return jsonify({'success': True, 'message': f'Added {len(images_added)} image(s)',
                        'images_added': images_added, 'total_images': len(prop.images)})
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

# ========== PROPERTY MANAGEMENT ==========
@admin_bp.route('/properties', methods=['GET'])
@jwt_required()
def admin_get_properties():
    require_admin()
    result = []
    for prop in Property.query.all():
        result.append({
            'id': prop.id, 'name': prop.name, 'title': prop.title or prop.name,
            'description': prop.description, 'type': prop.type,
            'price': float(prop.price) if prop.price else 0, 'location': prop.location,
            'rooms': prop.rooms, 'bathrooms': prop.bathrooms, 'area': prop.area,
            'max_guests': prop.max_guests,
            'specs': prop.specs or {'guests': prop.max_guests, 'bedrooms': prop.rooms,
                                     'beds': prop.rooms, 'bathrooms': prop.bathrooms},
            'amenities': prop.amenities or [], 'images': prop.get_image_urls(),
            'cover_image': prop.get_cover_image_url(), 'tags': prop.tags or [],
            'status': prop.status, 'rating': float(prop.rating) if prop.rating else 0,
            'review_count': prop.review_count, 'bookings': prop.bookings_count,
            'is_featured': prop.is_featured,
            'created_at': prop.created_at.isoformat() if prop.created_at else None,
            'updated_at': prop.updated_at.isoformat() if prop.updated_at else None
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
        amenities=amenities, tags=data.get('tags', []), status='active'
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
    p = Property.query.get(new_property.id)
    return jsonify({
        'id': p.id, 'name': p.name, 'type': p.type,
        'price': float(p.price) if p.price else 0, 'location': p.location, 'status': p.status,
        'images': [f"/api/admin/property-image/{img.id}" for img in p.images],
        'cover_image': p.get_cover_image_url(),
        'created_at': p.created_at.isoformat() if p.created_at else None
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
    if 'image_ids' in data and isinstance(data['image_ids'], list):
        PropertyImage.query.filter_by(property_id=prop.id).update({'property_id': None, 'is_cover': False})
        for i, image_id in enumerate(data['image_ids']):
            pi = PropertyImage.query.get(image_id)
            if pi:
                pi.property_id = prop.id
                if i == 0: pi.is_cover = True
    db.session.commit()
    return jsonify({
        'id': prop.id, 'name': prop.name, 'type': prop.type,
        'price': float(prop.price) if prop.price else 0,
        'location': prop.location, 'status': prop.status,
        'images': prop.get_image_urls(), 'cover_image': prop.get_cover_image_url(),
        'updated_at': prop.updated_at.isoformat() if prop.updated_at else None
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


# ========== STATISTICS ==========
@admin_bp.route('/stats', methods=['GET'])
@jwt_required()
def admin_get_stats():
    require_admin()
    total_properties = Property.query.filter_by(status='active').count()
    active_bookings = Booking.query.filter(Booking.status.in_(['upcoming', 'active'])).count()
    total_users = User.query.filter(User.role != 'admin').count()
    # SUM includes negative refund rows so result is net revenue automatically
    completed_payments = Payment.query.filter_by(status='completed').all()
    total_revenue = sum(float(p.amount) for p in completed_payments) if completed_payments else 0
    return jsonify({
        'total_properties': total_properties, 'active_bookings': active_bookings,
        'total_users': total_users, 'total_revenue': total_revenue
    })


# ========== REVENUE STATISTICS ==========
@admin_bp.route('/revenue', methods=['GET'])
@jwt_required()
def admin_get_revenue():
    """
    Full revenue statistics.
    Optional query params: year (int), month (int).
    Returns summary, by_method, by_month (12 rows), by_property (top 10), pending refunds.
    """
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

    service_q = db.session.query(func.sum(Booking.service_fee)).filter(Booking.payment_status == 'completed')
    if year:  service_q = service_q.filter(extract('year',  Booking.created_at) == year)
    if month: service_q = service_q.filter(extract('month', Booking.created_at) == month)
    total_service_fees = float(service_q.scalar() or 0)

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


# ========== USER MANAGEMENT ==========
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


# ========== ADMIN BOOKING MANAGEMENT ==========
@admin_bp.route('/bookings', methods=['GET'])
@jwt_required()
def admin_get_bookings():
    require_admin()
    result = []
    for booking in Booking.query.all():
        payments = Payment.query.filter_by(booking_id=booking.id).all()
        total_paid = sum(float(p.amount) for p in payments
                         if p.status == 'completed' and p.method != 'refund') if payments else 0
        result.append({
            'id': booking.id,
            'guest_name': booking.user.name if booking.user else 'Guest',
            'guest_email': booking.user.email if booking.user else '',
            'guest_phone': booking.user.phone if booking.user else '',
            'property_id': booking.property_id,
            'property_name': booking.property.name if booking.property else '',
            'property_location': booking.property.location if booking.property else '',
            'property_image': booking.property.get_cover_image_url() if booking.property else '',
            'check_in': booking.check_in.isoformat() if booking.check_in else None,
            'check_out': booking.check_out.isoformat() if booking.check_out else None,
            'nights': booking.nights,
            'guests': booking.guests or {'adults': 1, 'children': 0, 'infants': 0},
            'total_amount': float(booking.total_amount) if booking.total_amount else 0,
            'base_amount': float(booking.base_amount) if booking.base_amount else 0,
            'cleaning_fee': float(booking.cleaning_fee) if booking.cleaning_fee else 0,
            'service_fee': float(booking.service_fee) if booking.service_fee else 0,
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


# ========== PAYMENT MANAGEMENT ==========
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


# ========== LEAD MANAGEMENT ==========
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


# ========== HOMEPAGE CONTENT ==========
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