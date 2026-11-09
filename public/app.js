/* Omox Tlaxcalli · lógica de la interfaz */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);

  // ---------- Avatar original de Omox (SVG propio) ----------
  const AVATAR = `
<svg class="omox idle" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Omox, el tutor">
  <ellipse cx="100" cy="186" rx="52" ry="8" fill="#000" opacity=".12"/>
  <rect x="62" y="128" width="76" height="52" rx="18" fill="#243b6b"/>
  <path d="M62 150h76" stroke="#e0a22f" stroke-width="4"/>
  <g> <!-- códice -->
    <rect x="54" y="150" width="92" height="30" rx="5" fill="#fffaf0" stroke="#9c3c1e" stroke-width="3"/>
    <path d="M100 150v30" stroke="#9c3c1e" stroke-width="3"/>
    <path d="M62 160h28M62 168h22M110 160h28M110 168h22" stroke="#16807f" stroke-width="3" stroke-linecap="round"/>
  </g>
  <circle cx="100" cy="80" r="52" fill="#d98a5b"/>
  <path d="M48 70a52 52 0 0 1 104 0z" fill="#2b1c14"/>
  <rect x="46" y="62" width="108" height="16" rx="3" fill="#c4512d"/>
  <path d="M46 70h108" stroke="#f7eedc" stroke-width="2" stroke-dasharray="6 4"/>
  <path d="M60 58l8-14 8 14m8 0l8-18 8 18m8 0l8-14 8 14" fill="#16807f" stroke="#16807f" stroke-width="2" stroke-linejoin="round"/>
  <g class="blink"><circle cx="80" cy="92" r="11" fill="#fff"/><circle cx="120" cy="92" r="11" fill="#fff"/></g>
  <g class="pupils"><circle cx="82" cy="93" r="5" fill="#2b1c14"/><circle cx="122" cy="93" r="5" fill="#2b1c14"/>
  <circle cx="84" cy="91" r="1.6" fill="#fff"/><circle cx="124" cy="91" r="1.6" fill="#fff"/></g>
  <path d="M68 78q12-8 24 0M108 78q12-8 24 0" stroke="#2b1c14" stroke-width="3" fill="none" stroke-linecap="round"/>
  <circle cx="68" cy="108" r="6" fill="#c4512d" opacity=".35"/><circle cx="132" cy="108" r="6" fill="#c4512d" opacity=".35"/>
  <path class="mouth-smile" d="M84 112q16 16 32 0" stroke="#2b1c14" stroke-width="4" fill="none" stroke-linecap="round"/>
  <ellipse class="mouth-o" cx="100" cy="116" rx="6" ry="5" fill="#2b1c14"/>
  <g class="dots" fill="#243b6b"><circle cx="150" cy="40" r="4"/><circle cx="162" cy="30" r="5"/><circle cx="176" cy="18" r="6"/></g>
</svg>`;

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
    document.querySelectorAll('.omox').forEach((n) => {
      n.classList.remove('idle', 'thinking', 'happy', 'talking');
      n.classList.add(state);
    });
    const st = { idle: 'Listo para ayudarte', thinking: 'Pensando…', happy: '¡Muy bien!', talking: 'Hablando…' };
    $('status').textContent = st[state] || '';
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
  function speak(text) {
    if (!('speechSynthesis' in window)) { addSys('Tu navegador no admite lectura en voz alta.'); return; }
    window.speechSynthesis.cancel();
    const clean = String(text).replace(/\*\*/g, '').replace(/`/g, '');
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = 'es-MX'; u.rate = 0.95;
    u.onstart = () => setFace('talking'); u.onend = () => setFace('idle'); u.onerror = () => setFace('idle');
    window.speechSynthesis.speak(u);
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
        const r = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
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
      if (S.mode === 'learn') S.hint = data.hint_level;
      const prev = S.understanding; S.understanding = data.understanding;
      if (data.style_signal && data.style_signal !== 'neutral') S.style[data.style_signal]++;
      if (fmt) S.style[fmt]++;
      addBot(data);
      $('topic').textContent = data.topic || '';
      renderLadder(); renderMeter(); renderStyle(); renderTransparency(data); renderMissing(data.missing_concepts);
      renderChips(data.quick_replies);
      setFace(S.understanding - prev >= 15 ? 'happy' : 'idle');
      if (S.understanding - prev >= 15) setTimeout(() => setFace('idle'), 1500);
      if (fmt === 'auditivo') speak(data.reply);
      safeSet('omox_style', S.style);
    } catch (e) {
      rmTyping(); S.history.pop(); addSys(e.message || 'Ocurrió un error. Intenta de nuevo.'); setFace('idle');
    }
    S.busy = false; $('btnSend').disabled = false; $('input').focus();
  }

  // ---------- Modos ----------
  function setMode(m) {
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
    $('brandAvatar').innerHTML = AVATAR; $('avatar').innerHTML = AVATAR; $('dlgAvatar').innerHTML = AVATAR;
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
