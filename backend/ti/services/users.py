from __future__ import annotations
import json
import secrets
import string
from sqlalchemy.orm import Session
from werkzeug.security import generate_password_hash
from ti.models import User
from ti.schemas.user import UserCreate, UserCreatedOut, UserAvailability


def _generate_password(length: int = 6) -> str:
    # Ensure at least one lowercase, one uppercase, and one digit
    if length < 3:
        length = 3
    parts = [
        secrets.choice(string.ascii_lowercase),
        secrets.choice(string.ascii_uppercase),
        secrets.choice(string.digits),
    ]
    remaining = length - 3
    pool = string.ascii_letters + string.digits
    parts += [secrets.choice(pool) for _ in range(remaining)]
    # Shuffle deterministically with secrets by reordering via random indices
    for i in range(len(parts) - 1, 0, -1):
        j = ord(secrets.token_bytes(1)) % (i + 1)
        parts[i], parts[j] = parts[j], parts[i]
    return "".join(parts)


def check_user_availability(db: Session, email: str | None = None, username: str | None = None) -> UserAvailability:
    availability = UserAvailability()
    if email is not None:
        availability.email_exists = db.query(User).filter(User.email == email).first() is not None
    if username is not None:
        availability.usuario_exists = db.query(User).filter(User.usuario == username).first() is not None
    return availability


def criar_usuario(db: Session, payload: UserCreate) -> UserCreatedOut:
    # Uniqueness checks
    if payload.email and db.query(User).filter(User.email == str(payload.email)).first():
        raise ValueError("E-mail já cadastrado")
    if payload.usuario and db.query(User).filter(User.usuario == payload.usuario).first():
        raise ValueError("Nome de usuário já cadastrado")

    # Password generation in backend if not provided
    generated_password = payload.senha or _generate_password(6)

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
        senha_hash=generate_password_hash(generated_password),
        alterar_senha_primeiro_acesso=payload.alterar_senha_primeiro_acesso,
        nivel_acesso=payload.nivel_acesso,
        setor=setor,
        _setores=setores_json,
        bloqueado=payload.bloqueado,
    )
    db.add(novo)
    db.commit()
    db.refresh(novo)

    return UserCreatedOut(
        id=novo.id,
        nome=novo.nome,
        sobrenome=novo.sobrenome,
        usuario=novo.usuario,
        email=novo.email,
        nivel_acesso=novo.nivel_acesso,
        setor=novo.setor,
        senha=generated_password,
    )
