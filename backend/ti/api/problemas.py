from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.db import get_db, engine
from ti.schemas.problema import ProblemaCreate, ProblemaOut

router = APIRouter(prefix="/problemas", tags=["TI - Problemas"])

@router.get("", response_model=list[ProblemaOut])
def listar_problemas(db: Session = Depends(get_db)):
    from ..models import Problema
    try:
        Problema.__table__.create(bind=engine, checkfirst=True)
        items = db.query(Problema).order_by(Problema.nome.asc()).all()
        return items
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao listar problemas: {e}")

@router.post("", response_model=ProblemaOut)
def criar_problema(payload: ProblemaCreate, db: Session = Depends(get_db)):
    try:
        from ..models import Problema
        Problema.__table__.create(bind=engine, checkfirst=True)
        from ti.services.problemas import criar_problema as service_criar
        return service_criar(db, payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao criar problema: {e}")
