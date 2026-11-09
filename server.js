// Servidor local para probar sin Vercel:  node server.js
// Sirve /public y enruta POST /api/chat al mismo manejador que usa Vercel.
// Opcional: copia .env.example a .env y pon tu GEMINI_API_KEY.
const http = require('http');
const fs = require('fs');
const path = require('path');

try {
  const env = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
  env.split(/\r?\n/).forEach((l) => {
    const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  });
} catch (e) { /* sin .env */ }

const handler = require('./api/chat');
const PUB = path.join(__dirname, 'public');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };
const PORT = process.env.PORT || 3000;

http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  if (url === '/api/chat') {
    let raw = '';
    req.on('data', (c) => { raw += c; if (raw.length > 200000) req.destroy(); });
    req.on('end', () => {
      try { req.body = raw ? JSON.parse(raw) : null; } catch (e) { req.body = null; }
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      handler(req, res);
    });
    return;
  }
  let file = path.normalize(path.join(PUB, url === '/' ? 'index.html' : url));
  if (!file.startsWith(PUB)) { res.statusCode = 403; return res.end('403'); }
  fs.readFile(file, (err, buf) => {
    if (err) { res.statusCode = 404; return res.end('404'); }
    res.setHeader('Content-Type', TYPES[path.extname(file)] || 'application/octet-stream');
    res.end(buf);
  });
}).listen(PORT, () => console.log('Omox Tlaxcalli en http://localhost:' + PORT + (process.env.GEMINI_API_KEY ? '  (IA en vivo)' : '  (modo demostración: falta GEMINI_API_KEY)')));
