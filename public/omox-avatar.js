/* Omox Tlaxcalli · avatar neo-mexica expresivo
   Diseño original: tocado de turquesa con greca escalonada (xicalcoliuhqui),
   plumas, orejeras, circuitos de jade y la vírgula de la palabra de los códices.

   Se monta en #avatar, #brandAvatar y #dlgAvatar. Cárgalo ANTES de app.js.

   Expresiones (data-mood): idle, happy, celebrate, surprised, thinking,
   curious, encourage, confused, listening.
   Desde tu código puedes forzar una:  OmoxAvatar.setMood('celebrate', 3000)
   Si no, Omox reacciona solo a los mensajes del chat. */
(function () {
  'use strict';

  var INK = 'var(--o-ink)';
  var SVG =
    '<svg class="omox-svg" viewBox="0 0 160 160" role="img" aria-label="Omox" xmlns="http://www.w3.org/2000/svg">' +
    // Efectos externos: chispas (celebrar) y burbujas de pensamiento
    '<g class="o-fx">' +
      '<path class="o-spark s1" d="M18 40 l3 8 l8 3 l-8 3 l-3 8 l-3 -8 l-8 -3 l8 -3 Z" fill="var(--o-jade)"/>' +
      '<path class="o-spark s2" d="M142 34 l2.5 6 l6 2.5 l-6 2.5 l-2.5 6 l-2.5 -6 l-6 -2.5 l6 -2.5 Z" fill="var(--gold, #F2C14E)"/>' +
      '<path class="o-spark s3" d="M146 92 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 l5 -2 Z" fill="var(--o-red)"/>' +
    '</g>' +
    '<g class="o-think" fill="var(--o-jade)"><circle cx="128" cy="44" r="3"/><circle cx="138" cy="32" r="4.5"/><circle cx="150" cy="18" r="6"/></g>' +

    '<g class="o-head">' +
      // Plumas
      '<g class="o-plumes" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round">' +
        '<path class="p-l" d="M58 54 L44 14 L72 50 Z" fill="var(--o-quetzal)"/>' +
        '<path class="p-r" d="M102 54 L116 14 L88 50 Z" fill="var(--o-quetzal)"/>' +
        '<g class="p-c"><path d="M68 52 L80 4 L92 52 Z" fill="var(--o-quetzal)"/>' +
        '<path d="M80 4 L74 28 L86 28 Z" fill="var(--o-red)" stroke-width="3"/></g>' +
      '</g>' +
      // Orejeras
      '<g stroke="' + INK + '" stroke-width="4">' +
        '<circle cx="33" cy="104" r="11" fill="var(--o-jade)"/><circle cx="33" cy="104" r="4" fill="var(--o-paper)"/>' +
        '<circle cx="127" cy="104" r="11" fill="var(--o-jade)"/><circle cx="127" cy="104" r="4" fill="var(--o-paper)"/>' +
      '</g>' +
      // Rostro
      '<rect x="38" y="52" width="84" height="90" rx="24" fill="var(--o-skin)" stroke="' + INK + '" stroke-width="4"/>' +
      // Banda de turquesa con greca escalonada
      '<rect x="34" y="48" width="92" height="24" rx="5" fill="var(--o-jade)" stroke="' + INK + '" stroke-width="4"/>' +
      '<path d="M40 66 h8 v-8 h8 v8 h8 v-8 h8 M88 58 h8 v8 h8 v-8 h8 v8 h8" fill="none" stroke="' + INK + '" stroke-width="3"/>' +
      '<circle class="o-gem" cx="80" cy="60" r="7" fill="var(--o-red)" stroke="' + INK + '" stroke-width="3"/>' +
      // Rubor
      '<g class="o-blush" fill="var(--o-red)"><ellipse cx="55" cy="114" rx="9" ry="5"/><ellipse cx="105" cy="114" rx="9" ry="5"/></g>' +
      // Pintura facial
      '<g fill="var(--o-red)"><rect x="50" y="110" width="14" height="4" rx="2"/><rect x="96" y="110" width="14" height="4" rx="2"/></g>' +
      // Circuitos de jade
      '<g class="o-circuit" fill="none" stroke="var(--o-jade)" stroke-width="2" stroke-linecap="round">' +
        '<path d="M44 104 h6 v14 h10"/><path d="M116 104 h-6 v14 h-10"/>' +
      '</g>' +
      '<g fill="var(--o-jade)"><circle cx="60" cy="118" r="2"/><circle cx="100" cy="118" r="2"/></g>' +
      // Cejas
      '<g fill="none" stroke="' + INK + '" stroke-width="4.5" stroke-linecap="round">' +
        '<path class="o-brow b-l" d="M53 84 Q63 79 73 83"/>' +
        '<path class="o-brow b-r" d="M87 83 Q97 79 107 84"/>' +
      '</g>' +
      // Ojos abiertos
      '<g class="o-eyes-open">' +
        '<g class="o-eye"><ellipse cx="63" cy="97" rx="10" ry="7.5" fill="#fff" stroke="' + INK + '" stroke-width="3.5"/>' +
          '<g class="o-look"><g class="o-pupil"><circle cx="63" cy="97" r="4.2" fill="' + INK + '"/><circle class="o-glint" cx="64.6" cy="95.4" r="1.4" fill="var(--o-jade)"/></g></g></g>' +
        '<g class="o-eye"><ellipse cx="97" cy="97" rx="10" ry="7.5" fill="#fff" stroke="' + INK + '" stroke-width="3.5"/>' +
          '<g class="o-look"><g class="o-pupil"><circle cx="97" cy="97" r="4.2" fill="' + INK + '"/><circle class="o-glint" cx="98.6" cy="95.4" r="1.4" fill="var(--o-jade)"/></g></g></g>' +
      '</g>' +
      // Ojos felices (^ ^)
      '<g class="o-eyes-happy" fill="none" stroke="' + INK + '" stroke-width="4.5" stroke-linecap="round">' +
        '<path d="M54 100 Q63 89 72 100"/><path d="M88 100 Q97 89 106 100"/>' +
      '</g>' +
      // Bocas
      '<g class="o-mouths">' +
        '<rect class="m m-neutral" x="69" y="122" width="22" height="6" rx="3" fill="' + INK + '"/>' +
        '<path class="m m-smile" d="M67 120 Q80 134 93 120 Q80 127 67 120 Z" fill="' + INK + '" stroke="' + INK + '" stroke-width="2" stroke-linejoin="round"/>' +
        '<g class="m m-grin"><path d="M65 118 H95 Q94 138 80 138 Q66 138 65 118 Z" fill="' + INK + '"/>' +
          '<path d="M71 131 Q80 125 89 131 Q85 137 80 137 Q75 137 71 131 Z" fill="var(--o-red)"/>' +
          '<rect x="70" y="118" width="20" height="4" fill="#fff"/></g>' +
        '<ellipse class="m m-open" cx="80" cy="126" rx="6.5" ry="8.5" fill="' + INK + '"/>' +
        '<path class="m m-wavy" d="M67 126 q4.3 -5 8.6 0 t8.6 0 t8.6 0" fill="none" stroke="' + INK + '" stroke-width="4" stroke-linecap="round"/>' +
        '<path class="m m-smirk" d="M69 124 Q81 131 92 120" fill="none" stroke="' + INK + '" stroke-width="4.5" stroke-linecap="round"/>' +
        '<path class="m m-hmm" d="M72 126 H86" fill="none" stroke="' + INK + '" stroke-width="4.5" stroke-linecap="round"/>' +
        '<ellipse class="m m-talk" cx="80" cy="125" rx="8" ry="5" fill="' + INK + '"/>' +
      '</g>' +
      // Vírgula de la palabra
      '<path class="o-volute" d="M114 140 c14 6 30 0 30 -12 c0 -9 -11 -11 -14 -5 c-3 5 2 9 6 7" fill="none" stroke="var(--o-jade)" stroke-width="4" stroke-linecap="round"/>' +
    '</g>' +
    '</svg>';

  var HOSTS = ['avatar', 'brandAvatar', 'dlgAvatar'];
  var forcedMood = null, forcedUntil = 0, autoMood = 'idle', autoUntil = 0;

  function hosts() { return HOSTS.map(function (id) { return document.getElementById(id); }).filter(Boolean); }

  function mount(el) {
    if (!el || el.querySelector(':scope > svg.omox-svg')) return;
    el.insertAdjacentHTML('afterbegin', SVG);
    el.classList.add('omox-host');
    if (!el.hasAttribute('data-mood')) el.setAttribute('data-mood', 'idle');
  }

  /* ---------- Estados de voz / pensamiento ---------- */
  function voiceState() {
    var av = document.getElementById('avatar');
    var cls = av ? av.className : '';
    var st = (document.getElementById('status') || {}).textContent || '';
    var speaking = !!(window.speechSynthesis && window.speechSynthesis.speaking);
    if (speaking || /talk|speak|habl/i.test(cls) || /hablando|leyendo/i.test(st)) return 'talking';
    if (/think|pens|load/i.test(cls) || /pens|escrib|analiz|cargando|…|\.\.\./i.test(st)) return 'thinking';
    return 'idle';
  }

  /* ---------- Expresiones ---------- */
  function setAuto(mood, ms) { autoMood = mood; autoUntil = ms ? Date.now() + ms : 0; }

  function currentMood(voice) {
    var now = Date.now();
    if (forcedMood && (!forcedUntil || now < forcedUntil)) return forcedMood;
    forcedMood = null;
    if (voice === 'thinking') return 'thinking';
    if (autoUntil && now > autoUntil) { autoMood = autoMood === 'celebrate' ? 'happy' : 'idle'; autoUntil = autoMood === 'happy' ? now + 2500 : 0; }
    return autoMood;
  }

  function moodFromText(t) {
    t = (t || '').trim();
    if (/(excelente|perfecto|muy bien|bien hecho|correct[oa]|lo lograste|felicidades|exacto|genial|bravo)/i.test(t)) return ['celebrate', 2600];
    if (/(casi|revisa|fíjate|fijate|cuidado|intenta de nuevo|no exactamente|vuelve a)/i.test(t)) return ['encourage', 3500];
    if (/(no estoy segur|no tengo certeza|podría equivocarme|verifica|no entendí|no entiendo)/i.test(t)) return ['confused', 3000];
    if (/(wow|increíble|sorprend|¡oh|interesante)/i.test(t)) return ['surprised', 2200];
    if (/\?\s*$/.test(t)) return ['curious', 3500];
    return ['happy', 2200];
  }

  function watchChat() {
    var chat = document.getElementById('chat');
    if (!chat) return;
    new MutationObserver(function (muts) {
      var node = null;
      muts.forEach(function (m) { for (var i = m.addedNodes.length - 1; i >= 0; i--) if (m.addedNodes[i].nodeType === 1) node = m.addedNodes[i]; });
      if (!node || node.id === 'typing' || /\bsys\b/.test(node.className || '')) return;
      if (!node.classList || !node.classList.contains('msg')) return;
      var isUser = node.classList.contains('me');
      if (isUser) setAuto('listening', 6000);
      else { var r = moodFromText(node.textContent); setAuto(r[0], r[1]); }
    }).observe(chat, { childList: true });

    var input = document.getElementById('input');
    if (input) input.addEventListener('input', function () { if (autoMood === 'idle') setAuto('listening', 2500); });
  }

  /* ---------- Mirada que sigue el cursor ---------- */
  var lookX = 0, lookY = 0;
  function watchCursor() {
    window.addEventListener('pointermove', function (e) {
      var av = document.getElementById('avatar');
      if (!av) return;
      var r = av.getBoundingClientRect();
      var dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height * 0.6);
      var d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 300);
      lookX = (dx / d) * 3 * k; lookY = (dy / d) * 2.2 * k;
    }, { passive: true });
  }

  /* ---------- Microexpresiones en reposo ---------- */
  var nextIdle = Date.now() + 5000;
  function idleLife() {
    if (Date.now() < nextIdle || autoMood !== 'idle' || forcedMood) return;
    nextIdle = Date.now() + 6000 + Math.random() * 6000;
    var pick = Math.random();
    if (pick < .4) setAuto('happy', 1400);
    else if (pick < .7) setAuto('curious', 1600);
    else { lookX = (Math.random() * 2 - 1) * 3; lookY = (Math.random() * 2 - 1) * 1.5; }
  }

  function tick() {
    var voice = voiceState();
    idleLife();
    var mood = currentMood(voice);
    hosts().forEach(function (el) {
      if (el.getAttribute('data-mood') !== mood) el.setAttribute('data-mood', mood);
      if (el.getAttribute('data-omox') !== voice) el.setAttribute('data-omox', voice);
      el.style.setProperty('--look-x', lookX.toFixed(2) + 'px');
      el.style.setProperty('--look-y', lookY.toFixed(2) + 'px');
    });
  }

  function init() {
    hosts().forEach(function (el) {
      mount(el);
      new MutationObserver(function () { mount(el); }).observe(el, { childList: true });
    });
    watchChat();
    watchCursor();
    setInterval(tick, 120);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.OmoxAvatar = {
    svg: SVG,
    mount: mount,
    moods: ['idle', 'happy', 'celebrate', 'surprised', 'thinking', 'curious', 'encourage', 'confused', 'listening'],
    setMood: function (mood, ms) { forcedMood = mood || null; forcedUntil = ms ? Date.now() + ms : 0; if (!mood) setAuto('idle'); tick(); },
    react: function (text) { var r = moodFromText(text); setAuto(r[0], r[1]); },
    // Volumen de la voz (0 a 1) para mover la boca en sincronía; null lo desactiva.
    setLevel: function (v) {
      hosts().forEach(function (el) {
        if (v == null) { el.removeAttribute('data-lipsync'); el.style.removeProperty('--mouth'); }
        else { el.setAttribute('data-lipsync', ''); el.style.setProperty('--mouth', Math.max(0, Math.min(1, v)).toFixed(3)); }
      });
    }
  };
})();
