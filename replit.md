# AgroGuard Limited

A production-grade agricultural IoT platform that connects ESP32 farm sensors, cloud data, AI recommendations, farmer dashboards, WhatsApp integration, and administrative monitoring for smallholder farmers in Nigeria.

---

## Local Development Setup

Follow these steps to run AgroGuard on your own machine.

### Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 24.x | https://nodejs.org or `nvm install 24` |
| pnpm | 10.x | `npm install -g pnpm@10` |
| PostgreSQL | 15+ | https://postgresql.org or Docker (see below) |

### 1 — Clone and install dependencies

```bash
git clone <your-repo-url>
cd agroguard

pnpm install
```

### 2 — Set up the database

**Option A — Local PostgreSQL**

Create a database and user:

```bash
psql -U postgres
```

```sql
CREATE DATABASE agroguard;
CREATE USER agroguard_user WITH PASSWORD 'agroguard_pass';
GRANT ALL PRIVILEGES ON DATABASE agroguard TO agroguard_user;
\q
```

**Option B — Docker (quickest)**

```bash
docker run -d \
  --name agroguard-db \
  -e POSTGRES_DB=agroguard \
  -e POSTGRES_USER=agroguard_user \
  -e POSTGRES_PASSWORD=agroguard_pass \
  -p 5432:5432 \
  postgres:15
```

### 3 — Configure environment variables

Create a `.env` file in the **project root**:

```env
# PostgreSQL connection string
DATABASE_URL=postgresql://agroguard_user:agroguard_pass@localhost:5432/agroguard

# Session secret — use any long random string locally
SESSION_SECRET=replace-with-a-long-random-secret-string

# Node environment
NODE_ENV=development
```

> The API server reads these at startup. Never commit `.env` to version control.

### 4 — Push the database schema

This creates all tables (farmers, devices, sensor_readings, alerts, recommendations, staff):

```bash
pnpm --filter @workspace/db run push
```

You should see Drizzle print each table as it is applied.

### 5 — Seed demo data (optional but recommended)

```bash
pnpm --filter @workspace/db run seed
```

This creates demo staff accounts you can log in with immediately:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@agroguard.ng | AgroGuard2024! |
| Agronomist | chidi@agroguard.ng | AgroGuard2024! |
| Field Officer | amaka@agroguard.ng | AgroGuard2024! |
| Support | support@agroguard.ng | AgroGuard2024! |

### 6 — Start the API server

Open a terminal and run:

```bash
pnpm --filter @workspace/api-server run dev
```

The API server starts on **http://localhost:8080**. You should see:

```
INFO: Server listening  port: 8080
```

### 7 — Start the frontend

Open a **second terminal** and run:

```bash
PORT=5173 pnpm --filter @workspace/agroguard run dev
```

Then open **http://localhost:5173** in your browser.

