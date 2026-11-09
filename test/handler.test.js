// Pruebas del proxy sin red ni API key real:  node test/handler.test.js
const assert = require('assert');
const handler = require('../api/chat');
const { buildRequest, normalize } = handler._test;

function call(method, body, env) {
  return new Promise((resolve) => {
    const old = process.env.GEMINI_API_KEY;
    if (env === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = env;
    const res = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, end(b) { process.env.GEMINI_API_KEY = old || ''; if (!old) delete process.env.GEMINI_API_KEY; resolve({ code: this.statusCode, body: b }); } };
    handler({ method, body, headers: {}, socket: { remoteAddress: 't' + Math.random() } }, res);
  });
}

(async () => {
  // 1. Sin clave -> 503 (la interfaz activa el modo demostración)
  let r = await call('POST', { messages: [{ role: 'user', text: 'hola' }] });
  assert.strictEqual(r.code, 503);

  // 2. GET informa si hay IA en vivo
  r = await call('GET', null, 'k');
  assert.strictEqual(JSON.parse(r.body).live, true);

  // 3. Validación y saneamiento de la entrada
  assert.strictEqual(buildRequest({ messages: [] }), null);
  assert.strictEqual(buildRequest({ messages: [{ role: 'model', text: 'x' }] }), null);
  const q = buildRequest({ mode: 'hack', level: 'x', age: 999, hint: 99, messages: [{ role: 'user', text: 'a'.repeat(5000) }] });
  assert.ok(q.contents[0].parts[0].text.length === 1500);
  assert.ok(q.systemInstruction.parts[0].text.includes('mode: learn'));
  assert.ok(q.systemInstruction.parts[0].text.includes('edad: 16'));
  assert.ok(q.systemInstruction.parts[0].text.includes('hint_level actual: 4'));

  // 4. La clave nunca viaja en el cuerpo, solo en el encabezado
  assert.ok(!JSON.stringify(q).includes('GEMINI_API_KEY'));

  // 5. Normalización de la salida del modelo
  const n = normalize({ reply: 'x', hint_level: 9, understanding: -5, style_signal: 'raro', confidence: 'zzz', diagram: { steps: new Array(20).fill({ label: 'a', detail: 'b' }) } });
  assert.strictEqual(n.hint_level, 4);
  assert.strictEqual(n.understanding, 0);
  assert.strictEqual(n.style_signal, 'neutral');
  assert.strictEqual(n.confidence, 'media');
  assert.strictEqual(n.diagram.steps.length, 6);

  // 6. Llamada simulada a Gemini
  const realFetch = global.fetch;
  global.fetch = async (url, opts) => {
    assert.ok(url.includes('generateContent'));
    assert.ok(opts.headers['x-goog-api-key'] === 'k');
    return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify({ reply: 'Hola', hint_level: 0, understanding: 10 }) }] } }] }) };
  };
  r = await call('POST', { messages: [{ role: 'user', text: 'Pitágoras' }] }, 'k');
  assert.strictEqual(r.code, 200);
  assert.strictEqual(JSON.parse(r.body).reply, 'Hola');
  global.fetch = realFetch;

  console.log('Todas las pruebas del proxy pasaron.');
})().catch((e) => { console.error(e); process.exit(1); });
