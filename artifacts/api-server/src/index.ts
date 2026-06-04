import { createServer } from "http";
import app from "./app";
import { initWebSocket } from "./lib/ws";
import { logger } from "./lib/logger";

// On Replit the workflow injects PORT. Locally it is usually unset, so we
// fall back to 8080 (the documented local API port) for a zero-config start.
const rawPort = process.env["PORT"] ?? "8080";

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const server = createServer(app);

initWebSocket(server);

server.listen(port, () => {
  logger.info({ port }, "Server listening");
});
