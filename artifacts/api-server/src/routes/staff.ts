/**
 * Staff routes — platform staff management.
 * Roles: admin, agronomist, field_officer, support.
 */
import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, staffTable } from "@workspace/db";
import {
  CreateStaffBody,
  UpdateStaffBody,
  UpdateStaffParams,
  DeleteStaffParams,
  ListStaffResponse,
  UpdateStaffResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

/** GET /staff — list all staff members */
router.get("/staff", async (_req, res): Promise<void> => {
  const staff = await db
    .select()
    .from(staffTable)
    .orderBy(staffTable.createdAt);
  res.json(ListStaffResponse.parse(staff));
});

/** POST /staff — create a staff member */
router.post("/staff", async (req, res): Promise<void> => {
  const parsed = CreateStaffBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [member] = await db
    .insert(staffTable)
    .values({ ...parsed.data, status: "active" })
    .returning();

  res.status(201).json(member);
});

/** PATCH /staff/:id — update staff member details or status */
router.patch("/staff/:id", async (req, res): Promise<void> => {
  const params = UpdateStaffParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateStaffBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [member] = await db
    .update(staffTable)
    .set(parsed.data)
    .where(eq(staffTable.id, params.data.id))
    .returning();

  if (!member) {
    res.status(404).json({ error: "Staff member not found" });
    return;
  }

  res.json(UpdateStaffResponse.parse(member));
});

/** DELETE /staff/:id — remove a staff member */
router.delete("/staff/:id", async (req, res): Promise<void> => {
  const params = DeleteStaffParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [member] = await db
    .delete(staffTable)
    .where(eq(staffTable.id, params.data.id))
    .returning();

  if (!member) {
    res.status(404).json({ error: "Staff member not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
