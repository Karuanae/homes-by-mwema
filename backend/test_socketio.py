# test_socketio.py
import socketio
import time

# Create a SocketIO client
sio = socketio.Client()

@sio.event
def connect():
    print("✅ Connected to server")
    print("Testing ping...")
    sio.emit('ping')

@sio.event
def pong(data):
    print(f"📨 Received pong: {data}")
    print("Testing authentication...")
    sio.emit('authenticate', {'user_id': 'test_123', 'user_type': 'user'})

@sio.event
def connected(data):
    print(f"🔌 Connection established: {data}")

@sio.event
def authenticated(data):
    print(f"✅ Authenticated: {data}")
    print("Testing chat creation...")
    sio.emit('create_chat', {
        'user_id': 'test_123',
        'property_id': 'prop_456',
        'initial_message': 'Hello, I need help with booking'
    })

@sio.event
def chat_created(data):
    print(f"💬 Chat created: {data}")
    chat_id = data['chat_id']
    print(f"Joining chat {chat_id}...")
    sio.emit('join_chat', {'chat_id': chat_id})

@sio.event
def joined_chat(data):
    print(f"✅ Joined chat: {data}")
    print("Testing message sending...")
    sio.emit('send_message', {
        'chat_id': data['chat_id'],
        'content': 'This is a test message',
        'sender_name': 'Test User'
    })

@sio.event
def new_message(data):
    print(f"📩 New message received: {data}")
    print("✅ All tests passed! Press Ctrl+C to exit.")

@sio.event
def chat_notification(data):
    print(f"🔔 Chat notification: {data}")

@sio.event
def error(data):
    print(f"❌ Error: {data}")

@sio.event
def disconnect():
    print("❌ Disconnected from server")

# Connect to server
try:
    print("🔄 Connecting to SocketIO server...")
    sio.connect('http://localhost:5000')
    print("✅ Connected! Running tests...")
    sio.wait()
except KeyboardInterrupt:
    print("\n👋 Exiting...")
    sio.disconnect()
except Exception as e:
    print(f"❌ Connection failed: {e}")