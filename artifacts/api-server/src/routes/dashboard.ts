/**
 * Dashboard routes — aggregated analytics for the admin command center.
 * Provides platform-wide stats, per-farm health overview, activity feed,
 * and 24h sensor trend data for charting.
 */
import { Router, type IRouter } from "express";
import { eq, desc, gte, count, avg, and, inArray } from "drizzle-orm";
import {
  db,
  farmersTable,
  devicesTable,
  sensorReadingsTable,
  alertsTable,
  recommendationsTable,
} from "@workspace/db";
import {
  GetSensorTrendsParams,
  GetDashboardStatsResponse,
  GetFarmOverviewResponse,
  GetRecentActivityResponse,
  GetSensorTrendsResponse,
} from "@workspace/api-zod";
import { requireStaffType } from "../lib/rbac";
import { syncDeviceStatuses } from "../lib/device-status";

const router: IRouter = Router();

// All dashboard analytics are platform-wide and restricted to internal staff.
// Farmer logins use their own scoped endpoints (/farmers/:id, /farmers/:id/devices).
// NOTE: Scoped to /dashboard/* so the middleware does NOT bleed into aiRouter which is
// mounted after this router in index.ts without a path prefix.
router.use("/dashboard", requireStaffType);

/** GET /dashboard/stats — platform-wide statistics */
router.get("/dashboard/stats", async (_req, res): Promise<void> => {
  await syncDeviceStatuses(db);
  const now = new Date();
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  const [farmerCounts, deviceCounts, alertCounts, readingCount, pendingRecs, sensorAvgs] =
    await Promise.all([
      db.select({ total: count() }).from(farmersTable),
      db
        .select({ total: count(), status: devicesTable.status })
        .from(devicesTable)
        .groupBy(devicesTable.status),
      db
        .select({
          total: count(),
          severity: alertsTable.severity,
          status: alertsTable.status,
        })
        .from(alertsTable)
        .groupBy(alertsTable.severity, alertsTable.status),
      db
        .select({ total: count() })
        .from(sensorReadingsTable)
        .where(gte(sensorReadingsTable.recordedAt, todayStart)),
      db
        .select({ total: count() })
        .from(recommendationsTable)
        .where(eq(recommendationsTable.status, "pending")),
      db
        .select({
          avgSoilMoisture: avg(sensorReadingsTable.soilMoisture),
          avgTemperature: avg(sensorReadingsTable.temperature),
          avgHumidity: avg(sensorReadingsTable.humidity),
        })
        .from(sensorReadingsTable)
        .where(gte(sensorReadingsTable.recordedAt, todayStart)),
    ]);

  const totalFarmers = Number(farmerCounts[0]?.total ?? 0);
  const onlineDevices = Number(
    deviceCounts.find((d) => d.status === "online")?.total ?? 0,
  );
  const offlineDevices = Number(
    deviceCounts.find((d) => d.status === "offline")?.total ?? 0,
  );
  const totalDevices = deviceCounts.reduce(
    (s, d) => s + Number(d.total),
    0,
  );

  const activeAlerts = alertCounts
    .filter((a) => a.status === "active")
    .reduce((s, a) => s + Number(a.total), 0);
  const criticalAlerts = alertCounts
    .filter((a) => a.severity === "critical" && a.status === "active")
    .reduce((s, a) => s + Number(a.total), 0);

  const stats = {
    totalFarmers,
    activeFarmers: totalFarmers,
    totalDevices,
    onlineDevices,
    offlineDevices,
    activeAlerts,
    criticalAlerts,
    totalReadingsToday: Number(readingCount[0]?.total ?? 0),
    pendingRecommendations: Number(pendingRecs[0]?.total ?? 0),
    avgSoilMoisture: parseFloat(
      (sensorAvgs[0]?.avgSoilMoisture ?? "0").toString(),
    ),
    avgTemperature: parseFloat(
      (sensorAvgs[0]?.avgTemperature ?? "0").toString(),
    ),
    avgHumidity: parseFloat((sensorAvgs[0]?.avgHumidity ?? "0").toString()),
  };

  res.json(GetDashboardStatsResponse.parse(stats));
});

