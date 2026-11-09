# Omox Tlaxcalli

Asistente virtual con IA (Gemini) que enseña con pistas, se adapta al estudiante y no hace la tarea por él.
Proyecto para innovatiQ Digital Cup 2027 · Categoría Advanced · Reto AI Fusion.

## Estructura

| Archivo | Qué hace |
|---|---|
| `public/` | Interfaz (HTML, CSS, JS). Incluye el avatar Omox en SVG original. |
| `api/chat.js` | Proxy seguro: guarda la API key en el servidor y llama a Gemini. |
| `api/prompt.js` | **Prompt del sistema y esquema JSON.** Es la "configuración de la IA" que se entrega en PDF. |
| `public/demo.js` | Modo demostración, solo si no hay API key. Se muestra etiquetado. |
| `server.js` | Servidor local para probar. |
| `test/handler.test.js` | Pruebas del proxy (`npm test`). |
| `docs/` | Sinopsis, configuración de IA y lista de entrega. |

## Probar en tu computadora

```bash
node server.js
```

Abre http://localhost:3000. Sin clave verás el **Modo demostración** (Pitágoras y Newton).

## Paso 1 · Crear la API key de Gemini (gratis)

1. Entra a https://aistudio.google.com con una cuenta de Google de un integrante mayor de edad o del docente responsable.
2. Presiona **Get API key** → **Create API key**.
3. Copia la clave. **No la compartas ni la subas a GitHub ni la pegues en el chat.**
4. Para probar local: copia `.env.example` como `.env` y pega la clave en `GEMINI_API_KEY=`.

## Paso 2 · Publicar el enlace con Vercel (gratis)

1. Crea una cuenta en https://github.com y sube esta carpeta `omox-app` a un repositorio nuevo. El archivo `.gitignore` evita subir `.env`.
2. Crea una cuenta en https://vercel.com e inicia sesión con GitHub.
3. **Add New → Project**, elige el repositorio y presiona **Deploy**.
4. En **Settings → Environment Variables** agrega:
   - `GEMINI_API_KEY` = tu clave
   - `GEMINI_MODEL` = `gemini-2.5-flash` (opcional)
5. En **Deployments → Redeploy** para que tome la clave.
6. Abre el enlace que te da Vercel (`https://tu-proyecto.vercel.app`). El letrero debe decir **"IA: Gemini en vivo"**.

## Antes de entregar (13 de noviembre, 23:59)

Revisa `docs/checklist_entrega.md`.
