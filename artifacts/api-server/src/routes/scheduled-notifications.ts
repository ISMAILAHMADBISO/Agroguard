/**
 * Scheduled Notifications routes
 * GET    /notifications/tips     — list tips/reminders
 * POST   /notifications/tips     — create tip (admin/agronomist)
 * PUT    /notifications/tips/:id — update tip (admin/agronomist)
 * DELETE /notifications/tips/:id — delete tip (admin)
 */
import { Router } from "express";
import { db, scheduledNotificationsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

export const notificationsRouter = Router();

notificationsRouter.get("/notifications/tips", async (req, res): Promise<void> => {
  try {
    const tips = await db.select().from(scheduledNotificationsTable).orderBy(desc(scheduledNotificationsTable.createdAt));
    res.json(tips);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch tips" });
  }
});

notificationsRouter.post("/notifications/tips", async (req, res): Promise<void> => {
  const role = req.session.userRole;
  if (!role || !["admin", "super_admin", "agronomist"].includes(role)) {
    res.status(403).json({ error: "Insufficient permissions" }); return;
  }
  try {
    const { title, content, type, crop, region, season, scheduledDate } = req.body;
    if (!title || !content) { res.status(400).json({ error: "title and content are required" }); return; }
    const [tip] = await db.insert(scheduledNotificationsTable).values({
      title, content,
      type: type ?? "weekly_tip",
      crop: crop ?? null, region: region ?? null, season: season ?? null,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
      createdBy: req.session.userId!,
    }).returning();
    res.status(201).json(tip);
  } catch (error) {
    res.status(500).json({ error: "Failed to create tip" });
  }
});

notificationsRouter.put("/notifications/tips/:id", async (req, res): Promise<void> => {
  const role = req.session.userRole;
  if (!role || !["admin", "super_admin", "agronomist"].includes(role)) {
    res.status(403).json({ error: "Insufficient permissions" }); return;
  }
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  try {
    const { title, content, type, crop, region, season, scheduledDate, isSent } = req.body;
    const [updated] = await db.update(scheduledNotificationsTable).set({
      title, content, type, crop, region, season,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
      isSent: isSent ?? undefined,
    }).where(eq(scheduledNotificationsTable.id, id)).returning();
    if (!updated) { res.status(404).json({ error: "Tip not found" }); return; }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Failed to update tip" });
  }
});

notificationsRouter.delete("/notifications/tips/:id", async (req, res): Promise<void> => {
  const role = req.session.userRole;
  if (!role || !["admin", "super_admin"].includes(role)) {
    res.status(403).json({ error: "Insufficient permissions" }); return;
  }
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  try {
    await db.delete(scheduledNotificationsTable).where(eq(scheduledNotificationsTable.id, id));
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete tip" });
  }
});
