import { Router, type IRouter } from "express";
import { db, achievementsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { z } from "zod/v4";

const router: IRouter = Router();

const AchievementBody = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  excerpt: z.string().min(1),
  content: z.string().min(1),
  category: z.string().min(1),
  date: z.string().min(1),
  imageUrl: z.string().min(1),
});

// Get all achievements
router.get("/achievements", async (req, res) => {
  try {
    const achievements = await db
      .select()
      .from(achievementsTable)
      .orderBy(desc(achievementsTable.createdAt));
    res.json(achievements);
  } catch (err) {
    req.log.error({ err }, "failed to fetch achievements");
    res.status(500).json({ error: "Failed to fetch achievements" });
  }
});

// Get single achievement by slug
router.get("/achievements/:slug", async (req, res) => {
  try {
    const [achievement] = await db
      .select()
      .from(achievementsTable)
      .where(eq(achievementsTable.slug, req.params.slug));
      
    if (!achievement) {
      return res.status(404).json({ error: "Achievement not found" });
    }
    res.json(achievement);
  } catch (err) {
    req.log.error({ err }, "failed to fetch achievement");
    res.status(500).json({ error: "Failed to fetch achievement" });
  }
});

// Create achievement (admin only ideally, assuming protected by global middleware or we should check role)
router.post("/achievements", async (req, res) => {
  if (req.session.userType !== "staff") {
    return res.status(403).json({ error: "Access denied" });
  }
  
  const parsed = AchievementBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.message });
  }

  try {
    const [created] = await db
      .insert(achievementsTable)
      .values(parsed.data)
      .returning();
    res.status(201).json(created);
  } catch (err) {
    req.log.error({ err }, "failed to create achievement");
    res.status(500).json({ error: "Failed to create achievement" });
  }
});

// Update achievement
router.put("/achievements/:id", async (req, res) => {
  if (req.session.userType !== "staff") {
    return res.status(403).json({ error: "Access denied" });
  }

  const parsed = AchievementBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.message });
  }

  try {
    const [updated] = await db
      .update(achievementsTable)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(achievementsTable.id, parseInt(req.params.id, 10)))
      .returning();
      
    if (!updated) {
      return res.status(404).json({ error: "Achievement not found" });
    }
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "failed to update achievement");
    res.status(500).json({ error: "Failed to update achievement" });
  }
});

// Delete achievement
router.delete("/achievements/:id", async (req, res) => {
  if (req.session.userType !== "staff") {
    return res.status(403).json({ error: "Access denied" });
  }

  try {
    const [deleted] = await db
      .delete(achievementsTable)
      .where(eq(achievementsTable.id, parseInt(req.params.id, 10)))
      .returning();
      
    if (!deleted) {
      return res.status(404).json({ error: "Achievement not found" });
    }
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    req.log.error({ err }, "failed to delete achievement");
    res.status(500).json({ error: "Failed to delete achievement" });
  }
});

export default router;
