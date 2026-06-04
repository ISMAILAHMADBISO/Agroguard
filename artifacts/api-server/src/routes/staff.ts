/**
 * Staff routes — platform staff management.
 * Roles: super_admin, admin, agronomist, staff.
 * Mutations are restricted to admin-level users (super_admin / admin).
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
import { isAdmin, isStaffType } from "../lib/rbac";
import { generateTempPassword, hashPassword } from "../lib/password";

const router: IRouter = Router();

/** GET /staff — list all staff members (internal staff only, never farmers) */
router.get("/staff", async (req, res): Promise<void> => {
  if (!isStaffType(req)) {
    res.status(403).json({ error: "Staff access required" });
    return;
  }
  const staff = await db
    .select()
    .from(staffTable)
    .orderBy(staffTable.createdAt);
  res.json(ListStaffResponse.parse(staff));
});

/**
 * POST /staff — create a staff member.
 * Any internal staff account may create staff, but only admin-level users
 * (super_admin / admin) may grant admin or super_admin roles. This prevents a
 * lower-privilege staff member from escalating their own access.
 */
router.post("/staff", async (req, res): Promise<void> => {
  if (!isStaffType(req)) {
    res.status(403).json({ error: "Staff access required" });
    return;
  }

  const parsed = CreateStaffBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const requestedRole = parsed.data.role;
  if ((requestedRole === "admin" || requestedRole === "super_admin") && !isAdmin(req)) {
    res
      .status(403)
      .json({ error: "Only an admin can create admin or super admin accounts" });
    return;
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  const [member] = await db
    .insert(staffTable)
    .values({
      ...parsed.data,
      status: "active",
      passwordHash,
      mustChangePassword: true,
    })
    .returning();

  res.status(201).json({
    id: member.id,
    name: member.name,
    email: member.email,
    phone: member.phone,
    role: member.role,
    status: member.status,
    department: member.department,
    createdAt: member.createdAt,
    tempPassword,
  });
});

/** PATCH /staff/:id — update staff member details or status (admin only) */
router.patch("/staff/:id", async (req, res): Promise<void> => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: "Admin access required" });
    return;
  }

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

/** DELETE /staff/:id — remove a staff member (admin only) */
router.delete("/staff/:id", async (req, res): Promise<void> => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: "Admin access required" });
    return;
  }

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
