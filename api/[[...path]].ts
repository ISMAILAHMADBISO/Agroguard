import app from "../artifacts/api-server/src/app";

/**
 * Vercel Serverless Adapter for Express
 * Keeps your existing backend unchanged
 */
export const config = {
  maxDuration: 60,
};

export default function handler(req: any, res: any) {
  return app(req, res);
}