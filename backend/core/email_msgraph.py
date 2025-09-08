from __future__ import annotations
import os
import time
import json
import threading
from typing import List, Optional, Tuple, Dict, Any
from urllib import request, parse, error
import base64

# Try to import backend/env.py as module to support key=value configs
try:
    import env as _env  # type: ignore
except Exception:  # pragma: no cover - best effort import
    _env = None

# Read settings from env module or environment variables
CLIENT_ID = (_env.CLIENT_ID if _env and getattr(_env, "CLIENT_ID", None) else os.getenv("CLIENT_ID"))
CLIENT_SECRET = (_env.CLIENT_SECRET if _env and getattr(_env, "CLIENT_SECRET", None) else os.getenv("CLIENT_SECRET"))
TENANT_ID = (_env.TENANT_ID if _env and getattr(_env, "TENANT_ID", None) else os.getenv("TENANT_ID"))
USER_ID = (_env.USER_ID if _env and getattr(_env, "USER_ID", None) else os.getenv("USER_ID"))

EMAIL_TI = (_env.EMAIL_TI if _env and getattr(_env, "EMAIL_TI", None) else os.getenv("EMAIL_TI"))
EMAIL_SISTEMA = (_env.EMAIL_SISTEMA if _env and getattr(_env, "EMAIL_SISTEMA", None) else os.getenv("EMAIL_SISTEMA"))

_graph_token: Optional[Tuple[str, float]] = None  # (token, expiry_epoch)


def _have_graph_config() -> bool:
    return bool(CLIENT_ID and CLIENT_SECRET and TENANT_ID and USER_ID)


def _get_graph_token() -> Optional[str]:
    global _graph_token
    if not _have_graph_config():
        return None
    now = time.time()
    if _graph_token and now < _graph_token[1] - 30:
        return _graph_token[0]
    token_url = f"https://login.microsoftonline.com/{TENANT_ID}/oauth2/v2.0/token"
    data = parse.urlencode({
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "grant_type": "client_credentials",
        "scope": "https://graph.microsoft.com/.default",
    }).encode("utf-8")
    req = request.Request(token_url, data=data, method="POST")
    req.add_header("Content-Type", "application/x-www-form-urlencoded")
    try:
        with request.urlopen(req, timeout=15) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
            token = payload.get("access_token")
            expires_in = int(payload.get("expires_in", 3600))
            if token:
                _graph_token = (token, now + expires_in)
                return token
    except error.HTTPError as e:
        try:
            msg = e.read().decode("utf-8")
            print(f"[EMAIL] Graph token error: {e.code} {msg}")
        except Exception:
            print(f"[EMAIL] Graph token HTTPError: {e}")
    except Exception as e:
        print(f"[EMAIL] Graph token exception: {e}")
    return None


def _post_graph(path: str, payload: dict) -> bool:
    token = _get_graph_token()
    if not token:
        return False
    url = f"https://graph.microsoft.com/v1.0{path}"
    body = json.dumps(payload).encode("utf-8")
    req = request.Request(url, data=body, method="POST")
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("Content-Type", "application/json")
    try:
        with request.urlopen(req, timeout=20) as resp:
            body = resp.read().decode("utf-8") if resp else ""
            print(f"[EMAIL] Graph sendMail response: status={resp.status} body={body}")
            return 200 <= resp.status < 300 or resp.status == 202
    except error.HTTPError as e:
        try:
            msg = e.read().decode("utf-8")
            print(f"[EMAIL] Graph sendMail error: {e.code} {msg}")
        except Exception:
            print(f"[EMAIL] Graph sendMail HTTPError: {e}")
    except Exception as e:
        print(f"[EMAIL] Graph sendMail exception: {e}")
    return False


def _recipients(addrs: List[str]) -> List[dict]:
    out = []
    for a in addrs:
        addr = (a or "").strip()
        if addr:
            out.append({"emailAddress": {"address": addr}})
    return out


def _format_dt(dt) -> str:
    try:
        from core.utils import now_brazil_naive
        if not dt:
            return ""
        # Ensure iso string nicely
        return dt.strftime("%d/%m/%Y %H:%M")
    except Exception:
        return str(dt) if dt else ""


