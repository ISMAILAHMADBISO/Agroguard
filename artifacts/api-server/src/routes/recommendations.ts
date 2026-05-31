/**
 * Recommendations routes — AI-generated agricultural advisories.
 * RBAC: field_officers see only recommendations for their assigned farmers.
 */
import { Router, type IRouter } from "express";
import { eq, inArray } from "drizzle-orm";
import { db, recommendationsTable } from "@workspace/db";
import {
  CreateRecommendationBody,
  ApplyRecommendationParams,
  ListRecommendationsResponse,
  ApplyRecommendationResponse,
} from "@workspace/api-zod";
import { getAssignedFarmerIds } from "../lib/rbac";

const router: IRouter = Router();

/** GET /recommendations — list (scoped by role) */
router.get("/recommendations", async (req, res): Promise<void> => {
  const assignedIds = await getAssignedFarmerIds(req);

  const recs = await db
    .select()
    .from(recommendationsTable)
    .where(
      assignedIds !== null
        ? inArray(recommendationsTable.farmerId, assignedIds.length ? assignedIds : [-1])
        : undefined,
    )
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
    .values(parsed.data)
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
    .set({ status: "applied" })
    .where(eq(recommendationsTable.id, params.data.id))
    .returning();

  if (!rec) {
    res.status(404).json({ error: "Recommendation not found" });
    return;
  }

  res.json(ApplyRecommendationResponse.parse(rec));
});

export default router;
