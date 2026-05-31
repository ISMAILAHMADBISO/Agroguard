/**
 * Auth middleware — protect all API routes except:
 *  - POST /readings  (ESP32 device ingestion — no user auth)
 *  - /auth/*         (login / logout / me)
 *  - /healthz        (infra health check)
 */
import type { Request, Response, NextFunction } from "express";

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const path = req.path;

  if (
    path === "/healthz" ||
    path.startsWith("/auth/") ||
    (req.method === "POST" && path === "/readings")
  ) {
    next();
    return;
  }

  if (!req.session.userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  next();
}
