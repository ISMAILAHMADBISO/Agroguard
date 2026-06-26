import { pgTable, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { farmersTable } from "./farmers"; // ensure farmers table is imported

/**
 * Farm-specific sensor thresholds.
 * Allows each farmer to customize low/high moisture (and could be extended for other metrics).
 */
export const farmThresholdsTable = pgTable("farm_thresholds", {
  id: serial("id").primaryKey(),
  farmerId: integer("farmer_id")
    .notNull()
    .references(() => farmersTable.id),
  moistureLow: integer("moisture_low").notNull().default(30),
  moistureHigh: integer("moisture_high").notNull().default(70),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertFarmThresholdsSchema = createInsertSchema(farmThresholdsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertFarmThreshold = z.infer<typeof insertFarmThresholdsSchema>;
export type FarmThreshold = typeof farmThresholdsTable.$inferSelect;
