/// <reference path="../artifacts/api-server/src/types/session.d.ts" />
import app from "../artifacts/api-server/src/app";

// Vercel serverless function: all /api/* requests are routed here.
// maxDuration is read by Vercel at deploy time from this export.
export const config = {
  maxDuration: 60,
};

export default function handler(req: any, res: any) {
  return (app as any)(req, res);
}
