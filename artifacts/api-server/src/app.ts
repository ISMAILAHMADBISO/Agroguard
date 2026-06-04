import "./lib/config";
import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "@workspace/db";
import router from "./routes";
import { logger } from "./lib/logger";
import { requireAuth } from "./middleware/auth";
import { SESSION_COOKIE_NAME, SESSION_SECRET } from "./lib/session-token";

const PgStore = connectPg(session);

/**
 * Trusted browser origins for credentialed (cookie-bearing) requests.
 *
 * On Vercel the frontend and the API are served from the SAME origin, so that
 * origin must be allowlisted (the CSRF guard below rejects state-changing
 * requests from any other origin). We build the list from environment so it
 * works on any host without hard-coding domains:
 *   - APP_URL / ALLOWED_ORIGINS  → your production + custom domains (recommended)
 *   - VERCEL_*                    → auto-injected on Vercel deployments
 *   - REPLIT_*                    → present only when running on Replit
 *   - localhost                  → always allowed for local development
 */
function getAllowedOrigins(): string[] {
  const origins = new Set<string>();

  const add = (value?: string | null): void => {
    if (!value) return;
    const trimmed = value.trim();
    if (!trimmed) return;
    const normalized = /^https?:\/\//.test(trimmed)
      ? trimmed.replace(/\/+$/, "")
      : `https://${trimmed.replace(/\/+$/, "")}`;
    origins.add(normalized);
  };

  // Explicit, operator-controlled origins (set these in production).
  add(process.env["APP_URL"]);
  for (const o of (process.env["ALLOWED_ORIGINS"] ?? "").split(",")) add(o);

  // Vercel-provided deployment URLs (no protocol → https is added).
  add(process.env["VERCEL_PROJECT_PRODUCTION_URL"]);
  add(process.env["VERCEL_URL"]);
  add(process.env["VERCEL_BRANCH_URL"]);

  // Replit domains (only present when running on Replit).
  add(process.env["REPLIT_DEV_DOMAIN"]);
  for (const d of (process.env["REPLIT_DOMAINS"] ?? "").split(",")) add(d);

  // Local development fallbacks (Vite dev server + API).
  origins.add("http://localhost:5173");
  origins.add("http://127.0.0.1:5173");
  origins.add("http://localhost:8080");

  return [...origins];
}

const allowedOrigins = getAllowedOrigins();

/**
 * Cookies must be Secure in production (served over HTTPS on Vercel) and
 * non-Secure locally (plain HTTP on localhost) or the browser drops them.
 * On Vercel the frontend and API share an origin, so SameSite=Lax is enough.
 */
const isProduction = process.env.NODE_ENV === "production";

const app: Express = express();

app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(
  cors({
    origin(origin, cb) {
      // Allow non-browser clients (no Origin header) such as the ESP32 firmware
      // and same-origin requests; otherwise require an allowlisted origin.
      if (!origin || allowedOrigins.includes(origin)) {
        cb(null, true);
        return;
      }
      cb(null, false);
    },
    credentials: true,
  }),
);
// 8mb limit accommodates base64-encoded crop photos sent to the AI endpoints.
// (The frontend downscales images before upload; Vercel caps request bodies at
// ~4.5mb, so keep production uploads well under that.)
app.use(express.json({ limit: "8mb" }));
app.use(express.urlencoded({ extended: true, limit: "8mb" }));

/**
 * Bearer-token → session-cookie bridge.
 *
 * When the app runs inside a cross-site iframe (e.g. the Replit workspace
 * preview), the browser blocks the third-party session cookie, so the client
 * falls back to sending the signed session token as `Authorization: Bearer`.
 * Here we inject that token as the session cookie BEFORE express-session runs,
 * so the existing PostgreSQL session store resolves it exactly like a real
 * cookie. We only inject when no genuine session cookie is already present.
 * (On Vercel, normal same-origin cookies are used and this is a no-op.)
 */
function bearerToCookie(req: Request, _res: Response, next: NextFunction): void {
  const auth = req.get("authorization");
  if (auth && auth.startsWith("Bearer ")) {
    const token = auth.slice(7).trim();
    const existing = req.headers.cookie;
    const hasSessionCookie =
      !!existing && existing.includes(`${SESSION_COOKIE_NAME}=`);
    if (token && !hasSessionCookie) {
      const injected = `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`;
      req.headers.cookie = existing ? `${existing}; ${injected}` : injected;
    }
  }
  next();
}

app.use(bearerToCookie);

app.use(
  session({
    store: new PgStore({
      // Reuse the shared @workspace/db pool instead of opening a second pool.
      // connect-pg-simple's default conString pool (max ~10) would bypass our
      // serverless-safe DB_POOL_MAX cap and risk exhausting Neon connections.
      pool,
      tableName: "user_sessions",
    }),
    name: SESSION_COOKIE_NAME,
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  }),
);

/**
 * CSRF protection for state-changing requests.
 * We reject any browser request that carries a non-allowlisted Origin/Referer.
 * Requests with no Origin and no Referer are non-browser clients (e.g. the
 * ESP32 firmware posting readings) and cannot be CSRF vectors, so they pass.
 */
function csrfGuard(req: Request, res: Response, next: NextFunction): void {
  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    next();
    return;
  }

  const origin = req.get("origin");
  const referer = req.get("referer");
  let source: string | null = origin ?? null;
  if (!source && referer) {
    try {
      source = new URL(referer).origin;
    } catch {
      source = null;
    }
  }

  if (source === null || allowedOrigins.includes(source)) {
    next();
    return;
  }

  res.status(403).json({ error: "Cross-site request blocked" });
}

app.use("/api", csrfGuard, requireAuth, router);

export default app;
