import socketio

# Single Socket.IO server instance for the whole app
sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")


def mount_socketio(app):
    """Wrap FastAPI app with Socket.IO mounted at /socket.io (standard)."""
    return socketio.ASGIApp(sio, other_asgi_app=app, socketio_path="socket.io")
