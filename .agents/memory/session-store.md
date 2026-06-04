---
name: connect-pg-simple bundling issue with esbuild
description: connect-pg-simple fails when bundled by esbuild because it can't find table.sql via __dirname
---

## Rule
Do NOT use `createTableIfMissing: true` with `connect-pg-simple` when the API server is bundled with esbuild. The package internally does `fs.readFile(path.join(__dirname, 'table.sql'))` — after bundling, `__dirname` points to `dist/` not `node_modules/connect-pg-simple/`, so the file is not found.

## Fix (preferred): define the session table in the Drizzle schema
Add a Drizzle table for `user_sessions` so `drizzle-kit push` (run by `npm run setup`) creates it on a fresh clone — no manual SQL, no auto-create. The shape MUST match what connect-pg-simple expects for that tableName, and match the live table exactly so push generates no diff/ALTER:
- `sid` varchar PRIMARY KEY (drizzle default PK name `user_sessions_pkey` matches)
- `sess` json NOT NULL
- `expire` timestamp precision 6 NOT NULL
- index named `IDX_user_sessions_expire` on `(expire)`

Keep `createTableIfMissing` OFF (default) in the PgStore config.

**Why:** a fresh clone has an empty DB; nothing else creates the session table, so without this, login fails on first run (connect-pg-simple won't create it when bundled — see below). Putting it in the schema also stops `drizzle-kit push` from offering to DROP the "extra" table on re-runs (the scary data-loss prompt).

**Earlier manual-SQL alternative** (still valid if you can't touch the schema): pre-create via `CREATE TABLE IF NOT EXISTS user_sessions (...)` and remove `createTableIfMissing: true`.

**Why createTableIfMissing breaks:** esbuild bundles `connect-pg-simple` inline, so its internal `fs.readFile(path.join(__dirname,'table.sql'))` resolves `__dirname` to the bundle output dir, not the package dir → file not found.

## Rule (serverless pooling)
On serverless (Vercel + Neon), pass the **shared app DB pool** into `new PgStore({ pool })` — do NOT use `conString`. `conString` makes connect-pg-simple open its own pg pool with default `max` (~10), bypassing the serverless-capped pool (`DB_POOL_MAX`, default small) and risking Neon connection exhaustion under fan-out.

**Why:** each serverless instance already opens one capped pool; a second uncapped pool per instance multiplies connections.

**How to apply:** export the single `pool` from the db lib and reuse it for both Drizzle and the session store.
