/**
 * Farmer routes — CRUD for AgroGuard farmer accounts.
 * RBAC: field_officers see only their assigned farmers.
 *       admins / agronomists / support see all.
 */
import { Router, type IRouter } from "express";
import { eq, inArray } from "drizzle-orm";
import { db, farmersTable, devicesTable } from "@workspace/db";
import {
  CreateFarmerBody,
  UpdateFarmerBody,
  UpdateFarmerParams,
  GetFarmerParams,
  DeleteFarmerParams,
  GetFarmerDevicesParams,
  ListFarmersResponse,
  GetFarmerResponse,
  UpdateFarmerResponse,
  GetFarmerDevicesResponse,
} from "@workspace/api-zod";
import { getAssignedFarmerIds, canWrite, isAdmin } from "../lib/rbac";
import { generateTempPassword, hashPassword } from "../lib/password";

const router: IRouter = Router();

/** GET /farmers — list farmers (scoped by role) */
router.get("/farmers", async (req, res): Promise<void> => {
  const assignedIds = await getAssignedFarmerIds(req);

  const farmers = await db
    .select()
    .from(farmersTable)
    .where(assignedIds !== null ? inArray(farmersTable.id, assignedIds.length ? assignedIds : [-1]) : undefined)
    .orderBy(farmersTable.createdAt);

  res.json(ListFarmersResponse.parse(farmers));
});

/** POST /farmers — create a new farmer account (admin/agronomist only) */
router.post("/farmers", async (req, res): Promise<void> => {
  if (!canWrite(req)) {
    res.status(403).json({ error: "Insufficient permissions" });
    return;
  }

  const parsed = CreateFarmerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  const [farmer] = await db
    .insert(farmersTable)
    .values({
      ...parsed.data,
      status: "active",
      passwordHash,
      mustChangePassword: true,
    })
    .returning();

  res.status(201).json({
    id: farmer.id,
    name: farmer.name,
    email: farmer.email,
    phone: farmer.phone,
    location: farmer.location,
    farmName: farmer.farmName,
    farmSizeHectares: farmer.farmSizeHectares,
    cropTypes: farmer.cropTypes,
    status: farmer.status,
    whatsappNumber: farmer.whatsappNumber,
    notes: farmer.notes,
    fieldOfficerId: farmer.fieldOfficerId,
    createdAt: farmer.createdAt,
    tempPassword,
  });
});

/** GET /farmers/:id — get single farmer */
router.get("/farmers/:id", async (req, res): Promise<void> => {
  const params = GetFarmerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [farmer] = await db
    .select()
    .from(farmersTable)
    .where(eq(farmersTable.id, params.data.id));

  if (!farmer) {
    res.status(404).json({ error: "Farmer not found" });
    return;
  }

  // Field officers can only access their assigned farmers
  const assignedIds = await getAssignedFarmerIds(req);
  if (assignedIds !== null && !assignedIds.includes(farmer.id)) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  res.json(GetFarmerResponse.parse(farmer));
});

/** PATCH /farmers/:id — update farmer details */
router.patch("/farmers/:id", async (req, res): Promise<void> => {
  if (!canWrite(req)) {
    res.status(403).json({ error: "Insufficient permissions" });
    return;
  }

  const params = UpdateFarmerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateFarmerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [farmer] = await db
    .update(farmersTable)
    .set(parsed.data)
    .where(eq(farmersTable.id, params.data.id))
    .returning();

  if (!farmer) {
    res.status(404).json({ error: "Farmer not found" });
    return;
  }

  res.json(UpdateFarmerResponse.parse(farmer));
});

/** DELETE /farmers/:id — delete farmer (admin only) */
router.delete("/farmers/:id", async (req, res): Promise<void> => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: "Admin access required" });
    return;
  }

  const params = DeleteFarmerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [farmer] = await db
    .delete(farmersTable)
    .where(eq(farmersTable.id, params.data.id))
    .returning();

  if (!farmer) {
    res.status(404).json({ error: "Farmer not found" });
    return;
  }

  res.sendStatus(204);
});

/** GET /farmers/:id/devices — get all devices assigned to a farmer */
router.get("/farmers/:id/devices", async (req, res): Promise<void> => {
  const params = GetFarmerDevicesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const assignedIds = await getAssignedFarmerIds(req);
  if (assignedIds !== null && !assignedIds.includes(params.data.id)) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  const devices = await db
    .select()
    .from(devicesTable)
    .where(eq(devicesTable.farmerId, params.data.id))
    .orderBy(devicesTable.createdAt);

  res.json(GetFarmerDevicesResponse.parse(devices));
});

export default router;
