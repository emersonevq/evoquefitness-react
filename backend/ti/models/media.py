from datetime import datetime
from sqlalchemy import Integer, String, DateTime, ForeignKey, Boolean, LargeBinary, Text
from sqlalchemy.orm import Mapped, mapped_column
from core.db import Base

class Media(Base):
    __tablename__ = "media"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    media_type: Mapped[str] = mapped_column(String(20), nullable=False)  # image|video|message|other
    title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    filename: Mapped[str | None] = mapped_column(String(255), nullable=True)
    caminho_arquivo: Mapped[str | None] = mapped_column(String(1000), nullable=True)  # URL or API path
    mime_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    tamanho_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    conteudo: Mapped[bytes | None] = mapped_column(LargeBinary(length=16777215), nullable=True)  # optional blob
    meta: Mapped[str | None] = mapped_column(String(1000), nullable=True)  # optional JSON/metadata as string
    criado_em: Mapped[datetime | None] = mapped_column(DateTime, nullable=True, default=datetime.utcnow)
    usuario_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("user.id"), nullable=True)
    ativo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
