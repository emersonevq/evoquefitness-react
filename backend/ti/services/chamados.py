from __future__ import annotations
import random
import string
from datetime import date
from sqlalchemy.orm import Session
from core.utils import now_brazil_naive
from ti.models import Chamado
from core.db import engine
from ti.schemas.chamado import ChamadoCreate
import re


def _next_codigo(db: Session) -> str:
    """Gera código sequencial no formato EVQ-XXXX (4 dígitos), iniciando em EVQ-0081.
    Considera também tabela legada 'chamados'.
    """
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
    # Inicia em 81 se base estiver vazia ou abaixo disso
    base_min = 81
    nxt = max(max_n + 1, base_min)
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


def ensure_codigo_protocolo(db: Session, ch: Chamado) -> Chamado:
    """Garante formatos EVQ-XXXX e YYYYMMDD-N; corrige e persiste se necessário."""
    pattern_cod = re.compile(r"^EVQ-\d{4}$")
    pattern_prot = re.compile(r"^\d{8}-\d+$")
    changed = False
    if not isinstance(ch.codigo, str) or not pattern_cod.match(ch.codigo):
        ch.codigo = _next_codigo(db)
        changed = True
    if not isinstance(ch.protocolo, str) or not pattern_prot.match(ch.protocolo):
        ch.protocolo = _next_protocolo(db)
        changed = True
    if changed:
        db.add(ch)
        db.commit()
        db.refresh(ch)
    return ch
