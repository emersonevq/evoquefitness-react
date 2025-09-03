from __future__ import annotations
import os
import random
import string
from datetime import date, datetime
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from .db import get_db
from .models import Chamado
from .schemas import ChamadoCreate, ChamadoOut
from .utils import now_brazil_naive

load_dotenv()

app = FastAPI(title="Evoque API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # dev: Vite usa proxy; manter aberto em dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/ping")
def ping():
    return {"message": "pong"}


def gerar_codigo(n: int = 6) -> str:
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=n))


def gerar_protocolo(codigo: str) -> str:
    today = date.today()
    return f"{today.year}-{today.month:02d}-{today.day:02d}-{codigo}"


@app.post("/api/chamados", response_model=ChamadoOut)
def criar_chamado(payload: ChamadoCreate, db: Session = Depends(get_db)):
    # gerar identificadores únicos (tentar algumas vezes)
    for _ in range(5):
        codigo = gerar_codigo(6)
        protocolo = gerar_protocolo(codigo)
        existe = db.query(Chamado).filter((Chamado.codigo == codigo) | (Chamado.protocolo == protocolo)).first()
        if not existe:
            break
    else:
        raise HTTPException(status_code=500, detail="Falha ao gerar identificadores do chamado")

    data_visita = None
    if payload.visita:
        try:
            data_visita = date.fromisoformat(payload.visita)
        except ValueError:
            raise HTTPException(status_code=400, detail="Data de visita inválida")

    novo = Chamado(
        codigo=codigo,
        protocolo=protocolo,
        solicitante=payload.solicitante,
        cargo=payload.cargo,
        email=str(payload.email),
        telefone=payload.telefone,
        unidade=payload.unidade,
        problema=payload.problema,
        internet_item=payload.internetItem,
        descricao=payload.descricao,
        data_visita=data_visita,
        data_abertura=now_brazil_naive(),
        status="Aberto",
        prioridade="Normal",
    )
    db.add(novo)
    db.commit()
    db.refresh(novo)
    return novo
