/**
 * Alerts routes — farm alert management.
 * RBAC: field_officers see only alerts for their assigned farmers.
 */
import { Router, type IRouter } from "express";
import { eq, inArray } from "drizzle-orm";
import { db, alertsTable } from "@workspace/db";
import {
  CreateAlertBody,
  ResolveAlertParams,
  ListAlertsResponse,
  ResolveAlertResponse,
} from "@workspace/api-zod";
import { getAssignedFarmerIds, canWrite, canAccessFarmer } from "../lib/rbac";

const router: IRouter = Router();

/** GET /alerts — list alerts (scoped by role) */
router.get("/alerts", async (req, res): Promise<void> => {
  const assignedIds = await getAssignedFarmerIds(req);

  const alerts = await db
    .select()
    .from(alertsTable)
    .where(
      assignedIds !== null
        ? inArray(alertsTable.farmerId, assignedIds.length ? assignedIds : [-1])
        : undefined,
    )
    .orderBy(alertsTable.createdAt);

  res.json(ListAlertsResponse.parse(alerts));
});

/** POST /alerts — create a new farm alert (admin / agronomist) */
router.post("/alerts", async (req, res): Promise<void> => {
  if (!canWrite(req)) {
    res.status(403).json({ error: "Insufficient permissions" });
    return;
  }

  const parsed = CreateAlertBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (!(await canAccessFarmer(req, parsed.data.farmerId))) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  const [alert] = await db
    .insert(alertsTable)
    .values(parsed.data)
    .returning();

  res.status(201).json(alert);
});

/** PATCH /alerts/:id/resolve — mark an alert as resolved (admin / agronomist) */
router.patch("/alerts/:id/resolve", async (req, res): Promise<void> => {
  if (!canWrite(req)) {
    res.status(403).json({ error: "Insufficient permissions" });
    return;
  }

  const params = ResolveAlertParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [existing] = await db
    .select({ farmerId: alertsTable.farmerId })
    .from(alertsTable)
    .where(eq(alertsTable.id, params.data.id));

  if (!existing) {
    res.status(404).json({ error: "Alert not found" });
    return;
  }

  if (!(await canAccessFarmer(req, existing.farmerId))) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  const [alert] = await db
    .update(alertsTable)
    .set({ status: "resolved" })
    .where(eq(alertsTable.id, params.data.id))
    .returning();

  res.json(ResolveAlertResponse.parse(alert));
});

export default router;
