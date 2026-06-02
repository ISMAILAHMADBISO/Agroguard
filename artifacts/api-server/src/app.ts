import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import session from "express-session";
import connectPg from "connect-pg-simple";
import router from "./routes";
import { logger } from "./lib/logger";
import { requireAuth } from "./middleware/auth";

const PgStore = connectPg(session);

/**
 * Trusted browser origins for credentialed (cookie-bearing) requests.
 * Derived from the Replit-provided domains so the allowlist works in both
 * the dev preview and published deployments without hard-coding hosts.
 */
function getAllowedOrigins(): string[] {
  const origins = new Set<string>();
  const dev = process.env["REPLIT_DEV_DOMAIN"];
  if (dev) origins.add(`https://${dev}`);
  const domains = process.env["REPLIT_DOMAINS"];
  if (domains) {
    for (const d of domains.split(",")) {
      const host = d.trim();
      if (host) origins.add(`https://${host}`);
    }
  }
  return [...origins];
}

const allowedOrigins = getAllowedOrigins();

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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    store: new PgStore({
      conString: process.env["DATABASE_URL"],
      tableName: "user_sessions",
    }),
    name: "agroguard.sid",
    secret: process.env["SESSION_SECRET"] || "dev-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  }),
);

/**
 * CSRF protection for state-changing requests.
 * Because session cookies are SameSite=None (required for the HTTPS iframe),
 * we reject any browser request that carries a non-allowlisted Origin/Referer.
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
