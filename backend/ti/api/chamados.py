from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.db import get_db, engine
from ti.schemas.chamado import ChamadoCreate, ChamadoOut
from ti.services.chamados import criar_chamado as service_criar

router = APIRouter(prefix="/chamados", tags=["TI - Chamados"])

@router.get("", response_model=list[ChamadoOut])
def listar_chamados(db: Session = Depends(get_db)):
    from ..models import Chamado
    try:
        try:
            Chamado.__table__.create(bind=engine, checkfirst=True)
        except Exception:
            pass
        try:
            return db.query(Chamado).order_by(Chamado.id.desc()).all()
        except Exception:
            pass
        # Fallback: tabela legada "chamados"
        from sqlalchemy import text
        try:
            res = db.execute(text(
                "SELECT id, codigo, protocolo, solicitante, cargo, email, telefone, unidade, problema, internet_item, data_visita, data_abertura, status, prioridade FROM chamados ORDER BY id DESC"
            ))
            rows = []
            for r in res.fetchall():
                rows.append({
                    "id": r[0],
                    "codigo": r[1],
                    "protocolo": r[2],
                    "solicitante": r[3],
                    "cargo": r[4],
                    "email": r[5],
                    "telefone": r[6],
                    "unidade": r[7],
                    "problema": r[8],
                    "internet_item": r[9],
                    "data_visita": r[10],
                    "data_abertura": r[11],
                    "status": r[12],
                    "prioridade": r[13],
                })
            return rows
        except Exception:
            return []
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao listar chamados: {e}")

@router.post("", response_model=ChamadoOut)
def criar_chamado(payload: ChamadoCreate, db: Session = Depends(get_db)):
    try:
        from ..models import Chamado
        try:
            Chamado.__table__.create(bind=engine, checkfirst=True)
        except Exception:
            pass
        return service_criar(db, payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao criar chamado: {e}")
