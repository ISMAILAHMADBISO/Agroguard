---
name: WebSocket path must be under /api for Replit proxy routing
description: WS server path must be /api/ws so the shared Replit reverse proxy routes it to the API server
---

## Rule
The `WebSocketServer` must be initialized with `path: "/api/ws"` so that WebSocket upgrade requests at `/api/ws` are routed to the API server (port 8080) by the Replit shared proxy. Using path `/ws` would route to the frontend Vite server instead.

**Why:** The Replit shared proxy routes paths most-specific-first. `/api` routes to the API server (port 8080), `/` routes to the frontend. WebSocket upgrades follow the same path-based routing as HTTP.

**How to apply:** Always use `/api/ws` as the WebSocket server path. Frontend connects via:
```js
const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
const ws = new WebSocket(`${proto}//${location.host}/api/ws`);
```
