from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.db import get_db, engine
from ti.schemas.unidade import UnidadeCreate, UnidadeOut

router = APIRouter(prefix="/unidades", tags=["TI - Unidades"])

@router.on_event("startup")
def init_table():
    # Create table if not exists
    try:
        from ..models.unidade import Unidade
        Unidade.__table__.create(bind=engine, checkfirst=True)
    except Exception:
        pass

@router.get("", response_model=list[UnidadeOut])
def listar_unidades(db: Session = Depends(get_db)):
    from ..models import Unidade
    try:
        return db.query(Unidade).order_by(Unidade.id.desc()).all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao listar unidades: {e}")

@router.post("", response_model=UnidadeOut)
def criar_unidade(payload: UnidadeCreate, db: Session = Depends(get_db)):
    try:
        from ti.services.unidades import criar_unidade as service_criar
        return service_criar(db, payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao criar unidade: {e}")
