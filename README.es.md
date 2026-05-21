# 🎵 Music Trivia Game

> 🇬🇧 [English version](README.md)

Una webapp de trivia musical optimizada para móviles. Escucha previews de canciones e intenta adivinar el título antes de que se acabe el tiempo. Construida con React + TypeScript e impulsada por la API de Deezer.

## Características

- 🔍 Busca cualquier artista o elige entre playlists curadas
- 🎧 Previews de 30 segundos precargados antes de iniciar la partida
- ⏱️ Temporizador de 10 segundos por pregunta con retroalimentación visual
- 🔥 Sistema de racha — encadena respuestas correctas para ganar puntos extra
- 🏆 Tabla de puntuaciones local (top 10, persistida en el dispositivo)
- 🌙 Modo oscuro con detección de preferencia del sistema
- 📱 Optimizada para móviles (320–430px)

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Proxy backend | Node.js + Express |
| Datos musicales | Deezer Public API |
| Gestor de paquetes | pnpm |
| Testing | Vitest + fast-check (property-based) |
| Despliegue | GitHub Pages (frontend) + Render (backend) |

## Desarrollo local

### Requisitos previos

- Node.js 18+
- pnpm (`npm install -g pnpm`)

### Configuración

1. Clona el repositorio:
   ```bash
   git clone https://github.com/mbobadilla2/MusicTriviaGame.git
   cd MusicTriviaGame
   ```

2. Instala las dependencias del frontend:
   ```bash
   pnpm install
   ```

   > **Nota:** En la primera instalación, pnpm pedirá que apruebes los scripts de build de dos dependencias que compilan binarios nativos. Ejecuta el siguiente comando y aprueba tanto `esbuild` como `msw` cuando se te solicite:
   > ```bash
   > pnpm approve-builds
   > ```
   > Luego vuelve a ejecutar `pnpm install`.

3. Instala las dependencias del backend:
   ```bash
   cd server && pnpm install && cd ..
   ```

4. Crea tu archivo `.env`:
   ```bash
   cp .env.example .env
   ```
   Los valores por defecto funcionan para desarrollo local — no se necesitan API keys.

### Ejecución

Abre dos terminales:

```bash
# Terminal 1 — proxy backend
pnpm run server

# Terminal 2 — frontend
pnpm run dev
```

Abre `http://localhost:5173` en tu navegador.

Para probar en dispositivos móviles en la misma red:

```bash
pnpm run dev -- --host
```

Luego actualiza `VITE_API_BASE_URL` en `.env` con tu IP local (ej. `http://192.168.x.x:3001`).

### Tests

```bash
pnpm test
```

### Documentación

Genera la documentación de la API localmente:

```bash
pnpm run docs:local
open docs/index.html
```

La documentación publicada está disponible en:
- **Referencia de API** (TypeDoc): `https://mbobadilla2.github.io/MusicTriviaGame/docs/`
- **Guía de arquitectura**: [`ARCHITECTURE.md`](ARCHITECTURE.md)

## Despliegue

### Backend → Render

1. Conecta tu repositorio de GitHub en [render.com](https://render.com)
2. Render detectará el archivo `render.yaml` automáticamente
3. Configura la variable de entorno `ALLOWED_ORIGIN` con la URL de tu GitHub Pages

### Frontend → GitHub Pages

Configura estos secrets en tu repositorio de GitHub (Settings → Secrets → Actions):

| Secret | Valor |
|---|---|
| `VITE_API_BASE_URL` | URL de tu servicio en Render (ej. `https://music-trivia-proxy.onrender.com`) |
| `VITE_BASE_URL` | `/nombre-de-tu-repo/` |

Haz push a `main` — el workflow de GitHub Actions despliega automáticamente.

## Estructura del proyecto

```
├── src/
│   ├── api/          # Cliente del proxy de Deezer
│   ├── audio/        # Reproductor de audio + efectos de sonido
│   ├── components/   # Componentes React de la UI
│   ├── engine/       # Lógica del juego (puntuación, randomizer, leaderboard)
│   ├── hooks/        # Custom React hooks
│   └── types/        # Tipos TypeScript compartidos
├── server/           # Proxy backend Node.js/Express
└── .github/
    └── workflows/    # Workflow de despliegue con GitHub Actions
```

---

Hecho por Miguel Fernando con Kiro 🤖

## Licencia

[MIT](LICENSE)
