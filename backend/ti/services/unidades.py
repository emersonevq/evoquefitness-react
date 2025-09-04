from __future__ import annotations
from sqlalchemy.orm import Session
from ti.models import Unidade
from ti.schemas.unidade import UnidadeCreate


def criar_unidade(db: Session, payload: UnidadeCreate) -> Unidade:
    existe = db.query(Unidade).filter(Unidade.nome == payload.nome).first()
    if existe:
        raise ValueError("Unidade já cadastrada")
    novo = Unidade(nome=payload.nome, cidade=payload.cidade)
    db.add(novo)
    db.commit()
    db.refresh(novo)
    return novo
