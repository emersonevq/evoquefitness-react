from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.db import get_db, engine
from ..models.notification import Notification
from ..schemas.notification import NotificationOut

router = APIRouter(prefix="/notifications", tags=["TI - Notificações"]) 

@router.get("", response_model=list[NotificationOut])
def list_notifications(limit: int = 50, db: Session = Depends(get_db)):
    try:
        try:
            Notification.__table__.create(bind=engine, checkfirst=True)
        except Exception:
            pass
        q = (
            db.query(Notification)
            .order_by(Notification.id.desc())
            .limit(max(1, min(500, int(limit))))
        )
        return q.all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao listar notificações: {e}")

@router.patch("/{notification_id}/read", response_model=NotificationOut)
def mark_read(notification_id: int, db: Session = Depends(get_db)):
    try:
        n = db.query(Notification).filter(Notification.id == notification_id).first()
        if not n:
            raise HTTPException(status_code=404, detail="Notificação não encontrada")
        if not n.lido:
            from core.utils import now_brazil_naive
            n.lido = True
            n.lido_em = now_brazil_naive()
            db.add(n)
            db.commit()
            db.refresh(n)
        return n
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar notificação: {e}")
