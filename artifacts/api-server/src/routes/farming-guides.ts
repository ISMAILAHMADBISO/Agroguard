/**
 * Farming Guides routes
 * GET    /farming-guides              — list all guides (any authenticated user)
 * GET    /farming-guides/:crop        — get a specific guide by crop name
 * POST   /farming-guides              — create/update a guide (admin only)
 * PUT    /farming-guides/:id          — update a guide (admin only)
 * DELETE /farming-guides/:id          — delete a guide (admin only)
 */
import { Router } from "express";
import { db, farmingGuidesTable } from "@workspace/db";
import { eq, ilike } from "drizzle-orm";

export const farmingGuidesRouter = Router();

farmingGuidesRouter.get("/farming-guides", async (req, res): Promise<void> => {
  try {
    const { search } = req.query as { search?: string };
    let guides;
    if (search) {
      guides = await db.select().from(farmingGuidesTable).where(ilike(farmingGuidesTable.crop, `%${search}%`));
    } else {
      guides = await db.select().from(farmingGuidesTable).orderBy(farmingGuidesTable.crop);
    }
    res.json(guides);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch farming guides" });
  }
});

farmingGuidesRouter.get("/farming-guides/:crop", async (req, res): Promise<void> => {
  try {
    const [guide] = await db.select().from(farmingGuidesTable).where(ilike(farmingGuidesTable.crop, req.params.crop));
    if (!guide) { res.status(404).json({ error: "Guide not found" }); return; }
    res.json(guide);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch farming guide" });
  }
});

farmingGuidesRouter.post("/farming-guides", async (req, res): Promise<void> => {
  const user = (req as any).user || req.session;
  const role = user?.userRole ?? user?.role;
  if (!role || !["admin", "super_admin", "agronomist"].includes(role)) {
    res.status(403).json({ error: "Insufficient permissions" }); return;
  }
  try {
    const { crop, plantingGuide, fertilizerGuide, irrigation, diseases, pests, harvesting, storage, bestPractices } = req.body;
    if (!crop || !plantingGuide) { res.status(400).json({ error: "crop and plantingGuide are required" }); return; }
    const [existing] = await db.select({ id: farmingGuidesTable.id }).from(farmingGuidesTable).where(ilike(farmingGuidesTable.crop, crop));
    if (existing) {
      const [updated] = await db.update(farmingGuidesTable).set({ plantingGuide, fertilizerGuide, irrigation, diseases, pests, harvesting, storage, bestPractices }).where(eq(farmingGuidesTable.id, existing.id)).returning();
      res.json(updated); return;
    }
    const [guide] = await db.insert(farmingGuidesTable).values({ crop, plantingGuide, fertilizerGuide: fertilizerGuide ?? "", irrigation: irrigation ?? "", diseases: diseases ?? "", pests: pests ?? "", harvesting: harvesting ?? "", storage: storage ?? "", bestPractices: bestPractices ?? "" }).returning();
    res.status(201).json(guide);
  } catch (error) {
    res.status(500).json({ error: "Failed to save farming guide" });
  }
});

farmingGuidesRouter.put("/farming-guides/:id", async (req, res): Promise<void> => {
  const user = (req as any).user || req.session;
  const role = user?.userRole ?? user?.role;
  if (!role || !["admin", "super_admin", "agronomist"].includes(role)) {
    res.status(403).json({ error: "Insufficient permissions" }); return;
  }
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  try {
    const { plantingGuide, fertilizerGuide, irrigation, diseases, pests, harvesting, storage, bestPractices } = req.body;
    const [updated] = await db.update(farmingGuidesTable).set({ plantingGuide, fertilizerGuide, irrigation, diseases, pests, harvesting, storage, bestPractices }).where(eq(farmingGuidesTable.id, id)).returning();
    if (!updated) { res.status(404).json({ error: "Guide not found" }); return; }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Failed to update farming guide" });
  }
});

farmingGuidesRouter.delete("/farming-guides/:id", async (req, res): Promise<void> => {
  const user = (req as any).user || req.session;
  const role = user?.userRole ?? user?.role;
  if (!role || !["admin", "super_admin"].includes(role)) {
    res.status(403).json({ error: "Insufficient permissions" }); return;
  }
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  try {
    await db.delete(farmingGuidesTable).where(eq(farmingGuidesTable.id, id));
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete farming guide" });
  }
});
