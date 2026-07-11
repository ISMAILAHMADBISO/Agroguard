import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { systemLogsTable } from "@workspace/db/schema";
import { desc } from "drizzle-orm";
import type { SystemLog } from "@workspace/api-zod";
export const systemRouter = Router();

// Only Super Admin can view system logs for security audits
systemRouter.get("/", async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user || user.role !== "super_admin") {
    return res.status(403).json({ error: "Only Super Admin can view system logs" });
  }
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


