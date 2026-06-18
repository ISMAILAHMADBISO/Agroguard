/**
 * Role-based access control helpers.
 *
 * Staff roles (userType = "staff"):
 *   super_admin  — full access, all data, manages all staff
 *   admin        — full access, all data, manages staff
 *   agronomist   — full read/write, can create recommendations / resolve alerts
 *   staff        — full read/write of all farmers & devices; may create staff
 *                  (but not admin/super_admin); no destructive/admin surfaces
 *
 * Farmer role (userType = "farmer"):
 *   farmer       — sees only their own farmer record and related data
 */
import type { Request } from "express";

/**
 * Returns true if the session user can see all data (not filtered by assignment).
 * All internal staff roles (super_admin, admin, agronomist, staff) see every
 * farmer and device so that self-registered farmers appear immediately for
 * management. Only farmer accounts (userType "farmer") remain scoped to their
 * own record — see getAssignedFarmerIds.
 */
export function canSeeAll(req: Request): boolean {
  const role = req.session.userRole;
  return (
    role === "super_admin" ||
    role === "admin" ||
    role === "agronomist" ||
    role === "staff"
  );
}

/**
 * Returns the farmer IDs the current session is scoped to, or null for full access.
 *  - all internal staff roles (super_admin / admin / agronomist / staff) → null (see everything)
 *  - farmer → only their own farmer record
 */
export async function getAssignedFarmerIds(
  req: Request,
): Promise<number[] | null> {
  if (canSeeAll(req)) return null;

  // Only farmer accounts remain scoped — to their own record.
  if (req.session.userType === "farmer") {
    return [req.session.userId!];
  }

  // Fallback: any other (non-staff, non-farmer) session sees nothing.
  return [];
}

/**
 * Returns true if the role can mutate data (create/update farmers & devices).
 * All internal staff roles may manage farmers and devices; farmer accounts may
 * not. Destructive actions (delete) and admin-only surfaces still use isAdmin.
 */
export function canWrite(req: Request): boolean {
  return req.session.userType === "staff";
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
 *  - canSeeAll roles (all internal staff) → always true
 *  - farmer → only their own record
 */
export async function canAccessFarmer(
  req: Request,
  farmerId: number | null | undefined,
): Promise<boolean> {
  if (canSeeAll(req)) return true;
  // A null/undefined farmerId means the caller hasn't tied the action to a
  // specific farmer (e.g. disease detection without specifying a farm).
  // Allow it — no farmer-level scope is needed to check.
  if (farmerId == null) return true;
  const assignedIds = await getAssignedFarmerIds(req);
  if (assignedIds === null) return true;
  return assignedIds.includes(farmerId);
}
