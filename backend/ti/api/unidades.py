from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
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
        # Tenta esquemas legados/plurais com e sem coluna cidade
        for sql in (
            "SELECT id, nome, cidade FROM unidade",
            "SELECT id, nome FROM unidade",
            "SELECT id, nome, cidade FROM unidades",
            "SELECT id, nome FROM unidades",
        ):
            try:
                res = db.execute(text(sql))
                fetched = res.fetchall()
                if fetched:
                    out = []
                    for r in fetched:
                        if len(r) >= 3:
                            out.append({"id": r[0], "nome": r[1], "cidade": r[2] or ""})
                        else:
                            out.append({"id": r[0], "nome": r[1], "cidade": ""})
                    return out
            except Exception:
                pass
        # ORM padrão (caso exista classe/tabela com cidade)
        try:
            rows_orm = db.query(Unidade).order_by(Unidade.id.desc()).all()
            if rows_orm:
                return rows_orm
        except Exception:
            pass
        # Fallback: derivar de chamados existentes
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
