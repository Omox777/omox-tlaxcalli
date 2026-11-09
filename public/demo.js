// MODO DEMOSTRACIÓN (sin IA en vivo).
// Se activa únicamente cuando el servidor no tiene API key. La interfaz lo avisa con la etiqueta
// "Modo demostración". Sirve para probar el flujo; la IA real (Gemini) responde cuando hay clave.
(function () {
  const T = {
    pitagoras: {
      re: /pit[aá]goras|hipotenusa|cateto|tri[aá]ngulo rect/i,
      name: 'Teorema de Pitágoras',
      problem: 'Un triángulo rectángulo tiene catetos de 3 y 4. ¿Cuánto mide la hipotenusa?',
      answer: /\b5\b|cinco/i,
      keywords: [['cateto', 'catetos'], ['hipotenusa'], ['cuadrado', 'al cuadrado', '²'], ['rectángulo', 'rectangulo', '90'], ['suma']],
      miss: ['catetos', 'hipotenusa', 'a²+b²=c²', 'ángulo recto', 'suma de cuadrados'],
      ladder: [
        '¡Va! Trabajemos con esto: **un triángulo rectángulo con catetos de 3 y 4**. Antes de empezar: ¿qué es un cateto y qué es la hipotenusa? Cuéntame con tus palabras.',
        '¿Qué lado es el más largo en un triángulo rectángulo y qué relación crees que tiene con los otros dos?',
        '**Pista:** en todo triángulo rectángulo, el cuadrado de la hipotenusa es igual a la suma de los cuadrados de los catetos. ¿Cómo escribirías eso con letras?',
        '**Ejemplo parecido:** con catetos 6 y 8: 6² + 8² = 36 + 64 = 100, y la hipotenusa es √100 = 10. Ahora hazlo tú con tus catetos 3 y 4.',
        '**Método:** 1) eleva cada cateto al cuadrado, 2) súmalos, 3) saca la raíz cuadrada. Ya viste el ejemplo con 6 y 8; el cálculo final con 3 y 4 te toca a ti. ¿Cuánto te da?',
      ],
      diagram: { title: 'Pasos para hallar la hipotenusa', steps: [
        { label: 'Identifica', detail: 'Reconoce los dos catetos (los lados que forman el ángulo recto).' },
        { label: 'Eleva al cuadrado', detail: 'Multiplica cada cateto por sí mismo.' },
        { label: 'Suma', detail: 'Suma los dos resultados.' },
        { label: 'Raíz cuadrada', detail: 'La raíz de esa suma es la hipotenusa.' } ] },
      celebrate: '¡Eso es! **5** es correcto. Ahora lo importante: ¿por qué funciona? Explícame con tus palabras por qué se suman los cuadrados.',
    },
    newton: {
      re: /newton|fuerza|aceleraci[oó]n|masa|f\s*=\s*m/i,
      name: 'Segunda ley de Newton',
      problem: 'Se aplica una fuerza de 10 N a un objeto de 2 kg. ¿Qué aceleración adquiere?',
      answer: /\b5\b|cinco/i,
      keywords: [['fuerza'], ['masa'], ['aceleración', 'aceleracion'], ['proporcional', 'directamente', 'inversamente'], ['f=ma', 'f = m', 'newton']],
      miss: ['fuerza', 'masa', 'aceleración', 'proporcionalidad', 'F = m·a'],
      ladder: [
        '¡Vamos! Piensa en **empujar un carrito vacío y uno lleno**. ¿Cuál se acelera más con el mismo empujón y por qué?',
        'Si el empujón (fuerza) aumenta, ¿qué le pasa a la aceleración? ¿Y si aumenta la masa?',
        '**Pista:** la segunda ley relaciona tres cosas: fuerza, masa y aceleración. La aceleración es la fuerza dividida entre la masa. ¿Cómo lo escribirías?',
        '**Ejemplo parecido:** una fuerza de 12 N sobre 3 kg → a = 12 ÷ 3 = 4 m/s². Ahora aplícalo a **10 N y 2 kg**.',
        '**Método:** 1) anota F y m con unidades, 2) despeja a = F / m, 3) sustituye y calcula. Ya viste el ejemplo con 12 N y 3 kg; el cálculo con tus datos te toca. ¿Cuánto da?',
      ],
      diagram: { title: 'De la fuerza a la aceleración', steps: [
        { label: 'Datos', detail: 'Escribe la fuerza (N) y la masa (kg).' },
        { label: 'Fórmula', detail: 'F = m · a, así que a = F / m.' },
        { label: 'Sustituye', detail: 'Pon tus números en la fórmula.' },
        { label: 'Resultado', detail: 'Escribe la aceleración con sus unidades (m/s²).' } ] },
      celebrate: '¡Correcto, **5 m/s²**! Ahora explícame: si la masa se duplicara con la misma fuerza, ¿qué pasaría con la aceleración?',
    },
  };

  function findTopic(text, cur) {
    for (const k in T) if (T[k].re.test(text)) return k;
    return cur || null;
  }
  const norm = (s) => String(s || '').toLowerCase();

  function respond(state, text, mode) {
    const d = state.demoState || (state.demoState = { topic: null, level: -1 });
    const t = norm(text);
    const out = {
      reply: '', hint_level: 0, understanding: state.understanding || 0, style_signal: 'neutral',
      confidence: 'alta', verify_note: '', homework_detected: false, topic: '',
      diagram: { title: '', steps: [] }, practice: '', quick_replies: [], missing_concepts: [],
    };
    if (/\bvisual|esquema/.test(t)) out.style_signal = 'visual';
    else if (/escuch|audio/.test(t)) out.style_signal = 'auditivo';
    else if (/practic|actividad|ejercicio/.test(t)) out.style_signal = 'kinestesico';

    const key = findTopic(t, d.topic);

    if (mode === 'teach') {
      const tp = T[key];
      if (!tp) {
        out.reply = 'Me encantaría aprender de ti. En esta demostración puedo escuchar sobre **el teorema de Pitágoras** o **la segunda ley de Newton**. ¿Cuál me explicas?';
        out.quick_replies = ['Te explico Pitágoras', 'Te explico Newton'];
        return out;
      }
      d.topic = key;
      const hit = tp.keywords.map((alts) => alts.some((a) => t.includes(a)));
      const cov = hit.filter(Boolean).length;
      const score = Math.min(100, Math.round((cov / tp.keywords.length) * 100));
      out.topic = tp.name;
      out.understanding = Math.max(state.understanding || 0, score);
      out.missing_concepts = tp.miss.filter((_, i) => !hit[i]).slice(0, 4);
      out.hint_level = 0;
      out.reply = cov >= 4
        ? '¡Wow, ahora sí entendí! Me quedó clarísimo. Última duda: ¿podrías ponerme un ejemplo con números?'
        : 'Mmm, voy entendiendo, pero me quedé con dudas. ¿Me puedes explicar con más detalle las ideas que te marqué abajo? Así se las puedo enseñar a otro compañero.';
      out.quick_replies = ['Déjame agregar algo', 'Te doy un ejemplo'];
      out.verify_note = 'Modo demostración: la evaluación usa palabras clave. Con la IA en vivo, Omox evalúa el significado de tu explicación.';
      out.confidence = 'media';
      return out;
    }

    // Modo aprender
    if (!key) {
      out.reply = 'Para esta demostración puedo ayudarte con **el teorema de Pitágoras** o **la segunda ley de Newton**. ¿Con cuál quieres empezar? (Con la IA en vivo, Omox responde sobre cualquier tema de prepa.)';
      out.quick_replies = ['Pitágoras', 'Segunda ley de Newton'];
      out.topic = 'Demostración';
      return out;
    }
    const tp = T[key];
    out.topic = tp.name;
    if (d.topic !== key) { d.topic = key; d.level = 0; }
    else if (tp.answer.test(t) && d.level >= 0 && /\d|cinco/.test(t) && t.length < 60) {
      out.reply = tp.celebrate;
      out.hint_level = Math.max(0, d.level);
      out.understanding = Math.min(100, (state.understanding || 20) + 35);
      out.quick_replies = ['Es porque…', 'Dame otro reto'];
      return out;
    } else if (/no entiendo|no s[eé]|ayuda|pista|otra|no puedo|me trabo|sigo sin/.test(t)) {
      d.level = Math.min(4, d.level + 1);
    } else if (/dame la respuesta|resultado|solu[cs]i[oó]n/.test(t)) {
      out.reply = 'Entiendo las ganas de terminar rápido 😊, pero si te doy el resultado no aprendes el método. Te propongo la **siguiente pista**:\n\n' + tp.ladder[Math.min(4, d.level + 1)];
      d.level = Math.min(4, d.level + 1);
      out.hint_level = d.level;
      return out;
    } else if (d.level < 4) {
      d.level += 1;
    }
    out.hint_level = d.level;
    out.reply = tp.ladder[d.level];
    if (/(^|\s)\d+[\)\.]\s.*(^|\s)\d+[\)\.]\s|resuelve (todo|todos)/i.test(text)) {
      out.homework_detected = true;
      d.level = 0; out.hint_level = 0;
      out.reply = 'Veo varios ejercicios juntos. **No los resolveré por ti**, pero vamos uno por uno. Empecemos con el primero.\n\n' + tp.ladder[0];
      out.quick_replies = ['Los catetos son…', 'No sé qué es un cateto'];
      return out;
    }
    if (d.level === 0) out.reply ='Problema de práctica: **' + tp.problem + '**\n\n' + out.reply;
    if (d.level >= 2 || out.style_signal === 'visual') out.diagram = tp.diagram;
    if (out.style_signal === 'kinestesico') out.practice = 'Dibuja el problema en tu cuaderno y marca los datos con colores. ¿Qué datos tienes?';
    out.understanding = Math.min(100, (state.understanding || 5) + 8);
    out.quick_replies = ['No entiendo', 'Dame otra pista', 'Ya lo tengo'];
    return out;
  }

  window.OmoxDemo = { respond };
})();
