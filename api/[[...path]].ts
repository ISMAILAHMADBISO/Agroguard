/**
 * Vercel Serverless Function — single catch-all entry for the whole API.
 *
 * The existing Express application (artifacts/api-server/src/app.ts) is exported
 * here as the request handler. The @vercel/node runtime accepts an Express app
 * directly, so every route the app defines under /api keeps working unchanged —
 * with NO long-running `server.listen()` process. This file is what makes the
 * backend run as on-demand serverless functions on Vercel.
 *
 * Local development does NOT use this file; it uses
 * artifacts/api-server/src/index.ts (a normal Express listener).
 */
import app from "../artifacts/api-server/src/app";

// Allow slower AI (gpt-4o) calls to complete. Vercel caps this per plan.
export const config = {
  maxDuration: 60,
};

export default app;
