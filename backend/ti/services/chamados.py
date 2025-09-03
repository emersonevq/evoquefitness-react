from __future__ import annotations
import random
import string
from datetime import date
from sqlalchemy.orm import Session
from core.utils import now_brazil_naive
from ti.models import Chamado
from ti.schemas.chamado import ChamadoCreate


def _gerar_codigo(n: int = 6) -> str:
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=n))


def _gerar_protocolo(codigo: str) -> str:
    d = now_brazil_naive().date()
    return f"{d.year}-{d.month:02d}-{d.day:02d}-{codigo}"


def criar_chamado(db: Session, payload: ChamadoCreate) -> Chamado:
    for _ in range(5):
        codigo = _gerar_codigo(6)
        protocolo = _gerar_protocolo(codigo)
        existe = db.query(Chamado).filter((Chamado.codigo == codigo) | (Chamado.protocolo == protocolo)).first()
        if not existe:
            break
    else:
        raise RuntimeError("Falha ao gerar identificadores do chamado")

    data_visita = None
    if payload.visita:
        data_visita = date.fromisoformat(payload.visita)

    novo = Chamado(
        codigo=codigo,
        protocolo=protocolo,
        solicitante=payload.solicitante,
        cargo=payload.cargo,
        email=str(payload.email),
        telefone=payload.telefone,
        unidade=payload.unidade,
        problema=payload.problema,
        internet_item=payload.internetItem,
        descricao=payload.descricao,
        data_visita=data_visita,
        data_abertura=now_brazil_naive(),
        status="Aberto",
        prioridade="Normal",
    )
    db.add(novo)
    db.commit()
    db.refresh(novo)
    return novo
