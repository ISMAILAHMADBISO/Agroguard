import app from "../artifacts/api-server/dist/app.mjs";

// Vercel serverless function config
export const config = {
  maxDuration: 60,
};

export default function handler(req, res) {
  return app(req, res);
}
