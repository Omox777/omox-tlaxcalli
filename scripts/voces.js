// Revisa tu clave de ElevenLabs y lista las voces para elegir la de Omox:  node scripts/voces.js
// Copia el ID que te guste en .env como ELEVENLABS_VOICE_ID=...
const fs = require('fs');
const path = require('path');
try {
  fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split(/\r?\n/).forEach((l) => {
    const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  });
} catch (e) { /* sin .env */ }

const key = (process.env.ELEVENLABS_API_KEY || '').trim();
const voice = process.env.ELEVENLABS_VOICE_ID || 'JBFqnCBsd6RMkjVDRZzb';
const model = process.env.ELEVENLABS_MODEL || 'eleven_flash_v2_5';
if (!key) { console.log('Falta ELEVENLABS_API_KEY en .env'); process.exit(1); }

async function why(r) {
  try { const j = await r.json(); const d = j.detail || j; return [d.status, d.message].filter(Boolean).join(' · ') || JSON.stringify(j).slice(0, 200); }
  catch (e) { return ''; }
}

(async () => {
  console.log('\nClave leída: ' + key.slice(0, 6) + '…' + key.slice(-4) + ' (' + key.length + ' caracteres)\n');

  // 1. Prueba de voz (gasta ~5 créditos)
  const t = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + voice + '?output_format=mp3_44100_128', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'xi-api-key': key },
    body: JSON.stringify({ text: 'Hola.', model_id: model }),
  });
  if (t.ok) console.log('✓ Voz: funciona. Omox puede hablar con ElevenLabs.');
  else console.log('✗ Voz: ElevenLabs respondió ' + t.status + ' → ' + (await why(t)));

  // 2. Lista de voces
  const r = await fetch('https://api.elevenlabs.io/v1/voices', { headers: { 'xi-api-key': key } });
  if (!r.ok) {
    console.log('✗ Lista de voces: ElevenLabs respondió ' + r.status + ' → ' + (await why(r)));
    console.log('\nQué significa:');
    console.log('  invalid_api_key       → la clave está mal copiada, se borró o se desactivó. Crea una nueva.');
    console.log('  missing_permissions   → la clave existe pero le faltan permisos. Edítala en ElevenLabs y activa');
    console.log('                          "Text to Speech" y "Voices (Read)".');
    console.log('  quota_exceeded        → se acabaron tus créditos del mes.\n');
    process.exit(1);
  }
  const { voices = [] } = await r.json();
  console.log('\nVoces disponibles (★ = la que usa Omox ahora):\n');
  voices.forEach((v) => {
    const l = v.labels || {};
    const es = (v.verified_languages || []).some((x) => x.language === 'es') ? ' · habla español verificado' : '';
    console.log((v.voice_id === voice ? '★ ' : '  ') + v.voice_id + '  ' + v.name + '  [' + [l.gender, l.age, l.accent, l.description].filter(Boolean).join(', ') + ']' + es);
    if (v.preview_url) console.log('      escuchar: ' + v.preview_url);
  });
  console.log('\nPara cambiarla: agrega ELEVENLABS_VOICE_ID=<id> en .env y reinicia con node server.js\n');
})().catch(() => { console.log('No pude conectar con ElevenLabs. Revisa tu internet.'); process.exit(1); });
