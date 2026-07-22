import { Router } from "express";
import { db, farmersTable, devicesTable, ordersTable, diseaseReportsTable, diseaseForecastsTable } from "@workspace/db";
import { eq, sql, avg, count, gte, and, isNotNull } from "drizzle-orm";

export const analyticsRouter = Router();

analyticsRouter.get("/executive", async (req, res) => {
  try {
    const user = (req as any).user;
    if (user && user.role !== "admin" && user.role !== "super_admin") {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    const farmersResult = await db.select({ count: sql`count(*)`.mapWith(Number) }).from(farmersTable);
    const activeDevicesResult = await db.select({ count: sql`count(*)`.mapWith(Number) }).from(devicesTable).where(eq(devicesTable.status, "online"));
    const criticalDevicesResult = await db.select({ count: sql`count(*)`.mapWith(Number) }).from(devicesTable).where(eq(devicesTable.status, "offline"));
    const ordersResult = await db.select({ total: sql`sum(${ordersTable.pricePaid})`.mapWith(Number) }).from(ordersTable).where(eq(ordersTable.status, "completed"));

    res.json({
      totalFarmers: farmersResult[0].count,
      activeDevices: activeDevicesResult[0].count,
      criticalDevices: criticalDevicesResult[0].count,
      hardwareSales: ordersResult[0].total || 0,
      monthlyGrowth: 12.5,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

/** GET /analytics/disease-distribution — disease occurrence pie chart data. */
analyticsRouter.get("/disease-distribution", async (req, res) => {
  try {
    const rows = await db
      .select({
        diagnosis: diseaseReportsTable.diagnosis,
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(diseaseReportsTable)
      .groupBy(diseaseReportsTable.diagnosis)
      .orderBy(sql`count(*) desc`);

    const total = rows.reduce((s, r) => s + r.count, 0);
    const data = rows.slice(0, 8).map((r) => ({
      disease: r.diagnosis,
      count: r.count,
      percentage: total > 0 ? Math.round((r.count / total) * 100) : 0,
    }));

    res.json({ data, total });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch disease distribution" });
  }
});

/** GET /analytics/disease-trends — monthly counts for the last 12 months. */
analyticsRouter.get("/disease-trends", async (req, res) => {
  try {
    const rows = await db
      .select({
        month: sql<string>`to_char(date_trunc('month', ${diseaseReportsTable.createdAt}), 'Mon YYYY')`,
        year_month: sql<string>`to_char(date_trunc('month', ${diseaseReportsTable.createdAt}), 'YYYY-MM')`,
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(diseaseReportsTable)
      .where(
        gte(
          diseaseReportsTable.createdAt,
          new Date(new Date().setFullYear(new Date().getFullYear() - 1))
        )
      )
      .groupBy(sql`date_trunc('month', ${diseaseReportsTable.createdAt})`)
      .orderBy(sql`date_trunc('month', ${diseaseReportsTable.createdAt})`);

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch disease trends" });
  }
});

/** GET /analytics/treatment-success — treatment feedback success rates. */
analyticsRouter.get("/treatment-success", async (req, res) => {
  try {
    const allWithFeedback = await db
      .select({
        treatmentFeedback: diseaseReportsTable.treatmentFeedback,
        cropType: diseaseReportsTable.cropType,
        diagnosis: diseaseReportsTable.diagnosis,
      })
      .from(diseaseReportsTable)
      .where(isNotNull(diseaseReportsTable.treatmentFeedback));

    const total = allWithFeedback.length;
    const successful = allWithFeedback.filter((r) => r.treatmentFeedback === true).length;
    const successRate = total > 0 ? Math.round((successful / total) * 100) : 0;

    // By crop
    const byCrop: Record<string, { total: number; successful: number }> = {};
    for (const r of allWithFeedback) {
      const crop = r.cropType ?? "Unknown";
      if (!byCrop[crop]) byCrop[crop] = { total: 0, successful: 0 };
      byCrop[crop].total++;
      if (r.treatmentFeedback) byCrop[crop].successful++;
    }
    const byCropData = Object.entries(byCrop).map(([crop, v]) => ({
      crop,
      total: v.total,
      successful: v.successful,
      rate: Math.round((v.successful / v.total) * 100),
    }));

    // By disease
    const byDisease: Record<string, { total: number; successful: number }> = {};
    for (const r of allWithFeedback) {
      const disease = r.diagnosis ?? "Unknown";
      if (!byDisease[disease]) byDisease[disease] = { total: 0, successful: 0 };
      byDisease[disease].total++;
      if (r.treatmentFeedback) byDisease[disease].successful++;
    }
    const byDiseaseData = Object.entries(byDisease).map(([disease, v]) => ({
      disease,
      total: v.total,
      successful: v.successful,
      rate: Math.round((v.successful / v.total) * 100),
    }));

    res.json({ total, successful, successRate, byCrop: byCropData, byDisease: byDiseaseData });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch treatment success stats" });
  }
});

/** GET /analytics/ai-feedback — aggregate AI accuracy rating stats. */
analyticsRouter.get("/ai-feedback", async (req, res) => {
  try {
    const all = await db
      .select({
        aiAccuracyRating: diseaseReportsTable.aiAccuracyRating,
        diagnosis: diseaseReportsTable.diagnosis,
        cropType: diseaseReportsTable.cropType,
        treatmentFeedback: diseaseReportsTable.treatmentFeedback,
      })
      .from(diseaseReportsTable);

    const rated = all.filter((r) => r.aiAccuracyRating != null);
    const avgRating =
      rated.length > 0
        ? Math.round((rated.reduce((s, r) => s + (r.aiAccuracyRating ?? 0), 0) / rated.length) * 10) / 10
        : 0;
    const positive = all.filter((r) => r.treatmentFeedback === true).length;
    const negative = all.filter((r) => r.treatmentFeedback === false).length;
    const accuracyPct = rated.length > 0
      ? Math.round((rated.filter((r) => (r.aiAccuracyRating ?? 0) >= 4).length / rated.length) * 100)
      : 0;

    // Top rated by disease
    const ratingByDisease: Record<string, { sum: number; count: number }> = {};
    for (const r of rated) {
      const d = r.diagnosis ?? "Unknown";
      if (!ratingByDisease[d]) ratingByDisease[d] = { sum: 0, count: 0 };
      ratingByDisease[d].sum += r.aiAccuracyRating!;
      ratingByDisease[d].count++;
    }
    const diseaseRatings = Object.entries(ratingByDisease)
      .map(([disease, v]) => ({ disease, avg: Math.round((v.sum / v.count) * 10) / 10, count: v.count }))
      .sort((a, b) => b.avg - a.avg);

    res.json({
      averageRating: avgRating,
      totalRatings: rated.length,
      accuracyPercentage: accuracyPct,
      positiveFeedback: positive,
      negativeFeedback: negative,
      topRatedDiseases: diseaseRatings.slice(0, 5),
      lowestRatedDiseases: [...diseaseRatings].reverse().slice(0, 5),
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch AI feedback stats" });
  }
});

analyticsRouter.get("/disease-forecast", async (req, res) => {
  try {
    const all = await db.select().from(diseaseForecastsTable);

    const totalForecasts = all.length;
    const highRiskForecasts = all.filter(f => f.riskLevel === "High" || f.riskLevel === "Critical").length;

    // Accuracy Calculation
    const tracked = all.filter(f => f.occurred !== null);
    let accuracyPct = 0;
    if (tracked.length > 0) {
      const correct = tracked.filter(f => 
        (f.riskLevel === "High" || f.riskLevel === "Critical") && f.occurred === "Yes" ||
        (f.riskLevel === "Low") && f.occurred === "No" ||
        f.occurred === "Partially"
      ).length;
      accuracyPct = Math.round((correct / tracked.length) * 100);
    }

    // Most predicted diseases
    const diseaseCounts: Record<string, number> = {};
    for (const f of all) {
      if (!diseaseCounts[f.predictedDisease]) diseaseCounts[f.predictedDisease] = 0;
      diseaseCounts[f.predictedDisease]++;
    }
    const topDiseases = Object.entries(diseaseCounts)
      .map(([disease, count]) => ({ disease, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Regional Risk Map Data (Mocking location since we don't have lat/long on forecast yet)
    // In a real app, this would join with farm table to get location.
    
    res.json({
      totalForecasts,
      highRiskForecasts,
      accuracyPercentage: accuracyPct,
      trackedOutcomes: tracked.length,
      topPredictedDiseases: topDiseases,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch disease forecast stats" });
  }
});
