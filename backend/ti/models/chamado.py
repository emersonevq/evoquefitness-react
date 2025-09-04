from __future__ import annotations
from datetime import date, datetime
from sqlalchemy import Integer, String, Date, DateTime, Text, ForeignKey, event, text
from sqlalchemy.orm import Mapped, mapped_column
from core.db import Base
from core.utils import now_brazil_naive
import re

class Chamado(Base):
    __tablename__ = "chamado"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    codigo: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    protocolo: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    solicitante: Mapped[str] = mapped_column(String(100), nullable=False)
    cargo: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(120), nullable=False)
    telefone: Mapped[str] = mapped_column(String(20), nullable=False)
    unidade: Mapped[str] = mapped_column(String(100), nullable=False)
    problema: Mapped[str] = mapped_column(String(100), nullable=False)
    internet_item: Mapped[str | None] = mapped_column(String(50), nullable=True)
    descricao: Mapped[str | None] = mapped_column(Text, nullable=True)
    data_visita: Mapped[date | None] = mapped_column(Date, nullable=True)
    data_abertura: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    data_primeira_resposta: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    data_conclusao: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="Aberto")
    prioridade: Mapped[str] = mapped_column(String(20), nullable=False, default="Normal")

    status_assumido_por_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("user.id"), nullable=True)
    status_assumido_em: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    concluido_por_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("user.id"), nullable=True)
    concluido_em: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    cancelado_por_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("user.id"), nullable=True)
    cancelado_em: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    usuario_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("user.id"), nullable=True)


@event.listens_for(Chamado, "before_insert")
def _ensure_identifiers(mapper, connection, target: Chamado):
    cod_ok = isinstance(target.codigo, str) and re.fullmatch(r"EVQ-\d{4}", target.codigo or "")
    prot_ok = isinstance(target.protocolo, str) and re.fullmatch(r"\d{8}-\d+", target.protocolo or "")

    # Compute next codigo if needed
    if not cod_ok:
        max_n = 80
        try:
            res = connection.execute(text("SELECT codigo FROM chamado WHERE codigo LIKE 'EVQ-%'"))
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
        try:
            res = connection.execute(text("SELECT codigo FROM chamados WHERE codigo LIKE 'EVQ-%'"))
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
        target.codigo = f"EVQ-{nxt:04d}"

    # Compute next protocolo if needed
    if not prot_ok:
        d = now_brazil_naive().date()
        ymd = f"{d.year}{d.month:02d}{d.day:02d}"
        max_n = 0
        try:
            res = connection.execute(text("SELECT protocolo FROM chamado WHERE protocolo LIKE :pfx"), {"pfx": f"{ymd}-%"})
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
        try:
            res = connection.execute(text("SELECT protocolo FROM chamados WHERE protocolo LIKE :pfx"), {"pfx": f"{ymd}-%"})
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
        target.protocolo = f"{ymd}-{nxt}"
