/**
 * Device routes — IoT device registration and management.
 * Devices are ESP32-based sensors assigned to farmers.
 */
import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, devicesTable, sensorReadingsTable } from "@workspace/db";
import {
  CreateDeviceBody,
  UpdateDeviceBody,
  UpdateDeviceParams,
  GetDeviceParams,
  DeleteDeviceParams,
  GetDeviceReadingsParams,
  ListDevicesResponse,
  GetDeviceResponse,
  UpdateDeviceResponse,
  GetDeviceReadingsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

/** GET /devices — list all registered IoT devices */
router.get("/devices", async (_req, res): Promise<void> => {
  const devices = await db
    .select()
    .from(devicesTable)
    .orderBy(devicesTable.createdAt);
  res.json(ListDevicesResponse.parse(devices));
});

/** POST /devices — register a new IoT device */
router.post("/devices", async (req, res): Promise<void> => {
  const parsed = CreateDeviceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [device] = await db
    .insert(devicesTable)
    .values(parsed.data)
    .returning();

  res.status(201).json(GetDeviceResponse.parse(device));
});

/** GET /devices/:id — get single device */
router.get("/devices/:id", async (req, res): Promise<void> => {
  const params = GetDeviceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [device] = await db
    .select()
    .from(devicesTable)
    .where(eq(devicesTable.id, params.data.id));

  if (!device) {
    res.status(404).json({ error: "Device not found" });
    return;
  }

  res.json(GetDeviceResponse.parse(device));
});

/** PATCH /devices/:id — update device or assign to farmer */
router.patch("/devices/:id", async (req, res): Promise<void> => {
  const params = UpdateDeviceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateDeviceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [device] = await db
    .update(devicesTable)
    .set(parsed.data)
    .where(eq(devicesTable.id, params.data.id))
    .returning();

  if (!device) {
    res.status(404).json({ error: "Device not found" });
    return;
  }

  res.json(UpdateDeviceResponse.parse(device));
});

/** DELETE /devices/:id — remove a device */
router.delete("/devices/:id", async (req, res): Promise<void> => {
  const params = DeleteDeviceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [device] = await db
    .delete(devicesTable)
    .where(eq(devicesTable.id, params.data.id))
    .returning();

  if (!device) {
    res.status(404).json({ error: "Device not found" });
    return;
  }

  res.sendStatus(204);
});

/** GET /devices/:id/readings — get last 50 sensor readings for a device */
router.get("/devices/:id/readings", async (req, res): Promise<void> => {
  const params = GetDeviceReadingsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const readings = await db
    .select()
    .from(sensorReadingsTable)
    .where(eq(sensorReadingsTable.deviceId, params.data.id))
    .orderBy(desc(sensorReadingsTable.recordedAt))
    .limit(50);

  res.json(GetDeviceReadingsResponse.parse(readings));
});

export default router;
