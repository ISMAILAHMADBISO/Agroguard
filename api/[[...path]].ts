import type { VercelRequest, VercelResponse } from "@vercel/node";
import app from "../artifacts/api-server/src/app";

export const config = {
  maxDuration: 60,
};

export default function handler(req: VercelRequest, res: VercelResponse) {
  // IMPORTANT: Let Express fully handle request lifecycle
  return app(req as any, res as any);
}