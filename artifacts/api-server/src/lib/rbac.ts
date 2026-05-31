/**
 * Role-based access control helpers.
 *
 * Roles:
 *   admin        — full access, all data
 *   agronomist   — full read, can create recommendations/resolve alerts
 *   support      — full read-only
 *   field_officer — sees only their assigned farmers (fieldOfficerId = userId)
 */
import type { Request } from "express";
import { eq } from "drizzle-orm";
import { db, farmersTable } from "@workspace/db";

/** Returns true if the session user can see all data (not filtered by assignment). */
export function canSeeAll(req: Request): boolean {
  return req.session.userRole !== "field_officer";
}

/**
 * For field_officer sessions, returns an array of farmer IDs they are assigned to.
 * For all other roles returns null (meaning: no filter — see everything).
 */
export async function getAssignedFarmerIds(
  req: Request,
): Promise<number[] | null> {
  if (canSeeAll(req)) return null;

  const rows = await db
    .select({ id: farmersTable.id })
    .from(farmersTable)
    .where(eq(farmersTable.fieldOfficerId, req.session.userId!));

  return rows.map((r) => r.id);
}

/** Returns true if the role can mutate data (create/update/delete). */
export function canWrite(req: Request): boolean {
  return req.session.userRole === "admin" || req.session.userRole === "agronomist";
}

/** Admin-only check. */
export function isAdmin(req: Request): boolean {
  return req.session.userRole === "admin";
}
