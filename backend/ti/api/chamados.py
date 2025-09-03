from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.db import get_db
from ti.schemas.chamado import ChamadoCreate, ChamadoOut
from ti.services.chamados import criar_chamado as service_criar

router = APIRouter(prefix="/chamados", tags=["TI - Chamados"])

@router.get("", response_model=list[ChamadoOut])
def listar_chamados(db: Session = Depends(get_db)):
    from ..models import Chamado
    return db.query(Chamado).order_by(Chamado.id.desc()).all()

@router.post("", response_model=ChamadoOut)
def criar_chamado(payload: ChamadoCreate, db: Session = Depends(get_db)):
    try:
        return service_criar(db, payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Erro ao criar chamado")
