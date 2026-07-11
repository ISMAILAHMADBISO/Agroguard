import { Router } from "express";
import { z } from "zod/v4";
import { db } from "@workspace/db";
import { knowledgeArticlesTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import {
  CreateKnowledgeBody,
} from "@workspace/api-zod";

export const knowledgeRouter = Router();

knowledgeRouter.get("/", async (req, res) => {
  try {
    const articles = await db
      .select()
      .from(knowledgeArticlesTable)
      .orderBy(desc(knowledgeArticlesTable.createdAt));
      
    res.json(articles);
  } catch (error) {
    console.error("Failed to fetch knowledge articles:", error);
    res.status(500).json({ error: "Failed to fetch knowledge articles" });
  }
});

knowledgeRouter.post("/", async (req, res) => {
  try {
    const user = req.user!;
    if (user.role === "farmer" || user.role === "field_officer") {
      return res.status(403).json({ error: "Only admins and agronomists can create articles" });
    }

    const payload = CreateKnowledgeBody.parse(req.body);

    const [article] = await db
      .insert(knowledgeArticlesTable)
      .values({
        title: payload.title,
        category: payload.category,
        content: payload.content,
        videoUrl: payload.videoUrl || null,
        authorId: user.id,
      })
      .returning();

    res.status(201).json(article);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
    }
    console.error("Failed to create knowledge article:", error);
    res.status(500).json({ error: "Failed to create knowledge article" });
  }
});

knowledgeRouter.delete("/:id", async (req, res) => {
  try {
    const user = req.user!;
    if (user.role === "farmer" || user.role === "field_officer") {
      return res.status(403).json({ error: "Only admins and agronomists can delete articles" });
    }

    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID" });
    }

    await db.delete(knowledgeArticlesTable).where(eq(knowledgeArticlesTable.id, id));

    res.json({ success: true });
  } catch (error) {
    console.error("Failed to delete knowledge article:", error);
    res.status(500).json({ error: "Failed to delete knowledge article" });
  }
});
