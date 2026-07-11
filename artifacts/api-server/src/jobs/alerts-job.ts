import { db } from "@workspace/db";
import { devicesTable, alertsTable } from "@workspace/db/schema";
import { lt, eq, and, sql } from "drizzle-orm";
import { logger } from "../lib/logger";

/**
 * Intelligent Alerts Background Job
 * Periodically scans the database for offline devices, low batteries,
 * or critical environmental conditions, and creates alerts automatically.
 */
export async function runIntelligentAlertsJob() {
  logger.info("Running Intelligent Alerts Background Job...");
  try {
    // 1. Check for devices with low battery (< 20%)
    const lowBatteryDevices = await db
      .select()
      .from(devicesTable)
      .where(and(lt(devicesTable.batteryLevel, 20), eq(devicesTable.status, "online")));

    for (const device of lowBatteryDevices) {
      // Check if an unread alert already exists for this device battery
      const existing = await db
        .select()
        .from(alertsTable)
        .where(
          and(
            eq(alertsTable.deviceId, device.id),
            eq(alertsTable.type, "system"),
            eq(alertsTable.status, "unread")
          )
        );

      if (existing.length === 0) {
        await db.insert(alertsTable).values({
          farmerId: device.farmerId ?? 1, // Fallback if unassigned but shouldn't alert if unassigned usually
          deviceId: device.id,
          type: "system",
          message: `Device ${device.name} battery is critically low (${device.batteryLevel}%). Please charge or check solar panel.`,
          status: "unread",
        });
        logger.info(`Generated low battery alert for device ${device.id}`);
      }
    }

    // 2. Check for devices that haven't reported in over 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const offlineDevices = await db
      .select()
      .from(devicesTable)
      .where(
        and(
          lt(devicesTable.lastSeenAt, yesterday),
          eq(devicesTable.status, "online")
        )
      );

    for (const device of offlineDevices) {
      // Update status to offline
      await db.update(devicesTable).set({ status: "offline" }).where(eq(devicesTable.id, device.id));
      
      await db.insert(alertsTable).values({
        farmerId: device.farmerId ?? 1,
        deviceId: device.id,
        type: "system",
        message: `Device ${device.name} has gone offline. Last seen ${device.lastSeenAt?.toLocaleString()}.`,
        status: "unread",
      });
      logger.info(`Marked device ${device.id} as offline and generated alert.`);
    }

  } catch (error) {
    logger.error("Error running Intelligent Alerts Job:", error);
  }
}

// In production, you would use a robust scheduler like Agenda or node-cron.
// For this prototype, we'll just run it every 10 minutes using setInterval.
export function startAlertsScheduler() {
  const TEN_MINUTES = 10 * 60 * 1000;
  setInterval(runIntelligentAlertsJob, TEN_MINUTES);
  // Run once on startup after a brief delay
  setTimeout(runIntelligentAlertsJob, 5000);
}
