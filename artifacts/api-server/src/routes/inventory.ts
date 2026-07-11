import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, inventoryTable } from "@workspace/db";
import { ScanInventoryBody } from "@workspace/api-zod";

const router: IRouter = Router();

/**
 * GET /inventory
 * List all hardware inventory (Admins only).
 */
router.get("/inventory", async (req, res): Promise<void> => {
  const user = (req as any).user;
  if (!user || user.type !== "staff" || (user.role !== "admin" && user.role !== "super_admin")) {
    res.status(403).json({ error: "Unauthorized" });
    return;
  }

  const inventory = await db.select().from(inventoryTable).orderBy(desc(inventoryTable.createdAt));
  res.json(inventory);
});

/**
 * POST /inventory/scan
 * Add a new serial number to inventory.
 */
router.post("/inventory/scan", async (req, res): Promise<void> => {
  const user = (req as any).user;
  if (!user || user.type !== "staff") {
    res.status(403).json({ error: "Unauthorized" });
    return;
  }

  const parsed = ScanInventoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const [item] = await db
      .insert(inventoryTable)
      .values({
        serialNumber: parsed.data.serialNumber,
        productType: parsed.data.productType,
        status: "available",
      })
      .returning();

    res.json(item);
  } catch (error: any) {
    if (error.code === '23505') { // Unique violation
      res.status(400).json({ error: "Serial number already exists in inventory." });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

export default router;
