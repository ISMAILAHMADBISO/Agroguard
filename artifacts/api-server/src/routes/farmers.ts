/**
 * Farmer routes — CRUD for AgroGuard farmer accounts.
 * Farmers are created by admin and linked to one or more IoT devices.
 */
import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
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

const router: IRouter = Router();

/** GET /farmers — list all farmers */
router.get("/farmers", async (_req, res): Promise<void> => {
  const farmers = await db
    .select()
    .from(farmersTable)
    .orderBy(farmersTable.createdAt);
  res.json(ListFarmersResponse.parse(farmers));
});

/** POST /farmers — create a new farmer account */
router.post("/farmers", async (req, res): Promise<void> => {
  const parsed = CreateFarmerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [farmer] = await db
    .insert(farmersTable)
    .values({ ...parsed.data, status: "active" })
    .returning();

  res.status(201).json(GetFarmerResponse.parse(farmer));
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

  res.json(GetFarmerResponse.parse(farmer));
});

/** PATCH /farmers/:id — update farmer details */
router.patch("/farmers/:id", async (req, res): Promise<void> => {
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

/** DELETE /farmers/:id — delete farmer */
router.delete("/farmers/:id", async (req, res): Promise<void> => {
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

  const devices = await db
    .select()
    .from(devicesTable)
    .where(eq(devicesTable.farmerId, params.data.id))
    .orderBy(devicesTable.createdAt);

  res.json(GetFarmerDevicesResponse.parse(devices));
});

export default router;
