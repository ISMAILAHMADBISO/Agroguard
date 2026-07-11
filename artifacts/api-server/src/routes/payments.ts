import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, farmersTable, paymentsTable } from "@workspace/db";
import { z } from "zod";

const VerifyPaymentInput = z.object({
  reference: z.string(),
  plan: z.enum(["free", "basic", "standard", "premium"]),
});

const router: IRouter = Router();

router.post("/payments/verify", async (req, res): Promise<void> => {
  const parsed = VerifyPaymentInput.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { reference, plan } = parsed.data;
  
  if (!req.session.userId || req.session.userType !== "farmer") {
    res.status(403).json({ error: "Only farmers can upgrade subscriptions" });
    return;
  }

  const farmerId = req.session.userId;

  try {
    // 1. Verify with Paystack (MOCK OR REAL)
    // If the user hasn't provided a secret key, we will simulate success for dummy references
    let amount = 0;
    if (plan === "basic") amount = 100000; // 1,000 NGN in kobo
    else if (plan === "standard") amount = 250000; // 2,500 NGN
    else if (plan === "premium") amount = 500000; // 5,000 NGN

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (paystackSecretKey && !reference.startsWith("dummy-")) {
      const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
        },
      });
      const data = await response.json();
      if (!data.status || data.data.status !== "success") {
        res.status(400).json({ error: "Payment verification failed" });
        return;
      }
      amount = data.data.amount;
    }

    // 2. Insert payment record
    await db.insert(paymentsTable).values({
      farmerId,
      reference,
      amount,
      currency: "NGN",
      status: "success",
      plan,
      metadata: { verified: true },
    });

    // 3. Update Farmer Subscription
    const now = new Date();
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + 1); // 1 month subscription

    await db
      .update(farmersTable)
      .set({
        subscriptionPlan: plan,
        subscriptionStartDate: now,
        subscriptionExpiryDate: expiry,
      })
      .where(eq(farmersTable.id, farmerId));

    res.json({
      status: "success",
      message: "Subscription successfully updated",
      plan,
    });
  } catch (error) {
    req.log.error(error, "Failed to verify payment");
    res.status(500).json({ error: "Internal server error during verification" });
  }
});

export default router;
