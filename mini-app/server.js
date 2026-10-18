const http = require('http');
const fs = require('fs');
const path = require('path');
const port = process.env.PORT || 3000;
const root = path.join(__dirname, 'dist');
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
function page(data) {
  const cfg = JSON.stringify(process.env.API_URL || '').replace(/</g, '\\u003c');
  return data.toString().replace('</head>', `<script>window.__AI_FREE_API_URL__=${cfg}</script></head>`);
}
http.createServer((req,res)=>{
  const clean = decodeURIComponent(req.url.split('?')[0]);
  const file = path.join(root, clean === '/' ? 'index.html' : clean);
  const safe = file.startsWith(root) ? file : path.join(root,'index.html');
  fs.readFile(safe,(err,data)=>{
    if(err){ fs.readFile(path.join(root,'index.html'),(e,d)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(page(d));}); return; }
    const type = types[path.extname(safe)] || 'application/octet-stream';
    res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-cache'});
    res.end(path.extname(safe)==='.html' ? page(data) : data);
  });
}).listen(port,'0.0.0.0',()=>console.log(`AI FREE mini app listening on ${port}`));
