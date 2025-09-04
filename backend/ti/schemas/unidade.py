from __future__ import annotations
from pydantic import BaseModel

class UnidadeCreate(BaseModel):
    nome: str
    cidade: str

class UnidadeOut(BaseModel):
    id: int
    nome: str
    cidade: str

    class Config:
        from_attributes = True
