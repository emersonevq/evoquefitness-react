from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.db import get_db, engine
from ti.schemas.chamado import (
    ChamadoCreate,
    ChamadoOut,
    ChamadoStatusUpdate,
    ChamadoDeleteRequest,
    ALLOWED_STATUSES,
)
from ti.services.chamados import criar_chamado as service_criar
from core.realtime import sio
from werkzeug.security import check_password_hash
from ..models.notification import Notification
import json

router = APIRouter(prefix="/chamados", tags=["TI - Chamados"])

def _normalize_status(s: str) -> str:
    if not s:
        return "Aberto"
    s_up = s.strip().upper()
    mapping = {
        "ABERTO": "Aberto",
        "AGUARDANDO": "Em andamento",
        "EM_ANDAMENTO": "Em andamento",
        "EM ANDAMENTO": "Em andamento",
        "EM_ANALISE": "Em análise",
        "EM ANÁLISE": "Em análise",
        "EM ANALISE": "Em análise",
        "CONCLUIDO": "Concluído",
        "CONCLUÍDO": "Concluído",
        "CANCELADO": "Cancelado",
    }
    if s_up in mapping:
        return mapping[s_up]
    s_title = s.strip().title()
    return s_title if s_title in ALLOWED_STATUSES else "Aberto"

@router.get("", response_model=list[ChamadoOut])
def listar_chamados(db: Session = Depends(get_db)):
    from ..models import Chamado
    try:
        try:
            Chamado.__table__.create(bind=engine, checkfirst=True)
        except Exception:
            pass
        try:
            return db.query(Chamado).order_by(Chamado.id.desc()).all()
        except Exception:
            return []
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao listar chamados: {e}")

@router.post("", response_model=ChamadoOut)
def criar_chamado(payload: ChamadoCreate, db: Session = Depends(get_db)):
    try:
        from ..models import Chamado
        try:
            Chamado.__table__.create(bind=engine, checkfirst=True)
        except Exception:
            pass
        ch = service_criar(db, payload)
        try:
            # Garantir tabela de notificações
            Notification.__table__.create(bind=engine, checkfirst=True)
            # Persistir notificação de criação
            dados = json.dumps({
                "id": ch.id,
                "codigo": ch.codigo,
                "protocolo": ch.protocolo,
                "status": ch.status,
            }, ensure_ascii=False)
            n = Notification(
                tipo="chamado",
                titulo=f"Novo chamado {ch.codigo}",
                mensagem=f"{ch.solicitante} abriu um chamado de {ch.problema} na unidade {ch.unidade}",
                recurso="chamado",
                recurso_id=ch.id,
                acao="criado",
                dados=dados,
            )
            db.add(n)
            db.commit()
            db.refresh(n)
            # Notificar via socket
            import anyio  # ensure async context exists when possible
            anyio.from_thread.run(sio.emit, "chamado:created", {"id": ch.id})
            anyio.from_thread.run(sio.emit, "notification:new", {
                "id": n.id,
                "tipo": n.tipo,
                "titulo": n.titulo,
                "mensagem": n.mensagem,
                "recurso": n.recurso,
                "recurso_id": n.recurso_id,
                "acao": n.acao,
                "dados": n.dados,
                "lido": n.lido,
                "criado_em": n.criado_em.isoformat() if n.criado_em else None,
            })
        except Exception:
            pass
        return ch
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao criar chamado: {e}")

@router.patch("/{chamado_id}/status", response_model=ChamadoOut)
def atualizar_status(chamado_id: int, payload: ChamadoStatusUpdate, db: Session = Depends(get_db)):
    from ..models import Chamado
    try:
        novo = _normalize_status(payload.status)
        if novo not in ALLOWED_STATUSES:
            raise HTTPException(status_code=400, detail="Status inválido")
        ch = db.query(Chamado).filter(Chamado.id == chamado_id).first()
        if not ch:
            raise HTTPException(status_code=404, detail="Chamado não encontrado")
        prev = ch.status or "Aberto"
        ch.status = novo
        # timestamps
        from core.utils import now_brazil_naive
        if prev == "Aberto" and novo != "Aberto" and ch.data_primeira_resposta is None:
            ch.data_primeira_resposta = now_brazil_naive()
        if novo == "Concluído":
            ch.data_conclusao = now_brazil_naive()
        db.add(ch)
        db.commit()
        db.refresh(ch)
        try:
            # Persistir notificação de mudança de status
            Notification.__table__.create(bind=engine, checkfirst=True)
            dados = json.dumps({
                "id": ch.id,
                "codigo": ch.codigo,
                "protocolo": ch.protocolo,
                "status": ch.status,
                "status_anterior": prev,
            }, ensure_ascii=False)
            n = Notification(
                tipo="chamado",
                titulo=f"Status atualizado: {ch.codigo}",
                mensagem=f"{prev} → {ch.status}",
                recurso="chamado",
                recurso_id=ch.id,
                acao="status",
                dados=dados,
            )
            db.add(n)
            db.commit()
            db.refresh(n)
            import anyio
            anyio.from_thread.run(sio.emit, "chamado:status", {"id": ch.id, "status": ch.status})
            anyio.from_thread.run(sio.emit, "notification:new", {
                "id": n.id,
                "tipo": n.tipo,
                "titulo": n.titulo,
                "mensagem": n.mensagem,
                "recurso": n.recurso,
                "recurso_id": n.recurso_id,
                "acao": n.acao,
                "dados": n.dados,
                "lido": n.lido,
                "criado_em": n.criado_em.isoformat() if n.criado_em else None,
            })
        except Exception:
            pass
        return ch
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar status: {e}")

@router.delete("/{chamado_id}")
def deletar_chamado(chamado_id: int, payload: ChamadoDeleteRequest, db: Session = Depends(get_db)):
    from ..models import Chamado, User
    try:
        user = db.query(User).filter(User.email == payload.email).first()
        if not user:
            raise HTTPException(status_code=401, detail="Usuário não encontrado")
        if not check_password_hash(user.senha_hash, payload.senha):
            raise HTTPException(status_code=401, detail="Senha inválida")
        ch = db.query(Chamado).filter(Chamado.id == chamado_id).first()
        if not ch:
            raise HTTPException(status_code=404, detail="Chamado não encontrado")
        db.delete(ch)
        db.commit()
        try:
            # Persistir notificação de exclusão
            Notification.__table__.create(bind=engine, checkfirst=True)
            dados = json.dumps({
                "id": chamado_id,
                "codigo": ch.codigo,
                "protocolo": ch.protocolo,
            }, ensure_ascii=False)
            n = Notification(
                tipo="chamado",
                titulo=f"Chamado excluído: {ch.codigo}",
                mensagem=f"Chamado {ch.protocolo} removido",
                recurso="chamado",
                recurso_id=chamado_id,
                acao="excluido",
                dados=dados,
            )
            db.add(n)
            db.commit()
            db.refresh(n)
            import anyio
            anyio.from_thread.run(sio.emit, "chamado:deleted", {"id": chamado_id})
            anyio.from_thread.run(sio.emit, "notification:new", {
                "id": n.id,
                "tipo": n.tipo,
                "titulo": n.titulo,
                "mensagem": n.mensagem,
                "recurso": n.recurso,
                "recurso_id": n.recurso_id,
                "acao": n.acao,
                "dados": n.dados,
                "lido": n.lido,
                "criado_em": n.criado_em.isoformat() if n.criado_em else None,
            })
        except Exception:
            pass
        return {"ok": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao excluir chamado: {e}")
