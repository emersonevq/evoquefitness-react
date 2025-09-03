from __future__ import annotations
import json
from sqlalchemy.orm import Session
from werkzeug.security import generate_password_hash
from ..models import User
from ..schemas.user import UserCreate


def criar_usuario(db: Session, payload: UserCreate) -> User:
    if db.query(User).filter((User.usuario == payload.usuario) | (User.email == str(payload.email))).first():
        raise ValueError("Usuário ou e-mail já cadastrado")

    setores_json = None
    setor = None
    if payload.setores and len(payload.setores) > 0:
        setores_json = json.dumps(payload.setores)
        setor = payload.setores[0]

    novo = User(
        nome=payload.nome,
        sobrenome=payload.sobrenome,
        usuario=payload.usuario,
        email=str(payload.email),
        senha_hash=generate_password_hash(payload.senha),
        alterar_senha_primeiro_acesso=payload.alterar_senha_primeiro_acesso,
        nivel_acesso=payload.nivel_acesso,
        setor=setor,
        _setores=setores_json,
        bloqueado=payload.bloqueado,
    )
    db.add(novo)
    db.commit()
    db.refresh(novo)
    return novo
