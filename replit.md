# AgroGuard Limited

A production-grade agricultural IoT platform that connects ESP32 farm sensors, cloud data, AI recommendations, farmer dashboards, WhatsApp integration, and administrative monitoring for smallholder farmers in Nigeria.

---

## Local Development Setup (Windows / macOS / Linux)

The project uses **npm workspaces**. On your own machine you only need Node.js, npm
(bundled with Node) and PostgreSQL. `npm install` works on Windows, macOS and Linux.

> Note: a `pnpm-workspace.yaml` file is present, but it is **only used by the Replit
> cloud environment**. You do not need pnpm on your own machine — ignore that file.

### Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20.x LTS or newer | https://nodejs.org (npm is bundled) |
| PostgreSQL | 15+ | https://postgresql.org or Docker (see below) |

### 1 — Clone and install dependencies

```bash
git clone <your-repo-url>
cd agroguard

npm install
```

(`npm install` generates a `package-lock.json` on first run if one is not present.)

### 2 — Set up the database

**Option A — Local PostgreSQL**

```sql
-- psql -U postgres
CREATE DATABASE agroguard;
CREATE USER agroguard_user WITH PASSWORD 'agroguard_pass';
GRANT ALL PRIVILEGES ON DATABASE agroguard TO agroguard_user;
```

**Option B — Docker (quickest)**

```bash
docker run -d --name agroguard-db \
  -e POSTGRES_DB=agroguard \
  -e POSTGRES_USER=agroguard_user \
  -e POSTGRES_PASSWORD=agroguard_pass \
  -p 5432:5432 postgres:15
```

### 3 — Configure environment variables

Copy `.env.example` to `.env` in the **project root** and fill in the values:

```bash
cp .env.example .env      # macOS / Linux
copy .env.example .env     # Windows (cmd)
```

```env
DATABASE_URL=postgresql://agroguard_user:agroguard_pass@localhost:5432/agroguard
SESSION_SECRET=replace-with-a-long-random-secret-string
OPENAI_API_KEY=sk-...           # required for the AI features
NODE_ENV=development
PORT=8080
```

### 4 — Create tables and seed demo data (one command)

```bash
npm run setup
```

This pushes the Drizzle schema (creates all tables) and seeds demo accounts you can
log in with immediately. It is safe to re-run — existing accounts are left untouched.

| Role | Email | Password |
|------|-------|----------|
| Super Admin | amina.okonkwo@agroguard.ng | AgroGuard2024! |
| Agronomist | fatima.alhassan@agroguard.ng | AgroGuard2024! |
| Staff | ibrahim.garba@agroguard.ng | AgroGuard2024! |
| Farmer | emeka.chukwu@farm.ng | AgroGuard2024! |

> To only push the schema (no seed) run: `npm run push --workspace @workspace/db`

### 5 — Start the API server

In one terminal:

```bash
npm run dev --workspace @workspace/api-server
```

The API server starts on **http://localhost:8080** (`PORT` defaults to 8080 if unset).

### 6 — Start the frontend

In a **second terminal**:

```bash
npm run dev --workspace @workspace/agroguard
```

Then open **http://localhost:5173** (the port defaults to 5173 locally).

> The Vite dev server automatically proxies `/api` requests to the backend on
> `localhost:8080` during local development, so login and all API calls work with no
> extra configuration. On Replit, the shared reverse proxy handles this instead.

### Connecting an ESP32 sensor node

