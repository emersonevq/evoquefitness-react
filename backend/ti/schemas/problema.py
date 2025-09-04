from __future__ import annotations
from pydantic import BaseModel

class ProblemaCreate(BaseModel):
    nome: str
    prioridade: str
    requer_internet: bool = False

class ProblemaOut(BaseModel):
    id: int
    nome: str
    prioridade: str
    requer_internet: bool

    class Config:
        from_attributes = True
