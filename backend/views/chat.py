from flask import Blueprint, request, jsonify
from models import db, Chat, ChatMessage
from datetime import datetime

chat_bp = Blueprint('chats', __name__)


def serialize_chat(c):
    return {
        'id': c.id,
        'user_id': c.user_id,
        'property_id': c.property_id,
        'booking_id': c.booking_id,
        'chat_type': c.chat_type,
        'status': c.status,
        'unread_count': c.unread_count,
        'last_message': c.last_message,
        'last_message_time': c.last_message_time.isoformat() if c.last_message_time else None,
        'last_active': c.last_active.isoformat() if c.last_active else None,
        'created_at': c.created_at.isoformat() if c.created_at else None,
    }


def serialize_message(m):
    return {
        'id': m.id,
        'chat_id': m.chat_id,
        'sender_id': m.sender_id,
        'sender_name': m.sender_name,
        'content': m.content,
        'message_type': m.message_type,
        'is_read': m.is_read,
        'is_host': m.is_host,
        'timestamp': m.timestamp.isoformat() if m.timestamp else None,
        'created_at': m.created_at.isoformat() if m.created_at else None,
    }


@chat_bp.route('/', methods=['POST'])
def start_chat():
    data = request.get_json() or {}
    user_id = data.get('user_id')
    property_id = data.get('property_id')

    if not user_id:
        return jsonify({'error': 'user_id is required'}), 400

    # Try to reuse an existing chat for same user & property
    existing = None
    if property_id:
        existing = Chat.query.filter_by(user_id=user_id, property_id=property_id).first()

    if existing:
        return jsonify({'chat': serialize_chat(existing)}), 200

    chat = Chat(user_id=user_id, property_id=property_id, last_active=datetime.utcnow())
    db.session.add(chat)
    db.session.commit()

    return jsonify({'chat': serialize_chat(chat)}), 201


@chat_bp.route('/user/<int:user_id>', methods=['GET'])
def get_user_chats(user_id):
    chats = Chat.query.filter_by(user_id=user_id).order_by(Chat.last_active.desc()).all()
    return jsonify([serialize_chat(c) for c in chats]), 200


@chat_bp.route('/<int:chat_id>/messages', methods=['GET'])
def get_messages(chat_id):
    chat = Chat.query.get(chat_id)
    if not chat:
        return jsonify({'error': 'Chat not found'}), 404

    messages = ChatMessage.query.filter_by(chat_id=chat_id).order_by(ChatMessage.timestamp).all()
    return jsonify([serialize_message(m) for m in messages]), 200


@chat_bp.route('/<int:chat_id>/messages', methods=['POST'])
def post_message(chat_id):
    data = request.get_json() or {}
    content = data.get('message') or data.get('content')
    sender_id = data.get('sender_id')
    sender_name = data.get('sender_name') or 'Anonymous'
    is_host = bool(data.get('is_host', False))

    if not content:
        return jsonify({'error': 'message content is required'}), 400

    chat = Chat.query.get(chat_id)
    if not chat:
        return jsonify({'error': 'Chat not found'}), 404

    msg = ChatMessage(
        chat_id=chat_id,
        sender_id=sender_id,
        sender_name=sender_name,
        content=content,
        is_host=is_host,
        timestamp=datetime.utcnow(),
    )

    db.session.add(msg)
    # Update chat metadata
    chat.last_message = content
    chat.last_message_time = datetime.utcnow()
    chat.last_active = datetime.utcnow()
    chat.unread_count = (chat.unread_count or 0) + 1

    db.session.commit()

    return jsonify(serialize_message(msg)), 201


@chat_bp.route('/<int:chat_id>/read', methods=['PUT'])
def mark_read(chat_id):
    chat = Chat.query.get(chat_id)
    if not chat:
        return jsonify({'error': 'Chat not found'}), 404

    ChatMessage.query.filter_by(chat_id=chat_id, is_read=False).update({'is_read': True})
    chat.unread_count = 0
    db.session.commit()

    return jsonify({'message': 'Marked as read'}), 200


@chat_bp.route('/unread/<int:user_id>', methods=['GET'])
def unread_count(user_id):
    total = db.session.query(db.func.coalesce(db.func.sum(Chat.unread_count), 0)).filter(Chat.user_id == user_id).scalar() or 0
    return jsonify({'unread': int(total)}), 200


@chat_bp.route('/', methods=['GET'])
def list_chats():
    # Return all chats (admin usage)
    chats = Chat.query.order_by(Chat.last_active.desc()).all()
    return jsonify([serialize_chat(c) for c in chats]), 200