1. Open `artifacts/agroguard/public/esp32-agroguard.ino` in Arduino IDE.
2. Set `WIFI_SSID`, `WIFI_PASSWORD`, and `API_HOST` (your machine's LAN IP, e.g. `http://192.168.1.100:8080`).
3. Set `DEVICE_ID` to match the `AGR-XXXX-XXXX` ID shown in the Devices page after you register the device.
4. Flash to your ESP32. Readings appear in the Device Monitoring page within the first minute.

---

## Daily Development Workflow

```bash
# Full typecheck (both libs and artifacts)
npm run typecheck

# After editing openapi.yaml — regenerate hooks and Zod schemas
npm run codegen --workspace @workspace/api-spec

# After adding a new Drizzle schema file — rebuild libs first, then push
npm run typecheck:libs
npm run push --workspace @workspace/db

# Build everything (typecheck + esbuild bundle)
npm run build
```

---

## Cross-platform notes

- **Ports/base path:** `PORT` and `BASE_PATH` are injected automatically on Replit.
  Locally they are optional — the API defaults to `8080` and the frontend to `5173`.
- **`cross-env`:** scripts that set `NODE_ENV` use `cross-env` so they work in Windows
  cmd/PowerShell as well as bash.
- **Cookies:** session cookies are `Secure`/`SameSite=None` on Replit (HTTPS) and
  automatically downgraded to non-secure/`Lax` locally (HTTP) so login works on
  `http://localhost`.

---

## Stack

- **Runtime:** Node.js 20+, TypeScript 5.9, **npm workspaces**
- **API:** Express 5
- **Database:** PostgreSQL 15 + Drizzle ORM
- **Validation:** Zod, drizzle-zod
- **API contract:** OpenAPI 3.1 → Orval codegen (React Query hooks + Zod schemas)
- **Build:** esbuild (ESM bundle with source maps)
- **Frontend:** React 19, Vite 7, Tailwind CSS v4, shadcn/ui, Recharts, Wouter
- **AI:** OpenAI gpt-4o (disease detection, advisory chat, recommendations)
- **Real-time:** WebSocket at `/api/ws` (auto-reconnects every 3 s)

---

## Project Structure

```
agroguard/
├── lib/
│   ├── api-spec/          # OpenAPI contract (source of truth)
│   ├── api-zod/           # Generated Zod schemas + React Query hooks (do not hand-edit)
│   └── db/src/schema/     # Drizzle table definitions
├── artifacts/
│   ├── api-server/src/    # Express routes + lib (rbac, websocket, openai)
│   └── agroguard/         # React frontend (pages, components)
├── scripts/
│   └── src/setup-database.ts   # `npm run setup` — push schema + seed demo data
├── .env.example           # Copy to .env for local development
└── pnpm-workspace.yaml    # Replit cloud only — ignore on your own machine
```

---

## Product Features

| Feature | Notes |
|---------|-------|
| Landing page | Marketing page — hero, stats, features, leadership team |
| Admin dashboard | Platform stats, farm health overview, activity feed |
| Farmer management | CRUD, WhatsApp link, assign field officer |
| Device registry | Register ESP32 nodes, generate `AGR-XXXX-XXXX` IDs |
| Device monitoring | Live sensor cards, 7-in-1 soil analysis, 24 h trend charts |
| Alert center | Severity-coded alerts, inline resolve |
| AI disease detection | Upload a crop photo → disease + confidence + treatment (gpt-4o vision) |
| AI advisory chat | Conversational agronomy assistant for staff and farmers |
| AI recommendations | Crop, irrigation, pest, disease, climate, fertilizer advisories |
| Staff management | super_admin, admin, agronomist, staff roles |
| Analytics | Cross-platform sensor trend charts |

---

## Role-Based Access Control

| Role | Permissions |
|------|------------|
| `super_admin` | Full access — all data, staff CRUD, assign field officers |
| `admin` | Manage farmers, devices, staff; create recommendations and alerts |
| `agronomist` | Read/write all farmers and devices, create recommendations and alerts |
| `staff` | Scoped read/write for assigned farmers |
| `farmer` | Logs in to see only their own farm, devices, alerts and recommendations |

---

## 7-in-1 Soil Sensor

Devices fitted with an RS485 Modbus soil sensor report seven channels per reading:
soil moisture (%), soil temperature (°C), electrical conductivity (mS/m), pH,
nitrogen, phosphorus and potassium (mg/kg). The firmware at
`artifacts/agroguard/public/esp32-agroguard.ino` posts all seven fields to
`POST /api/readings`; the device detail page shows the 7-in-1 panel when present.

---

## Architecture Decisions

- **OpenAPI-first:** all types flow from `lib/api-spec/openapi.yaml` → Orval → Zod + React Query. No hand-written API types.
- **Device ID resolution:** ESP32 posts its hardware `deviceId` string; the server resolves to an integer DB id.
- **RBAC middleware:** `lib/rbac.ts` exposes `requireAuth`, `requireAdmin`, `requireCanWrite`.
- **Auth:** session-based (express-session + connect-pg-simple). Login checks staff, then farmers. Cookie security adapts to Replit (HTTPS) vs local (HTTP).
- **WebSocket:** `/api/ws` broadcasts every new sensor reading; the frontend auto-reconnects every 3 s.

---

## Gotchas

- After any `openapi.yaml` change, run `npm run codegen --workspace @workspace/api-spec` before touching routes or frontend code.
- After adding a new schema file to `lib/db/src/schema/`, run `npm run typecheck:libs` before typechecking artifacts.
- `POST /api/readings` accepts `deviceId` as a **string** (hardware ID), not the integer DB id.
- Body schema names in `openapi.yaml` must be entity-shaped (e.g. `FarmerInput`, not `CreateFarmerBody`) to avoid TS2308 namespace collisions from Orval codegen.
- The AI features require a valid `OPENAI_API_KEY` with available quota; without it the AI endpoints return a friendly "AI is not available" message.

---

## User Preferences

- Agricultural technology branding — green, white, earth-tone palette
- No emojis in the UI
- Mobile-first responsive design
- Professional investor-ready interface
- Must run on a local Windows machine with npm (not only on Replit)
