from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.db import get_db
from ti.schemas.user import UserCreate, UserOut
from ti.services.users import criar_usuario as service_criar

router = APIRouter(prefix="/usuarios", tags=["TI - Usuarios"])

@router.post("", response_model=UserOut)
def criar_usuario(payload: UserCreate, db: Session = Depends(get_db)):
    try:
        return service_criar(db, payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Erro ao criar usuário")
