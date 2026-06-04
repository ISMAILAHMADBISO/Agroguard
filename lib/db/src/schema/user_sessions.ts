/**
 * Session store table for express-session + connect-pg-simple.
 *
 * connect-pg-simple does NOT create this table for us: its built-in
 * `createTableIfMissing` reads a packaged table.sql via __dirname at runtime,
 * which breaks once the server is bundled by esbuild (and on Vercel). So we
 * define the table here and let `drizzle-kit push` (run by `npm run setup`)
 * create it on a fresh clone. The shape MUST match what connect-pg-simple
 * expects for tableName "user_sessions": sid (PK), sess (json), expire.
 */
import { index, json, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

export const userSessions = pgTable(
  "user_sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: json("sess").notNull(),
    expire: timestamp("expire", { precision: 6, mode: "date" }).notNull(),
  },
  (table) => [index("IDX_user_sessions_expire").on(table.expire)],
);
