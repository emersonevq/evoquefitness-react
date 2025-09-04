from __future__ import annotations
from datetime import date, datetime
from pydantic import BaseModel, EmailStr, Field

ALLOWED_STATUSES = {"Aberto", "Em andamento", "Em análise", "Concluído", "Cancelado"}

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

class ChamadoStatusUpdate(BaseModel):
    status: str = Field(..., description="Novo status do chamado")

class ChamadoDeleteRequest(BaseModel):
    email: EmailStr = Field(..., description="E-mail do usuário autenticado")
    senha: str = Field(..., min_length=6, description="Senha do usuário para confirmar exclusão")
