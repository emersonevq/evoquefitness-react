from __future__ import annotations
from pydantic import BaseModel, Field, ConfigDict, AliasChoices

class ProblemaCreate(BaseModel):
    # Accept both legacy and new field names; provide sensible defaults
    nome: str
    prioridade: str = Field(default="Normal", validation_alias=AliasChoices("prioridade", "prioridade_padrao"))
    requer_internet: bool = Field(default=False, validation_alias=AliasChoices("requer_internet", "requer_item_internet"))
    ativo: bool | None = None

    model_config = ConfigDict(populate_by_name=True, extra="ignore")

class ProblemaOut(BaseModel):
    id: int
    nome: str
    prioridade: str
    requer_internet: bool

    class Config:
        from_attributes = True
