/**
 * Sensor readings routes — data ingestion from ESP32 IoT devices.
 * The POST endpoint is called directly by field sensors.
 * Device status is updated on each reading.
 */
import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, sensorReadingsTable, devicesTable } from "@workspace/db";
import {
  CreateReadingBody,
  ListReadingsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

/** GET /readings — list the most recent sensor readings across all devices */
router.get("/readings", async (_req, res): Promise<void> => {
  const readings = await db
    .select()
    .from(sensorReadingsTable)
    .orderBy(desc(sensorReadingsTable.recordedAt))
    .limit(100);
  res.json(ListReadingsResponse.parse(readings));
});

/**
 * POST /readings — ingest sensor data from an ESP32 device.
 * Accepts deviceId (hardware ID string) and sensor values.
 * Updates the device's lastSeenAt and status to "online".
 */
router.post("/readings", async (req, res): Promise<void> => {
  const parsed = CreateReadingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Resolve hardware deviceId string to internal DB device ID
  const [device] = await db
    .select()
    .from(devicesTable)
    .where(eq(devicesTable.deviceId, parsed.data.deviceId));

  if (!device) {
    res.status(404).json({ error: "Device not found — register it first" });
    return;
  }

  // Insert the sensor reading
  const [reading] = await db
    .insert(sensorReadingsTable)
    .values({
      deviceId: device.id,
      soilMoisture: parsed.data.soilMoisture,
      temperature: parsed.data.temperature,
      humidity: parsed.data.humidity,
      heatIndex: parsed.data.heatIndex,
      rainfall: parsed.data.rainfall ?? null,
      lightIntensity: parsed.data.lightIntensity ?? null,
      recordedAt: new Date(),
    })
    .returning();

  // Update device status and last seen timestamp
  await db
    .update(devicesTable)
    .set({ status: "online", lastSeenAt: new Date() })
    .where(eq(devicesTable.id, device.id));

  res.status(201).json(reading);
});

export default router;
