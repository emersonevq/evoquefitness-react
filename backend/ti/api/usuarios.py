from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.db import get_db
from ti.schemas.user import UserCreate, UserCreatedOut, UserAvailability
from ti.services.users import criar_usuario as service_criar, check_user_availability

router = APIRouter(prefix="/usuarios", tags=["TI - Usuarios"])

@router.post("", response_model=UserCreatedOut)
def criar_usuario(payload: UserCreate, db: Session = Depends(get_db)):
    try:
        return service_criar(db, payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao criar usuário: {e}")

@router.get("/check-availability", response_model=UserAvailability)
def check_availability(email: str | None = None, username: str | None = None, db: Session = Depends(get_db)):
    if email is None and username is None:
        raise HTTPException(status_code=400, detail="Informe email ou username para verificar")
    return check_user_availability(db, email, username)
