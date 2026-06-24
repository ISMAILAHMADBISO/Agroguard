import { and, eq, lt, or, isNull } from "drizzle-orm";
import { devicesTable } from "@workspace/db";

/**
 * Dynamically updates currently "online" devices to "offline" in the database
 * if their lastSeenAt timestamp is older than 3 minutes (180,000ms) or is null.
 * This ensures that when a device stops posting, its status updates to offline
 * without relying on a persistent cron job.
 */
export async function syncDeviceStatuses(db: any) {
  const timeoutMs = parseInt(process.env.DEVICE_OFFLINE_TIMEOUT_MS ?? "180000", 10);
  const cutoff = new Date(Date.now() - timeoutMs);
  await db
    .update(devicesTable)
    .set({ status: "offline" })
    .where(
        and(
          eq(devicesTable.status, "online"),
          or(
            lt(devicesTable.lastSeenAt, cutoff),
            isNull(devicesTable.lastSeenAt)
          )
        )
    );
}
