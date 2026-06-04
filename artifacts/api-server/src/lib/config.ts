/**
 * Startup environment validation.
 *
 * Imported for its side effect at the top of app.ts so misconfiguration is
 * caught immediately (on the first serverless cold start on Vercel, or at boot
 * locally) with a clear message, instead of failing deep inside a request.
 */
import "@workspace/db/load-env";
import { logger } from "./logger";

const isProduction = process.env.NODE_ENV === "production";

function validateEnv(): void {
  const missing: string[] = [];

  // DATABASE_URL is always required (sessions + all data live in Postgres).
  if (!process.env["DATABASE_URL"]) missing.push("DATABASE_URL");

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(", ")}. ` +
        `See .env.example for the full list.`,
    );
  }

  // SESSION_SECRET is mandatory in production; in dev we fall back to a default.
  if (!process.env["SESSION_SECRET"]) {
    if (isProduction) {
      throw new Error(
        "SESSION_SECRET must be set in production (used to sign session cookies).",
      );
    }
    logger.warn(
      "SESSION_SECRET is not set — using an insecure development default. " +
        "Set it before deploying.",
    );
  }

  // OPENAI_API_KEY is optional; AI endpoints return a clear error without it.
  if (!process.env["OPENAI_API_KEY"]) {
    logger.warn(
      "OPENAI_API_KEY is not set — AI features (disease detection, advisory " +
        "chat, recommendations) will return a clear 'AI not configured' message.",
    );
  }
}

validateEnv();
