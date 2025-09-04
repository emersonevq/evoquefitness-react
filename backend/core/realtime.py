import socketio
from typing import Callable, Awaitable, Any

# Single Socket.IO server instance for the whole app
sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")


class _MultiPathSocketIO:
    def __init__(self, app, paths: list[str]):
        # Primary Socket.IO app mounted at /socket.io
        self.app = app
        self.sio_app = socketio.ASGIApp(sio, other_asgi_app=app, socketio_path="socket.io")
        self.paths = set(paths)

    async def __call__(self, scope: dict, receive: Callable[..., Awaitable[Any]], send: Callable[..., Awaitable[Any]]):
        p = scope.get("path", "") or ""
        if any(p.startswith(path) for path in self.paths):
            # Normalize /api/socket.io -> /socket.io so inner ASGIApp matches its configured socketio_path
            if p.startswith("/api/socket.io"):
                # Clone scope with adjusted path
                scope = dict(scope)
                rest = p[len("/api/socket.io"):]
                scope["path"] = "/socket.io" + rest
            return await self.sio_app(scope, receive, send)
        return await self.app(scope, receive, send)


def mount_socketio(app):
    """Wrap FastAPI app and route Socket.IO on both /socket.io and /api/socket.io."""
    return _MultiPathSocketIO(app, paths=["/socket.io", "/api/socket.io"])
