import "./src/load-env";
import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env in the project root " +
      "and set DATABASE_URL (see README), then run `npm run setup` again.",
  );
}

export default defineConfig({
  // Relative glob (resolved from this package dir / cwd) — ESM-safe, no
  // __dirname, and works identically on Windows, macOS and Linux.
  schema: "./src/schema/*.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
