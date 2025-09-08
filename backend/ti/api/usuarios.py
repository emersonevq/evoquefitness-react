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
        import json
        # helper to compute setores list
        def compute_setores(u) -> list[str]:
            try:
                if getattr(u, "_setores", None):
                    raw = json.loads(getattr(u, "_setores"))
                    return [str(x).encode('utf-8', 'ignore').decode('utf-8') if x is not None else "" for x in raw]
                if getattr(u, "setor", None):
                    return [str(getattr(u, "setor"))]
            except Exception:
                pass
            return []

        # cria tabela se não existir
        try:
            User.__table__.create(bind=engine, checkfirst=True)
        except Exception:
            pass

        # pega todos os usuários
        try:
            users = db.query(User).order_by(User.id.desc()).all()
            rows = []
            for u in users:
                if u.bloqueado is None:
                    u.bloqueado = False
                setores_list = compute_setores(u)
                rows.append({
                    "id": u.id,
                    "nome": u.nome,
                    "sobrenome": u.sobrenome,
                    "usuario": u.usuario,
                    "email": u.email,
                    "nivel_acesso": u.nivel_acesso,
                    "setor": setores_list[0] if setores_list else None,
                    "setores": setores_list,
                    "bloqueado": bool(u.bloqueado),
                    "session_revoked_at": u.session_revoked_at.isoformat() if getattr(u, 'session_revoked_at', None) else None,
                })
            return rows
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
                s = r[6]
                setores_list = [str(s)] if s else []
                rows.append({
                    "id": r[0],
                    "nome": r[1],
                    "sobrenome": r[2],
                    "usuario": r[3],
                    "email": r[4],
                    "nivel_acesso": r[5],
                    "setor": s,
                    "setores": setores_list,
                    "bloqueado": False,
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
        import json
        from ..models import User
        users = list_blocked_users(db)
        rows = []
        for u in users:
            try:
                if u.bloqueado is None:
                    u.bloqueado = True
            except Exception:
                pass
            try:
                if getattr(u, "_setores", None):
                    raw = json.loads(getattr(u, "_setores"))
                    setores_list = [str(x) for x in raw if x is not None]
                elif getattr(u, "setor", None):
                    setores_list = [str(getattr(u, "setor"))]
                else:
                    setores_list = []
            except Exception:
                setores_list = [str(getattr(u, "setor"))] if getattr(u, "setor", None) else []
            rows.append({
                "id": u.id,
                "nome": u.nome,
                "sobrenome": u.sobrenome,
                "usuario": u.usuario,
                "email": u.email,
                "nivel_acesso": u.nivel_acesso,
                "setor": setores_list[0] if setores_list else None,
                "setores": setores_list,
                "bloqueado": bool(u.bloqueado),
                "session_revoked_at": u.session_revoked_at.isoformat() if getattr(u, 'session_revoked_at', None) else None,
            })
        return rows
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


@router.get("/{user_id}", response_model=UserOut)
def get_usuario(user_id: int, db: Session = Depends(get_db)):
    try:
        from ..models import User
        import json
        User.__table__.create(bind=engine, checkfirst=True)
        # Try ORM query; if DB schema doesn't include newer columns this may fail -> fallback
        try:
            user = db.query(User).filter(User.id == user_id).first()
        except Exception:
            # fallback to raw SQL selecting known columns (compatible with older schema)
            from sqlalchemy import text
            try:
                row = db.execute(text("SELECT id, nome, sobrenome, usuario, email, nivel_acesso, setor, bloqueado FROM \"user\" WHERE id = :id"), {"id": user_id}).fetchone()
                if not row:
                    raise HTTPException(status_code=404, detail="Usuário não encontrado")
                s = row[6]
                setores_list = [str(s)] if s else []
                return {
                    "id": row[0],
                    "nome": row[1],
                    "sobrenome": row[2],
                    "usuario": row[3],
                    "email": row[4],
                    "nivel_acesso": row[5],
                    "setor": setores_list[0] if setores_list else None,
                    "setores": setores_list,
                    "bloqueado": bool(row[7]) if len(row) > 7 else False,
                    "session_revoked_at": None,
                }
            except HTTPException:
                raise
            except Exception as ex:
                # try legacy table name 'usuarios'
                try:
                    row = db.execute(text("SELECT id, nome, sobrenome, usuario, email, nivel_acesso, setor FROM usuarios WHERE id = :id"), {"id": user_id}).fetchone()
                    if not row:
                        raise HTTPException(status_code=404, detail="Usuário não encontrado")
                    s = row[6]
                    setores_list = [str(s)] if s else []
                    return {
                        "id": row[0],
                        "nome": row[1],
                        "sobrenome": row[2],
                        "usuario": row[3],
                        "email": row[4],
                        "nivel_acesso": row[5],
                        "setor": setores_list[0] if setores_list else None,
                        "setores": setores_list,
                        "bloqueado": False,
                        "session_revoked_at": None,
                    }
                except Exception:
                    raise ex

        if not user:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")
        try:
            if user._setores:
                raw = json.loads(user._setores)
                setores_list = [str(x) for x in raw if x is not None]
            elif user.setor:
                setores_list = [str(user.setor)]
            else:
                setores_list = []
        except Exception:
            setores_list = [str(user.setor)] if user.setor else []
        return {
            "id": user.id,
            "nome": user.nome,
            "sobrenome": user.sobrenome,
            "usuario": user.usuario,
            "email": user.email,
            "nivel_acesso": user.nivel_acesso,
            "setor": setores_list[0] if setores_list else None,
            "setores": setores_list,
            "bloqueado": bool(user.bloqueado),
            "session_revoked_at": user.session_revoked_at.isoformat() if getattr(user, 'session_revoked_at', None) else None,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao obter usuário: {e}")


@router.post("/{user_id}/generate-password")
def gerar_nova_senha(user_id: int, length: int = 6, db: Session = Depends(get_db)):
    try:
        pwd = regenerate_password(db, user_id, length)
        return {"senha": pwd}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao gerar senha: {e}")


@router.post("/{user_id}/logout")
def force_logout(user_id: int, db: Session = Depends(get_db)):
    """Force logout by setting session_revoked_at to now."""
    try:
        from ..models import User
        User.__table__.create(bind=engine, checkfirst=True)
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")
        from core.utils import now_brazil_naive
        user.session_revoked_at = now_brazil_naive()
        db.commit()
        db.refresh(user)
        # return user minimal
        try:
            setores_list = []
            import json
            if user._setores:
                setores_list = [str(x) for x in json.loads(user._setores) if x is not None]
            elif user.setor:
                setores_list = [str(user.setor)]
        except Exception:
            setores_list = [str(user.setor)] if user.setor else []
        return {
            "id": user.id,
            "nome": user.nome,
            "sobrenome": user.sobrenome,
            "usuario": user.usuario,
            "email": user.email,
            "nivel_acesso": user.nivel_acesso,
            "setor": setores_list[0] if setores_list else None,
            "setores": setores_list,
            "bloqueado": bool(user.bloqueado),
            "session_revoked_at": user.session_revoked_at.isoformat() if getattr(user, 'session_revoked_at', None) else None,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao deslogar usuário: {e}")


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
