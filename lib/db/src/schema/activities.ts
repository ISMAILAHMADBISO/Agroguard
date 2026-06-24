/**
 * Activities table schema – logs platform events such as sensor readings, alerts, device assignments.
 */
import { pgTable, serial, text, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const activitiesTable = pgTable("activities", {
  id: serial("id").primaryKey(),
  /** "reading" | "alert" | "assignment" */
  type: text("type").notNull(),
  /** Human‑readable message */
  message: text("message").notNull(),
  /** ISO timestamp */
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
  /** Optional foreign keys */
  farmerId: integer("farmer_id"),
  deviceId: integer("device_id"),
  /** Optional extra data (e.g., severity for alerts) */
  metadata: jsonb("metadata"),
});

export const insertActivitySchema = createInsertSchema(activitiesTable).omit({
  id: true,
});
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activitiesTable.$inferSelect;
