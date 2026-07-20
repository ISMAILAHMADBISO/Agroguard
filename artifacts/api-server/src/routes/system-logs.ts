import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { systemLogsTable } from "@workspace/db/schema";
import { desc, ilike, and, gte, lte } from "drizzle-orm";

export const systemRouter = Router();

/** GET /system-logs — Admin: read audit log. */
systemRouter.get("/", async (req: Request, res: Response) => {
  const user = (req as any).user || (req as any).session;
  const role = user?.userRole ?? user?.role;
  if (!role || !['admin', 'super_admin'].includes(role)) {
    return res.status(403).json({ error: "Admins only" });
  }
  try {
    const { search, from, to, limit } = req.query as { search?: string; from?: string; to?: string; limit?: string };
    const conditions: any[] = [];
    if (search) conditions.push(ilike(systemLogsTable.description, `%${search}%`));
    if (from) conditions.push(gte(systemLogsTable.createdAt, new Date(from)));
    if (to) conditions.push(lte(systemLogsTable.createdAt, new Date(to)));

    const logs = await db
      .select()
      .from(systemLogsTable)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(systemLogsTable.createdAt))
      .limit(parseInt(limit ?? '200', 10));

    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch audit logs" });
  }
});

/** POST /system-logs — internal: write an audit log entry. */
systemRouter.post("/", async (req: Request, res: Response) => {
  try {
    const { level, action, description, actorId, targetResource, ipAddress, device } = req.body;
    const [log] = await db.insert(systemLogsTable).values({
      level: level ?? 'info',
      action,
      description,
      actorId: actorId ?? null,
      targetResource: targetResource ?? null,
      ipAddress: ipAddress ?? null,
      device: device ?? null,
    }).returning();
    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ error: "Failed to write audit log" });
  }
});

/** Helper for internal server-side audit logging. */
export async function writeAuditLog(params: {
  action: string;
  description: string;
  actorId?: number;
  targetResource?: string;
  ipAddress?: string;
  device?: string;
  level?: string;
}) {
  try {
    await db.insert(systemLogsTable).values({
      level: params.level ?? 'info',
      action: params.action,
      description: params.description,
      actorId: params.actorId ?? null,
      targetResource: params.targetResource ?? null,
      ipAddress: params.ipAddress ?? null,
      device: params.device ?? null,
    });
  } catch {
    // Swallow errors — audit log failure should never break a main request
  }
}
