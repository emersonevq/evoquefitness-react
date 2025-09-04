from __future__ import annotations
import random
import string
from datetime import date
from sqlalchemy.orm import Session
from core.utils import now_brazil_naive
from ti.models import Chamado
from core.db import engine
from ti.schemas.chamado import ChamadoCreate


def _next_codigo(db: Session) -> str:
    """Gera código sequencial no formato EVQ-0001, considerando também tabela legada 'chamados'."""
    from ti.models import Chamado
    max_n = 0
    try:
        rows = db.query(Chamado.codigo).filter(Chamado.codigo.like("EVQ-%")).all()
        for (cod,) in rows:
            try:
                if isinstance(cod, str) and cod.upper().startswith("EVQ-"):
                    suf = cod.split("-", 1)[1]
                    num = int("".join(ch for ch in suf if ch.isdigit()))
                    if num > max_n:
                        max_n = num
            except Exception:
                continue
    except Exception:
        pass
    # Legacy table
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            res = conn.execute(text("SELECT codigo FROM chamados WHERE codigo LIKE 'EVQ-%'"))
            for row in res.fetchall():
                cod = row[0]
                try:
                    if isinstance(cod, str) and cod.upper().startswith("EVQ-"):
                        suf = cod.split("-", 1)[1]
                        num = int("".join(ch for ch in suf if ch.isdigit()))
                        if num > max_n:
                            max_n = num
                except Exception:
                    continue
    except Exception:
        pass
    nxt = max_n + 1
    return f"EVQ-{nxt:04d}"


def _next_protocolo(db: Session) -> str:
    """Protocolo no formato YYYYMMDD-N, onde N é sequencial por dia; considera tabela legada 'chamados'."""
    from ti.models import Chamado
    d = now_brazil_naive().date()
    ymd = f"{d.year}{d.month:02d}{d.day:02d}"
    max_n = 0
    try:
        rows = db.query(Chamado.protocolo).filter(Chamado.protocolo.like(f"{ymd}-%")).all()
        for (p,) in rows:
            try:
                suf = str(p).split("-", 1)[1]
                num = int("".join(ch for ch in suf if ch.isdigit()))
                if num > max_n:
                    max_n = num
            except Exception:
                continue
    except Exception:
        pass
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            res = conn.execute(text("SELECT protocolo FROM chamados WHERE protocolo LIKE :pfx"), {"pfx": f"{ymd}-%"})
            for row in res.fetchall():
                p = row[0]
                try:
                    suf = str(p).split("-", 1)[1]
                    num = int("".join(ch for ch in suf if ch.isdigit()))
                    if num > max_n:
                        max_n = num
                except Exception:
                    continue
    except Exception:
        pass
    nxt = max_n + 1
    return f"{ymd}-{nxt}"


def criar_chamado(db: Session, payload: ChamadoCreate) -> Chamado:
    try:
        Chamado.__table__.create(bind=engine, checkfirst=True)
    except Exception:
        pass
    for _ in range(10):
        codigo = _next_codigo(db)
        protocolo = _next_protocolo(db)
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
