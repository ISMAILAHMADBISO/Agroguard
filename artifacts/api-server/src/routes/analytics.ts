import { Router } from "express";
import { z } from "zod/v4";
import { db } from "@workspace/db";
import { farmersTable, devicesTable, ordersTable } from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";

export const analyticsRouter = Router();

analyticsRouter.get("/executive", async (req, res) => {
  try {
    const user = req.user!;
    if (user.role !== "admin" && user.role !== "super_admin") {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    // Total Farmers
    const farmersResult = await db.select({ count: sql`count(*)`.mapWith(Number) }).from(farmersTable);
    const totalFarmers = farmersResult[0].count;

    // Active Devices
    const activeDevicesResult = await db.select({ count: sql`count(*)`.mapWith(Number) }).from(devicesTable).where(eq(devicesTable.status, "online"));
    const activeDevices = activeDevicesResult[0].count;

    // Critical Devices
    // E.g. offline for > 24 hours or maintenance
    const criticalDevicesResult = await db.select({ count: sql`count(*)`.mapWith(Number) }).from(devicesTable).where(eq(devicesTable.status, "offline"));
    const criticalDevices = criticalDevicesResult[0].count; // Mock logic, just showing offline devices

    // Hardware Sales
    const ordersResult = await db.select({ total: sql`sum(${ordersTable.pricePaid})`.mapWith(Number) }).from(ordersTable).where(eq(ordersTable.status, "completed"));
    const hardwareSales = ordersResult[0].total || 0;

    // Monthly Growth (mock)
    const monthlyGrowth = 12.5;

    res.json({
      totalFarmers,
      activeDevices,
      criticalDevices,
      hardwareSales,
      monthlyGrowth,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});
