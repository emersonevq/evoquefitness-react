from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from core.db import get_db, engine
from ti.schemas.problema import ProblemaCreate, ProblemaOut

router = APIRouter(prefix="/problemas", tags=["TI - Problemas"])

@router.get("", response_model=list[ProblemaOut])
def listar_problemas(db: Session = Depends(get_db)):
    from ..models import Problema, Chamado
    try:
        try:
            Problema.__table__.create(bind=engine, checkfirst=True)
        except Exception:
            pass
        try:
            rows = db.query(Problema).order_by(Problema.nome.asc()).all()
        except Exception:
            rows = []
        result = [
            {
                "id": r.id,
                "nome": r.nome,
                "prioridade": r.prioridade,
                "requer_internet": bool(r.requer_internet),
            }
            for r in rows
        ]
        # Fallback: tabela legada problema_reportado
        for sql in (
            "SELECT nome, prioridade_padrao, requer_item_internet FROM problema_reportado WHERE ativo = 1",
            "SELECT nome, prioridade_padrao, requer_item_internet FROM problemas_reportados WHERE ativo = 1",
        ):
            try:
                res = db.execute(text(sql))
                for nome, prioridade, requer in res.fetchall():
                    if not any(x["nome"].lower() == str(nome).lower() for x in result):
                        result.append(
                            {
                                "id": 0,
                                "nome": str(nome),
                                "prioridade": str(prioridade or "Normal"),
                                "requer_internet": bool(requer),
                            }
                        )
                break
            except Exception:
                continue
        existing_names = {r[0] for r in db.query(Chamado.problema).distinct().all() if r[0]}
        names_in_table = {r["nome"].lower() for r in result}
        for nome in sorted(n for n in (x.lower() for x in existing_names) if n not in names_in_table):
            result.append(
                {
                    "id": 0,
                    "nome": nome,
                    "prioridade": "Normal",
                    "requer_internet": nome.lower() == "internet",
                }
            )
        return result
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
