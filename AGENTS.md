# Base44 Dev Environment

## Stack
- Vite 6 + React 19 + TypeScript, Tailwind CSS 4, Leaflet maps.
- Package manager: **Bun** (lockfile `bun.lock`). Dev server: `bun dev` → `vite --port=3000 --host=0.0.0.0`.
- Pure client-side app. State persists in `localStorage` via `AppContext`. No backend, no database.

## Running
- `docker compose -f docker-compose.base44.yml up -d` brings up the `web` service on host port 3000.
- Image `oven/bun:1`; repo bind-mounted at `/app`, `node_modules` in a named volume. Deps install on startup via `bun install --frozen-lockfile`, then `exec bun dev`.
- Healthcheck probes `http://localhost:3000` with a bun fetch.

## Secrets / env
- `.env.example` lists `GEMINI_API_KEY` and `APP_URL`, but **neither is referenced anywhere in `src/`**. The app boots with no credentials. No external services are required.
- `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS` is passed bare to the service so Vite accepts the preview origin (Vite >= 6.1 appends it to `allowedHosts`).

## Notes
- `vite.config.ts` disables HMR + file watching when `DISABLE_HMR=true`. Leave it unset for live reload.
- `metadata.json` advertises `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API`, but no Gemini code exists in the source.
