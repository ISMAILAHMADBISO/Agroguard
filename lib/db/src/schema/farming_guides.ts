import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const farmingGuidesTable = pgTable("farming_guides", {
  id: serial("id").primaryKey(),
  crop: text("crop").notNull().unique(),
  plantingGuide: text("planting_guide").notNull(),
  fertilizerGuide: text("fertilizer_guide").notNull(),
  irrigation: text("irrigation").notNull(),
  diseases: text("diseases").notNull(),
  pests: text("pests").notNull(),
  harvesting: text("harvesting").notNull(),
  storage: text("storage").notNull(),
  bestPractices: text("best_practices").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertFarmingGuideSchema = createInsertSchema(farmingGuidesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertFarmingGuide = z.infer<typeof insertFarmingGuideSchema>;
export type FarmingGuide = typeof farmingGuidesTable.$inferSelect;
