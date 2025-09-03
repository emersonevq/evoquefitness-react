from __future__ import annotations
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional

class UserCreate(BaseModel):
    nome: str
    sobrenome: str
    usuario: str
    email: EmailStr
    senha: str = Field(min_length=6)
    nivel_acesso: str
    setores: Optional[List[str]] = None
    alterar_senha_primeiro_acesso: bool = True
    bloqueado: bool = False

class UserOut(BaseModel):
    id: int
    nome: str
    sobrenome: str
    usuario: str
    email: EmailStr
    nivel_acesso: str
    setor: str | None

    class Config:
        from_attributes = True
