from __future__ import annotations
from sqlalchemy.orm import Session
from sqlalchemy import text
from ti.models import Problema
from ti.schemas.problema import ProblemaCreate


VALID_PRIORIDADES = {"Crítica", "Alta", "Normal", "Baixa"}

def criar_problema(db: Session, payload: ProblemaCreate) -> Problema:
    if not payload.nome:
        raise ValueError("Nome do problema é obrigatório")
    if payload.prioridade not in VALID_PRIORIDADES:
        raise ValueError("Prioridade inválida")

    # Uniqueness check in both ORM table and legacy table
    existe = db.query(Problema).filter(Problema.nome == payload.nome).first()
    if not existe:
        try:
            row = db.execute(
                text("SELECT id FROM problema_reportado WHERE nome = :nome LIMIT 1"),
                {"nome": payload.nome},
            ).first()
            if row is not None:
                existe = True  # type: ignore
        except Exception:
            pass
    if existe:
        raise ValueError("Problema já cadastrado")

    # Prefer writing to legacy table problema_reportado when available
    try:
        res = db.execute(
            text(
                "INSERT INTO problema_reportado (nome, prioridade_padrao, requer_item_internet, ativo) "
                "VALUES (:nome, :prioridade, :requer, 1)"
            ),
            {
                "nome": payload.nome,
                "prioridade": payload.prioridade,
                "requer": 1 if payload.requer_internet else 0,
            },
        )
        db.commit()
        inserted_id = getattr(res, "lastrowid", None)
        if not inserted_id:
            try:
                row = db.execute(
                    text("SELECT id FROM problema_reportado WHERE nome = :nome ORDER BY id DESC LIMIT 1"),
                    {"nome": payload.nome},
                ).first()
                if row is not None:
                    inserted_id = int(row[0])
            except Exception:
                inserted_id = 0
        return Problema(  # return a Problema-like object for response model
            id=inserted_id or 0,  # type: ignore[arg-type]
            nome=payload.nome,
            prioridade=payload.prioridade,
            requer_internet=payload.requer_internet,
        )
    except Exception:
        # Fallback to ORM table
        novo = Problema(
            nome=payload.nome,
            prioridade=payload.prioridade,
            requer_internet=payload.requer_internet,
        )
        db.add(novo)
        db.commit()
        db.refresh(novo)
        return novo
