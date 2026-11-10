// Proxy seguro hacia Gemini (Vercel Serverless Function).
// La API key vive SOLO en la variable de entorno GEMINI_API_KEY; nunca llega al navegador.
// No se guardan ni se registran las conversaciones.

const { SYSTEM_PROMPT, RESPONSE_SCHEMA } = require('./prompt');

const MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
// Si el modelo principal no está disponible para la clave (403/404/429/503), se prueba el siguiente.
const MODELS = [MODEL, 'gemini-2.5-flash', 'gemini-2.5-flash-lite'].filter((m, i, a) => a.indexOf(m) === i);
const MAX_MSGS = 14;
const MAX_CHARS = 1500;
const LEVELS = ['secundaria', 'preparatoria', 'universidad'];
const MODES = ['learn', 'teach'];

// Límite de uso básico por IP (en memoria, por instancia).
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 60000);
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length > 20; // 20 mensajes por minuto
}

function clean(s) {
  return String(s == null ? '' : s).slice(0, MAX_CHARS);
}

function buildRequest(body) {
  const mode = MODES.includes(body.mode) ? body.mode : 'learn';
  const level = LEVELS.includes(body.level) ? body.level : 'preparatoria';
  let age = parseInt(body.age, 10);
  if (!(age >= 10 && age <= 25)) age = 16;
  const style = body.style || {};
  const sp = {
    visual: Math.max(0, Math.min(99, parseInt(style.visual, 10) || 0)),
    auditivo: Math.max(0, Math.min(99, parseInt(style.auditivo, 10) || 0)),
    kinestesico: Math.max(0, Math.min(99, parseInt(style.kinestesico, 10) || 0)),
  };
  const hint = Math.max(0, Math.min(4, parseInt(body.hint, 10) || 0));

  const msgs = Array.isArray(body.messages) ? body.messages.slice(-MAX_MSGS) : [];
  const contents = msgs
    .filter((m) => m && (m.role === 'user' || m.role === 'model') && clean(m.text).trim())
    .map((m) => ({ role: m.role, parts: [{ text: clean(m.text) }] }));
  if (!contents.length || contents[contents.length - 1].role !== 'user') return null;

  const context =
    `\n\nCONTEXTO DE ESTA SESIÓN\n- mode: ${mode}\n- edad: ${age}\n- nivel de estudios: ${level}\n` +
    `- style_profile: visual=${sp.visual}, auditivo=${sp.auditivo}, kinestesico=${sp.kinestesico}\n` +
    `- hint_level actual: ${hint}\n` +
    `- posible tarea pegada (heurística del cliente): ${body.pasteSuspect ? 'sí' : 'no'}`;

  return {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT + context }] },
    contents,
    generationConfig: {
      temperature: 0.6,
      maxOutputTokens: 4096,
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA,
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  };
}

function normalize(d) {
  const arr = (x) => (Array.isArray(x) ? x : []);
  const int = (x, lo, hi) => Math.max(lo, Math.min(hi, parseInt(x, 10) || 0));
  const diagram = d.diagram && Array.isArray(d.diagram.steps) ? d.diagram : { title: '', steps: [] };
  return {
    reply: String(d.reply || '').slice(0, 3000),
    hint_level: int(d.hint_level, 0, 4),
    understanding: int(d.understanding, 0, 100),
    style_signal: ['visual', 'auditivo', 'kinestesico'].includes(d.style_signal) ? d.style_signal : 'neutral',
    confidence: ['alta', 'media', 'baja'].includes(d.confidence) ? d.confidence : 'media',
    verify_note: String(d.verify_note || '').slice(0, 400),
    homework_detected: !!d.homework_detected,
    topic: String(d.topic || '').slice(0, 60),
    diagram: {
      title: String(diagram.title || '').slice(0, 80),
      steps: diagram.steps.slice(0, 6).map((s) => ({
        label: String((s && s.label) || '').slice(0, 40),
        detail: String((s && s.detail) || '').slice(0, 200),
      })),
    },
    practice: String(d.practice || '').slice(0, 400),
    quick_replies: arr(d.quick_replies).slice(0, 3).map((q) => String(q).slice(0, 50)),
    missing_concepts: arr(d.missing_concepts).slice(0, 4).map((q) => String(q).slice(0, 40)),
  };
}

async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.end(JSON.stringify({ live: !!process.env.GEMINI_API_KEY }));
  }
  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.end(JSON.stringify({ error: 'method_not_allowed' }));
  }
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    res.statusCode = 503;
    return res.end(JSON.stringify({ error: 'no_key' }));
  }
  const ip = String((req.headers['x-forwarded-for'] || '').split(',')[0] || (req.socket && req.socket.remoteAddress) || 'x');
  if (rateLimited(ip)) {
    res.statusCode = 429;
    return res.end(JSON.stringify({ error: 'rate_limited' }));
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = null; }
  }
  if (!body || typeof body !== 'object') {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: 'bad_request' }));
  }
  const payload = buildRequest(body);
  if (!payload) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: 'bad_request' }));
  }

  try {
    let r = null;
    const failures = [];
    for (const model of MODELS) {
      r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
          body: JSON.stringify(payload),
        }
      );
      if (r.ok) break;
      let detail = '';
      try { const e = await r.json(); detail = String((e.error && (e.error.status + ': ' + e.error.message)) || '').slice(0, 220); } catch (e) { /* sin detalle */ }
      failures.push({ model, status: r.status, detail });
      if (![403, 404, 429, 503].includes(r.status)) break;
    }
    if (!r || !r.ok) {
      res.statusCode = 502;
      return res.end(JSON.stringify({ error: 'upstream', status: r ? r.status : 0, failures }));
    }
    const j = await r.json();
    const cand = j.candidates && j.candidates[0];
    const text = cand && cand.content && cand.content.parts && cand.content.parts.map((p) => p.text || '').join('');
    if (!text) {
      res.statusCode = 200;
      return res.end(JSON.stringify(normalize({
        reply: 'Esa petición no la puedo atender. ¿Volvemos a tu tema de estudio? Cuéntame qué estás viendo en clase.',
        confidence: 'alta', topic: 'Seguridad', quick_replies: ['Tengo una duda de mate', 'Tengo una duda de física'],
      })));
    }
    let data;
    try { data = JSON.parse(text); } catch (e) {
      res.statusCode = 502;
      return res.end(JSON.stringify({ error: 'bad_model_output' }));
    }
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.end(JSON.stringify(normalize(data)));
  } catch (e) {
    res.statusCode = 502;
    return res.end(JSON.stringify({ error: 'network' }));
  }
}

module.exports = handler;
module.exports._test = { buildRequest, normalize };
