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
        '<table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">'
    ]
    for k, v in rows:
        html.append(
            f'<tr><td style="border:1px solid #ddd;padding:8px;background:#f7f7f7;font-weight:bold">{k}</td>'
            f'<td style="border:1px solid #ddd;padding:8px">{v}</td></tr>'
        )
    if descricao:
        html.append(
            '<tr><td style="border:1px solid #ddd;padding:8px;background:#f7f7f7;font-weight:bold">Descrição</td>'
            f'<td style="border:1px solid #ddd;padding:8px">{descricao}</td></tr>'
        )
    html.append("</table>")
    return "".join(html)


def build_email_chamado_aberto(ch) -> Tuple[str, str]:
    subject = f"[Evoque TI] Chamado {ch.codigo} aberto (Protocolo {ch.protocolo})"
    body = [
        "<div style=\"font-family:Arial,sans-serif;color:#111\">",
        f"<p>Olá {ch.solicitante},</p>",
        "<p>Recebemos seu chamado e ele foi registrado com sucesso. Veja os detalhes abaixo:</p>",
        _build_chamado_table(ch),
        "<p>Em breve nossa equipe entrará em contato. Este é um e-mail automático, não responda.</p>",
        "</div>",
    ]
    return subject, "".join(body)


def build_email_status_atualizado(ch, status_anterior: str) -> Tuple[str, str]:
    subject = f"[Evoque TI] Status do chamado {ch.codigo}: {status_anterior} → {ch.status}"
    body = [
        "<div style=\"font-family:Arial,sans-serif;color:#111\">",
        f"<p>Olá {ch.solicitante},</p>",
        f"<p>O status do seu chamado foi atualizado: <strong>{status_anterior}</strong> → <strong>{ch.status}</strong>.</p>",
        _build_chamado_table(ch),
        "<p>Qualquer dúvida, estamos à disposição.</p>",
        "</div>",
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


def send_chamado_abertura(ch) -> bool:
    subject, html = build_email_chamado_aberto(ch)
    cc = []
    if EMAIL_TI:
        cc.append(str(EMAIL_TI))
    return send_mail(subject, html, to=[str(ch.email)], cc=cc)


def send_chamado_status(ch, status_anterior: str) -> bool:
    subject, html = build_email_status_atualizado(ch, status_anterior)
    cc = []
    if EMAIL_TI:
        cc.append(str(EMAIL_TI))
    return send_mail(subject, html, to=[str(ch.email)], cc=cc)
