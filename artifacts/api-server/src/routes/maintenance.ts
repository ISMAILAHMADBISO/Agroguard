import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, maintenanceLogsTable } from "@workspace/db";

const router: IRouter = Router();

/**
 * GET /maintenance
 * List maintenance logs.
 */
router.get("/maintenance", async (req, res): Promise<void> => {
  const user = (req as any).user;
  if (!user || user.type !== "staff") {
    res.status(403).json({ error: "Unauthorized" });
    return;
  }

  const logs = await db.select().from(maintenanceLogsTable).orderBy(desc(maintenanceLogsTable.createdAt));
  res.json(logs);
});

export default router;
