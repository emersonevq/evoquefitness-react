from __future__ import annotations
from datetime import date, datetime
from pydantic import BaseModel, EmailStr

class ChamadoCreate(BaseModel):
    solicitante: str
    cargo: str
    gerente: str | None = None
    email: EmailStr
    telefone: str
    unidade: str
    problema: str
    internetItem: str | None = None
    visita: str | None = None
    descricao: str | None = None

class ChamadoOut(BaseModel):
    id: int
    codigo: str
    protocolo: str
    solicitante: str
    cargo: str
    email: str
    telefone: str
    unidade: str
    problema: str
    internet_item: str | None
    data_visita: date | None
    data_abertura: datetime | None
    status: str
    prioridade: str

    class Config:
        from_attributes = True