/** GET /dashboard/farm-overview — per-farm health status for admin map view */
router.get("/dashboard/farm-overview", async (_req, res): Promise<void> => {
  await syncDeviceStatuses(db);
  const farmers = await db.select().from(farmersTable);

  const overviews = await Promise.all(
    farmers.map(async (farmer) => {
      const farmerDevices = await db
        .select()
        .from(devicesTable)
        .where(eq(devicesTable.farmerId, farmer.id));

      const deviceIds = farmerDevices.map((d) => d.id);

      // Get active alert count for this farmer
      const activeAlertRows = await db
        .select({ total: count() })
        .from(alertsTable)
        .where(
          and(
            eq(alertsTable.farmerId, farmer.id),
            eq(alertsTable.status, "active"),
          ),
        );

      const alertCount = Number(activeAlertRows[0]?.total ?? 0);
      const onlineDevs = farmerDevices.filter(
        (d) => d.status === "online",
      ).length;

      // Get the latest reading from any of this farmer's devices
      let latestReading = null;
      if (deviceIds.length > 0) {
        const readings = await db
          .select()
          .from(sensorReadingsTable)
          .where(inArray(sensorReadingsTable.deviceId, deviceIds))
          .orderBy(desc(sensorReadingsTable.recordedAt))
          .limit(1);
        latestReading = readings[0] ?? null;
      }

      let status: "healthy" | "warning" | "critical" | "no_data" = "no_data";
      if (farmerDevices.length > 0) {
        if (alertCount > 2) status = "critical";
        else if (alertCount > 0) status = "warning";
        else if (onlineDevs > 0) status = "healthy";
        else status = "warning";
      }

      return {
        farmerId: farmer.id,
        farmerName: farmer.name,
        farmName: farmer.farmName ?? null,
        location: farmer.location,
        deviceCount: farmerDevices.length,
        onlineDevices: onlineDevs,
        alertCount,
        lastReadingAt: latestReading?.recordedAt?.toISOString() ?? null,
        status,
        latestSoilMoisture: latestReading?.soilMoisture ?? null,
        latestTemperature: latestReading?.temperature ?? null,
      };
    }),
  );

  res.json(GetFarmOverviewResponse.parse(overviews));
});

/** GET /dashboard/recent-activity — latest platform events for activity feed */
router.get(
  "/dashboard/recent-activity",
  async (_req, res): Promise<void> => {
    const [recentAlerts, recentReadings] = await Promise.all([
      db
        .select()
        .from(alertsTable)
        .orderBy(desc(alertsTable.createdAt))
        .limit(15),
      db
        .select()
        .from(sensorReadingsTable)
        .orderBy(desc(sensorReadingsTable.recordedAt))
        .limit(10),
    ]);

    const events = [
      ...recentAlerts.map((a) => ({
        id: `alert-${a.id}`,
        type: "alert" as const,
        message: `${a.severity.toUpperCase()} alert: ${a.message}`,
        timestamp: a.createdAt.toISOString(),
        farmerId: a.farmerId ?? null,
        deviceId: a.deviceId ?? null,
        severity: a.severity,
      })),
      ...recentReadings.map((r) => ({
        id: `reading-${r.id}`,
        type: "reading" as const,
        message: `Sensor data: ${r.soilMoisture.toFixed(1)}% moisture, ${r.temperature.toFixed(1)}°C, ${r.humidity.toFixed(1)}% humidity`,
        timestamp: r.recordedAt.toISOString(),
        farmerId: null,
        deviceId: r.deviceId,
        severity: null,
      })),
    ]
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .slice(0, 25);

    res.json(GetRecentActivityResponse.parse(events));
  },
);

/** GET /dashboard/sensor-trends/:deviceId — 24h sensor data for charts */
router.get(
  "/dashboard/sensor-trends/:deviceId",
  async (req, res): Promise<void> => {
    const params = GetSensorTrendsParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const readings = await db
      .select()
      .from(sensorReadingsTable)
      .where(
        and(
          eq(sensorReadingsTable.deviceId, params.data.deviceId),
          gte(sensorReadingsTable.recordedAt, since),
        ),
      )
      .orderBy(sensorReadingsTable.recordedAt)
      .limit(200);

    const trends = readings.map((r) => ({
      timestamp: r.recordedAt.toISOString(),
      soilMoisture: r.soilMoisture,
      temperature: r.temperature,
      humidity: r.humidity,
      heatIndex: r.heatIndex,
    }));

    res.json(GetSensorTrendsResponse.parse(trends));
  },
);

export default router;
