# admin.py - COMPLETE UPDATED VERSION WITH USER MANAGEMENT
from flask import Blueprint, request, jsonify, Response
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, Property, Booking, Payment, Lead, HomepageContent, AdminStats, PropertyImage, Chat, ChatMessage
from werkzeug.exceptions import Forbidden
from datetime import datetime, timedelta
from decimal import Decimal
import os
from werkzeug.utils import secure_filename
import uuid
import base64
import json

admin_bp = Blueprint('admin', __name__)

# Upload configuration
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def require_admin():
    """Check if current user is admin"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user or user.role != 'admin':
        raise Forbidden('Admin access required')

# ========== NEW: SINGLE ENDPOINT FOR PROPERTY WITH IMAGES ==========
@admin_bp.route('/properties/with-images', methods=['POST'])
@jwt_required()
def create_property_with_images():
    """Create property with images in one request"""
    require_admin()
    
    user_id = get_jwt_identity()
    
    # Check if request is multipart/form-data
    if not request.content_type or 'multipart/form-data' not in request.content_type:
        return jsonify({'error': 'Content-Type must be multipart/form-data'}), 400
    
    try:
        # Get form data
        name = request.form.get('name')
        type = request.form.get('type')
        price = request.form.get('price')
        location = request.form.get('location')
        
        # Validate required fields
        if not all([name, type, price, location]):
            return jsonify({'error': 'Missing required fields: name, type, price, location'}), 400
        
        # Parse JSON fields
        description = request.form.get('description', '')
        amenities_json = request.form.get('amenities', '[]')
        specs_json = request.form.get('specs', '{}')
        tags_json = request.form.get('tags', '[]')
        
        try:
            amenities = json.loads(amenities_json)
            specs = json.loads(specs_json)
            tags = json.loads(tags_json)
        except json.JSONDecodeError:
            amenities = []
            specs = {}
            tags = []
        
        # Create property first
        new_property = Property(
            name=name,
            title=request.form.get('title', name),
            type=type,
            price=Decimal(str(price)),
            location=location,
            description=description,
            rooms=int(request.form.get('rooms', 1)),
            bathrooms=int(request.form.get('bathrooms', 1)),
            max_guests=int(request.form.get('max_guests', request.form.get('maxGuests', 2))),
            area=request.form.get('area', ''),
            host_id=user_id,
            specs=specs if specs else {
                'guests': int(request.form.get('max_guests', request.form.get('maxGuests', 2))),
                'bedrooms': int(request.form.get('rooms', 1)),
                'beds': int(request.form.get('rooms', 1)),
                'bathrooms': int(request.form.get('bathrooms', 1))
            },
            amenities=amenities,
            tags=tags,
            status='active'
        )
        
        db.session.add(new_property)
        db.session.flush()  # Get property ID
        
        # Handle cover image
        cover_image = request.files.get('coverImage')
        cover_image_saved = False
        if cover_image and allowed_file(cover_image.filename):
            try:
                # Read image binary data
                image_data = cover_image.read()
                filename = secure_filename(cover_image.filename)
                
                # Store in database
                property_image = PropertyImage(
                    image_data=image_data,
                    filename=filename,
                    mime_type=cover_image.mimetype,
                    property_id=new_property.id,
                    is_cover=True
                )
                db.session.add(property_image)
                cover_image_saved = True
            except Exception as e:
                print(f"Error saving cover image: {str(e)}")
        
        # Handle gallery images
        gallery_images = request.files.getlist('galleryImages')
        gallery_images_saved = 0
        
        for i, image in enumerate(gallery_images):
            if image and image.filename and allowed_file(image.filename):
                try:
                    # Read image binary data
                    image_data = image.read()
                    filename = secure_filename(image.filename)
                    
                    # Store in database
                    property_image = PropertyImage(
                        image_data=image_data,
                        filename=filename,
                        mime_type=image.mimetype,
                        property_id=new_property.id,
                        is_cover=False  # Only cover image is marked as cover
                    )
                    db.session.add(property_image)
                    gallery_images_saved += 1
                except Exception as e:
                    print(f"Error saving gallery image {i}: {str(e)}")
        
        # If no cover image was saved but we have gallery images, mark the first one as cover
        if not cover_image_saved and gallery_images_saved > 0:
            first_image = PropertyImage.query.filter_by(
                property_id=new_property.id,
                is_cover=False
            ).first()
            if first_image:
                first_image.is_cover = True
        
        db.session.commit()
        
        # Get the updated property with images
        property_with_images = Property.query.get(new_property.id)
        
        return jsonify({
            'id': new_property.id,
            'name': new_property.name,
            'type': new_property.type,
            'price': float(new_property.price) if new_property.price else 0,
            'location': new_property.location,
            'description': new_property.description,
            'rooms': new_property.rooms,
            'bathrooms': new_property.bathrooms,
            'max_guests': new_property.max_guests,
            'area': new_property.area,
            'specs': new_property.specs,
            'amenities': new_property.amenities,
            'tags': new_property.tags,
            'status': new_property.status,
            'images': [f"/api/admin/property-image/{img.id}" for img in property_with_images.images],
            'cover_image': property_with_images.get_cover_image_url(),
            'created_at': new_property.created_at.isoformat() if new_property.created_at else None
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Error creating property with images: {str(e)}")
        return jsonify({'error': f'Failed to create property: {str(e)}'}), 500

# ========== NEW: ADD IMAGES TO EXISTING PROPERTY ==========
@admin_bp.route('/properties/<int:property_id>/images', methods=['POST'])
@jwt_required()
def add_property_images(property_id):
    """Add images to existing property"""
    require_admin()
    
    property = Property.query.get(property_id)
    if not property:
        return jsonify({'error': 'Property not found'}), 404
    
    try:
        images_added = []
        
        # Handle cover image replacement
        cover_image = request.files.get('coverImage')
        if cover_image and allowed_file(cover_image.filename):
            try:
                # First, unset any existing cover
                PropertyImage.query.filter_by(
                    property_id=property_id,
                    is_cover=True
                ).update({'is_cover': False})
                
                # Read image binary data
                image_data = cover_image.read()
                filename = secure_filename(cover_image.filename)
                
                # Store in database
                property_image = PropertyImage(
                    image_data=image_data,
                    filename=filename,
                    mime_type=cover_image.mimetype,
                    property_id=property.id,
                    is_cover=True
                )
                db.session.add(property_image)
                images_added.append({'type': 'cover', 'filename': filename})
            except Exception as e:
                print(f"Error saving cover image: {str(e)}")
        
        # Handle gallery images addition
        gallery_images = request.files.getlist('galleryImages')
        for i, image in enumerate(gallery_images):
            if image and image.filename and allowed_file(image.filename):
                try:
                    # Read image binary data
                    image_data = image.read()
                    filename = secure_filename(image.filename)
                    
                    # Store in database
                    property_image = PropertyImage(
                        image_data=image_data,
                        filename=filename,
                        mime_type=image.mimetype,
                        property_id=property.id,
                        is_cover=False
                    )
                    db.session.add(property_image)
                    images_added.append({'type': 'gallery', 'filename': filename})
                except Exception as e:
                    print(f"Error saving gallery image {i}: {str(e)}")
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Added {len(images_added)} image(s) to property',
            'images_added': images_added,
            'total_images': len(property.images)
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"Error adding images to property: {str(e)}")
        return jsonify({'error': f'Failed to add images: {str(e)}'}), 500

# ========== IMAGE UPLOAD TO DATABASE ==========
@admin_bp.route('/upload/property-image', methods=['POST'])
@jwt_required()
def upload_property_image_db():
    """Upload image and store in database (returns image ID)"""
    require_admin()
    
    if 'image' not in request.files:
        return jsonify({'error': 'No image file'}), 400
    
    file = request.files['image']
    
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type'}), 400
    
    try:
        # Get property_id from form data (optional for temporary uploads)
        property_id = request.form.get('property_id')
        
        # Validate property exists if property_id is provided
        if property_id and property_id.strip():
            try:
                property_id_int = int(property_id)
                property = Property.query.get(property_id_int)
                if not property:
                    return jsonify({'error': f'Property with ID {property_id} not found'}), 404
                property_id = property_id_int
            except (ValueError, TypeError):
                return jsonify({'error': 'Invalid property ID format'}), 400
        else:
            property_id = None  # Allow null for temporary uploads
        
        # Read image binary data
        image_data = file.read()
        filename = secure_filename(file.filename)
        
        # Check if this should be a cover image
        is_cover = request.form.get('is_cover', 'false').lower() == 'true'
        
        # Store in database
        property_image = PropertyImage(
            image_data=image_data,
            filename=filename,
            mime_type=file.mimetype,
            property_id=property_id,  # Can be None for temporary uploads
            is_cover=is_cover
        )
        db.session.add(property_image)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'image_id': property_image.id,
            'property_id': property_image.property_id,  # May be None
            'filename': filename,
            'mime_type': file.mimetype,
            'is_cover': is_cover,
            'url': f"/api/admin/property-image/{property_image.id}"
        })
    except Exception as e:
        db.session.rollback()
        print(f"Upload error: {str(e)}")
        return jsonify({'error': f'Failed to save image: {str(e)}'}), 500

@admin_bp.route('/upload/property-images', methods=['POST'])
@jwt_required()
def upload_property_images_db():
    """Upload multiple images to database"""
    require_admin()
    
    if 'images' not in request.files:
        return jsonify({'error': 'No images uploaded'}), 400
    
    files = request.files.getlist('images')
    if not files or files[0].filename == '':
        return jsonify({'error': 'No selected files'}), 400
    
    # Get property_id from form data (optional)
    property_id = request.form.get('property_id')
    
    # Validate property exists if property_id is provided
    if property_id and property_id.strip():
        try:
            property_id_int = int(property_id)
            property = Property.query.get(property_id_int)
            if not property:
                return jsonify({'error': f'Property with ID {property_id} not found'}), 404
            property_id = property_id_int
        except (ValueError, TypeError):
            return jsonify({'error': 'Invalid property ID format'}), 400
    else:
        property_id = None
    
    uploaded_images = []
    errors = []
    
    for i, file in enumerate(files):
        if file and allowed_file(file.filename):
            try:
                # Read image binary data
                image_data = file.read()
                filename = secure_filename(file.filename)
                
                # Check if first image should be cover
                is_cover = (i == 0 and request.form.get('first_is_cover', 'false').lower() == 'true')
                
                # Store in database
                property_image = PropertyImage(
                    image_data=image_data,
                    filename=filename,
                    mime_type=file.mimetype,
                    property_id=property_id,
                    is_cover=is_cover
                )
                db.session.add(property_image)
                uploaded_images.append({
                    'image_id': property_image.id,
                    'property_id': property_image.property_id,
                    'filename': filename,
                    'mime_type': file.mimetype,
                    'is_cover': is_cover,
                    'url': f"/api/admin/property-image/{property_image.id}"
                })
            except Exception as e:
                errors.append(f"File {file.filename}: {str(e)}")
                continue
    
    db.session.commit()
    
    if uploaded_images:
        response = {'success': True, 'images': uploaded_images}
        if errors:
            response['warnings'] = errors
        return jsonify(response)
    else:
        return jsonify({'error': 'No valid images uploaded', 'details': errors}), 400

@admin_bp.route('/property-image/<int:image_id>')
def get_property_image(image_id):
    """Serve image from database"""
    property_image = PropertyImage.query.get(image_id)
    
    if not property_image:
        return jsonify({'error': 'Image not found'}), 404
    
    return Response(property_image.image_data, mimetype=property_image.mime_type)

# ========== PROPERTY MANAGEMENT ==========
@admin_bp.route('/properties', methods=['GET'])
@jwt_required()
def admin_get_properties():
    """Admin: Get all properties (including inactive)"""
    require_admin()
    properties = Property.query.all()
    
    result = []
    for prop in properties:
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
            'images': image_urls,  # API URLs to get images
            'cover_image': prop.get_cover_image_url(),
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
    """Admin: Create new property with images stored in database"""
    require_admin()
    
    user_id = get_jwt_identity()
    data = request.json
    
    # Validate required fields
    required_fields = ['name', 'type', 'price', 'location']
    for field in required_fields:
        if field not in data or not data[field]:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    # Process amenities - ensure it's a list
    amenities = data.get('amenities', [])
    if isinstance(amenities, str):
        amenities = [amenities]
    elif not isinstance(amenities, list):
        amenities = []
    
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
        host_id=user_id,
        specs=data.get('specs', {
            'guests': data.get('max_guests', data.get('maxGuests', 2)),
            'bedrooms': data.get('rooms', 1),
            'beds': data.get('rooms', 1),
            'bathrooms': data.get('bathrooms', 1)
        }),
        amenities=amenities,
        tags=data.get('tags', []),
        status='active'
    )
    
    db.session.add(new_property)
    db.session.flush()  # Get the property ID
    
    # Link images to property if image IDs provided
    if 'image_ids' in data and isinstance(data['image_ids'], list):
        image_ids = data['image_ids']
        
        for i, image_id in enumerate(image_ids):
            property_image = PropertyImage.query.get(image_id)
            if property_image:
                property_image.property_id = new_property.id
                # Mark first image as cover
                if i == 0:
                    # First, unset any existing cover
                    PropertyImage.query.filter_by(
                        property_id=new_property.id,
                        is_cover=True
                    ).update({'is_cover': False})
                    property_image.is_cover = True
    
    db.session.commit()
    
    # Get the updated property with images
    property_with_images = Property.query.get(new_property.id)
    
    return jsonify({
        'id': new_property.id,
        'name': new_property.name,
        'type': new_property.type,
        'price': float(new_property.price) if new_property.price else 0,
        'location': new_property.location,
        'status': new_property.status,
        'images': [f"/api/admin/property-image/{img.id}" for img in property_with_images.images],
        'cover_image': property_with_images.get_cover_image_url(),
        'created_at': new_property.created_at.isoformat() if new_property.created_at else None
    }), 201

@admin_bp.route('/properties/<int:property_id>', methods=['PUT'])
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
        # Ensure amenities is a list
        amenities = data['amenities']
        if isinstance(amenities, str):
            property.amenities = [amenities]
        elif isinstance(amenities, list):
            property.amenities = amenities
        else:
            property.amenities = []
    if 'tags' in data:
        property.tags = data['tags']
    if 'status' in data:
        property.status = data['status']
    if 'rating' in data:
        property.rating = Decimal(str(data['rating'])) if data['rating'] else 0
    if 'is_featured' in data:
        property.is_featured = data['is_featured']
    
    # Update images if new image IDs provided
    if 'image_ids' in data and isinstance(data['image_ids'], list):
        # Clear existing image associations for this property
        PropertyImage.query.filter_by(property_id=property.id).update({'property_id': None, 'is_cover': False})
        
        # Link new images
        for i, image_id in enumerate(data['image_ids']):
            property_image = PropertyImage.query.get(image_id)
            if property_image:
                property_image.property_id = property.id
                # Mark first image as cover
                if i == 0:
                    property_image.is_cover = True
    
    db.session.commit()
    
    return jsonify({
        'id': property.id,
        'name': property.name,
        'type': property.type,
        'price': float(property.price) if property.price else 0,
        'location': property.location,
        'status': property.status,
        'images': property.get_image_urls(),
        'cover_image': property.get_cover_image_url(),
        'updated_at': property.updated_at.isoformat() if property.updated_at else None
    })

@admin_bp.route('/properties/<int:property_id>', methods=['DELETE'])
@jwt_required()
def admin_delete_property(property_id):
    """Admin: Delete property and its images"""
    require_admin()
    
    property = Property.query.get(property_id)
    if not property:
        return jsonify({'error': 'Property not found'}), 404
    
    # Delete associated images from database
    PropertyImage.query.filter_by(property_id=property_id).delete()

    # Delete associated bookings (to avoid NOT NULL constraint error)
    from models import Booking
    Booking.query.filter_by(property_id=property_id).delete()

    # Delete property
    db.session.delete(property)
    db.session.commit()

    return jsonify({'message': 'Property and related bookings deleted successfully'})

# ========== STATISTICS ==========
@admin_bp.route('/stats', methods=['GET'])
@jwt_required()
def admin_get_stats():
    """Admin: Get dashboard statistics"""
    require_admin()
    
    # Calculate stats
    total_properties = Property.query.filter_by(status='active').count()
    active_bookings = Booking.query.filter(Booking.status.in_(['upcoming', 'active'])).count()
    total_users = User.query.filter(User.role != 'admin').count()
    
    # Calculate revenue from completed payments
    completed_payments = Payment.query.filter_by(status='completed').all()
    total_revenue = sum(float(p.amount) for p in completed_payments) if completed_payments else 0
    
    return jsonify({
        'total_properties': total_properties,
        'active_bookings': active_bookings,
        'total_users': total_users,
        'total_revenue': total_revenue
    })

# ========== USER MANAGEMENT ==========
@admin_bp.route('/users', methods=['GET'])
@jwt_required()
def admin_get_users():
    """Admin: Get all users with stats"""
    require_admin()
    users = User.query.all()
    
    result = []
    for user in users:
        # Get basic counts
        bookings_count = Booking.query.filter_by(user_id=user.id).count()
        
        # Get total spent from completed payments
        payments = Payment.query.filter_by(
            user_id=user.id, 
            status='completed'
        ).all()
        total_spent = sum(float(p.amount) for p in payments) if payments else 0
        
        # Get chat count
        chats_count = Chat.query.filter_by(user_id=user.id).count()
        
        # Get last activity
        last_activity = None
        last_message = ChatMessage.query.join(Chat)\
            .filter(Chat.user_id == user.id)\
            .order_by(ChatMessage.timestamp.desc())\
            .first()
        if last_message:
            last_activity = last_message.timestamp
        
        if not last_activity:
            last_booking = Booking.query.filter_by(user_id=user.id)\
                .order_by(Booking.created_at.desc())\
                .first()
            if last_booking:
                last_activity = last_booking.created_at
        
        result.append({
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'phone': user.phone,
            'role': user.role,
            'is_guest': user.is_guest,
            'avatar_url': user.avatar_url,
            'created_at': user.created_at.isoformat() if user.created_at else None,
            'bookings_count': bookings_count,
            'total_spent': float(total_spent),
            'chats_count': chats_count,
            'last_activity': last_activity.isoformat() if last_activity else None
        })
    
    return jsonify(result)

# ========== NEW: GET USER DETAILS ==========
@admin_bp.route('/users/<int:user_id>/details', methods=['GET'])
@jwt_required()
def admin_get_user_details(user_id):
    """Admin: Get detailed user information including stats"""
    require_admin()
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    try:
        # Get user statistics
        bookings_count = Booking.query.filter_by(user_id=user_id).count()
        
        # Calculate total spent from completed payments
        payments = Payment.query.filter_by(
            user_id=user_id, 
            status='completed'
        ).all()
        total_spent = sum(float(p.amount) for p in payments) if payments else 0
        
        # Get chat count
        chats_count = Chat.query.filter_by(user_id=user_id).count()
        
        # Get recent bookings (last 3)
        recent_bookings = Booking.query.filter_by(user_id=user_id)\
            .order_by(Booking.created_at.desc())\
            .limit(3)\
            .all()
        
        # Get recent messages (last 3)
        recent_messages = ChatMessage.query.join(Chat)\
            .filter(Chat.user_id == user_id)\
            .order_by(ChatMessage.timestamp.desc())\
            .limit(3)\
            .all()
        
        # Format recent activity
        recent_activity = []
        
        for booking in recent_bookings:
            property_name = booking.property.name if booking.property else 'Unknown property'
            recent_activity.append(f"Booked: {property_name} on {booking.created_at.strftime('%b %d, %Y')}")
        
        for message in recent_messages:
            recent_activity.append(f"Message: \"{message.content[:30]}...\" on {message.timestamp.strftime('%b %d, %Y')}")
        
        # If no activity, add a default message
        if not recent_activity:
            recent_activity = [f"User joined on {user.created_at.strftime('%b %d, %Y')}"]
        
        # Get last login (using updated_at as proxy)
        last_login = user.updated_at if user.updated_at else user.created_at
        
        return jsonify({
            'user_id': user.id,
            'name': user.name,
            'email': user.email,
            'phone': user.phone,
            'role': user.role,
            'is_guest': user.is_guest,
            'created_at': user.created_at.isoformat() if user.created_at else None,
            'last_login': last_login.isoformat() if last_login else None,
            'stats': {
                'bookings_count': bookings_count,
                'total_spent': float(total_spent),
                'chats_count': chats_count
            },
            'recent_activity': recent_activity[:5]  # Limit to 5 items
        }), 200
        
    except Exception as e:
        print(f"❌ Error getting user details: {str(e)}")
        return jsonify({'error': f'Failed to get user details: {str(e)}'}), 500

# ========== NEW: DELETE USER ==========
@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
def admin_delete_user(user_id):
    """Admin: Delete a user and all related data"""
    require_admin()
    
    # Get current admin user
    current_user_id = get_jwt_identity()
    
    # Don't allow deleting yourself
    if current_user_id == user_id:
        return jsonify({'error': 'Cannot delete your own account'}), 400
    
    # Find the user to delete
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Don't allow deleting other admins
    if user.role == 'admin':
        return jsonify({'error': 'Cannot delete other admin users'}), 403
    
    try:
        print(f"🗑️ Deleting user {user_id}: {user.email}")
        
        # IMPORTANT: Handle related records in correct order
        
        # 1. Delete user's chat messages (through chats)
        for chat in user.chats:
            ChatMessage.query.filter_by(chat_id=chat.id).delete()
        
        # 2. Delete user's chats
        Chat.query.filter_by(user_id=user_id).delete()
        
        # 3. Delete user's payments
        Payment.query.filter_by(user_id=user_id).delete()
        
        # 4. Delete user's bookings
        Booking.query.filter_by(user_id=user_id).delete()
        
        # 5. Delete user's leads (if assigned)
        Lead.query.filter_by(assigned_to_id=user_id).delete()
        
        # 6. Finally delete the user
        db.session.delete(user)
        db.session.commit()
        
        print(f"✅ User {user_id} deleted successfully")
        return jsonify({'message': 'User deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error deleting user: {str(e)}")
        return jsonify({'error': f'Failed to delete user: {str(e)}'}), 500

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
            'guest_name': booking.user.name if booking.user else 'Guest',
            'email': booking.user.email if booking.user else '',
            'property_name': booking.property.name if booking.property else '',
            'property_location': booking.property.location if booking.property else '',
            'property_image': booking.property.get_cover_image_url() if booking.property else '',
            'check_in': booking.check_in.isoformat() if booking.check_in else None,
            'check_out': booking.check_out.isoformat() if booking.check_out else None,
            'nights': booking.nights,
            'guests': booking.guests or {'adults': 1, 'children': 0, 'infants': 0},
            'total_amount': float(booking.total_amount) if booking.total_amount else 0,
            'payment_method': booking.payment_method,
            'payment_status': booking.payment_status,
            'confirmation': booking.confirmation,
            'status': booking.status,
            'created_at': booking.created_at.isoformat() if booking.created_at else None
        })
    
    return jsonify(result)

# ========== BOOKING STATUS UPDATE ==========
@admin_bp.route('/bookings/<int:booking_id>/status', methods=['PUT', 'PATCH'])
@jwt_required()
def admin_update_booking_status(booking_id):
    """Admin: Confirm or cancel a booking"""
    require_admin()

    booking = Booking.query.get(booking_id)
    if not booking:
        return jsonify({'error': 'Booking not found'}), 404

    data = request.json or {}
    new_status = data.get('status')

    allowed = ['confirmed', 'cancelled', 'pending', 'upcoming', 'completed']
    if new_status not in allowed:
        return jsonify({
            'error': f'Invalid status. Must be one of: {", ".join(allowed)}'
        }), 400

    booking.status = new_status
    booking.confirmation = new_status

    # If confirming, clear expiry so it doesn't auto-expire
    if new_status == 'confirmed':
        booking.expires_at = None

    db.session.commit()

    return jsonify({
        'success': True,
        'booking_id': booking.id,
        'status': booking.status,
        'confirmation': booking.confirmation,
        'message': f'Booking {new_status} successfully'
    }), 200

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
            'booking_id': payment.booking_id,
            'guest_name': payment.user.name if payment.user else 'Guest',
            'property_name': payment.property.name if payment.property else '',
            'amount': float(payment.amount) if payment.amount else 0,
            'method': payment.method,
            'status': payment.status,
            'date': payment.payment_date.strftime('%Y-%m-%d') if payment.payment_date else '',
            'transaction_id': payment.transaction_id or ''
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
            'assigned_to': lead.assigned_to.name if lead.assigned_to else None,
            'property_interest': lead.property_interest,
            'message': lead.message,
            'follow_up_date': lead.follow_up_date.isoformat() if lead.follow_up_date else None,
            'created_at': lead.created_at.isoformat() if lead.created_at else None
        })
    
    return jsonify(result)

# ========== HOMEPAGE CONTENT ==========
@admin_bp.route('/homepage', methods=['GET'])
@jwt_required()
def admin_get_homepage():
    """Admin: Get homepage content"""
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