from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.db import get_db, engine
from ti.schemas.user import UserCreate, UserCreatedOut, UserAvailability, UserOut
from ti.services.users import (
    criar_usuario as service_criar,
    check_user_availability,
    generate_password,
    update_user,
    regenerate_password,
    set_block_status,
    delete_user,
    list_blocked_users,
)

router = APIRouter(prefix="/usuarios", tags=["TI - Usuarios"])

@router.get("", response_model=list[UserOut])
def listar_usuarios(db: Session = Depends(get_db)):
    try:
        from ..models import User
        # cria tabela se não existir
        try:
            User.__table__.create(bind=engine, checkfirst=True)
        except Exception:
            pass

        # pega todos os usuários
        try:
            users = db.query(User).order_by(User.id.desc()).all()
            # garante que 'bloqueado' nunca seja None
            for u in users:
                if u.bloqueado is None:
                    u.bloqueado = False
            return users
        except Exception:
            pass

        # fallback tabela legada "usuarios"
        from sqlalchemy import text
        try:
            res = db.execute(text(
                "SELECT id, nome, sobrenome, usuario, email, nivel_acesso, setor FROM usuarios ORDER BY id DESC"
            ))
            rows = []
            for r in res.fetchall():
                rows.append({
                    "id": r[0],
                    "nome": r[1],
                    "sobrenome": r[2],
                    "usuario": r[3],
                    "email": r[4],
                    "nivel_acesso": r[5],
                    "setor": r[6],
                    "bloqueado": False,  # já tá ok
                })
            return rows
        except Exception:
            return []

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao listar usuários: {e}")

@router.post("", response_model=UserCreatedOut)
def criar_usuario(payload: UserCreate, db: Session = Depends(get_db)):
    try:
        from ..models import User
        try:
            User.__table__.create(bind=engine, checkfirst=True)
        except Exception:
            pass
        return service_criar(db, payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao criar usuário: {e}")

@router.get("/check-availability", response_model=UserAvailability)
def check_availability(email: str | None = None, username: str | None = None, db: Session = Depends(get_db)):
    if email is None and username is None:
        raise HTTPException(status_code=400, detail="Informe email ou username para verificar")
    return check_user_availability(db, email, username)

@router.get("/generate-password")
def generate_password_endpoint(length: int = 6):
    if length < 6:
        length = 6
    if length > 64:
        length = 64
    return {"senha": generate_password(length)}


@router.get("/blocked", response_model=list[UserOut])
def listar_bloqueados(db: Session = Depends(get_db)):
    try:
        return list_blocked_users(db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao listar bloqueados: {e}")


@router.put("/{user_id}", response_model=UserOut)
def atualizar_usuario(user_id: int, payload: dict, db: Session = Depends(get_db)):
    try:
        updated = update_user(db, user_id, payload)
        return updated
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar: {e}")


@router.post("/{user_id}/generate-password")
def gerar_nova_senha(user_id: int, length: int = 6, db: Session = Depends(get_db)):
    try:
        pwd = regenerate_password(db, user_id, length)
        return {"senha": pwd}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao gerar senha: {e}")


@router.post("/login")
def login(payload: dict, db: Session = Depends(get_db)):
    try:
        identifier = payload.get("identifier") or payload.get("email") or payload.get("usuario")
        senha = payload.get("senha") or payload.get("password")
        if not identifier or not senha:
            raise HTTPException(status_code=400, detail="Informe identifier e senha")
        from ti.services.users import authenticate_user
        user = authenticate_user(db, identifier, senha)
        return user
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao autenticar: {e}")


@router.post("/{user_id}/block", response_model=UserOut)
def bloquear_usuario(user_id: int, db: Session = Depends(get_db)):
    try:
        return set_block_status(db, user_id, True)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao bloquear: {e}")


@router.post("/{user_id}/unblock", response_model=UserOut)
def desbloquear_usuario(user_id: int, db: Session = Depends(get_db)):
    try:
        return set_block_status(db, user_id, False)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao desbloquear: {e}")


@router.post("/{user_id}/change-password")
def change_password(user_id: int, payload: dict, db: Session = Depends(get_db)):
    try:
        senha = payload.get('senha') or payload.get('password')
        if not senha:
            raise HTTPException(status_code=400, detail='Informe a nova senha')
        from ti.services.users import change_user_password
        change_user_password(db, user_id, senha, require_change=False)
        return {"ok": True}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao alterar senha: {e}")


@router.get("/{user_id}", response_model=UserOut)
def get_user_by_id(user_id: int, db: Session = Depends(get_db)):
    """Return user by id (used by frontend to refresh permissions)."""
    try:
        from ..models import User
        try:
            User.__table__.create(bind=engine, checkfirst=True)
        except Exception:
            pass
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")
        return user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao obter usuário: {e}")


@router.delete("/{user_id}")
def excluir_usuario(user_id: int, db: Session = Depends(get_db)):
    try:
        delete_user(db, user_id)
        return {"ok": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao excluir: {e}")


@router.post("/normalize-setores")
def normalize_setores(db: Session = Depends(get_db)):
    """Normalize setor/_setores for all users. Use with caution (admin only)."""
    try:
        from ti.services.users import normalize_user_setores
        updated = normalize_user_setores(db)
        return {"updated": updated}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao normalizar setores: {e}")


@router.post("/assign-admin-sectors")
def assign_admin_sectors(db: Session = Depends(get_db)):
    """Assign all sectors to users with nivel_acesso 'Administrador'."""
    try:
        from ti.services.users import ensure_admins_have_all_sectors
        updated = ensure_admins_have_all_sectors(db)
        return {"updated": updated}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao atribuir setores a administradores: {e}")
