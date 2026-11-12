// Pruebas de la voz de Omox sin red ni API key real:  node test/tts.test.js
const assert = require('assert');

function load() { delete require.cache[require.resolve('../api/tts')]; return require('../api/tts'); }

function call(handler, method, body, key) {
  return new Promise((resolve) => {
    if (key === undefined) delete process.env.ELEVENLABS_API_KEY; else process.env.ELEVENLABS_API_KEY = key;
    const res = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, end(b) { resolve({ code: this.statusCode, body: b, headers: this.headers }); } };
    handler({ method, body, headers: {}, socket: { remoteAddress: 't' + Math.random() } }, res);
  });
}

(async () => {
  const realFetch = global.fetch;
  let h = load();

  // 1. Sin clave -> 503 (la app usa la voz del navegador)
  let r = await call(h, 'POST', { text: 'hola' });
  assert.strictEqual(r.code, 503);

  // 2. GET informa si hay voz en vivo, sin exponer la clave
  r = await call(h, 'GET', null, 'sk_secreta');
  assert.strictEqual(JSON.parse(r.body).live, true);
  assert.ok(!r.body.includes('sk_secreta'));

  // 3. Texto vacío -> 400
  r = await call(h, 'POST', { text: '   ' }, 'k');
  assert.strictEqual(r.code, 400);

  // 4. Limpieza del texto: sin markdown, sin emojis, con límite
  const { speakable } = h._test;
  assert.strictEqual(speakable('**Hola** `x` 🎓 amigo'), 'Hola x amigo');
  assert.strictEqual(speakable('a'.repeat(5000)).length, 1200);

  // 5. Llamada simulada a ElevenLabs: la clave va en el encabezado, devuelve mp3
  let seen = null;
  global.fetch = async (url, opts) => {
    seen = { url, opts };
    return { ok: true, status: 200, arrayBuffer: async () => new Uint8Array([73, 68, 51]).buffer };
  };
  r = await call(h, 'POST', { text: '¡Muy bien!' }, 'k');
  assert.strictEqual(r.code, 200);
  assert.strictEqual(r.headers['Content-Type'], 'audio/mpeg');
  assert.ok(seen.url.includes('/v1/text-to-speech/'));
  assert.strictEqual(seen.opts.headers['xi-api-key'], 'k');
  const sent = JSON.parse(seen.opts.body);
  assert.strictEqual(sent.text, '¡Muy bien!');
  assert.strictEqual(sent.language_code, 'es');
  assert.ok(!seen.opts.body.includes('"k"'));

  // 6. Si la voz configurada no existe, usa la primera voz de la cuenta
  h = load();
  const urls = [];
  global.fetch = async (url) => {
    urls.push(url);
    if (url.endsWith('/v1/voices')) return { ok: true, json: async () => ({ voices: [{ voice_id: 'VOZ_ALT' }] }) };
    if (urls.length === 1) return { ok: false, status: 404, json: async () => ({ detail: { status: 'voice_not_found' } }) };
    return { ok: true, status: 200, arrayBuffer: async () => new ArrayBuffer(4) };
  };
  r = await call(h, 'POST', { text: 'hola' }, 'k');
  assert.strictEqual(r.code, 200);
  assert.ok(urls[2].includes('VOZ_ALT'));

  // 7. Clave inválida -> 401 (la app cambia a la voz del navegador)
  h = load();
  global.fetch = async (url) => (url.endsWith('/v1/voices')
    ? { ok: false, status: 401 }
    : { ok: false, status: 401, json: async () => ({ detail: { status: 'invalid_api_key' } }) });
  r = await call(h, 'POST', { text: 'hola' }, 'k');
  assert.strictEqual(r.code, 401);

  global.fetch = realFetch;
  console.log('✓ Todas las pruebas de voz pasaron');
})().catch((e) => { console.error(e); process.exit(1); });
