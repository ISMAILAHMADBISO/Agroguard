/**
 * Recommendations routes — AI-generated agricultural advisories.
 * The AI engine creates recommendations based on sensor data and climate models.
 * Farmers can mark recommendations as applied.
 */
import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, recommendationsTable } from "@workspace/db";
import {
  CreateRecommendationBody,
  ApplyRecommendationParams,
  ListRecommendationsResponse,
  ApplyRecommendationResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

/** GET /recommendations — list all AI recommendations */
router.get("/recommendations", async (_req, res): Promise<void> => {
  const recs = await db
    .select()
    .from(recommendationsTable)
    .orderBy(recommendationsTable.createdAt);
  res.json(ListRecommendationsResponse.parse(recs));
});

/** POST /recommendations — create an AI recommendation */
router.post("/recommendations", async (req, res): Promise<void> => {
  const parsed = CreateRecommendationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [rec] = await db
    .insert(recommendationsTable)
    .values({
      ...parsed.data,
      status: "pending",
      priority: parsed.data.priority ?? "medium",
    })
    .returning();

  res.status(201).json(rec);
});

/** PATCH /recommendations/:id/apply — mark recommendation as applied */
router.patch("/recommendations/:id/apply", async (req, res): Promise<void> => {
  const params = ApplyRecommendationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [rec] = await db
    .update(recommendationsTable)
    .set({ status: "applied", appliedAt: new Date() })
    .where(eq(recommendationsTable.id, params.data.id))
    .returning();

  if (!rec) {
    res.status(404).json({ error: "Recommendation not found" });
    return;
  }

  res.json(ApplyRecommendationResponse.parse(rec));
});

export default router;
