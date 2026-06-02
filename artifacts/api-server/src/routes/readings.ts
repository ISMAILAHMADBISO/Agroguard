/**
 * Sensor readings routes — data ingestion from ESP32 IoT devices.
 *
 * POST /readings  — called directly by ESP32 firmware (no auth required).
 *                   Accepts the hardware deviceId string and stores sensor data.
 *                   Supports the full 7-in-1 soil sensor payload:
 *                     moisture, temperature, EC, pH, nitrogen, phosphorus, potassium
 *                   as well as simpler sensors that only send the core 4 channels.
 *
 * GET  /readings  — returns the 100 most recent readings across all devices
 *                   (used by the analytics dashboard; requires session auth).
 */
import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, sensorReadingsTable, devicesTable } from "@workspace/db";
import {
  CreateReadingBody,
  ListReadingsResponse,
} from "@workspace/api-zod";
import { broadcastReading } from "../lib/ws";
import { isStaffType } from "../lib/rbac";

const router: IRouter = Router();

/** GET /readings — list the 100 most recent readings across all devices (internal staff only) */
router.get("/readings", async (req, res): Promise<void> => {
  if (!isStaffType(req)) {
    res.status(403).json({ error: "Staff access required" });
    return;
  }
  const readings = await db
    .select()
    .from(sensorReadingsTable)
    .orderBy(desc(sensorReadingsTable.recordedAt))
    .limit(100);
  res.json(ListReadingsResponse.parse(readings));
});

/**
 * POST /readings — ingest sensor data from an ESP32 device.
 *
 * Auth: intentionally open — the ESP32 identifies itself via deviceId.
 * The device must be registered in the platform before data is accepted.
 *
 * On success:
 *   1. Resolves the hardware deviceId string to the internal DB device ID.
 *   2. Inserts the reading (stores all 7-in-1 fields when present).
 *   3. Updates device.status → "online" and device.lastSeenAt → now.
 *   4. Broadcasts the reading over WebSocket to any subscribed dashboard clients.
 */
router.post("/readings", async (req, res): Promise<void> => {
  const parsed = CreateReadingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Resolve hardware deviceId string → internal DB integer ID
  const [device] = await db
    .select()
    .from(devicesTable)
    .where(eq(devicesTable.deviceId, parsed.data.deviceId));

  if (!device) {
    res.status(404).json({ error: "Device not found — register it first in the platform" });
    return;
  }

  // Insert the reading; 7-in-1 fields are optional (null when not provided)
  const [reading] = await db
    .insert(sensorReadingsTable)
    .values({
      deviceId: device.id,
      soilMoisture:           parsed.data.soilMoisture,
      temperature:            parsed.data.temperature,
      humidity:               parsed.data.humidity,
      heatIndex:              parsed.data.heatIndex,
      // 7-in-1 soil sensor channels (null if sensor doesn't support them)
      electricalConductivity: parsed.data.electricalConductivity ?? null,
      ph:                     parsed.data.ph ?? null,
      nitrogen:               parsed.data.nitrogen ?? null,
      phosphorus:             parsed.data.phosphorus ?? null,
      potassium:              parsed.data.potassium ?? null,
      // Optional environmental channels
      rainfall:               parsed.data.rainfall ?? null,
      lightIntensity:         parsed.data.lightIntensity ?? null,
      recordedAt: new Date(),
    })
    .returning();

  // Mark device online with a fresh timestamp
  await db
    .update(devicesTable)
    .set({ status: "online", lastSeenAt: new Date() })
    .where(eq(devicesTable.id, device.id));

  // Push to WebSocket subscribers (device-detail live view)
  broadcastReading(device.id, reading);

  res.status(201).json(reading);
});

export default router;
