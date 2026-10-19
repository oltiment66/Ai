import http.server
import os
import socketserver
import urllib.error
import urllib.request
from pathlib import Path

PUBLIC_PORT = int(os.environ.get("PORT", "8080"))
BOT_PORT = 8081
STATIC = (Path(__file__).parent / "mini-app" / "dist").resolve()
MIME = {".html":"text/html; charset=utf-8", ".js":"text/javascript; charset=utf-8", ".css":"text/css; charset=utf-8", ".svg":"image/svg+xml", ".png":"image/png", ".jpg":"image/jpeg", ".ico":"image/x-icon"}

class Handler(http.server.BaseHTTPRequestHandler):
    def log_message(self, fmt, *args): print("gateway:", fmt % args)
    def do_OPTIONS(self): self.proxy()
    def do_GET(self): self.proxy() if self.path.startswith("/api/") or self.path == "/health" else self.static()
    def do_POST(self): self.proxy()
    def proxy(self):
        length = int(self.headers.get("Content-Length", "0"))
        body = self.rfile.read(length) if length else None
        headers = {k:v for k,v in self.headers.items() if k.lower() not in ("host", "content-length")}
        try:
            req = urllib.request.Request(f"http://127.0.0.1:{BOT_PORT}{self.path}", data=body, headers=headers, method=self.command)
            with urllib.request.urlopen(req, timeout=120) as r:
                data = r.read(); self.send_response(r.status)
                for k,v in r.headers.items():
                    if k.lower() not in ("connection", "transfer-encoding", "server", "date"): self.send_header(k,v)
                self.end_headers(); self.wfile.write(data)
        except urllib.error.HTTPError as e:
            data=e.read(); self.send_response(e.code); self.send_header("Content-Type","application/json; charset=utf-8"); self.send_header("Content-Length",str(len(data))); self.end_headers(); self.wfile.write(data)
        except Exception:
            data=b'{"error":"bot api unavailable"}'; self.send_response(502); self.send_header("Content-Type","application/json; charset=utf-8"); self.send_header("Content-Length",str(len(data))); self.end_headers(); self.wfile.write(data)
    def static(self):
        rel=self.path.split("?",1)[0].lstrip("/")
        candidate=(STATIC / rel).resolve() if rel else (STATIC / "index.html").resolve()
        if STATIC not in candidate.parents or not candidate.is_file(): candidate=STATIC / "index.html"
        data=candidate.read_bytes(); self.send_response(200); self.send_header("Content-Type",MIME.get(candidate.suffix,"application/octet-stream")); self.send_header("Cache-Control","no-cache"); self.send_header("Content-Length",str(len(data))); self.end_headers(); self.wfile.write(data)

class Server(socketserver.ThreadingMixIn, http.server.HTTPServer): daemon_threads=True
print(f"AI FREE public gateway listening on {PUBLIC_PORT}", flush=True)
Server(("0.0.0.0", PUBLIC_PORT), Handler).serve_forever()
