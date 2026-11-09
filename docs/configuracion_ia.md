# Configuración usada en la IA · Omox Tlaxcalli

| Parámetro | Valor |
|---|---|
| Proveedor | Google · Gemini API (`generateContent`) |
| Modelo | `gemini-2.5-flash` (configurable con `GEMINI_MODEL`) |
| Temperatura | 0.6 (respuestas variadas pero consistentes) |
| Tokens máximos de salida | 4096 (incluye los tokens de razonamiento del modelo) |
| Formato de salida | JSON validado con `responseSchema` |
| Filtros de seguridad | Acoso, odio, contenido sexual y peligroso: bloquear nivel medio y superior |
| Historial enviado | Últimos 14 mensajes, máx. 1500 caracteres c/u |
| Datos del usuario | Solo edad y nivel de estudios |
| Almacenamiento | Ninguno (no se guardan conversaciones) |
| Límite de uso | 20 mensajes por minuto por IP |
| Clave API | Variable de entorno en el servidor; nunca en el navegador |

## Campos que devuelve la IA en cada turno
`reply`, `hint_level` (0-4), `understanding` (0-100), `style_signal`, `confidence`, `verify_note`,
`homework_detected`, `topic`, `diagram`, `practice`, `quick_replies`, `missing_concepts`.

## Prompt del sistema
Está en `api/prompt.js` (constante `SYSTEM_PROMPT`). Reglas principales:
1. Escalera de pistas de 5 niveles; nunca entrega el resultado final del ejercicio.
2. Modo "Enséñale a Omox": la IA actúa como compañero curioso y evalúa la explicación.
3. Adaptación al estilo visual, auditivo o kinestésico.
4. Honestidad: indica confianza, no inventa fuentes y pide verificar.
5. Privacidad y seguridad: no pide datos personales; canaliza situaciones de angustia a un adulto y a la Línea de la Vida (800 911 2000).

## Dónde interviene la IA y dónde las reglas
| Componente | Tipo |
|---|---|
| Explicar, preguntar, generar esquemas y retos | IA generativa (LLM) |
| Evaluar comprensión, detectar tarea pegada, estilo | IA discriminativa dentro del mismo modelo, más heurística local |
| Límites, validación de salida, privacidad | Reglas de código |
