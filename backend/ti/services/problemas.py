from __future__ import annotations
from sqlalchemy.orm import Session
from ti.models import Problema
from ti.schemas.problema import ProblemaCreate


VALID_PRIORIDADES = {"Crítica", "Alta", "Normal", "Baixa"}

def criar_problema(db: Session, payload: ProblemaCreate) -> Problema:
    if not payload.nome:
        raise ValueError("Nome do problema é obrigatório")
    if payload.prioridade not in VALID_PRIORIDADES:
        raise ValueError("Prioridade inválida")
    existe = db.query(Problema).filter(Problema.nome == payload.nome).first()
    if existe:
        raise ValueError("Problema já cadastrado")
    novo = Problema(
        nome=payload.nome,
        prioridade=payload.prioridade,
        requer_internet=payload.requer_internet,
    )
    db.add(novo)
    db.commit()
    db.refresh(novo)
    return novo
