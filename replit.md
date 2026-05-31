# AgroGuard Limited

A production-grade agricultural IoT platform that connects ESP32 farm sensors, cloud data, AI recommendations, farmer dashboards, WhatsApp integration, and administrative monitoring for smallholder farmers in Nigeria.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/agroguard run dev` — run the frontend (port 21266)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Frontend: React + Vite + Tailwind CSS + shadcn/ui + Recharts + Wouter

## Where things live

- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `lib/db/src/schema/` — Drizzle table definitions (farmers, devices, sensor_readings, alerts, recommendations, staff)
- `artifacts/api-server/src/routes/` — Express route handlers (one file per domain)
- `artifacts/agroguard/src/pages/` — React pages
- `artifacts/agroguard/src/components/` — Shared UI components
- `artifacts/agroguard/public/` — Brand assets (logo, farm background image)

## Architecture decisions

- OpenAPI-first contract: all types are generated via Orval (no hand-written API types)
- IoT devices (ESP32) POST to `/api/readings` with their hardware `deviceId` string; server resolves to DB integer ID
- Device status (`online`/`offline`) is updated automatically on each reading ingestion
- Dashboard stats use parallel Promise.all() queries for performance
- Landing page uses `/public/farm-bg.webp` (aerial green farmland) and `/public/agroguard-logo.png` as brand anchors

## Product

- **Landing page** — marketing page with hero (farm background + logo), platform stats, features, team section (3 members), pricing, testimonials
- **Admin dashboard** — live platform stats, farm health overview, recent activity feed
- **Farmer management** — CRUD for farmer accounts with WhatsApp integration
- **Device registry** — ESP32 IoT device management, farmer assignment
- **Device monitoring** — live sensor readings (soil moisture, temperature, humidity, heat index) with 24h trend charts
- **Alert center** — severity-coded farm alerts (critical/high/medium/low), resolve inline
- **AI recommendations** — crop, irrigation, pest, disease, climate, fertilizer advisories
- **Staff management** — team roles (admin, agronomist, field_officer, support)
- **Analytics** — sensor trend charts across the platform

## User preferences

- Agricultural technology branding with green, white, earth-tone palette
- No emojis in the UI
- Mobile-first responsive design
- Professional investor-ready interface

## Gotchas

- After any OpenAPI spec change, always re-run codegen before writing routes or frontend code
- The `@workspace/db` lib must be rebuilt (`pnpm run typecheck:libs`) after adding new schema files before the API server can typecheck
- IoT device ingestion endpoint (`POST /api/readings`) accepts `deviceId` as a string (hardware ID), not the integer DB id
- Body schema names in openapi.yaml must be entity-shaped (e.g. `FarmerInput`, not `CreateFarmerBody`) to avoid TS2308 collisions

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
