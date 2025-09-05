from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
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
from core.utils import now_brazil_naive
from ..models import Chamado, User, TicketAnexo, ChamadoAnexo, HistoricoTicket
from ti.schemas.attachment import AnexoOut
from ti.schemas.ticket import HistoricoItem, HistoricoResponse

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
        try:
            Chamado.__table__.create(bind=engine, checkfirst=True)
        except Exception:
            pass
        ch = service_criar(db, payload)
        try:
            Notification.__table__.create(bind=engine, checkfirst=True)
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
            import anyio
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

@router.post("/with-attachments", response_model=ChamadoOut)
def criar_chamado_com_anexos(
    solicitante: str = Form(...),
    cargo: str = Form(...),
    email: str = Form(...),
    telefone: str = Form(...),
    unidade: str = Form(...),
    problema: str = Form(...),
    internetItem: str | None = Form(None),
    visita: str | None = Form(None),
    descricao: str | None = Form(None),
    files: list[UploadFile] = File(default=[]),
    autor_email: str | None = Form(None),
    db: Session = Depends(get_db),
):
    try:
        try:
            Chamado.__table__.create(bind=engine, checkfirst=True)
            ChamadoAnexo.__table__.create(bind=engine, checkfirst=True)
        except Exception:
            pass
        payload = ChamadoCreate(
            solicitante=solicitante,
            cargo=cargo,
            email=email,
            telefone=telefone,
            unidade=unidade,
            problema=problema,
            internetItem=internetItem,
            visita=visita,
            descricao=descricao,
        )
        ch = service_criar(db, payload)
        if files:
            user_id = None
            if autor_email:
                try:
                    user = db.query(User).filter(User.email == autor_email).first()
                    user_id = user.id if user else None
                except Exception:
                    user_id = None
            import hashlib
            for f in files:
                try:
                    safe_name = (f.filename or "arquivo")
                    content = f.file.read()
                    ext = safe_name.rsplit(".", 1)[-1].lower() if "." in safe_name else None
                    sha = hashlib.sha256(content).hexdigest()
                    ca = ChamadoAnexo(
                        chamado_id=ch.id,
                        nome_original=safe_name,
                        nome_arquivo=safe_name,
                        caminho_arquivo="",
                        tamanho_bytes=len(content),
                        tipo_mime=f.content_type or None,
                        extensao=ext or None,
                        hash_arquivo=sha,
                        data_upload=now_brazil_naive(),
                        usuario_upload_id=user_id,
                        descricao=None,
                        ativo=True,
                        conteudo=content,
                    )
                    db.add(ca)
                    db.flush()
                    ca.caminho_arquivo = f"api/chamados/anexos/chamado/{ca.id}"
                except Exception:
                    continue
            db.commit()
        return ch
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao criar chamado com anexos: {e}")

