import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

// On Replit the workflow injects PORT/BASE_PATH. Locally they are usually unset,
// so we fall back to sensible defaults for a zero-config `npm run dev`.
const rawPort = process.env.PORT ?? "5173";

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH ?? "/";

// True only on Replit. Locally we proxy /api to the backend so the frontend and
// API share an origin (required for cookie-based auth); on Replit the shared
// reverse proxy already routes /api, so we must NOT add a Vite proxy there.
const isReplit =
  process.env.REPL_ID !== undefined ||
  process.env.REPLIT_DEV_DOMAIN !== undefined;

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
    },
    // Local dev only: forward /api to the Express backend so the browser sees a
    // single origin (cookie auth works). Skipped on Replit (shared proxy handles it).
    ...(isReplit
      ? {}
      : {
          proxy: {
            "/api": {
              target: "http://localhost:8080",
              changeOrigin: false,
              ws: true,
            },
          },
        }),
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
