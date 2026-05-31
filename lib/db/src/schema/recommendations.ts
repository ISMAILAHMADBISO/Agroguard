/**
 * AI Recommendations table schema
 * Stores AI-generated agricultural advisories for farmers.
 * Categories: irrigation, crop, pest, disease, climate, fertilizer.
 */
import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const recommendationsTable = pgTable("recommendations", {
  id: serial("id").primaryKey(),
  /** FK to farmers.id */
  farmerId: integer("farmer_id").notNull(),
  /** FK to devices.id — optional, for device-triggered recommendations */
  deviceId: integer("device_id"),
  /**
   * Category of recommendation:
   * irrigation | crop | pest | disease | climate | fertilizer
   */
  category: text("category").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  /** low | medium | high */
  priority: text("priority").notNull().default("medium"),
  /** pending | applied | dismissed */
  status: text("status").notNull().default("pending"),
  appliedAt: timestamp("applied_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRecommendationSchema = createInsertSchema(recommendationsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertRecommendation = z.infer<typeof insertRecommendationSchema>;
export type Recommendation = typeof recommendationsTable.$inferSelect;
