"""Small authenticated HTTP API for the Telegram Mini App.

The bot remains the source of truth. Provider keys never leave this process.
"""
import asyncio
import hashlib
import hmac
import json
import time
from urllib.parse import parse_qsl, unquote

import ai
import db
from config import ADMIN_IDS, BOT_TOKEN


def _json(data):
    return json.dumps(data, ensure_ascii=False).encode()


def _valid_init_data(raw):
    if not raw or not BOT_TOKEN:
        return None
    raw = unquote(raw) if "%" in raw and "&" not in raw else raw
    pairs = dict(parse_qsl(raw, keep_blank_values=True))
    received = pairs.pop("hash", "")
    if not received:
        return None
    check = "\n".join(f"{k}={v}" for k, v in sorted(pairs.items()))
    secret = hmac.new(b"WebAppData", BOT_TOKEN.encode(), hashlib.sha256).digest()
    digest = hmac.new(secret, check.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(digest, received):
        return None
    if time.time() - int(pairs.get("auth_date", "0")) > 86400:
        return None
    try:
        return json.loads(pairs.get("user", "{}"))
    except Exception:
        return None


def _safe_user(raw):
    user = _valid_init_data(raw)
    if not user:
        return None
    row = db.get_user(int(user["id"]))
    if not row:
        db.add_user(user["id"], user.get("username"), user.get("first_name"), "active")
        row = db.get_user(int(user["id"]))
    return row


def _payload(row):
    models = []
    for sec in ("chat", "image", "video"):
        for m in db.list_models(sec, enabled_only=True):
            models.append({
                "id": m["id"], "section": sec, "model_id": m["model_id"],
                "title": m["title"], "brand": m.get("brand"), "provider": m["p_name"],
            })
    providers = [{"id": p["id"], "name": p["name"], "enabled": bool(p["enabled"]),
                  "models": p["n_models"]} for p in db.list_providers()]
    return {"user": {"id": row["id"], "name": row.get("first_name"), "admin": row["id"] in ADMIN_IDS},
            "models": models, "providers": providers,
            "stats": {"today": sum(db.usage_today(row["id"], s) for s in ("chat", "image", "video"))}}


async def _read(reader):
    head = await reader.readuntil(b"\r\n\r\n")
    lines = head.decode("latin1").split("\r\n")
    method, path, _ = lines[0].split(" ", 2)
    headers = dict(x.split(": ", 1) for x in lines[1:] if ": " in x)
    length = int(headers.get("Content-Length", "0"))
    body = await reader.readexactly(length) if length else b""
    return method, path.split("?", 1)[0], headers, body


async def _handle(reader, writer):
    try:
        method, path, headers, body = await _read(reader)
        init_data = headers.get("X-Telegram-Init-Data", "") or headers.get("X-Telegram-InitData", "")
        user = _safe_user(init_data)
        if method == 'OPTIONS':
            status, out = 200, {'ok': True}
        elif path == "/health":
            status, out = 200, {"ok": True}
        elif not user:
            status, out = 401, {"error": "Telegram WebApp authentication required"}
        elif method == "GET" and path in ("/api/bootstrap", "/api/state"):
            status, out = 200, _payload(user)
        elif method == "POST" and path == "/api/chat":
            data = json.loads(body or b"{}")
            model = db.get_model(int(data["model"]))
            if not model or not model["enabled"] or not model["p_enabled"]:
                raise ValueError("model unavailable")
            messages = data.get("messages") or [{"role": "user", "content": str(data.get("message", ""))}]
            answer = await ai.chat({"kind": model["p_kind"], "base_url": model["p_url"], "api_key": model["p_key"]},
                                   model["model_id"], messages[-12:])
            db.log_usage(user["id"], "chat", model["model_id"], True)
            status, out = 200, {"ok": True, "answer": answer, "model": model["title"]}
        else:
            status, out = 404, {"error": "not found"}
    except Exception as ex:
        status, out = 500, {"error": str(ex)[:240]}
    raw = _json(out)
    writer.write(f"HTTP/1.1 {status} {'OK' if status == 200 else 'Error'}\r\nContent-Type: application/json; charset=utf-8\r\nAccess-Control-Allow-Origin: *\r\nAccess-Control-Allow-Headers: Content-Type, X-Telegram-Init-Data\r\nContent-Length: {len(raw)}\r\nConnection: close\r\n\r\n".encode() + raw)
    await writer.drain()
    writer.close()


async def serve(host="0.0.0.0", port=8080):
    return await asyncio.start_server(_handle, host, port)
