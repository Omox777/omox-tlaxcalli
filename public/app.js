/* Omox Tlaxcalli · lógica de la interfaz */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);

  // ---------- Avatar de Omox ----------
  // El dibujo y las expresiones viven en omox-avatar.js (se carga antes que este archivo).
  const Avatar = window.OmoxAvatar || { mount() {}, setMood() {}, react() {}, setLevel() {} };

  // ---------- Estado ----------
  const S = {
    profile: null, mode: 'learn', history: [], hint: 0, understanding: 0,
    style: { visual: 0, auditivo: 0, kinestesico: 0 }, demo: false, busy: false,
    nextFormat: null, lastSpoken: null, demoState: null,
  };

  function safeGet(k) { try { return JSON.parse(sessionStorage.getItem(k)); } catch (e) { return null; } }
  function safeSet(k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } }

  // ---------- Utilidades ----------
  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function md(text) {
    const lines = esc(text).split(/\r?\n/);
    let html = '', inList = false;
    const inline = (l) => l.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`(.+?)`/g, '<code>$1</code>');
    for (const raw of lines) {
      const li = raw.match(/^\s*[-•]\s+(.*)/);
      if (li) { if (!inList) { html += '<ul>'; inList = true; } html += '<li>' + inline(li[1]) + '</li>'; continue; }
      if (inList) { html += '</ul>'; inList = false; }
      if (raw.trim()) html += '<p>' + inline(raw) + '</p>';
    }
    if (inList) html += '</ul>';
    return html;
  }
  function setFace(state) {
    // 'thinking' y 'talking' los detecta el avatar desde #status y la voz del navegador.
    if (state === 'happy') Avatar.setMood('celebrate', 2600);
    else if (state === 'idle' || state === 'thinking') Avatar.setMood(null);
    const st = { idle: 'Listo para ayudarte', thinking: 'Pensando…', happy: '¡Muy bien!', talking: 'Hablando…' };
    $('status').textContent = st[state] || '';
  }
  // Elige la expresión de Omox según lo que respondió la IA.
  function reactTo(data, gained, prevHint) {
    if (gained >= 15) return setFace('happy');
    setFace('idle');
    if (data.confidence === 'baja' || data.verify_note) Avatar.setMood('confused', 3200);
    else if (S.mode === 'learn' && data.hint_level > prevHint) Avatar.setMood('encourage', 3500);
    else if (S.mode === 'teach') Avatar.setMood('curious', 3500);
    else Avatar.react(data.reply);
  }

  // ---------- Render ----------
  function scroll() { const c = $('chat'); c.scrollTop = c.scrollHeight; }
  function addMe(text) {
    const d = document.createElement('div'); d.className = 'msg me'; d.textContent = text;
    $('chat').appendChild(d); scroll();
  }
  function addSys(text) {
    const d = document.createElement('div'); d.className = 'msg sys'; d.textContent = text;
    $('chat').appendChild(d); scroll();
  }
  function addTyping() {
    const d = document.createElement('div'); d.className = 'msg bot'; d.id = 'typing';
    d.innerHTML = '<span class="typing"><i></i><i></i><i></i></span>';
    $('chat').appendChild(d); scroll();
  }
  function rmTyping() { const t = $('typing'); if (t) t.remove(); }

  function addBot(data) {
    const d = document.createElement('div'); d.className = 'msg bot';
    let html = '';
    if (S.mode === 'learn' && data.hint_level != null) {
      const names = ['Diagnóstico', 'Pregunta guía', 'Pista', 'Ejemplo parecido', 'Método paso a paso'];
      html += '<span class="lvl">Nivel ' + data.hint_level + ' · ' + names[data.hint_level] + '</span>';
    }
    html += md(data.reply);
    if (data.diagram && data.diagram.steps && data.diagram.steps.length) {
      html += '<div class="diagram"><h4>' + esc(data.diagram.title || 'Esquema') + '</h4><div class="steps">' +
        data.diagram.steps.map((s, i) => '<div class="step"><div class="n">' + (i + 1) + '</div><div class="t"><b>' + esc(s.label) + '</b>' + esc(s.detail) + '</div></div>').join('') +
        '</div></div>';
    }
    if (data.practice) html += '<div class="practice"><b>✍ Reto para ti:</b> ' + esc(data.practice) + '</div>';
    html += '<button type="button" class="speak">🔊 Escuchar</button>';
    d.innerHTML = html;
    d.querySelector('.speak').addEventListener('click', () => { S.style.auditivo++; renderStyle(); speak(data.reply); });
    $('chat').appendChild(d); scroll();
  }

  function renderChips(list) {
    const c = $('chips'); c.innerHTML = '';
    (list || []).forEach((q) => {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = q;
      b.addEventListener('click', () => send(q));
      c.appendChild(b);
    });
  }
  function renderLadder() {
    document.querySelectorAll('#ladder li').forEach((li) => {
      const l = +li.dataset.l;
      li.classList.toggle('cur', S.mode === 'learn' && l === S.hint);
      li.classList.toggle('done', S.mode === 'learn' && l < S.hint);
    });
    $('ladderNote').textContent = S.mode === 'teach'
      ? 'En este modo no hay escalera: tú explicas y Omox pregunta como compañero curioso.'
      : 'Omox nunca te da el resultado final; sube un escalón solo si lo necesitas.';
  }
  function renderMeter() {
    const u = Math.max(0, Math.min(100, S.understanding));
    $('meterFill').style.width = u + '%';
    $('meterBar').setAttribute('aria-valuenow', u);
    $('meterText').textContent = u === 0 ? 'Aún no hay datos. Empieza con un tema.'
      : u < 40 ? u + '% · Vamos empezando, sigue intentando.'
      : u < 75 ? u + '% · Vas bien, ya captaste lo básico.'
      : u + '% · ¡Muy buen dominio del tema!';
  }
  function renderStyle() {
    const t = Math.max(1, S.style.visual + S.style.auditivo + S.style.kinestesico);
    $('sv').style.width = Math.round((S.style.visual / t) * 100) + '%';
    $('sa').style.width = Math.round((S.style.auditivo / t) * 100) + '%';
    $('sk').style.width = Math.round((S.style.kinestesico / t) * 100) + '%';
    const total = S.style.visual + S.style.auditivo + S.style.kinestesico;
    if (total < 2) { $('styleText').textContent = 'Omox lo descubre mientras conversan; no hay examen.'; return; }
    const top = Object.entries(S.style).sort((a, b) => b[1] - a[1])[0][0];
    const label = { visual: 'visual: te explico con esquemas', auditivo: 'auditivo: te explico hablando', kinestesico: 'kinestésico: te explico con actividades' }[top];
    $('styleText').textContent = 'Parece que aprendes mejor de forma ' + label + '.';
  }
  function renderTransparency(d) {
    const map = { alta: 'Alta', media: 'Media', baja: 'Baja' };
    $('transparency').textContent = 'Confianza de la última respuesta: ' + (map[d.confidence] || '—');
    const v = $('verify');
    if (d.verify_note) { v.hidden = false; v.textContent = '⚠ Verifica: ' + d.verify_note; } else v.hidden = true;
  }
  function renderMissing(list) {
    const m = $('missing');
    if (S.mode === 'teach' && list && list.length) {
      m.hidden = false; m.innerHTML = '<small style="width:100%;color:#6d5a4c">Ideas que faltaron:</small>' + list.map((x) => '<span>' + esc(x) + '</span>').join('');
    } else { m.hidden = true; m.innerHTML = ''; }
  }

  // ---------- Voz ----------
  // Primero intenta la voz de ElevenLabs (vía /api/tts, la clave nunca llega aquí).
  // Si no hay clave o falla, usa la voz del navegador.
  const Voice = { remote: null, audio: null, ctx: null, raf: 0, cache: new Map(), token: 0 };

  function stopVoice() {
    Voice.token++;
    if (Voice.audio) { Voice.audio.onended = Voice.audio.onerror = null; Voice.audio.pause(); Voice.audio = null; }
    cancelAnimationFrame(Voice.raf); Avatar.setLevel && Avatar.setLevel(null);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }

  // Sincroniza la boca de Omox con el volumen real del audio.
  function lipSync(audio) {
    try {
      Voice.ctx = Voice.ctx || new (window.AudioContext || window.webkitAudioContext)();
      if (Voice.ctx.state === 'suspended') Voice.ctx.resume();
      const src = Voice.ctx.createMediaElementSource(audio);
      const an = Voice.ctx.createAnalyser(); an.fftSize = 512;
      src.connect(an); an.connect(Voice.ctx.destination);
      const buf = new Uint8Array(an.fftSize);
      const loop = () => {
        an.getByteTimeDomainData(buf);
        let sum = 0; for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; sum += v * v; }
        Avatar.setLevel(Math.min(1, Math.sqrt(sum / buf.length) * 5));
        Voice.raf = requestAnimationFrame(loop);
      };
      loop();
    } catch (e) { /* sin Web Audio: la boca usa la animación normal */ }
  }

  async function speakRemote(text, token) {
    let url = Voice.cache.get(text);
    if (!url) {
      $('status').textContent = 'Preparando voz…';
      const r = await fetch('/api/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
      if (!r.ok) { if (r.status === 503 || r.status === 401 || r.status === 404) Voice.remote = false; throw new Error('tts ' + r.status); }
      url = URL.createObjectURL(await r.blob());
      Voice.cache.set(text, url);
      if (Voice.cache.size > 20) { const [k, u] = Voice.cache.entries().next().value; URL.revokeObjectURL(u); Voice.cache.delete(k); }
    }
    if (token !== Voice.token) return;
    const audio = new Audio(url);
    Voice.audio = audio;
    lipSync(audio);
    audio.onplay = () => setFace('talking');
    audio.onended = audio.onerror = () => { cancelAnimationFrame(Voice.raf); Avatar.setLevel(null); Voice.audio = null; setFace('idle'); };
    await audio.play();
  }

  function speakBrowser(text) {
    if (!('speechSynthesis' in window)) { addSys('Tu navegador no admite lectura en voz alta.'); setFace('idle'); return; }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'es-MX'; u.rate = 0.95;
    const voces = window.speechSynthesis.getVoices();
    const v = voces.find((x) => x.lang === 'es-MX') || voces.find((x) => x.lang.startsWith('es'));
    if (v) u.voice = v;
    u.onstart = () => setFace('talking'); u.onend = () => setFace('idle'); u.onerror = () => setFace('idle');
    window.speechSynthesis.speak(u);
  }

  async function speak(text) {
    stopVoice();
    Avatar.setMood(null); // deja ver 'pensando' mientras llega el audio y luego 'hablando'
    const token = Voice.token;
    const clean = String(text).replace(/\*\*/g, '').replace(/`/g, '');
    if (Voice.remote !== false) {
      try { await speakRemote(clean, token); return; }
      catch (e) { if (token !== Voice.token) return; setFace('idle'); }
    }
    speakBrowser(clean);
  }
  let rec = null;
  function mic() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { addSys('Tu navegador no permite dictar por voz. Prueba con Chrome o Edge.'); return; }
    if (rec) { rec.stop(); return; }
    rec = new SR(); rec.lang = 'es-MX'; rec.interimResults = false;
    $('btnMic').classList.add('rec');
    rec.onresult = (e) => { $('input').value += (($('input').value ? ' ' : '') + e.results[0][0].transcript); autosize(); };
    rec.onend = () => { rec = null; $('btnMic').classList.remove('rec'); };
    rec.onerror = () => { rec = null; $('btnMic').classList.remove('rec'); };
    rec.start();
  }

  // ---------- Detección de tarea pegada (heurística local; el modelo decide también) ----------
  function pasteSuspect(t) {
    const numbered = (t.match(/(^|\s)\d+[\)\.]\s/g) || []).length;
    return t.length > 260 || numbered >= 2 || /resuelve (todo|todos)|haz mi tarea|hazme la tarea|dame las respuestas/i.test(t);
  }

  // ---------- Comunicación con la IA ----------
  async function askAI(userText) {
    const payload = {
      messages: S.history.slice(-14), mode: S.mode, age: S.profile.age, level: S.profile.level,
      style: S.style, hint: S.hint, pasteSuspect: pasteSuspect(userText),
    };
    if (!S.demo) {
      try {
        const post = () => fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        let r = await post();
        if (r.status === 502 || r.status === 504) r = await post(); // un reintento automático ante fallo temporal
        if (r.ok) return await r.json();
        if (r.status === 503 || r.status === 404) { setDemo(true); }
        else if (r.status === 429) throw new Error('Vas muy rápido 😅 Espera unos segundos y vuelve a intentar.');
        else throw new Error('No pude conectar con la IA. Intenta de nuevo en un momento.');
      } catch (e) {
        if (e instanceof TypeError) { setDemo(true); } else throw e;
      }
    }
    return window.OmoxDemo.respond(S, userText, S.mode);
  }
  function setDemo(on) {
    S.demo = on;
    const b = $('engineBadge');
    b.textContent = on ? 'Modo demostración (sin IA en vivo)' : 'IA: Gemini en vivo';
    b.classList.toggle('demo', on);
    if (on && !S._demoWarned) { S._demoWarned = true; addSys('Estás en modo demostración: las respuestas son guiones de prueba (Pitágoras y Newton). La IA en vivo se activa al configurar la API key.'); }
  }

  async function send(text) {
    text = String(text || '').trim();
    if (!text || S.busy || !S.profile) return;
    stopVoice();
    S.busy = true; $('btnSend').disabled = true; $('input').value = ''; autosize(); renderChips([]);
    const fmt = S.nextFormat; S.nextFormat = null;
    addMe(text);
    if (pasteSuspect(text)) addSys('Detecté una tarea completa. Omox no la resolverá: la convertiremos en una guía para que tú la hagas.');
    let prompt = text;
    if (fmt === 'visual') prompt += '\n\n(Quiero la explicación con un esquema paso a paso.)';
    if (fmt === 'auditivo') prompt += '\n\n(Quiero una explicación que suene bien al escucharla en voz alta.)';
    if (fmt === 'kinestesico') prompt += '\n\n(Quiero una actividad práctica para hacer.)';
    S.history.push({ role: 'user', text: prompt });
    setFace('thinking'); addTyping();
    try {
      const data = await askAI(text);
      rmTyping();
      S.history.push({ role: 'model', text: data.reply });
      const prevHint = S.hint;
      if (S.mode === 'learn') S.hint = data.hint_level;
      const prev = S.understanding; S.understanding = data.understanding;
      if (data.style_signal && data.style_signal !== 'neutral') S.style[data.style_signal]++;
      if (fmt) S.style[fmt]++;
      addBot(data);
      $('topic').textContent = data.topic || '';
      renderLadder(); renderMeter(); renderStyle(); renderTransparency(data); renderMissing(data.missing_concepts);
      renderChips(data.quick_replies);
      reactTo(data, S.understanding - prev, prevHint);
      if (S.understanding - prev >= 15) setTimeout(() => { if ($('status').textContent === '¡Muy bien!') $('status').textContent = 'Listo para ayudarte'; }, 2600);
      if (fmt === 'auditivo') speak(data.reply);
      safeSet('omox_style', S.style);
    } catch (e) {
      rmTyping(); S.history.pop(); addSys(e.message || 'Ocurrió un error. Intenta de nuevo.'); setFace('idle'); Avatar.setMood('confused', 2500);
    }
    S.busy = false; $('btnSend').disabled = false; $('input').focus();
  }

  // ---------- Modos ----------
  function setMode(m) {
    stopVoice();
    S.mode = m;
    $('modeLearn').classList.toggle('active', m === 'learn');
    $('modeTeach').classList.toggle('active', m === 'teach');
    $('modeLearn').setAttribute('aria-selected', m === 'learn');
    $('modeTeach').setAttribute('aria-selected', m === 'teach');
    S.history = []; S.hint = 0; S.demoState = null; S.demo && (S.demo = true);
    $('chat').innerHTML = ''; renderChips([]); renderLadder(); renderMissing([]);
    if (m === 'learn') {
      addBot({ hint_level: null, reply: '¡Hola! Cuéntame **qué tema o ejercicio** se te dificulta y lo resolvemos juntos, paso a paso. También puedes pedirme un **esquema**, que te lo **explique hablando** o una **actividad** para practicar.',
        quick_replies: [] });
      renderChips(['Teorema de Pitágoras', 'Segunda ley de Newton', 'No sé por dónde empezar']);
    } else {
      addBot({ hint_level: null, reply: '¡Ahora tú eres el maestro! 🎓 **Explícame un tema como si yo no supiera nada** y yo te haré preguntas. Si logras que lo entienda, es que tú lo dominas.', quick_replies: [] });
      renderChips(['Te explico Pitágoras', 'Te explico Newton']);
    }
  }

  function autosize() { const t = $('input'); t.style.height = 'auto'; t.style.height = Math.min(140, t.scrollHeight) + 'px'; }

  // ---------- Inicio ----------
  function start() {
    ['brandAvatar', 'avatar', 'dlgAvatar'].forEach((id) => Avatar.mount($(id)));
    const sv = safeGet('omox_style'); if (sv) S.style = sv;
    $('composer').addEventListener('submit', (e) => { e.preventDefault(); send($('input').value); });
    $('input').addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send($('input').value); } });
    $('input').addEventListener('input', autosize);
    $('btnMic').addEventListener('click', mic);
    document.querySelectorAll('.fmt').forEach((b) => b.addEventListener('click', () => {
      S.nextFormat = b.dataset.fmt;
      const v = $('input').value.trim();
      if (v) send(v);
      else { $('input').placeholder = 'Escribe tu tema y te lo explico en formato ' + ({ visual: 'esquema', auditivo: 'audio', kinestesico: 'actividad' }[b.dataset.fmt]) + '…'; $('input').focus(); }
    }));
    $('modeLearn').addEventListener('click', () => setMode('learn'));
    $('modeTeach').addEventListener('click', () => setMode('teach'));
    $('btnPrivacy').addEventListener('click', () => $('dlgPrivacy').showModal());
    $('btnReset').addEventListener('click', () => { S.understanding = 0; S.style = { visual: 0, auditivo: 0, kinestesico: 0 }; $('topic').textContent = ''; $('verify').hidden = true; renderMeter(); renderStyle(); setMode('learn'); });
    $('startForm').addEventListener('submit', () => {
      S.profile = { age: parseInt($('age').value, 10) || 16, level: $('level').value };
      setMode('learn');
    });
    $('dlgStart').addEventListener('cancel', (e) => e.preventDefault());
    renderLadder(); renderMeter(); renderStyle(); setFace('idle');
    $('dlgStart').showModal();
    // Detecta si hay IA en vivo (sin consumir cuota): el servidor responde 405 a GET si existe.
    fetch('/api/tts', { method: 'GET' }).then((r) => (r.ok ? r.json() : { live: false }))
      .then((j) => { Voice.remote = j.live ? null : false; }).catch(() => { Voice.remote = false; });
    fetch('/api/chat', { method: 'GET' }).then((r) => (r.ok ? r.json() : { live: false }))
      .then((j) => setDemoQuiet(!j.live)).catch(() => setDemoQuiet(true));
  }
  // Marca el motor sin mostrar el mensaje; la clave real se comprueba en la primera consulta.
  function setDemoQuiet(on) {
    const b = $('engineBadge');
    b.textContent = on ? 'Modo demostración (sin IA en vivo)' : 'IA: Gemini en vivo';
    b.classList.toggle('demo', on);
    S.demo = on; S._demoWarned = false;
  }

  document.addEventListener('DOMContentLoaded', start);
})();
