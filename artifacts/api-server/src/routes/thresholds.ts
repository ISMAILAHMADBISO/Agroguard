import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, farmThresholdsTable, insertFarmThresholdsSchema } from "@workspace/db";
import { z } from "zod";

const router: IRouter = Router();

// GET thresholds for a specific farmer
router.get("/thresholds/:farmerId", async (req, res) => {
  const farmerId = Number(req.params.farmerId);
  if (Number.isNaN(farmerId)) {
    res.status(400).json({ error: "Invalid farmerId" });
    return;
  }
  const rows = await db.select().from(farmThresholdsTable).where(eq(farmThresholdsTable.farmerId, farmerId));
  if (rows.length === 0) {
    res.status(404).json({ error: "Thresholds not found" });
    return;
  }
  res.json(rows[0]);
});

// POST create thresholds for a farmer
router.post("/thresholds", async (req, res) => {
  const parsed = insertFarmThresholdsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db.insert(farmThresholdsTable).values(parsed.data).returning();
  res.status(201).json(row);
});

// PATCH update thresholds for a farmer
router.patch("/thresholds/:farmerId", async (req, res) => {
  const farmerId = Number(req.params.farmerId);
  if (Number.isNaN(farmerId)) {
    res.status(400).json({ error: "Invalid farmerId" });
    return;
  }
  const parsed = insertFarmThresholdsSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .update(farmThresholdsTable)
    .set(parsed.data)
    .where(eq(farmThresholdsTable.farmerId, farmerId))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Thresholds not found" });
    return;
  }
  res.json(row);
});

export default router;
