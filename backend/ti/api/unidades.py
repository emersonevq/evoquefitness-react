from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.db import get_db, engine
from ti.schemas.unidade import UnidadeCreate, UnidadeOut

router = APIRouter(prefix="/unidades", tags=["TI - Unidades"])

@router.get("", response_model=list[UnidadeOut])
def listar_unidades(db: Session = Depends(get_db)):
    from ..models import Unidade, Chamado
    try:
        try:
            Unidade.__table__.create(bind=engine, checkfirst=True)
        except Exception:
            pass
        try:
            rows = db.query(Unidade).order_by(Unidade.id.desc()).all()
        except Exception:
            rows = []
        if rows:
            return rows
        try:
            distinct = [r[0] for r in db.query(Chamado.unidade).distinct().all() if r[0]]
        except Exception:
            distinct = []
        return [
            {"id": 0, "nome": nome, "cidade": ""}
            for nome in sorted(distinct)
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao listar unidades: {e}")

@router.post("", response_model=UnidadeOut)
def criar_unidade(payload: UnidadeCreate, db: Session = Depends(get_db)):
    try:
        from ..models import Unidade
        try:
            Unidade.__table__.create(bind=engine, checkfirst=True)
        except Exception:
            pass
        from ti.services.unidades import criar_unidade as service_criar
        return service_criar(db, payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao criar unidade: {e}")
