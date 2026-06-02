/**
 * Role-based access control helpers.
 *
 * Staff roles (userType = "staff"):
 *   super_admin  — full access, all data, manages all staff
 *   admin        — full access, all data, manages staff
 *   agronomist   — full read, can create recommendations / resolve alerts
 *   staff        — sees only their assigned farmers (fieldOfficerId = userId)
 *
 * Farmer role (userType = "farmer"):
 *   farmer       — sees only their own farmer record and related data
 */
import type { Request } from "express";
import { eq } from "drizzle-orm";
import { db, farmersTable } from "@workspace/db";

/** Returns true if the session user can see all data (not filtered by assignment). */
export function canSeeAll(req: Request): boolean {
  const role = req.session.userRole;
  return role === "super_admin" || role === "admin" || role === "agronomist";
}

/**
 * Returns the farmer IDs the current session is scoped to, or null for full access.
 *  - super_admin / admin / agronomist → null (see everything)
 *  - staff → the farmers assigned to them (fieldOfficerId = userId)
 *  - farmer → only their own farmer record
 */
export async function getAssignedFarmerIds(
  req: Request,
): Promise<number[] | null> {
  if (canSeeAll(req)) return null;

  // Farmer accounts can only ever see their own record.
  if (req.session.userType === "farmer") {
    return [req.session.userId!];
  }

  // Scoped staff: only their assigned farmers.
  const rows = await db
    .select({ id: farmersTable.id })
    .from(farmersTable)
    .where(eq(farmersTable.fieldOfficerId, req.session.userId!));

  return rows.map((r) => r.id);
}

/** Returns true if the role can mutate data (create/update/delete). */
export function canWrite(req: Request): boolean {
  const role = req.session.userRole;
  return role === "super_admin" || role === "admin" || role === "agronomist";
}

/** Admin-level check (super_admin or admin). */
export function isAdmin(req: Request): boolean {
  return req.session.userRole === "super_admin" || req.session.userRole === "admin";
}

/** Highest-privilege check. */
export function isSuperAdmin(req: Request): boolean {
  return req.session.userRole === "super_admin";
}

/** True when the session belongs to an internal staff account (not a farmer). */
export function isStaffType(req: Request): boolean {
  return req.session.userType === "staff";
}

/**
 * Middleware: restrict a route to internal staff accounts only.
 * Blocks farmer logins from platform-wide surfaces (dashboard, readings, staff directory).
 */
export function requireStaffType(
  req: Request,
  res: import("express").Response,
  next: import("express").NextFunction,
): void {
  if (req.session.userType !== "staff") {
    res.status(403).json({ error: "Staff access required" });
    return;
  }
  next();
}

/**
 * True when the current session may access (read or write) the given farmer's data.
 *  - canSeeAll roles → always true
 *  - scoped staff → only their assigned farmers
 *  - farmer → only their own record
 */
export async function canAccessFarmer(
  req: Request,
  farmerId: number | null | undefined,
): Promise<boolean> {
  if (canSeeAll(req)) return true;
  if (farmerId == null) return false;
  const assignedIds = await getAssignedFarmerIds(req);
  if (assignedIds === null) return true;
  return assignedIds.includes(farmerId);
}
