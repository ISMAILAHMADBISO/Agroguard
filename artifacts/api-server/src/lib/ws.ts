/**
 * WebSocket server — real-time sensor reading broadcast.
 * Clients subscribe to a specific deviceId and receive live readings.
 */
import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";

interface SubscribedWebSocket extends WebSocket {
  subscribedDeviceId?: number;
}

let wss: WebSocketServer | null = null;

export function initWebSocket(server: Server): void {
  wss = new WebSocketServer({ server, path: "/api/ws" });

  wss.on("connection", (ws: SubscribedWebSocket) => {
    ws.on("message", (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString()) as { type: string; deviceId?: number };
        if (msg.type === "subscribe" && msg.deviceId) {
          ws.subscribedDeviceId = msg.deviceId;
          ws.send(JSON.stringify({ type: "subscribed", deviceId: msg.deviceId }));
        }
      } catch {
        // ignore malformed messages
      }
    });

    ws.send(JSON.stringify({ type: "connected" }));
  });
}

/**
 * Broadcast a new reading to all connected WS clients.
 * If a client has subscribed to a specific device, only send to that device's subscribers.
 * Clients with no subscription receive all readings.
 */
export function broadcastReading(deviceId: number, reading: unknown): void {
  if (!wss) return;

  const payload = JSON.stringify({ type: "reading", deviceId, data: reading });

  wss.clients.forEach((client) => {
    const ws = client as SubscribedWebSocket;
    if (ws.readyState !== WebSocket.OPEN) return;
    const sub = ws.subscribedDeviceId;
    if (sub === undefined || sub === deviceId) {
      ws.send(payload);
    }
  });
}
