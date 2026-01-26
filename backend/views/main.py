from flask import Blueprint, request, jsonify

bp = Blueprint('main', __name__)

@bp.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'message': 'API is running'}), 200

@bp.route('/homepage', methods=['GET'])
def get_homepage():
    from models import HomepageContent
    content = HomepageContent.query.first()
    if content:
        return jsonify({
            'hero_images': content.hero_images or [],
            'featured_properties': content.featured_properties or [],
            'premium_badges': content.premium_badges or [],
            'testimonials': content.testimonials or [],
            'faqs': content.faqs or []
        }), 200
    else:
        # Return default empty structure
        return jsonify({
            'hero_images': [],
            'featured_properties': [],
            'premium_badges': [],
            'testimonials': [],
            'faqs': []
        }), 200

@bp.route('/contact', methods=['POST'])
def contact():
    data = request.get_json()
    
    if not data or not data.get('name') or not data.get('email') or not data.get('message'):
        return jsonify({'message': 'Name, email, and message are required'}), 400
    
    # In a real app, send email or save to database
    # For now, just return success
    return jsonify({'message': 'Message sent successfully'}), 200

@bp.route('/featured-properties', methods=['GET'])
def get_featured_properties():
    # In a real app, query for featured properties
    # For now, return empty list
    return jsonify([]), 200
