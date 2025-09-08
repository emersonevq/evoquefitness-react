from __future__ import annotations
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional

class UserCreate(BaseModel):
    nome: str
    sobrenome: str
    usuario: str
    email: EmailStr
    senha: Optional[str] = Field(default=None, min_length=6)
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
    setores: Optional[List[str]] | None = None
    bloqueado: bool = False

    class Config:
        from_attributes = True

class UserCreatedOut(UserOut):
    senha: str  # senha em texto plano (retornada uma única vez)

class UserAvailability(BaseModel):
    email_exists: Optional[bool] = None
    usuario_exists: Optional[bool] = None
