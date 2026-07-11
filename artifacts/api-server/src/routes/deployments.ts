import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, deploymentsTable, ordersTable, staffTable, devicesTable } from "@workspace/db";
import { UpdateDeploymentStatusBody, ActivateDeviceBody } from "@workspace/api-zod";

const router: IRouter = Router();

/**
 * GET /deployments
 * List all deployments. Admins see all, field officers see their own.
 */
router.get("/deployments", async (req, res): Promise<void> => {
  const user = (req as any).user;
  if (!user || user.type !== "staff") {
    res.status(403).json({ error: "Unauthorized" });
    return;
  }

  const query = db.select().from(deploymentsTable).orderBy(desc(deploymentsTable.createdAt));
  
  // Scoped to the field officer if they aren't admin
  if (user.role !== "admin" && user.role !== "super_admin") {
    query.where(eq(deploymentsTable.fieldOfficerId, user.id));
  }
  
  const deployments = await query;
  res.json(deployments);
});

/**
 * PATCH /deployments/:id/assign
 * Assign a field officer to a deployment (Admin only).
 */
router.patch("/deployments/:id/assign", async (req, res): Promise<void> => {
  const user = (req as any).user;
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    res.status(403).json({ error: "Unauthorized" });
    return;
  }

  const fieldOfficerId = req.body.fieldOfficerId;
  if (!fieldOfficerId) {
    res.status(400).json({ error: "fieldOfficerId is required" });
    return;
  }

  const [deployment] = await db
    .update(deploymentsTable)
    .set({
      fieldOfficerId,
      status: "scheduled",
      updatedAt: new Date(),
    })
    .where(eq(deploymentsTable.id, parseInt(req.params.id, 10)))
    .returning();

  res.json(deployment);
});

/**
 * POST /deployments/:id/status
 * Update deployment checklist and status (for field officers).
 */
router.post("/deployments/:id/status", async (req, res): Promise<void> => {
  const user = (req as any).user;
  if (!user || user.type !== "staff") {
    res.status(403).json({ error: "Unauthorized" });
    return;
  }

  const parsed = UpdateDeploymentStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { status, powerTested, networkTested, sensorsTested, installationNotes, installedLat, installedLng } = parsed.data;

  const [deployment] = await db
    .update(deploymentsTable)
    .set({
      status: status as any,
      powerTested,
      networkTested,
      sensorsTested,
      installationNotes,
      installedLat,
      installedLng,
      updatedAt: new Date(),
    })
    .where(eq(deploymentsTable.id, parseInt(req.params.id, 10)))
    .returning();

  // If completed, update order status to installed
  if (status === "completed" && deployment) {
    await db
      .update(ordersTable)
      .set({ status: "installed", updatedAt: new Date() })
      .where(eq(ordersTable.id, deployment.orderId));
  }

  res.json(deployment);
});

/**
 * POST /devices/activate
 * Link a physical hardware serial number to a deployment/farmer.
 */
router.post("/devices/activate", async (req, res): Promise<void> => {
  const user = (req as any).user;
  if (!user || user.type !== "staff") {
    res.status(403).json({ error: "Unauthorized" });
    return;
  }

  const parsed = ActivateDeviceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Verify deployment
  const [deployment] = await db
    .select()
    .from(deploymentsTable)
    .where(eq(deploymentsTable.id, parsed.data.deploymentId));

  if (!deployment) {
    res.status(404).json({ error: "Deployment not found" });
    return;
  }

  const [order] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, deployment.orderId));

  if (!order || !order.farmerId) {
    res.status(404).json({ error: "Order or Farmer not found" });
    return;
  }

  // Create device
  const [device] = await db
    .insert(devicesTable)
    .values({
      deviceId: parsed.data.serialNumber,
      farmerId: order.farmerId,
      name: `AgroGuard ${order.productType} Sensor`,
      status: "active",
      location: order.farmAddress,
      firmwareVersion: "1.0.0",
      batteryLevel: 100,
    })
    .returning();

  // Link device to deployment and order
  await db.update(deploymentsTable).set({ deviceId: device.id }).where(eq(deploymentsTable.id, deployment.id));
  await db.update(ordersTable).set({ status: "activated" }).where(eq(ordersTable.id, order.id));

  res.json(device);
});

export default router;
