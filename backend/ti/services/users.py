from __future__ import annotations
import json
import secrets
import string
from sqlalchemy.orm import Session
from werkzeug.security import generate_password_hash
from ti.models import User
from core.db import engine
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
    try:
        User.__table__.create(bind=engine, checkfirst=True)
    except Exception:
        pass
    availability = UserAvailability()
    if email is not None:
        availability.email_exists = db.query(User).filter(User.email == email).first() is not None
    if username is not None:
        availability.usuario_exists = db.query(User).filter(User.usuario == username).first() is not None
    return availability


def generate_password(length: int = 6) -> str:
    return _generate_password(length)


def criar_usuario(db: Session, payload: UserCreate) -> UserCreatedOut:
    try:
        User.__table__.create(bind=engine, checkfirst=True)
    except Exception:
        pass
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


def _set_setores(user: User, setores):
    if setores and isinstance(setores, list) and len(setores) > 0:
        user._setores = json.dumps([str(s) for s in setores])
        user.setor = str(setores[0])
    else:
        user._setores = None
        user.setor = None


def update_user(db: Session, user_id: int, data: dict) -> User:
    try:
        User.__table__.create(bind=engine, checkfirst=True)
    except Exception:
        pass
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError("Usuário não encontrado")

    if "email" in data and data["email"] and data["email"] != user.email:
        if db.query(User).filter(User.email == str(data["email"])) .first():
            raise ValueError("E-mail já cadastrado")
        user.email = str(data["email"])  # type: ignore
    if "usuario" in data and data["usuario"] and data["usuario"] != user.usuario:
        if db.query(User).filter(User.usuario == data["usuario"]).first():
            raise ValueError("Nome de usuário já cadastrado")
        user.usuario = data["usuario"]  # type: ignore

    if "nome" in data and data["nome"] is not None:
        user.nome = data["nome"]  # type: ignore
    if "sobrenome" in data and data["sobrenome"] is not None:
        user.sobrenome = data["sobrenome"]  # type: ignore
    if "nivel_acesso" in data and data["nivel_acesso"] is not None:
        user.nivel_acesso = data["nivel_acesso"]  # type: ignore
    if "alterar_senha_primeiro_acesso" in data and data["alterar_senha_primeiro_acesso"] is not None:
        user.alterar_senha_primeiro_acesso = bool(data["alterar_senha_primeiro_acesso"])  # type: ignore
    if "bloqueado" in data and data["bloqueado"] is not None:
        user.bloqueado = bool(data["bloqueado"])  # type: ignore
    if "setores" in data:
        _set_setores(user, data["setores"])  # type: ignore

    db.commit()
    db.refresh(user)
    return user


def regenerate_password(db: Session, user_id: int, length: int = 6) -> str:
    if length < 6:
        length = 6
    if length > 64:
        length = 64
    try:
        User.__table__.create(bind=engine, checkfirst=True)
    except Exception:
        pass
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError("Usuário não encontrado")
    new_pwd = _generate_password(length)
    user.senha_hash = generate_password_hash(new_pwd)
    user.alterar_senha_primeiro_acesso = True
    db.commit()
    return new_pwd


def set_block_status(db: Session, user_id: int, blocked: bool) -> User:
    try:
        User.__table__.create(bind=engine, checkfirst=True)
    except Exception:
        pass
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError("Usuário não encontrado")
    user.bloqueado = bool(blocked)
    if not blocked:
        user.tentativas_login = 0
        user.bloqueado_ate = None
    db.commit()
    db.refresh(user)
    return user


def delete_user(db: Session, user_id: int) -> None:
    try:
        User.__table__.create(bind=engine, checkfirst=True)
    except Exception:
        pass
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return
    db.delete(user)
    db.commit()


def list_blocked_users(db: Session) -> list[User]:
    try:
        User.__table__.create(bind=engine, checkfirst=True)
    except Exception:
        pass
    return db.query(User).filter(User.bloqueado == True).order_by(User.id.desc()).all()
