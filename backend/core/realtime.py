import socketio

import socketio
import asyncio

# Single Socket.IO server instance for the whole app
sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")


def mount_socketio(app):
    """Wrap FastAPI app with Socket.IO ASGI app.
    Returns an ASGI application that serves both HTTP and Socket.IO.
    """
    # Expose Socket.IO under /socket.io (standard path for compatibility)
    return socketio.ASGIApp(sio, other_asgi_app=app, socketio_path="socket.io")


# Lightweight handlers: clients should emit 'identify' with { user_id }
# so server can add the socket to a dedicated room 'user:{id}'.
@sio.event
async def connect(sid, environ):
    print(f"[SIO] connect: {sid}")


@sio.event
async def disconnect(sid):
    print(f"[SIO] disconnect: {sid}")


@sio.on("identify")
async def handle_identify(sid, data):
    try:
        uid = data.get("user_id") if isinstance(data, dict) else None
        if uid is None:
            return
        room = f"user:{uid}"
        await sio.save_session(sid, {"user_id": uid})
        await sio.enter_room(sid, room)
        print(f"[SIO] sid={sid} joined room={room}")
    except Exception as e:
        print(f"[SIO] identify error: {e}")


async def emit_logout_for_user(user_id: int):
    """Helper to emit logout event to a user's room."""
    try:
        room = f"user:{user_id}"
        print(f"[SIO] emitting auth:logout to room={room}")
        await sio.emit("auth:logout", {"user_id": user_id}, room=room)
    except Exception as e:
        print(f"[SIO] emit_logout error: {e}")


async def emit_refresh_for_user(user_id: int):
    """Notify a specific user that their permissions/profile changed."""
    try:
        room = f"user:{user_id}"
        print(f"[SIO] emitting auth:refresh to room={room}")
        await sio.emit("auth:refresh", {"user_id": user_id}, room=room)
    except Exception as e:
        print(f"[SIO] emit_refresh error: {e}")


# Synchronous wrapper that can be safely passed to start_background_task from any thread.
def emit_logout_sync(user_id: int):
    """Run the async emit in a fresh event loop (safe from threads)."""
    try:
        import asyncio
        asyncio.run(emit_logout_for_user(user_id))
    except Exception as e:
        print(f"[SIO] emit_logout_sync error: {e}")


def emit_refresh_sync(user_id: int):
    """Sync wrapper for emit_refresh_for_user."""
    try:
        import asyncio
        asyncio.run(emit_refresh_for_user(user_id))
    except Exception as e:
        print(f"[SIO] emit_refresh_sync error: {e}")
