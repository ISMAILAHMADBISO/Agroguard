---
name: IoT sensor reading ingestion pattern
description: AgroGuard POST /api/readings accepts hardware deviceId string, not DB integer ID
---

## Pattern
ESP32 devices post to `POST /api/readings` with their hardware chip ID (`deviceId` as string, e.g. "ESP32-AGG-001"). The server:
1. Looks up the device by `deviceId` string in the `devices` table
2. Inserts sensor reading with the resolved integer DB `device.id`
3. Updates `devices.status = 'online'` and `devices.last_seen_at = NOW()`

**Why:** ESP32 devices don't know their DB integer IDs — they only know their hardware chip ID burned at manufacture. The platform resolves the mapping server-side.

**How to apply:** When adding new IoT-ingestion endpoints, always resolve hardware string IDs to DB integer IDs before inserting. Return 404 if the device isn't registered.
