# Arquitectura — Music Trivia Game

> 🇬🇧 [English version](ARCHITECTURE.md)

Una webapp de trivia musical optimizada para móviles donde los jugadores identifican canciones por sus previews de 30 segundos. Construida con React + TypeScript + Vite en el frontend y un proxy Node.js/Express en el backend.

---

## Tabla de contenidos

1. [Estructura del proyecto](#estructura-del-proyecto)
2. [Stack tecnológico](#stack-tecnológico)
3. [Flujo del juego](#flujo-del-juego)
4. [Visión general de la arquitectura](#visión-general-de-la-arquitectura)
5. [Proxy backend](#proxy-backend)
6. [Sistema de audio](#sistema-de-audio)
7. [Sistema de puntuación](#sistema-de-puntuación)
8. [Gestión de estado](#gestión-de-estado)
9. [Internacionalización](#internacionalización)
10. [Temas visuales](#temas-visuales)
11. [Tabla de puntuaciones](#tabla-de-puntuaciones)
12. [Desarrollo local](#desarrollo-local)
13. [Despliegue](#despliegue)
14. [Variables de entorno](#variables-de-entorno)

---

## Estructura del proyecto

```
/
├── server/                  # Proxy backend Node.js/Express
│   ├── server.ts            # Todos los endpoints del proxy e integración con la API de Deezer
│   ├── package.json
│   └── tsconfig.json
│
├── src/
│   ├── api/
│   │   └── apiClient.ts     # Cliente HTTP — llama al proxy backend
│   │
│   ├── audio/
│   │   ├── audioPlayer.ts   # Reproducción de audio (Web Audio API + fallback HTMLAudioElement)
│   │   └── soundFX.ts       # Efectos de sonido programáticos (Web Audio API)
│   │
│   ├── components/
│   │   ├── ConfirmDialog/   # Modal de confirmación reutilizable
│   │   ├── GameScreen/      # UI de pregunta activa (barra de tiempo, puntuación, opciones)
│   │   ├── LeaderboardView/ # Overlay de top-10 puntuaciones
│   │   ├── PlaylistSelector/# Cuadrícula de playlists predefinidas
│   │   ├── PreloadScreen/   # Pantalla de progreso de descarga de audio e imágenes
│   │   ├── QuestionCard/    # Cuatro botones de respuesta con portadas de álbum
│   │   ├── ResultsScreen/   # Resumen final con samples reproducibles
│   │   ├── ScoreCounter/    # Indicador animado de puntuación y racha
│   │   ├── SearchBar/       # Búsqueda de artistas con debounce
│   │   ├── SettingsMenu/    # Panel de tema, idioma y reinicio de puntuaciones
│   │   ├── SourceSelection/ # Pantalla principal (búsqueda + playlists predefinidas)
│   │   ├── ThemeToggle/     # Botón de modo claro/oscuro
│   │   └── TimerBar/        # Barra de cuenta regresiva a ancho completo (verde → rojo)
│   │
│   ├── engine/
│   │   ├── gameEngine.ts    # Lógica central del juego (construir preguntas, registrar respuestas)
│   │   ├── leaderboard.ts   # CRUD del leaderboard en localStorage
│   │   ├── randomizer.ts    # Barajado Fisher-Yates de tracks y opciones
│   │   └── scoreCalculator.ts # Fórmulas de puntos y bonus de racha
│   │
│   ├── hooks/
│   │   ├── useGameSession.ts # Máquina de estados del juego (transiciones de fase)
│   │   ├── useLanguage.ts    # Preferencia de idioma ES/EN
│   │   ├── useTheme.ts       # Preferencia de tema claro/oscuro
│   │   └── useTimer.ts       # Temporizador de cuenta regresiva con requestAnimationFrame
│   │
│   ├── i18n/
│   │   └── translations.ts  # Todos los textos de la UI en español e inglés
│   │
│   ├── styles/
│   │   └── globals.css      # Propiedades CSS personalizadas para ambos temas
│   │
│   ├── types/
│   │   └── index.ts         # Todas las interfaces y tipos TypeScript compartidos
│   │
│   └── utils/
│       └── validators.ts    # Funciones puras para filtrar y validar tracks
│
├── .env.example             # Plantilla de variables de entorno requeridas
├── ARCHITECTURE.md          # Guía de arquitectura (inglés)
├── ARCHITECTURE.es.md       # Este archivo
└── README.md                # Guía de configuración y despliegue
```

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework frontend | React 18 + TypeScript |
| Herramienta de build | Vite |
| Gestor de paquetes | pnpm |
| Estilos | CSS Modules + propiedades CSS personalizadas |
| Audio | Web Audio API (`AudioContext`) + fallback `HTMLAudioElement` |
| Proxy backend | Node.js + Express + TypeScript |
| Datos musicales | API de Deezer (pública, sin autenticación requerida) |
| Testing | Vitest + fast-check (property-based) + Testing Library |
| Despliegue (frontend) | GitHub Pages |
| Despliegue (backend) | Render.com |

---

## Flujo del juego

```
┌─────────────────────┐
│  selección de fuente│  El jugador busca un artista o elige una playlist predefinida
└────────┬────────────┘
         │ confirmar selección
         ▼
┌─────────────────────┐
│     precarga        │  Obtener tracks → seleccionar 7 → construir preguntas →
│                     │  descargar blobs de audio + precargar imágenes de álbum
└────────┬────────────┘
         │ tap "¡Jugar!"  (también desbloquea AudioContext en iOS)
         ▼
┌─────────────────────┐
│  pregunta activa    │  Reproducir preview de audio, iniciar temporizador de 10s
└────────┬────────────┘
         │ el jugador toca una opción (o el temporizador expira)
         ▼
┌─────────────────────┐
│ retroalimentación   │  Mostrar resaltado correcto/incorrecto, reproducir efecto de sonido,
│                     │  avanzar automáticamente tras 2s (o tap "Siguiente →")
└────────┬────────────┘
         │ repetir para las 7 preguntas
         ▼
┌─────────────────────┐
│     resultados      │  Mostrar puntuación, desglose por canción, guardar en leaderboard
└─────────────────────┘
         │ "Jugar de nuevo" o "Volver al inicio"
         ▼
   selección de fuente
```

El tipo unión `GamePhase` y todas las transiciones son gestionadas por el hook `useGameSession`.

---

## Visión general de la arquitectura

```
Navegador                        Servidor Proxy              API de Deezer
─────────────────────────────    ──────────────────────      ──────────────
App React (GitHub Pages)
  │
  ├── apiClient.ts  ──────────►  /api/search              ──► /search/artist
  │                             /api/artist-tracks         ──► /artist/{id}/top
  │                             /api/playlist-tracks       ──► /playlist/{id}/tracks
  │                             /api/playlist-image        ──► /playlist/{id}
  │
  ├── audioPlayer.ts            (descarga previews MP3 directamente del CDN de Deezer)
  │
  └── leaderboard.ts            (lee/escribe en localStorage — no requiere servidor)
```

**¿Por qué un proxy?**
La API de Deezer no soporta CORS para peticiones del navegador desde orígenes arbitrarios. El servidor proxy gestiona todas las llamadas a la API de Deezer del lado del servidor y devuelve JSON sanitizado y específico de la app al frontend.

---

## Proxy backend

**Archivo:** `server/server.ts`

### Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/search?q=&limit=8` | Buscar artistas por nombre |
| GET | `/api/artist-tracks?artistId=` | Top 100 tracks de un artista |
| GET | `/api/playlist-tracks?playlistId=` | Tracks de una playlist |
| GET | `/api/playlist-image?playlistId=` | Solo la URL de la imagen de portada de la playlist |

### Mapeo de datos

Todas las respuestas de Deezer se mapean al tipo interno `Track` de la app:

```typescript
interface Track {
  id: string;
  name: string;
  previewUrl: string | null;  // URL del MP3 de 30 segundos
  artistName: string;
  albumImageUrl: string;      // portada del álbum (tamaño mediano)
}
```

Los tracks sin URL de `preview` son filtrados antes de devolverse al cliente.

### Política CORS

El proxy permite peticiones desde:
- `localhost` (cualquier puerto) — desarrollo local
- Cualquier IP de red local (`192.168.x.x`, `10.x.x.x`, `172.16-31.x.x`) — pruebas en móvil
- `*.github.io` — despliegues en GitHub Pages
- Variable de entorno `ALLOWED_ORIGIN` — dominio de producción personalizado

---

## Sistema de audio

**Archivo:** `src/audio/audioPlayer.ts`

### Diseño de dos backends

```
play(blob)
    │
    ├── ¿AudioContext disponible?
    │       │
    │       ├── SÍ → FileReader → decodeAudioData → AudioBufferSourceNode.start()
    │       │
    │       └── NO  → URL.createObjectURL → new Audio() → .play()
    │
    └── (el fallback también se usa si decodeAudioData falla)
```

### Desbloqueo en iOS Safari

iOS Safari bloquea la reproducción de audio a menos que se inicie sincrónicamente desde un gesto del usuario. La solución:

1. `unlockAudio()` se llama directamente dentro del handler `onClick` del botón "¡Jugar!" en `PreloadScreen`.
2. Esto llama a `AudioContext.resume()` sincrónicamente, desbloqueando el contexto para toda la sesión.
3. Todas las llamadas posteriores a `play()` (desde `useEffect`, `setTimeout`, etc.) funcionan sin restricciones.

### Patrón de token de cancelación

`play()` es asíncrono (FileReader + decodeAudioData). Si se llama a `pause()` o `stop()` mientras la decodificación está en curso, el audio no debe iniciarse cuando la decodificación termine.

Solución: un entero `playToken` a nivel de módulo se incrementa en cada `stop()` y `pause()`. Cada llamada a `play()` captura el token al inicio y lo verifica antes de iniciar la reproducción.

```
play()  →  token = ++playToken (= 5)
           FileReader inicia...
pause() →  playToken++ (= 6)
           FileReader termina → token (5) ≠ playToken (6) → ABORTAR ✓
```

### Precarga

Antes de que comience el juego, `preloadAudio()`:
1. Descarga los 7 previews de audio como objetos `Blob` (almacenados en `question.audioBlob`).
2. Reintenta cada descarga una vez en caso de fallo.
3. Precarga todas las URLs únicas de imágenes de álbum en la caché HTTP del navegador usando `new Image()`.

Esto garantiza cero latencia de red durante el juego.

---

## Sistema de puntuación

**Archivo:** `src/engine/scoreCalculator.ts`

### Puntos base

```
puntosBase = max(0, 150 - floor(tiempoMs / 1000) × 10)
```

| Tiempo | Puntos |
|---|---|
| 0–999 ms | 150 |
| 1000–1999 ms | 140 |
| 5000–5999 ms | 100 |
| 9000–9999 ms | 60 |
| ≥ 15000 ms | 0 |

### Bonus de racha

Se añade un bonus cuando el jugador responde correctamente 2 o más veces seguidas:

```
bonusRacha = racha >= 2 ? floor(racha × 0.1 × puntosBase) : 0
```

La racha se reinicia a 0 en cualquier respuesta incorrecta o tiempo agotado.

### Puntuación máxima

- 7 preguntas × 150 puntos base = **1050 puntos base**
- Con racha de 7 preguntas y respuestas instantáneas: hasta **~1785 puntos**

---

## Gestión de estado

**Archivo:** `src/hooks/useGameSession.ts`

Todo el estado del juego vive en un único hook React usando `useState` con un objeto de estado plano. No hay librería de estado externa (Redux, Zustand, etc.).

### ¿Por qué un único objeto de estado?

Múltiples llamadas a `useState` causarían renders intermedios donde algunos valores están actualizados pero otros no. Por ejemplo, avanzar a la siguiente pregunta requiere actualizar tanto `currentQuestionIndex` como `phase` de forma atómica.

### Forma del estado

```typescript
interface GameSessionState {
  phase: GamePhase;
  selectedSource: TriviaSource | null;
  questions: Question[];
  currentQuestionIndex: number;
  results: QuestionResult[];
  totalScore: number;
  streak: number;
}
```

### Diseño clave: `submitAnswer` usa setState funcional

```typescript
const submitAnswer = useCallback((selectedIndex, timeMs) => {
  setState((prev) => {
    // Usa prev (estado más reciente) — nunca obsoleto
    const { result, newStreak, newTotalScore } = recordAnswer(...);
    return { ...prev, results: [...prev.results, result], ... };
  });
}, []);
```

Esto evita bugs de closure obsoleto que ocurrirían si `state` se capturara directamente en el callback.

---

## Internacionalización

**Archivo:** `src/i18n/translations.ts`

Todos los textos de la UI están definidos en un único objeto `translations` con claves `es` y `en`. El hook `useLanguage` provee el objeto de traducción actual (`t`) a todos los componentes.

```typescript
const { t } = useLanguage();
// t.playAgain → "Jugar de nuevo" (es) o "Play again" (en)
```

**Lo que NO se traduce:**
- Nombres de artistas
- Títulos de canciones
- Nombres de playlists

Estos siempre se muestran tal como vienen de la API de Deezer.

La preferencia de idioma se persiste en localStorage y se detecta automáticamente desde `navigator.language` en la primera visita.

---

## Temas visuales

**Archivos:** `src/styles/globals.css`, `src/hooks/useTheme.ts`

El sistema de temas usa propiedades CSS personalizadas (variables) activadas por una clase `dark` en `<html>`:

```css
:root {
  --color-bg: #f5f5f5;
  --color-surface: #ffffff;
  --color-primary: #1db954;
  /* ... */
}

html.dark {
  --color-bg: #121212;
  --color-surface: #1e1e1e;
  /* ... */
}
```

`useTheme` añade/elimina la clase `dark` en `document.documentElement` y persiste la preferencia en localStorage. El tema inicial se determina desde localStorage o `prefers-color-scheme`.

---

## Tabla de puntuaciones

**Archivo:** `src/engine/leaderboard.ts`

La tabla de puntuaciones se almacena completamente en `localStorage` — no requiere servidor.

- **Clave:** `music-trivia-leaderboard`
- **Formato:** Array JSON de hasta 10 objetos `LeaderboardEntry`
- **Ordenamiento:** Puntuación descendente; empates resueltos por tiempo total ascendente

```typescript
interface LeaderboardEntry {
  id: string;
  sourceName: string;
  sourceType: 'artist' | 'playlist';
  sourceImageUrl: string;   // foto del artista o emoji de la playlist
  totalScore: number;
  correctAnswers: number;   // de 7
  totalTimeMs: number;
  playedAt: number;         // timestamp Unix
}
```

Todas las funciones del leaderboard fallan silenciosamente si localStorage no está disponible (ej. modo de navegación privada).

---

## Desarrollo local

### Requisitos previos

- Node.js 18+
- pnpm (`npm install -g pnpm`)

### Configuración

```bash
# 1. Instalar dependencias del frontend
pnpm install

# En la primera instalación, pnpm bloquea los scripts de build por seguridad.
# Aprueba los dos paquetes requeridos cuando se solicite:
pnpm approve-builds
# → aprobar: esbuild, msw
# Luego vuelve a ejecutar:
pnpm install

# 2. Instalar dependencias del backend
cd server && pnpm install && cd ..

# 3. Crear archivo de entorno
cp .env.example .env
# Editar .env — establecer VITE_API_BASE_URL=http://localhost:3001
```

### Ejecución

```bash
# Terminal 1 — proxy backend
pnpm run server

# Terminal 2 — servidor de desarrollo frontend
pnpm run dev

# Para exponer en red local (pruebas en móvil):
pnpm run dev -- --host
# Luego establecer VITE_API_BASE_URL=http://<tu-ip-local>:3001 en .env
```

### Testing

```bash
pnpm test            # ejecución única
pnpm run test:watch  # modo watch
```

---

## Despliegue

### Frontend → GitHub Pages

Un workflow de GitHub Actions (`.github/workflows/deploy.yml`) construye y despliega automáticamente el frontend en cada push a `main`.

Secrets requeridos en el repositorio de GitHub:
- `VITE_API_BASE_URL` — URL del backend en Render.com (ej. `https://tu-app.onrender.com`)
- `VITE_BASE_URL` — Prefijo de ruta del repositorio (ej. `/MusicTriviaGame/`)

### Backend → Render.com

El archivo `render.yaml` configura el servicio backend. Conecta el repositorio de GitHub en el dashboard de Render y establece la variable de entorno:
- `ALLOWED_ORIGIN` — Tu URL de GitHub Pages (ej. `https://usuario.github.io`)

El backend se despliega automáticamente en cada push a `main`.

---

## Variables de entorno

| Variable | Dónde | Descripción |
|---|---|---|
| `VITE_API_BASE_URL` | `.env` del frontend | URL del proxy backend |
| `VITE_BASE_URL` | Secret de GitHub Actions | Prefijo de ruta para GitHub Pages (ej. `/NombreRepo/`) |
| `PORT` | `.env` del backend | Puerto del servidor Express (por defecto: 3001) |
| `ALLOWED_ORIGIN` | Dashboard de Render | Origen CORS permitido en producción |
