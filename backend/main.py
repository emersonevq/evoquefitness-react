from __future__ import annotations
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from fastapi.middleware.cors import CORSMiddleware
from ti.api import chamados_router, unidades_router, problemas_router, notifications_router, email_debug_router
from ti.api.usuarios import router as usuarios_router
from core.realtime import mount_socketio
import json
from typing import Any, List, Dict
import uuid

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

_login_media_json = _uploads / "login-media.json"
_login_media_dir = _uploads / "login-media"
_login_media_dir.mkdir(parents=True, exist_ok=True)


def _read_login_media() -> List[Dict[str, Any]]:
    if not _login_media_json.exists():
        return []
    try:
        data: Any = json.loads(_login_media_json.read_text("utf-8"))
        if isinstance(data, list):
            return data
    except Exception:
        pass
    return []


def _write_login_media(items: List[Dict[str, Any]]) -> None:
    _login_media_json.write_text(json.dumps(items, ensure_ascii=False, indent=2), "utf-8")


@_http.get("/api/login-media")
def login_media():
    return _read_login_media()


@_http.post("/api/login-media/upload")
async def upload_login_media(file: UploadFile = File(...)):
    if not file:
        raise HTTPException(status_code=400, detail="Arquivo ausente")
    content_type = (file.content_type or "").lower()
    if content_type.startswith("image/"):
        kind = "image"
        ext = ".jpg"
    elif content_type.startswith("video/"):
        kind = "video"
        ext = ".mp4"
    else:
        raise HTTPException(status_code=400, detail="Tipo de arquivo não suportado")

    original_name = Path(file.filename or "arquivo").name
    safe_stem = "_".join(Path(original_name).stem.split()) or "arquivo"
    unique = f"{uuid.uuid4().hex[:10]}_{safe_stem}"
    # Preserve extension if safe
    ext_from_name = Path(original_name).suffix.lower()
    if ext_from_name and len(ext_from_name) <= 6:
        ext = ext_from_name
    dest = _login_media_dir / f"{unique}{ext}"

    data = await file.read()
    dest.write_bytes(data)

    url = f"/uploads/login-media/{dest.name}"
    items = _read_login_media()
    item = {
        "id": uuid.uuid4().hex,
        "type": kind,
        "url": url,
    }
    items.append(item)
    _write_login_media(items)
    return item


@_http.delete("/api/login-media/{item_id}")
async def delete_login_media(item_id: str):
    items = _read_login_media()
    remaining: List[Dict[str, Any]] = []
    removed: Dict[str, Any] | None = None
    for it in items:
        if str(it.get("id")) == str(item_id):
            removed = it
        else:
            remaining.append(it)
    if removed is None:
        raise HTTPException(status_code=404, detail="Item não encontrado")

    # Best-effort file deletion if hosted locally in /uploads/login-media
    try:
        url = str(removed.get("url") or "")
        prefix = "/uploads/login-media/"
        if url.startswith(prefix):
            fname = url[len(prefix):]
            fpath = _login_media_dir / fname
            if fpath.exists() and fpath.is_file():
                fpath.unlink()
    except Exception:
        pass

    _write_login_media(remaining)
    return {"ok": True}

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
