from flask import Flask, request
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your_secret_key'
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Store messages in-memory (for demo; use DB for production)
chat_rooms = {}

@app.route('/')
def index():
    return "SocketIO Chat Server Running"

@socketio.on('join')
def handle_join(data):
    room = data['room']
    join_room(room)
    emit('status', {'msg': f"{data['user']} has entered the chat."}, room=room)

@socketio.on('leave')
def handle_leave(data):
    room = data['room']
    leave_room(room)
    emit('status', {'msg': f"{data['user']} has left the chat."}, room=room)

@socketio.on('send_message')
def handle_send_message(data):
    room = data['room']
    msg = {
        'user': data['user'],
        'message': data['message'],
        'timestamp': data.get('timestamp')
    }
    chat_rooms.setdefault(room, []).append(msg)
    emit('receive_message', msg, room=room)

if __name__ == '__main__':
    socketio.run(app, debug=True)
