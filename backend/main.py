from __future__ import annotations
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from ti.api import chamados_router, unidades_router, problemas_router
from ti.api.usuarios import router as usuarios_router

app = FastAPI(title="Evoque API - TI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/ping")
def ping():
    return {"message": "pong"}

# Primary mount under /api
app.include_router(chamados_router, prefix="/api")
app.include_router(usuarios_router, prefix="/api")
app.include_router(unidades_router, prefix="/api")
app.include_router(problemas_router, prefix="/api")

# Compatibility mount without prefix, in case the server is run without proxy
app.include_router(chamados_router)
app.include_router(usuarios_router)
app.include_router(unidades_router)
app.include_router(problemas_router)
