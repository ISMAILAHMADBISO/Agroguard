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

#### Where do I put my OpenAI API key?

The AI features (disease detection, advisory chat, recommendations) need an OpenAI
API key. Where you put it depends on where you run the app:

- **Running locally (your own Windows / macOS / Linux machine):**
  Put it in the `.env` file in the **project root** as `OPENAI_API_KEY=sk-...`
  (the same file you created above). Restart the API server after editing `.env`.

- **Running on Replit (cloud):**
  Do **not** put it in `.env`. Instead add it as a **Secret**: open the **Secrets**
  tool (lock icon) in the left sidebar, add a secret with the key
  `OPENAI_API_KEY` and your `sk-...` value, then restart the app. Replit injects
  secrets as environment variables automatically — this keeps the key out of your
  code and git history.

> Get a key from https://platform.openai.com/api-keys. The key needs available
> quota/billing. Without a valid key the AI endpoints return a friendly
> "AI is not available" message and the rest of the platform keeps working.

### 4 — Create tables and seed demo data (one command)

```bash
npm run setup
```

This pushes the Drizzle schema (creates all tables) and seeds demo accounts you can
log in with immediately. It is safe to re-run — existing accounts are left untouched.

| Role | Name | Email | Password |
|------|------|-------|----------|
| Super Admin | Ismail Ahmad | ismail.ahmad@agroguard.ng | AgroGuard2024! |
| Admin | Usman Umar | usman.umar@agroguard.ng | AgroGuard2024! |
| Agronomist | Sadiya Ladan | sadiya.ladan@agroguard.ng | AgroGuard2024! |
| Staff | Ibrahim Garba | ibrahim.garba@agroguard.ng | AgroGuard2024! |
| Farmer | Emeka Chukwu | emeka.chukwu@farm.ng | AgroGuard2024! |

Farmers can also **self-register** from the public `/signup` page — new accounts
appear immediately in the Farmers list for admins and staff to manage.

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

Three firmware sketches ship in `artifacts/agroguard/public/`. Pick the one that
matches your field's connectivity:

**Option A — Direct WiFi node (simplest):** `esp32-agroguard.ino`
ESP32 + 7-in-1 RS485 soil sensor + DHT22, posts directly over WiFi.

1. Open `esp32-agroguard.ino` in Arduino IDE.
2. Set `WIFI_SSID`, `WIFI_PASSWORD`, and `API_HOST` (your machine's LAN IP, e.g. `http://192.168.1.100:8080`).
3. Set `DEVICE_ID` to match the `AGR-XXXX-XXXX` ID shown in the Devices page after you register the device.
4. Flash to your ESP32. Readings appear in the Device Monitoring page within the first minute.

**Option B — LoRa pair (no WiFi at the field):** for fields out of WiFi range,
a battery field node sends readings over long-range LoRa to a gateway that has
WiFi and forwards them to the platform.

- `agroguard-lora-transmitter.ino` — Arduino field node (soil sensor → LoRa).
- `agroguard-lora-receiver-esp32.ino` — ESP32 gateway (LoRa → WiFi → `/api/readings`).

1. Flash the transmitter to the field-node Arduino and the receiver to the ESP32 gateway.
2. On the **receiver** set `WIFI_SSID`, `WIFI_PASSWORD`, `API_HOST` and `DEVICE_ID`.
3. Both sketches **must use the same LoRa frequency** — both default to `868E6`
   (EU). For the US set both to `915E6`; for the 433 MHz band set both to `433E6`.
   A frequency mismatch means no packets are ever received.
4. Power both. The gateway OLED shows live readings and forwards each one to the
   platform; readings appear in Device Monitoring within a minute.

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
- **Live data:** REST polling (device page polls readings every 5 s) — no WebSocket
- **Hosting:** local (Express `server.listen`) or Vercel serverless (`api/[[...path]].ts`) + Neon PostgreSQL

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
| Landing page | Marketing page — hero, product specs, In the Box, comparison, 3 steps, testimonials, contact, leadership |
| Farmer self-signup | Public `/signup` — farmers register themselves; instantly visible to admin/staff |
| Auth carousel | Sliding AgroGuard-branded imagery on the login & signup screens |
| Admin dashboard | Platform stats, farm health overview, activity feed |
| Farmer management | CRUD, WhatsApp link, assign field officer (admin and staff can create) |
| Device registry | Register ESP32 nodes, generate `AGR-XXXX-XXXX` IDs (admin and staff can create) |
| Device monitoring | Live sensor cards, 7-in-1 soil analysis, 24 h trend charts |
| Alert center | Severity-coded alerts, inline resolve |
| AI disease detection | Upload a crop photo → disease + confidence + treatment (gpt-4o vision) |
| AI advisory chat | Conversational agronomy assistant for staff and farmers |
| AI recommendations | Crop, irrigation, pest, disease, climate, fertilizer advisories |
| Staff management | super_admin, admin, agronomist, staff roles; staff can add team members but cannot create admin/super_admin |
| Analytics | Cross-platform sensor trend charts |

---

## Role-Based Access Control

| Role | Permissions |
|------|------------|
| `super_admin` | Full access — all data, staff CRUD, assign field officers |
| `admin` | Manage farmers, devices, staff; create recommendations and alerts |
| `agronomist` | Read/write all farmers and devices, create recommendations and alerts |
| `staff` | Read/write all farmers and devices; can create farmers, devices and staff (but not admin/super_admin) |
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
- **Auth:** session-based (express-session + connect-pg-simple). Login checks staff, then farmers. Cookie security adapts to production (HTTPS, Secure) vs local (HTTP, non-Secure) via `NODE_ENV`.
- **Live data:** the device-detail page polls `GET /api/devices/:id/readings` every 5 s (and device/trends every 15 s). No WebSocket — works on serverless (Vercel).
- **Serverless:** in production the Express app is exported from `api/[[...path]].ts` as a Vercel Function (no `server.listen`); `index.ts` is local-dev only. Allowed origins come from `APP_URL`/`ALLOWED_ORIGINS`/`VERCEL_*` env vars.
- **Env validation:** `lib/config.ts` (imported by `app.ts`) fails fast on missing `DATABASE_URL`/`SESSION_SECRET`.

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
