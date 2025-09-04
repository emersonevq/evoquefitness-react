from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.db import get_db, engine
from ti.schemas.user import UserCreate, UserCreatedOut, UserAvailability, UserOut
from ti.services.users import criar_usuario as service_criar, check_user_availability, generate_password

router = APIRouter(prefix="/usuarios", tags=["TI - Usuarios"])

@router.get("", response_model=list[UserOut])
def listar_usuarios(db: Session = Depends(get_db)):
    try:
        from ..models import User
        try:
            User.__table__.create(bind=engine, checkfirst=True)
        except Exception:
            pass
        try:
            return db.query(User).order_by(User.id.desc()).all()
        except Exception:
            pass
        # Fallback: tabela legada "usuarios"
        from sqlalchemy import text
        try:
            res = db.execute(text(
                "SELECT id, nome, sobrenome, usuario, email, nivel_acesso, setor FROM usuarios ORDER BY id DESC"
            ))
            rows = []
            for r in res.fetchall():
                rows.append({
                    "id": r[0],
                    "nome": r[1],
                    "sobrenome": r[2],
                    "usuario": r[3],
                    "email": r[4],
                    "nivel_acesso": r[5],
                    "setor": r[6],
                })
            return rows
        except Exception:
            return []
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao listar usuários: {e}")

@router.post("", response_model=UserCreatedOut)
def criar_usuario(payload: UserCreate, db: Session = Depends(get_db)):
    try:
        from ..models import User
        try:
            User.__table__.create(bind=engine, checkfirst=True)
        except Exception:
            pass
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

@router.get("/generate-password")
def generate_password_endpoint(length: int = 6):
    if length < 6:
        length = 6
    if length > 64:
        length = 64
    return {"senha": generate_password(length)}