def _build_chamado_table(ch) -> str:
    visita = ch.data_visita.strftime("%d/%m/%Y") if getattr(ch, "data_visita", None) else "-"
    internet = getattr(ch, "internet_item", None) or "-"
    descricao = (getattr(ch, "descricao", None) or "").replace("\n", "<br>")
    abertura = _format_dt(getattr(ch, "data_abertura", None))
    # Stylish two-column layout with subtle shadows and brand accents
    rows = [
        ("Código", ch.codigo),
        ("Protocolo", ch.protocolo),
        ("Status", ch.status),
        ("Prioridade", ch.prioridade),
        ("Solicitante", ch.solicitante),
        ("Cargo", ch.cargo),
        ("Telefone", ch.telefone),
        ("E-mail", ch.email),
        ("Unidade", ch.unidade),
        ("Problema", ch.problema),
        ("Item de Internet", internet),
        ("Data de Visita", visita),
        ("Aberto em", abertura),
    ]
    html = [
        '<div style="font-family:Inter, Arial, sans-serif;max-width:680px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e6e9ef">',
        '<div style="background:linear-gradient(90deg,#0ea5a4,#2563eb);padding:20px;color:#fff;display:flex;align-items:center;gap:12px">',
        '<div style="width:48px;height:48px;border-radius:8px;background:rgba(255,255,255,0.12);display:flex;align-items:center;justify-content:center;font-weight:700">',
        'E',
        '</div>',
        f'<div style="font-size:16px;font-weight:700">Evoque Fitness — Chamado {ch.codigo}</div>',
        '</div>',
        '<div style="padding:18px;color:#102a43;line-height:1.4;font-size:14px">',
        f'<p style="margin:0 0 12px">Olá <strong>{ch.solicitante}</strong>,</p>',
        '<p style="margin:0 0 14px;color:#334155">Recebemos seu chamado e registramos as informações abaixo.</p>',
        '<div style="display:flex;flex-direction:column;gap:8px">',
    ]
    for k, v in rows:
        html.append(
            f'<div style="display:flex;justify-content:space-between;padding:10px 12px;background:#f8fafc;border-radius:6px;border:1px solid #eef2f7">'
            f'<div style="font-weight:600;color:#0f172a">{k}</div>'
            f'<div style="color:#334155">{v or "-"}</div>'
            '</div>'
        )
    if descricao:
        html.append(
            '<div style="margin-top:8px;padding:12px;border-radius:6px;background:#f1f5f9;border:1px solid #e2e8f0">'
            '<div style="font-weight:600;margin-bottom:6px;color:#0f172a">Descrição</div>'
            f'<div style="color:#334155">{descricao}</div>'
            '</div>'
        )
    html.extend([
        '</div>',
        '<div style="margin-top:18px;display:flex;gap:8px;align-items:center">',
        '<a href="/" style="display:inline-block;padding:10px 14px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;font-weight:600">Ver chamado</a>',
        '<div style="color:#64748b;font-size:13px">Se precisar responder, acesse o portal ou conte conosco em ti@academiaevoque.com.br</div>',
        '</div>',
        '<div style="margin-top:18px;border-top:1px dashed #e6eef7;padding-top:12px;color:#94a3b8;font-size:12px">Este é um e‑mail automático. Por favor, não responda diretamente a ele.</div>',
        '</div>',
        '</div>',
    ])
    return "".join(html)


def build_email_chamado_aberto(ch) -> Tuple[str, str]:
    subject = f"[Evoque TI] Chamado {ch.codigo} aberto (Protocolo {ch.protocolo})"
    body = [
        _build_chamado_table(ch)
    ]
    return subject, "".join(body)


def build_email_status_atualizado(ch, status_anterior: str) -> Tuple[str, str]:
    subject = f"[Evoque TI] Status do chamado {ch.codigo}: {status_anterior} → {ch.status}"
    body = [
        '<div style="font-family:Inter, Arial, sans-serif;max-width:680px;margin:0 auto;">',
        '<div style="background:linear-gradient(90deg,#0ea5a4,#2563eb);padding:16px;color:#fff;border-radius:8px 8px 0 0;font-weight:700">',
        f'Atualização de status — Chamado {ch.codigo}',
        '</div>',
        '<div style="background:#fff;padding:18px;border:1px solid #e6e9ef;border-top:none;border-radius:0 0 8px 8px;color:#102a43">',
        f'<p style="margin:0 0 10px">Olá <strong>{ch.solicitante}</strong>,</p>',
        f'<p style="margin:0 0 12px;color:#334155">O status do seu chamado foi atualizado de <strong>{status_anterior}</strong> para <strong>{ch.status}</strong>.</p>',
        _build_chamado_table(ch),
        '<div style="margin-top:14px;color:#64748b;font-size:13px">Se desejar mais detalhes, acesse o portal.</div>',
        '</div>',
        '</div>'
    ]
    return subject, "".join(body)


def send_mail(subject: str, html_body: str, to: List[str], cc: Optional[List[str]] = None, attachments: Optional[List[Dict[str, Any]]] = None) -> bool:
    if not _have_graph_config():
        print("[EMAIL] Graph configuration missing; skipping send.")
        return False
    to_list = _recipients(to)
    cc_list = _recipients(cc or [])
    message = {
        "message": {
            "subject": subject,
            "body": {"contentType": "HTML", "content": html_body},
            "toRecipients": to_list,
        },
        "saveToSentItems": True,
    }
    if cc_list:
        message["message"]["ccRecipients"] = cc_list
    # Attachments must be a list of microsoft.graph.fileAttachment objects with base64 content
    if attachments:
        # Ensure structure
        attach_list = []
        for a in attachments:
            # expect dict with name, contentType, contentBytes (base64 string)
            name = a.get("name")
            contentType = a.get("contentType") or a.get("mime") or "application/octet-stream"
            contentBytes = a.get("contentBytes") or a.get("content")
            if not name or not contentBytes:
                continue
            attach_list.append({
                "@odata.type": "#microsoft.graph.fileAttachment",
                "name": name,
                "contentType": contentType,
                "contentBytes": contentBytes,
            })
        if attach_list:
            message["message"]["attachments"] = attach_list
    path = f"/users/{USER_ID}/sendMail"
    return _post_graph(path, message)


def send_async(func, *args, **kwargs) -> None:
    def _runner():
        try:
            func(*args, **kwargs)
        except Exception as e:  # pragma: no cover
            print(f"[EMAIL] async error: {e}")
    threading.Thread(target=_runner, daemon=True).start()


def send_chamado_abertura(ch, attachments: Optional[List[Dict[str, Any]]] = None) -> bool:
    subject, html = build_email_chamado_aberto(ch)
    cc = []
    if EMAIL_TI:
        cc.append(str(EMAIL_TI))
    return send_mail(subject, html, to=[str(ch.email)], cc=cc, attachments=attachments)


def send_chamado_status(ch, status_anterior: str, attachments: Optional[List[Dict[str, Any]]] = None) -> bool:
    subject, html = build_email_status_atualizado(ch, status_anterior)
    cc = []
    if EMAIL_TI:
        cc.append(str(EMAIL_TI))
    return send_mail(subject, html, to=[str(ch.email)], cc=cc, attachments=attachments)
