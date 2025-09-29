from __future__ import annotations
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from fastapi.middleware.cors import CORSMiddleware
from ti.api import chamados_router, unidades_router, problemas_router, notifications_router, email_debug_router
from ti.api.usuarios import router as usuarios_router
from core.realtime import mount_socketio
import json
from typing import Any

# Create the FastAPI application (HTTP)
_http = FastAPI(title="Evoque API - TI", version="1.0.0")
# Static uploads mount
_base_dir = Path(__file__).resolve().parent
_uploads = _base_dir / "uploads"
_uploads.mkdir(parents=True, exist_ok=True)
_http.mount("/uploads", StaticFiles(directory=str(_uploads), html=False), name="uploads")

_http.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@_http.get("/api/ping")
def ping():
    return {"message": "pong"}

@_http.get("/api/login-media")
def login_media():
    path = _uploads / "login-media.json"
    if not path.exists():
        return []
    try:
        data: Any = json.loads(path.read_text("utf-8"))
        if isinstance(data, list):
            return data
        return []
    except Exception:
        return []

# Primary mount under /api
_http.include_router(chamados_router, prefix="/api")
_http.include_router(usuarios_router, prefix="/api")
_http.include_router(unidades_router, prefix="/api")
_http.include_router(problemas_router, prefix="/api")
_http.include_router(notifications_router, prefix="/api")
_http.include_router(email_debug_router, prefix="/api")

# Compatibility mount without prefix, in case the server is run without proxy
_http.include_router(chamados_router)
_http.include_router(usuarios_router)
_http.include_router(unidades_router)
_http.include_router(problemas_router)
_http.include_router(notifications_router)
_http.include_router(email_debug_router)

# Wrap with Socket.IO ASGI app (exports as 'app')
app = mount_socketio(_http)
