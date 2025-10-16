from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from core.db import get_db, engine
from ..models.alert import Alert
from ..schemas.alert import AlertOut, AlertCreate

router = APIRouter(prefix="/alerts", tags=["TI - Alerts"]) 

@router.get("", response_model=List[AlertOut])
def list_alerts(db: Session = Depends(get_db)):
    try:
        try:
            Alert.__table__.create(bind=engine, checkfirst=True)
        except Exception:
            pass
        q = db.query(Alert).filter(Alert.ativo == True).order_by(Alert.id.desc()).all()
        return q
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao listar alertas: {e}")

@router.post("", response_model=AlertOut)
def create_alert(payload: AlertCreate, db: Session = Depends(get_db)):
    try:
        a = Alert(
            title=payload.title,
            message=payload.message,
            severity=payload.severity,
            start_at=payload.start_at,
            end_at=payload.end_at,
            link=payload.link,
            media_id=payload.media_id,
            ativo=payload.ativo,
        )
        db.add(a)
        db.commit()
        db.refresh(a)
        return a
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao criar alerta: {e}")

@router.delete("/{alert_id}")
def delete_alert(alert_id: int, db: Session = Depends(get_db)):
    try:
        a = db.query(Alert).filter(Alert.id == int(alert_id)).first()
        if not a:
            raise HTTPException(status_code=404, detail="Alerta não encontrado")
        a.ativo = False
        db.add(a)
        db.commit()
        return {"ok": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao remover alerta: {e}")
