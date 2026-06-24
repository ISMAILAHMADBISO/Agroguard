/**
 * Device routes — IoT device registration and management.
 * RBAC: field_officers see only devices belonging to their farmers.
 */
import { Router, type IRouter } from "express";
import { eq, desc, inArray } from "drizzle-orm";
import { db, devicesTable, sensorReadingsTable, farmersTable } from "@workspace/db";
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
import { getAssignedFarmerIds, canWrite, isAdmin } from "../lib/rbac";
import { syncDeviceStatuses } from "../lib/device-status";

const router: IRouter = Router();

/** GET /devices — list devices (scoped by role) */
router.get("/devices", async (req, res): Promise<void> => {
  await syncDeviceStatuses(db);
  const assignedIds = await getAssignedFarmerIds(req);

  const devices = await db
    .select()
    .from(devicesTable)
    .where(
      assignedIds !== null
        ? inArray(devicesTable.farmerId, assignedIds.length ? assignedIds : [-1])
        : undefined,
    )
    .orderBy(devicesTable.createdAt);

  res.json(ListDevicesResponse.parse(devices));
});

/** POST /devices — register a new IoT device (admin/agronomist) */
router.post("/devices", async (req, res): Promise<void> => {
  if (!canWrite(req)) {
    res.status(403).json({ error: "Insufficient permissions" });
    return;
  }

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
  await syncDeviceStatuses(db);
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

  // Scoped users (staff / farmer): device must belong to one of their farmers.
  // Unassigned devices (farmerId === null) are never visible to scoped users.
  const assignedIds = await getAssignedFarmerIds(req);
  if (
    assignedIds !== null &&
    (device.farmerId === null || !assignedIds.includes(device.farmerId))
  ) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  res.json(GetDeviceResponse.parse(device));
});

/** PATCH /devices/:id — update device or assign to farmer */
router.patch("/devices/:id", async (req, res): Promise<void> => {
  if (!canWrite(req)) {
    res.status(403).json({ error: "Insufficient permissions" });
    return;
  }

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

/** DELETE /devices/:id — remove a device (admin only) */
router.delete("/devices/:id", async (req, res): Promise<void> => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: "Admin access required" });
    return;
  }

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

/** GET /devices/:id/readings — last 50 sensor readings for a device */
router.get("/devices/:id/readings", async (req, res): Promise<void> => {
  await syncDeviceStatuses(db);
  const params = GetDeviceReadingsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  // For field officers: confirm device belongs to their farmer
  const assignedIds = await getAssignedFarmerIds(req);
  if (assignedIds !== null) {
    const [device] = await db
      .select({ farmerId: devicesTable.farmerId })
      .from(devicesTable)
      .where(eq(devicesTable.id, params.data.id));
    if (
      !device ||
      device.farmerId === null ||
      !assignedIds.includes(device.farmerId)
    ) {
      res.status(403).json({ error: "Access denied" });
      return;
    }
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
