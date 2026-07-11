import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, ordersTable } from "@workspace/db";
import { CheckoutOrderBody, type Order } from "@workspace/api-zod";

const router: IRouter = Router();

/**
 * GET /orders
 * List orders. Admins see all, farmers see their own.
 */
router.get("/orders", async (req, res): Promise<void> => {
  const user = (req as any).user;
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  let orders = [];
  if (user.type === "farmer") {
    orders = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.farmerId, user.id))
      .orderBy(desc(ordersTable.createdAt));
  } else {
    // Admin / Staff see all
    orders = await db
      .select()
      .from(ordersTable)
      .orderBy(desc(ordersTable.createdAt));
  }

  res.json(orders);
});

/**
 * POST /orders/checkout
 * Create a new hardware order after Paystack payment (simulated for now, just saves).
 */
router.post("/orders/checkout", async (req, res): Promise<void> => {
  const user = (req as any).user;
  if (!user || user.type !== "farmer") {
    res.status(403).json({ error: "Only farmers can place orders." });
    return;
  }

  const parsed = CheckoutOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const price = parsed.data.productType === "premium" ? 200000 : 160000;

  const [order] = await db
    .insert(ordersTable)
    .values({
      farmerId: user.id,
      productType: parsed.data.productType as "standard" | "premium",
      price,
      farmName: parsed.data.farmName || null,
      farmAddress: parsed.data.farmAddress,
      state: parsed.data.state,
      lga: parsed.data.lga,
      farmSizeHectares: parsed.data.farmSizeHectares || null,
      cropTypes: parsed.data.cropTypes || null,
      contactPhone: parsed.data.contactPhone,
      paystackReference: parsed.data.paystackReference,
      status: "pending_review",
    })
    .returning();

  res.status(201).json({
      status: "success",
      message: "Order placed successfully.",
      orderId: order.id,
    });
});

export default router;
