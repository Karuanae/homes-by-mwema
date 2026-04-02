# socket_events.py - FIXED VERSION WITH DATABASE PERSISTENCE
from flask import request
from flask_socketio import emit, join_room, leave_room
from datetime import datetime
import logging

# Import database models
from models import db, Chat, ChatMessage, User, Notification

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Store active connections
active_connections = {}  # {socket_id: {user_id, user_type, rooms}}

def register_chat_events(socketio):
    """Register all SocketIO event handlers"""
    
    @socketio.on('connect')
    def handle_connect():
        """Handle new client connection"""
        logger.info(f'🔌 Client connected: {request.sid}')
        active_connections[request.sid] = {
            'user_id': None,
            'user_type': None,
            'rooms': set(),
            'connected_at': datetime.utcnow()
        }
        emit('connected', {
            'status': 'connected',
            'sid': request.sid,
            'timestamp': datetime.utcnow().isoformat()
        })
    
    @socketio.on('disconnect')
    def handle_disconnect():
        """Handle client disconnection"""
        sid = request.sid
        if sid in active_connections:
            logger.info(f'🔌 Client disconnected: {sid} (User: {active_connections[sid]["user_id"]})')
            del active_connections[sid]
        else:
            logger.info(f'🔌 Client disconnected: {sid}')
    
    @socketio.on('authenticate')
    def handle_authentication(data):
        """Authenticate user and set up their rooms"""
        sid = request.sid
        user_id = data.get('user_id')
        user_type = data.get('user_type', 'user')
        
        if not user_id:
            emit('auth_error', {'message': 'User ID is required'})
            return
        
        # Update connection info
        if sid in active_connections:
            active_connections[sid]['user_id'] = user_id
            active_connections[sid]['user_type'] = user_type
        
        # Join user's personal room for private messages
        join_room(f"user_{user_id}")
        active_connections[sid]['rooms'].add(f"user_{user_id}")
        
        # If admin, join admin broadcast room
        if user_type == 'admin':
            join_room("admin_broadcast")
            active_connections[sid]['rooms'].add("admin_broadcast")
            logger.info(f'👑 Admin authenticated: {user_id} on socket {sid}')
        else:
            logger.info(f'👤 User authenticated: {user_id} on socket {sid}')
        
        emit('authenticated', {
            'status': 'success',
            'user_id': user_id,
            'user_type': user_type,
            'timestamp': datetime.utcnow().isoformat()
        })
    
    @socketio.on('join_chat')
    def handle_join_chat(data):
        """Join a specific chat room"""
        sid = request.sid
        chat_id = data.get('chat_id')
        
        if not chat_id:
            emit('error', {'message': 'Chat ID is required'})
            return
        
        # Get user info from connection
        if sid not in active_connections or not active_connections[sid]['user_id']:
            emit('error', {'message': 'Please authenticate first'})
            return
        
        user_id = active_connections[sid]['user_id']
        
        # Join the chat room
        room_name = f"chat_{chat_id}"
        join_room(room_name)
        active_connections[sid]['rooms'].add(room_name)
        
        logger.info(f'💬 User {user_id} joined chat {chat_id} on socket {sid}')
        
        emit('joined_chat', {
            'chat_id': chat_id,
            'timestamp': datetime.utcnow().isoformat()
        })
    
    @socketio.on('send_message')
    def handle_send_message(data):
        """Handle sending a new message - FIXED TO SAVE TO DATABASE"""
        sid = request.sid
        chat_id = data.get('chat_id')
        content = data.get('content')
        sender_name = data.get('sender_name', 'User')
        
        # Validation
        if not all([chat_id, content]):
            emit('error', {'message': 'Chat ID and content are required'})
            return
        
        if sid not in active_connections or not active_connections[sid]['user_id']:
            emit('error', {'message': 'Please authenticate first'})
            return
        
        user_id = active_connections[sid]['user_id']
        user_type = active_connections[sid]['user_type']
        is_admin = user_type == 'admin'
        
        try:
            # ✅ SAVE MESSAGE TO DATABASE
            chat = Chat.query.get(chat_id)
            if not chat:
                emit('error', {'message': f'Chat {chat_id} not found'})
                return
            
            # Create and save message
            message = ChatMessage(
                chat_id=chat_id,
                sender_id=user_id,
                sender_name=sender_name,
                content=content,
                is_host=is_admin,
                message_type='text',
                is_read=False,
                timestamp=datetime.utcnow()
            )
            db.session.add(message)
            
            # Update chat metadata
            chat.last_message = content
            chat.last_message_time = datetime.utcnow()
            chat.last_active = datetime.utcnow()
            if not is_admin:
                chat.unread_count = (chat.unread_count or 0) + 1
            
            db.session.commit()
            
            logger.info(f'💾 Message saved to database: Chat {chat_id}, Message ID {message.id}')
            
            # Create message data for broadcast
            message_data = {
                'id': message.id,
                'chat_id': chat_id,
                'sender_id': user_id,
                'sender_name': sender_name,
                'content': content,
                'is_host': is_admin,
                'timestamp': message.timestamp.isoformat(),
                'is_read': False,
                'message_type': 'text'
            }
            
            # Broadcast to everyone in the chat room
            room_name = f"chat_{chat_id}"
            emit('new_message', message_data, room=room_name)
            
            # Notify admin broadcast room if message is from client
            if not is_admin:
                notification = {
                    'type': 'new_message',
                    'chat_id': chat_id,
                    'user_id': user_id,
                    'user_name': sender_name,
                    'message_preview': content[:50],
                    'timestamp': datetime.utcnow().isoformat()
                }
                emit('chat_notification', notification, room="admin_broadcast")

                # Persist a notification in the database for admin dashboard
                try:
                    from views.email_service import email_service
                    admin_users = User.query.filter_by(role='admin').all()
                    for admin in admin_users:
                        notif = Notification(
                            user_id=admin.id,
                            type='chat',
                            title='New Chat Message',
                            message=f'New message from {sender_name} in chat #{chat_id}',
                            related_id=chat_id,
                            priority='high'
                        )
                        db.session.add(notif)
                    db.session.commit()

                    sender_user = User.query.get(user_id)
                    email_service.send_admin_chat_notification(chat, sender_user)
                except Exception as e:
                    logger.error(f'❌ Error creating/sending admin notification for chat message: {str(e)}')

            logger.info(f'💬 Message sent in chat {chat_id} by user {user_id}')
            
        except Exception as e:
            logger.error(f'❌ Error saving message: {str(e)}')
            db.session.rollback()
            emit('error', {'message': 'Failed to save message'})
    
    @socketio.on('typing')
    def handle_typing(data):
        """Handle typing indicators"""
        sid = request.sid
        chat_id = data.get('chat_id')
        is_typing = data.get('is_typing', False)
        
        if not chat_id:
            return
        
        if sid not in active_connections or not active_connections[sid]['user_id']:
            return
        
        user_id = active_connections[sid]['user_id']
        
        # Broadcast typing indicator to others in the chat
        room_name = f"chat_{chat_id}"
        emit('user_typing', {
            'user_id': user_id,
            'is_typing': is_typing,
            'timestamp': datetime.utcnow().isoformat()
        }, room=room_name, include_self=False)
    
    @socketio.on('create_chat')
    def handle_create_chat(data):
        """Create a new chat - FIXED TO SAVE TO DATABASE"""
        sid = request.sid
        user_id = data.get('user_id')
        property_id = data.get('property_id')
        initial_message = data.get('initial_message', 'Hello, I need assistance.')
        
        if not user_id:
            emit('error', {'message': 'User ID is required'})
            return
        
        if sid not in active_connections or not active_connections[sid]['user_id']:
            emit('error', {'message': 'Please authenticate first'})
            return
        
        try:
            # ✅ CHECK IF CHAT ALREADY EXISTS
            existing_chat = Chat.query.filter_by(
                user_id=user_id,
                property_id=property_id,
                status='active'
            ).first()
            
            if existing_chat:
                logger.info(f'💬 Chat already exists: {existing_chat.id}')
                
                # User joins the existing chat room
                room_name = f"chat_{existing_chat.id}"
                join_room(room_name)
                active_connections[sid]['rooms'].add(room_name)
                
                emit('chat_exists', {
                    'chat_id': existing_chat.id,
                    'message': 'Joined existing chat',
                    'timestamp': datetime.utcnow().isoformat()
                })
                return
            
            # ✅ CREATE NEW CHAT IN DATABASE
            chat = Chat(
                user_id=user_id,
                property_id=property_id,
                chat_type='inquiry',
                status='active',
                unread_count=0,
                last_active=datetime.utcnow()
            )
            db.session.add(chat)
            db.session.flush()  # Get the chat ID
            
            chat_id = chat.id
            
            # ✅ SAVE INITIAL MESSAGE TO DATABASE
            message = ChatMessage(
                chat_id=chat_id,
                sender_id=user_id,
                sender_name=f"User {user_id}",
                content=initial_message,
                is_host=False,
                message_type='text',
                is_read=False,
                timestamp=datetime.utcnow()
            )
            db.session.add(message)
            
            # Update chat with first message
            chat.last_message = initial_message
            chat.last_message_time = datetime.utcnow()
            chat.unread_count = 1
            
            db.session.commit()
            
            logger.info(f'💾 New chat created in database: {chat_id} for user {user_id}')
            
            # User joins the new chat room
            room_name = f"chat_{chat_id}"
            join_room(room_name)
            active_connections[sid]['rooms'].add(room_name)
            
            # Notify admin about new chat
            notification = {
                'type': 'new_chat',
                'chat_id': chat_id,
                'user_id': user_id,
                'user_name': f"User {user_id}",
                'message_preview': initial_message[:50],
                'property_id': property_id,
                'timestamp': datetime.utcnow().isoformat()
            }
            emit('chat_notification', notification, room="admin_broadcast")
            
            # Send initial message to the room
            message_data = {
                'id': message.id,
                'chat_id': chat_id,
                'sender_id': user_id,
                'sender_name': f"User {user_id}",
                'content': initial_message,
                'is_host': False,
                'timestamp': message.timestamp.isoformat(),
                'is_read': False,
                'message_type': 'text'
            }
            emit('new_message', message_data, room=room_name)
            
            emit('chat_created', {
                'chat_id': chat_id,
                'message': 'Chat created successfully',
                'timestamp': datetime.utcnow().isoformat()
            })
            
        except Exception as e:
            logger.error(f'❌ Error creating chat: {str(e)}')
            db.session.rollback()
            emit('error', {'message': 'Failed to create chat'})
    
    @socketio.on('get_active_chats')
    def handle_get_active_chats(data):
        """Get active chats from database (for admin dashboard)"""
        sid = request.sid
        
        if sid not in active_connections or not active_connections[sid]['user_id']:
            emit('error', {'message': 'Please authenticate first'})
            return
        
        user_id = active_connections[sid]['user_id']
        user_type = active_connections[sid]['user_type']
        
        if user_type != 'admin':
            emit('error', {'message': 'Admin access required'})
            return
        
        try:
            # ✅ GET CHATS FROM DATABASE
            chats = Chat.query.filter_by(status='active').order_by(Chat.last_active.desc()).all()
            
            chat_list = []
            for chat in chats:
                user = User.query.get(chat.user_id)
                chat_list.append({
                    'id': chat.id,
                    'user_id': chat.user_id,
                    'user_name': user.name if user else f'User {chat.user_id}',
                    'last_message': chat.last_message or 'No messages yet',
                    'unread_count': chat.unread_count or 0,
                    'last_active': chat.last_active.isoformat() if chat.last_active else None,
                    'property_id': chat.property_id
                })
            
            emit('active_chats', {
                'chats': chat_list,
                'count': len(chat_list),
                'timestamp': datetime.utcnow().isoformat()
            })
            
        except Exception as e:
            logger.error(f'❌ Error getting active chats: {str(e)}')
            emit('error', {'message': 'Failed to get active chats'})
    
    @socketio.on('leave_chat')
    def handle_leave_chat(data):
        """Leave a chat room"""
        sid = request.sid
        chat_id = data.get('chat_id')
        
        if not chat_id:
            return
        
        room_name = f"chat_{chat_id}"
        leave_room(room_name)
        
        if sid in active_connections:
            active_connections[sid]['rooms'].discard(room_name)
    
    # Keep-alive ping
    @socketio.on('heartbeat')
    def handle_heartbeat():
        """Handle heartbeat to keep connection alive"""
        emit('heartbeat_ack', {
            'timestamp': datetime.utcnow().isoformat()
        })
    
    logger.info("✅ SocketIO chat events registered successfully with DATABASE PERSISTENCE")