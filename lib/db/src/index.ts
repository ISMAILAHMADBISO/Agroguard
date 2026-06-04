import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// `max` is kept small because on serverless (Vercel + Neon) many concurrent
// function instances each open their own pool; a large per-instance pool would
// quickly exhaust the database's connection limit. Neon's pooled connection
// string (…-pooler.…) handles fan-out on top of this. Override via DB_POOL_MAX.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.DB_POOL_MAX ?? 3),
});
export const db = drizzle(pool, { schema });

export * from "./schema";
