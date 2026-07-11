/**
 * LOCAL DEVELOPMENT server entry.
 *
 * This starts a normal Express listener so the API can run on a developer's
 * machine (Windows / macOS / Linux) with `npm run dev`.
 *
 * In production on Vercel this file is NOT used — the Express app is served as a
 * serverless function via `api/[[...path]].ts` instead (no `server.listen`).
 */
import { createServer } from "http";
import path from "path";
import express from "express";
import app from "./app";
import { logger } from "./lib/logger";
import { startAlertsScheduler } from "./jobs/alerts-job";

// PORT defaults to 8080 (the documented local API port) for a zero-config start.
// Use API_PORT env if defined, otherwise fall back to PORT or 8080.
const rawPort = process.env["API_PORT"] ?? process.env["PORT"] ?? "8080";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

/**
 * Optional: serve the built frontend from this same Express process so the whole
 * app runs from a single origin locally (mirrors how Vercel serves it). Enable
 * with SERVE_CLIENT=true after `npm run build`. Never used on Vercel itself.
 */
if (process.env["SERVE_CLIENT"] === "true") {
  const clientDir = path.resolve(
    process.cwd(),
    "artifacts/agroguard/dist/public",
  );
  app.use(express.static(clientDir));
  // SPA fallback: anything that is not an /api route returns index.html.
  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      next();
      return;
    }
    res.sendFile(path.join(clientDir, "index.html"));
  });
}

const server = app.listen(port, () => {
  logger.info(`AgroGuard API server started and listening on port ${port}`);
});

// Start background jobs
startAlertsScheduler();
logger.info("Background jobs initialized.");
