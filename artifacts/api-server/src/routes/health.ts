import { Router, type IRouter } from "express";
import { db, devicesTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/healthz", async (_req, res) => {
  try {
    const devices = await db.select().from(devicesTable);
    const dbUrl = process.env.DATABASE_URL || "";
    const maskedDbUrl = dbUrl.replace(/:([^:@]+)@/, ":***@");
    res.json({
      status: "ok",
      databaseUrl: maskedDbUrl,
      devices
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
