from __future__ import annotations
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from fastapi.middleware.cors import CORSMiddleware
from ti.api import chamados_router, unidades_router, problemas_router, notifications_router
from ti.api.usuarios import router as usuarios_router
from core.realtime import mount_socketio

# Create the FastAPI application (HTTP)
_http = FastAPI(title="Evoque API - TI", version="1.0.0")

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

# Primary mount under /api
_http.include_router(chamados_router, prefix="/api")
_http.include_router(usuarios_router, prefix="/api")
_http.include_router(unidades_router, prefix="/api")
_http.include_router(problemas_router, prefix="/api")
_http.include_router(notifications_router, prefix="/api")

# Compatibility mount without prefix, in case the server is run without proxy
_http.include_router(chamados_router)
_http.include_router(usuarios_router)
_http.include_router(unidades_router)
_http.include_router(problemas_router)
_http.include_router(notifications_router)

# Wrap with Socket.IO ASGI app (exports as 'app')
app = mount_socketio(_http)
