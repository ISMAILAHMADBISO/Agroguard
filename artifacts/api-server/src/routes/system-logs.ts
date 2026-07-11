import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { systemLogsTable } from "@workspace/db/schema";
import { desc } from "drizzle-orm";
import type { SystemLog } from "@workspace/api-zod";
import { requireRole } from "../middleware/auth";

const router = Router();

// Only Super Admin can view system logs for security audits
router.get("/system-logs", requireRole("super_admin"), async (req: Request, res: Response) => {
  try {
    const logs = await db
      .select()
      .from(systemLogsTable)
      .orderBy(desc(systemLogsTable.createdAt))
      .limit(100);

    res.json(logs as unknown as SystemLog[]);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch system logs" });
  }
});

export default router;