> The frontend proxies `/api` requests to `localhost:8080` automatically via the shared reverse proxy in Replit. For local dev, you may need to add a Vite proxy — see [Vite proxy docs](https://vite.dev/config/server-options.html#server-proxy).

### Connecting an ESP32 sensor node

1. Open `artifacts/agroguard/public/esp32-agroguard.ino` in Arduino IDE.
2. Set `WIFI_SSID`, `WIFI_PASSWORD`, and `API_HOST` (your machine's LAN IP, e.g. `http://192.168.1.100:8080`).
3. Set `DEVICE_ID` to match the `AGR-XXXX-XXXX` ID shown in the Devices page after you register the device.
4. Flash to your ESP32. Readings will appear in the Device Monitoring page within the first minute.

---

## Daily Development Workflow

```bash
# Full typecheck (both libs and artifacts)
pnpm run typecheck

# After editing openapi.yaml — regenerate hooks and Zod schemas
pnpm --filter @workspace/api-spec run codegen

# After adding a new Drizzle schema file — rebuild libs first
pnpm run typecheck:libs
pnpm --filter @workspace/db run push

# Build everything (typecheck + esbuild bundle)
pnpm run build
```

---

## Stack

- **Runtime:** Node.js 24, TypeScript 5.9, pnpm workspaces
- **API:** Express 5
- **Database:** PostgreSQL 15 + Drizzle ORM
- **Validation:** Zod v4, drizzle-zod
- **API contract:** OpenAPI 3.1 → Orval codegen (React Query hooks + Zod schemas)
- **Build:** esbuild (ESM bundle with source maps)
- **Frontend:** React 19, Vite 7, Tailwind CSS v4, shadcn/ui, Recharts, Wouter
- **Real-time:** WebSocket at `/api/ws` (auto-reconnects every 3 s)

---

## Project Structure

```
agroguard/
├── lib/
│   ├── api-spec/          # OpenAPI contract (source of truth)
│   │   └── openapi.yaml
│   ├── api-zod/           # Generated Zod schemas + React Query hooks (do not hand-edit)
│   └── db/
│       └── src/schema/    # Drizzle table definitions
│           ├── farmers.ts
│           ├── devices.ts
│           ├── sensor_readings.ts  # includes 7-in-1 soil sensor columns
│           ├── alerts.ts
│           ├── recommendations.ts
│           └── staff.ts
├── artifacts/
│   ├── api-server/
│   │   └── src/
│   │       ├── routes/    # Express route handlers (one file per domain)
│   │       └── lib/
│   │           ├── rbac.ts        # Role-based access control helpers
│   │           └── websocket.ts   # Live sensor broadcast
│   └── agroguard/
│       ├── public/
│       │   ├── agroguard-logo.png
│       │   ├── farm-bg.webp
│       │   └── esp32-agroguard.ino   # Arduino firmware for ESP32 + 7-in-1 sensor
│       └── src/
│           ├── pages/     # React page components
│           └── components/
│               └── layout.tsx   # Sidebar, nav, RBAC-scoped menu
└── scripts/               # Shared utility scripts
```

---

## Product Features

| Feature | Notes |
|---------|-------|
| Landing page | Marketing page — hero, stats, features, pricing, team |
| Admin dashboard | Platform stats, farm health overview, activity feed |
| Farmer management | CRUD, WhatsApp link, assign field officer (admin only) |
| Device registry | Register ESP32 nodes, generate `AGR-XXXX-XXXX` IDs |
| Device monitoring | Live sensor cards, 7-in-1 soil analysis, 24 h trend charts |
| Alert center | Severity-coded alerts (critical/high/medium/low), inline resolve |
| AI recommendations | Crop, irrigation, pest, disease, climate, fertilizer advisories |
| Staff management | Admin, agronomist, field_officer, support roles |
| Analytics | Cross-platform sensor trend charts |

---

## Role-Based Access Control

| Role | Permissions |
|------|------------|
| `admin` | Full access — all farmers, all devices, staff CRUD, assign field officers |
| `agronomist` | Read/write all farmers and devices, create recommendations and alerts |
| `field_officer` | Read/write only farmers assigned to them (`field_officer_id = userId`) |
| `support` | Read-only across all data |

---

## 7-in-1 Soil Sensor

Devices fitted with an RS485 Modbus soil sensor can report seven channels per reading:

| Channel | Field | Unit |
|---------|-------|------|
| Soil moisture | `soilMoisture` | % |
| Soil temperature | `temperature` | °C |
| Electrical conductivity | `electricalConductivity` | mS/m |
| Soil pH | `ph` | 0–14 |
| Nitrogen | `nitrogen` | mg/kg |
| Phosphorus | `phosphorus` | mg/kg |
| Potassium | `potassium` | mg/kg |

The firmware at `artifacts/agroguard/public/esp32-agroguard.ino` handles Modbus RTU over RS485 and posts all seven fields to `POST /api/readings`. The platform automatically shows the 7-in-1 panel on the device detail page when those fields are present.

---

## Architecture Decisions

- **OpenAPI-first:** all types flow from `lib/api-spec/openapi.yaml` → Orval → Zod + React Query. No hand-written API types.
- **Device ID resolution:** ESP32 posts its hardware `deviceId` string; the server resolves to an integer DB id — so device IDs can be reassigned without reflashing firmware.
- **Device status:** `online`/`offline` is updated automatically on every reading ingestion.
- **RBAC middleware:** `lib/rbac.ts` exposes `requireAuth`, `requireAdmin`, and `requireCanWrite` middleware used by every route.
- **Dashboard stats:** parallel `Promise.all()` queries so the dashboard never blocks on a slow query.
- **WebSocket:** `/api/ws` broadcasts every new sensor reading to all connected clients; the frontend auto-reconnects every 3 s on disconnect.

---

## Gotchas

- After any `openapi.yaml` change, always re-run `pnpm --filter @workspace/api-spec run codegen` before touching routes or frontend code.
- After adding a new schema file to `lib/db/src/schema/`, run `pnpm run typecheck:libs` before typechecking artifacts — the composite build must emit declarations first.
- `POST /api/readings` accepts `deviceId` as a **string** (hardware ID), not the integer DB id.
- Body schema names in `openapi.yaml` must be entity-shaped (e.g. `FarmerInput`, not `CreateFarmerBody`) to avoid TS2308 namespace collisions from Orval codegen.
- drizzle-kit `push` does not handle raw SQL columns added outside Drizzle — run raw SQL migrations via `executeSql()` for schema additions not expressible in the Drizzle DSL.
- Orval-generated hooks: do **not** pass `{ query: { enabled } }` as a second argument — it causes TS2741 (missing `queryKey`). The enabled flag is built into the generated hook signature directly.

---

## User Preferences

- Agricultural technology branding — green, white, earth-tone palette
- No emojis in the UI
- Mobile-first responsive design
- Professional investor-ready interface
