---
name: Auto-loading root .env in npm/pnpm workspaces
description: Why a plain dotenv call fails for workspace scripts and how to load the monorepo-root .env reliably cross-platform
---

## Rule
For a monorepo with a single `.env` at the repo ROOT, do NOT rely on `dotenv`'s default (cwd-only) lookup. `npm run <script> --workspace <pkg>` and `pnpm --filter` run scripts with `cwd` set to the **workspace folder** (e.g. `lib/db`, `scripts`), so a root `.env` is never found. Provide a side-effect loader that walks UP from `process.cwd()` to find the nearest `.env`, bounded by a repo-root marker (`pnpm-workspace.yaml` / `.git`) so it can't grab an unrelated parent `.env`.

**Why:** without this, a fresh local clone (esp. Windows PowerShell) fails with "DATABASE_URL not set" unless the user manually exports it — exactly what we were asked to eliminate. Replit/Vercel inject env vars directly, so the bug is invisible in the cloud and only bites local clones.

**How to apply:**
- Loader lives in the db lib (`load-env.ts`), imported as the FIRST line of `src/index.ts` (before the pg Pool reads `DATABASE_URL`), of `drizzle.config.ts`, and of the API server's `config.ts` (via a `"./load-env"` export subpath so it doesn't drag in the pool).
- Use `dotenv` WITHOUT `override` so real injected env vars always win (cloud-safe).
- In ESM (`"type":"module"`) configs, never use `__dirname` — it's undefined. Use a relative glob (e.g. drizzle `schema: "./src/schema/*.ts"`).
- Run schema push via the workspace-pinned tool (`npm run push --workspace @workspace/db`), NOT `npx drizzle-kit` — npx may fetch a mismatched drizzle-kit that then errors "please install required packages: drizzle-orm".
