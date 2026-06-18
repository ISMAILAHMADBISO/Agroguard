# AgroGuard Limited

A production-grade agricultural IoT platform that connects ESP32 farm sensors,
cloud data, AI recommendations, farmer dashboards, and administrative monitoring
for smallholder farmers in Nigeria.

This repository is configured to run **locally on Windows 11 / macOS / Linux**
and to deploy **entirely on Vercel (serverless) with a Neon PostgreSQL database**.

---

## Table of contents

1. [Architecture (before → after)](#architecture-before--after)
2. [What changed in the migration](#what-changed-in-the-migration)
3. [Local development (Windows 11 / macOS / Linux)](#local-development)
4. [Deploying to Vercel + Neon](#deploying-to-vercel--neon)
5. [Custom domain on Namecheap](#custom-domain-on-namecheap)
6. [Environment variables](#environment-variables)
7. [Connecting an ESP32 sensor](#connecting-an-esp32-sensor)
8. [Troubleshooting](#troubleshooting)
9. [Files changed](#files-changed)

---

## Architecture (before → after)

### Before (Replit, long-running server)

```
                 ┌──────────────────────────────────────────┐
  Browser ─────► │  Replit reverse proxy (single origin)     │
                 │   /        → Vite dev server (React)       │
                 │   /api     → Express server (long-running) │
                 │   /api/ws  → WebSocket (live readings)     │
                 └───────────────┬──────────────────────────┘
                                 │
                          Replit PostgreSQL
  ESP32 ──HTTP POST /api/readings─┘   (push live updates over WebSocket)
```

- One always-on Node process (`server.listen`) served the API **and** a
  WebSocket used to push every new sensor reading to the dashboard.
- Cookies and CORS were hard-coded around Replit's domains.

### After (Vercel serverless + Neon)

```
                 ┌──────────────────────────────────────────────┐
  Browser ─────► │  Vercel edge / routing (single origin)        │
                 │   /*       → Static React build (CDN)          │
                 │   /api/*   → Serverless Function (Express app)  │
                 └───────────────┬──────────────────────────────┘
                                 │  (on-demand, no WebSocket)
                          Neon PostgreSQL (pooled)
  ESP32 ──HTTP POST /api/readings─┘
  Dashboard polls GET /api/devices/:id/readings every 5s (live-ish updates)
```

- **No long-running server.** The same Express app is exported from
  `api/[[...path]].ts` and run on demand as a Vercel Function.
- **No WebSocket.** The device page polls the REST API on an interval, which
  works on serverless where persistent connections are not available.
- Cookies, CORS and CSRF are driven by environment variables, so the app runs
  unchanged on Vercel, a local PC, or anywhere else.

Every product feature is preserved — only the transport for "live" data changed
(WebSocket push → short-interval polling).

---

## What changed in the migration

| Area | Before | After |
|------|--------|-------|
| API hosting | `server.listen()` (always on) | Vercel Function via `api/[[...path]].ts` |
| Live readings | WebSocket `/api/ws` push | Polling `GET /api/devices/:id/readings` (5s) |
| Database | Replit PostgreSQL | Neon PostgreSQL (pooled connection) |
| Cookies / CORS | Hard-coded to Replit domains | Env-driven (`APP_URL`, `ALLOWED_ORIGINS`, `VERCEL_*`) |
| AI errors | Generic 502 | 503 "AI not configured" vs 502 "AI failed", surfaced in UI |
| Image upload | Full-size base64 | Client-side downscale to ≤1280px JPEG |
| Env safety | None | Startup validation (`lib/config.ts`) |
| Scripts | bash-centric | Cross-platform (`concurrently`, `cross-env`) |
| Replit plugins | Vite cartographer / banner / error modal | removed |

---

## Local development

### Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20 LTS or newer | https://nodejs.org |
| pnpm | 9+ (Recommended for Windows workspaces) | Run `npm install -g pnpm` |
| PostgreSQL | 15+ (local) or a free Neon database | https://postgresql.org / https://neon.tech |

> This project uses **pnpm workspaces**. On your own machine, install Node + pnpm, then run `pnpm install`.

### 1 — Install

```bash
git clone <your-repo-url>
cd agroguard
pnpm install
```

### 2 — Database

**Option A — local PostgreSQL**

```sql
CREATE DATABASE agroguard;
CREATE USER agroguard_user WITH PASSWORD 'agroguard_pass';
GRANT ALL PRIVILEGES ON DATABASE agroguard TO agroguard_user;
```

**Option B — Docker**

```bash
docker run -d --name agroguard-db -e POSTGRES_DB=agroguard \
  -e POSTGRES_USER=agroguard_user -e POSTGRES_PASSWORD=agroguard_pass \
  -p 5432:5432 postgres:15
```

**Option C — Neon (also works locally)** — create a project at
https://neon.tech and copy the connection string.

### 3 — Environment variables

```bash
cp .env.example .env       # macOS / Linux
copy .env.example .env     # Windows cmd
```

Fill in at least `DATABASE_URL` and `SESSION_SECRET` (and `OPENAI_API_KEY` for
the AI features). See [Environment variables](#environment-variables).

> **No manual exports needed.** The project auto-loads this root `.env` for every
> command — `npm run setup` (schema push + seed), `npm run dev`, and the API
> server all read it automatically on Windows PowerShell, macOS and Linux. You do
> **not** need to run `$env:DATABASE_URL=...` (PowerShell) or `export ...` by
> hand. Variables already set in the real environment (Replit/Vercel) always win,
> so the same code works in the cloud where no `.env` exists.

### 4 — Create tables + seed demo data

```bash
npm run setup
```

This pushes the schema and seeds demo accounts, a demo device with 24h of
readings, and demo recommendations — so no page is blank on first run. Safe to
re-run.

| Role | Email | Password |
|------|-------|----------|
| Super Admin | ismail.ahmad@agroguard.ng | AgroGuard2024! |
| Admin | usman.umar@agroguard.ng | AgroGuard2024! |
| Agronomist | sadiya.ladan@agroguard.ng | AgroGuard2024! |
| Staff | ibrahim.garba@agroguard.ng | AgroGuard2024! |
| Farmer | emeka.chukwu@farm.ng | AgroGuard2024! |

### 5 — Run

```bash
npm run dev
```

This starts the API (http://localhost:8080) and the frontend
(http://localhost:5173) together. Open **http://localhost:5173**. The Vite dev
server proxies `/api` to the backend so cookie auth works with one command.

> Prefer two terminals? Run `npm run dev:api` and `npm run dev:web` separately.

### Local production preview (optional)

```bash
npm run build
npm run start      # serves the built frontend + API from one origin on :8080
```

---

## Deploying to Vercel + Neon

### 1 — Create the Neon database

1. Sign up at https://neon.tech and create a project (choose a region near your
   users, e.g. `eu-central-1`).
2. Copy the **pooled** connection string (the host contains `-pooler`). It must
   end with `?sslmode=require`.
3. In the Neon SQL editor or locally, push the schema and seed once:
   ```bash
   # locally, with DATABASE_URL pointing at Neon:
   pnpm run setup
   ```

### 2 — Import the repo into Vercel

1. Push this repo to GitHub/GitLab/Bitbucket.
2. In Vercel, **Add New → Project** and import the repo.
3. Framework preset: **Other**.
   * The included `vercel.json` configures all the request routing (`/api/*` mapped to the serverless function and other routes to the SPA).
   * The `vercel-build` command automatically builds the React SPA and places it in the root `dist` directory.
   * Vercel will find the output in `dist` automatically. No manual output directory config is needed in the dashboard.

### 3 — Set environment variables (Vercel → Settings → Environment Variables)

| Name | Value |
|------|-------|
| `DATABASE_URL` | your Neon **pooled** connection string |
| `SESSION_SECRET` | a long random string |
| `OPENAI_API_KEY` | your OpenAI key (optional, for AI) |
| `APP_URL` | your production URL once known (e.g. `https://your-app.vercel.app` or your custom domain) |

`NODE_ENV` is set to `production` by Vercel automatically. `VERCEL_URL` is
injected automatically and already allowlisted.

### 4 — Deploy

Click **Deploy**. Vercel runs `npm run vercel-build` (builds the React app),
serves it from its CDN, and runs the Express app as a serverless function at
`/api/*`.

After the first deploy, set `APP_URL` to the real domain and redeploy so cookie
auth and CSRF protection use the correct origin.

> **AI timeouts:** gpt-4o vision can take >10s. The function requests
> `maxDuration: 60`. On the Hobby plan the cap may be lower; upgrade if disease
> detection times out.

---

## Custom domain on Namecheap

This project uses the Namecheap domain **`agroguard.tech`**.

1. In Vercel: **Project → Settings → Domains → Add** `agroguard.tech` (and add
   `www.agroguard.tech` too — Vercel will offer to redirect one to the other).
   Vercel then shows the exact DNS records to create.
2. In Namecheap: **Domain List → Manage → Advanced DNS**.
3. Add the records Vercel asks for. Typically:
   - **Apex (`agroguard.tech`):** an `A` record `@ → 76.76.21.21`
     (use the exact IP Vercel shows), **or** an `ALIAS`/`CNAME` to
     `cname.vercel-dns.com` if your DNS supports it at the apex.
   - **www:** a `CNAME` record `www → cname.vercel-dns.com`.
4. Remove Namecheap's default "parking" records (the `CNAME www → parkingpage`
   and the URL-redirect record) so they don't conflict.
5. Wait for DNS to propagate (minutes to a few hours). Vercel issues HTTPS
   automatically once the records resolve.
6. Set `APP_URL=https://agroguard.tech` in Vercel env vars and redeploy so
   cookies, CORS and CSRF use the real origin.

---

## Environment variables

| Variable | Required | Used | Notes |
|----------|----------|------|-------|
| `DATABASE_URL` | yes | local + prod | Postgres/Neon connection string |
| `SESSION_SECRET` | yes (prod) | local + prod | signs session cookies; server refuses to boot without it in production |
| `OPENAI_API_KEY` | optional | AI features | without it, AI endpoints return a clear "not configured" message |
| `NODE_ENV` | auto | local + prod | `development` locally; Vercel sets `production` |
| `PORT` | optional | local only | API port (default 8080); unused on Vercel |
| `APP_URL` | recommended (prod) | prod | your public origin for cookies/CORS/CSRF |
| `ALLOWED_ORIGINS` | optional | prod | extra comma-separated browser origins |
| `DB_POOL_MAX` | optional | prod | DB pool size per process (default 3) |
| `SERVE_CLIENT` | optional | local | `true` makes the API also serve the built frontend |

---

## Connecting an ESP32 sensor

Firmware sketches ship in `artifacts/agroguard/public/`:

- `esp32-agroguard.ino` — direct WiFi node (7-in-1 soil sensor + DHT22).
- `agroguard-lora-transmitter.ino` / `agroguard-lora-receiver-esp32.ino` — a
  LoRa field node + WiFi gateway pair for fields out of WiFi range.

In the sketch set `WIFI_SSID`, `WIFI_PASSWORD`, `DEVICE_ID` (the
`AGR-XXXX-XXXX` id from the Devices page) and `API_HOST`:

- **Production:** `https://your-app.vercel.app` (or your custom domain).
- **Local dev:** `http://<your-PC-LAN-IP>:8080` (e.g. `http://192.168.1.100:8080`).

Readings appear in Device Monitoring within a minute. The dashboard polls for
new readings, so no special firmware changes are needed for "live" updates.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `npm run setup` says "DATABASE_URL is not set" | Make sure `.env` exists in the **project root** (not in `lib/db`) and contains `DATABASE_URL`. It is auto-loaded — no `$env:`/`export` needed. |
| drizzle-kit: "please install required packages: drizzle-orm" | You ran `npx drizzle-kit` directly. Use `npm run setup` (or `npm run push --workspace @workspace/db`) so the workspace-pinned drizzle-kit + drizzle-orm are used. |
| Server won't start: "Missing required environment variable(s): DATABASE_URL" | Set `DATABASE_URL` in `.env` (local) or Vercel env vars. |
| Server won't start in prod: "SESSION_SECRET must be set" | Add `SESSION_SECRET` in Vercel env vars. |
| Login works then 401s | Ensure `APP_URL` matches the site's real origin; redeploy. |
| AI shows "AI is not configured" | Add `OPENAI_API_KEY` and redeploy/restart. |
| AI "analysis failed" on large photos | Photos are auto-downscaled; if it persists the upstream model errored — retry. |
| Disease detection times out on Vercel | gpt-4o is slow; raise the plan's function timeout. |
| Device page shows no live data | Confirm the device posts to `/api/readings` and is registered; the page polls every 5s. |
| Neon: "too many connections" | Use the **pooled** connection string and keep `DB_POOL_MAX` small. |

---

## Files changed

Migration-relevant additions/edits:

- `api/[[...path]].ts` — **new** Vercel serverless entry (exports the Express app).
- `vercel.json` — **new** build/output/function/SPA-routing config.
- `.env.example` — expanded with Neon/Vercel/origin variables.
- `artifacts/api-server/src/index.ts` — local-dev listener only; WebSocket removed; optional static serve.
- `artifacts/api-server/src/app.ts` — env-driven cookies/CORS/CSRF; `lib/config` import.
- `artifacts/api-server/src/lib/config.ts` — **new** startup env validation.
- `artifacts/api-server/src/lib/openai.ts` — `isAIConfigured()` helper.
- `artifacts/api-server/src/lib/ws.ts` — **deleted**.
- `artifacts/api-server/src/routes/ai.ts` — 503 vs 502 AI error handling.
- `artifacts/api-server/src/routes/readings.ts` — WebSocket broadcast removed.
- `artifacts/api-server/package.json` — `ws` / `@types/ws` removed.
- `lib/db/src/index.ts` — serverless-friendly pool sizing; auto-loads root `.env`.
- `lib/db/src/load-env.ts` — **new** cross-platform root-`.env` auto-loader (walks up from cwd).
- `lib/db/drizzle.config.ts` — ESM-safe schema glob (no `__dirname`); auto-loads `.env`.
- `lib/db/src/schema/user_sessions.ts` — **new** session table in the Drizzle schema so `npm run setup` creates it on a fresh clone (connect-pg-simple no longer creates it).
- `artifacts/api-server/src/lib/openai.ts` — `describeAIError()` maps OpenAI quota (429 `insufficient_quota`) to a clear billing message (HTTP 402).
- `artifacts/agroguard/src/pages/device-detail.tsx` — WebSocket → polling.
- `artifacts/agroguard/src/pages/crop-diagnosis.tsx` — client-side downscale + real error messages.
- `artifacts/agroguard/src/pages/ai-assistant.tsx` — real error messages.
- `artifacts/agroguard/src/lib/api-error.ts` — **new** shared error-message helper.
- `artifacts/agroguard/vite.config.ts` — Replit plugins removed; always-on `/api` dev proxy.
- `artifacts/agroguard/package.json` — `@replit/*` plugins removed.
- `artifacts/agroguard/public/*.ino` — generalized `API_HOST` placeholders.
- `scripts/src/setup-database.ts` — seeds demo device, 24h readings, recommendations.
- `package.json` — cross-platform `dev`/`build`/`start`/`vercel-build`; `engines`.

---

## Stack

- **Runtime:** Node.js 20+, TypeScript 5.9, npm workspaces
- **API:** Express 5 (as a Vercel Function in production)
- **Database:** PostgreSQL 15 / Neon + Drizzle ORM
- **API contract:** OpenAPI 3.1 → Orval (React Query hooks + Zod schemas)
- **Frontend:** React 19, Vite 7, Tailwind CSS v4, shadcn/ui, Recharts, Wouter
- **AI:** OpenAI gpt-4o (disease detection, advisory chat)
- **Live data:** REST polling (5s) — no WebSocket
