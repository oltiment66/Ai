import http.server, os, socketserver, urllib.error, urllib.request
from pathlib import Path
PUBLIC_PORT=int(os.environ.get('PORT','8080')); BOT_PORT=8081
STATIC=(Path(__file__).parent/'mini-app'/'dist').resolve()
MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.ico':'image/x-icon'}
PATCH='''<script>window.__AI_FREE_API_URL__="";(()=>{const u=window.Telegram?.WebApp?.initDataUnsafe?.user||{};const apply=()=>{const av=document.querySelector(".avatar");if(av){if(u.photo_url&&av.tagName!=="IMG"){const i=document.createElement("img");i.className="avatar";i.src=u.photo_url;av.replaceWith(i)}else if(!u.photo_url){av.textContent=(u.first_name||"U").slice(0,1)}}const top=document.querySelector(".top-actions");if(top&&!top.querySelector(".creator-id")){const d=document.createElement("span");d.className="creator-id";d.textContent="سازنده · ITX.MM2DI";d.style.cssText="color:#dca360;font-size:10px;margin-left:10px";top.insertBefore(d,top.firstChild)}};new MutationObserver(apply).observe(document.documentElement,{childList:true,subtree:true});apply()})()</script>'''
class Handler(http.server.BaseHTTPRequestHandler):
 def log_message(self,fmt,*args): print('gateway:',fmt%args)
 def do_OPTIONS(self): self.proxy()
 def do_GET(self): self.proxy() if self.path.startswith('/api/') or self.path=='/health' else self.static()
 def do_POST(self): self.proxy()
 def proxy(self):
  n=int(self.headers.get('Content-Length','0')); body=self.rfile.read(n) if n else None
  headers={k:v for k,v in self.headers.items() if k.lower() not in ('host','content-length')}
  try:
   req=urllib.request.Request(f'http://127.0.0.1:{BOT_PORT}{self.path}',data=body,headers=headers,method=self.command)
   with urllib.request.urlopen(req,timeout=120) as r:
    data=r.read(); self.send_response(r.status)
    for k,v in r.headers.items():
     if k.lower() not in ('connection','transfer-encoding','server','date'): self.send_header(k,v)
    self.end_headers(); self.wfile.write(data)
  except urllib.error.HTTPError as e:
   data=e.read(); self.send_response(e.code); self.send_header('Content-Type','application/json; charset=utf-8'); self.send_header('Content-Length',str(len(data))); self.end_headers(); self.wfile.write(data)
  except Exception:
   data=b'{"error":"bot api unavailable"}'; self.send_response(502); self.send_header('Content-Type','application/json; charset=utf-8'); self.send_header('Content-Length',str(len(data))); self.end_headers(); self.wfile.write(data)
 def static(self):
  rel=self.path.split('?',1)[0].lstrip('/'); c=(STATIC/rel).resolve() if rel else STATIC/'index.html'
  if STATIC not in c.parents or not c.is_file(): c=STATIC/'index.html'
  data=c.read_bytes()
  if c.name=='index.html':
   text=data.decode('utf-8'); text=text.replace('</head>',PATCH+'</head>'); data=text.encode('utf-8')
  self.send_response(200); self.send_header('Content-Type',MIME.get(c.suffix,'application/octet-stream')); self.send_header('Cache-Control','no-cache'); self.send_header('Content-Length',str(len(data))); self.end_headers(); self.wfile.write(data)
class Server(socketserver.ThreadingMixIn,http.server.HTTPServer): daemon_threads=True
print(f'AI FREE public gateway listening on {PUBLIC_PORT}',flush=True); Server(('0.0.0.0',PUBLIC_PORT),Handler).serve_forever()
