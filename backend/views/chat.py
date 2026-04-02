from flask import Blueprint, request, jsonify
from models import db, Chat, ChatMessage, User
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

chat_bp = Blueprint('chats', __name__)


def serialize_chat(c):
    # Get user info
    user = User.query.get(c.user_id)
    user_name = user.name if user else f"Unknown User {c.user_id}"
    user_phone = user.phone if user else None
    
    return {
        'id': c.id,
        'user_id': c.user_id,
        'user_name': user_name,
        'user_phone': user_phone,
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
    """Create a new chat or return existing one"""
    try:
        data = request.get_json() or {}
        user_id = data.get('user_id')
        property_id = data.get('property_id')
        
        print(f"📨 Start chat request - user_id: {user_id}, property_id: {property_id}")

        if not user_id:
            return jsonify({'error': 'user_id is required'}), 400

        # Always reuse the most recent active chat for this user
        existing = Chat.query.filter_by(
            user_id=user_id,
            status='active'
        ).order_by(Chat.last_active.desc()).first()

        if existing:
            print(f"✅ Found existing chat: {existing.id}")
            return jsonify({'chat': serialize_chat(existing)}), 200

        # Create new chat
        chat = Chat(
            user_id=user_id, 
            property_id=property_id, 
            chat_type='inquiry',
            status='active',
            last_active=datetime.utcnow()
        )

        user_obj = User.query.get(user_id)
        user_name = user_obj.name if user_obj else f'User {user_id}'
        user_email = user_obj.email if user_obj else 'N/A'
        user_phone = user_obj.phone if user_obj else 'N/A'
        db.session.add(chat)
        db.session.commit()
        
        # Create admin notification
        try:
            from models import Notification, User
            from views.email_service import email_service
            
            # Get all admin users
            admin_users = User.query.filter_by(role='admin').all()
            
            # Create notifications for all admins
            for admin in admin_users:
                notification = Notification(
                    user_id=admin.id,
                    type='chat',
                    title='New Chat Inquiry',
                    message=f'New chat inquiry from {user_name}',
                    related_id=chat.id,
                    priority='normal'
                )
                db.session.add(notification)
            
            # Send email notification to admin
            user_obj = User.query.get(user_id)
            email_service.send_admin_chat_notification(chat, user_obj)
            
            db.session.commit()
            logger.info(f"Admin notifications created for chat {chat.id}")
            
        except Exception as e:
            logger.error(f"Failed to create admin notification for chat {chat.id}: {str(e)}")
            db.session.rollback()
        
        print(f"✅ Created new chat: {chat.id}")
        return jsonify({'chat': serialize_chat(chat)}), 201
        
    except Exception as e:
        print(f"❌ Error creating chat: {str(e)}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@chat_bp.route('/user/<int:user_id>', methods=['GET'])
def get_user_chats(user_id):
    """Get all chats for a user"""
    try:
        chats = Chat.query.filter_by(
            user_id=user_id
        ).order_by(Chat.last_active.desc()).all()
        
        print(f"📋 Found {len(chats)} chats for user {user_id}")
        return jsonify([serialize_chat(c) for c in chats]), 200
    except Exception as e:
        print(f"❌ Error getting user chats: {str(e)}")
        return jsonify({'error': str(e)}), 500


@chat_bp.route('/<int:chat_id>/messages', methods=['GET'])
def get_messages(chat_id):
    """Get all messages for a chat"""
    try:
        chat = Chat.query.get(chat_id)
        if not chat:
            return jsonify({'error': 'Chat not found'}), 404

        messages = ChatMessage.query.filter_by(
            chat_id=chat_id
        ).order_by(ChatMessage.timestamp).all()
        
        print(f"📨 Found {len(messages)} messages for chat {chat_id}")
        return jsonify([serialize_message(m) for m in messages]), 200
    except Exception as e:
        print(f"❌ Error getting messages: {str(e)}")
        return jsonify({'error': str(e)}), 500


@chat_bp.route('/<int:chat_id>/messages', methods=['POST'])
def post_message(chat_id):
    """Post a new message to a chat"""
    try:
        data = request.get_json() or {}
        content = data.get('message') or data.get('content')
        sender_id = data.get('sender_id')
        sender_name = data.get('sender_name') or 'Anonymous'
        is_host = bool(data.get('is_host', False))

        print(f"📨 Post message to chat {chat_id}: {content[:50]}...")

        if not content:
            return jsonify({'error': 'message content is required'}), 400

        chat = Chat.query.get(chat_id)
        if not chat:
            return jsonify({'error': 'Chat not found'}), 404

        # Create message
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
        
        # Notify admins when a guest/regular user sends a message
        if not is_host:
            try:
                from models import Notification, User
                from views.email_service import email_service

                admin_users = User.query.filter_by(role='admin').all()
                for admin in admin_users:
                    notification = Notification(
                        user_id=admin.id,
                        type='chat',
                        title='New Chat Message',
                        message=f'New message from {sender_name} in chat #{chat_id}',
                        related_id=chat_id,
                        priority='high'
                    )
                    db.session.add(notification)

                db.session.commit()

                sender_user = User.query.get(sender_id)
                email_service.send_admin_chat_notification(chat, sender_user)

                logger.info(f"Admin notifications created for new message in chat {chat_id}")

            except Exception as notif_err:
                logger.error(f"Failed to create admin notification for message in chat {chat_id}: {notif_err}")
                db.session.rollback()

        print(f"✅ Message saved: {msg.id}")
        return jsonify(serialize_message(msg)), 201
        
    except Exception as e:
        print(f"❌ Error posting message: {str(e)}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@chat_bp.route('/<int:chat_id>/read', methods=['PUT'])
def mark_read(chat_id):
    """Mark all messages in a chat as read"""
    try:
        chat = Chat.query.get(chat_id)
        if not chat:
            return jsonify({'error': 'Chat not found'}), 404

        ChatMessage.query.filter_by(
            chat_id=chat_id, 
            is_read=False
        ).update({'is_read': True})
        
        chat.unread_count = 0
        db.session.commit()
        
        print(f"✅ Marked chat {chat_id} as read")
        return jsonify({'message': 'Marked as read'}), 200
        
    except Exception as e:
        print(f"❌ Error marking as read: {str(e)}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@chat_bp.route('/unread/<int:user_id>', methods=['GET'])
def unread_count(user_id):
    """Get total unread count for a user"""
    try:
        total = db.session.query(
            db.func.coalesce(db.func.sum(Chat.unread_count), 0)
        ).filter(Chat.user_id == user_id).scalar() or 0
        
        print(f"📊 User {user_id} has {total} unread messages")
        return jsonify({'unread': int(total)}), 200
    except Exception as e:
        print(f"❌ Error getting unread count: {str(e)}")
        return jsonify({'error': str(e)}), 500


@chat_bp.route('/', methods=['GET'])
def list_chats():
    """Get all chats (admin usage)"""
    try:
        chats = Chat.query.filter_by(
            status='active'
        ).order_by(Chat.last_active.desc()).all()
        
        print(f"📋 Found {len(chats)} active chats")
        return jsonify([serialize_chat(c) for c in chats]), 200
    except Exception as e:
        print(f"❌ Error listing chats: {str(e)}")
        return jsonify({'error': str(e)}), 500


@chat_bp.route('/grouped', methods=['GET'])
def list_chats_grouped():
    """Get chats grouped by user (admin usage) - one entry per user"""
    try:
        chats = Chat.query.filter_by(
            status='active'
        ).order_by(Chat.last_active.desc()).all()

        # Group chats by user_id
        user_groups = {}
        for c in chats:
            uid = c.user_id
            if uid not in user_groups:
                user = User.query.get(uid)
                user_groups[uid] = {
                    'user_id': uid,
                    'user_name': user.name if user else f"Unknown User {uid}",
                    'user_phone': user.phone if user else None,
                    'chat_ids': [],
                    'unread_count': 0,
                    'last_message': None,
                    'last_message_time': None,
                    'last_active': None,
                    'primary_chat_id': None,
                }
            group = user_groups[uid]
            group['chat_ids'].append(c.id)
            group['unread_count'] += (c.unread_count or 0)

            # Keep the most recent message / activity
            if c.last_active and (
                group['last_active'] is None or c.last_active > group['last_active']
            ):
                group['last_active'] = c.last_active
                group['last_message'] = c.last_message
                group['last_message_time'] = c.last_message_time
                group['primary_chat_id'] = c.id

        # Build response sorted by most recent activity
        result = sorted(user_groups.values(),
                        key=lambda g: g['last_active'] or datetime.min,
                        reverse=True)
        for g in result:
            g['last_active'] = g['last_active'].isoformat() if g['last_active'] else None
            g['last_message_time'] = g['last_message_time'].isoformat() if g['last_message_time'] else None
            if g['primary_chat_id'] is None and g['chat_ids']:
                g['primary_chat_id'] = g['chat_ids'][0]

        print(f"📋 Grouped {len(chats)} chats into {len(result)} user conversations")
        return jsonify(result), 200
    except Exception as e:
        print(f"❌ Error listing grouped chats: {str(e)}")
        return jsonify({'error': str(e)}), 500


@chat_bp.route('/user/<int:user_id>/all-messages', methods=['GET'])
def get_user_all_messages(user_id):
    """Get ALL messages across all chats for a user (admin usage)"""
    try:
        chat_ids = [c.id for c in Chat.query.filter_by(user_id=user_id).all()]
        if not chat_ids:
            return jsonify([]), 200

        messages = ChatMessage.query.filter(
            ChatMessage.chat_id.in_(chat_ids)
        ).order_by(ChatMessage.timestamp).all()

        print(f"📨 Found {len(messages)} total messages for user {user_id} across {len(chat_ids)} chats")
        return jsonify([serialize_message(m) for m in messages]), 200
    except Exception as e:
        print(f"❌ Error getting user messages: {str(e)}")
        return jsonify({'error': str(e)}), 500


@chat_bp.route('/user/<int:user_id>/read-all', methods=['PUT'])
def mark_user_all_read(user_id):
    """Mark all messages in all chats for a user as read"""
    try:
        chats = Chat.query.filter_by(user_id=user_id).all()
        for c in chats:
            ChatMessage.query.filter_by(chat_id=c.id, is_read=False).update({'is_read': True})
            c.unread_count = 0
        db.session.commit()

        print(f"✅ Marked all chats for user {user_id} as read")
        return jsonify({'message': 'All marked as read'}), 200
    except Exception as e:
        print(f"❌ Error marking user chats as read: {str(e)}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500