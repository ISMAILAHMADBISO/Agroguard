/**
 * Automatic .env loader (side-effect import).
 *
 * The whole project keeps a single .env at the monorepo ROOT. But npm/pnpm run
 * workspace scripts with the cwd set to the workspace folder (e.g. lib/db or
 * scripts), so a plain `dotenv` call (which only looks in cwd) would never find
 * it. This walks UP from the current working directory until it finds a .env and
 * loads that one — so `npm run setup`, `drizzle-kit push`, the seed script and
 * the API server all pick up the same root .env on Windows, macOS and Linux
 * without anyone exporting variables by hand.
 *
 * It is ESM-safe (no __dirname) and idempotent. dotenv does NOT override
 * variables that are already set, so hosted environments (Replit, Vercel) that
 * inject real env vars are unaffected even if a .env happens to be present.
 */
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { config as loadDotenv } from "dotenv";

// Files that mark the monorepo root. We never search above the directory that
// contains one of these, so a stray .env in some unrelated parent folder can
// never be picked up when the project's own .env is missing.
const ROOT_MARKERS = ["pnpm-workspace.yaml", ".git"];

function findEnvFile(): string | undefined {
  let dir = process.cwd();
  // Walk up a bounded number of levels to reach the monorepo root.
  for (let i = 0; i < 10; i++) {
    const candidate = join(dir, ".env");
    if (existsSync(candidate)) return candidate;
    // Stop once we reach the repo root, even if it has no .env yet.
    if (ROOT_MARKERS.some((m) => existsSync(join(dir, m)))) break;
    const parent = dirname(dir);
    if (parent === dir) break; // reached filesystem root
    dir = parent;
  }
  return undefined;
}

const envFile = findEnvFile();
if (envFile) {
  loadDotenv({ path: envFile });
} else {
  // Fall back to dotenv's default lookup (cwd); harmless if no file exists.
  loadDotenv();
}
