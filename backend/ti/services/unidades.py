from __future__ import annotations
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Any, Dict
from ti.schemas.unidade import UnidadeCreate


def criar_unidade(db: Session, payload: UnidadeCreate) -> Dict[str, Any]:
    nome = (payload.nome or "").strip()
    if not nome:
        raise ValueError("Nome da unidade é obrigatório")

    # Checa duplicidade por nome e, se fornecido, por id
    try:
        row = db.execute(
            text(
                "SELECT id FROM unidade WHERE LOWER(nome) = LOWER(:nome) OR (:pid IS NOT NULL AND id = :pid) LIMIT 1"
            ),
            {"nome": nome, "pid": payload.id},
        ).first()
        if row is not None:
            raise ValueError("Unidade já cadastrada")
    except Exception:
        # Se a tabela não existir, deixaremos o INSERT falhar e reportar
        pass

    # Tenta inserir na tabela legada `unidade`
    inserted_id: int | None = None
    try:
        if payload.id is not None:
            try:
                res = db.execute(
                    text(
                        "INSERT INTO unidade (id, nome, data_criacao) VALUES (:id, :nome, NOW())"
                    ),
                    {"id": payload.id, "nome": nome},
                )
            except Exception:
                res = db.execute(
                    text("INSERT INTO unidade (id, nome) VALUES (:id, :nome)"),
                    {"id": payload.id, "nome": nome},
                )
            inserted_id = payload.id
        else:
            try:
                res = db.execute(
                    text(
                        "INSERT INTO unidade (nome, data_criacao) VALUES (:nome, NOW())"
                    ),
                    {"nome": nome},
                )
            except Exception:
                res = db.execute(
                    text("INSERT INTO unidade (nome) VALUES (:nome)"),
                    {"nome": nome},
                )
            inserted_id = getattr(res, "lastrowid", None)
            if not inserted_id:
                try:
                    row2 = db.execute(
                        text(
                            "SELECT id FROM unidade WHERE nome = :nome ORDER BY id DESC LIMIT 1"
                        ),
                        {"nome": nome},
                    ).first()
                    if row2 is not None:
                        inserted_id = int(row2[0])
                except Exception:
                    inserted_id = 0
        db.commit()
        return {"id": int(inserted_id or 0), "nome": nome, "cidade": ""}
    except Exception as e:
        db.rollback()
        raise ValueError(f"Erro ao inserir unidade: {e}")
