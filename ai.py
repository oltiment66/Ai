"""AI provider adapters.
kind='openai'   -> any OpenAI-compatible API (UnoRouter, OpenAI, OpenRouter, Gemini, DeepSeek, Groq, ...)
kind='byteplus' -> BytePlus ModelArk (chat is OpenAI-compatible, plus Seedream images & Seedance video tasks)
"""
import asyncio
import base64
import time

import httpx

TIMEOUT = httpx.Timeout(240, connect=20)
RETRY_CODES = {429, 500, 502, 503, 504}


class AIError(Exception):
    pass


def _url(p, path):
    return p["base_url"].rstrip("/") + path


def _headers(p):
    return {"Authorization": f"Bearer {p['api_key']}", "Content-Type": "application/json"}


def _err(r):
    try:
        j = r.json()
        e = j.get("error", j) if isinstance(j, dict) else j
        msg = (e.get("message") or e.get("msg") or str(e)) if isinstance(e, dict) else str(e)
    except Exception:
        msg = r.text[:300]
    return AIError(f"HTTP {r.status_code}: {msg}")


async def _request(method, p, path, body=None, raw=False):
    last = None
    for attempt in range(3):
        try:
            async with httpx.AsyncClient(timeout=TIMEOUT, follow_redirects=True) as c:
                r = await c.request(method, _url(p, path), headers=_headers(p), json=body)
        except httpx.HTTPError as e:
            last = AIError(f"خطای اتصال: {type(e).__name__}")
            await asyncio.sleep(2 * (attempt + 1))
            continue
        if r.status_code in RETRY_CODES and attempt < 2:
            last = _err(r)
            await asyncio.sleep(3 * (attempt + 1))
            continue
        if r.status_code >= 400:
            raise _err(r)
        if raw:
            return r.content
        try:
            return r.json()
        except Exception:
            raise AIError("پاسخ نامعتبر از سرویس")
    raise last or AIError("خطای ناشناخته")


async def list_models(p):
    j = await _request("GET", p, "/models")
    data = j.get("data", j) if isinstance(j, dict) else j
    ids = []
    for m in data or []:
        mid = m.get("id") if isinstance(m, dict) else m
        if mid:
            ids.append(str(mid))
    return sorted(set(ids))


def _content_text(content):
    if isinstance(content, list):
        return "".join(x.get("text", "") for x in content if isinstance(x, dict))
    return content or ""


async def chat(p, model, messages):
    j = await _request("POST", p, "/chat/completions", {"model": model, "messages": messages})
    try:
        msg = j["choices"][0]["message"]
    except Exception:
        raise AIError(str(j)[:300])
    text = _content_text(msg.get("content")).strip()
    if not text:
        text = (msg.get("reasoning_content") or "").strip()
    if not text:
        raise AIError("مدل پاسخ خالی برگردوند")
    return text


def _collect_images(j):
    out = []
    for d in (j.get("data") or []):
        if d.get("url"):
            out.append(d["url"])
        elif d.get("b64_json"):
            out.append(base64.b64decode(d["b64_json"]))
    return out


def _data_url_to_bytes(u):
    if u.startswith("data:"):
        return base64.b64decode(u.split(",", 1)[1])
    return u


async def image(p, model, prompt, size="auto"):
    if p["kind"] == "byteplus":
        body = {"model": model, "prompt": prompt, "response_format": "url", "watermark": False,
                "size": "2K" if size in ("", "auto") else size}
    else:
        body = {"model": model, "prompt": prompt, "n": 1}
        if size not in ("", "auto"):
            body["size"] = size
    try:
        out = _collect_images(await _request("POST", p, "/images/generations", body))
        if out:
            return out
        err = AIError("سرویس هیچ عکسی برنگردوند")
    except AIError as e:
        err = e
    if p["kind"] == "byteplus":
        raise err
    # Fallback: chat-based image models (OpenRouter / Gemini style)
    try:
        j = await _request("POST", p, "/chat/completions", {
            "model": model, "modalities": ["image", "text"],
            "messages": [{"role": "user", "content": prompt}]})
        msg = j["choices"][0]["message"]
        out = []
        for im in msg.get("images") or []:
            u = (im.get("image_url") or {}).get("url") if isinstance(im, dict) else None
            if u:
                out.append(_data_url_to_bytes(u))
        if isinstance(msg.get("content"), list):
            for part in msg["content"]:
                if isinstance(part, dict) and part.get("type") == "image_url":
                    out.append(_data_url_to_bytes(part["image_url"]["url"]))
        if out:
            return out
    except Exception:
        pass
    raise err


async def video(p, model, prompt, params="", progress=None, max_wait=900):
    start = time.time()
    if p["kind"] == "byteplus":
        text = (prompt + " " + params).strip() if params else prompt
        j = await _request("POST", p, "/contents/generations/tasks",
                           {"model": model, "content": [{"type": "text", "text": text}]})
        tid = j.get("id")
        if not tid:
            raise AIError(str(j)[:300])
        while time.time() - start < max_wait:
            await asyncio.sleep(6)
            s = await _request("GET", p, f"/contents/generations/tasks/{tid}")
            st = s.get("status", "")
            if progress:
                await progress(st, int(time.time() - start))
            if st == "succeeded":
                url = (s.get("content") or {}).get("video_url")
                if not url:
                    raise AIError("ویدیو ساخته شد ولی لینکش برنگشت")
                return url
            if st in ("failed", "cancelled", "expired"):
                e = s.get("error") or {}
                raise AIError(f"ساخت ویدیو ناموفق: {e.get('message', st) if isinstance(e, dict) else e}")
        raise AIError("زمان ساخت ویدیو طولانی شد (timeout)")
    # OpenAI-compatible /videos API (Sora style)
    j = await _request("POST", p, "/videos", {"model": model, "prompt": prompt})
    vid = j.get("id")
    if not vid:
        raise AIError(str(j)[:300])
    while time.time() - start < max_wait:
        await asyncio.sleep(8)
        s = await _request("GET", p, f"/videos/{vid}")
        st = s.get("status", "")
        if progress:
            await progress(st, int(time.time() - start))
        if st in ("completed", "succeeded"):
            if s.get("url") or s.get("video_url"):
                return s.get("url") or s.get("video_url")
            return await _request("GET", p, f"/videos/{vid}/content", raw=True)
        if st in ("failed", "cancelled", "expired"):
            e = s.get("error") or {}
            raise AIError(f"ساخت ویدیو ناموفق: {e.get('message', st) if isinstance(e, dict) else e}")
    raise AIError("زمان ساخت ویدیو طولانی شد (timeout)")