@router.post("/{chamado_id}/ticket")
def enviar_ticket(
    chamado_id: int,
    assunto: str = Form(...),
    mensagem: str = Form(...),
    destinatarios: str = Form(...),
    autor_email: str | None = Form(None),
    files: list[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
):
    try:
        # garantir tabelas necessárias para anexos de ticket
        TicketAnexo.__table__.create(bind=engine, checkfirst=True)
        user_id = None
        if autor_email:
            try:
                user = db.query(User).filter(User.email == autor_email).first()
                user_id = user.id if user else None
            except Exception:
                user_id = None
        # registrar histórico via ORM
        h = HistoricoTicket(
            chamado_id=chamado_id,
            usuario_id=user_id or None,
            assunto=assunto,
            mensagem=mensagem,
            destinatarios=destinatarios,
            data_envio=now_brazil_naive(),
        )
        db.add(h)
        db.commit()
        db.refresh(h)
        h_id = h.id
        # salvar anexos em tickets_anexos com metadados e caminho
        if files:
            import hashlib
            for f in files:
                try:
                    safe_name = (f.filename or "arquivo")
                    content = f.file.read()
                    ext = safe_name.rsplit(".", 1)[-1].lower() if "." in safe_name else None
                    sha = hashlib.sha256(content).hexdigest()
                    ta = TicketAnexo(
                        chamado_id=chamado_id,
                        nome_original=safe_name,
                        nome_arquivo=safe_name,
                        caminho_arquivo="",
                        tamanho_bytes=len(content),
                        tipo_mime=f.content_type or None,
                        extensao=ext or None,
                        hash_arquivo=sha,
                        data_upload=now_brazil_naive(),
                        usuario_upload_id=user_id,
                        descricao=None,
                        ativo=True,
                        origem="ticket",
                        conteudo=content,
                    )
                    db.add(ta)
                    db.flush()
                    ta.caminho_arquivo = f"api/chamados/anexos/ticket/{ta.id}"
                except Exception:
                    continue
            db.commit()
        return {"ok": True, "historico_id": h_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao enviar ticket: {e}")

@router.get("/{chamado_id}/historico", response_model=HistoricoResponse)
def obter_historico(chamado_id: int, db: Session = Depends(get_db)):
    try:
        items: list[HistoricoItem] = []
        ch = db.query(Chamado).filter(Chamado.id == chamado_id).first()
        if not ch:
            raise HTTPException(status_code=404, detail="Chamado não encontrado")
        if ch.data_abertura:
            items.append(HistoricoItem(t=ch.data_abertura, tipo="abertura", label="Chamado aberto", anexos=None))
        # anexos enviados na abertura (chamado_anexos)
        cas = db.query(ChamadoAnexo).filter(ChamadoAnexo.chamado_id == chamado_id).order_by(ChamadoAnexo.data_upload.asc()).all()
        if cas:
            class _CA:
                def __init__(self, x):
                    self.id = x.id
                    self.nome_original = x.nome_original
                    self.caminho_arquivo = x.caminho_arquivo
                    self.mime_type = x.tipo_mime
                    self.tamanho_bytes = x.tamanho_bytes
                    self.data_upload = x.data_upload
            items.append(HistoricoItem(
                t=(cas[0].data_upload or now_brazil_naive()),
                tipo="anexos_iniciais",
                label="Anexos enviados na abertura",
                anexos=[AnexoOut.model_validate(_CA(a)) for a in cas],
            ))
        try:
            Notification.__table__.create(bind=engine, checkfirst=True)
            notas = db.query(Notification).filter(
                Notification.recurso == "chamado",
                Notification.recurso_id == chamado_id,
            ).order_by(Notification.criado_em.asc()).all()
            for n in notas:
                if n.acao == "status":
                    items.append(HistoricoItem(
                        t=n.criado_em or now_brazil_naive(),
                        tipo="status",
                        label=n.mensagem or "Status atualizado",
                        anexos=None,
                    ))
        except Exception:
            pass
        # histórico (historico_tickets via ORM)
        hs = db.query(HistoricoTicket).filter(HistoricoTicket.chamado_id == chamado_id).order_by(HistoricoTicket.data_envio.asc()).all()
        for h in hs:
            anexos_ticket = []
            try:
                from datetime import timedelta
                start = (h.data_envio or now_brazil_naive()) - timedelta(minutes=3)
                end = (h.data_envio or now_brazil_naive()) + timedelta(minutes=3)
                tas = db.query(TicketAnexo).filter(TicketAnexo.chamado_id == chamado_id).all()
                for ta in tas:
                    if ta.data_upload and start <= ta.data_upload <= end:
                        class _A:
                            id = ta.id
                            nome_original = ta.nome_original
                            caminho_arquivo = ta.caminho_arquivo
                            mime_type = ta.tipo_mime
                            tamanho_bytes = ta.tamanho_bytes
                            data_upload = ta.data_upload
                        anexos_ticket.append(_A())
            except Exception:
                pass
            items.append(HistoricoItem(
                t=h.data_envio or now_brazil_naive(),
                tipo="ticket",
                label=f"{h.assunto}",
                anexos=[AnexoOut.model_validate(a) for a in anexos_ticket] if anexos_ticket else None,
            ))
        items_sorted = sorted(items, key=lambda x: x.t)
        return HistoricoResponse(items=items_sorted)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao obter histórico: {e}")

@router.patch("/{chamado_id}/status", response_model=ChamadoOut)
def atualizar_status(chamado_id: int, payload: ChamadoStatusUpdate, db: Session = Depends(get_db)):
    try:
        novo = _normalize_status(payload.status)
        if novo not in ALLOWED_STATUSES:
            raise HTTPException(status_code=400, detail="Status inválido")
        ch = db.query(Chamado).filter(Chamado.id == chamado_id).first()
        if not ch:
            raise HTTPException(status_code=404, detail="Chamado não encontrado")
        prev = ch.status or "Aberto"
        ch.status = novo
        if prev == "Aberto" and novo != "Aberto" and ch.data_primeira_resposta is None:
            ch.data_primeira_resposta = now_brazil_naive()
        if novo == "Concluído":
            ch.data_conclusao = now_brazil_naive()
        db.add(ch)
        db.commit()
        db.refresh(ch)
        try:
            Notification.__table__.create(bind=engine, checkfirst=True)
            HistoricoTicket.__table__.create(bind=engine, checkfirst=True)
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
            # registrar status via ORM
            h = HistoricoTicket(
                chamado_id=ch.id,
                usuario_id=None,
                assunto=f"Status: {prev} → {ch.status}",
                mensagem=f"{prev} → {ch.status}",
                destinatarios="",
                data_envio=now_brazil_naive(),
            )
            db.add(h)
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
    try:
        user = db.query(User).filter(User.email == payload.email).first()
        if not user:
            raise HTTPException(status_code=401, detail="Usuário não encontrado")
        from werkzeug.security import check_password_hash as _chk
        if not _chk(user.senha_hash, payload.senha):
            raise HTTPException(status_code=401, detail="Senha inválida")
        ch = db.query(Chamado).filter(Chamado.id == chamado_id).first()
        if not ch:
            raise HTTPException(status_code=404, detail="Chamado não encontrado")
        db.delete(ch)
        db.commit()
        try:
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
