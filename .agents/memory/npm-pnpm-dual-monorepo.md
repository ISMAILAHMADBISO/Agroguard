---
name: npm/pnpm dual monorepo (Replit + local Windows)
description: How AgroGuard runs on pnpm in Replit cloud and plain npm workspaces on a user's machine simultaneously
---

# Dual package-manager monorepo: pnpm (Replit) + npm (local)

AgroGuard must install with **plain `npm install`** on a user's Windows/macOS/Linux
machine, while the Replit cloud environment uses **pnpm** (its reconciler enforces
`PNPM_WORKSPACE`). Both coexist from one set of files.

## What makes both work
- Workspace package specs use plain `"*"` (not `workspace:*`) so npm workspaces resolve
  local `@workspace/*` packages. pnpm would normally NOT link a plain `*` spec to the
  local package, so `pnpm-workspace.yaml` sets **`linkWorkspacePackages: true`** to force
  pnpm to link them locally too.
- `pnpm-workspace.yaml` is documented in replit.md as **Replit-cloud-only** — users ignore it.
- pnpm-only settings (`autoInstallPeers: false`, etc.) belong in `pnpm-workspace.yaml`,
  **not** `.npmrc`. A `.npmrc` containing `auto-install-peers` / `strict-peer-dependencies`
  emits `npm warn Unknown project config` on the user's machine — remove it; pnpm reads
  those keys from `pnpm-workspace.yaml`.

## Cross-platform gotchas (don't regress)
- Scripts that set env vars must use `cross-env` (e.g. `cross-env NODE_ENV=development`),
  never bash `export` or `PORT=x cmd` prefixes — those fail in Windows cmd/PowerShell.
- Don't rely on Replit-injected `PORT`/`BASE_PATH`: provide defaults in code
  (API → 8080, Vite → 5173, BASE_PATH → "/"). Add a local-only Vite `/api`→localhost:8080
  proxy gated on an `isReplit` check (REPLIT_DEV_DOMAIN || REPLIT_DOMAINS).
- Cookies/CORS must be gated on the same `isReplit` check: Secure/SameSite=None on Replit
  HTTPS, non-secure/Lax locally, with localhost CORS fallback origins.

**Why:** the user develops on a local Windows PC and only deploys to Replit; a single
file set has to satisfy two package managers and two runtime environments.
