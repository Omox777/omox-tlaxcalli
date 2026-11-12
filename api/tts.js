// Voz de Omox: proxy seguro hacia ElevenLabs (Vercel Serverless Function).
// La API key vive SOLO en la variable de entorno ELEVENLABS_API_KEY; nunca llega al navegador.
// Solo se envía el texto de la respuesta de Omox; no se guarda ni se registra.

const VOICE = process.env.ELEVENLABS_VOICE_ID || 'JBFqnCBsd6RMkjVDRZzb';
const MODEL = process.env.ELEVENLABS_MODEL || 'eleven_flash_v2_5';
const MAX_CHARS = 1200;           // limita el gasto de créditos por respuesta
const TIMEOUT_MS = 20000;

// Ajustes de la voz (0 a 1). Se pueden cambiar en .env sin tocar el código.
const num = (v, d) => { const n = parseFloat(v); return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : d; };
const SETTINGS = {
  stability: num(process.env.ELEVENLABS_STABILITY, 0.45),        // más bajo = más expresiva
  similarity_boost: num(process.env.ELEVENLABS_SIMILARITY, 0.8),
  style: num(process.env.ELEVENLABS_STYLE, 0.25),
  use_speaker_boost: true,
};
const SPEED = (() => { const n = parseFloat(process.env.ELEVENLABS_SPEED); return Number.isFinite(n) ? Math.max(0.7, Math.min(1.2, n)) : 1; })();

// Límite de uso básico por IP (en memoria, por instancia).
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 60000);
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length > 12; // 12 audios por minuto
}

// Quita markdown y emojis para que la voz no los lea.
function speakable(text) {
  return String(text == null ? '' : text)
    .replace(/\*\*|__|`/g, '')
    .replace(/^\s*[-•]\s+/gm, '')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_CHARS);
}

let fallbackVoice = null; // si la voz configurada no existe en la cuenta, se usa la primera disponible

async function call(key, voice, text) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    return await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}?output_format=mp3_44100_128`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'audio/mpeg', 'xi-api-key': key },
      body: JSON.stringify(Object.assign(
        { text, model_id: MODEL, voice_settings: { ...SETTINGS, speed: SPEED } },
        /v2_5/.test(MODEL) ? { language_code: 'es' } : {} // solo Flash/Turbo v2.5 aceptan forzar idioma
      )),
      signal: ctl.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

async function firstVoice(key) {
  const r = await fetch('https://api.elevenlabs.io/v1/voices', { headers: { 'xi-api-key': key } });
  if (!r.ok) return null;
  const j = await r.json();
  return j.voices && j.voices[0] ? j.voices[0].voice_id : null;
}

function fail(res, code, error) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.end(JSON.stringify({ error }));
}

async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.end(JSON.stringify({ live: !!process.env.ELEVENLABS_API_KEY }));
  }
  if (req.method !== 'POST') return fail(res, 405, 'method_not_allowed');
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return fail(res, 503, 'no_key');

  const ip = String((req.headers['x-forwarded-for'] || '').split(',')[0] || (req.socket && req.socket.remoteAddress) || 'x');
  if (rateLimited(ip)) return fail(res, 429, 'rate_limited');

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = null; } }
  const text = speakable(body && body.text);
  if (!text) return fail(res, 400, 'bad_request');

  try {
    let r = await call(key, fallbackVoice || VOICE, text);
    if ((r.status === 404 || r.status === 400) && !fallbackVoice) {
      const alt = await firstVoice(key);
      if (alt && alt !== VOICE) { fallbackVoice = alt; r = await call(key, alt, text); }
    }
    if (!r.ok) {
      let detail = '';
      try { const e = await r.json(); detail = String((e.detail && (e.detail.status || e.detail.message)) || e.detail || '').slice(0, 160); } catch (e) { /* sin detalle */ }
      res.statusCode = r.status === 401 ? 401 : r.status === 429 ? 429 : 502;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.end(JSON.stringify({ error: 'upstream', status: r.status, detail }));
    }
    const audio = Buffer.from(await r.arrayBuffer());
    res.statusCode = 200;
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audio.length);
    return res.end(audio);
  } catch (e) {
    return fail(res, 502, 'network');
  }
}

module.exports = handler;
module.exports._test = { speakable };
