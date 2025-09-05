from __future__ import annotations
from datetime import datetime
from sqlalchemy import Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from core.db import Base

class AnexoArquivo(Base):
    __tablename__ = "anexos_arquivos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    chamado_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("chamado.id"), nullable=True)
    historico_ticket_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("historicos_tickets.id"), nullable=True)
    nome_original: Mapped[str] = mapped_column(String(255), nullable=False)
    caminho_arquivo: Mapped[str] = mapped_column(String(500), nullable=False)
    mime_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    tamanho_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    data_upload: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    usuario_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("user.id"), nullable=True)

    # relationships
    chamado = relationship("Chamado", backref="anexos")
