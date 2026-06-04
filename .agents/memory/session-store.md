---
name: connect-pg-simple bundling issue with esbuild
description: connect-pg-simple fails when bundled by esbuild because it can't find table.sql via __dirname
---

## Rule
Do NOT use `createTableIfMissing: true` with `connect-pg-simple` when the API server is bundled with esbuild. The package internally does `fs.readFile(path.join(__dirname, 'table.sql'))` — after bundling, `__dirname` points to `dist/` not `node_modules/connect-pg-simple/`, so the file is not found.

## Fix
1. Pre-create the session table manually via SQL before deploying:
```sql
CREATE TABLE IF NOT EXISTS user_sessions (
  sid VARCHAR NOT NULL COLLATE "default",
  sess JSON NOT NULL,
  expire TIMESTAMP(6) NOT NULL,
  CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE
);
CREATE INDEX IF NOT EXISTS "IDX_user_sessions_expire" ON "user_sessions" ("expire");
```
2. Remove `createTableIfMissing: true` from the PgStore config.

**Why:** esbuild bundles `connect-pg-simple` inline, so its internal `__dirname` becomes the bundle output dir, not its original package directory.

**How to apply:** Any time connect-pg-simple is used in a bundled server, pre-create the table and skip auto-creation.

## Rule (serverless pooling)
On serverless (Vercel + Neon), pass the **shared app DB pool** into `new PgStore({ pool })` — do NOT use `conString`. `conString` makes connect-pg-simple open its own pg pool with default `max` (~10), bypassing the serverless-capped pool (`DB_POOL_MAX`, default small) and risking Neon connection exhaustion under fan-out.

**Why:** each serverless instance already opens one capped pool; a second uncapped pool per instance multiplies connections.

**How to apply:** export the single `pool` from the db lib and reuse it for both Drizzle and the session store.
