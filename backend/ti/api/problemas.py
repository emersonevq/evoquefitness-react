from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.db import get_db, engine
from ti.schemas.problema import ProblemaCreate, ProblemaOut

router = APIRouter(prefix="/problemas", tags=["TI - Problemas"])

@router.on_event("startup")
def init_table():
    try:
        from ..models.problema import Problema
        Problema.__table__.create(bind=engine, checkfirst=True)
    except Exception:
        pass

@router.get("", response_model=list[ProblemaOut])
def listar_problemas(db: Session = Depends(get_db)):
    from ..models import Problema
    try:
        items = db.query(Problema).order_by(Problema.nome.asc()).all()
        return items
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao listar problemas: {e}")

@router.post("", response_model=ProblemaOut)
def criar_problema(payload: ProblemaCreate, db: Session = Depends(get_db)):
    try:
        from ti.services.problemas import criar_problema as service_criar
        return service_criar(db, payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao criar problema: {e}")
